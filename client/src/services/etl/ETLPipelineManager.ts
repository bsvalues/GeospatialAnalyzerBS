import { 
  ETLJob, 
  JobStatus, 
  DataSource, 
  TransformationRule, 
  JobFrequency,
  SystemStatus,
  DataSourceType
} from './ETLTypes';
import { etlPipeline, JobRun } from './ETLPipeline';
import { dataConnector, ConnectionResult } from './DataConnector';
import { scheduler } from './Scheduler';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * ETL Pipeline Manager
 * 
 * This class coordinates all ETL operations and maintains system state.
 */
class ETLPipelineManager {
  private initialized: boolean = false;
  private running: boolean = false;
  private startTime: Date = new Date();
  private lastError?: string;
  
  private jobs: Map<number, ETLJob> = new Map();
  private dataSources: Map<number, DataSource> = new Map();
  private transformationRules: Map<number, TransformationRule> = new Map();
  private jobRuns: Map<string, JobRun> = new Map();
  
  private nextJobId: number = 1;
  private nextDataSourceId: number = 1;
  private nextTransformationRuleId: number = 1;
  
  /**
   * Initialize the ETL system with sample data
   */
  initialize(): void {
    if (this.initialized) {
      return;
    }
    
    this.createSampleDataSources();
    this.createSampleTransformationRules();
    this.createSampleJobs();
    
    this.initialized = true;
    this.running = true;
    this.startTime = new Date();
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SYSTEM,
      title: 'ETL System Initialized',
      message: 'ETL system has been initialized successfully'
    });
  }
  
  /**
   * Create sample data sources
   */
  private createSampleDataSources(): void {
    // Create property API data source
    this.registerDataSource({
      id: this.nextDataSourceId++,
      name: 'Property API',
      description: 'RESTful API for property data',
      type: DataSourceType.REST_API,
      enabled: true,
      config: {
        url: 'https://api.example.com/properties',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sample-token'
        },
        data: [
          { id: 1, addr: '123 Main St', price: 350000, sqft: 2200, yearBuilt: 2005, type: 'residential', latitude: 47.608013, longitude: -122.335167 },
          { id: 2, addr: '456 Oak Ave', price: 425000, sqft: 2500, yearBuilt: 2010, type: 'residential', latitude: 47.608013, longitude: -122.335167 },
          { id: 3, addr: '789 Pine St', price: 275000, sqft: 1800, yearBuilt: 1998, type: 'residential', latitude: 47.608013, longitude: -122.335167 },
          { id: 4, addr: '101 Business Rd', price: 750000, sqft: 5000, yearBuilt: 2015, type: 'commercial', latitude: 47.608013, longitude: -122.335167 },
          { id: 5, addr: '202 Industrial Park', price: 550000, sqft: 7500, yearBuilt: 1995, type: 'industrial', latitude: 47.608013, longitude: -122.335167 }
        ],
        options: {
          loadMode: 'INSERT',
          target: 'properties'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create property database
    this.registerDataSource({
      id: this.nextDataSourceId++,
      name: 'Property Database',
      description: 'PostgreSQL database for property data',
      type: DataSourceType.POSTGRESQL,
      enabled: true,
      config: {
        host: 'localhost',
        port: 5432,
        database: 'properties_db',
        user: 'postgres',
        data: [],
        options: {
          loadMode: 'INSERT',
          target: 'properties'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create user API data source
    this.registerDataSource({
      id: this.nextDataSourceId++,
      name: 'User API',
      description: 'RESTful API for user data',
      type: DataSourceType.REST_API,
      enabled: true,
      config: {
        url: 'https://api.example.com/users',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sample-token'
        },
        data: [
          { id: 1, name: 'John Doe', email: 'john@example.com', role: 'admin' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', role: 'user' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', role: 'user' }
        ],
        options: {
          loadMode: 'INSERT',
          target: 'users'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create user database
    this.registerDataSource({
      id: this.nextDataSourceId++,
      name: 'User Database',
      description: 'PostgreSQL database for user data',
      type: DataSourceType.POSTGRESQL,
      enabled: true,
      config: {
        host: 'localhost',
        port: 5432,
        database: 'users_db',
        user: 'postgres',
        data: [],
        options: {
          loadMode: 'INSERT',
          target: 'users'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create analytics API data source
    this.registerDataSource({
      id: this.nextDataSourceId++,
      name: 'Analytics API',
      description: 'RESTful API for analytics data',
      type: DataSourceType.REST_API,
      enabled: true,
      config: {
        url: 'https://api.example.com/analytics',
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': 'Bearer sample-token'
        },
        data: [
          { id: 1, event: 'pageview', page: '/home', count: 1250, date: '2023-01-01' },
          { id: 2, event: 'pageview', page: '/properties', count: 875, date: '2023-01-01' },
          { id: 3, event: 'pageview', page: '/contact', count: 320, date: '2023-01-01' },
          { id: 4, event: 'conversion', page: '/properties', count: 45, date: '2023-01-01' }
        ],
        options: {
          loadMode: 'INSERT',
          target: 'analytics'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create analytics database
    this.registerDataSource({
      id: this.nextDataSourceId++,
      name: 'Analytics Database',
      description: 'PostgreSQL database for analytics data',
      type: DataSourceType.POSTGRESQL,
      enabled: true,
      config: {
        host: 'localhost',
        port: 5432,
        database: 'analytics_db',
        user: 'postgres',
        data: [],
        options: {
          loadMode: 'INSERT',
          target: 'analytics'
        }
      },
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  /**
   * Create sample transformation rules
   */
  private createSampleTransformationRules(): void {
    // Create property filter transformation
    this.registerTransformationRule({
      id: this.nextTransformationRuleId++,
      name: 'Filter Residential Properties',
      description: 'Filter to include only residential properties',
      type: 'FILTER',
      config: {
        conditions: [
          {
            field: 'type',
            operator: 'EQUALS',
            value: 'residential'
          }
        ],
        logic: 'AND'
      },
      enabled: true,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create property mapping transformation
    this.registerTransformationRule({
      id: this.nextTransformationRuleId++,
      name: 'Map Property Fields',
      description: 'Map property fields to database schema',
      type: 'MAP',
      config: {
        mappings: [
          { source: 'id', target: 'property_id' },
          { source: 'addr', target: 'address' },
          { source: 'price', target: 'list_price' },
          { source: 'sqft', target: 'square_feet' },
          { source: 'yearBuilt', target: 'year_built' },
          { source: 'type', target: 'property_type' },
          { source: 'latitude', target: 'lat' },
          { source: 'longitude', target: 'lng' }
        ],
        includeOriginal: false
      },
      enabled: true,
      order: 2,
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create user filter transformation
    this.registerTransformationRule({
      id: this.nextTransformationRuleId++,
      name: 'Filter Admin Users',
      description: 'Filter to include only admin users',
      type: 'FILTER',
      config: {
        conditions: [
          {
            field: 'role',
            operator: 'EQUALS',
            value: 'admin'
          }
        ],
        logic: 'AND'
      },
      enabled: true,
      order: 1,
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  /**
   * Create sample jobs
   */
  private createSampleJobs(): void {
    // Create property sync job
    this.registerJob({
      id: this.nextJobId++,
      name: 'Property Data Sync',
      description: 'Sync property data from API to database',
      sources: [1], // Property API
      destinations: [2], // Property Database
      transformations: [1, 2], // Filter Residential Properties, Map Property Fields
      status: JobStatus.CREATED,
      enabled: true,
      frequency: JobFrequency.DAILY,
      schedule: '0 0 * * *', // Midnight every day
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create user sync job
    this.registerJob({
      id: this.nextJobId++,
      name: 'User Data Sync',
      description: 'Sync user data from API to database',
      sources: [3], // User API
      destinations: [4], // User Database
      transformations: [3], // Filter Admin Users
      status: JobStatus.CREATED,
      enabled: true,
      frequency: JobFrequency.HOURLY,
      schedule: '0 * * * *', // Every hour
      createdAt: new Date(),
      updatedAt: new Date()
    });
    
    // Create analytics sync job
    this.registerJob({
      id: this.nextJobId++,
      name: 'Analytics Data Sync',
      description: 'Sync analytics data from API to database',
      sources: [5], // Analytics API
      destinations: [6], // Analytics Database
      transformations: [],
      status: JobStatus.CREATED,
      enabled: true,
      frequency: JobFrequency.DAILY,
      schedule: '0 1 * * *', // 1 AM every day
      createdAt: new Date(),
      updatedAt: new Date()
    });
  }
  
  /**
   * Shut down the ETL system
   */
  shutdown(): void {
    if (!this.running) {
      return;
    }
    
    scheduler.cancelAllJobs();
    this.running = false;
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.MEDIUM,
      category: AlertCategory.SYSTEM,
      title: 'ETL System Shutdown',
      message: 'ETL system has been shut down'
    });
  }
  
  /**
   * Get system status
   */
  getSystemStatus(): SystemStatus {
    const now = new Date();
    const uptime = now.getTime() - this.startTime.getTime();
    
    // Count active jobs
    const activeJobs = Array.from(this.jobs.values()).filter(job => 
      job.enabled && 
      [JobStatus.SCHEDULED, JobStatus.QUEUED, JobStatus.RUNNING].includes(job.status)
    ).length;
    
    // Count pending jobs
    const pendingJobs = Array.from(this.jobs.values()).filter(job => 
      job.enabled && job.status === JobStatus.QUEUED
    ).length;
    
    return {
      initialized: this.initialized,
      running: this.running,
      lastError: this.lastError,
      activeJobs,
      pendingJobs,
      memoryUsage: 0, // Not applicable in browser
      uptime,
      currentTime: now
    };
  }
  
  /**
   * Register a data source
   */
  registerDataSource(dataSource: DataSource): DataSource {
    this.dataSources.set(dataSource.id, dataSource);
    console.log('Data source registered with ID:', dataSource.id);
    return dataSource;
  }
  
  /**
   * Get a data source by ID
   */
  getDataSource(id: number): DataSource | undefined {
    return this.dataSources.get(id);
  }
  
  /**
   * Get all data sources
   */
  getAllDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }
  
  /**
   * Register a transformation rule
   */
  registerTransformationRule(rule: TransformationRule): TransformationRule {
    this.transformationRules.set(rule.id, rule);
    return rule;
  }
  
  /**
   * Get a transformation rule by ID
   */
  getTransformationRule(id: number): TransformationRule | undefined {
    return this.transformationRules.get(id);
  }
  
  /**
   * Get all transformation rules
   */
  getAllTransformationRules(): TransformationRule[] {
    return Array.from(this.transformationRules.values());
  }
  
  /**
   * Register a job
   */
  registerJob(job: ETLJob): ETLJob {
    this.jobs.set(job.id, job);
    
    // Schedule the job if it's enabled
    if (job.enabled && job.frequency !== JobFrequency.ONCE) {
      scheduler.scheduleJob(
        `job-${job.id}`,
        job.schedule || this.getDefaultSchedule(job.frequency),
        async () => {
          await this.executeJob(job.id, false);
        }
      );
      
      // Update job status
      job.status = JobStatus.SCHEDULED;
      job.nextRunAt = scheduler.getNextRunDate(`job-${job.id}`);
    }
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: `Job Registered: ${job.name}`,
      message: `ETL job "${job.name}" (ID: ${job.id}) has been registered`
    });
    
    return job;
  }
  
  /**
   * Get a job by ID
   */
  getJob(id: number): ETLJob | undefined {
    return this.jobs.get(id);
  }
  
  /**
   * Get all jobs
   */
  getAllJobs(): ETLJob[] {
    return Array.from(this.jobs.values());
  }
  
  /**
   * Delete a job
   */
  deleteJob(id: number): boolean {
    const job = this.jobs.get(id);
    
    if (!job) {
      return false;
    }
    
    // Unschedule job if scheduled
    scheduler.cancelJob(`job-${id}`);
    
    // Remove job
    this.jobs.delete(id);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.MEDIUM,
      category: AlertCategory.JOB,
      title: `Job Deleted: ${job.name}`,
      message: `ETL job "${job.name}" (ID: ${id}) has been deleted`
    });
    
    return true;
  }
  
  /**
   * Enable a job
   */
  enableJob(id: number): ETLJob | undefined {
    const job = this.jobs.get(id);
    
    if (!job) {
      return undefined;
    }
    
    job.enabled = true;
    job.updatedAt = new Date();
    
    // Schedule the job if it's not a one-time job
    if (job.frequency !== JobFrequency.ONCE) {
      scheduler.scheduleJob(
        `job-${job.id}`,
        job.schedule || this.getDefaultSchedule(job.frequency),
        async () => {
          await this.executeJob(job.id, false);
        }
      );
      
      // Update job status
      job.status = JobStatus.SCHEDULED;
      job.nextRunAt = scheduler.getNextRunDate(`job-${job.id}`);
    }
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: `Job Enabled: ${job.name}`,
      message: `ETL job "${job.name}" (ID: ${id}) has been enabled`
    });
    
    return job;
  }
  
  /**
   * Disable a job
   */
  disableJob(id: number): ETLJob | undefined {
    const job = this.jobs.get(id);
    
    if (!job) {
      return undefined;
    }
    
    job.enabled = false;
    job.updatedAt = new Date();
    
    // Unschedule the job
    scheduler.cancelJob(`job-${job.id}`);
    
    // Update job status if it was scheduled
    if (job.status === JobStatus.SCHEDULED) {
      job.status = JobStatus.CREATED;
      job.nextRunAt = undefined;
    }
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: `Job Disabled: ${job.name}`,
      message: `ETL job "${job.name}" (ID: ${id}) has been disabled`
    });
    
    return job;
  }
  
  /**
   * Execute a job
   */
  async executeJob(id: number, isManual: boolean = false): Promise<JobRun | undefined> {
    const job = this.jobs.get(id);
    
    if (!job) {
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.JOB,
        title: 'Job Execution Failed',
        message: `Job with ID ${id} not found`
      });
      return undefined;
    }
    
    if (!job.enabled) {
      alertService.createAlert({
        type: AlertType.WARNING,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.JOB,
        title: `Job Execution Skipped: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${id}) is disabled and cannot be executed`
      });
      return undefined;
    }
    
    if (job.status === JobStatus.RUNNING) {
      alertService.createAlert({
        type: AlertType.WARNING,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.JOB,
        title: `Job Execution Skipped: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${id}) is already running`
      });
      return undefined;
    }
    
    // Update job status
    const prevStatus = job.status;
    job.status = JobStatus.RUNNING;
    job.updatedAt = new Date();
    
    try {
      // Execute job
      const run = await etlPipeline.executeJob(job, this.dataSources, this.transformationRules, isManual);
      
      // Store job run
      this.jobRuns.set(run.id, run);
      
      // Update job status and timestamps
      job.status = run.status;
      job.lastRunAt = run.startTime;
      
      // Update next run time if scheduled
      if (prevStatus === JobStatus.SCHEDULED) {
        job.nextRunAt = scheduler.getNextRunDate(`job-${job.id}`);
      }
      
      return run;
    } catch (error) {
      // Handle execution error
      const errorMessage = error instanceof Error ? error.message : String(error);
      this.lastError = errorMessage;
      
      // Update job status
      job.status = JobStatus.FAILED;
      job.lastRunAt = new Date();
      
      // Log error
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.JOB,
        title: `Job Execution Error: ${job.name}`,
        message: `Error executing ETL job "${job.name}" (ID: ${id}): ${errorMessage}`
      });
      
      return undefined;
    }
  }
  
  /**
   * Get job runs
   */
  getJobRuns(): JobRun[] {
    return Array.from(this.jobRuns.values());
  }
  
  /**
   * Get job run by ID
   */
  getJobRun(id: string): JobRun | undefined {
    return this.jobRuns.get(id);
  }
  
  /**
   * Get job runs for a specific job
   */
  getJobRunsByJobId(jobId: number): JobRun[] {
    return this.getJobRuns().filter(run => run.jobId === jobId);
  }
  
  /**
   * Test connection to a data source
   */
  async testConnection(dataSourceId: number): Promise<ConnectionResult> {
    const dataSource = this.dataSources.get(dataSourceId);
    
    if (!dataSource) {
      return {
        success: false,
        error: `Data source with ID ${dataSourceId} not found`
      };
    }
    
    try {
      const result = await dataConnector.testConnection(dataSource);
      
      if (result.success) {
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.DATA_SOURCE,
          title: `Connection Test Successful: ${dataSource.name}`,
          message: `Successfully connected to data source "${dataSource.name}" (ID: ${dataSourceId})`
        });
      } else {
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_SOURCE,
          title: `Connection Test Failed: ${dataSource.name}`,
          message: `Failed to connect to data source "${dataSource.name}" (ID: ${dataSourceId}): ${result.error}`
        });
      }
      
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.DATA_SOURCE,
        title: `Connection Test Error: ${dataSource.name}`,
        message: `Error testing connection to data source "${dataSource.name}" (ID: ${dataSourceId}): ${errorMessage}`
      });
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Get default schedule for a job frequency
   */
  private getDefaultSchedule(frequency: JobFrequency): string {
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
        
      default:
        return '0 0 * * *'; // Default to midnight every day
    }
  }
  
  /**
   * Get job statistics
   */
  getJobStats(): { total: number; active: number; inactive: number; byStatus: Record<JobStatus, number> } {
    const jobs = this.getAllJobs();
    const stats = {
      total: jobs.length,
      active: 0,
      inactive: 0,
      byStatus: {
        [JobStatus.CREATED]: 0,
        [JobStatus.SCHEDULED]: 0,
        [JobStatus.QUEUED]: 0,
        [JobStatus.RUNNING]: 0,
        [JobStatus.SUCCEEDED]: 0,
        [JobStatus.FAILED]: 0,
        [JobStatus.CANCELLED]: 0,
        [JobStatus.SKIPPED]: 0
      }
    };
    
    for (const job of jobs) {
      // Count by enabled status
      if (job.enabled) {
        stats.active++;
      } else {
        stats.inactive++;
      }
      
      // Count by job status
      stats.byStatus[job.status]++;
    }
    
    return stats;
  }
}

// Export singleton instance
export const etlPipelineManager = new ETLPipelineManager();