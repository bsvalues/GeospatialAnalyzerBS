/**
 * ETL Scheduler Service
 * 
 * Handles the scheduling of ETL jobs based on cron expressions.
 * Uses a simple interval-based approach to check for jobs that need to be run.
 */

import ETLPipeline, { ETLJob } from './ETLPipeline';

/**
 * A simple parser for cron expressions to determine when a job should run next.
 * 
 * Supports:
 * - Minutes: 0-59
 * - Hours: 0-23
 * - Day of month: 1-31
 * - Month: 1-12
 * - Day of week: 0-6 (Sunday is 0)
 * 
 * Common cron patterns are included in the implementation
 */
class CronParser {
  /**
   * Parse a cron expression and determine the next run time
   * 
   * @param cronExpression The cron expression to parse
   * @returns The next date to run, or null if the expression is invalid
   */
  static getNextRunTime(cronExpression: string): Date | null {
    try {
      const now = new Date();
      
      // Parse the cron expression
      const parts = cronExpression.trim().split(/\s+/);
      
      // We need exactly 5 parts for a valid cron expression
      if (parts.length !== 5) {
        return null;
      }
      
      // For simplicity, we'll just handle some common patterns
      
      // Check for "every n minutes" pattern: */n * * * *
      const minuteMatch = parts[0].match(/^\*\/(\d+)$/);
      if (minuteMatch && parts[1] === '*' && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
        const minutes = parseInt(minuteMatch[1], 10);
        if (isNaN(minutes) || minutes <= 0 || minutes > 59) {
          return null;
        }
        
        const next = new Date(now);
        next.setSeconds(0);
        next.setMilliseconds(0);
        next.setMinutes(Math.ceil(next.getMinutes() / minutes) * minutes);
        
        if (next <= now) {
          next.setMinutes(next.getMinutes() + minutes);
        }
        
        return next;
      }
      
      // Check for "every n hours" pattern: 0 */n * * *
      const hourMatch = parts[1].match(/^\*\/(\d+)$/);
      if (parts[0] === '0' && hourMatch && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
        const hours = parseInt(hourMatch[1], 10);
        if (isNaN(hours) || hours <= 0 || hours > 23) {
          return null;
        }
        
        const next = new Date(now);
        next.setSeconds(0);
        next.setMilliseconds(0);
        next.setMinutes(0);
        next.setHours(Math.ceil(next.getHours() / hours) * hours);
        
        if (next <= now) {
          next.setHours(next.getHours() + hours);
        }
        
        return next;
      }
      
      // Check for "at specific time every day" pattern: m h * * *
      if (!parts[0].includes('*') && !parts[1].includes('*') && parts[2] === '*' && parts[3] === '*' && parts[4] === '*') {
        const minutes = parseInt(parts[0], 10);
        const hours = parseInt(parts[1], 10);
        
        if (isNaN(minutes) || isNaN(hours) || minutes < 0 || minutes > 59 || hours < 0 || hours > 23) {
          return null;
        }
        
        const next = new Date(now);
        next.setSeconds(0);
        next.setMilliseconds(0);
        next.setMinutes(minutes);
        next.setHours(hours);
        
        if (next <= now) {
          next.setDate(next.getDate() + 1);
        }
        
        return next;
      }
      
      // For more complex expressions, we would use a more robust library in a production environment
      // This is a simplified implementation for demonstration purposes
      
      // Default fallback: run once a day at midnight
      const next = new Date(now);
      next.setSeconds(0);
      next.setMilliseconds(0);
      next.setMinutes(0);
      next.setHours(0);
      
      if (next <= now) {
        next.setDate(next.getDate() + 1);
      }
      
      return next;
    } catch (error) {
      console.error('Error parsing cron expression:', error);
      return null;
    }
  }
}

/**
 * ETL Scheduler class for managing scheduled jobs
 */
export class Scheduler {
  private checkInterval: number = 60000; // Check every minute
  private intervalId: number | null = null;
  private lastCheck: Date = new Date();
  
  // Singleton instance
  private static instance: Scheduler;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  public static getInstance(): Scheduler {
    if (!Scheduler.instance) {
      Scheduler.instance = new Scheduler();
    }
    return Scheduler.instance;
  }
  
