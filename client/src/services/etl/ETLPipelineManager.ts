import { 
  ETLJob, 
  JobStatus, 
  DataSource, 
  TransformationRule,
  DataSourceType,
  FilterOperator,
  FilterLogic,
  TransformationType,
  RecordCounts,
  SystemStatus
} from './ETLTypes';
import { etlPipeline, JobRun } from './ETLPipeline';
import { scheduler, ScheduleFrequency, ScheduleConfig } from './Scheduler';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * ETL Pipeline Manager
 * 
 * This class is responsible for coordinating all ETL services.
 * 
 * BROWSER COMPATIBILITY NOTE:
 * To ensure browser compatibility, this component uses plain JavaScript objects (Record)
 * instead of Map for data storage.
 */
class ETLPipelineManager {
  // Using Record objects for browser compatibility instead of Map
  private jobs: Record<number, ETLJob> = {};
  private dataSources: Record<number, DataSource> = {};
  private transformationRules: Record<number, TransformationRule> = {};
  private jobRuns: Record<string, JobRun> = {};
  private nextJobId = 1;
  private nextDataSourceId = 1;
  private nextTransformationRuleId = 1;
  private isInitialized = false;
  
  /**
   * Initialize the ETL pipeline manager
   */
  initialize(): void {
    if (this.isInitialized) {
      return;
    }
    
    // Initialize data
    this.initializeData();
    
    // Start scheduler
    scheduler.start(this.runJob.bind(this));
    
    this.isInitialized = true;
    
    // Log initialization
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.SYSTEM,
      title: 'ETL Pipeline Manager Initialized',
      message: 'ETL Pipeline Manager has been initialized'
    });
  }
  
  /**
   * Initialize data for demo purposes
   */
  private initializeData(): void {
    // Create data sources
    this.createDemoDataSources();
    
    // Create transformation rules
    this.createDemoTransformationRules();
    
    // Create jobs
    this.createDemoJobs();
    
    // Schedule jobs
    this.scheduleJobs();
  }
  
  /**
   * Create demo data sources
   */
  private createDemoDataSources(): void {
    // PostgreSQL source
    const postgresSource: DataSource = {
      id: this.nextDataSourceId++,
      name: 'PostgreSQL Database',
      type: DataSourceType.POSTGRESQL,
      config: {
        host: 'localhost',
        port: 5432,
        database: 'etl_source',
        user: 'etl_user',
        password: '********',
        options: {}
      },
      enabled: true,
      description: 'Main PostgreSQL database containing property records',
      tags: ['database', 'properties', 'source']
    };
    
    // REST API source
    const apiSource: DataSource = {
      id: this.nextDataSourceId++,
      name: 'Property API',
      type: DataSourceType.REST_API,
      config: {
        url: 'https://api.example.com/properties',
        method: 'GET',
        headers: {
          'Authorization': 'Bearer ********',
          'Content-Type': 'application/json'
        },
        options: {}
      },
      enabled: true,
      description: 'REST API for property data',
      tags: ['api', 'properties', 'source']
    };
    
    // CSV file source
    const csvSource: DataSource = {
      id: this.nextDataSourceId++,
      name: 'Property CSV',
      type: DataSourceType.FILE_CSV,
      config: {
        filePath: '/data/properties.csv',
        delimiter: ',',
        hasHeader: true,
        options: {}
      },
      enabled: true,
      description: 'CSV file containing property data',
      tags: ['file', 'csv', 'properties', 'source']
    };
    
    // In-memory source for testing
    const inMemorySource: DataSource = {
      id: this.nextDataSourceId++,
      name: 'In-Memory Source',
      type: DataSourceType.MEMORY,
      config: {
        data: [
          { id: 1, address: '123 Main St', city: 'Springfield', state: 'IL', zipCode: '62701', price: 250000, bedrooms: 3, bathrooms: 2, sqft: 1800 },
          { id: 2, address: '456 Elm St', city: 'Springfield', state: 'IL', zipCode: '62702', price: 180000, bedrooms: 2, bathrooms: 1, sqft: 1200 },
          { id: 3, address: '789 Oak St', city: 'Springfield', state: 'IL', zipCode: '62703', price: 320000, bedrooms: 4, bathrooms: 3, sqft: 2400 },
          { id: 4, address: '101 Pine St', city: 'Springfield', state: 'IL', zipCode: '62704', price: 210000, bedrooms: 3, bathrooms: 2, sqft: 1600 },
          { id: 5, address: '202 Maple St', city: 'Springfield', state: 'IL', zipCode: '62705', price: 275000, bedrooms: 3, bathrooms: 2.5, sqft: 2000 }
        ],
        options: {}
      },
      enabled: true,
      description: 'In-memory data for testing',
      tags: ['memory', 'testing', 'source']
    };
    
    // PostgreSQL destination
    const postgresDestination: DataSource = {
      id: this.nextDataSourceId++,
      name: 'PostgreSQL Destination',
      type: DataSourceType.POSTGRESQL,
      config: {
        host: 'localhost',
        port: 5432,
        database: 'etl_destination',
        user: 'etl_user',
        password: '********',
        options: {
          target: 'properties',
          loadMode: 'INSERT'
        }
      },
      enabled: true,
      description: 'PostgreSQL database for destination',
      tags: ['database', 'properties', 'destination']
    };
    
    // In-memory destination for testing
    const inMemoryDestination: DataSource = {
      id: this.nextDataSourceId++,
      name: 'In-Memory Destination',
      type: DataSourceType.MEMORY,
      config: {
        data: [],
        options: {
          target: 'properties',
          loadMode: 'INSERT'
        }
      },
      enabled: true,
      description: 'In-memory data for testing',
      tags: ['memory', 'testing', 'destination']
    };
    
    // Add data sources to record object
    this.dataSources[postgresSource.id] = postgresSource;
    this.dataSources[apiSource.id] = apiSource;
    this.dataSources[csvSource.id] = csvSource;
    this.dataSources[inMemorySource.id] = inMemorySource;
    this.dataSources[postgresDestination.id] = postgresDestination;
    this.dataSources[inMemoryDestination.id] = inMemoryDestination;
  }
  
  /**
   * Create demo transformation rules
   */
  private createDemoTransformationRules(): void {
    // Filter rule
    const filterRule: TransformationRule = {
      id: this.nextTransformationRuleId++,
      name: 'Filter Properties > $200k',
      type: TransformationType.FILTER,
      config: {
        conditions: [
          {
            field: 'price',
            operator: FilterOperator.GREATER_THAN,
            value: 200000
          }
        ],
        logic: FilterLogic.AND
      },
      order: 1,
      enabled: true,
      description: 'Filter properties with price > $200,000'
    };
    
    // Map rule
    const mapRule: TransformationRule = {
      id: this.nextTransformationRuleId++,
      name: 'Map Property Fields',
      type: TransformationType.MAP,
      config: {
        mappings: [
          { source: 'address', target: 'propertyAddress' },
          { source: 'city', target: 'propertyCity' },
          { source: 'state', target: 'propertyState' },
          { source: 'zipCode', target: 'propertyZipCode' },
          { source: 'price', target: 'propertyPrice' },
          { source: 'bedrooms', target: 'propertyBedrooms' },
          { source: 'bathrooms', target: 'propertyBathrooms' },
          { source: 'sqft', target: 'propertySqft' }
        ],
        includeOriginal: false
      },
      order: 2,
      enabled: true,
      description: 'Map property fields to new names'
    };
    
    // Validation rule
    const validationRule: TransformationRule = {
      id: this.nextTransformationRuleId++,
      name: 'Validate Property Data',
      type: TransformationType.VALIDATE,
      config: {
        validations: [
          { field: 'price', type: 'NUMBER', message: 'Price must be a number' },
          { field: 'bedrooms', type: 'INTEGER', message: 'Bedrooms must be an integer' },
          { field: 'bathrooms', type: 'NUMBER', message: 'Bathrooms must be a number' },
          { field: 'sqft', type: 'NUMBER', message: 'Square footage must be a number' }
        ],
        failOnError: true
      },
      order: 3,
      enabled: true,
      description: 'Validate property data'
    };
    
    // Aggregate rule
    const aggregateRule: TransformationRule = {
      id: this.nextTransformationRuleId++,
      name: 'Aggregate by City',
      type: TransformationType.AGGREGATE,
      config: {
        groupBy: ['city'],
        aggregations: [
          { field: 'id', function: 'COUNT', as: 'propertyCount' },
          { field: 'price', function: 'AVG', as: 'avgPrice' },
          { field: 'sqft', function: 'AVG', as: 'avgSqft' }
        ]
      },
      order: 4,
      enabled: false,
      description: 'Aggregate properties by city'
    };
    
    // Enrichment rule
    const enrichmentRule: TransformationRule = {
      id: this.nextTransformationRuleId++,
      name: 'Enrich with Geocodes',
      type: TransformationType.ENRICH,
      config: {
        type: 'GEOCODE',
        fields: [
          { source: 'address', target: 'geocode' }
        ]
      },
      order: 5,
      enabled: false,
      description: 'Enrich properties with geocodes'
    };
    
    // Add transformation rules to record object
    this.transformationRules[filterRule.id] = filterRule;
    this.transformationRules[mapRule.id] = mapRule;
    this.transformationRules[validationRule.id] = validationRule;
    this.transformationRules[aggregateRule.id] = aggregateRule;
    this.transformationRules[enrichmentRule.id] = enrichmentRule;
  }
  
  /**
   * Create demo jobs
   */
  private createDemoJobs(): void {
    // Property ETL job
    const propertyJob: ETLJob = {
      id: this.nextJobId++,
      name: 'Property ETL',
      sources: [4], // In-memory source
      destinations: [6], // In-memory destination
      transformations: [1, 2, 3], // Filter, Map, Validate
      status: JobStatus.IDLE,
      enabled: true,
      description: 'ETL job for property data'
    };
    
    // Property aggregation job
    const aggregationJob: ETLJob = {
      id: this.nextJobId++,
      name: 'Property Aggregation',
      sources: [4], // In-memory source
      destinations: [6], // In-memory destination
      transformations: [4], // Aggregate
      status: JobStatus.IDLE,
      enabled: false,
      description: 'Aggregation job for property data'
    };
    
    // Property enrichment job
    const enrichmentJob: ETLJob = {
      id: this.nextJobId++,
      name: 'Property Enrichment',
      sources: [4], // In-memory source
      destinations: [6], // In-memory destination
      transformations: [5], // Enrichment
      status: JobStatus.IDLE,
      enabled: false,
      description: 'Enrichment job for property data'
    };
    
    // Add jobs to record object
    this.jobs[propertyJob.id] = propertyJob;
    this.jobs[aggregationJob.id] = aggregationJob;
    this.jobs[enrichmentJob.id] = enrichmentJob;
  }
  
  /**
   * Schedule jobs
   */
  private scheduleJobs(): void {
    // Schedule property ETL job to run daily
    const propertyJobSchedule: ScheduleConfig = {
      frequency: ScheduleFrequency.DAILY,
      time: '00:00',
      enabled: true
    };
    
    scheduler.scheduleJob(1, propertyJobSchedule);
    
    // Schedule property aggregation job to run weekly
    const aggregationJobSchedule: ScheduleConfig = {
      frequency: ScheduleFrequency.WEEKLY,
      dayOfWeek: 1, // Monday
      time: '01:00',
      enabled: false
    };
    
    scheduler.scheduleJob(2, aggregationJobSchedule);
    
    // Schedule property enrichment job to run monthly
    const enrichmentJobSchedule: ScheduleConfig = {
      frequency: ScheduleFrequency.MONTHLY,
      dayOfMonth: 1,
      time: '02:00',
      enabled: false
    };
    
    scheduler.scheduleJob(3, enrichmentJobSchedule);
  }
  
  /**
   * Run a job
   */
  async runJob(jobId: number): Promise<void> {
    // Get job
    const job = this.jobs[jobId];
    
    if (!job) {
      throw new Error(`Job with ID ${jobId} not found`);
    }
    
    if (!job.enabled) {
      throw new Error(`Job "${job.name}" (ID: ${jobId}) is disabled`);
    }
    
    // Update job status
    job.status = JobStatus.RUNNING;
    
    try {
      // Convert data structures to format expected by etlPipeline.executeJob
      const dataSources = new Map<number, DataSource>();
      Object.entries(this.dataSources).forEach(([key, value]) => {
        dataSources.set(Number(key), value);
      });
      
      const transformationRules = new Map<number, TransformationRule>();
      Object.entries(this.transformationRules).forEach(([key, value]) => {
        transformationRules.set(Number(key), value);
      });
      
      // Execute job
      const jobRun = await etlPipeline.executeJob(job, dataSources, transformationRules, true);
      
      // Add job run to record object
      this.jobRuns[jobRun.id] = jobRun;
      
      // Update job status
      job.status = jobRun.status;
      
      return;
    } catch (error) {
      // Update job status
      job.status = JobStatus.FAILED;
      
      // Re-throw error
      throw error;
    }
  }
  
  /**
   * Get all jobs
   */
  getAllJobs(): ETLJob[] {
    return Object.values(this.jobs);
  }
  
  /**
   * Get a job by ID
   */
  getJob(jobId: number): ETLJob | undefined {
    return this.jobs[jobId];
  }
  
  /**
   * Create a job
   */
  createJob(job: Omit<ETLJob, 'id' | 'status'>): ETLJob {
    const newJob: ETLJob = {
      id: this.nextJobId++,
      status: JobStatus.IDLE,
      ...job
    };
    
    this.jobs[newJob.id] = newJob;
    
    // Log job created
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: 'Job Created',
      message: `Job "${newJob.name}" (ID: ${newJob.id}) has been created`
    });
    
    return newJob;
  }
  
  /**
   * Update a job
   */
  updateJob(jobId: number, job: Partial<Omit<ETLJob, 'id'>>): ETLJob | undefined {
    const existingJob = this.jobs[jobId];
    
    if (!existingJob) {
      return undefined;
    }
    
    const updatedJob: ETLJob = {
      ...existingJob,
      ...job,
      id: existingJob.id
    };
    
    this.jobs[jobId] = updatedJob;
    
    // Log job updated
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: 'Job Updated',
      message: `Job "${updatedJob.name}" (ID: ${updatedJob.id}) has been updated`
    });
    
    return updatedJob;
  }
  
  /**
   * Delete a job
   */
  deleteJob(jobId: number): boolean {
    const job = this.jobs[jobId];
    
    if (!job) {
      return false;
    }
    
    // Unschedule job
    scheduler.unscheduleJob(jobId);
    
    // Delete job
    delete this.jobs[jobId];
    const result = !this.jobs[jobId];
    
    // Log job deleted
    if (result) {
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.JOB,
        title: 'Job Deleted',
        message: `Job "${job.name}" (ID: ${jobId}) has been deleted`
      });
    }
    
    return result;
  }
  
  /**
   * Enable a job
   */
  enableJob(jobId: number): boolean {
    const job = this.jobs[jobId];
    
    if (!job) {
      return false;
    }
    
    job.enabled = true;
    
    // Log job enabled
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: 'Job Enabled',
      message: `Job "${job.name}" (ID: ${jobId}) has been enabled`
    });
    
    return true;
  }
  
  /**
   * Disable a job
   */
  disableJob(jobId: number): boolean {
    const job = this.jobs[jobId];
    
    if (!job) {
      return false;
    }
    
    job.enabled = false;
    
    // Log job disabled
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.JOB,
      title: 'Job Disabled',
      message: `Job "${job.name}" (ID: ${jobId}) has been disabled`
    });
    
    return true;
  }
  
  /**
   * Get all data sources
   */
  getAllDataSources(): DataSource[] {
    return Object.values(this.dataSources);
  }
  
  /**
   * Get a data source by ID
   */
  getDataSource(dataSourceId: number): DataSource | undefined {
    return this.dataSources[dataSourceId];
  }
  
  /**
   * Create a data source
   */
  createDataSource(dataSource: Omit<DataSource, 'id'>): DataSource {
    const newDataSource: DataSource = {
      id: this.nextDataSourceId++,
      ...dataSource
    };
    
    this.dataSources[newDataSource.id] = newDataSource;
    
    // Log data source created
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.DATA_SOURCE,
      title: 'Data Source Created',
      message: `Data source "${newDataSource.name}" (ID: ${newDataSource.id}) has been created`
    });
    
    return newDataSource;
  }
  
  /**
   * Update a data source
   */
  updateDataSource(dataSourceId: number, dataSource: Partial<Omit<DataSource, 'id'>>): DataSource | undefined {
    const existingDataSource = this.dataSources[dataSourceId];
    
    if (!existingDataSource) {
      return undefined;
    }
    
    const updatedDataSource: DataSource = {
      ...existingDataSource,
      ...dataSource,
      id: existingDataSource.id
    };
    
    this.dataSources[dataSourceId] = updatedDataSource;
    
    // Log data source updated
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.DATA_SOURCE,
      title: 'Data Source Updated',
      message: `Data source "${updatedDataSource.name}" (ID: ${updatedDataSource.id}) has been updated`
    });
    
    return updatedDataSource;
  }
  
  /**
   * Delete a data source
   */
  deleteDataSource(dataSourceId: number): boolean {
    const dataSource = this.dataSources[dataSourceId];
    
    if (!dataSource) {
      return false;
    }
    
    // Check if data source is used by any jobs
    const jobsUsingDataSource = this.getAllJobs().filter(
      job => job.sources.includes(dataSourceId) || job.destinations.includes(dataSourceId)
    );
    
    if (jobsUsingDataSource.length > 0) {
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.DATA_SOURCE,
        title: 'Data Source Deletion Failed',
        message: `Cannot delete data source "${dataSource.name}" (ID: ${dataSourceId}) because it is used by ${jobsUsingDataSource.length} jobs`
      });
      
      return false;
    }
    
    // Delete data source
    delete this.dataSources[dataSourceId];
    const result = !this.dataSources[dataSourceId];
    
    // Log data source deleted
    if (result) {
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.DATA_SOURCE,
        title: 'Data Source Deleted',
        message: `Data source "${dataSource.name}" (ID: ${dataSourceId}) has been deleted`
      });
    }
    
    return result;
  }
  
  /**
   * Enable a data source
   */
  enableDataSource(dataSourceId: number): boolean {
    const dataSource = this.dataSources[dataSourceId];
    
    if (!dataSource) {
      return false;
    }
    
    dataSource.enabled = true;
    
    // Log data source enabled
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.DATA_SOURCE,
      title: 'Data Source Enabled',
      message: `Data source "${dataSource.name}" (ID: ${dataSourceId}) has been enabled`
    });
    
    return true;
  }
  
  /**
   * Disable a data source
   */
  disableDataSource(dataSourceId: number): boolean {
    const dataSource = this.dataSources[dataSourceId];
    
    if (!dataSource) {
      return false;
    }
    
    dataSource.enabled = false;
    
    // Log data source disabled
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.DATA_SOURCE,
      title: 'Data Source Disabled',
      message: `Data source "${dataSource.name}" (ID: ${dataSourceId}) has been disabled`
    });
    
    return true;
  }
  
  /**
   * Get all transformation rules
   */
  getAllTransformationRules(): TransformationRule[] {
    return Object.values(this.transformationRules);
  }
  
  /**
   * Get a transformation rule by ID
   */
  getTransformationRule(transformationRuleId: number): TransformationRule | undefined {
    return this.transformationRules[transformationRuleId];
  }
  
  /**
   * Create a transformation rule
   */
  createTransformationRule(transformationRule: Omit<TransformationRule, 'id'>): TransformationRule {
    const newTransformationRule: TransformationRule = {
      id: this.nextTransformationRuleId++,
      ...transformationRule
    };
    
    this.transformationRules[newTransformationRule.id] = newTransformationRule;
    
    // Log transformation rule created
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: 'Transformation Rule Created',
      message: `Transformation rule "${newTransformationRule.name}" (ID: ${newTransformationRule.id}) has been created`
    });
    
    return newTransformationRule;
  }
  
  /**
   * Update a transformation rule
   */
  updateTransformationRule(
    transformationRuleId: number, 
    transformationRule: Partial<Omit<TransformationRule, 'id'>>
  ): TransformationRule | undefined {
    const existingTransformationRule = this.transformationRules[transformationRuleId];
    
    if (!existingTransformationRule) {
      return undefined;
    }
    
    const updatedTransformationRule: TransformationRule = {
      ...existingTransformationRule,
      ...transformationRule,
      id: existingTransformationRule.id
    };
    
    this.transformationRules[transformationRuleId] = updatedTransformationRule;
    
    // Log transformation rule updated
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: 'Transformation Rule Updated',
      message: `Transformation rule "${updatedTransformationRule.name}" (ID: ${updatedTransformationRule.id}) has been updated`
    });
    
    return updatedTransformationRule;
  }
  
  /**
   * Delete a transformation rule
   */
  deleteTransformationRule(transformationRuleId: number): boolean {
    const transformationRule = this.transformationRules[transformationRuleId];
    
    if (!transformationRule) {
      return false;
    }
    
    // Check if transformation rule is used by any jobs
    const jobsUsingTransformationRule = this.getAllJobs().filter(
      job => job.transformations.includes(transformationRuleId)
    );
    
    if (jobsUsingTransformationRule.length > 0) {
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.TRANSFORMATION,
        title: 'Transformation Rule Deletion Failed',
        message: `Cannot delete transformation rule "${transformationRule.name}" (ID: ${transformationRuleId}) because it is used by ${jobsUsingTransformationRule.length} jobs`
      });
      
      return false;
    }
    
    // Delete transformation rule
    delete this.transformationRules[transformationRuleId];
    const result = !this.transformationRules[transformationRuleId];
    
    // Log transformation rule deleted
    if (result) {
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.TRANSFORMATION,
        title: 'Transformation Rule Deleted',
        message: `Transformation rule "${transformationRule.name}" (ID: ${transformationRuleId}) has been deleted`
      });
    }
    
    return result;
  }
  
  /**
   * Enable a transformation rule
   */
  enableTransformationRule(transformationRuleId: number): boolean {
    const transformationRule = this.transformationRules[transformationRuleId];
    
    if (!transformationRule) {
      return false;
    }
    
    transformationRule.enabled = true;
    
    // Log transformation rule enabled
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: 'Transformation Rule Enabled',
      message: `Transformation rule "${transformationRule.name}" (ID: ${transformationRuleId}) has been enabled`
    });
    
    return true;
  }
  
  /**
   * Disable a transformation rule
   */
  disableTransformationRule(transformationRuleId: number): boolean {
    const transformationRule = this.transformationRules[transformationRuleId];
    
    if (!transformationRule) {
      return false;
    }
    
    transformationRule.enabled = false;
    
    // Log transformation rule disabled
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.TRANSFORMATION,
      title: 'Transformation Rule Disabled',
      message: `Transformation rule "${transformationRule.name}" (ID: ${transformationRuleId}) has been disabled`
    });
    
    return true;
  }
  
  /**
   * Get all job runs
   */
  getAllJobRuns(): JobRun[] {
    return Object.values(this.jobRuns);
  }
  
  /**
   * Get job runs for a specific job
   */
  getJobRunsForJob(jobId: number): JobRun[] {
    return this.getAllJobRuns().filter(run => run.jobId === jobId);
  }
  
  /**
   * Get a job run by ID
   */
  getJobRun(jobRunId: string): JobRun | undefined {
    return this.jobRuns[jobRunId];
  }
  
  /**
   * Get system status
   */
  getSystemStatus(): SystemStatus {
    // Get job counts
    const jobs = this.getAllJobs();
    const enabledJobCount = jobs.filter(job => job.enabled).length;
    const runningJobCount = jobs.filter(job => job.status === JobStatus.RUNNING).length;
    
    // Get data source counts
    const dataSources = this.getAllDataSources();
    const enabledDataSourceCount = dataSources.filter(ds => ds.enabled).length;
    
    // Get transformation rule counts
    const transformationRules = this.getAllTransformationRules();
    const enabledTransformationRuleCount = transformationRules.filter(rule => rule.enabled).length;
    
    // Get scheduler status
    const schedulerStatus = scheduler.getJobExecutionCounts();
    
    // Get job runs counts
    const jobRuns = this.getAllJobRuns();
    const recentJobRuns = jobRuns.filter(run => {
      const runTime = run.startTime.getTime();
      const now = new Date().getTime();
      const oneDay = 24 * 60 * 60 * 1000;
      return now - runTime < oneDay;
    });
    
    const failedJobRuns = recentJobRuns.filter(run => run.status === JobStatus.FAILED).length;
    const successJobRuns = recentJobRuns.filter(run => run.status === JobStatus.SUCCEEDED).length;
    
    // Calculate record counts
    const recordCounts: RecordCounts = {
      extracted: 0,
      transformed: 0,
      loaded: 0,
      rejected: 0
    };
    
    for (const run of recentJobRuns) {
      recordCounts.extracted += run.recordCounts.extracted;
      recordCounts.transformed += run.recordCounts.transformed;
      recordCounts.loaded += run.recordCounts.loaded;
      recordCounts.rejected += run.recordCounts.rejected;
    }
    
    return {
      jobCount: jobs.length,
      enabledJobCount,
      runningJobCount,
      dataSourceCount: dataSources.length,
      enabledDataSourceCount,
      transformationRuleCount: transformationRules.length,
      enabledTransformationRuleCount,
      schedulerStatus,
      recentJobRuns: recentJobRuns.length,
      failedJobRuns,
      successJobRuns,
      recordCounts
    };
  }
}

// Export singleton instance
// Create a singleton instance for export
export const etlPipelineManager = new ETLPipelineManager();