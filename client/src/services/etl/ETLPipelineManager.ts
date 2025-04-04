import { ETLJob, JobStatus, TransformationRule } from './ETLTypes';
import { etlPipeline, ETLPipelineOptions, ETLPipelineResult } from './ETLPipeline';
import { scheduler } from './Scheduler';
import { dataConnector, ConnectionTestResult } from './DataConnector';
import { dataQualityService } from './DataQualityService';
import { optimizationService } from './OptimizationService';
import { alertService, AlertType, AlertSeverity, AlertCategory } from './AlertService';

/**
 * Interface for job run history
 */
export interface JobRun {
  id: number;
  jobId: number;
  startTime: Date;
  endTime?: Date;
  status: JobStatus;
  records: {
    extracted: number;
    transformed: number;
    loaded: number;
    failed: number;
  };
  errors: any[];
  executionTime?: number;
  createdAt: Date;
  logs?: string[]; // Optional logs from the execution
}

/**
 * ETL Pipeline Manager class
 * 
 * This class coordinates between the ETL pipeline, scheduler, and other services.
 */
class ETLPipelineManager {
  private jobs: Map<number, ETLJob> = new Map();
  private jobRuns: Map<number, JobRun[]> = new Map();
  private dataSources: Map<number, any> = new Map();
  private rules: Map<number, TransformationRule> = new Map();
  private nextJobId = 1;
  private nextRunId = 1;
  
  constructor() {
    console.log('ETL Pipeline Manager initialized');
    this.initializeManager();
  }
  
  /**
   * Initialize the manager and set up job handlers
   */
  private initializeManager(): void {
    // Set up a run handler for the scheduler
    scheduler.scheduleJob(
      0, // Special system job ID
      'Clean Up Expired Alerts',
      {
        frequency: 'daily',
        hour: 0,
        minute: 0
      },
      async () => {
        // Clean up expired alerts
        const expiredAlerts = alertService.clearExpiredAlerts();
        console.log(`Cleaned up ${expiredAlerts.length} expired alerts`);
      }
    );
    
    console.log('ETL Pipeline Manager initialized');
  }
  
  /**
   * Create a new ETL job
   */
  createJob(
    name: string,
    description: string,
    sources: number[],
    destinations: number[],
    rules: number[],
    enabled: boolean = true
  ): ETLJob {
    const now = new Date();
    const jobId = this.nextJobId++;
    
    const job: ETLJob = {
      id: jobId,
      name,
      description,
      sources,
      destinations,
      rules,
      enabled,
      status: JobStatus.IDLE,
      createdAt: now,
      updatedAt: now
    };
    
    this.jobs.set(jobId, job);
    this.jobRuns.set(jobId, []);
    
    console.log(`Created ETL job: ${name} (ID: ${jobId})`);
    
    return job;
  }
  
  /**
   * Get all ETL jobs
   */
  getJobs(): ETLJob[] {
    return Array.from(this.jobs.values());
  }
  
  /**
   * Get a specific ETL job by ID
   */
  getJob(id: number): ETLJob | undefined {
    return this.jobs.get(id);
  }
  
  /**
   * Update an existing ETL job
   */
  updateJob(id: number, updates: Partial<ETLJob>): boolean {
    const job = this.getJob(id);
    
    if (!job) {
      return false;
    }
    
    const now = new Date();
    
    // Update job properties
    Object.assign(job, {
      ...updates,
      updatedAt: now
    });
    
    this.jobs.set(id, job);
    
    console.log(`Updated ETL job: ${job.name} (ID: ${id})`);
    
    return true;
  }
  
  /**
   * Delete an ETL job
   */
  deleteJob(id: number): boolean {
    if (!this.jobs.has(id)) {
      return false;
    }
    
    // Get the job and runs for logging
    const job = this.jobs.get(id)!;
    const runs = this.jobRuns.get(id) || [];
    
    // Remove job and runs
    this.jobs.delete(id);
    this.jobRuns.delete(id);
    
    console.log(`Deleted ETL job: ${job.name} (ID: ${id}) with ${runs.length} run records`);
    
    return true;
  }
  
