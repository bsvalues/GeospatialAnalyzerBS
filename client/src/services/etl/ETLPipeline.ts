/**
 * ETLPipeline.ts
 * 
 * Service for executing ETL (Extract, Transform, Load) pipelines
 */
import { DataSource, ETLJob, JobStatus, TransformationRule } from './ETLTypes';
import { dataConnector } from './DataConnector';
import { transformationService } from './TransformationService';

/**
 * Simple EventEmitter implementation that's browser compatible
 */
class EventEmitter {
  private events: Record<string, Array<(...args: any[]) => void>> = {};

  on(event: string, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      this.events[event] = [];
    }
    this.events[event].push(listener);
    return this;
  }

  emit(event: string, ...args: any[]): boolean {
    const listeners = this.events[event];
    if (!listeners || listeners.length === 0) {
      return false;
    }
    
    listeners.forEach(listener => {
      listener(...args);
    });
    return true;
  }

  removeListener(event: string, listener: (...args: any[]) => void): this {
    if (!this.events[event]) {
      return this;
    }
    
    const index = this.events[event].indexOf(listener);
    if (index !== -1) {
      this.events[event].splice(index, 1);
    }
    return this;
  }

  removeAllListeners(event?: string): this {
    if (event) {
      delete this.events[event];
    } else {
      this.events = {};
    }
    return this;
  }
}

/**
 * ETL pipeline progress event
 */
export interface ETLProgressEvent {
  jobId: string;
  phase: 'extract' | 'transform' | 'load';
  progress: number;
  status: JobStatus;
  message: string;
  timestamp: Date;
}

/**
 * ETL pipeline result
 */
export interface ETLPipelineResult {
  jobId: string;
  startTime: Date;
  endTime: Date;
  status: JobStatus;
  recordsExtracted: number;
  recordsLoaded: number;
  errors?: string[];
  warnings?: string[];
  logs: string[];
}

/**
 * ETL pipeline class
 */
export class ETLPipeline extends EventEmitter {
  private job: ETLJob;
  private sources: DataSource[];
  private transformations: TransformationRule[];
  private destinations: DataSource[];
  private logs: string[] = [];
  private errors: string[] = [];
  private warnings: string[] = [];
  
  /**
   * Constructor
   */
  constructor(
    job: ETLJob,
    sources: DataSource[],
    transformations: TransformationRule[],
    destinations: DataSource[]
  ) {
    super();
    
    this.job = job;
    this.sources = sources;
    this.transformations = transformations;
    this.destinations = destinations;
  }
  
  /**
   * Execute the ETL pipeline
   */
  public async execute(): Promise<ETLPipelineResult> {
    const startTime = new Date();
    let status: JobStatus = 'running';
    let recordsExtracted = 0;
    let recordsLoaded = 0;
    
    try {
      this.log(`Starting ETL job: ${this.job.name} (ID: ${this.job.id})`);
      
      // Extract data from sources
      this.emitProgress('extract', 0, 'Starting data extraction');
      const extractedData = await this.extractData();
      recordsExtracted = extractedData.reduce((total, source) => total + source.data.length, 0);
      this.log(`Extracted ${recordsExtracted} records from ${extractedData.length} sources`);
      this.emitProgress('extract', 100, `Extracted ${recordsExtracted} records`);
      
      // Transform data
      this.emitProgress('transform', 0, 'Starting data transformation');
      let transformedData = await this.transformData(extractedData);
      this.log(`Transformed data with ${this.transformations.length} transformations`);
      this.emitProgress('transform', 100, 'Data transformation completed');
      
      // Load data to destinations
      this.emitProgress('load', 0, 'Starting data loading');
      recordsLoaded = await this.loadData(transformedData);
      this.log(`Loaded ${recordsLoaded} records to ${this.destinations.length} destinations`);
      this.emitProgress('load', 100, `Loaded ${recordsLoaded} records`);
      
      status = 'completed';
    } catch (error) {
      console.error(`Error executing ETL job ${this.job.id}:`, error);
      this.logError(`ETL job failed: ${error instanceof Error ? error.message : String(error)}`);
      status = 'failed';
    }
    
    const endTime = new Date();
    
    // Close all connections
    await dataConnector.closeAllConnections();
    
    const result: ETLPipelineResult = {
      jobId: this.job.id,
      startTime,
      endTime,
      status,
      recordsExtracted,
      recordsLoaded,
      errors: this.errors.length > 0 ? this.errors : undefined,
      warnings: this.warnings.length > 0 ? this.warnings : undefined,
      logs: this.logs
    };
    
    this.emit('completed', result);
    return result;
  }
  
  /**
   * Extract data from sources
   */
  private async extractData(): Promise<Array<{ source: DataSource, data: any[] }>> {
    const results: Array<{ source: DataSource, data: any[] }> = [];
    
    // Get job sources from the full sources list
    const jobSources = this.sources.filter(s => this.job.sources?.includes(s.id));
    
    if (jobSources.length === 0) {
      this.logWarning('No sources defined for this job');
      return results;
    }
    
    // Extract data from each source
    for (let i = 0; i < jobSources.length; i++) {
      const source = jobSources[i];
      const progress = Math.round((i / jobSources.length) * 90); // 0-90% for extraction
      
      this.emitProgress('extract', progress, `Extracting data from ${source.name}`);
      
      try {
        this.log(`Extracting data from ${source.name} (ID: ${source.id})`);
        
        // Test connection before extracting
        const connectionTest = await dataConnector.testConnection(source);
        
        if (!connectionTest.success) {
          throw new Error(`Connection to ${source.name} failed: ${connectionTest.message}`);
        }
        
        // Extract data
        const data = await dataConnector.extractData(source);
        
        this.log(`Extracted ${data.length} records from ${source.name}`);
        results.push({ source, data });
      } catch (error) {
        this.logError(`Error extracting data from ${source.name}: ${error instanceof Error ? error.message : String(error)}`);
        
        // Check if we should continue on error
        if (!this.job.continueOnError) {
          throw error;
        }
      }
    }
    
    return results;
  }
  
