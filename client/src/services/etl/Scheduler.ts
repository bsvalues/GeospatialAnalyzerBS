import { ETLJob, JobSchedule, JobStatus } from './ETLTypes';

/**
 * Scheduler manages scheduling and execution of ETL jobs
 */
class Scheduler {
  private scheduledJobs: Map<string, ScheduledJob>;
  private clock: any; // Timer reference
  private running: boolean;
  private tickInterval: number; // milliseconds
  
  constructor() {
    this.scheduledJobs = new Map();
    this.running = false;
    this.tickInterval = 60000; // Check every minute
  }
  
  /**
   * Initialize the scheduler
   */
  initialize(): void {
    if (this.running) return;
    
    console.log('Initializing ETL job scheduler');
    this.running = true;
    this.startClock();
  }
  
  /**
   * Shutdown the scheduler
   */
  shutdown(): void {
    if (!this.running) return;
    
    console.log('Shutting down ETL job scheduler');
    this.running = false;
    this.stopClock();
  }
  
  /**
   * Schedule a job
   */
  scheduleJob(job: ETLJob, onExecute: (jobId: string) => Promise<void>): void {
    // Only schedule enabled jobs with a schedule
    if (!job.enabled || !job.schedule) {
      return;
    }
    
    const jobId = job.id;
    console.log(`Scheduling job: ${job.name} (${jobId})`);
    
    // Create scheduled job
    const scheduledJob: ScheduledJob = {
      jobId,
      name: job.name,
      schedule: { ...job.schedule },
      status: JobStatus.IDLE,
      onExecute,
      lastRun: job.schedule.lastRun,
      nextRun: this.calculateNextRun(job.schedule)
    };
    
    // Add to scheduled jobs
    this.scheduledJobs.set(jobId, scheduledJob);
    
    console.log(`Next run for job ${job.name}: ${scheduledJob.nextRun}`);
  }
  
  /**
   * Update a job schedule
   */
  updateJobSchedule(jobId: string, schedule: JobSchedule): void {
    const job = this.scheduledJobs.get(jobId);
    
    if (!job) {
      console.warn(`Cannot update schedule for unknown job: ${jobId}`);
      return;
    }
    
    console.log(`Updating schedule for job: ${job.name} (${jobId})`);
    
    job.schedule = { ...schedule };
    job.nextRun = this.calculateNextRun(schedule);
    
    console.log(`Next run updated for job ${job.name}: ${job.nextRun}`);
  }
  
  /**
   * Unschedule a job
   */
  unscheduleJob(jobId: string): void {
    if (!this.scheduledJobs.has(jobId)) {
      return;
    }
    
    const job = this.scheduledJobs.get(jobId);
    console.log(`Unscheduling job: ${job?.name} (${jobId})`);
    
    this.scheduledJobs.delete(jobId);
  }
  
  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): ScheduledJob[] {
    return Array.from(this.scheduledJobs.values());
  }
  
  /**
   * Get a scheduled job by ID
   */
  getScheduledJob(jobId: string): ScheduledJob | undefined {
    return this.scheduledJobs.get(jobId);
  }
  
  /**
   * Force a job to run immediately
   */
  async runJobNow(jobId: string): Promise<void> {
    const job = this.scheduledJobs.get(jobId);
    
    if (!job) {
      console.warn(`Cannot run unknown job: ${jobId}`);
      return;
    }
    
    if (job.status === JobStatus.RUNNING) {
      console.warn(`Job is already running: ${job.name} (${jobId})`);
      return;
    }
    
    console.log(`Running job immediately: ${job.name} (${jobId})`);
    
    try {
      job.status = JobStatus.RUNNING;
      await job.onExecute(jobId);
      job.status = JobStatus.COMPLETED;
      job.lastRun = new Date();
      
      // Update run count
      if (job.schedule.runCount !== undefined) {
        job.schedule.runCount++;
      } else {
        job.schedule.runCount = 1;
      }
      
      // Calculate next run
      job.nextRun = this.calculateNextRun(job.schedule);
      
      console.log(`Job completed successfully: ${job.name} (${jobId})`);
      console.log(`Next run scheduled for: ${job.nextRun}`);
    } catch (error) {
      console.error(`Error running job ${job.name} (${jobId}):`, error);
      job.status = JobStatus.FAILED;
    }
  }
  
  /**
   * Start the scheduler clock
   */
  private startClock(): void {
    // Clear any existing timer
    this.stopClock();
    
    // Start ticking
    this.clock = setInterval(() => this.tick(), this.tickInterval);
    console.log(`Scheduler clock started, checking every ${this.tickInterval / 1000} seconds`);
    
    // Run a tick immediately
    this.tick();
  }
  
  /**
   * Stop the scheduler clock
   */
  private stopClock(): void {
    if (this.clock) {
      clearInterval(this.clock);
      this.clock = null;
    }
  }
  
  /**
   * Tick the scheduler clock
   */
  private tick(): void {
    if (!this.running) return;
    
    const now = new Date();
    
    // Check for jobs that need to run
    for (const job of this.scheduledJobs.values()) {
      // Skip jobs that are already running
      if (job.status === JobStatus.RUNNING) {
        continue;
      }
      
      // Check if job should run
      if (job.nextRun && job.nextRun <= now) {
        console.log(`Job due to run: ${job.name} (${job.jobId})`);
        this.runJobNow(job.jobId).catch(error => {
          console.error(`Error executing job ${job.name} (${job.jobId}):`, error);
        });
      }
    }
  }
  
  /**
   * Calculate the next run time for a job
   */
  private calculateNextRun(schedule: JobSchedule): Date | null {
    const { expression } = schedule;
    
    if (!expression) {
      return null;
    }
    
    const now = new Date();
    
    try {
      // Parse cron-like expression
      switch (expression.toLowerCase()) {
        case 'once':
          // If already run, don't schedule again
          if (schedule.runCount && schedule.runCount > 0) {
            return null;
          }
          // Otherwise, run immediately
          return now;
        
        case 'hourly':
          // Next hour
          const hourly = new Date(now);
          hourly.setHours(hourly.getHours() + 1);
          hourly.setMinutes(0);
          hourly.setSeconds(0);
          hourly.setMilliseconds(0);
          return hourly;
        
        case 'daily':
          // Tomorrow, same time
          const daily = new Date(now);
          daily.setDate(daily.getDate() + 1);
          return daily;
        
        case 'weekly':
          // Next week, same day and time
          const weekly = new Date(now);
          weekly.setDate(weekly.getDate() + 7);
          return weekly;
        
        case 'monthly':
          // Next month, same day and time
          const monthly = new Date(now);
          monthly.setMonth(monthly.getMonth() + 1);
          return monthly;
        
        default:
          // Try to parse as a specific date/time
          try {
            const specificTime = new Date(expression);
            if (!isNaN(specificTime.getTime())) {
              return specificTime;
            }
          } catch (e) {
            // Not a valid date
          }
          
          console.warn(`Unsupported schedule expression: ${expression}`);
          return null;
      }
    } catch (error) {
      console.error(`Error calculating next run for schedule '${expression}':`, error);
      return null;
    }
  }
}

/**
 * Scheduled job interface
 */
export interface ScheduledJob {
  jobId: string;
  name: string;
  schedule: JobSchedule;
  status: JobStatus;
  onExecute: (jobId: string) => Promise<void>;
  lastRun?: Date;
  nextRun: Date | null;
}

// Export a singleton instance
export const scheduler = new Scheduler();