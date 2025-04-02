/**
 * ETL Pipeline Manager
 * 
 * Manages the execution of ETL pipelines and coordinates data flow between
 * extraction, transformation, and loading steps.
 */

import { v4 as uuidv4 } from 'uuid';
import { 
  DataSource, 
  ETLJob, 
  ETLJobStatus, 
  ETLPipelineContext,
  TransformationRule,
  ETLExecutionLog,
  ETLExecutionError,
} from './ETLTypes';
import { metricsCollector } from './MetricsCollector';

export class ETLPipelineManager {
  private jobs: Map<string, ETLJob> = new Map();
  private activePipelines: Map<string, ETLPipelineContext> = new Map();
  private executionLogs: ETLExecutionLog[] = [];
  
  /**
   * Create a new ETL job
   */
  createJob(job: Omit<ETLJob, 'id' | 'status' | 'createdAt' | 'updatedAt'>): ETLJob {
    const id = uuidv4();
    const now = new Date();
    
    const newJob: ETLJob = {
      id,
      ...job,
      status: 'created',
      createdAt: now,
      updatedAt: now
    };
    
    this.jobs.set(id, newJob);
    return newJob;
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
   * Update a job
   */
  updateJob(jobId: string, updates: Partial<Omit<ETLJob, 'id' | 'createdAt'>>): ETLJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    
    const updatedJob: ETLJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    };
    
    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }
  
  /**
   * Delete a job
   */
  deleteJob(jobId: string): boolean {
    // Cannot delete active jobs
    const job = this.jobs.get(jobId);
    if (!job || job.status === 'running') return false;
    
    return this.jobs.delete(jobId);
  }
  
  /**
   * Execute an ETL job
   */
  async executeJob(jobId: string): Promise<ETLExecutionLog | undefined> {
    // Get the job
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    
    // Update job status
    this.updateJob(jobId, { status: 'running', lastRunAt: new Date() });
    
    // Start metrics collection
    metricsCollector.startJobMetrics(jobId, job.name);
    
    const startTime = new Date();
    const executionId = uuidv4();
    
    // Create execution log
    const executionLog: ETLExecutionLog = {
      id: executionId,
      jobId,
      startTime,
      status: 'success',
      recordsProcessed: 0,
      errors: []
    };
    
    try {
      // Start the extraction phase
      const extractTaskId = uuidv4();
      metricsCollector.startTaskMetrics(jobId, extractTaskId, 'Extract Data');
      
      // Extract data
      // In a real implementation, this would connect to the source
      // and extract actual data
      const extractedData = await this.mockExtract(job);
      
      // Update metrics
      metricsCollector.updateRecordCount(jobId, extractedData.length, extractTaskId);
      metricsCollector.completeTaskMetrics(jobId, extractTaskId);
      
      // Start transformation phase
      const transformTaskId = uuidv4();
      metricsCollector.startTaskMetrics(jobId, transformTaskId, 'Transform Data');
      
      // Apply transformations
      const transformedData = await this.mockTransform(extractedData, job.transformationRules);
      
      // Update metrics
      metricsCollector.updateRecordCount(jobId, transformedData.length, transformTaskId);
      metricsCollector.completeTaskMetrics(jobId, transformTaskId);
      
      // Start loading phase
      const loadTaskId = uuidv4();
      metricsCollector.startTaskMetrics(jobId, loadTaskId, 'Load Data');
      
      // Load data
      const recordsLoaded = await this.mockLoad(transformedData, job);
      
      // Update metrics
      metricsCollector.updateRecordCount(jobId, recordsLoaded, loadTaskId);
      metricsCollector.completeTaskMetrics(jobId, loadTaskId);
      
      // Update execution log
      executionLog.recordsProcessed = recordsLoaded;
      executionLog.endTime = new Date();
      
      // Update job status
      this.updateJob(jobId, { status: 'completed' });
      
      // Complete metrics collection
      metricsCollector.completeJobMetrics(jobId);
      
    } catch (error) {
      // Handle errors
      const errorMessage = error instanceof Error ? error.message : String(error);
      const executionError: ETLExecutionError = {
        code: 'ETL_EXECUTION_ERROR',
        message: errorMessage,
        timestamp: new Date()
      };
      
      executionLog.errors.push(executionError);
      executionLog.status = 'error';
      executionLog.message = `Job failed: ${errorMessage}`;
      executionLog.endTime = new Date();
      
      // Update job status
      this.updateJob(jobId, { status: 'failed' });
      
      // Update metrics
      metricsCollector.incrementErrorCount(jobId);
      metricsCollector.completeJobMetrics(jobId);
    }
    
    // Save the execution log
    this.executionLogs.push(executionLog);
    
    return executionLog;
  }
  
  /**
   * Get execution logs for a job
   */
  getJobExecutionLogs(jobId: string): ETLExecutionLog[] {
    return this.executionLogs.filter(log => log.jobId === jobId);
  }
  
  /**
   * Mock extraction process
   * In a real implementation, this would extract data from the source
   */
  private async mockExtract(job: ETLJob): Promise<any[]> {
    // Simulate extraction time
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Create some mock data
    const recordCount = Math.floor(Math.random() * 1000) + 500;
    return Array.from({ length: recordCount }, (_, i) => ({
      id: i + 1,
      name: `Record ${i + 1}`,
      value: Math.floor(Math.random() * 1000),
      timestamp: new Date()
    }));
  }
  
  /**
   * Mock transformation process
   * In a real implementation, this would apply the transformation rules
   */
  private async mockTransform(data: any[], rules: TransformationRule[]): Promise<any[]> {
    // Simulate transformation time
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Apply simple transformations
    // In a real implementation, this would interpret and apply the rules
    return data.map(item => {
      const transformed = { ...item };
      
      // Apply mock transformations based on rule types
      rules.forEach(rule => {
        if (rule.isActive) {
          if (rule.dataType === 'number' && typeof item.value === 'number') {
            transformed.value = item.value * 2; // Sample transformation
          } else if (rule.dataType === 'text' && typeof item.name === 'string') {
            transformed.name = item.name.toUpperCase(); // Sample transformation
          }
        }
      });
      
      return transformed;
    });
  }
  
  /**
   * Mock loading process
   * In a real implementation, this would load data to the target
   */
  private async mockLoad(data: any[], job: ETLJob): Promise<number> {
    // Simulate loading time
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Simulate some records being filtered out
    const loadedCount = data.length - Math.floor(Math.random() * 20);
    
    return loadedCount;
  }
}

// Export singleton instance
export const etlPipelineManager = new ETLPipelineManager();