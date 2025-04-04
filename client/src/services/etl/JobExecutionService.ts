/**
 * JobExecutionService
 * 
 * This service manages the execution of ETL jobs, including scheduling, monitoring,
 * and reporting on job status. It coordinates data extraction, transformation, and loading
 * operations to ensure data moves correctly through the ETL pipeline.
 */

import { v4 as uuidv4 } from 'uuid';
import { ETLJob, ETLJobStatus, TransformationRule } from './ETLTypes';
import TransformationService from './TransformationService';
import ConnectionTestService from './ConnectionTestService';

// Job execution log entry
export interface ETLJobExecutionLog {
  id: string;
  jobId: string;
  status: ETLJobStatus;
  startTime: Date;
  endTime?: Date;
  recordsProcessed: number;
  recordsSucceeded: number;
  recordsFailed: number;
  executionTimeMs: number;
  errors: ETLExecutionError[];
  warnings: ETLExecutionWarning[];
}

// Job execution error
export interface ETLExecutionError {
  stage: 'extract' | 'transform' | 'load' | 'validation' | 'general';
  message: string;
  details?: string;
  timestamp: Date;
  transformationId?: string;
  recordIndex?: number;
}

// Job execution warning
export interface ETLExecutionWarning {
  stage: 'extract' | 'transform' | 'load' | 'validation' | 'general';
  message: string;
  details?: string;
  timestamp: Date;
  transformationId?: string;
  recordIndex?: number;
}

// Job execution metrics
export interface ETLJobMetrics {
  avgExecutionTimeMs: number;
  successRate: number;
  recordsProcessed: number;
  recordsPerSecond: number;
  lastRunStatus: ETLJobStatus;
  errorRate: number;
  lastExecutionTimeMs?: number;
}

// Job schedule helper
type JobScheduler = ReturnType<typeof setTimeout>;

/**
 * JobExecutionService class for managing ETL job execution
 */
