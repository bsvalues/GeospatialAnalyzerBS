/**
 * ETLPipelineManager.ts
 * 
 * Manages ETL pipelines, scheduling, and execution
 */

import { etlPipeline } from './ETLPipeline';
import {
  ETLJob,
  JobStatus,
  JobFrequency,
  JobSchedule,
  TransformationRule
} from './ETLTypes';

class ETLPipelineManager {
  private scheduledJobs: Map<number, {
    job: ETLJob;
    transformationRules: TransformationRule[];
    nextRunTimeout?: NodeJS.Timeout;
  }> = new Map();
  
  /**
   * Schedule a job for execution based on its schedule
   */
  scheduleJob(job: ETLJob, transformationRules: TransformationRule[]): boolean {
    // Skip if job has no schedule
    if (!job.schedule) {
      console.warn(`Job ${job.id} has no schedule defined`);
      return false;
    }
    
    // Skip if job is already scheduled
    if (this.scheduledJobs.has(job.id)) {
      console.warn(`Job ${job.id} is already scheduled`);
      return false;
    }
    
    // Calculate next run time
    const nextRunTime = this.calculateNextRunTime(job.schedule);
    
    if (!nextRunTime) {
      console.warn(`Could not determine next run time for job ${job.id}`);
      return false;
    }
    
    // Store the job in scheduled jobs
    this.scheduledJobs.set(job.id, {
      job,
      transformationRules
    });
    
    // Schedule the job
    this.scheduleNextRun(job.id, nextRunTime);
    
    console.log(`Job ${job.id} scheduled to run at ${nextRunTime.toISOString()}`);
    return true;
  }
  
  /**
   * Unschedule a job
   */
  unscheduleJob(jobId: number): boolean {
    const scheduledJob = this.scheduledJobs.get(jobId);
    
    if (!scheduledJob) {
      console.warn(`Job ${jobId} is not scheduled`);
      return false;
    }
    
    // Clear the timeout if exists
    if (scheduledJob.nextRunTimeout) {
      clearTimeout(scheduledJob.nextRunTimeout);
    }
    
    // Remove from scheduled jobs
    this.scheduledJobs.delete(jobId);
    
    console.log(`Job ${jobId} unscheduled`);
    return true;
  }
  
  /**
   * Update the schedule for a job
   */
  updateJobSchedule(jobId: number, schedule: JobSchedule): boolean {
    const scheduledJob = this.scheduledJobs.get(jobId);
    
    if (!scheduledJob) {
      console.warn(`Job ${jobId} is not scheduled`);
      return false;
    }
    
    // Update the job schedule
    scheduledJob.job.schedule = schedule;
    
    // Clear existing timeout
    if (scheduledJob.nextRunTimeout) {
      clearTimeout(scheduledJob.nextRunTimeout);
    }
    
    // Calculate new next run time
    const nextRunTime = this.calculateNextRunTime(schedule);
    
    if (!nextRunTime) {
      console.warn(`Could not determine next run time for job ${jobId}`);
      this.scheduledJobs.delete(jobId);
      return false;
    }
    
    // Schedule the next run
    this.scheduleNextRun(jobId, nextRunTime);
    
    console.log(`Job ${jobId} rescheduled to run at ${nextRunTime.toISOString()}`);
    return true;
  }
  
  /**
   * Get all scheduled jobs
   */
  getScheduledJobs(): { jobId: number; nextRunTime: Date | null }[] {
    return Array.from(this.scheduledJobs.entries()).map(([jobId, { job, nextRunTimeout }]) => ({
      jobId,
      nextRunTime: job.nextRun || null
    }));
  }
  
  /**
   * Execute a job immediately
   */
  async executeJob(jobId: number): Promise<boolean> {
    const scheduledJob = this.scheduledJobs.get(jobId);
    
    if (!scheduledJob) {
      console.warn(`Job ${jobId} is not found in scheduler`);
      return false;
    }
    
    try {
      console.log(`Manually executing job ${jobId}`);
      
      // Execute the job
      const result = await etlPipeline.executeJob(scheduledJob.job, scheduledJob.transformationRules);
      
      // Update job status
      scheduledJob.job.status = result.status;
      scheduledJob.job.lastRun = new Date();
      
      // If job has schedule, calculate next run time
      if (scheduledJob.job.schedule && result.status !== JobStatus.FAILED) {
        const nextRunTime = this.calculateNextRunTime(scheduledJob.job.schedule);
        
        if (nextRunTime) {
          scheduledJob.job.nextRun = nextRunTime;
          
          // If there's an existing timeout, clear it
          if (scheduledJob.nextRunTimeout) {
            clearTimeout(scheduledJob.nextRunTimeout);
          }
          
          // Schedule the next run
          this.scheduleNextRun(jobId, nextRunTime);
        }
      }
      
      return result.status === JobStatus.COMPLETED;
    } catch (error) {
      console.error(`Error executing job ${jobId}:`, error);
      return false;
    }
  }
  
  /**
   * Check if any jobs are currently running
   */
  hasRunningJobs(): boolean {
    return Array.from(this.scheduledJobs.values()).some(({ job }) => job.status === JobStatus.RUNNING);
  }
  
  // Private methods
  
