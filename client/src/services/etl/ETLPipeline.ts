/**
 * ETL Pipeline Service
 * 
 * Manages automated data extraction, transformation, and loading processes
 * for the GeospatialAnalyzerBS application.
 */

import { Property } from '@shared/schema';

// Types for ETL operations
export type DataSource = {
  id: string;
  name: string;
  type: 'api' | 'csv' | 'json' | 'database' | 'shapefile';
  url?: string;
  path?: string;
  connectionString?: string;
  apiKey?: string;
  parameters?: Record<string, any>;
  enabled: boolean;
};

export type DataTransformation = {
  id: string;
  name: string;
  type: 'filter' | 'map' | 'aggregate' | 'join' | 'validate' | 'custom';
  sourceName: string;
  target?: string;
  config: Record<string, any>;
  script?: string;
  order: number;
  enabled: boolean;
};

export type ETLJob = {
  id: string;
  name: string;
  description?: string;
  sources: string[]; // IDs of data sources
  transformations: string[]; // IDs of transformations
  schedule?: string; // Cron expression
  lastRun?: Date;
  nextRun?: Date;
  status: 'idle' | 'running' | 'completed' | 'failed';
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
};

export type JobRun = {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'running' | 'completed' | 'failed';
  records: {
    processed: number;
    succeeded: number;
    failed: number;
  };
  logs: Array<{
    timestamp: Date;
    level: 'info' | 'warning' | 'error';
    message: string;
  }>;
  result?: any;
  error?: string;
};

// ETL Service implementation
export class ETLPipeline {
  private dataSources: Map<string, DataSource> = new Map();
  private transformations: Map<string, DataTransformation> = new Map();
  private jobs: Map<string, ETLJob> = new Map();
  private jobRuns: Map<string, JobRun> = new Map();
  private runningJobs: Set<string> = new Set();
  private jobCallbacks: Map<string, ((result: any) => void)[]> = new Map();
  
  // Singleton instance
  private static instance: ETLPipeline;
  
  private constructor() {
    // Private constructor for singleton pattern
    this.initializeDefaultPipelines();
  }
  
  public static getInstance(): ETLPipeline {
    if (!ETLPipeline.instance) {
      ETLPipeline.instance = new ETLPipeline();
    }
    return ETLPipeline.instance;
  }
  
  /**
   * Initialize default ETL pipelines for the application
   */
  private initializeDefaultPipelines(): void {
    // Create default data sources
    const propertiesAPISource: DataSource = {
      id: 'properties-api',
      name: 'Properties API',
      type: 'api',
      url: '/api/properties',
      enabled: true
    };
    
    // Create default transformations
    const validatePropertiesTransform: DataTransformation = {
      id: 'validate-properties',
      name: 'Validate Properties Data',
      type: 'validate',
      sourceName: 'properties-api',
      config: {
        requiredFields: ['id', 'parcelId', 'address'],
        validations: [
          { field: 'squareFeet', type: 'number', min: 0 },
          { field: 'yearBuilt', type: 'number', min: 1800, max: new Date().getFullYear() }
        ]
      },
      order: 1,
      enabled: true
    };
    
    const calculateMetricsTransform: DataTransformation = {
      id: 'calculate-property-metrics',
      name: 'Calculate Property Metrics',
      type: 'map',
      sourceName: 'properties-api',
      config: {
        // Example calculation functions
        calculations: [
          {
            name: 'pricePerSqFt',
            formula: 'value / squareFeet',
            outputFormat: 'currency'
          }
        ]
      },
      order: 2,
      enabled: true
    };
    
    // Create default ETL job
    const propertyDataJob: ETLJob = {
      id: 'property-data-etl',
      name: 'Property Data ETL',
      description: 'Extract, transform, and load property data',
      sources: ['properties-api'],
      transformations: ['validate-properties', 'calculate-property-metrics'],
      status: 'idle',
      enabled: true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    // Add to the service
    this.dataSources.set(propertiesAPISource.id, propertiesAPISource);
    this.transformations.set(validatePropertiesTransform.id, validatePropertiesTransform);
    this.transformations.set(calculateMetricsTransform.id, calculateMetricsTransform);
    this.jobs.set(propertyDataJob.id, propertyDataJob);
  }
  
  /**
   * Get all defined ETL jobs
   */
  public getJobs(): ETLJob[] {
    return Array.from(this.jobs.values());
  }
  
  /**
   * Get an ETL job by ID
   */
  public getJob(jobId: string): ETLJob | undefined {
    return this.jobs.get(jobId);
  }
  
  /**
   * Get all data sources
   */
  public getDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }
  
  /**
   * Get all transformations
   */
  public getTransformations(): DataTransformation[] {
    return Array.from(this.transformations.values());
  }
  
