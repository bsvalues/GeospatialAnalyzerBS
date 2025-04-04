import { ScheduleFrequency } from './ETLTypes';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Schedule configuration
 */
export interface ScheduleConfig {
  /** Schedule frequency */
  frequency: ScheduleFrequency;
  
  /** Start date */
  startDate?: Date;
  
  /** End date */
  endDate?: Date;
  
  /** Maximum number of executions */
  maxExecutions?: number;
  
  /** Whether the schedule is enabled */
  enabled: boolean;
  
  /** Specific time of day (HH:MM format) */
  timeOfDay?: string;
  
  /** Days of week (0-6, where 0 is Sunday) */
  daysOfWeek?: number[];
  
  /** Days of month (1-31) */
  daysOfMonth?: number[];
  
  /** Months (1-12) */
  months?: number[];
  
  /** Interval in minutes (for MINUTELY frequency) */
  minuteInterval?: number;
  
  /** Interval in hours (for HOURLY frequency) */
  hourInterval?: number;
  
  /** Custom cron expression (for CUSTOM frequency) */
  cronExpression?: string;
}

/**
 * Scheduled job interface
 */
export interface ScheduledJob {
  /** Job ID */
  id: string;
  
  /** Job name */
  name: string;
  
  /** Schedule configuration */
  schedule: ScheduleConfig;
  
  /** Next execution date */
  nextExecution?: Date;
  
  /** Last execution date */
  lastExecution?: Date;
  
  /** Execution count */
  executionCount: number;
  
  /** Job function */
  jobFn: () => Promise<any>;
  
  /** Creation date */
  createdAt: Date;
  
  /** Last update date */
  updatedAt: Date;
}

/**
 * Job execution result
 */
export interface JobExecutionResult {
  /** Job ID */
  jobId: string;
  
  /** Execution start time */
  startTime: Date;
  
  /** Execution end time */
  endTime: Date;
  
  /** Whether the execution was successful */
  success: boolean;
  
  /** Result data */
  result?: any;
  
  /** Error message */
  error?: string;
  
  /** Execution duration in milliseconds */
  duration: number;
}

/**
 * Schedule service
 */
class Scheduler {
  private jobs: Map<string, ScheduledJob> = new Map();
  private timers: Map<string, ReturnType<typeof setTimeout>> = new Map();
  private executionHistory: JobExecutionResult[] = [];
  private nextId = 1;
  
  constructor() {
    // Set up recurring maintenance to clean up old timers
    setInterval(() => this.maintenance(), 60 * 60 * 1000); // Every hour
  }
  
  /**
   * Perform maintenance on the scheduler
   */
  private maintenance(): void {
    // Clear any stale timers
    for (const [jobId, timer] of this.timers.entries()) {
      const job = this.jobs.get(jobId);
      
      if (!job || !job.schedule.enabled) {
        clearTimeout(timer);
        this.timers.delete(jobId);
      }
    }
    
    // Limit history size
    if (this.executionHistory.length > 1000) {
      this.executionHistory = this.executionHistory.slice(-1000);
    }
  }
  
