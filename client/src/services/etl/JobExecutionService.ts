// No imports needed
import { EtlJob } from "@shared/schema";

export interface JobExecutionResult {
  success: boolean;
  message: string;
  jobId: number;
  executionId?: string;
  startTime: Date;
  endTime?: Date;
  rowsProcessed?: number;
  status: 'success' | 'failed' | 'warning' | 'cancelled';
  logs: string[];
  metrics?: {
    executionTimeMs: number;
    cpuUtilization: number;
    memoryUsageMb: number;
    rowsProcessed: number;
    bytesProcessed: number;
    errorCount: number;
    warningCount: number;
  };
}

export interface JobSchedule {
  frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly';
  startDate?: string;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  timeOfDay?: string; // HH:MM format
}

export class JobExecutionService {
  /**
   * Execute an ETL job with the specified ID
   */
  public static async executeJob(jobId: number): Promise<JobExecutionResult> {
    try {
      const response = await fetch(`/api/etl/jobs/${jobId}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to execute job');
      }

      const result = await response.json();
      
      // Log execution
      console.log(`Job #${jobId} execution has been initiated`);
      
      return result;
    } catch (error) {
      console.error('Error executing job:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute job',
        jobId,
        startTime: new Date(),
        status: 'failed',
        logs: ['Job execution failed to start', error instanceof Error ? error.message : 'Unknown error']
      };
    }
  }

  /**
   * Get the execution status of a job
   */
  public static async getJobStatus(jobId: number): Promise<{
    status: 'idle' | 'running' | 'success' | 'failed' | 'warning';
    lastRunAt?: Date;
    message?: string;
  }> {
    try {
      const response = await fetch(`/api/etl/jobs/${jobId}`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get job status');
      }

      const job: EtlJob = await response.json();
      
      return {
        status: job.status as any,
        lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : undefined,
        message: job.metrics?.message || undefined
      };
    } catch (error) {
      console.error('Error getting job status:', error);
      
      return {
        status: 'idle'
      };
    }
  }

  /**
   * Cancel a running job
   */
  public static async cancelJob(jobId: number): Promise<boolean> {
    try {
      const response = await fetch(`/api/etl/jobs/${jobId}/cancel`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to cancel job');
      }

      const result = await response.json();
      
      console.log(`Job #${jobId} has been cancelled`);
      
      return result.success;
    } catch (error) {
      console.error('Error cancelling job:', error);
      
      return false;
    }
  }

  /**
   * Schedule an ETL job
   */
  public static async scheduleJob(jobId: number, schedule: JobSchedule): Promise<boolean> {
    try {
      const response = await fetch(`/api/etl/jobs/${jobId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          schedule
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to schedule job');
      }

      console.log(`Job #${jobId} has been scheduled successfully`);
      
      return true;
    } catch (error) {
      console.error('Error scheduling job:', error);
      
      return false;
    }
  }

  /**
   * Create and execute a batch job that runs multiple ETL jobs
   */
  public static async executeBatchJob(
    name: string,
    description: string,
    jobIds: number[]
  ): Promise<{
    success: boolean;
    batchJobId?: number;
    message: string;
  }> {
    try {
      const response = await fetch('/api/etl/batch-jobs', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          name,
          description,
          jobIds
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create batch job');
      }

      const result = await response.json();
      
      // Execute the batch job
      const executeResponse = await fetch(`/api/etl/batch-jobs/${result.id}/execute`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        }
      });

      if (!executeResponse.ok) {
        const executeErrorData = await executeResponse.json();
        throw new Error(executeErrorData.error || 'Failed to execute batch job');
      }

      console.log(`Batch job "${name}" with ${jobIds.length} ETL jobs has been started`);
      
      return {
        success: true,
        batchJobId: result.id,
        message: 'Batch job created and started successfully'
      };
    } catch (error) {
      console.error('Error executing batch job:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Failed to execute batch job'
      };
    }
  }

  /**
   * Get the execution history of a job
   */
  public static async getJobExecutionHistory(jobId: number): Promise<JobExecutionResult[]> {
    try {
      const response = await fetch(`/api/etl/jobs/${jobId}/history`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get job execution history');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting job execution history:', error);
      return [];
    }
  }

  /**
   * Convert a cron expression to a human-readable schedule description
   */
  public static cronToReadableSchedule(cronExpression: string): string {
    // Simple cron parser for common expressions
    try {
      const parts = cronExpression.split(' ');
      if (parts.length !== 5) {
        return 'Invalid cron expression';
      }
      
      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      
      // Every minute
      if (minute === '*' && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return 'Every minute';
      }
      
      // Hourly
      if (minute.match(/^[0-9]+$/) && hour === '*' && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `Every hour at ${minute} minutes past the hour`;
      }
      
      // Daily
      if (minute.match(/^[0-9]+$/) && hour.match(/^[0-9]+$/) && dayOfMonth === '*' && month === '*' && dayOfWeek === '*') {
        return `Every day at ${hour}:${minute.padStart(2, '0')}`;
      }
      
      // Weekly
      if (minute.match(/^[0-9]+$/) && hour.match(/^[0-9]+$/) && dayOfMonth === '*' && month === '*' && dayOfWeek.match(/^[0-9]+$/)) {
        const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
        return `Every ${days[Number(dayOfWeek)]} at ${hour}:${minute.padStart(2, '0')}`;
      }
      
      // Monthly
      if (minute.match(/^[0-9]+$/) && hour.match(/^[0-9]+$/) && dayOfMonth.match(/^[0-9]+$/) && month === '*' && dayOfWeek === '*') {
        return `Day ${dayOfMonth} of every month at ${hour}:${minute.padStart(2, '0')}`;
      }
      
      // Default for complex expressions
      return cronExpression;
    } catch (e) {
      return cronExpression;
    }
  }

  /**
   * Convert a schedule object to a cron expression
   */
  public static scheduleToExpression(schedule: JobSchedule): string {
    try {
      const { frequency, timeOfDay, daysOfWeek } = schedule;
      
      const time = timeOfDay ? timeOfDay.split(':') : ['0', '0'];
      const hour = time[0].padStart(2, '0');
      const minute = time[1] ? time[1].padStart(2, '0') : '00';
      
      switch (frequency) {
        case 'once':
          return ''; // Not a recurring schedule
          
        case 'hourly':
          return `${minute} * * * *`;
          
        case 'daily':
          return `${minute} ${hour} * * *`;
          
        case 'weekly':
          if (daysOfWeek && daysOfWeek.length > 0) {
            return `${minute} ${hour} * * ${daysOfWeek.join(',')}`;
          }
          return `${minute} ${hour} * * 1`; // Default to Monday if no days specified
          
        case 'monthly':
          return `${minute} ${hour} 1 * *`; // First day of every month
          
        default:
          return '0 0 * * *'; // Default daily at midnight
      }
    } catch (e) {
      return '0 0 * * *'; // Default daily at midnight
    }
  }
}