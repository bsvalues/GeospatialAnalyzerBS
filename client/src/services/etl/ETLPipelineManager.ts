/**
 * ETL Pipeline Manager
 * 
 * This module orchestrates the ETL (Extract, Transform, Load) processes
 * in the application. It manages data extraction from various sources,
 * transformation of that data, and loading it into the target data store.
 */

import { DataConnector } from './DataConnector';
import { zillowDataConnector } from './ZillowDataConnector';
import { googleMapsDataConnector } from './GoogleMapsDataConnector';
import { v4 as uuidv4 } from 'uuid';

/**
 * DataSource interface defines a data source with a unique ID
 * and a reference to its data connector
 */
export interface DataSource {
  id: string;
  name: string;
  connector: DataConnector;
  isAvailable: boolean;
}

/**
 * ETLJob interface defines an ETL job that can be executed 
 * to extract, transform, and load data
 */
export interface ETLJob {
  id: string;
  name: string;
  sourceId: string;
  description: string;
  status: 'pending' | 'running' | 'completed' | 'failed';
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
  error?: string;
}

/**
 * ETLPipelineManager is responsible for orchestrating the ETL processes
 */
export class ETLPipelineManager {
  private dataSources: Map<string, DataSource>;
  private activeJobs: Map<string, ETLJob>;
  
  /**
   * Initialize the ETL Pipeline Manager and register the available data sources
   */
  constructor() {
    this.dataSources = new Map<string, DataSource>();
    this.activeJobs = new Map<string, ETLJob>();
    this.registerDataSources();
  }
  
  /**
   * Register all available data sources
   */
  private async registerDataSources() {
    // Register Zillow data source
    const zillowId = uuidv4();
    this.dataSources.set(zillowId, {
      id: zillowId,
      name: zillowDataConnector.getSourceName(),
      connector: zillowDataConnector,
      isAvailable: false
    });
    
    // Register Google Maps data source
    const googleMapsId = uuidv4();
    this.dataSources.set(googleMapsId, {
      id: googleMapsId,
      name: googleMapsDataConnector.getSourceName(),
      connector: googleMapsDataConnector,
      isAvailable: false
    });
    
    // Check availability of all data sources
    this.checkDataSourcesAvailability();
    
    // Log that the data sources have been registered
    console.log('Google Maps data source registered with ID:', googleMapsId);
  }
  
  /**
   * Check the availability of all registered data sources
   */
  public async checkDataSourcesAvailability() {
    for (const [id, dataSource] of this.dataSources.entries()) {
      try {
        const isAvailable = await dataSource.connector.checkAvailability();
        const updatedSource = { ...dataSource, isAvailable };
        this.dataSources.set(id, updatedSource);
      } catch (error) {
        console.error(`Error checking availability of ${dataSource.name}:`, error);
        const updatedSource = { ...dataSource, isAvailable: false };
        this.dataSources.set(id, updatedSource);
      }
    }
  }
  