  private calculateNextRunTime(schedule: JobSchedule): Date | null {
    const now = new Date();
    let nextRun: Date | null = null;
    
    // If start time is in the future, use that
    if (schedule.startTime && new Date(schedule.startTime) > now) {
      nextRun = new Date(schedule.startTime);
    } else {
      // Calculate based on frequency
      switch (schedule.frequency) {
        case JobFrequency.ONCE:
          // For once, if start time is in the past, don't schedule
          if (schedule.startTime && new Date(schedule.startTime) > now) {
            nextRun = new Date(schedule.startTime);
          }
          break;
          
        case JobFrequency.HOURLY:
          nextRun = new Date(now);
          nextRun.setHours(nextRun.getHours() + 1);
          nextRun.setMinutes(0);
          nextRun.setSeconds(0);
          nextRun.setMilliseconds(0);
          break;
          
        case JobFrequency.DAILY:
          nextRun = new Date(now);
          nextRun.setDate(nextRun.getDate() + 1);
          nextRun.setHours(0);
          nextRun.setMinutes(0);
          nextRun.setSeconds(0);
          nextRun.setMilliseconds(0);
          break;
          
        case JobFrequency.WEEKLY:
          nextRun = new Date(now);
          // Calculate days until next occurrence
          const daysUntilNextRun = schedule.daysOfWeek && schedule.daysOfWeek.length > 0
            ? this.calculateDaysUntilNextWeekday(now.getDay(), schedule.daysOfWeek)
            : 7; // Default to 7 days if no specific days
          nextRun.setDate(nextRun.getDate() + daysUntilNextRun);
          nextRun.setHours(0);
          nextRun.setMinutes(0);
          nextRun.setSeconds(0);
          nextRun.setMilliseconds(0);
          break;
          
        case JobFrequency.MONTHLY:
          nextRun = new Date(now);
          // Move to next month
          nextRun.setMonth(nextRun.getMonth() + 1);
          // Set specific day of month if specified
          if (schedule.dayOfMonth && schedule.dayOfMonth >= 1 && schedule.dayOfMonth <= 31) {
            nextRun.setDate(Math.min(schedule.dayOfMonth, this.getDaysInMonth(nextRun.getFullYear(), nextRun.getMonth())));
          } else {
            nextRun.setDate(1); // Default to first day of month
          }
          nextRun.setHours(0);
          nextRun.setMinutes(0);
          nextRun.setSeconds(0);
          nextRun.setMilliseconds(0);
          break;
          
        case JobFrequency.CUSTOM:
          // For custom frequency, we would parse the cron expression
          // This is a simplification and would need a cron parser in real implementation
          console.warn('Custom frequency scheduling not fully implemented');
          nextRun = new Date(now);
          nextRun.setDate(nextRun.getDate() + 1); // Default to daily
          break;
          
        default:
          console.warn(`Unknown job frequency: ${schedule.frequency}`);
          return null;
      }
    }
    
    // Check if the calculated next run is before the end time (if specified)
    if (schedule.endTime && nextRun && nextRun > new Date(schedule.endTime)) {
      console.log('Next run time is after schedule end time, not scheduling');
      return null;
    }
    
    return nextRun;
  }
  
  private scheduleNextRun(jobId: number, nextRunTime: Date): void {
    const scheduledJob = this.scheduledJobs.get(jobId);
    
    if (!scheduledJob) {
      console.warn(`Job ${jobId} not found in scheduled jobs`);
      return;
    }
    
    // Calculate milliseconds until next run
    const now = new Date();
    const msUntilNextRun = nextRunTime.getTime() - now.getTime();
    
    // Update job nextRun property
    scheduledJob.job.nextRun = nextRunTime;
    
    // Set timeout for next run
    const timeout = setTimeout(async () => {
      console.log(`Scheduled execution of job ${jobId}`);
      
      try {
        // Execute the job
        const result = await etlPipeline.executeJob(scheduledJob.job, scheduledJob.transformationRules);
        
        // Update job status
        scheduledJob.job.status = result.status;
        scheduledJob.job.lastRun = new Date();
        
        // Calculate next run time if not a one-time job
        if (scheduledJob.job.schedule && scheduledJob.job.schedule.frequency !== JobFrequency.ONCE) {
          const nextRunTime = this.calculateNextRunTime(scheduledJob.job.schedule);
          
          if (nextRunTime) {
            // Schedule the next run
            this.scheduleNextRun(jobId, nextRunTime);
          } else {
            console.log(`No more runs scheduled for job ${jobId}`);
            // Remove from scheduled jobs if it was a one-time job or reached end time
            this.scheduledJobs.delete(jobId);
          }
        } else {
          // One-time job completed, remove from scheduled
          this.scheduledJobs.delete(jobId);
        }
      } catch (error) {
        console.error(`Error executing scheduled job ${jobId}:`, error);
        
        // Even if job failed, try to schedule next run
        if (scheduledJob.job.schedule && scheduledJob.job.schedule.frequency !== JobFrequency.ONCE) {
          const nextRunTime = this.calculateNextRunTime(scheduledJob.job.schedule);
          
          if (nextRunTime) {
            this.scheduleNextRun(jobId, nextRunTime);
          }
        } else {
          this.scheduledJobs.delete(jobId);
        }
      }
    }, Math.max(0, msUntilNextRun));
    
    // Store the timeout reference
    scheduledJob.nextRunTimeout = timeout;
  }
  
  private calculateDaysUntilNextWeekday(currentDay: number, targetDays: number[]): number {
    // Ensure target days are valid (0-6, where 0 is Sunday)
    const validTargetDays = targetDays.filter(d => d >= 0 && d <= 6);
    
    if (validTargetDays.length === 0) {
      return 7; // Default to 7 days if no valid target days
    }
    
    // Sort the days to make the calculation easier
    validTargetDays.sort((a, b) => a - b);
    
    // Find the next day that's greater than current day
    for (const targetDay of validTargetDays) {
      if (targetDay > currentDay) {
        return targetDay - currentDay;
      }
    }
    
    // If we get here, we need to wrap around to the next week
    return 7 - currentDay + validTargetDays[0];
  }
  
  private getDaysInMonth(year: number, month: number): number {
    return new Date(year, month + 1, 0).getDate();
  }
}

// Export a singleton instance
export const etlPipelineManager = new ETLPipelineManager();