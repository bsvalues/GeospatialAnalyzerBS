import { DataSource, ETLJob, JobStatus, TransformationRule } from './ETLTypes';
import { dataConnector } from './DataConnector';
import { transformationService } from './TransformationService';
import { JobScheduleImpl } from './JobScheduleImpl';
import { alertService, AlertType, AlertSeverity } from './AlertService';

/**
 * Job Run interface
 */
export interface JobRun {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: JobStatus;
  recordsProcessed: number;
  recordsLoaded?: number;
  errors?: string[];
  warnings?: string[];
  logs?: string[];
}

/**
 * ETL Pipeline Manager
 * Responsible for executing and managing ETL jobs
 */
class ETLPipelineManager {
  private runningJobs: Map<string, AbortController> = new Map();
  private scheduledJobs: Map<string, NodeJS.Timeout> = new Map();
  private jobRuns: JobRun[] = [];
  
  constructor() {
    // Initialize
  }
  
  /**
   * Get all job runs
   */
  getJobRuns(): JobRun[] {
    return this.jobRuns;
  }
  
  /**
   * Get job runs for a specific job
   */
  getJobRunsForJob(jobId: string): JobRun[] {
    return this.jobRuns.filter(run => run.jobId === jobId);
  }
  
  /**
   * Get currently running jobs
   */
  getRunningJobs(): string[] {
    return Array.from(this.runningJobs.keys());
  }
  