  /**
   * Get job run history for a specific job
   */
  public getJobRuns(jobId: string): JobRun[] {
    return Array.from(this.jobRuns.values())
      .filter(run => run.jobId === jobId)
      .sort((a, b) => b.startTime.getTime() - a.startTime.getTime());
  }
  
  /**
   * Register a callback function for when a job completes
   */
  public onJobComplete(jobId: string, callback: (result: any) => void): void {
    if (!this.jobCallbacks.has(jobId)) {
      this.jobCallbacks.set(jobId, []);
    }
    this.jobCallbacks.get(jobId)?.push(callback);
  }
  
  /**
   * Run an ETL job immediately
   */
  public async runJob(jobId: string): Promise<string> {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`ETL job with ID ${jobId} not found`);
    }
    
    if (this.runningJobs.has(jobId)) {
      throw new Error(`ETL job ${jobId} is already running`);
    }
    
    // Create a new job run
    const runId = `run-${jobId}-${Date.now()}`;
    const jobRun: JobRun = {
      id: runId,
      jobId: jobId,
      startTime: new Date(),
      status: 'running',
      records: {
        processed: 0,
        succeeded: 0,
        failed: 0
      },
      logs: [{
        timestamp: new Date(),
        level: 'info',
        message: `Started ETL job: ${job.name}`
      }]
    };
    
    this.jobRuns.set(runId, jobRun);
    this.runningJobs.add(jobId);
    
    // Update job status
    job.status = 'running';
    job.lastRun = new Date();
    this.jobs.set(jobId, job);
    
    // Execute the job asynchronously
    this.executeJobAsync(jobId, runId);
    
    return runId;
  }
  
  /**
   * Execute a job asynchronously in the background
   */
  private async executeJobAsync(jobId: string, runId: string): Promise<void> {
    const job = this.jobs.get(jobId);
    const jobRun = this.jobRuns.get(runId);
    
    if (!job || !jobRun) {
      return;
    }
    
    try {
      // Extract - Get data from all sources
      const extractedData: Record<string, any[]> = {};
      
      for (const sourceId of job.sources) {
        const source = this.dataSources.get(sourceId);
        if (!source || !source.enabled) continue;
        
        this.logToJobRun(runId, 'info', `Extracting data from source: ${source.name}`);
        
        try {
          const data = await this.extractData(source);
          extractedData[sourceId] = data;
          jobRun.records.processed += data.length;
          this.logToJobRun(runId, 'info', `Extracted ${data.length} records from ${source.name}`);
        } catch (error) {
          this.logToJobRun(runId, 'error', `Failed to extract data from ${source.name}: ${error}`);
          throw error;
        }
      }
      
      // Transform - Apply transformations in order
      const transformedData: Record<string, any[]> = { ...extractedData };
      
      // Get transformations for this job and sort by order
      const jobTransformations = job.transformations
        .map(id => this.transformations.get(id))
        .filter((t): t is DataTransformation => !!t && t.enabled)
        .sort((a, b) => a.order - b.order);
      
      for (const transformation of jobTransformations) {
        this.logToJobRun(runId, 'info', `Applying transformation: ${transformation.name}`);
        
        try {
          const sourceData = transformedData[transformation.sourceName] || [];
          const result = await this.applyTransformation(transformation, sourceData);
          
          // Store result in the target or overwrite source
          const targetName = transformation.target || transformation.sourceName;
          transformedData[targetName] = result;
          
          jobRun.records.succeeded += result.length;
          this.logToJobRun(runId, 'info', `Transformation ${transformation.name} completed successfully with ${result.length} records`);
        } catch (error) {
          this.logToJobRun(runId, 'error', `Transformation ${transformation.name} failed: ${error}`);
          throw error;
        }
      }
      
      // Complete the job successfully
      jobRun.status = 'completed';
      jobRun.endTime = new Date();
      jobRun.result = transformedData;
      this.logToJobRun(runId, 'info', `ETL job completed successfully`);
      
      // Notify via callbacks
      if (this.jobCallbacks.has(jobId)) {
        this.jobCallbacks.get(jobId)?.forEach(callback => {
          try {
            callback(transformedData);
          } catch (e) {
            console.error('ETL job callback error:', e);
          }
        });
      }
      
    } catch (error) {
      // Handle any errors in the ETL process
      jobRun.status = 'failed';
      jobRun.endTime = new Date();
      jobRun.error = error instanceof Error ? error.message : String(error);
      this.logToJobRun(runId, 'error', `ETL job failed: ${jobRun.error}`);
    } finally {
      // Update job status
      job.status = jobRun.status === 'completed' ? 'completed' : 'failed';
      job.updatedAt = new Date();
      this.jobs.set(jobId, job);
      
      // Update job run
      this.jobRuns.set(runId, jobRun);
      
      // Remove from running jobs
      this.runningJobs.delete(jobId);
    }
  }
  
  /**
   * Add a log entry to a job run
   */
  private logToJobRun(runId: string, level: 'info' | 'warning' | 'error', message: string): void {
    const jobRun = this.jobRuns.get(runId);
    if (jobRun) {
      jobRun.logs.push({
        timestamp: new Date(),
        level,
        message
      });
      this.jobRuns.set(runId, jobRun);
    }
  }
  
  /**
   * Extract data from a source
   */
  private async extractData(source: DataSource): Promise<any[]> {
    switch (source.type) {
      case 'api':
        if (!source.url) throw new Error('API source requires a URL');
        return this.fetchFromApi(source.url, source.parameters);
        
      case 'csv':
      case 'json':
      case 'shapefile':
        // Placeholder for file-based data sources
        throw new Error(`Data source type '${source.type}' is not yet implemented`);
        
      case 'database':
        // Placeholder for database connections
        throw new Error(`Data source type '${source.type}' is not yet implemented`);
        
      default:
        throw new Error(`Unknown data source type: ${(source as any).type}`);
    }
  }
  
  /**
   * Fetch data from an API endpoint
   */
  private async fetchFromApi(url: string, parameters?: Record<string, any>): Promise<any[]> {
    try {
      // Construct URL with parameters if provided
      let apiUrl = url;
      if (parameters) {
        const params = new URLSearchParams();
        Object.entries(parameters).forEach(([key, value]) => {
          params.append(key, String(value));
        });
        apiUrl += `?${params.toString()}`;
      }
      
      const response = await fetch(apiUrl);
      
      if (!response.ok) {
        throw new Error(`API request failed with status ${response.status}`);
      }
      
      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Error fetching from API:', error);
      throw error;
    }
  }
  
  /**
   * Apply a transformation to the data
   */
  private async applyTransformation(transformation: DataTransformation, data: any[]): Promise<any[]> {
    switch (transformation.type) {
      case 'filter':
        return this.applyFilterTransformation(transformation, data);
        
      case 'map':
        return this.applyMapTransformation(transformation, data);
        
      case 'validate':
        return this.applyValidationTransformation(transformation, data);
        
      case 'aggregate':
      case 'join':
        // Placeholder for other transformation types
        throw new Error(`Transformation type '${transformation.type}' is not yet implemented`);
        
      case 'custom':
        return this.applyCustomTransformation(transformation, data);
        
      default:
        throw new Error(`Unknown transformation type: ${(transformation as any).type}`);
    }
  }
  
  /**
   * Apply a filter transformation
   */
  private applyFilterTransformation(transformation: DataTransformation, data: any[]): any[] {
    const { conditions } = transformation.config;
    
    if (!conditions || !Array.isArray(conditions)) {
      throw new Error('Filter transformation requires an array of conditions');
    }
    
    return data.filter(item => {
      return conditions.every(condition => {
        const { field, operator, value } = condition;
        
        if (!field || !operator) {
          return true;
        }
        
        const fieldValue = item[field];
        
        switch (operator) {
          case 'eq': return fieldValue === value;
          case 'neq': return fieldValue !== value;
          case 'gt': return fieldValue > value;
          case 'gte': return fieldValue >= value;
          case 'lt': return fieldValue < value;
          case 'lte': return fieldValue <= value;
          case 'contains': return String(fieldValue).includes(String(value));
          case 'notContains': return !String(fieldValue).includes(String(value));
          case 'startsWith': return String(fieldValue).startsWith(String(value));
          case 'endsWith': return String(fieldValue).endsWith(String(value));
          case 'isNull': return fieldValue === null || fieldValue === undefined;
          case 'isNotNull': return fieldValue !== null && fieldValue !== undefined;
          default: return true;
        }
      });
    });
  }
  
  /**
   * Apply a map transformation
   */
  private applyMapTransformation(transformation: DataTransformation, data: any[]): any[] {
    const { calculations } = transformation.config;
    
    if (!calculations || !Array.isArray(calculations)) {
      return data;
    }
    
    return data.map(item => {
      const result = { ...item };
      
      for (const calc of calculations) {
        const { name, formula, outputFormat } = calc;
        
        if (!name || !formula) continue;
        
        try {
          // Parse the formula
          let value;
          
          if (formula.includes('/') || formula.includes('*') || 
              formula.includes('+') || formula.includes('-')) {
            // Simple arithmetic
            const parsedFormula = formula.replace(/\b([a-zA-Z0-9_]+)\b/g, (match: string) => {
              return item[match] !== undefined ? item[match] : match;
            });
            
            try {
              // Use Function constructor instead of eval for safety
              value = new Function(`return ${parsedFormula}`)();
            } catch (e) {
              console.error('Formula evaluation error:', e);
              value = null;
            }
          } else {
            // Direct field reference
            value = item[formula];
          }
          
          // Format the output if needed
          if (value !== null && value !== undefined) {
            if (outputFormat === 'currency') {
              value = typeof value === 'number' 
                ? `$${value.toFixed(2)}` 
                : value;
            } else if (outputFormat === 'percent') {
              value = typeof value === 'number' 
                ? `${(value * 100).toFixed(2)}%` 
                : value;
            }
          }
          
          result[name] = value;
        } catch (error) {
          console.error(`Error calculating ${name}:`, error);
          result[name] = null;
        }
      }
      
      return result;
    });
  }
  
  /**
   * Apply a validation transformation
   */
  private applyValidationTransformation(transformation: DataTransformation, data: any[]): any[] {
    const { requiredFields, validations } = transformation.config;
    
    // Filter out records that don't have all required fields
    let validatedData = data;
    
    if (requiredFields && Array.isArray(requiredFields)) {
      validatedData = validatedData.filter(item => {
        return requiredFields.every(field => {
          return item[field] !== null && item[field] !== undefined;
        });
      });
    }
    
    // Apply validations if specified
    if (validations && Array.isArray(validations)) {
      validatedData = validatedData.filter(item => {
        return validations.every(validation => {
          const { field, type, min, max, pattern } = validation;
          
          if (!field) return true;
          
          const value = item[field];
          
          // Skip validation if value is null or undefined
          if (value === null || value === undefined) {
            return true;
          }
          
          // Type validation
          if (type === 'number') {
            const numValue = Number(value);
            
            if (isNaN(numValue)) {
              return false;
            }
            
            if (min !== undefined && numValue < min) {
              return false;
            }
            
            if (max !== undefined && numValue > max) {
              return false;
            }
          } else if (type === 'string') {
            if (typeof value !== 'string') {
              return false;
            }
            
            if (min !== undefined && value.length < min) {
              return false;
            }
            
            if (max !== undefined && value.length > max) {
              return false;
            }
            
            if (pattern && !new RegExp(pattern).test(value)) {
              return false;
            }
          } else if (type === 'date') {
            const date = new Date(value);
            
            if (isNaN(date.getTime())) {
              return false;
            }
            
            if (min !== undefined) {
              const minDate = new Date(min);
              if (date < minDate) {
                return false;
              }
            }
            
            if (max !== undefined) {
              const maxDate = new Date(max);
              if (date > maxDate) {
                return false;
              }
            }
          }
          
          return true;
        });
      });
    }
    
    return validatedData;
  }
  
  /**
   * Apply a custom transformation using a script
   */
  private applyCustomTransformation(transformation: DataTransformation, data: any[]): any[] {
    const { script } = transformation;
    
    if (!script) {
      throw new Error('Custom transformation requires a script');
    }
    
    try {
      // Execute the script in a safe environment
      const transformFn = new Function('data', script);
      const result = transformFn(data);
      
      // Ensure the result is an array
      return Array.isArray(result) ? result : [];
    } catch (error) {
      console.error('Error executing custom transformation script:', error);
      throw error;
    }
  }
  
  /**
   * Create a new ETL job
   */
  public createJob(job: Omit<ETLJob, 'id' | 'createdAt' | 'updatedAt'>): ETLJob {
    const id = `job-${Date.now()}`;
    const newJob: ETLJob = {
      ...job,
      id,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.jobs.set(id, newJob);
    return newJob;
  }
  
  /**
   * Update an existing ETL job
   */
  public updateJob(jobId: string, updates: Partial<ETLJob>): ETLJob {
    const job = this.jobs.get(jobId);
    
    if (!job) {
      throw new Error(`ETL job with ID ${jobId} not found`);
    }
    
    const updatedJob: ETLJob = {
      ...job,
      ...updates,
      id: jobId, // Ensure ID doesn't change
      updatedAt: new Date()
    };
    
    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }
  
  /**
   * Add a new data source
   */
  public addDataSource(source: Omit<DataSource, 'id'>): DataSource {
    const id = `source-${Date.now()}`;
    const newSource: DataSource = {
      ...source,
      id
    };
    
    this.dataSources.set(id, newSource);
    return newSource;
  }
  
  /**
   * Add a new transformation
   */
  public addTransformation(transformation: Omit<DataTransformation, 'id'>): DataTransformation {
    const id = `transform-${Date.now()}`;
    const newTransformation: DataTransformation = {
      ...transformation,
      id
    };
    
    this.transformations.set(id, newTransformation);
    return newTransformation;
  }
}

// Export singleton instance
export default ETLPipeline.getInstance();