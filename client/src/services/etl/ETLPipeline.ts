/**
 * ETL Pipeline Service
 * 
 * This service manages ETL jobs, data sources, transformations, and job runs.
 * It provides functionality for creating, retrieving, and executing ETL jobs.
 */

/**
 * Data source interface for ETL
 */
export interface DataSource {
  id: string;
  name: string;
  type: 'database' | 'file' | 'api' | 'gis' | 'property';
  url?: string;
  path?: string;
  format?: string;
  enabled: boolean;
  description?: string;
  createdAt: Date;
}

/**
 * Data transformation interface for ETL
 */
export interface DataTransformation {
  id: string;
  name: string;
  type: 'filter' | 'map' | 'reduce' | 'enrich' | 'validate' | 'normalize' | 'join';
  sourceName: string;
  target?: string;
  enabled: boolean;
  script?: string;
  description?: string;
  order: number;
  createdAt: Date;
}

/**
 * ETL job interface
 */
export interface ETLJob {
  id: string;
  name: string;
  description?: string;
  sources: string[]; // Source IDs
  transformations: string[]; // Transformation IDs
  schedule?: string; // cron expression
  enabled: boolean;
  status: 'idle' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt?: Date;
  lastRun?: Date;
  nextRun?: Date;
}

/**
 * Records statistics for job runs
 */
export interface JobRecords {
  total: number;
  processed: number;
  succeeded: number;
  failed: number;
}

/**
 * Job run interface
 */
export interface JobRun {
  id: string;
  jobId: string;
  status: 'running' | 'completed' | 'failed';
  startTime: Date;
  endTime?: Date;
  error?: string;
  records: JobRecords;
}

/**
 * ETL Pipeline Service
 */
class ETLPipeline {
  private jobs: Map<string, ETLJob> = new Map();
  private dataSources: Map<string, DataSource> = new Map();
  private transformations: Map<string, DataTransformation> = new Map();
  private jobRuns: Map<string, JobRun[]> = new Map();
  
  private static instance: ETLPipeline;
  
  /**
   * Private constructor for singleton pattern
   */
  private constructor() {
    this.initializeSampleData();
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): ETLPipeline {
    if (!ETLPipeline.instance) {
      ETLPipeline.instance = new ETLPipeline();
    }
    return ETLPipeline.instance;
  }
  
  // Data sources
  