  /**
   * Execute an ETL job immediately
   */
  async executeJob(id: number, options?: ETLPipelineOptions): Promise<JobRun> {
    const job = this.getJob(id);
    
    if (!job) {
      throw new Error(`Job not found: ${id}`);
    }
    
    const now = new Date();
    const runId = this.nextRunId++;
    
    // Create a job run record
    const jobRun: JobRun = {
      id: runId,
      jobId: id,
      startTime: now,
      status: JobStatus.RUNNING,
      records: {
        extracted: 0,
        transformed: 0,
        loaded: 0,
        failed: 0
      },
      errors: [],
      createdAt: now,
      logs: ['Job execution started']
    };
    
    // Add to job runs
    const jobRuns = this.jobRuns.get(id) || [];
    jobRuns.push(jobRun);
    this.jobRuns.set(id, jobRuns);
    
    // Update job status
    job.status = JobStatus.RUNNING;
    job.lastRun = now;
    this.jobs.set(id, job);
    
    // Create an alert for job start
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: 'ETL Job Started',
      message: `ETL job "${job.name}" execution started`,
      jobId: id
    });
    
    try {
      // Get the sources, destinations, and rules for this job
      const sources = job.sources.map(sourceId => this.dataSources.get(sourceId)).filter(Boolean);
      const destinations = job.destinations.map(destId => this.dataSources.get(destId)).filter(Boolean);
      const transformRules = job.rules.map(ruleId => this.rules.get(ruleId)).filter(Boolean);
      
      // Validate that we have all the required data
      if (sources.length === 0) {
        throw new Error('No valid sources found for job');
      }
      
      if (destinations.length === 0) {
        throw new Error('No valid destinations found for job');
      }
      
      // Sort rules by order
      const sortedRules = [...transformRules].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return 0;
      });
      
      // Log source, destination, and rule counts
      jobRun.logs?.push(`Job has ${sources.length} sources, ${destinations.length} destinations, and ${sortedRules.length} transformation rules`);
      
      // Execute the ETL pipeline for each source/destination pair
      for (let i = 0; i < sources.length; i++) {
        const source = sources[i];
        
        for (let j = 0; j < destinations.length; j++) {
          const destination = destinations[j];
          
          jobRun.logs?.push(`Executing pipeline for source "${source.name}" to destination "${destination.name}"`);
          
          const pipelineResult = await etlPipeline.execute(
            source,
            destination,
            sortedRules,
            options
          );
          
          // Add logs from the pipeline execution
          if (jobRun.logs && pipelineResult.logs) {
            jobRun.logs.push(...pipelineResult.logs);
          }
          
          // Update record counts
          jobRun.records.extracted += pipelineResult.recordCounts.extracted;
          jobRun.records.transformed += pipelineResult.recordCounts.transformed;
          jobRun.records.loaded += pipelineResult.recordCounts.loaded;
          jobRun.records.failed += pipelineResult.recordCounts.failed;
          
          // Add any errors to the job run
          if (pipelineResult.errors.length > 0) {
            jobRun.errors.push(...pipelineResult.errors);
          }
          
          // Data quality analysis
          if (pipelineResult.dataQualityResult) {
            jobRun.logs?.push(`Data quality analysis identified ${pipelineResult.dataQualityResult.issues.length} issues`);
            
            // Create alerts for data quality issues
            if (pipelineResult.dataQualityResult.issues.length > 0) {
              alertService.createAlert({
                type: AlertType.WARNING,
                severity: AlertSeverity.MEDIUM,
                category: AlertCategory.DATA_QUALITY,
                title: 'Data Quality Issues',
                message: `${pipelineResult.dataQualityResult.issues.length} data quality issues detected during job "${job.name}" execution`,
                jobId: id
              });
            }
          }
          
          // Generate optimization suggestions
          const suggestions = await optimizationService.analyzePipelineResult(job, pipelineResult);
          if (suggestions.length > 0) {
            jobRun.logs?.push(`Optimization analysis generated ${suggestions.length} suggestions`);
          }
        }
      }
      
      // Update job run status to success
      const endTime = new Date();
      const executionTime = endTime.getTime() - now.getTime();
      
      jobRun.status = JobStatus.SUCCEEDED;
      jobRun.endTime = endTime;
      jobRun.executionTime = executionTime;
      
      // Add success log
      jobRun.logs?.push(`Job execution completed successfully in ${executionTime}ms`);
      
      // Update job status
      job.status = JobStatus.IDLE;
      this.jobs.set(id, job);
      
      // Create an alert for job completion
      alertService.createAlert({
        type: AlertType.SUCCESS,
        severity: AlertSeverity.LOW,
        category: AlertCategory.TRANSFORMATION,
        title: 'ETL Job Completed',
        message: `ETL job "${job.name}" completed successfully in ${executionTime}ms`,
        jobId: id
      });
    } catch (error) {
      // Handle error and update job run status
      const endTime = new Date();
      const executionTime = endTime.getTime() - now.getTime();
      
      jobRun.status = JobStatus.FAILED;
      jobRun.endTime = endTime;
      jobRun.executionTime = executionTime;
      
      const errorMessage = error instanceof Error ? error.message : String(error);
      jobRun.errors.push({
        type: 'job_execution_error',
        message: errorMessage
      });
      
      // Add error log
      jobRun.logs?.push(`Job execution failed after ${executionTime}ms: ${errorMessage}`);
      
      // Update job status
      job.status = JobStatus.IDLE;
      this.jobs.set(id, job);
      
      // Create an alert for job failure
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.TRANSFORMATION,
        title: 'ETL Job Failed',
        message: `ETL job "${job.name}" failed: ${errorMessage}`,
        jobId: id
      });
      
      console.error(`Job ${job.name} (ID: ${id}) execution failed:`, error);
    }
    
    // Update job runs list
    this.jobRuns.set(id, jobRuns);
    
    return jobRun;
  }
  
  /**
   * Get job run history for a specific job
   */
  getJobRuns(jobId: number): JobRun[] {
    return this.jobRuns.get(jobId) || [];
  }
  
  /**
   * Get a specific job run by ID
   */
  getJobRun(jobId: number, runId: number): JobRun | undefined {
    const runs = this.getJobRuns(jobId);
    return runs.find(run => run.id === runId);
  }
  
  /**
   * Schedule a job for recurring execution
   */
  scheduleJob(jobId: number, scheduleOptions: any): number {
    const job = this.getJob(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    // Create a run handler that will execute this job
    const runHandler = async (): Promise<void> => {
      await this.executeJob(jobId);
    };
    
    // Schedule the job with the scheduler
    const scheduleId = scheduler.scheduleJob(
      jobId,
      job.name,
      scheduleOptions,
      runHandler
    );
    
    // Update the job with the schedule
    this.updateJob(jobId, {
      schedule: scheduleOptions
    });
    
    console.log(`Scheduled job ${job.name} (ID: ${jobId}) with schedule ID: ${scheduleId}`);
    
    return scheduleId;
  }
  
  /**
   * Update a job schedule
   */
  updateJobSchedule(jobId: number, scheduleId: number, scheduleOptions: any): boolean {
    const job = this.getJob(jobId);
    
    if (!job) {
      return false;
    }
    
    // Update the schedule in the scheduler
    const result = scheduler.updateJobSchedule(scheduleId, {
      name: job.name,
      schedule: scheduleOptions
    });
    
    if (result) {
      // Update the job with the new schedule
      this.updateJob(jobId, {
        schedule: scheduleOptions
      });
      
      console.log(`Updated schedule for job ${job.name} (ID: ${jobId})`);
    }
    
    return result;
  }
  
  /**
   * Unschedule a job
   */
  unscheduleJob(scheduleId: number): boolean {
    return scheduler.deleteScheduledJob(scheduleId);
  }
  
  /**
   * Add a data source to the manager
   */
  addDataSource(dataSource: any): number {
    const id = dataSource.id;
    this.dataSources.set(id, dataSource);
    console.log(`Added data source: ${dataSource.name} (ID: ${id})`);
    return id;
  }
  
  /**
   * Get a data source by ID
   */
  getDataSource(id: number): any {
    return this.dataSources.get(id);
  }
  
  /**
   * Get all data sources
   */
  getDataSources(): any[] {
    return Array.from(this.dataSources.values());
  }
  
  /**
   * Add a transformation rule to the manager
   */
  addRule(rule: TransformationRule): number {
    const id = rule.id;
    this.rules.set(id, rule);
    console.log(`Added transformation rule: ${rule.name} (ID: ${id})`);
    return id;
  }
  
  /**
   * Get a transformation rule by ID
   */
  getRule(id: number): TransformationRule | undefined {
    return this.rules.get(id);
  }
  
  /**
   * Get all transformation rules
   */
  getRules(): TransformationRule[] {
    return Array.from(this.rules.values());
  }
  
  /**
   * Pause a job (disable it temporarily)
   */
  pauseJob(id: number): boolean {
    const job = this.getJob(id);
    
    if (!job) {
      return false;
    }
    
    // Update the job to disable it
    this.updateJob(id, {
      enabled: false
    });
    
    // Create an alert
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: 'ETL Job Paused',
      message: `ETL job "${job.name}" has been paused`,
      jobId: id
    });
    
    console.log(`Paused job: ${job.name} (ID: ${id})`);
    
    return true;
  }
  
  /**
   * Resume a paused job
   */
  resumeJob(id: number): boolean {
    const job = this.getJob(id);
    
    if (!job) {
      return false;
    }
    
    // Update the job to enable it
    this.updateJob(id, {
      enabled: true
    });
    
    // Create an alert
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: 'ETL Job Resumed',
      message: `ETL job "${job.name}" has been resumed`,
      jobId: id
    });
    
    console.log(`Resumed job: ${job.name} (ID: ${id})`);
    
    return true;
  }
  
  /**
   * Test a data source connection
   */
  async testConnection(dataSourceId: number): Promise<boolean> {
    const dataSource = this.getDataSource(dataSourceId);
    
    if (!dataSource) {
      throw new Error(`Data source not found: ${dataSourceId}`);
    }
    
    console.log(`Testing connection for data source: ${dataSource.name} (ID: ${dataSourceId})`);
    
    try {
      const result = await dataConnector.testConnection(dataSource);
      
      if (result.success) {
        console.log(`Connection test successful for data source: ${dataSource.name}`);
        return true;
      } else {
        console.error(`Connection test failed for data source: ${dataSource.name} - ${result.message}`);
        
        // Create an alert
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.CONNECTIVITY,
          title: 'Connection Test Failed',
          message: `Connection test failed for data source "${dataSource.name}": ${result.message}`
        });
        
        return false;
      }
    } catch (error) {
      console.error(`Error testing connection for data source: ${dataSource.name}`, error);
      
      return false;
    }
  }
  
  /**
   * Get job statistics
   */
  getJobStatistics(): {
    total: number;
    enabled: number;
    scheduled: number;
    byStatus: Record<JobStatus, number>;
  } {
    const byStatus: Record<JobStatus, number> = {
      [JobStatus.IDLE]: 0,
      [JobStatus.RUNNING]: 0,
      [JobStatus.SUCCEEDED]: 0,
      [JobStatus.FAILED]: 0,
      [JobStatus.CANCELLED]: 0
    };
    
    let enabledCount = 0;
    let scheduledCount = 0;
    
    for (const job of this.jobs.values()) {
      byStatus[job.status]++;
      
      if (job.enabled) {
        enabledCount++;
      }
      
      if (job.schedule) {
        scheduledCount++;
      }
    }
    
    return {
      total: this.jobs.size,
      enabled: enabledCount,
      scheduled: scheduledCount,
      byStatus
    };
  }
  
  /**
   * Get the latest job run for each job
   */
  getLatestRuns(): Record<number, JobRun | undefined> {
    const result: Record<number, JobRun | undefined> = {};
    
    for (const job of this.jobs.values()) {
      const runs = this.getJobRuns(job.id);
      
      if (runs.length > 0) {
        // Sort by start time descending to get the latest run
        const sortedRuns = [...runs].sort(
          (a, b) => b.startTime.getTime() - a.startTime.getTime()
        );
        result[job.id] = sortedRuns[0];
      } else {
        result[job.id] = undefined;
      }
    }
    
    return result;
  }
}

// Export a singleton instance
export const etlPipelineManager = new ETLPipelineManager();