  /**
   * Transform data from sources
   */
  private async transformData(extractedData: Array<{ source: DataSource, data: any[] }>): Promise<any[]> {
    if (extractedData.length === 0) {
      this.logWarning('No data to transform');
      return [];
    }
    
    if (!this.job.transformations || this.job.transformations.length === 0) {
      this.logWarning('No transformations defined for this job');
      
      // If no transformations are defined, return all extracted data merged
      return extractedData.reduce((allData, source) => [...allData, ...source.data], []);
    }
    
    // Get the transformation rules in the correct order
    const jobTransformations = this.transformations
      .filter(t => this.job.transformations?.includes(t.id))
      .sort((a, b) => a.order - b.order);
    
    // Start with all extracted data merged
    let data = extractedData.reduce((allData, source) => [...allData, ...source.data], []);
    
    // Apply each transformation
    for (let i = 0; i < jobTransformations.length; i++) {
      const transformation = jobTransformations[i];
      const progress = Math.round((i / jobTransformations.length) * 90); // 0-90% for transformation
      
      this.emitProgress('transform', progress, `Applying ${transformation.name}`);
      
      try {
        this.log(`Applying transformation ${transformation.name} (ID: ${transformation.id})`);
        
        // If this is a join transformation, we need to get the right data source
        if (transformation.type === 'join' && transformation.config?.rightSourceId) {
          const rightSourceId = transformation.config.rightSourceId;
          const rightSourceData = extractedData.find(s => s.source.id === rightSourceId);
          
          if (rightSourceData) {
            transformation.config.rightData = rightSourceData.data;
          } else {
            this.logWarning(`Right data source not found for join transformation: ${rightSourceId}`);
          }
        }
        
        // Apply the transformation
        data = transformationService.applyTransformation(data, transformation);
        
        this.log(`Transformation ${transformation.name} applied successfully`);
      } catch (error) {
        this.logError(`Error applying transformation ${transformation.name}: ${error instanceof Error ? error.message : String(error)}`);
        
        // Check if we should continue on error
        if (!this.job.continueOnError) {
          throw error;
        }
      }
    }
    
    return data;
  }
  
  /**
   * Load data to destinations
   */
  private async loadData(data: any[]): Promise<number> {
    if (data.length === 0) {
      this.logWarning('No data to load');
      return 0;
    }
    
    if (this.destinations.length === 0) {
      this.logWarning('No destinations defined for this job');
      return 0;
    }
    
    let totalLoaded = 0;
    
    // Load data to each destination
    for (let i = 0; i < this.destinations.length; i++) {
      const destination = this.destinations[i];
      const progress = Math.round((i / this.destinations.length) * 90); // 0-90% for loading
      
      this.emitProgress('load', progress, `Loading data to ${destination.name}`);
      
      try {
        this.log(`Loading ${data.length} records to ${destination.name} (ID: ${destination.id})`);
        
        // Test connection before loading
        const connectionTest = await dataConnector.testConnection(destination);
        
        if (!connectionTest.success) {
          throw new Error(`Connection to ${destination.name} failed: ${connectionTest.message}`);
        }
        
        // Load data
        const success = await dataConnector.loadData(data, destination);
        
        if (success) {
          this.log(`Successfully loaded ${data.length} records to ${destination.name}`);
          totalLoaded += data.length;
        } else {
          this.logWarning(`Failed to load data to ${destination.name}`);
        }
      } catch (error) {
        this.logError(`Error loading data to ${destination.name}: ${error instanceof Error ? error.message : String(error)}`);
        
        // Check if we should continue on error
        if (!this.job.continueOnError) {
          throw error;
        }
      }
    }
    
    return totalLoaded;
  }
  
  /**
   * Emit a progress event
   */
  private emitProgress(phase: 'extract' | 'transform' | 'load', progress: number, message: string): void {
    const event: ETLProgressEvent = {
      jobId: this.job.id,
      phase,
      progress,
      status: 'running',
      message,
      timestamp: new Date()
    };
    
    this.emit('progress', event);
  }
  
  /**
   * Log a message
   */
  private log(message: string): void {
    console.log(`[ETL:${this.job.id}] ${message}`);
    this.logs.push(`[${new Date().toISOString()}] ${message}`);
  }
  
  /**
   * Log an error message
   */
  private logError(message: string): void {
    console.error(`[ETL:${this.job.id}] ERROR: ${message}`);
    this.logs.push(`[${new Date().toISOString()}] ERROR: ${message}`);
    this.errors.push(message);
  }
  
  /**
   * Log a warning message
   */
  private logWarning(message: string): void {
    console.warn(`[ETL:${this.job.id}] WARNING: ${message}`);
    this.logs.push(`[${new Date().toISOString()}] WARNING: ${message}`);
    this.warnings.push(message);
  }
}

/**
 * Create and execute an ETL pipeline
 */
export async function executeETLPipeline(
  job: ETLJob,
  sources: DataSource[],
  transformations: TransformationRule[],
  destinations: DataSource[]
): Promise<ETLPipelineResult> {
  const pipeline = new ETLPipeline(job, sources, transformations, destinations);
  return await pipeline.execute();
}

// Create a singleton instance for use across the application
export const etlPipeline = {
  execute: executeETLPipeline,
  ETLPipeline
};