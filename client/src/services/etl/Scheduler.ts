import { ScheduleFrequency, ETLScheduleOptions } from './ETLTypes';
import { alertService, AlertType, AlertSeverity, AlertCategory } from './AlertService';

/**
 * Scheduled job interface
 */
export interface ScheduledJob {
  id: number;
  jobId: number;
  name: string;
  schedule: ETLScheduleOptions;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Run handler type
 */
export type RunHandler = (jobId: number) => Promise<void>;

/**
 * Scheduler service
 */
class Scheduler {
  private scheduledJobs: Map<number, ScheduledJob> = new Map();
  private runHandlers: Map<number, RunHandler> = new Map();
  private timerIds: Map<number, NodeJS.Timeout> = new Map();
  private nextId = 1;
  
  constructor() {
    console.log('Scheduler service initialized');
    this.initScheduler();
  }
  
  /**
   * Initialize the scheduler
   */
  private initScheduler(): void {
    // In a real application, we would load scheduled jobs from a database
    // For now, we'll just schedule a check every minute to see if any jobs need to run
    setInterval(() => {
      this.checkSchedules();
    }, 60000); // Check every minute
    
    console.log('Scheduler initialized');
  }
  
  /**
   * Schedule a new job
   */
  scheduleJob(
    jobId: number,
    name: string,
    schedule: ETLScheduleOptions,
    runHandler: RunHandler
  ): number {
    const now = new Date();
    const id = this.nextId++;
    
    const scheduledJob: ScheduledJob = {
      id,
      jobId,
      name,
      schedule,
      nextRun: this.calculateNextRun(schedule),
      enabled: true,
      createdAt: now,
      updatedAt: now
    };
    
    this.scheduledJobs.set(id, scheduledJob);
    this.runHandlers.set(id, runHandler);
    
    // Schedule the job
    this.scheduleNextRun(id);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: 'Job Scheduled',
      message: `Job "${name}" has been scheduled (ID: ${id})`,
      jobId
    });
    
    console.log(`Job scheduled: ${name} (ID: ${id}), next run: ${scheduledJob.nextRun}`);
    
    return id;
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
  getScheduledJob(id: number): ScheduledJob | undefined {
    return this.scheduledJobs.get(id);
  }
  
  /**
   * Get scheduled jobs for a specific ETL job
   */
  getScheduledJobsByJobId(jobId: number): ScheduledJob[] {
    return this.getScheduledJobs().filter(job => job.jobId === jobId);
  }
  
  /**
   * Update an existing scheduled job
   */
  updateJobSchedule(
    id: number,
    updates: {
      name?: string;
      schedule?: ETLScheduleOptions;
      enabled?: boolean;
    }
  ): boolean {
    const job = this.scheduledJobs.get(id);
    
    if (!job) {
      return false;
    }
    
    const now = new Date();
    
    if (updates.name) {
      job.name = updates.name;
    }
    
    if (updates.schedule) {
      job.schedule = updates.schedule;
      job.nextRun = this.calculateNextRun(updates.schedule);
      
      // Reset the timer
      this.scheduleNextRun(id);
    }
    
    if (updates.enabled !== undefined) {
      job.enabled = updates.enabled;
      
      if (!updates.enabled) {
        // Cancel the current timer
        this.cancelSchedule(id);
      } else if (!this.timerIds.has(id)) {
        // Re-enable the timer
        this.scheduleNextRun(id);
      }
    }
    
    job.updatedAt = now;
    this.scheduledJobs.set(id, job);
    
    console.log(`Job schedule updated: ${job.name} (ID: ${id}), next run: ${job.nextRun}`);
    
    return true;
  }
  
  /**
   * Delete a scheduled job
   */
  deleteScheduledJob(id: number): boolean {
    if (!this.scheduledJobs.has(id)) {
      return false;
    }
    
    const job = this.scheduledJobs.get(id)!;
    
    // Cancel any pending timer
    this.cancelSchedule(id);
    
    // Remove the job and handler
    this.scheduledJobs.delete(id);
    this.runHandlers.delete(id);
    
    console.log(`Job schedule deleted: ${job.name} (ID: ${id})`);
    
    return true;
  }
  
  /**
   * Run a job immediately
   */
  async runJobNow(id: number): Promise<void> {
    const job = this.scheduledJobs.get(id);
    
    if (!job) {
      throw new Error(`Scheduled job not found: ${id}`);
    }
    
    const handler = this.runHandlers.get(id);
    
    if (!handler) {
      throw new Error(`Run handler not found for job: ${id}`);
    }
    
    const now = new Date();
    job.lastRun = now;
    job.updatedAt = now;
    
    console.log(`Running job now: ${job.name} (ID: ${id})`);
    
    try {
      await handler(job.jobId);
      
      // If this is a one-time job, disable it after running
      if (job.schedule.frequency === ScheduleFrequency.ONCE) {
        job.enabled = false;
        this.cancelSchedule(id);
        console.log(`One-time job completed and disabled: ${job.name} (ID: ${id})`);
      } else {
        // Calculate the next run time
        job.nextRun = this.calculateNextRun(job.schedule);
        this.scheduleNextRun(id);
        console.log(`Job completed, next run: ${job.nextRun}`);
      }
      
      // Update the job in the map
      this.scheduledJobs.set(id, job);
    } catch (error) {
      console.error(`Error running job ${job.name} (ID: ${id}):`, error);
      
      const message = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.SCHEDULING,
        title: 'Job Execution Failed',
        message: `Failed to execute job "${job.name}": ${message}`,
        jobId: job.jobId
      });
      
