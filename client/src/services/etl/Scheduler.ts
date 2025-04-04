/**
 * ETL Job Scheduler Service
 * 
 * This service manages scheduling of ETL jobs using cron expressions.
 * It periodically checks for jobs that need to be run based on their schedules.
 */

import { etlPipeline as ETLPipeline } from './ETLPipeline';

/**
 * Helper to parse cron expressions
 */
class CronParser {
  /**
   * Parse a cron expression and calculate the next run time
   */
  public static getNextRunTime(cronExpression: string): Date | null {
    try {
      // Simple cron parser for basic patterns
      // Format: minute hour day month weekday
      // e.g. "*/30 * * * *" for every 30 minutes
      
      const now = new Date();
      const parts = cronExpression.trim().split(/\s+/);
      
      if (parts.length !== 5) {
        console.error('Invalid cron expression format:', cronExpression);
        return null;
      }
      
      const [minuteExp, hourExp, dayExp, monthExp, weekdayExp] = parts;
      
      // Clone current date for calculating next run
      const nextRun = new Date(now);
      nextRun.setSeconds(0);
      nextRun.setMilliseconds(0);
      
      // Handle common patterns
      if (minuteExp.startsWith('*/')) {
        // Every X minutes
        const interval = parseInt(minuteExp.slice(2), 10);
        if (isNaN(interval) || interval <= 0) {
          console.error('Invalid minute interval:', minuteExp);
          return null;
        }
        
        const currentMinute = now.getMinutes();
        const nextMinute = Math.ceil(currentMinute / interval) * interval;
        
        nextRun.setMinutes(nextMinute);
        
        if (nextRun <= now) {
          nextRun.setTime(nextRun.getTime() + interval * 60 * 1000);
        }
        
        return nextRun;
      }
      
      if (minuteExp === '0' && hourExp.startsWith('*/')) {
        // Every X hours at minute 0
        const interval = parseInt(hourExp.slice(2), 10);
        if (isNaN(interval) || interval <= 0) {
          console.error('Invalid hour interval:', hourExp);
          return null;
        }
        
        const currentHour = now.getHours();
        const nextHour = Math.ceil(currentHour / interval) * interval;
        
        nextRun.setMinutes(0);
        nextRun.setHours(nextHour);
        
        if (nextRun <= now) {
          nextRun.setTime(nextRun.getTime() + interval * 60 * 60 * 1000);
        }
        
        return nextRun;
      }
      
      if (minuteExp === '0' && hourExp === '0') {
        // Daily at midnight, weekly, or monthly
        nextRun.setHours(0);
        nextRun.setMinutes(0);
        
        // Add one day by default
        nextRun.setDate(nextRun.getDate() + 1);
        
        // Check if it's a specific day of week
        if (weekdayExp !== '*') {
          const targetDay = parseInt(weekdayExp, 10); // 0 = Sunday, 1 = Monday, etc.
          if (!isNaN(targetDay) && targetDay >= 0 && targetDay <= 6) {
            const currentDay = nextRun.getDay();
            const daysToAdd = (targetDay + 7 - currentDay) % 7;
            
            if (daysToAdd > 0) {
              nextRun.setDate(nextRun.getDate() + daysToAdd - 1); // -1 because we already added 1
            }
          }
        }
        
        return nextRun;
      }
      
      // For more complex cron expressions, we'd need a full cron parser library
      console.warn('Complex cron expression detected, using approximation:', cronExpression);
      
      // Default: just add one hour as a fallback
      nextRun.setTime(nextRun.getTime() + 60 * 60 * 1000);
      return nextRun;
    } catch (error) {
      console.error('Error parsing cron expression:', error);
      return null;
    }
  }
}

/**
 * ETL Job Scheduler
 */
class Scheduler {
  private intervalId: number | null = null;
  private checkInterval: number = 60000; // Check every minute by default
  
  private static instance: Scheduler;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }
  
  /**
   * Start the scheduler
   */
  public start(interval: number = this.checkInterval): void {
    if (this.intervalId !== null) {
      this.stop(); // Stop existing scheduler if running
    }
    
    console.log('Starting ETL job scheduler');
    
    this.checkInterval = interval;
    
    // Schedule initial check
    this.checkSchedules();
    
    // Set interval for periodic checks
    this.intervalId = window.setInterval(() => {
      this.checkSchedules();
    }, this.checkInterval);
  }
  
  /**
   * Stop the scheduler
   */
  public stop(): void {
    console.log('Stopping ETL job scheduler');
    
    if (this.intervalId !== null) {
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Check job schedules and run jobs if needed
   */
  private checkSchedules(): void {
    const jobs = ETLPipeline.getJobs();
    const now = new Date();
    
    jobs.forEach(job => {
      // Skip jobs that are not enabled or already running
      if (!job.enabled || job.status === 'running' || !job.schedule) {
        return;
      }
      
      // Calculate next run time if not set
      if (!job.nextRun) {
        const nextRun = CronParser.getNextRunTime(job.schedule);
        if (nextRun) {
          ETLPipeline.updateJob(job.id, { nextRun });
        }
        return;
      }
      
      // Check if it's time to run the job
      if (job.nextRun <= now) {
        console.log(`Running scheduled job: ${job.name} (${job.id})`);
        
        // Run the job
        ETLPipeline.runJob(job.id).catch(error => {
          console.error(`Error running scheduled job ${job.id}:`, error);
        });
        
        // Calculate the next run time
        const nextRun = CronParser.getNextRunTime(job.schedule);
        if (nextRun) {
          ETLPipeline.updateJob(job.id, { nextRun });
        }
      }
    });
  }
  
  /**
   * Schedule a job with a cron expression
   * 
   * @param jobId The ID of the job to schedule
   * @param cronExpression The cron expression for scheduling
   */
  public scheduleJob(jobId: string, cronExpression: string): void {
    const job = ETLPipeline.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }
    
    const nextRun = CronParser.getNextRunTime(cronExpression);
    
    if (!nextRun) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }
    
    ETLPipeline.updateJob(jobId, {
      schedule: cronExpression,
      nextRun
    });
  }
  
  /**
   * Unschedule a job
   */
  public unscheduleJob(jobId: string): void {
    const job = ETLPipeline.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }
    
    ETLPipeline.updateJob(jobId, {
      schedule: undefined,
      nextRun: undefined
    });
  }
  
  /**
   * Set the check interval
   */
  public setCheckInterval(interval: number): void {
    if (interval < 1000) {
      throw new Error('Check interval must be at least 1000ms');
    }
    
    this.checkInterval = interval;
    
    if (this.intervalId !== null) {
      // Restart scheduler with new interval
      this.stop();
      this.start();
    }
  }
}

// Export singleton instance
export default Scheduler.getInstance();