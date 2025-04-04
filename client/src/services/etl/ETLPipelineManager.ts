import { ETLJob, JobStatus, TransformationRule } from './ETLTypes';
import { scheduler } from './Scheduler';
import { etlPipeline, ETLPipelineResult } from './ETLPipeline';
import { alertService, Alert, AlertType, AlertSeverity, JobMetrics } from './AlertService';
import { dataConnector } from './DataConnector';
import { dataQualityService } from './DataQualityService';
import { optimizationService } from './OptimizationService';

/**
 * ETL job run interface
 */
export interface JobRun {
  id: string;
  jobId: string;
  jobName: string;
  status: JobStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  error?: string;
  metrics?: JobMetrics;
  alerts: Alert[];
  dataQualityScore?: number;
}

/**
 * ETL pipeline manager for coordinating ETL services
 */
class ETLPipelineManager {
  private jobs: Map<string, ETLJob> = new Map();
  private transformationRules: Map<number, TransformationRule> = new Map();
  private jobRuns: Map<string, JobRun[]> = new Map();
  private initialized = false;
  
  constructor() {
    // Default constructor
  }
  
  /**
   * Initialize the ETL pipeline manager
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }
    
    console.log('Initializing ETL Pipeline Manager');
    
    // Initialize scheduler
    scheduler.initialize();
    
    // Load jobs and rules from storage (via API in real implementation)
    // For demo, we'll populate with mock data later
    
    this.initialized = true;
  }
  
  /**
   * Register a job with the ETL pipeline manager
   */
  registerJob(job: ETLJob): void {
    console.log(`Registering job: ${job.name} (${job.id})`);
    
    this.jobs.set(job.id, job);
    
    // Initialize job runs array
    if (!this.jobRuns.has(job.id)) {
      this.jobRuns.set(job.id, []);
    }
    
    // Schedule the job if it has a schedule and is enabled
    if (job.schedule && job.enabled) {
      this.scheduleJob(job);
    }
  }
  
  /**
   * Register a transformation rule with the ETL pipeline manager
   */
  registerTransformationRule(rule: TransformationRule): void {
    console.log(`Registering transformation rule: ${rule.name} (${rule.id})`);
    this.transformationRules.set(rule.id, rule);
  }
  
  /**
   * Schedule a job for execution
   */
  scheduleJob(job: ETLJob): void {
    if (!job.schedule) {
      console.warn(`Cannot schedule job without a schedule: ${job.id}`);
      return;
    }
    
    console.log(`Scheduling job: ${job.name} (${job.id})`);
    
    // Schedule the job with the scheduler
    scheduler.scheduleJob(job, async (jobId) => {
      await this.executeJob(jobId);
    });
  }
  
  /**
   * Unschedule a job
   */
  unscheduleJob(jobId: string): void {
    console.log(`Unscheduling job: ${jobId}`);
    scheduler.unscheduleJob(jobId);
  }
  