export class JobExecutionService {
  private static instance: JobExecutionService;
  private activeJobs: Map<string, ETLJobStatus> = new Map();
  private jobExecutionLogs: Map<string, ETLJobExecutionLog[]> = new Map();
  private scheduledJobs: Map<string, JobScheduler> = new Map();
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): JobExecutionService {
    if (!JobExecutionService.instance) {
      JobExecutionService.instance = new JobExecutionService();
    }
    return JobExecutionService.instance;
  }
  
  /**
   * Execute an ETL job
   * @param job The job to execute
   * @returns Job execution log with results
   */
  public async executeJob(job: ETLJob): Promise<ETLJobExecutionLog> {
    // Generate a unique execution ID
    const executionId = uuidv4();
    
    // Create initial execution log
    const executionLog: ETLJobExecutionLog = {
      id: executionId,
      jobId: job.id,
      status: 'running',
      startTime: new Date(),
      recordsProcessed: 0,
      recordsSucceeded: 0,
      recordsFailed: 0,
      executionTimeMs: 0,
      errors: [],
      warnings: []
    };
    
    // Update job status in active jobs map
    this.activeJobs.set(job.id, 'running');
    
    // Notify job status change (in a real implementation, this might use a message bus)
    this.notifyJobStatusChange(job.id, 'running');
    
    try {
      // Record start time for performance measurement
      const startTime = Date.now();
      
      // Execute the job
      const result = await this.performJobExecution(job);
      
      // Calculate execution time
      const endTime = Date.now();
      const executionTimeMs = endTime - startTime;
      
      // Update execution log with results
      executionLog.endTime = new Date();
      executionLog.status = result.success ? 'success' : 'failed';
      executionLog.recordsProcessed = result.recordsProcessed;
      executionLog.recordsSucceeded = result.recordsSucceeded;
      executionLog.recordsFailed = result.recordsFailed;
      executionLog.executionTimeMs = executionTimeMs;
      executionLog.errors = result.errors;
      executionLog.warnings = result.warnings;
      
      // Update job status
      this.activeJobs.set(job.id, executionLog.status);
      
      // Notify job status change
      this.notifyJobStatusChange(job.id, executionLog.status);
      
      // Store execution log
      this.storeExecutionLog(job.id, executionLog);
      
      return executionLog;
    } catch (error: any) {
      // Handle unexpected errors
      const endTime = Date.now();
      
      executionLog.endTime = new Date();
      executionLog.status = 'failed';
      executionLog.executionTimeMs = endTime - startTime;
      executionLog.errors.push({
        stage: 'general',
        message: `Job execution failed: ${error.message || error}`,
        timestamp: new Date()
      });
      
      // Update job status
      this.activeJobs.set(job.id, 'failed');
      
      // Notify job status change
      this.notifyJobStatusChange(job.id, 'failed');
      
      // Store execution log
      this.storeExecutionLog(job.id, executionLog);
      
      console.error(`ETL job execution failed for job ${job.id}:`, error);
      
      return executionLog;
    }
  }
  
  /**
   * Get execution logs for a job
   * @param jobId The job ID
   * @returns Array of execution logs
   */
  public getJobExecutionLogs(jobId: string): ETLJobExecutionLog[] {
    return this.jobExecutionLogs.get(jobId) || [];
  }
  
  /**
   * Get job metrics
   * @param jobId The job ID
   * @returns Job performance metrics
   */
  public getJobMetrics(jobId: string): ETLJobMetrics | undefined {
    const logs = this.getJobExecutionLogs(jobId);
    
    if (!logs || logs.length === 0) {
      return undefined;
    }
    
    // Calculate metrics from logs
    const totalExecutionTime = logs.reduce((sum, log) => sum + log.executionTimeMs, 0);
    const avgExecutionTime = totalExecutionTime / logs.length;
    
    const successfulRuns = logs.filter(log => log.status === 'success').length;
    const successRate = (successfulRuns / logs.length) * 100;
    
    const totalRecords = logs.reduce((sum, log) => sum + log.recordsProcessed, 0);
    const totalExecutionTimeSeconds = totalExecutionTime / 1000; // Convert to seconds
    const recordsPerSecond = totalExecutionTimeSeconds > 0 
      ? totalRecords / totalExecutionTimeSeconds 
      : 0;
    
    const totalErrors = logs.reduce((sum, log) => sum + log.errors.length, 0);
    const errorRate = (totalErrors / totalRecords) * 100;
    
    const lastRun = logs[logs.length - 1];
    
    return {
      avgExecutionTimeMs: avgExecutionTime,
      successRate,
      recordsProcessed: totalRecords,
      recordsPerSecond,
      lastRunStatus: lastRun.status,
      errorRate,
      lastExecutionTimeMs: lastRun.executionTimeMs
    };
  }
  
  /**
   * Get current job status
   * @param jobId The job ID
   * @returns Current job status if available
   */
  public getJobStatus(jobId: string): ETLJobStatus | undefined {
    return this.activeJobs.get(jobId);
  }
  
  /**
   * Schedule a job for execution
   * @param job The job to schedule
   * @returns True if scheduling was successful
   */
  public scheduleJob(job: ETLJob): boolean {
    if (!job.schedule) {
      return false;
    }
    
    // Cancel any existing scheduled runs
    this.cancelJobSchedule(job.id);
    
    // Calculate next run time based on schedule
    const nextRunTime = this.calculateNextRunTime(job);
    
    if (!nextRunTime) {
      return false;
    }
    
    // Calculate delay in milliseconds
    const now = new Date();
    const delayMs = nextRunTime.getTime() - now.getTime();
    
    if (delayMs <= 0) {
      // Schedule immediately if in the past
      this.executeJob(job);
      return true;
    }
    
    // Schedule job execution
    const scheduler = setTimeout(() => {
      this.executeJob(job)
        .then(() => {
          // Re-schedule after completion if recurring
          if (job.schedule && job.schedule.frequency !== 'once') {
            this.scheduleJob(job);
          }
        })
        .catch(error => {
          console.error(`Error executing scheduled job ${job.id}:`, error);
          // Re-schedule even on error for recurring jobs
          if (job.schedule && job.schedule.frequency !== 'once') {
            this.scheduleJob(job);
          }
        });
    }, delayMs);
    
    // Store scheduler reference
    this.scheduledJobs.set(job.id, scheduler);
    
    return true;
  }
  
  /**
   * Cancel a scheduled job
   * @param jobId The job ID
   */
  public cancelJobSchedule(jobId: string): void {
    const scheduler = this.scheduledJobs.get(jobId);
    
    if (scheduler) {
      clearTimeout(scheduler);
      this.scheduledJobs.delete(jobId);
    }
  }
  
  /**
   * Pause a running job
   * @param jobId The job ID
   * @returns True if job was paused successfully
   */
  public pauseJob(jobId: string): boolean {
    const currentStatus = this.activeJobs.get(jobId);
    
    if (currentStatus === 'running') {
      this.activeJobs.set(jobId, 'paused');
      this.notifyJobStatusChange(jobId, 'paused');
      return true;
    }
    
    return false;
  }
  
  /**
   * Resume a paused job
   * @param jobId The job ID
   * @returns True if job was resumed successfully
   */
  public resumeJob(jobId: string): boolean {
    const currentStatus = this.activeJobs.get(jobId);
    
    if (currentStatus === 'paused') {
      this.activeJobs.set(jobId, 'running');
      this.notifyJobStatusChange(jobId, 'running');
      return true;
    }
    
    return false;
  }
  
  /**
   * Perform the actual job execution
   * @param job The job to execute
   * @returns Job execution result
   */
  private async performJobExecution(job: ETLJob): Promise<{
    success: boolean;
    recordsProcessed: number;
    recordsSucceeded: number;
    recordsFailed: number;
    errors: ETLExecutionError[];
    warnings: ETLExecutionWarning[];
  }> {
    // In a real implementation, this would connect to data sources and perform ETL operations
    // Here we simulate the process by calling our API
    
    try {
      // Simulate API call to execute the job
      const response = await fetch(`/api/etl/jobs/${job.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Job execution failed');
      }
      
      // Simulate successful execution with a delay for testing
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // For demo purposes, we simulate a successful job run with random metrics
      const recordsProcessed = Math.floor(Math.random() * 1000) + 100;
      const failRate = Math.random() * 0.1; // 0-10% failure rate
      const recordsFailed = Math.floor(recordsProcessed * failRate);
      const recordsSucceeded = recordsProcessed - recordsFailed;
      
      // Generate some sample warnings
      const warnings: ETLExecutionWarning[] = [];
      
      if (Math.random() > 0.7) {
        warnings.push({
          stage: 'transform',
          message: 'Some records had missing values',
          timestamp: new Date(),
          transformationId: job.transformationIds[0]
        });
      }
      
      if (Math.random() > 0.8) {
        warnings.push({
          stage: 'load',
          message: 'Slow loading performance detected',
          timestamp: new Date()
        });
      }
      
      // Generate errors for failed records
      const errors: ETLExecutionError[] = [];
      
      if (recordsFailed > 0) {
        errors.push({
          stage: 'validate',
          message: `${recordsFailed} records failed validation`,
          timestamp: new Date()
        });
      }
      
      return {
        success: recordsFailed === 0,
        recordsProcessed,
        recordsSucceeded,
        recordsFailed,
        errors,
        warnings
      };
    } catch (error: any) {
      console.error('Error during job execution:', error);
      return {
        success: false,
        recordsProcessed: 0,
        recordsSucceeded: 0,
        recordsFailed: 0,
        errors: [{
          stage: 'general',
          message: `Job execution error: ${error.message || error}`,
          timestamp: new Date()
        }],
        warnings: []
      };
    }
  }
  
  /**
   * Store execution log for a job
   * @param jobId The job ID
   * @param log The execution log to store
   */
  private storeExecutionLog(jobId: string, log: ETLJobExecutionLog): void {
    const logs = this.jobExecutionLogs.get(jobId) || [];
    logs.push(log);
    this.jobExecutionLogs.set(jobId, logs);
    
    // In a real implementation, we might persist this to a database
    console.log(`Stored execution log for job ${jobId}:`, log);
  }
  
  /**
   * Notify that a job's status has changed
   * @param jobId The job ID
   * @param status The new status
   */
  private notifyJobStatusChange(jobId: string, status: ETLJobStatus): void {
    // In a real implementation, this might send an event to a message bus
    console.log(`Job ${jobId} status changed to ${status}`);
    
    // Simulate API call to update job status
    fetch(`/api/etl/jobs/${jobId}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({ status })
    }).catch(error => {
      console.error(`Failed to update job status for ${jobId}:`, error);
    });
  }
  
  /**
   * Calculate the next run time for a scheduled job
   * @param job The scheduled job
   * @returns Next run date or undefined if invalid schedule
   */
  private calculateNextRunTime(job: ETLJob): Date | undefined {
    if (!job.schedule) {
      return undefined;
    }
    
    const { frequency, startDate, daysOfWeek, timeOfDay } = job.schedule;
    const now = new Date();
    let nextRun: Date;
    
    switch (frequency) {
      case 'once':
        // Run once at the specified start date (or now if not specified)
        nextRun = startDate ? new Date(startDate) : new Date();
        break;
        
      case 'hourly':
        // Run at the next hour
        nextRun = new Date(now);
        nextRun.setMinutes(0, 0, 0);
        nextRun.setHours(nextRun.getHours() + 1);
        break;
        
      case 'daily':
        // Run at the specified time tomorrow (or today if time is in the future)
        nextRun = new Date(now);
        nextRun.setHours(0, 0, 0, 0); // Start of day
        
        if (timeOfDay) {
          const [hours, minutes] = timeOfDay.split(':').map(Number);
          nextRun.setHours(hours, minutes);
        }
        
        // If the time has already passed today, schedule for tomorrow
        if (nextRun <= now) {
          nextRun.setDate(nextRun.getDate() + 1);
        }
        break;
        
      case 'weekly':
        // Run on the specified day of the week
        nextRun = new Date(now);
        nextRun.setHours(0, 0, 0, 0); // Start of day
        
        if (timeOfDay) {
          const [hours, minutes] = timeOfDay.split(':').map(Number);
          nextRun.setHours(hours, minutes);
        }
        
        // Find the next day that matches one of the specified days of the week
        if (daysOfWeek && daysOfWeek.length > 0) {
          // Convert days to Sunday = 0, Monday = 1, etc.
          const targetDays = daysOfWeek.map(day => day % 7);
          let daysToAdd = 1;
          
          // Find how many days to add to get to the next target day
          while (!targetDays.includes((nextRun.getDay() + daysToAdd) % 7)) {
            daysToAdd++;
          }
          
          nextRun.setDate(nextRun.getDate() + daysToAdd);
        } else {
          // Default to same day next week
          nextRun.setDate(nextRun.getDate() + 7);
        }
        break;
        
      case 'monthly':
        // Run on the same day of each month
        nextRun = new Date(now);
        nextRun.setHours(0, 0, 0, 0);
        
        if (timeOfDay) {
          const [hours, minutes] = timeOfDay.split(':').map(Number);
          nextRun.setHours(hours, minutes);
        }
        
        // Go to next month, same day
        nextRun.setMonth(nextRun.getMonth() + 1);
        break;
        
      default:
        return undefined;
    }
    
    return nextRun;
  }
}

// Export singleton instance
export default JobExecutionService.getInstance();