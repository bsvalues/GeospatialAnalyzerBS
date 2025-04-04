import { JobFrequency } from './ETLTypes';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Type for scheduled job callback
 */
export type JobCallback = () => Promise<void> | void;

/**
 * Interface for a scheduled job
 */
export interface ScheduledJob {
  /** Job ID */
  id: string;
  
  /** Job schedule (cron expression) */
  schedule: string;
  
  /** Next run date */
  nextRunAt?: Date;
  
  /** Job callback */
  callback: JobCallback;
  
  /** Whether the job is enabled */
  enabled: boolean;
}

/**
 * Check if the current date and time matches the cron expression
 * 
 * Note: This is a simplified cron implementation and doesn't support all features
 */
function matchesCron(date: Date, cronExpression: string): boolean {
  // Parse cron expression
  const [minute, hour, dayOfMonth, month, dayOfWeek] = cronExpression.split(' ');
  
  const currentMinute = date.getMinutes();
  const currentHour = date.getHours();
  const currentDayOfMonth = date.getDate();
  const currentMonth = date.getMonth() + 1; // 1-12
  const currentDayOfWeek = date.getDay(); // 0-6, Sunday is 0
  
  // Helper function to check if a cron part matches
  const matches = (value: number, cronPart: string) => {
    if (cronPart === '*') {
      return true;
    }
    
    if (cronPart.includes(',')) {
      return cronPart.split(',').some(part => matches(value, part));
    }
    
    if (cronPart.includes('-')) {
      const [start, end] = cronPart.split('-').map(Number);
      return value >= start && value <= end;
    }
    
    if (cronPart.includes('/')) {
      const [range, step] = cronPart.split('/');
      const stepVal = parseInt(step, 10);
      
      if (range === '*') {
        return value % stepVal === 0;
      }
      
      const [start, end] = range.split('-').map(Number);
      if (value < start || value > end) {
        return false;
      }
      
      return (value - start) % stepVal === 0;
    }
    
    return value === parseInt(cronPart, 10);
  };
  
  // Check all cron parts
  return (
    matches(currentMinute, minute) &&
    matches(currentHour, hour) &&
    matches(currentDayOfMonth, dayOfMonth) &&
    matches(currentMonth, month) &&
    matches(currentDayOfWeek, dayOfWeek)
  );
}

/**
 * Calculate the next run date for a cron expression
 */
function getNextRunDate(cronExpression: string): Date {
  const now = new Date();
  let next = new Date(now);
  
  // Add one minute to start checking from the next minute
  next.setMinutes(next.getMinutes() + 1);
  next.setSeconds(0);
  next.setMilliseconds(0);
  
  // Look ahead up to 1 year
  const maxDate = new Date(now);
  maxDate.setFullYear(maxDate.getFullYear() + 1);
  
  // Find the next time that matches the cron
  while (next < maxDate) {
    if (matchesCron(next, cronExpression)) {
      return next;
    }
    
    // Move to the next minute
    next.setMinutes(next.getMinutes() + 1);
  }
  
  // If no match found, return a far future date
  const futureDate = new Date();
  futureDate.setFullYear(futureDate.getFullYear() + 10);
  return futureDate;
}

/**
 * Scheduler class
 * 
 * This class is responsible for scheduling and executing jobs.
 */
class Scheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timeouts: Map<string, number> = new Map();
  private interval: number | null = null;
  
  constructor() {
    // Start scheduler interval
    this.interval = window.setInterval(() => this.checkSchedule(), 60000); // Check every minute
  }
  
  /**
   * Check scheduled jobs
   */
  private checkSchedule(): void {
    const now = new Date();
    
    for (const [id, job] of this.jobs.entries()) {
      if (!job.enabled) {
        continue;
      }
      
      if (matchesCron(now, job.schedule)) {
        this.executeJob(id);
      }
      
      // Update next run date
      job.nextRunAt = getNextRunDate(job.schedule);
    }
  }
  
  /**
   * Execute a job by ID
   */
  private async executeJob(id: string): Promise<void> {
    const job = this.jobs.get(id);
    
    if (!job || !job.enabled) {
      return;
    }
    
    try {
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.JOB,
        title: `Scheduled Job Started: ${id}`,
        message: `Scheduled job "${id}" has started execution`
      });
      
      await job.callback();
      
      alertService.createAlert({
        type: AlertType.SUCCESS,
        severity: AlertSeverity.LOW,
        category: AlertCategory.JOB,
        title: `Scheduled Job Completed: ${id}`,
        message: `Scheduled job "${id}" completed successfully`
      });
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.JOB,
        title: `Scheduled Job Failed: ${id}`,
        message: `Scheduled job "${id}" failed: ${errorMessage}`
      });
    }
  }
  
  /**
   * Schedule a job
   */
  scheduleJob(id: string, schedule: string, callback: JobCallback): ScheduledJob {
    // Cancel existing job if it exists
    this.cancelJob(id);
    
    // Create job
    const job: ScheduledJob = {
      id,
      schedule,
      callback,
      enabled: true,
      nextRunAt: getNextRunDate(schedule)
    };
    
    // Store job
    this.jobs.set(id, job);
    
    // Create timeout for next run
    this.createTimeout(id);
    
    // Log job creation
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: `Job Scheduled: ${id}`,
      message: `Job "${id}" scheduled with cron expression "${schedule}". Next run: ${job.nextRunAt?.toLocaleString()}`
    });
    
    return job;
  }
  
  /**
   * Create timeout for a job to run at the next scheduled time
   */
  private createTimeout(id: string): void {
    const job = this.jobs.get(id);
    
    if (!job || !job.enabled || !job.nextRunAt) {
      return;
    }
    
    // Clear existing timeout
    this.clearTimeout(id);
    
    // Calculate time until next run
    const now = new Date();
    const timeUntilNextRun = Math.max(0, job.nextRunAt.getTime() - now.getTime());
    
    // Create timeout
    const timeout = window.setTimeout(() => {
      this.executeJob(id);
      this.createTimeout(id); // Schedule next run
    }, timeUntilNextRun);
    
    // Store timeout ID
    this.timeouts.set(id, timeout);
  }
  
  /**
   * Clear timeout for a job
   */
  private clearTimeout(id: string): void {
    const timeout = this.timeouts.get(id);
    
    if (timeout !== undefined) {
      window.clearTimeout(timeout);
      this.timeouts.delete(id);
    }
  }
  
  /**
   * Cancel a job
   */
  cancelJob(id: string): boolean {
    // Clear timeout
    this.clearTimeout(id);
    
    // Remove job
    const job = this.jobs.get(id);
    
    if (!job) {
      return false;
    }
    
    this.jobs.delete(id);
    
    return true;
  }
  
  /**
   * Cancel all jobs
   */
  cancelAllJobs(): void {
    // Clear all timeouts
    for (const [id] of this.timeouts.entries()) {
      this.clearTimeout(id);
    }
    
    // Remove all jobs
    this.jobs.clear();
  }
  
  /**
   * Get a job by ID
   */
  getJob(id: string): ScheduledJob | undefined {
    return this.jobs.get(id);
  }
  
  /**
   * Get all jobs
   */
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }
  
  /**
   * Get the next run date for a job
   */
  getNextRunDate(id: string): Date | undefined {
    const job = this.jobs.get(id);
    return job?.nextRunAt;
  }
  
  /**
   * Get the next run date for a cron expression
   */
  getNextRunDateForCron(cronExpression: string): Date {
    return getNextRunDate(cronExpression);
  }
  
  /**
   * Enable a job
   */
  enableJob(id: string): ScheduledJob | undefined {
    const job = this.jobs.get(id);
    
    if (!job) {
      return undefined;
    }
    
    job.enabled = true;
    job.nextRunAt = getNextRunDate(job.schedule);
    
    // Create timeout for next run
    this.createTimeout(id);
    
    return job;
  }
  
  /**
   * Disable a job
   */
  disableJob(id: string): ScheduledJob | undefined {
    const job = this.jobs.get(id);
    
    if (!job) {
      return undefined;
    }
    
    job.enabled = false;
    
    // Clear timeout
    this.clearTimeout(id);
    
    return job;
  }
  
  /**
   * Get schedule description
   */
  getScheduleDescription(schedule: string): string {
    const [minute, hour, dayOfMonth, month, dayOfWeek] = schedule.split(' ');
    
    if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 'Every minute';
    }
    
    if (minute === '0' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 'Every hour, on the hour';
    }
    
    if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
      return 'Every day at midnight';
    }
    
    if (minute === '0' && hour === '0' && dayOfMonth === '*' && month === '*' && dayOfWeek === '0') {
      return 'Every Sunday at midnight';
    }
    
    if (minute === '0' && hour === '0' && dayOfMonth === '1' && month === '*' && dayOfWeek === '*') {
      return 'First day of every month at midnight';
    }
    
    return `Cron: ${schedule}`;
  }
  
  /**
   * Get schedule for job frequency
   */
  getScheduleForFrequency(frequency: JobFrequency): string {
    switch (frequency) {
      case JobFrequency.MINUTELY:
        return '* * * * *'; // Every minute
        
      case JobFrequency.HOURLY:
        return '0 * * * *'; // On the hour, every hour
        
      case JobFrequency.DAILY:
        return '0 0 * * *'; // Midnight every day
        
      case JobFrequency.WEEKLY:
        return '0 0 * * 0'; // Midnight on Sunday
        
      case JobFrequency.MONTHLY:
        return '0 0 1 * *'; // Midnight on the 1st of each month
        
      case JobFrequency.ONCE:
      case JobFrequency.CUSTOM:
      default:
        return '0 0 * * *'; // Default to midnight every day
    }
  }
}

// Export singleton instance
export const scheduler = new Scheduler();