  /**
   * Get all registered data sources
   * @returns {DataSource[]} Array of all registered data sources
   */
  public getDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }
  
  /**
   * Get a specific data source by its ID
   * @param {string} id - The ID of the data source
   * @returns {DataSource | undefined} The data source with the specified ID, or undefined if not found
   */
  public getDataSourceById(id: string): DataSource | undefined {
    return this.dataSources.get(id);
  }
  
  /**
   * Create a new ETL job for the specified data source
   * @param {string} sourceId - The ID of the data source to use for this job
   * @param {string} name - The name of the ETL job
   * @param {string} description - A description of what the ETL job does
   * @returns {ETLJob} The newly created ETL job
   */
  public createETLJob(sourceId: string, name: string, description: string): ETLJob {
    const dataSource = this.dataSources.get(sourceId);
    if (!dataSource) {
      throw new Error(`Data source with ID ${sourceId} not found`);
    }
    
    if (!dataSource.isAvailable) {
      throw new Error(`Data source ${dataSource.name} is not available`);
    }
    
    const jobId = uuidv4();
    const now = new Date();
    
    const job: ETLJob = {
      id: jobId,
      name,
      sourceId,
      description,
      status: 'pending',
      createdAt: now,
      updatedAt: now
    };
    
    this.activeJobs.set(jobId, job);
    return job;
  }
  
  /**
   * Get a specific ETL job by its ID
   * @param {string} id - The ID of the ETL job
   * @returns {ETLJob | undefined} The ETL job with the specified ID, or undefined if not found
   */
  public getETLJobById(id: string): ETLJob | undefined {
    return this.activeJobs.get(id);
  }
  
  /**
   * Get all ETL jobs
   * @returns {ETLJob[]} Array of all ETL jobs
   */
  public getETLJobs(): ETLJob[] {
    return Array.from(this.activeJobs.values());
  }
  
  /**
   * Start an ETL job by its ID
   * @param {string} id - The ID of the ETL job to start
   * @returns {ETLJob} The updated ETL job
   */
  public startETLJob(id: string): ETLJob {
    const job = this.activeJobs.get(id);
    if (!job) {
      throw new Error(`ETL job with ID ${id} not found`);
    }
    
    if (job.status === 'running') {
      throw new Error(`ETL job ${job.name} is already running`);
    }
    
    const now = new Date();
    const updatedJob: ETLJob = {
      ...job,
      status: 'running',
      startedAt: now,
      updatedAt: now
    };
    
    this.activeJobs.set(id, updatedJob);
    
    // In a real implementation, this would actually start the ETL process
    // and update the job status when it completes or fails
    
    // For now, we'll just simulate completion after a short delay
    setTimeout(() => {
      this.completeETLJob(id);
    }, 5000);
    
    return updatedJob;
  }
  
  /**
   * Mark an ETL job as completed
   * @param {string} id - The ID of the ETL job to complete
   * @returns {ETLJob} The updated ETL job
   */
  private completeETLJob(id: string): ETLJob {
    const job = this.activeJobs.get(id);
    if (!job) {
      throw new Error(`ETL job with ID ${id} not found`);
    }
    
    const now = new Date();
    const updatedJob: ETLJob = {
      ...job,
      status: 'completed',
      completedAt: now,
      updatedAt: now
    };
    
    this.activeJobs.set(id, updatedJob);
    return updatedJob;
  }
  
  /**
   * Mark an ETL job as failed with an error message
   * @param {string} id - The ID of the ETL job that failed
   * @param {string} errorMessage - The error message explaining why the job failed
   * @returns {ETLJob} The updated ETL job
   */
  public failETLJob(id: string, errorMessage: string): ETLJob {
    const job = this.activeJobs.get(id);
    if (!job) {
      throw new Error(`ETL job with ID ${id} not found`);
    }
    
    const now = new Date();
    const updatedJob: ETLJob = {
      ...job,
      status: 'failed',
      error: errorMessage,
      updatedAt: now
    };
    
    this.activeJobs.set(id, updatedJob);
    return updatedJob;
  }
  
  /**
   * Cancel an ETL job that is currently running
   * @param {string} id - The ID of the ETL job to cancel
   * @returns {ETLJob} The updated ETL job
   */
  public cancelETLJob(id: string): ETLJob {
    const job = this.activeJobs.get(id);
    if (!job) {
      throw new Error(`ETL job with ID ${id} not found`);
    }
    
    if (job.status !== 'running') {
      throw new Error(`ETL job ${job.name} is not running`);
    }
    
    const now = new Date();
    const updatedJob: ETLJob = {
      ...job,
      status: 'failed',
      error: 'Job was cancelled',
      updatedAt: now
    };
    
    this.activeJobs.set(id, updatedJob);
    return updatedJob;
  }
}

// Export a singleton instance of the ETL Pipeline Manager
export const etlPipelineManager = new ETLPipelineManager();