  /**
   * Schedule a job
   */
  scheduleJob(name: string, schedule: ScheduleConfig, jobFn: () => Promise<any>): string {
    const id = `job-${this.nextId++}`;
    const now = new Date();
    
    const job: ScheduledJob = {
      id,
      name,
      schedule,
      executionCount: 0,
      jobFn,
      createdAt: now,
      updatedAt: now
    };
    
    this.jobs.set(id, job);
    
    if (schedule.enabled) {
      this.scheduleNextExecution(job);
    }
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: `Job Scheduled: ${name}`,
      message: `Job "${name}" (ID: ${id}) has been scheduled with frequency: ${schedule.frequency}`
    });
    
    return id;
  }
  
  /**
   * Schedule the next execution of a job
   */
  private scheduleNextExecution(job: ScheduledJob): void {
    // Clear any existing timer
    if (this.timers.has(job.id)) {
      clearTimeout(this.timers.get(job.id)!);
      this.timers.delete(job.id);
    }
    
    if (!job.schedule.enabled) {
      return;
    }
    
    // Calculate next execution time
    const nextExecution = this.calculateNextExecution(job);
    
    if (!nextExecution) {
      return;
    }
    
    // Update job
    job.nextExecution = nextExecution;
    job.updatedAt = new Date();
    
    // Schedule timer
    const delay = Math.max(0, nextExecution.getTime() - Date.now());
    
    const timer = setTimeout(() => {
      this.executeJob(job);
    }, delay);
    
    this.timers.set(job.id, timer);
  }
  
  /**
   * Calculate the next execution time for a job
   */
  private calculateNextExecution(job: ScheduledJob): Date | null {
    const now = new Date();
    let nextExecution: Date | null = null;
    
    // Check if job has reached max executions
    if (job.schedule.maxExecutions && job.executionCount >= job.schedule.maxExecutions) {
      return null;
    }
    
    // Check if job has passed end date
    if (job.schedule.endDate && now > job.schedule.endDate) {
      return null;
    }
    
    switch (job.schedule.frequency) {
      case ScheduleFrequency.ONCE:
        // For one-time execution, use start date or now if not specified
        nextExecution = job.schedule.startDate || now;
        break;
        
      case ScheduleFrequency.MINUTELY:
        // Execute every N minutes
        const minuteInterval = job.schedule.minuteInterval || 1;
        nextExecution = new Date(now);
        nextExecution.setMinutes(now.getMinutes() + minuteInterval);
        break;
        
      case ScheduleFrequency.HOURLY:
        // Execute every N hours
        const hourInterval = job.schedule.hourInterval || 1;
        nextExecution = new Date(now);
        nextExecution.setHours(now.getHours() + hourInterval);
        break;
        
      case ScheduleFrequency.DAILY:
        // Execute daily at specified time
        nextExecution = this.getNextDailyExecution(job, now);
        break;
        
      case ScheduleFrequency.WEEKLY:
        // Execute weekly on specified days
        nextExecution = this.getNextWeeklyExecution(job, now);
        break;
        
      case ScheduleFrequency.MONTHLY:
        // Execute monthly on specified days
        nextExecution = this.getNextMonthlyExecution(job, now);
        break;
        
      default:
        // Default to daily execution
        nextExecution = new Date(now);
        nextExecution.setDate(now.getDate() + 1);
        break;
    }
    
    // If next execution is in the past, move it to future
    if (nextExecution && nextExecution < now) {
      if (job.schedule.frequency === ScheduleFrequency.ONCE) {
        // One-time jobs that are in the past will execute immediately
        nextExecution = new Date(now.getTime() + 1000); // 1 second delay
      } else {
        // Recurring jobs should find the next valid time after now
        nextExecution = this.adjustExecutionTimeToFuture(job, nextExecution, now);
      }
    }
    
    return nextExecution;
  }
  
  /**
   * Get the next daily execution time
   */
  private getNextDailyExecution(job: ScheduledJob, now: Date): Date {
    const nextExecution = new Date(now);
    
    // If time of day is specified, use it
    if (job.schedule.timeOfDay) {
      const [hours, minutes] = job.schedule.timeOfDay.split(':').map(Number);
      nextExecution.setHours(hours, minutes, 0, 0);
      
      // If the time has already passed today, move to tomorrow
      if (nextExecution <= now) {
        nextExecution.setDate(nextExecution.getDate() + 1);
      }
    } else {
      // Default to same time tomorrow
      nextExecution.setDate(nextExecution.getDate() + 1);
    }
    
    return nextExecution;
  }
  
  /**
   * Get the next weekly execution time
   */
  private getNextWeeklyExecution(job: ScheduledJob, now: Date): Date {
    const nextExecution = new Date(now);
    const currentDay = now.getDay();
    
    let daysToAdd = 1;
    
    // If days of week are specified, find the next matching day
    if (job.schedule.daysOfWeek && job.schedule.daysOfWeek.length > 0) {
      const nextDays = job.schedule.daysOfWeek
        .filter(day => day > currentDay || (day === currentDay && this.timeHasNotPassedToday(job, now)))
        .sort((a, b) => a - b);
      
      if (nextDays.length > 0) {
        // Found a day later this week
        daysToAdd = nextDays[0] - currentDay;
      } else {
        // Wrap around to next week
        const firstDayNextWeek = Math.min(...job.schedule.daysOfWeek);
        daysToAdd = 7 - currentDay + firstDayNextWeek;
      }
    } else {
      // Default to same day next week
      daysToAdd = 7;
    }
    
    nextExecution.setDate(nextExecution.getDate() + daysToAdd);
    
    // Set specific time if provided
    if (job.schedule.timeOfDay) {
      const [hours, minutes] = job.schedule.timeOfDay.split(':').map(Number);
      nextExecution.setHours(hours, minutes, 0, 0);
    }
    
    return nextExecution;
  }
  
  /**
   * Get the next monthly execution time
   */
  private getNextMonthlyExecution(job: ScheduledJob, now: Date): Date {
    const nextExecution = new Date(now);
    const currentDay = now.getDate();
    const currentMonth = now.getMonth();
    
    // If days of month are specified, find the next matching day
    if (job.schedule.daysOfMonth && job.schedule.daysOfMonth.length > 0) {
      const nextDays = job.schedule.daysOfMonth
        .filter(day => day > currentDay || (day === currentDay && this.timeHasNotPassedToday(job, now)))
        .sort((a, b) => a - b);
      
      if (nextDays.length > 0) {
        // Found a day later this month
        nextExecution.setDate(nextDays[0]);
      } else {
        // Move to next month
        nextExecution.setMonth(currentMonth + 1);
        nextExecution.setDate(Math.min(...job.schedule.daysOfMonth));
      }
    } else {
      // Default to same day next month
      nextExecution.setMonth(currentMonth + 1);
    }
    
    // Set specific time if provided
    if (job.schedule.timeOfDay) {
      const [hours, minutes] = job.schedule.timeOfDay.split(':').map(Number);
      nextExecution.setHours(hours, minutes, 0, 0);
    }
    
    return nextExecution;
  }
  
  /**
   * Check if the scheduled time has not passed yet today
   */
  private timeHasNotPassedToday(job: ScheduledJob, now: Date): boolean {
    if (!job.schedule.timeOfDay) {
      return false;
    }
    
    const [hours, minutes] = job.schedule.timeOfDay.split(':').map(Number);
    const scheduledTime = new Date(now);
    scheduledTime.setHours(hours, minutes, 0, 0);
    
    return scheduledTime > now;
  }
  
  /**
   * Adjust execution time to ensure it's in the future
   */
  private adjustExecutionTimeToFuture(job: ScheduledJob, nextExecution: Date, now: Date): Date {
    const frequency = job.schedule.frequency;
    
    switch (frequency) {
      case ScheduleFrequency.MINUTELY:
        const minuteInterval = job.schedule.minuteInterval || 1;
        while (nextExecution <= now) {
          nextExecution.setMinutes(nextExecution.getMinutes() + minuteInterval);
        }
        break;
        
      case ScheduleFrequency.HOURLY:
        const hourInterval = job.schedule.hourInterval || 1;
        while (nextExecution <= now) {
          nextExecution.setHours(nextExecution.getHours() + hourInterval);
        }
        break;
        
      case ScheduleFrequency.DAILY:
        while (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 1);
        }
        break;
        
      case ScheduleFrequency.WEEKLY:
        while (nextExecution <= now) {
          nextExecution.setDate(nextExecution.getDate() + 7);
        }
        break;
        
      case ScheduleFrequency.MONTHLY:
        while (nextExecution <= now) {
          nextExecution.setMonth(nextExecution.getMonth() + 1);
        }
        break;
    }
    
    return nextExecution;
  }
  
  /**
   * Execute a job
   */
  private async executeJob(job: ScheduledJob): Promise<void> {
    const startTime = new Date();
    const result: JobExecutionResult = {
      jobId: job.id,
      startTime,
      endTime: startTime, // Will be updated
      success: false,
      duration: 0
    };
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: `Job Executing: ${job.name}`,
      message: `Job "${job.name}" (ID: ${job.id}) is now executing`
    });
    
    try {
      // Execute the job
      result.result = await job.jobFn();
      result.success = true;
      
      alertService.createAlert({
        type: AlertType.SUCCESS,
        severity: AlertSeverity.LOW,
        category: AlertCategory.SCHEDULING,
        title: `Job Completed: ${job.name}`,
        message: `Job "${job.name}" (ID: ${job.id}) completed successfully`
      });
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.SCHEDULING,
        title: `Job Failed: ${job.name}`,
        message: `Job "${job.name}" (ID: ${job.id}) failed: ${result.error}`
      });
    } finally {
      // Update result
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      
      // Add to history
      this.executionHistory.push(result);
      
      // Update job
      job.lastExecution = result.endTime;
      job.executionCount++;
      job.updatedAt = result.endTime;
      
      // Schedule next execution
      this.scheduleNextExecution(job);
    }
  }
  
  /**
   * Get a job by ID
   */
  getJob(id: string): ScheduledJob | undefined {
    return this.jobs.get(id);
  }
  
  /**
   * Get all scheduled jobs
   */
  getAllJobs(): ScheduledJob[] {
    return Array.from(this.jobs.values());
  }
  
  /**
   * Update a job's schedule
   */
  updateJobSchedule(id: string, schedule: ScheduleConfig): boolean {
    const job = this.jobs.get(id);
    
    if (!job) {
      return false;
    }
    
    job.schedule = schedule;
    job.updatedAt = new Date();
    
    // Re-schedule next execution
    this.scheduleNextExecution(job);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: `Job Schedule Updated: ${job.name}`,
      message: `Job "${job.name}" (ID: ${id}) schedule has been updated`
    });
    
    return true;
  }
  
  /**
   * Enable a job
   */
  enableJob(id: string): boolean {
    const job = this.jobs.get(id);
    
    if (!job) {
      return false;
    }
    
    job.schedule.enabled = true;
    job.updatedAt = new Date();
    
    // Schedule next execution
    this.scheduleNextExecution(job);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: `Job Enabled: ${job.name}`,
      message: `Job "${job.name}" (ID: ${id}) has been enabled`
    });
    
    return true;
  }
  
  /**
   * Disable a job
   */
  disableJob(id: string): boolean {
    const job = this.jobs.get(id);
    
    if (!job) {
      return false;
    }
    
    job.schedule.enabled = false;
    job.updatedAt = new Date();
    
    // Clear timer
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
      this.timers.delete(id);
    }
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: `Job Disabled: ${job.name}`,
      message: `Job "${job.name}" (ID: ${id}) has been disabled`
    });
    
    return true;
  }
  
  /**
   * Delete a job
   */
  deleteJob(id: string): boolean {
    const job = this.jobs.get(id);
    
    if (!job) {
      return false;
    }
    
    // Clear timer
    if (this.timers.has(id)) {
      clearTimeout(this.timers.get(id)!);
      this.timers.delete(id);
    }
    
    // Remove job
    this.jobs.delete(id);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: `Job Deleted: ${job.name}`,
      message: `Job "${job.name}" (ID: ${id}) has been deleted`
    });
    
    return true;
  }
  
  /**
   * Execute a job manually
   */
  async executeJobManually(id: string): Promise<JobExecutionResult | null> {
    const job = this.jobs.get(id);
    
    if (!job) {
      return null;
    }
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: `Job Executing Manually: ${job.name}`,
      message: `Job "${job.name}" (ID: ${id}) is executing manually`
    });
    
    const startTime = new Date();
    const result: JobExecutionResult = {
      jobId: id,
      startTime,
      endTime: startTime, // Will be updated
      success: false,
      duration: 0
    };
    
    try {
      // Execute the job
      result.result = await job.jobFn();
      result.success = true;
      
      alertService.createAlert({
        type: AlertType.SUCCESS,
        severity: AlertSeverity.LOW,
        category: AlertCategory.SCHEDULING,
        title: `Manual Job Completed: ${job.name}`,
        message: `Job "${job.name}" (ID: ${id}) completed manually`
      });
    } catch (error) {
      result.error = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.SCHEDULING,
        title: `Manual Job Failed: ${job.name}`,
        message: `Job "${job.name}" (ID: ${id}) failed during manual execution: ${result.error}`
      });
    } finally {
      // Update result
      result.endTime = new Date();
      result.duration = result.endTime.getTime() - result.startTime.getTime();
      
      // Add to history
      this.executionHistory.push(result);
      
      // Update job
      job.lastExecution = result.endTime;
      job.executionCount++;
      job.updatedAt = result.endTime;
    }
    
    return result;
  }
  
  /**
   * Get job execution history
   */
  getExecutionHistory(jobId?: string): JobExecutionResult[] {
    if (jobId) {
      return this.executionHistory.filter(result => result.jobId === jobId);
    }
    
    return this.executionHistory;
  }
  
  /**
   * Get job statistics
   */
  getJobStatistics(): {
    totalJobs: number;
    enabledJobs: number;
    disabledJobs: number;
    jobsByFrequency: Record<ScheduleFrequency, number>;
    totalExecutions: number;
    successfulExecutions: number;
    failedExecutions: number;
  } {
    const stats = {
      totalJobs: this.jobs.size,
      enabledJobs: 0,
      disabledJobs: 0,
      jobsByFrequency: {
        [ScheduleFrequency.ONCE]: 0,
        [ScheduleFrequency.MINUTELY]: 0,
        [ScheduleFrequency.HOURLY]: 0,
        [ScheduleFrequency.DAILY]: 0,
        [ScheduleFrequency.WEEKLY]: 0,
        [ScheduleFrequency.MONTHLY]: 0,
        [ScheduleFrequency.CUSTOM]: 0
      },
      totalExecutions: this.executionHistory.length,
      successfulExecutions: 0,
      failedExecutions: 0
    };
    
    // Calculate job statistics
    for (const job of this.jobs.values()) {
      if (job.schedule.enabled) {
        stats.enabledJobs++;
      } else {
        stats.disabledJobs++;
      }
      
      stats.jobsByFrequency[job.schedule.frequency]++;
    }
    
    // Calculate execution statistics
    for (const execution of this.executionHistory) {
      if (execution.success) {
        stats.successfulExecutions++;
      } else {
        stats.failedExecutions++;
      }
    }
    
    return stats;
  }
}

// Export a singleton instance
export const scheduler = new Scheduler();