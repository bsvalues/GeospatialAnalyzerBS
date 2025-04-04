import { ETLJob, JobStatus } from './ETLTypes';
import { etlPipeline, ETLPipelineStatus } from './ETLPipeline';
import { dataConnector } from './DataConnector';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';
import { scheduler, ScheduledJob, ScheduleConfig, JobExecutionResult } from './Scheduler';

/**
 * Job run interface
 */
export interface JobRun {
  /** Run ID */
  id: string;
  
  /** Job ID */
  jobId: number;
  
  /** Run status */
  status: JobStatus;
  
  /** Start time */
  startTime: Date;
  
  /** End time */
  endTime?: Date;
  
  /** Error message */
  error?: string;
  
  /** Record counts */
  recordCounts: {
    extracted: number;
    transformed: number;
    loaded: number;
    failed: number;
  };
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * ETL pipeline manager
 */
class ETLPipelineManager {
  private jobs: Map<number, ETLJob> = new Map();
  private jobRuns: Map<string, JobRun> = new Map();
  private nextJobId = 1;
  private nextRunId = 1;
  
  constructor() {
    // Initialize with some mock jobs for demonstration
    this.initializeMockJobs();
  }
  
  /**
   * Initialize mock jobs for demonstration
   */
  private initializeMockJobs(): void {
    const mockJobs: ETLJob[] = [
      {
        id: this.nextJobId++,
        name: 'Property Data Import',
        description: 'Import property data from API to database',
        sources: [1],
        destinations: [2],
        rules: [1, 2],
        status: JobStatus.CREATED,
        enabled: true,
        createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
        updatedAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.nextJobId++,
        name: 'User Data Sync',
        description: 'Synchronize user data between systems',
        sources: [3],
        destinations: [4],
        rules: [3],
        status: JobStatus.CREATED,
        enabled: true,
        createdAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000), // 5 days ago
        updatedAt: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000)
      },
      {
        id: this.nextJobId++,
        name: 'Analytics Data Processing',
        description: 'Process and aggregate analytics data',
        sources: [5],
        destinations: [6],
        rules: [1, 3],
        status: JobStatus.CREATED,
        enabled: false,
        createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
        updatedAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000)
      }
    ];
    
    for (const job of mockJobs) {
      this.jobs.set(job.id, job);
    }
    
    // Register mock data sources
    this.registerMockDataSources();
  }
  
  /**
   * Register mock data sources for demonstration
   */
  private registerMockDataSources(): void {
    const mockDataSources = [
      {
        id: 1,
        name: 'Property API',
        type: 'REST_API',
        config: {
          url: 'https://api.example.com/properties',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          data: [
            { id: 1, addr: '123 Main St', price: 350000, sqft: 2000, yearBuilt: 1995, type: 'single-family', latitude: 37.7749, longitude: -122.4194 },
            { id: 2, addr: '456 Oak Ave', price: 275000, sqft: 1800, yearBuilt: 1985, type: 'single-family', latitude: 37.7750, longitude: -122.4180 },
            { id: 3, addr: '789 Elm Blvd', price: 425000, sqft: 2200, yearBuilt: 2005, type: 'single-family', latitude: 37.7760, longitude: -122.4170 },
            { id: 4, addr: '101 Pine St', price: 180000, sqft: 1200, yearBuilt: 1975, type: 'condo', latitude: 37.7770, longitude: -122.4160 },
            { id: 5, addr: '202 Cedar Ln', price: 550000, sqft: 2800, yearBuilt: 2015, type: 'single-family', latitude: 37.7780, longitude: -122.4150 }
          ]
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 2,
        name: 'Property Database',
        type: 'POSTGRESQL',
        config: {
          host: 'localhost',
          port: 5432,
          database: 'properties',
          user: 'user',
          password: 'password',
          data: []
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 3,
        name: 'User API',
        type: 'REST_API',
        config: {
          url: 'https://api.example.com/users',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          data: [
            { id: 1, name: 'John Doe', email: 'john@example.com', role: 'user' },
            { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'admin' },
            { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
          ]
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 4,
        name: 'User Database',
        type: 'MYSQL',
        config: {
          host: 'localhost',
          port: 3306,
          database: 'users',
          user: 'user',
          password: 'password',
          data: []
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 5,
        name: 'Analytics API',
        type: 'REST_API',
        config: {
          url: 'https://api.example.com/analytics',
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': 'Bearer mock-token'
          },
          data: [
            { id: 1, page: 'home', views: 1200, bounce_rate: 0.35 },
            { id: 2, page: 'properties', views: 850, bounce_rate: 0.25 },
            { id: 3, page: 'contact', views: 450, bounce_rate: 0.40 },
            { id: 4, page: 'about', views: 320, bounce_rate: 0.30 }
          ]
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 6,
        name: 'Analytics Database',
        type: 'POSTGRESQL',
        config: {
          host: 'localhost',
          port: 5432,
          database: 'analytics',
          user: 'user',
          password: 'password',
          data: []
        },
        enabled: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    for (const dataSource of mockDataSources) {
      dataConnector.registerDataSource(dataSource);
    }
  }
  
  /**
   * Create a new ETL job
   */
  createJob(jobData: Omit<ETLJob, 'id' | 'status' | 'createdAt' | 'updatedAt'>): ETLJob {
    const now = new Date();
    const id = this.nextJobId++;
    
    const job: ETLJob = {
      id,
      ...jobData,
      status: JobStatus.CREATED,
      createdAt: now,
      updatedAt: now
    };
    
    this.jobs.set(id, job);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: `ETL Job Created: ${job.name}`,
      message: `A new ETL job "${job.name}" (ID: ${id}) has been created`
    });
    
    return job;
  }
  
  /**
   * Update an existing ETL job
   */
  updateJob(id: number, jobData: Partial<Omit<ETLJob, 'id' | 'createdAt' | 'updatedAt'>>): ETLJob | undefined {
    const job = this.jobs.get(id);
    
    if (!job) {
      return undefined;
    }
    
    const updatedJob: ETLJob = {
      ...job,
      ...jobData,
      updatedAt: new Date()
    };
    
    this.jobs.set(id, updatedJob);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: `ETL Job Updated: ${updatedJob.name}`,
      message: `ETL job "${updatedJob.name}" (ID: ${id}) has been updated`
    });
    
    return updatedJob;
  }
  
  /**
   * Delete an ETL job
   */
  deleteJob(id: number): boolean {
    const job = this.jobs.get(id);
    
    if (!job) {
      return false;
    }
    
    // Delete job runs
    for (const [runId, run] of this.jobRuns.entries()) {
      if (run.jobId === id) {
        this.jobRuns.delete(runId);
      }
    }
    
    // Delete job
    this.jobs.delete(id);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: `ETL Job Deleted: ${job.name}`,
      message: `ETL job "${job.name}" (ID: ${id}) has been deleted`
    });
    
    return true;
  }
  
  /**
   * Get an ETL job by ID
   */
  getJob(id: number): ETLJob | undefined {
    return this.jobs.get(id);
  }
  
  /**
   * Get all ETL jobs
   */
  getAllJobs(): ETLJob[] {
    return Array.from(this.jobs.values());
  }
  
  /**
   * Execute an ETL job
   */
  async executeJob(id: number, runManually = false): Promise<JobRun | undefined> {
    const job = this.jobs.get(id);
    
    if (!job) {
      return undefined;
    }
    
    if (!job.enabled && !runManually) {
      alertService.createAlert({
        type: AlertType.WARNING,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.TRANSFORMATION,
        title: `Job Execution Skipped: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${id}) was not executed because it is disabled`
      });
      
      return undefined;
    }
    
    // Update job status
    job.status = JobStatus.RUNNING;
    job.updatedAt = new Date();
    
    // Create run
    const runId = `run-${this.nextRunId++}`;
    const run: JobRun = {
      id: runId,
      jobId: id,
      status: JobStatus.RUNNING,
      startTime: new Date(),
      recordCounts: {
        extracted: 0,
        transformed: 0,
        loaded: 0,
        failed: 0
      },
      executionTime: 0
    };
    
    this.jobRuns.set(runId, run);
    
    try {
      // Execute pipeline
      const result = await etlPipeline.executeJob(job, (status: ETLPipelineStatus) => {
        // Update run status
        run.status = status.status;
        run.recordCounts = {
          extracted: status.recordsExtracted,
          transformed: status.recordsTransformed,
          loaded: status.recordsLoaded,
          failed: status.recordsFailed
        };
        
        if (status.endTime) {
          run.endTime = status.endTime;
          run.executionTime = status.executionTime;
        }
        
        if (status.error) {
          run.error = status.error;
        }
        
        // Update job runs map
        this.jobRuns.set(runId, { ...run });
      });
      
      // Update job status
      job.status = result.status;
      job.updatedAt = new Date();
      
      return run;
    } catch (error) {
      // Handle error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update run
      run.status = JobStatus.FAILED;
      run.error = errorMessage;
      run.endTime = new Date();
      run.executionTime = run.endTime.getTime() - run.startTime.getTime();
      this.jobRuns.set(runId, run);
      
      // Update job
      job.status = JobStatus.FAILED;
      job.updatedAt = new Date();
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.TRANSFORMATION,
        title: `Job Execution Error: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${id}) execution failed: ${errorMessage}`
      });
      
      return run;
    }
  }
  
  /**
   * Schedule an ETL job
   */
  scheduleJob(jobId: number, schedule: ScheduleConfig): string | undefined {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return undefined;
    }
    
    // Schedule job
    const scheduledJobId = scheduler.scheduleJob(
      `ETL Job: ${job.name} (${jobId})`,
      schedule,
      async () => {
        // Execute job
        return await this.executeJob(jobId);
      }
    );
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: `Job Scheduled: ${job.name}`,
      message: `ETL job "${job.name}" (ID: ${jobId}) has been scheduled with frequency: ${schedule.frequency}`
    });
    
    return scheduledJobId;
  }
  
  /**
   * Unschedule an ETL job
   */
  unscheduleJob(jobId: number, scheduledJobId: string): boolean {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      return false;
    }
    
    // Delete scheduled job
    if (!scheduler.deleteJob(scheduledJobId)) {
      return false;
    }
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SCHEDULING,
      title: `Job Unscheduled: ${job.name}`,
      message: `ETL job "${job.name}" (ID: ${jobId}) has been unscheduled`
    });
    
    return true;
  }
  
  /**
   * Enable an ETL job
   */
  enableJob(id: number): boolean {
    const job = this.jobs.get(id);
    
    if (!job) {
      return false;
    }
    
    job.enabled = true;
    job.updatedAt = new Date();
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: `Job Enabled: ${job.name}`,
      message: `ETL job "${job.name}" (ID: ${id}) has been enabled`
    });
    
    return true;
  }
  
  /**
   * Disable an ETL job
   */
  disableJob(id: number): boolean {
    const job = this.jobs.get(id);
    
    if (!job) {
      return false;
    }
    
    job.enabled = false;
    job.updatedAt = new Date();
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: `Job Disabled: ${job.name}`,
      message: `ETL job "${job.name}" (ID: ${id}) has been disabled`
    });
    
    return true;
  }
  
  /**
   * Get job runs for a job
   */
  getJobRuns(jobId?: number): JobRun[] {
    if (jobId) {
      return Array.from(this.jobRuns.values()).filter(run => run.jobId === jobId);
    }
    
    return Array.from(this.jobRuns.values());
  }
  
  /**
   * Get a job run by ID
   */
  getJobRun(runId: string): JobRun | undefined {
    return this.jobRuns.get(runId);
  }
  
  /**
   * Get the last run for a job
   */
  getLastJobRun(jobId: number): JobRun | undefined {
    const runs = this.getJobRuns(jobId);
    
    if (runs.length === 0) {
      return undefined;
    }
    
    // Sort by start time (descending)
    runs.sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
    
    return runs[0];
  }
  
  /**
   * Test connection to a data source
   */
  async testConnection(dataSourceId: number): Promise<boolean> {
    try {
      const dataSource = dataConnector.getDataSource(dataSourceId);
      
      if (!dataSource) {
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.DATA_SOURCE,
          title: 'Connection Test Failed',
          message: `Data source with ID ${dataSourceId} not found`
        });
        
        return false;
      }
      
      const result = await dataConnector.testConnection(dataSource);
      
      if (result.success) {
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.DATA_SOURCE,
          title: `Connection Test Successful: ${dataSource.name}`,
          message: `Successfully connected to ${dataSource.name} (${dataSource.type})`
        });
        
        return true;
      } else {
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.DATA_SOURCE,
          title: `Connection Test Failed: ${dataSource.name}`,
          message: `Failed to connect to ${dataSource.name} (${dataSource.type}): ${result.error || 'Unknown error'}`
        });
        
        return false;
      }
    } catch (error) {
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.DATA_SOURCE,
        title: 'Connection Test Error',
        message: `Error testing connection: ${error instanceof Error ? error.message : String(error)}`
      });
      
      return false;
    }
  }
  
  /**
   * Get ETL system statistics
   */
  getStatistics(): {
    jobs: {
      total: number;
      active: number;
      inactive: number;
      byStatus: Record<JobStatus, number>;
    };
    runs: {
      total: number;
      successful: number;
      failed: number;
      inProgress: number;
    };
    dataSources: {
      total: number;
      byType: Record<string, number>;
    };
  } {
    // Job statistics
    const jobs = this.getAllJobs();
    const jobStats = {
      total: jobs.length,
      active: jobs.filter(job => job.enabled).length,
      inactive: jobs.filter(job => !job.enabled).length,
      byStatus: {
        [JobStatus.CREATED]: 0,
        [JobStatus.SCHEDULED]: 0,
        [JobStatus.QUEUED]: 0,
        [JobStatus.RUNNING]: 0,
        [JobStatus.SUCCEEDED]: 0,
        [JobStatus.FAILED]: 0,
        [JobStatus.CANCELED]: 0,
        [JobStatus.PAUSED]: 0
      }
    };
    
    for (const job of jobs) {
      jobStats.byStatus[job.status]++;
    }
    
    // Run statistics
    const runs = this.getJobRuns();
    const runStats = {
      total: runs.length,
      successful: runs.filter(run => run.status === JobStatus.SUCCEEDED).length,
      failed: runs.filter(run => run.status === JobStatus.FAILED).length,
      inProgress: runs.filter(run => run.status === JobStatus.RUNNING).length
    };
    
    // Data source statistics
    const dataSources = dataConnector.getAllDataSources();
    const dataSourceStats = {
      total: dataSources.length,
      byType: {} as Record<string, number>
    };
    
    for (const dataSource of dataSources) {
      const type = dataSource.type;
      
      if (!(type in dataSourceStats.byType)) {
        dataSourceStats.byType[type] = 0;
      }
      
      dataSourceStats.byType[type]++;
    }
    
    return {
      jobs: jobStats,
      runs: runStats,
      dataSources: dataSourceStats
    };
  }
}

// Export a singleton instance
export const etlPipelineManager = new ETLPipelineManager();