  /**
   * Execute a job
   */
  async executeJob(jobId: string): Promise<JobRun> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`Job not found: ${jobId}`);
    }
    
    console.log(`Executing job: ${job.name} (${jobId})`);
    
    // Create job run
    const jobRunId = `run-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    const jobRun: JobRun = {
      id: jobRunId,
      jobId: job.id,
      jobName: job.name,
      status: JobStatus.PENDING,
      startTime: new Date(),
      alerts: []
    };
    
    // Update job run status
    jobRun.status = JobStatus.RUNNING;
    
    // Save the job run
    this.saveJobRun(jobRun);
    
    try {
      // Get transformation rules for this job
      const transformationRules = Array.from(this.transformationRules.values())
        .filter(rule => job.transformations.includes(rule.id));
      
      // Execute the ETL pipeline
      const result = await etlPipeline.executeJob(job, transformationRules);
      
      // Update job with result
      jobRun.status = result.status;
      jobRun.endTime = result.endTime;
      jobRun.duration = result.duration;
      jobRun.dataQualityScore = result.dataQualityScore;
      jobRun.alerts = result.alerts;
      
      // Add metrics
      jobRun.metrics = {
        recordsProcessed: result.recordsProcessed,
        recordsCreated: result.recordsCreated,
        recordsUpdated: result.recordsUpdated,
        recordsDeleted: result.recordsDeleted,
        errorRecords: 0, // Not tracked in this demo
        duration: result.duration,
        startTime: result.startTime,
        endTime: result.endTime,
        peakMemoryUsage: 0, // Not tracked in this demo
        avgCpuUsage: 0 // Not tracked in this demo
      };
      
      // Update job's last run info
      job.lastRunAt = jobRun.endTime;
      job.lastRunStatus = jobRun.status;
      
      // Save the job and job run
      this.jobs.set(job.id, job);
      this.saveJobRun(jobRun);
      
      // Generate optimization suggestions
      if (result.status === JobStatus.COMPLETED) {
        optimizationService.analyzeJob(job, transformationRules);
      }
      
      return jobRun;
    } catch (error) {
      // Update job run with error
      jobRun.status = JobStatus.FAILED;
      jobRun.endTime = new Date();
      jobRun.duration = jobRun.endTime.getTime() - jobRun.startTime.getTime();
      jobRun.error = error instanceof Error ? error.message : String(error);
      
      // Create an alert for the error
      const alert = alertService.createJobFailureAlert(job, error);
      jobRun.alerts.push(alert);
      
      // Update job's last run info
      job.lastRunAt = jobRun.endTime;
      job.lastRunStatus = jobRun.status;
      
      // Save the job and job run
      this.jobs.set(job.id, job);
      this.saveJobRun(jobRun);
      
      return jobRun;
    }
  }
  
  /**
   * Save job run
   */
  private saveJobRun(jobRun: JobRun): void {
    // Get existing runs
    const runs = this.jobRuns.get(jobRun.jobId) || [];
    
    // Find and update existing run or add new run
    const existingRunIndex = runs.findIndex(run => run.id === jobRun.id);
    
    if (existingRunIndex >= 0) {
      runs[existingRunIndex] = jobRun;
    } else {
      runs.push(jobRun);
    }
    
    // Limit to last 100 runs
    if (runs.length > 100) {
      runs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
      runs.splice(100);
    }
    
    // Save runs
    this.jobRuns.set(jobRun.jobId, runs);
  }
  
  /**
   * Get a job by ID
   */
  getJob(jobId: string): ETLJob | undefined {
    return this.jobs.get(jobId);
  }
  
  /**
   * Get all jobs
   */
  getAllJobs(): ETLJob[] {
    return Array.from(this.jobs.values());
  }
  
  /**
   * Get a transformation rule by ID
   */
  getTransformationRule(ruleId: number): TransformationRule | undefined {
    return this.transformationRules.get(ruleId);
  }
  
  /**
   * Get all transformation rules
   */
  getAllTransformationRules(): TransformationRule[] {
    return Array.from(this.transformationRules.values());
  }
  
  /**
   * Get job runs for a job
   */
  getJobRuns(jobId: string): JobRun[] {
    return this.jobRuns.get(jobId) || [];
  }
  
  /**
   * Get all job runs
   */
  getAllJobRuns(): JobRun[] {
    const allRuns: JobRun[] = [];
    
    for (const runs of this.jobRuns.values()) {
      allRuns.push(...runs);
    }
    
    return allRuns.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }
  
  /**
   * Get recent job runs
   */
  getRecentJobRuns(limit = 10): JobRun[] {
    return this.getAllJobRuns().slice(0, limit);
  }
  
  /**
   * Run a job immediately
   */
  async runJobNow(jobId: string): Promise<JobRun> {
    return this.executeJob(jobId);
  }
  
  /**
   * Delete a job
   */
  deleteJob(jobId: string): void {
    // Unschedule the job
    this.unscheduleJob(jobId);
    
    // Remove job
    this.jobs.delete(jobId);
    
    // Keep job runs for history
  }
  
  /**
   * Update a job
   */
  updateJob(job: ETLJob): void {
    const existingJob = this.jobs.get(job.id);
    
    if (!existingJob) {
      throw new Error(`Job not found: ${job.id}`);
    }
    
    // Update the job
    this.jobs.set(job.id, job);
    
    // Handle scheduling changes
    const wasScheduled = existingJob.schedule !== undefined && existingJob.enabled;
    const isScheduled = job.schedule !== undefined && job.enabled;
    
    if (wasScheduled && !isScheduled) {
      // Job was unscheduled
      this.unscheduleJob(job.id);
    } else if (!wasScheduled && isScheduled) {
      // Job was scheduled
      this.scheduleJob(job);
    } else if (wasScheduled && isScheduled) {
      // Job schedule was updated
      this.unscheduleJob(job.id);
      this.scheduleJob(job);
    }
  }
  
  /**
   * Load test data for development
   */
  loadTestData(): void {
    // Generate sample ETL jobs and transformation rules
    this.generateSampleJobs();
    this.generateSampleTransformationRules();
    
    // Schedule enabled jobs
    for (const job of this.jobs.values()) {
      if (job.schedule && job.enabled) {
        this.scheduleJob(job);
      }
    }
  }
  
  /**
   * Generate sample ETL jobs
   */
  private generateSampleJobs(): void {
    // Sample job 1: Property Database Extract
    const job1: ETLJob = {
      id: 'job-1',
      name: 'Property Database Extract',
      description: 'Extract properties from county database daily',
      sources: [1],
      transformations: [1, 2, 3],
      destinations: [1],
      schedule: {
        frequency: 'DAILY',
        options: {
          hour: 1,
          minute: 30
        }
      },
      enabled: true,
      continueOnError: false,
      maxAttempts: 3,
      timeout: 3600,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 25 * 24 * 60 * 60 * 1000)
    };
    
    // Sample job 2: Property Price Adjustments
    const job2: ETLJob = {
      id: 'job-2',
      name: 'Property Price Adjustments',
      description: 'Apply price adjustments to property values',
      sources: [1],
      transformations: [4, 5, 6],
      destinations: [2],
      schedule: {
        frequency: 'WEEKLY',
        options: {
          dayOfWeek: 1, // Monday
          hour: 2,
          minute: 0
        }
      },
      enabled: true,
      continueOnError: true,
      maxAttempts: 2,
      timeout: 1800,
      createdAt: new Date(Date.now() - 20 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 15 * 24 * 60 * 60 * 1000)
    };
    
    // Sample job 3: Market Data Integration
    const job3: ETLJob = {
      id: 'job-3',
      name: 'Market Data Integration',
      description: 'Integrate market data from external API',
      sources: [2],
      transformations: [7, 8, 9],
      destinations: [3],
      schedule: {
        frequency: 'HOURLY',
        options: {
          minute: 15
        }
      },
      enabled: false,
      continueOnError: false,
      maxAttempts: 5,
      timeout: 900,
      createdAt: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
    };
    
    // Sample job 4: Property Valuation Model
    const job4: ETLJob = {
      id: 'job-4',
      name: 'Property Valuation Model',
      description: 'Run property valuation models on cleaned data',
      sources: [3],
      transformations: [10, 11, 12],
      destinations: [4],
      schedule: {
        frequency: 'MONTHLY',
        options: {
          dayOfMonth: 1,
          hour: 3,
          minute: 0
        }
      },
      enabled: true,
      continueOnError: false,
      maxAttempts: 2,
      timeout: 7200,
      createdAt: new Date(Date.now() - 8 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
    };
    
    // Sample job 5: Data Quality Report
    const job5: ETLJob = {
      id: 'job-5',
      name: 'Data Quality Report',
      description: 'Generate data quality reports for all data sources',
      sources: [1, 2, 3],
      transformations: [],
      destinations: [5],
      schedule: {
        frequency: 'WEEKLY',
        options: {
          dayOfWeek: 5, // Friday
          hour: 18,
          minute: 0
        }
      },
      enabled: true,
      continueOnError: true,
      maxAttempts: 1,
      timeout: 1200,
      createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)
    };
    
    // Register jobs
    this.registerJob(job1);
    this.registerJob(job2);
    this.registerJob(job3);
    this.registerJob(job4);
    this.registerJob(job5);
    
    // Generate some sample job runs for history
    this.generateSampleJobRuns();
  }
  
  /**
   * Generate sample transformation rules
   */
  private generateSampleTransformationRules(): void {
    // Sample rule 1: Filter Invalid Properties
    const rule1: TransformationRule = {
      id: 1,
      name: 'Filter Invalid Properties',
      description: 'Remove properties with missing essential data',
      type: 'FILTER' as any,
      config: {
        conditions: [
          { field: 'propertyId', operator: 'IS_NOT_NULL' },
          { field: 'address', operator: 'IS_NOT_NULL' }
        ],
        operator: 'AND'
      },
      order: 1,
      enabled: true,
      createdAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000)
    };
    
    // Sample rule 2: Standardize Addresses
    const rule2: TransformationRule = {
      id: 2,
      name: 'Standardize Addresses',
      description: 'Standardize property addresses to a consistent format',
      type: 'STANDARDIZE' as any,
      config: {
        rules: [
          { field: 'address', format: 'address' },
          { field: 'city', format: 'name' },
          { field: 'state', format: 'uppercase' },
          { field: 'zip', format: 'zip' }
        ]
      },
      order: 2,
      enabled: true,
      createdAt: new Date(Date.now() - 34 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
    };
    
    // Sample rule 3: Calculate Price Per Sqft
    const rule3: TransformationRule = {
      id: 3,
      name: 'Calculate Price Per Sqft',
      description: 'Calculate price per square foot for each property',
      type: 'PRICE_PER_SQFT' as any,
      config: {
        priceColumn: 'salePrice',
        sqftColumn: 'squareFeet',
        targetColumn: 'pricePerSqft'
      },
      order: 3,
      enabled: true,
      createdAt: new Date(Date.now() - 33 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 31 * 24 * 60 * 60 * 1000)
    };
    
    // Sample rule 4: Adjust Property Prices
    const rule4: TransformationRule = {
      id: 4,
      name: 'Adjust Property Prices',
      description: 'Apply market adjustment factors to property prices',
      type: 'PRICE_ADJUST' as any,
      config: {
        priceColumn: 'salePrice',
        targetColumn: 'adjustedPrice',
        adjustmentFactors: [
          {
            column: 'propertyType',
            values: {
              'single_family': 1.05,
              'condo': 0.98,
              'multi_family': 1.12,
              'land': 0.9
            },
            defaultAdjustment: 1.0
          },
          {
            column: 'location',
            values: {
              'downtown': 1.2,
              'suburban': 1.0,
              'rural': 0.85
            },
            defaultAdjustment: 1.0
          }
        ]
      },
      order: 1,
      enabled: true,
      createdAt: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 28 * 24 * 60 * 60 * 1000)
    };
    
    // Sample rule 5: Calculate Property Age
    const rule5: TransformationRule = {
      id: 5,
      name: 'Calculate Property Age',
      description: 'Calculate the age of each property from yearBuilt',
      type: 'CUSTOM_FUNCTION' as any,
      config: {
        function: 'function(yearBuilt) { return new Date().getFullYear() - yearBuilt; }',
        targetColumn: 'propertyAge',
        parameters: [{ column: 'yearBuilt' }]
      },
      order: 2,
      enabled: true,
      createdAt: new Date(Date.now() - 29 * 24 * 60 * 60 * 1000),
      updatedAt: new Date(Date.now() - 27 * 24 * 60 * 60 * 1000)
    };
    
    // Register rules
    this.registerTransformationRule(rule1);
    this.registerTransformationRule(rule2);
    this.registerTransformationRule(rule3);
    this.registerTransformationRule(rule4);
    this.registerTransformationRule(rule5);
    
    // More rules would be added in a real implementation
  }
  
  /**
   * Generate sample job runs
   */
  private generateSampleJobRuns(): void {
    // Generate some sample runs for each job
    for (const job of this.jobs.values()) {
      const runCount = Math.floor(Math.random() * 10) + 5; // 5-15 runs per job
      
      for (let i = 0; i < runCount; i++) {
        const startTime = new Date(Date.now() - (runCount - i) * 24 * 60 * 60 * 1000 / runCount);
        const endTime = new Date(startTime.getTime() + Math.floor(Math.random() * 3600000)); // 0-60 minutes
        const status = Math.random() < 0.8 ? JobStatus.COMPLETED : (Math.random() < 0.5 ? JobStatus.FAILED : JobStatus.CANCELLED);
        
        const jobRun: JobRun = {
          id: `run-${Date.now() - i * 1000}-${Math.random().toString(36).substr(2, 9)}`,
          jobId: job.id,
          jobName: job.name,
          status,
          startTime,
          endTime,
          duration: endTime.getTime() - startTime.getTime(),
          alerts: [],
          metrics: {
            recordsProcessed: Math.floor(Math.random() * 10000) + 1000,
            recordsCreated: Math.floor(Math.random() * 1000) + 100,
            recordsUpdated: Math.floor(Math.random() * 500) + 50,
            recordsDeleted: Math.floor(Math.random() * 100),
            errorRecords: status === JobStatus.FAILED ? Math.floor(Math.random() * 100) + 1 : 0,
            duration: endTime.getTime() - startTime.getTime(),
            startTime,
            endTime,
            peakMemoryUsage: Math.floor(Math.random() * 50) + 10, // 10-60%
            avgCpuUsage: Math.floor(Math.random() * 40) + 10 // 10-50%
          },
          dataQualityScore: status === JobStatus.COMPLETED ? Math.random() * 0.3 + 0.7 : undefined // 0.7-1.0
        };
        
        // Add error for failed runs
        if (status === JobStatus.FAILED) {
          jobRun.error = 'Sample error for demo: Data validation failed';
          
          // Add error alert
          const alert: Alert = {
            id: `alert-${Date.now() - i * 1000}`,
            type: AlertType.JOB_FAILURE,
            title: 'Job Failure',
            message: `Job ${job.name} failed: Data validation error`,
            severity: AlertSeverity.ERROR,
            timestamp: endTime,
            state: 'active' as any, // Simplified for demo
            jobId: job.id,
            jobName: job.name
          };
          
          jobRun.alerts.push(alert);
        }
        
        // Save the job run
        this.saveJobRun(jobRun);
      }
      
      // Update job's last run info based on most recent run
      const runs = this.getJobRuns(job.id);
      if (runs.length > 0) {
        const lastRun = runs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime())[0];
        job.lastRunAt = lastRun.endTime;
        job.lastRunStatus = lastRun.status;
        this.jobs.set(job.id, job);
      }
    }
  }
  
  /**
   * Shutdown the ETL pipeline manager
   */
  shutdown(): void {
    if (!this.initialized) {
      return;
    }
    
    console.log('Shutting down ETL Pipeline Manager');
    
    // Shutdown scheduler
    scheduler.shutdown();
    
    this.initialized = false;
  }
}

// Export a singleton instance
export const etlPipelineManager = new ETLPipelineManager();