  /**
   * Get all data sources
   */
  public getDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }
  
  /**
   * Get a specific data source
   */
  public getDataSource(id: string): DataSource | undefined {
    return this.dataSources.get(id);
  }
  
  /**
   * Create a new data source
   */
  public createDataSource(source: Omit<DataSource, 'id' | 'createdAt'>): DataSource {
    const id = `source-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newSource: DataSource = {
      ...source,
      id,
      createdAt: new Date()
    };
    
    this.dataSources.set(id, newSource);
    return newSource;
  }
  
  // Transformations
  
  /**
   * Get all transformations
   */
  public getTransformations(): DataTransformation[] {
    return Array.from(this.transformations.values());
  }
  
  /**
   * Get a specific transformation
   */
  public getTransformation(id: string): DataTransformation | undefined {
    return this.transformations.get(id);
  }
  
  /**
   * Create a new transformation
   */
  public createTransformation(transformation: Omit<DataTransformation, 'id' | 'createdAt'>): DataTransformation {
    const id = `transform-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const newTransformation: DataTransformation = {
      ...transformation,
      id,
      createdAt: new Date()
    };
    
    this.transformations.set(id, newTransformation);
    return newTransformation;
  }
  
  // Jobs
  
  /**
   * Get all jobs
   */
  public getJobs(): ETLJob[] {
    return Array.from(this.jobs.values());
  }
  
  /**
   * Get a specific job
   */
  public getJob(id: string): ETLJob | undefined {
    return this.jobs.get(id);
  }
  
  /**
   * Create a new job
   */
  public createJob(job: Omit<ETLJob, 'id' | 'createdAt' | 'updatedAt'>): ETLJob {
    const id = `job-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date();
    
    const newJob: ETLJob = {
      ...job,
      id,
      createdAt: now,
      updatedAt: now
    };
    
    this.jobs.set(id, newJob);
    this.jobRuns.set(id, []);
    return newJob;
  }
  
  /**
   * Update an existing job
   */
  public updateJob(id: string, updates: Partial<ETLJob>): ETLJob {
    const job = this.jobs.get(id);
    
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }
    
    const updatedJob: ETLJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    };
    
    this.jobs.set(id, updatedJob);
    return updatedJob;
  }
  
  /**
   * Run a job
   */
  public async runJob(id: string): Promise<JobRun> {
    const job = this.jobs.get(id);
    
    if (!job) {
      throw new Error(`Job with ID ${id} not found`);
    }
    
    if (job.status === 'running') {
      throw new Error('Job is already running');
    }
    
    if (!job.enabled) {
      throw new Error('Job is disabled');
    }
    
    // Update job status
    job.status = 'running';
    job.lastRun = new Date();
    this.jobs.set(id, job);
    
    // Create a job run
    const runId = `run-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const run: JobRun = {
      id: runId,
      jobId: id,
      status: 'running',
      startTime: new Date(),
      records: {
        total: 0,
        processed: 0,
        succeeded: 0,
        failed: 0
      }
    };
    
    const jobRuns = this.jobRuns.get(id) || [];
    jobRuns.unshift(run);
    this.jobRuns.set(id, jobRuns);
    
    // Simulate job processing
    return new Promise((resolve) => {
      // Set a timeout to simulate job execution
      setTimeout(() => {
        // Generate random success or failure
        const success = Math.random() > 0.2; // 80% success rate
        
        // Calculate random record counts
        const total = Math.floor(Math.random() * 500) + 100;
        const succeeded = success ? total - Math.floor(Math.random() * 20) : Math.floor(total * 0.4);
        const failed = total - succeeded;
        
        // Update run
        run.status = success ? 'completed' : 'failed';
        run.endTime = new Date();
        run.records = {
          total,
          processed: total,
          succeeded,
          failed
        };
        
        if (!success) {
          run.error = 'Simulation error: Some records failed to process';
        }
        
        // Update job
        job.status = success ? 'completed' : 'failed';
        this.jobs.set(id, job);
        
        // Update job runs
        this.jobRuns.set(id, jobRuns);
        
        resolve(run);
      }, 3000); // Simulate 3 second execution time
    });
  }
  
  /**
   * Get all runs for a job
   */
  public getJobRuns(jobId: string): JobRun[] {
    return this.jobRuns.get(jobId) || [];
  }
  
  /**
   * Initialize sample data
   */
  private initializeSampleData() {
    // Create data sources
    const propertySource = this.createDataSource({
      name: 'Property Database',
      type: 'database',
      url: 'postgres://localhost:5432/properties',
      enabled: true,
      description: 'Main property database with all property records'
    });
    
    const gisSource = this.createDataSource({
      name: 'GIS Data API',
      type: 'api',
      url: 'https://api.gis.example.com/data',
      enabled: true,
      description: 'Geographic Information System API'
    });
    
    const demographicSource = this.createDataSource({
      name: 'Demographic Data',
      type: 'file',
      path: '/data/demographics.csv',
      format: 'csv',
      enabled: true,
      description: 'Demographic data by census tract'
    });
    
    // Create transformations
    const filterTransform = this.createTransformation({
      name: 'Filter Properties',
      type: 'filter',
      sourceName: 'Property Database',
      enabled: true,
      order: 1,
      script: 'return record.value > 100000',
      description: 'Filter out properties with values less than $100k'
    });
    
    const enrichTransform = this.createTransformation({
      name: 'Enrich with GIS Data',
      type: 'enrich',
      sourceName: 'GIS Data API',
      enabled: true,
      order: 2,
      description: 'Add GIS data to property records'
    });
    
    const joinTransform = this.createTransformation({
      name: 'Join Demographics',
      type: 'join',
      sourceName: 'Demographic Data',
      target: 'census_tract',
      enabled: true,
      order: 3,
      description: 'Join demographic data by census tract'
    });
    
    const validateTransform = this.createTransformation({
      name: 'Validate Properties',
      type: 'validate',
      sourceName: 'Property Database',
      enabled: true,
      order: 4,
      description: 'Validate property data completeness and consistency'
    });
    
    // Create jobs
    const dailyJob = this.createJob({
      name: 'Daily Property Processing',
      description: 'Process new property records daily',
      sources: [propertySource.id],
      transformations: [filterTransform.id, validateTransform.id],
      enabled: true,
      schedule: '0 0 * * *', // Daily at midnight
      status: 'idle'
    });
    
    const weeklyJob = this.createJob({
      name: 'Weekly Enrichment',
      description: 'Enrich property data with GIS and demographic data',
      sources: [propertySource.id, gisSource.id, demographicSource.id],
      transformations: [enrichTransform.id, joinTransform.id],
      enabled: true,
      schedule: '0 0 * * 0', // Weekly on Sunday
      status: 'idle'
    });
    
    const highFrequencyJob = this.createJob({
      name: 'High Frequency Property Updates',
      description: 'Process property updates frequently throughout the day',
      sources: [propertySource.id],
      transformations: [filterTransform.id],
      enabled: true,
      schedule: '*/5 * * * *', // Every 5 minutes
      status: 'idle'
    });
    
    // Create sample job runs
    const createSampleRuns = (jobId: string, count: number) => {
      const runs: JobRun[] = [];
      const now = new Date();
      
      for (let i = 0; i < count; i++) {
        const startTime = new Date(now.getTime() - (i + 1) * 24 * 60 * 60 * 1000);
        const endTime = new Date(startTime.getTime() + Math.floor(Math.random() * 60000) + 10000);
        const success = Math.random() > 0.3;
        
        const total = Math.floor(Math.random() * 500) + 100;
        const succeeded = success ? total - Math.floor(Math.random() * 20) : Math.floor(total * 0.6);
        const failed = total - succeeded;
        
        runs.push({
          id: `run-sample-${jobId}-${i}`,
          jobId,
          status: success ? 'completed' : 'failed',
          startTime,
          endTime,
          records: {
            total,
            processed: total,
            succeeded,
            failed
          },
          error: success ? undefined : 'Sample error message for demonstration'
        });
      }
      
      this.jobRuns.set(jobId, runs);
    };
    
    createSampleRuns(dailyJob.id, 7);
    createSampleRuns(weeklyJob.id, 4);
    createSampleRuns(highFrequencyJob.id, 12);
  }
}

// Export singleton instance
export default ETLPipeline.getInstance();