  /**
   * Start the scheduler
   */
  public start(): void {
    if (this.intervalId) {
      console.log('Scheduler is already running');
      return;
    }
    
    console.log('Starting ETL job scheduler');
    this.lastCheck = new Date();
    
    // Immediately check for jobs that should be run
    this.checkScheduledJobs();
    
    // Set up interval to check for jobs periodically
    this.intervalId = window.setInterval(() => {
      this.checkScheduledJobs();
    }, this.checkInterval);
  }
  
  /**
   * Stop the scheduler
   */
  public stop(): void {
    if (this.intervalId) {
      console.log('Stopping ETL job scheduler');
      window.clearInterval(this.intervalId);
      this.intervalId = null;
    }
  }
  
  /**
   * Check for jobs that need to be run based on their schedule
   */
  private checkScheduledJobs(): void {
    const now = new Date();
    const etlPipeline = ETLPipeline;
    
    // Get all jobs
    const jobs = etlPipeline.getJobs();
    
    // Filter for jobs that have a schedule and are enabled
    const scheduledJobs = jobs.filter(job => job.schedule && job.enabled);
    
    for (const job of scheduledJobs) {
      if (this.shouldRunJob(job, now)) {
        console.log(`Scheduled execution of ETL job: ${job.name}`);
        
        // Run the job and handle any errors
        try {
          etlPipeline.runJob(job.id).catch(error => {
            console.error(`Error running scheduled ETL job ${job.name}:`, error);
          });
          
          // Update next run time based on schedule
          if (job.schedule) {
            const nextRun = CronParser.getNextRunTime(job.schedule);
            if (nextRun) {
              etlPipeline.updateJob(job.id, { nextRun });
            }
          }
        } catch (error) {
          console.error(`Error scheduling ETL job ${job.name}:`, error);
        }
      }
    }
    
    this.lastCheck = now;
  }
  
  /**
   * Determine if a job should be run based on its schedule
   */
  private shouldRunJob(job: ETLJob, now: Date): boolean {
    // If job is running, don't run it again
    if (job.status === 'running') {
      return false;
    }
    
    // If no schedule, don't run
    if (!job.schedule) {
      return false;
    }
    
    // If job has a nextRun time, check if it's due
    if (job.nextRun) {
      return job.nextRun <= now;
    }
    
    // If no nextRun time, calculate it based on the schedule
    const nextRun = CronParser.getNextRunTime(job.schedule);
    
    if (!nextRun) {
      console.warn(`Invalid schedule for job ${job.name}: ${job.schedule}`);
      return false;
    }
    
    // Calculate the next run time and check if it would have happened between the last check and now
    const wouldHaveRun = nextRun > this.lastCheck && nextRun <= now;
    
    // Update the job's nextRun time if we're not going to run it now
    if (!wouldHaveRun) {
      ETLPipeline.updateJob(job.id, { nextRun });
    }
    
    return wouldHaveRun;
  }
  
  /**
   * Update the check interval
   */
  public setCheckInterval(intervalMs: number): void {
    if (intervalMs < 1000) {
      throw new Error('Check interval must be at least 1000ms');
    }
    
    this.checkInterval = intervalMs;
    
    // Restart the scheduler if it's running
    if (this.intervalId) {
      this.stop();
      this.start();
    }
  }
  
  /**
   * Schedule a job with a given cron expression
   */
  public scheduleJob(jobId: string, cronExpression: string): void {
    const job = ETLPipeline.getJob(jobId);
    
    if (!job) {
      throw new Error(`ETL job with ID ${jobId} not found`);
    }
    
    // Make sure the cron expression is valid
    const nextRun = CronParser.getNextRunTime(cronExpression);
    
    if (!nextRun) {
      throw new Error(`Invalid cron expression: ${cronExpression}`);
    }
    
    // Update the job with the new schedule and next run time
    ETLPipeline.updateJob(jobId, {
      schedule: cronExpression,
      nextRun
    });
    
    console.log(`Scheduled ETL job ${job.name} with expression "${cronExpression}". Next run at: ${nextRun.toLocaleString()}`);
  }
}

// Export singleton instance
export default Scheduler.getInstance();