  /**
   * Execute an ETL job
   */
  async executeJob(job: ETLJob, dataSources: DataSource[], transformations: TransformationRule[]): Promise<JobRun> {
    // Check if job is already running
    if (this.runningJobs.has(job.id)) {
      throw new Error(`Job ${job.name} is already running`);
    }
    
    console.log(`Executing job: ${job.name}`);
    
    // Create a new job run
    const runId = `run-${Date.now()}`;
    
    const jobRun: JobRun = {
      id: runId,
      jobId: job.id,
      startTime: new Date(),
      status: JobStatus.RUNNING,
      recordsProcessed: 0,
      errors: [],
      warnings: [],
      logs: [`Starting job: ${job.name}`]
    };
    
    // Add to job runs
    this.jobRuns.push(jobRun);
    
    // Create an abort controller for cancellation
    const abortController = new AbortController();
    this.runningJobs.set(job.id, abortController);
    
    try {
      // Get source data sources
      const sources = job.sources.map(sourceId => {
        const source = dataSources.find(ds => ds.id === sourceId);
        if (!source) {
          throw new Error(`Source with ID ${sourceId} not found`);
        }
        return source;
      });
      
      // Get job transformations in order
      const jobTransformations = job.transformations.map(transformationId => {
        const transformation = transformations.find(t => t.id === transformationId);
        if (!transformation) {
          throw new Error(`Transformation with ID ${transformationId} not found`);
        }
        return transformation;
      }).sort((a, b) => a.order - b.order);
      
      // Get destination data sources
      const destinations = job.destinations.map(destId => {
        const dest = dataSources.find(ds => ds.id === destId);
        if (!dest) {
          throw new Error(`Destination with ID ${destId} not found`);
        }
        return dest;
      });
      
      // Extract data from sources
      jobRun.logs?.push(`Extracting data from ${sources.length} source(s)`);
      
      let data: any[] = [];
      for (const source of sources) {
        // Check if job has been cancelled
        if (abortController.signal.aborted) {
          jobRun.logs?.push('Job cancelled during extraction phase');
          throw new Error('Job cancelled');
        }
        
        try {
          const sourceData = await dataConnector.extractData(source);
          jobRun.logs?.push(`Extracted ${sourceData.length} records from ${source.name}`);
          data = data.concat(sourceData);
        } catch (error) {
          jobRun.logs?.push(`Error extracting data from ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
          jobRun.errors?.push(`Extraction error: ${error instanceof Error ? error.message : String(error)}`);
          
          if (!job.continueOnError) {
            throw error;
          }
        }
      }
      
      jobRun.recordsProcessed = data.length;
      jobRun.logs?.push(`Total records extracted: ${data.length}`);
      
      // Apply transformations
      jobRun.logs?.push(`Applying ${jobTransformations.length} transformation(s)`);
      
      for (const transformation of jobTransformations) {
        // Check if job has been cancelled
        if (abortController.signal.aborted) {
          jobRun.logs?.push('Job cancelled during transformation phase');
          throw new Error('Job cancelled');
        }
        
        if (!transformation.enabled) {
          jobRun.logs?.push(`Skipping disabled transformation: ${transformation.name}`);
          continue;
        }
        
        try {
          const beforeCount = data.length;
          jobRun.logs?.push(`Applying transformation: ${transformation.name}`);
          
          data = await transformationService.applyTransformation(transformation, data);
          
          const afterCount = data.length;
          jobRun.logs?.push(`Transformation ${transformation.name} complete. Records: ${beforeCount} -> ${afterCount}`);
        } catch (error) {
          jobRun.logs?.push(`Error applying transformation ${transformation.name}: ${error instanceof Error ? error.message : String(error)}`);
          jobRun.errors?.push(`Transformation error: ${error instanceof Error ? error.message : String(error)}`);
          
          if (!job.continueOnError) {
            throw error;
          }
        }
      }
      
      jobRun.recordsProcessed = data.length;
      jobRun.logs?.push(`Total records after transformation: ${data.length}`);
      
      // Load data to destinations
      jobRun.logs?.push(`Loading data to ${destinations.length} destination(s)`);
      
      let totalLoaded = 0;
      
      // This is a simplified implementation
      // In a real-world scenario, we would use the DataConnector to write data to destinations
      for (const destination of destinations) {
        // Check if job has been cancelled
        if (abortController.signal.aborted) {
          jobRun.logs?.push('Job cancelled during loading phase');
          throw new Error('Job cancelled');
        }
        
        // Simulate loading data
        try {
          // In a real implementation, this would be:
          // await dataConnector.loadData(destination, data);
          
          // Simulate a delay
          await new Promise(resolve => setTimeout(resolve, 500));
          
          jobRun.logs?.push(`Loaded ${data.length} records to ${destination.name}`);
          totalLoaded += data.length;
        } catch (error) {
          jobRun.logs?.push(`Error loading data to ${destination.name}: ${error instanceof Error ? error.message : String(error)}`);
          jobRun.errors?.push(`Loading error: ${error instanceof Error ? error.message : String(error)}`);
          
          if (!job.continueOnError) {
            throw error;
          }
        }
      }
      
      jobRun.recordsLoaded = totalLoaded;
      
      // Update job run status
      jobRun.status = JobStatus.COMPLETED;
      jobRun.endTime = new Date();
      jobRun.logs?.push(`Job completed successfully at ${jobRun.endTime.toISOString()}`);
      
      console.log(`Job ${job.name} completed successfully`);
      
      // Update job schedule if needed
      if (job.schedule) {
        if (job.schedule instanceof JobScheduleImpl) {
          (job.schedule as JobScheduleImpl).updateAfterRun();
        }
      }
      
      return jobRun;
    } catch (error) {
      // Handle error
      jobRun.status = abortController.signal.aborted ? JobStatus.CANCELLED : JobStatus.FAILED;
      jobRun.endTime = new Date();
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      jobRun.logs?.push(`Job ${jobRun.status === JobStatus.CANCELLED ? 'cancelled' : 'failed'}: ${errorMessage}`);
      if (jobRun.status === JobStatus.FAILED && !jobRun.errors?.includes(errorMessage)) {
        jobRun.errors?.push(errorMessage);
      }
      
      console.error(`Job ${job.name} ${jobRun.status === JobStatus.CANCELLED ? 'cancelled' : 'failed'}: ${errorMessage}`);
      
      // Create an alert for failed jobs (not cancelled ones)
      if (jobRun.status === JobStatus.FAILED) {
        alertService.createAlert({
          jobId: job.id,
          severity: AlertSeverity.ERROR,
          type: AlertType.JOB_FAILURE,
          message: `Job "${job.name}" failed: ${errorMessage}`,
          details: {
            runId: jobRun.id,
            error: errorMessage
          }
        });
      }
      
      return jobRun;
    } finally {
      // Clean up
      this.runningJobs.delete(job.id);
    }
  }
  
  /**
   * Cancel a running job
   */
  cancelJob(jobId: string): boolean {
    const controller = this.runningJobs.get(jobId);
    if (controller) {
      controller.abort();
      return true;
    }
    return false;
  }
  
  /**
   * Schedule a job
   */
  scheduleJob(job: ETLJob, dataSources: DataSource[], transformations: TransformationRule[]): void {
    // Cancel existing schedule if any
    this.unscheduleJob(job.id);
    
    if (!job.schedule || !job.enabled) {
      return;
    }
    
    console.log(`Scheduling job: ${job.name} with expression: ${job.schedule.expression}`);
    
    // Calculate next run time
    let nextRun = job.schedule.nextRun;
    
    if (!nextRun) {
      // If no next run time is calculated, schedule for soon
      nextRun = new Date();
      nextRun.setMinutes(nextRun.getMinutes() + 1);
    }
    
    const now = new Date();
    const delayMs = Math.max(0, nextRun.getTime() - now.getTime());
    
    console.log(`Job ${job.name} scheduled to run in ${Math.round(delayMs / 1000)} seconds`);
    
    // Schedule job
    const timeout = setTimeout(() => {
      // Only execute if job is still enabled
      if (job.enabled) {
        this.executeJob(job, dataSources, transformations)
          .then(jobRun => {
            console.log(`Scheduled job ${job.name} completed with status: ${jobRun.status}`);
            
            // Reschedule if job is still enabled and has a schedule
            if (job.enabled && job.schedule) {
              // For one-time jobs, don't reschedule if they've already run
              if (job.schedule.expression.startsWith('@once') && job.schedule.runCount && job.schedule.runCount > 0) {
                console.log(`One-time job ${job.name} has already run, not rescheduling`);
                return;
              }
              
              this.scheduleJob(job, dataSources, transformations);
            }
          })
          .catch(error => {
            console.error(`Error executing scheduled job ${job.name}:`, error);
          });
      }
    }, delayMs);
    
    // Store timeout for later cancellation
    this.scheduledJobs.set(job.id, timeout);
  }
  
  /**
   * Unschedule a job
   */
  unscheduleJob(jobId: string): void {
    const timeout = this.scheduledJobs.get(jobId);
    if (timeout) {
      clearTimeout(timeout);
      this.scheduledJobs.delete(jobId);
    }
  }
  
  /**
   * Unschedule all jobs
   */
  unscheduleAllJobs(): void {
    for (const [jobId, timeout] of this.scheduledJobs.entries()) {
      clearTimeout(timeout);
    }
    this.scheduledJobs.clear();
  }
  
  /**
   * Add a job run (for testing purposes)
   */
  addJobRun(jobRun: JobRun): void {
    this.jobRuns.push(jobRun);
  }
  
  /**
   * Clear all job runs
   */
  clearJobRuns(): void {
    this.jobRuns = [];
  }
}

// Export a singleton instance
export const etlPipelineManager = new ETLPipelineManager();