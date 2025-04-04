import { ScheduleFrequency } from './ETLTypes';
import { alertService, AlertType, AlertSeverity, AlertCategory } from './AlertService';

/**
 * Schedule options interface
 */
export interface ScheduleOptions {
  frequency: ScheduleFrequency;
  minute?: number;
  hour?: number;
  dayOfMonth?: number;
  month?: number;
  dayOfWeek?: number;
  timezone?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * Scheduled job interface
 */
export interface ScheduledJob {
  id: number;
  jobId: number;
  name: string;
  schedule: ScheduleOptions;
  lastRun?: Date;
  nextRun?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
  runHandler: () => Promise<void>;
}

/**
 * Update scheduled job options interface
 */
export interface UpdateScheduledJobOptions {
  name?: string;
  schedule?: ScheduleOptions;
  enabled?: boolean;
}

/**
 * Scheduler class
 */
class Scheduler {
  private scheduledJobs: Map<number, ScheduledJob> = new Map();
  private timers: Map<number, NodeJS.Timeout> = new Map();
  private nextScheduleId = 1;
  private running = false;
  
  constructor() {
    console.log('Scheduler initialized');
    this.start();
  }
  
  /**
   * Start the scheduler
   */
  start(): void {
    if (this.running) {
      return;
    }
    
    this.running = true;
    
    // Schedule all enabled jobs
    for (const [scheduleId, job] of this.scheduledJobs) {
      if (job.enabled) {
        this.scheduleJobExecution(scheduleId);
      }
    }
    
    console.log(`Scheduler started with ${this.scheduledJobs.size} jobs`);
    
    // Create a system alert
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: 'Scheduler Started',
      message: `Scheduler started with ${this.scheduledJobs.size} jobs`
    });
  }
  
  /**
   * Stop the scheduler
   */
  stop(): void {
    if (!this.running) {
      return;
    }
    
    this.running = false;
    
    // Clear all timers
    for (const [scheduleId, timer] of this.timers) {
      clearTimeout(timer);
    }
    
    this.timers.clear();
    
    console.log('Scheduler stopped');
    
    // Create a system alert
    alertService.createAlert({
      type: AlertType.WARNING,
      severity: AlertSeverity.MEDIUM,
      category: AlertCategory.SCHEDULING,
      title: 'Scheduler Stopped',
      message: 'All scheduled jobs have been cancelled'
    });
  }
  
  /**
   * Schedule a job
   */
  scheduleJob(
    jobId: number,
    name: string,
    scheduleOptions: ScheduleOptions,
    runHandler: () => Promise<void>
  ): ScheduledJob {
    const id = this.nextScheduleId++;
    const now = new Date();
    
    const scheduledJob: ScheduledJob = {
      id,
      jobId,
      name,
      schedule: scheduleOptions,
      lastRun: undefined,
      nextRun: this.calculateNextRun(scheduleOptions),
      enabled: true,
      createdAt: now,
      updatedAt: now,
      runHandler
    };
    
    // Store the job
    this.scheduledJobs.set(id, scheduledJob);
    
    // Schedule the job if the scheduler is running
    if (this.running) {
      this.scheduleJobExecution(id);
    }
    
    console.log(`Job '${name}' scheduled with ID ${id}, next run: ${scheduledJob.nextRun?.toISOString() || 'not scheduled'}`);
    
    return scheduledJob;
  }
  
  /**
   * Update a scheduled job
   */
  updateJobSchedule(id: number, options: UpdateScheduledJobOptions): boolean {
    // Find the job
    const job = this.scheduledJobs.get(id);
    
    if (!job) {
      console.warn(`Scheduled job with ID ${id} not found`);
      return false;
    }
    
    // Clear the current timer
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
      this.timers.delete(id);
    }
    
    // Update the job
    const updatedJob = { ...job, updatedAt: new Date() };
    
    if (options.name !== undefined) {
      updatedJob.name = options.name;
    }
    
    if (options.schedule !== undefined) {
      updatedJob.schedule = options.schedule;
      updatedJob.nextRun = this.calculateNextRun(options.schedule);
    }
    
    if (options.enabled !== undefined) {
      updatedJob.enabled = options.enabled;
    }
    
    // Store the updated job
    this.scheduledJobs.set(id, updatedJob);
    
    // Reschedule the job if it's enabled and the scheduler is running
    if (updatedJob.enabled && this.running) {
      this.scheduleJobExecution(id);
    }
    
    console.log(`Scheduled job '${updatedJob.name}' (ID: ${id}) updated, next run: ${updatedJob.nextRun?.toISOString() || 'not scheduled'}`);
    
    return true;
  }
  
  /**
   * Delete a scheduled job
   */
  deleteScheduledJob(id: number): boolean {
    // Find the job
    if (!this.scheduledJobs.has(id)) {
      console.warn(`Scheduled job with ID ${id} not found`);
      return false;
    }
    
    // Clear the timer
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
      this.timers.delete(id);
    }
    
    // Remove the job
    const job = this.scheduledJobs.get(id)!;
    this.scheduledJobs.delete(id);
    
    console.log(`Scheduled job '${job.name}' (ID: ${id}) deleted`);
    
    return true;
  }
  
  /**
   * Get all scheduled jobs
   */
  getAllScheduledJobs(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values());
  }
  
  /**
   * Get a specific scheduled job
   */
  getScheduledJob(id: number): ScheduledJob | undefined {
    return this.scheduledJobs.get(id);
  }
  
  /**
   * Get scheduled jobs for a specific job ID
   */
  getScheduledJobsByJobId(jobId: number): ScheduledJob[] {
    return this.getAllScheduledJobs().filter(job => job.jobId === jobId);
  }
  
  /**
   * Schedule execution of a job
   */
  private scheduleJobExecution(scheduleId: number): void {
    // Find the job
    const job = this.scheduledJobs.get(scheduleId);
    
    if (!job || !job.enabled) {
      return;
    }
    
    // Clear any existing timer
    if (this.timers.has(scheduleId)) {
      clearTimeout(this.timers.get(scheduleId)!);
      this.timers.delete(scheduleId);
    }
    
    // Calculate next run time
    const nextRun = job.nextRun || this.calculateNextRun(job.schedule);
    
    if (!nextRun) {
      console.warn(`Could not calculate next run time for job '${job.name}' (ID: ${scheduleId})`);
      return;
    }
    
    // Update the job's next run time
    job.nextRun = nextRun;
    this.scheduledJobs.set(scheduleId, job);
    
    // Calculate the delay until the next run
    const now = new Date();
    const delay = Math.max(0, nextRun.getTime() - now.getTime());
    
    // If the next run is in the past, execute immediately
    if (delay === 0) {
      this.executeScheduledJob(scheduleId);
      return;
    }
    
    // Schedule the execution
    const timer = setTimeout(() => {
      this.executeScheduledJob(scheduleId);
    }, delay);
    
    // Store the timer
    this.timers.set(scheduleId, timer);
    
    console.log(`Job '${job.name}' (ID: ${scheduleId}) scheduled to run in ${delay}ms (${nextRun.toISOString()})`);
  }
  
  /**
   * Execute a scheduled job
   */
  private async executeScheduledJob(scheduleId: number): Promise<void> {
    // Find the job
    const job = this.scheduledJobs.get(scheduleId);
    
    if (!job || !job.enabled) {
      return;
    }
    
    console.log(`Executing scheduled job '${job.name}' (ID: ${scheduleId})`);
    
    try {
      // Execute the job
      await job.runHandler();
      
      // Update the job's last run time
      job.lastRun = new Date();
      
      // Calculate the next run time
      job.nextRun = this.calculateNextRun(job.schedule);
      
      // Update the job
      job.updatedAt = new Date();
      this.scheduledJobs.set(scheduleId, job);
      
      console.log(`Scheduled job '${job.name}' (ID: ${scheduleId}) executed successfully, next run: ${job.nextRun?.toISOString() || 'not scheduled'}`);
      
      // Create a success alert
      alertService.createAlert({
        type: AlertType.SUCCESS,
        severity: AlertSeverity.LOW,
        category: AlertCategory.SCHEDULING,
        title: `Scheduled Job Executed: ${job.name}`,
        message: `Job executed successfully`,
        jobId: job.jobId
      });
    } catch (error) {
      console.error(`Error executing scheduled job '${job.name}' (ID: ${scheduleId}):`, error);
      
      // Create an error alert
      const errorMessage = error instanceof Error ? error.message : String(error);
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.SCHEDULING,
        title: `Scheduled Job Failed: ${job.name}`,
        message: `Error executing job: ${errorMessage}`,
        jobId: job.jobId
      });
    } finally {
      // Schedule the next execution if the job is still enabled
      if (job.enabled && this.running) {
        this.scheduleJobExecution(scheduleId);
      }
    }
  }
  
  /**
   * Calculate the next run time based on a schedule
   */
  private calculateNextRun(schedule: ScheduleOptions): Date | undefined {
    // If frequency is ONCE and there's a start date, use that
    if (schedule.frequency === ScheduleFrequency.ONCE && schedule.startDate) {
      const startDate = new Date(schedule.startDate);
      
      // If the start date is in the past, return undefined
      if (startDate < new Date()) {
        return undefined;
      }
      
      return startDate;
    }
    
    const now = new Date();
    const result = new Date(now);
    
    // Check if the schedule has an end date and if it's in the past
    if (schedule.endDate && new Date(schedule.endDate) < now) {
      return undefined;
    }
    
    // If there's a start date and it's in the future, use that as the base
    if (schedule.startDate && new Date(schedule.startDate) > now) {
      result.setTime(new Date(schedule.startDate).getTime());
    }
    
    // Calculate the next run time based on the frequency
    switch (schedule.frequency) {
      case ScheduleFrequency.MINUTELY:
        // For minutely schedules, round to the next minute
        result.setSeconds(0, 0);
        result.setTime(result.getTime() + 60 * 1000);
        break;
        
      case ScheduleFrequency.HOURLY:
        // For hourly schedules, set to the specified minute or the next hour
        result.setSeconds(0, 0);
        if (schedule.minute !== undefined) {
          if (result.getMinutes() >= schedule.minute) {
            // If we're past the specified minute, go to the next hour
            result.setHours(result.getHours() + 1);
          }
          result.setMinutes(schedule.minute);
        } else {
          // If no minute is specified, go to the next hour
          result.setHours(result.getHours() + 1);
          result.setMinutes(0);
        }
        break;
        
      case ScheduleFrequency.DAILY:
        // For daily schedules, set to the specified hour and minute or next day
        result.setSeconds(0, 0);
        if (schedule.hour !== undefined) {
          if (result.getHours() > schedule.hour || 
              (result.getHours() === schedule.hour && result.getMinutes() >= (schedule.minute || 0))) {
            // If we're past the specified time, go to the next day
            result.setDate(result.getDate() + 1);
          }
          result.setHours(schedule.hour);
          result.setMinutes(schedule.minute || 0);
        } else {
          // If no hour is specified, go to the next day at midnight
          result.setDate(result.getDate() + 1);
          result.setHours(0);
          result.setMinutes(0);
        }
        break;
        
      case ScheduleFrequency.WEEKLY:
        // For weekly schedules, set to the specified day, hour, and minute or next week
        result.setSeconds(0, 0);
        if (schedule.dayOfWeek !== undefined) {
          const currentDay = result.getDay();
          let daysToAdd = schedule.dayOfWeek - currentDay;
          
          if (daysToAdd < 0 || (daysToAdd === 0 && 
            (result.getHours() > (schedule.hour || 0) || 
            (result.getHours() === (schedule.hour || 0) && result.getMinutes() >= (schedule.minute || 0))))) {
            // If we're past the specified day or time, go to next week
            daysToAdd += 7;
          }
          
          result.setDate(result.getDate() + daysToAdd);
          result.setHours(schedule.hour || 0);
          result.setMinutes(schedule.minute || 0);
        } else {
          // If no day is specified, go to the next week
          result.setDate(result.getDate() + 7);
          result.setHours(schedule.hour || 0);
          result.setMinutes(schedule.minute || 0);
        }
        break;
        
      case ScheduleFrequency.MONTHLY:
        // For monthly schedules, set to the specified day, hour, and minute or next month
        result.setSeconds(0, 0);
        if (schedule.dayOfMonth !== undefined) {
          // If the day is in the past this month or doesn't exist this month
          const lastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
          const targetDay = Math.min(schedule.dayOfMonth, lastDayOfMonth);
          
          if (result.getDate() > targetDay || 
              (result.getDate() === targetDay && 
               (result.getHours() > (schedule.hour || 0) || 
                (result.getHours() === (schedule.hour || 0) && result.getMinutes() >= (schedule.minute || 0))))) {
            // Move to next month
            result.setMonth(result.getMonth() + 1);
          }
          
          // Set day, hour, and minute
          const nextLastDayOfMonth = new Date(result.getFullYear(), result.getMonth() + 1, 0).getDate();
          result.setDate(Math.min(schedule.dayOfMonth, nextLastDayOfMonth));
          result.setHours(schedule.hour || 0);
          result.setMinutes(schedule.minute || 0);
        } else {
          // If no day is specified, go to the first day of next month
          result.setMonth(result.getMonth() + 1);
          result.setDate(1);
          result.setHours(schedule.hour || 0);
          result.setMinutes(schedule.minute || 0);
        }
        break;
        
      case ScheduleFrequency.CUSTOM:
        // For custom schedules, we would need a more complex implementation
        // This is a placeholder for a custom schedule calculation
        console.warn('Custom schedule frequency not fully implemented');
        result.setDate(result.getDate() + 1);
        break;
        
      default:
        console.warn(`Unknown schedule frequency: ${schedule.frequency}`);
        return undefined;
    }
    
    return result;
  }
  
  /**
   * Get scheduled jobs count statistics
   */
  getScheduledJobsStats(): {
    total: number;
    enabled: number;
    disabled: number;
    byFrequency: Record<ScheduleFrequency, number>;
  } {
    const stats = {
      total: this.scheduledJobs.size,
      enabled: 0,
      disabled: 0,
      byFrequency: {
        [ScheduleFrequency.ONCE]: 0,
        [ScheduleFrequency.MINUTELY]: 0,
        [ScheduleFrequency.HOURLY]: 0,
        [ScheduleFrequency.DAILY]: 0,
        [ScheduleFrequency.WEEKLY]: 0,
        [ScheduleFrequency.MONTHLY]: 0,
        [ScheduleFrequency.CUSTOM]: 0
      }
    };
    
    // Count jobs by status and frequency
    for (const job of this.scheduledJobs.values()) {
      if (job.enabled) {
        stats.enabled++;
      } else {
        stats.disabled++;
      }
      
      stats.byFrequency[job.schedule.frequency]++;
    }
    
    return stats;
  }
  
  /**
   * Clear all scheduled jobs
   */
  clearScheduledJobs(): void {
    // Clear all timers
    for (const [scheduleId, timer] of this.timers) {
      clearTimeout(timer);
    }
    
    this.timers.clear();
    this.scheduledJobs.clear();
    
    console.log('All scheduled jobs cleared');
  }
  
  /**
   * Check if the scheduler is running
   */
  isRunning(): boolean {
    return this.running;
  }
}

// Export a singleton instance
export const scheduler = new Scheduler();