      throw error;
    }
  }
  
  /**
   * Calculate the next run time based on a schedule
   */
  private calculateNextRun(schedule: ETLScheduleOptions): Date {
    const now = new Date();
    const result = new Date(now);
    
    // Handle different frequencies
    switch (schedule.frequency) {
      case ScheduleFrequency.ONCE:
        if (schedule.startDate && schedule.startDate > now) {
          return new Date(schedule.startDate);
        }
        // If no valid start date, schedule for 1 minute from now
        result.setMinutes(result.getMinutes() + 1);
        return result;
        
      case ScheduleFrequency.HOURLY:
        // If minute is specified, use it, otherwise keep the current minute
        if (schedule.minute !== undefined) {
          result.setMinutes(schedule.minute, 0, 0);
          // If the calculated time is in the past, add an hour
          if (result < now) {
            result.setHours(result.getHours() + 1);
          }
        } else {
          // Default to the next hour
          result.setHours(result.getHours() + 1);
          result.setMinutes(0, 0, 0);
        }
        return result;
        
      case ScheduleFrequency.DAILY:
        // Set the hour and minute
        result.setHours(schedule.hour || 0);
        result.setMinutes(schedule.minute || 0, 0, 0);
        // If the calculated time is in the past, add a day
        if (result < now) {
          result.setDate(result.getDate() + 1);
        }
        return result;
        
      case ScheduleFrequency.WEEKLY:
        // Set the day of week, hour, and minute
        const daysToAdd = this.calculateDaysToNext(now.getDay(), schedule.daysOfWeek || [0]);
        result.setDate(result.getDate() + daysToAdd);
        result.setHours(schedule.hour || 0);
        result.setMinutes(schedule.minute || 0, 0, 0);
        return result;
        
      case ScheduleFrequency.MONTHLY:
        // Set the day of month, hour, and minute
        result.setDate(schedule.dayOfMonth || 1);
        result.setHours(schedule.hour || 0);
        result.setMinutes(schedule.minute || 0, 0, 0);
        // If the calculated time is in the past, add a month
        if (result < now) {
          result.setMonth(result.getMonth() + 1);
        }
        return result;
        
      case ScheduleFrequency.CUSTOM:
        // For custom schedules, we would need to implement a cron parser
        // This is outside the scope of this example
        console.warn('Custom schedule frequency not fully implemented');
        // Default to daily at midnight
        result.setDate(result.getDate() + 1);
        result.setHours(0, 0, 0, 0);
        return result;
    }
  }
  
  /**
   * Calculate the number of days to the next occurrence of a day of week
   */
  private calculateDaysToNext(currentDay: number, daysOfWeek: number[]): number {
    if (daysOfWeek.length === 0) {
      return 7; // Default to one week if no days specified
    }
    
    // Sort the days
    const sortedDays = [...daysOfWeek].sort((a, b) => a - b);
    
    // Find the next day
    for (const day of sortedDays) {
      if (day > currentDay) {
        return day - currentDay;
      }
    }
    
    // If no day is greater, wrap around to the first day
    return 7 - currentDay + sortedDays[0];
  }
  
  /**
   * Schedule the next run for a job
   */
  private scheduleNextRun(id: number): void {
    // Cancel any existing timer
    this.cancelSchedule(id);
    
    const job = this.scheduledJobs.get(id);
    
    if (!job || !job.enabled || !job.nextRun) {
      return;
    }
    
    const now = new Date();
    const timeUntilNextRun = Math.max(0, job.nextRun.getTime() - now.getTime());
    
    console.log(`Scheduling job ${job.name} (ID: ${id}) to run in ${Math.floor(timeUntilNextRun / 1000)} seconds`);
    
    // Set a timer for the next run
    const timerId = setTimeout(async () => {
      this.timerIds.delete(id);
      
      try {
        await this.runJobNow(id);
      } catch (error) {
        console.error(`Error in scheduled execution of job ${job.name} (ID: ${id}):`, error);
      }
    }, timeUntilNextRun);
    
    this.timerIds.set(id, timerId);
  }
  
  /**
   * Cancel a scheduled timer
   */
  private cancelSchedule(id: number): void {
    const timerId = this.timerIds.get(id);
    
    if (timerId) {
      clearTimeout(timerId);
      this.timerIds.delete(id);
    }
  }
  
  /**
   * Check all schedules and run any jobs that are due
   */
  private async checkSchedules(): Promise<void> {
    const now = new Date();
    
    for (const [id, job] of this.scheduledJobs.entries()) {
      if (job.enabled && job.nextRun && job.nextRun <= now && !this.timerIds.has(id)) {
        console.log(`Job ${job.name} (ID: ${id}) is due to run`);
        
        try {
          await this.runJobNow(id);
        } catch (error) {
          console.error(`Error running scheduled job ${job.name} (ID: ${id}):`, error);
        }
      }
    }
  }
}

// Export a singleton instance
export const scheduler = new Scheduler();