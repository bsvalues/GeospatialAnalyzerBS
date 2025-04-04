/**
 * Scheduler.ts
 * 
 * Service for scheduling and managing ETL jobs based on cron expressions
 */
import { etlPipeline as ETLPipeline } from './ETLPipeline';
import { getScheduleString } from './ETLTypes';
import { JobScheduleImpl } from './JobScheduleImpl';

// Default check interval (1 minute)
const DEFAULT_CHECK_INTERVAL = 60 * 1000;

class SchedulerService {
  private timer: NodeJS.Timeout | null = null;
  private checkInterval: number = DEFAULT_CHECK_INTERVAL;
  private isActive: boolean = false;
  private jobSchedules: Map<string, string> = new Map();
  
  /**
   * Start the scheduler
   */
  start(checkInterval = DEFAULT_CHECK_INTERVAL): void {
    if (this.timer) {
      this.stop();
    }
    
    this.checkInterval = checkInterval;
    this.isActive = true;
    
    // Load existing job schedules
    this.loadSchedules();
    
    // Start interval for checking jobs
    this.timer = setInterval(() => {
      if (this.isActive) {
        this.checkScheduledJobs();
      }
    }, this.checkInterval);
    
    console.log(`Scheduler started with check interval: ${this.checkInterval}ms`);
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    if (this.timer) {
      clearInterval(this.timer);
      this.timer = null;
    }
    
    this.isActive = false;
    console.log('Scheduler stopped');
  }
  
  /**
   * Set active state of the scheduler
   */
  setActive(isActive: boolean): void {
    this.isActive = isActive;
    console.log(`Scheduler is now ${isActive ? 'active' : 'inactive'}`);
  }
  
  /**
   * Set check interval
   */
  setCheckInterval(interval: number): void {
    if (interval < 1000) {
      console.warn('Check interval must be at least 1000ms, setting to 1000ms');
      interval = 1000;
    }
    
    this.checkInterval = interval;
    
    // Restart timer with new interval if active
    if (this.isActive && this.timer) {
      this.stop();
      this.start(interval);
    }
    
    console.log(`Scheduler check interval set to ${interval}ms`);
  }
  
  /**
   * Load schedules from ETL jobs
   */
  private loadSchedules(): void {
    try {
      const jobs = ETLPipeline.getJobs();
      
      jobs.forEach(job => {
        if (job.schedule) {
          const scheduleStr = getScheduleString(job.schedule);
          if (scheduleStr) {
            this.jobSchedules.set(job.id.toString(), scheduleStr);
          }
        }
      });
      
      console.log(`Loaded ${this.jobSchedules.size} job schedules`);
    } catch (error) {
      console.error('Error loading job schedules:', error);
    }
  }
  
  /**
   * Check if any scheduled jobs need to be run
   */
  private checkScheduledJobs(): void {
    try {
      const jobs = ETLPipeline.getJobs();
      const now = new Date();
      
      jobs.forEach(job => {
        // Skip jobs that are not enabled, already running, or don't have a schedule
        if (!job.enabled || job.status === 'RUNNING' || !job.schedule) {
          return;
        }
        
        const scheduleStr = getScheduleString(job.schedule);
        if (!scheduleStr) {
          return;
        }
        
        // Check if job should run based on schedule and last run time
        if (this.shouldRunJob(scheduleStr, job.lastRun)) {
          console.log(`Running scheduled job: ${job.name} (ID: ${job.id})`);
          ETLPipeline.runJob(job.id)
            .then(() => {
              console.log(`Scheduled job started: ${job.name} (ID: ${job.id})`);
            })
            .catch(error => {
              console.error(`Error running scheduled job ${job.name} (ID: ${job.id}):`, error);
            });
        }
      });
    } catch (error) {
      console.error('Error checking scheduled jobs:', error);
    }
  }
  
  /**
   * Determine if a job should run based on its schedule and last run time
   */
  private shouldRunJob(cronExpression: string, lastRun?: Date): boolean {
    if (!cronExpression) {
      return false;
    }
    
    try {
      // Parse cron expression (simplified implementation)
      // Format: minute hour day month weekday
      // e.g., "*/5 * * * *" = every 5 minutes
      const parts = cronExpression.trim().split(/\s+/);
      if (parts.length !== 5) {
        console.warn(`Invalid cron expression: ${cronExpression}`);
        return false;
      }
      
      const now = new Date();
      
      // If no last run, or last run was a long time ago, run the job
      if (!lastRun) {
        return true;
      }
      
      // Check if enough time has passed since last run
      const minutesSinceLastRun = Math.floor((now.getTime() - lastRun.getTime()) / (60 * 1000));
      
      // Parse minute part of cron (simplified)
      const minutePart = parts[0];
      
      // Handle */n format (every n minutes)
      if (minutePart.startsWith('*/')) {
        const interval = parseInt(minutePart.substring(2), 10);
        return minutesSinceLastRun >= interval;
      }
      
      // For more complex cron expressions, we'd need a full cron parser
      // This is a simplified implementation that handles common cases
      return minutesSinceLastRun >= 60;
    } catch (error) {
      console.error(`Error calculating schedule for cron "${cronExpression}":`, error);
      return false;
    }
  }
  
  /**
   * Schedule a job with a cron expression
   */
  scheduleJob(jobId: string, cronExpression: string): void {
    try {
      // Update job in ETL pipeline
      const job = ETLPipeline.getJobs().find(j => j.id.toString() === jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`);
      }
      
      // Create a JobScheduleImpl from the cron expression
      const jobSchedule = JobScheduleImpl.fromCronExpression(cronExpression);
      
      ETLPipeline.updateJob(parseInt(jobId, 10), {
        schedule: jobSchedule
      });
      
      // Update local schedule map
      this.jobSchedules.set(jobId, cronExpression);
      
      console.log(`Job ${jobId} scheduled with cron expression: ${cronExpression}`);
    } catch (error) {
      console.error(`Error scheduling job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Remove schedule from a job
   */
  unscheduleJob(jobId: string): void {
    try {
      // Update job in ETL pipeline
      const job = ETLPipeline.getJobs().find(j => j.id.toString() === jobId);
      if (!job) {
        throw new Error(`Job with ID ${jobId} not found`);
      }
      
      ETLPipeline.updateJob(parseInt(jobId, 10), {
        schedule: undefined
      });
      
      // Remove from local schedule map
      this.jobSchedules.delete(jobId);
      
      console.log(`Schedule removed from job ${jobId}`);
    } catch (error) {
      console.error(`Error unscheduling job ${jobId}:`, error);
      throw error;
    }
  }
  
  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): Record<string, string> {
    return Object.fromEntries(this.jobSchedules);
  }
}

// Export a singleton instance
const Scheduler = new SchedulerService();
export default Scheduler;