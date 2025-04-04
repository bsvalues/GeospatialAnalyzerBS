import { ETLJob, ETLSchedule } from './ETLTypes';

/**
 * Schedule frequency enum
 */
export enum ScheduleFrequency {
  ONCE = 'once',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly'
}

/**
 * Scheduled job interface
 */
export interface ScheduledJob {
  id: string;
  jobId: string;
  schedule: ETLSchedule;
  callback: (jobId: string) => Promise<void>;
  nextRunTime: Date;
  timerId?: number;
}

/**
 * Scheduler for scheduling and executing ETL jobs
 */
class Scheduler {
  private scheduledJobs: Map<string, ScheduledJob> = new Map();
  private initialized = false;
  
  constructor() {
    // Default constructor
  }
  
  /**
   * Initialize the scheduler
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }
    
    console.log('Initializing ETL Scheduler');
    
    // Check for overdue jobs and schedule them
    this.checkOverdueJobs();
    
    // Run scheduling check every minute
    setInterval(() => this.checkSchedules(), 60000);
    
    this.initialized = true;
  }
  
  /**
   * Check for overdue jobs and schedule them
   */
  private checkOverdueJobs(): void {
    console.log('Checking for overdue jobs');
    
    const now = new Date();
    
    // Check all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      if (job.nextRunTime <= now) {
        console.log(`Job ${job.jobId} is overdue, scheduling immediately`);
        this.scheduleNextRun(job);
      }
    }
  }
  
  /**
   * Check schedules for jobs that need to be executed
   */
  private checkSchedules(): void {
    console.log('Checking scheduled jobs');
    
    const now = new Date();
    
    // Check all scheduled jobs
    for (const job of this.scheduledJobs.values()) {
      if (job.nextRunTime <= now) {
        console.log(`Job ${job.jobId} is due, executing`);
        this.executeJob(job);
      }
    }
  }
  
  /**
   * Execute a scheduled job
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    try {
      console.log(`Executing scheduled job: ${job.jobId}`);
      
      // Execute the job callback
      await job.callback(job.jobId);
      
      // Schedule the next run
      this.scheduleNextRun(job);
    } catch (error) {
      console.error(`Error executing scheduled job ${job.jobId}:`, error);
      
      // Still schedule the next run even if this one failed
      this.scheduleNextRun(job);
    }
  }
  
  /**
   * Schedule the next run for a job
   */
  private scheduleNextRun(job: ScheduledJob): void {
    // Clear any existing timer
    if (job.timerId) {
      clearTimeout(job.timerId);
      job.timerId = undefined;
    }
    
    // Calculate next run time
    const nextRunTime = this.calculateNextRunTime(job.schedule);
    job.nextRunTime = nextRunTime;
    
    console.log(`Next run for job ${job.jobId} scheduled at ${nextRunTime.toISOString()}`);
    
    // Calculate delay in milliseconds
    const now = new Date();
    const delay = Math.max(0, nextRunTime.getTime() - now.getTime());
    
    // Schedule next run
    if (job.schedule.frequency !== ScheduleFrequency.ONCE) {
      job.timerId = window.setTimeout(() => {
        this.executeJob(job);
      }, delay);
    }
    
    // Update the job in the map
    this.scheduledJobs.set(job.id, job);
  }
  
  /**
   * Calculate the next run time for a schedule
   */
  private calculateNextRunTime(schedule: ETLSchedule): Date {
    const now = new Date();
    let nextRun = new Date(now);
    
    // Set seconds and milliseconds to 0
    nextRun.setSeconds(0);
    nextRun.setMilliseconds(0);
    
    switch (schedule.frequency) {
      case ScheduleFrequency.ONCE:
        // For one-time schedules, use the specified time or now
        if (schedule.options && schedule.options.datetime) {
          nextRun = new Date(schedule.options.datetime);
        }
        break;
        
      case ScheduleFrequency.HOURLY:
        // Set minutes to the specified value
        if (schedule.options && schedule.options.minute !== undefined) {
          nextRun.setMinutes(schedule.options.minute);
        } else {
          nextRun.setMinutes(0);
        }
        
        // If the calculated time is in the past, add an hour
        if (nextRun <= now) {
          nextRun.setHours(nextRun.getHours() + 1);
        }
        break;
        
      case ScheduleFrequency.DAILY:
        // Set hours and minutes to the specified values
        if (schedule.options) {
          if (schedule.options.hour !== undefined) {
            nextRun.setHours(schedule.options.hour);
          } else {
            nextRun.setHours(0);
          }
          
          if (schedule.options.minute !== undefined) {
            nextRun.setMinutes(schedule.options.minute);
          } else {
            nextRun.setMinutes(0);
          }
        } else {
          // Default to midnight
          nextRun.setHours(0);
          nextRun.setMinutes(0);
        }
        
        // If the calculated time is in the past, add a day
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case ScheduleFrequency.WEEKLY:
        // Set day of week, hours, and minutes to the specified values
        if (schedule.options) {
          if (schedule.options.dayOfWeek !== undefined) {
            // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
            const current = nextRun.getDay();
            const target = schedule.options.dayOfWeek;
            let daysToAdd = target - current;
            if (daysToAdd < 0) {
              daysToAdd += 7;
            }
            nextRun.setDate(nextRun.getDate() + daysToAdd);
          }
          
          if (schedule.options.hour !== undefined) {
            nextRun.setHours(schedule.options.hour);
          } else {
            nextRun.setHours(0);
          }
          
          if (schedule.options.minute !== undefined) {
            nextRun.setMinutes(schedule.options.minute);
          } else {
            nextRun.setMinutes(0);
          }
        } else {
          // Default to Sunday at midnight
          const current = nextRun.getDay();
          let daysToAdd = 0 - current;
          if (daysToAdd <= 0) {
            daysToAdd += 7;
          }
          nextRun.setDate(nextRun.getDate() + daysToAdd);
          nextRun.setHours(0);
          nextRun.setMinutes(0);
        }
        
        // If the calculated time is in the past, add a week
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
        
      case ScheduleFrequency.MONTHLY:
        // Set day of month, hours, and minutes to the specified values
        if (schedule.options) {
          if (schedule.options.dayOfMonth !== undefined) {
            nextRun.setDate(schedule.options.dayOfMonth);
          } else {
            nextRun.setDate(1);
          }
          
          if (schedule.options.hour !== undefined) {
            nextRun.setHours(schedule.options.hour);
          } else {
            nextRun.setHours(0);
          }
          
          if (schedule.options.minute !== undefined) {
            nextRun.setMinutes(schedule.options.minute);
          } else {
            nextRun.setMinutes(0);
          }
        } else {
          // Default to the 1st of the month at midnight
          nextRun.setDate(1);
          nextRun.setHours(0);
          nextRun.setMinutes(0);
        }
        
        // If the calculated time is in the past, add a month
        if (nextRun <= now) {
          nextRun.setMonth(nextRun.getMonth() + 1);
        }
        break;
    }
    
    return nextRun;
  }
  
  /**
   * Schedule a job for execution
   */
  scheduleJob(job: ETLJob, callback: (jobId: string) => Promise<void>): void {
    if (!job.schedule) {
      console.warn(`Cannot schedule job without a schedule: ${job.id}`);
      return;
    }
    
    console.log(`Scheduling job: ${job.name} (${job.id})`);
    
    // Create scheduled job
    const scheduledJob: ScheduledJob = {
      id: `scheduled-${job.id}`,
      jobId: job.id,
      schedule: job.schedule,
      callback,
      nextRunTime: new Date()
    };
    
    // Calculate next run time
    this.scheduleNextRun(scheduledJob);
    
    // Save to the map
    this.scheduledJobs.set(scheduledJob.id, scheduledJob);
  }
  
  /**
   * Unschedule a job
   */
  unscheduleJob(jobId: string): void {
    const scheduledJobId = `scheduled-${jobId}`;
    
    // Get the scheduled job
    const job = this.scheduledJobs.get(scheduledJobId);
    
    if (!job) {
      return;
    }
    
    console.log(`Unscheduling job: ${jobId}`);
    
    // Clear any existing timer
    if (job.timerId) {
      clearTimeout(job.timerId);
    }
    
    // Remove from the map
    this.scheduledJobs.delete(scheduledJobId);
  }
  
  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values());
  }
  
  /**
   * Get a specific scheduled job
   */
  getScheduledJob(jobId: string): ScheduledJob | undefined {
    const scheduledJobId = `scheduled-${jobId}`;
    return this.scheduledJobs.get(scheduledJobId);
  }
  
  /**
   * Shutdown the scheduler
   */
  shutdown(): void {
    console.log('Shutting down ETL Scheduler');
    
    // Clear all timers
    for (const job of this.scheduledJobs.values()) {
      if (job.timerId) {
        clearTimeout(job.timerId);
      }
    }
    
    // Clear scheduled jobs
    this.scheduledJobs.clear();
    
    this.initialized = false;
  }
}

// Export a singleton instance
export const scheduler = new Scheduler();