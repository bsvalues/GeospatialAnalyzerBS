/**
 * ETL Pipeline Manager
 * 
 * This service manages ETL jobs, transformations, and executions.
 */

import { v4 as uuidv4 } from 'uuid';
import { metricsCollector } from './MetricsCollector';
import { dataConnector } from './DataConnector';
import { 
  ETLJob, 
  ETLJobStatus,
  TransformationRule,
  ETLExecutionLog,
  ETLExecutionError
} from './ETLTypes';

/**
 * ETL Pipeline Manager Service
 */
class ETLPipelineManager {
  private jobs: Map<string, ETLJob>;
  private activePipelines: Map<string, any>; // In a real app, this would hold running pipeline instances
  private executionLogs: ETLExecutionLog[];

  constructor() {
    this.jobs = new Map();
    this.activePipelines = new Map();
    this.executionLogs = [];
    
    // Initialize with some sample jobs
    this.initializeSampleJobs();
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
   * Create a new ETL job
   */
  createJob(params: {
    name: string;
    description?: string;
    sourceId: string;
    targetId: string;
    transformationRules: TransformationRule[];
    schedule?: any;
  }): ETLJob {
    const jobId = uuidv4();
    
    const job: ETLJob = {
      id: jobId,
      name: params.name,
      description: params.description || '',
      status: 'created' as ETLJobStatus,
      sourceId: params.sourceId,
      targetId: params.targetId,
      transformationIds: params.transformationRules.map(rule => rule.id),
      transformationRules: params.transformationRules, // Keep for backward compatibility
      schedule: params.schedule,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.jobs.set(jobId, job);
    return job;
  }

  /**
   * Update an existing ETL job
   */
  updateJob(jobId: string, updates: Partial<ETLJob>): ETLJob | undefined {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    
    // Update fields
    const updatedJob: ETLJob = {
      ...job,
      ...updates,
      updatedAt: new Date()
    };
    
    this.jobs.set(jobId, updatedJob);
    return updatedJob;
  }

  /**
   * Delete an ETL job
   */
  deleteJob(jobId: string): boolean {
    // Ensure the job isn't currently running
    if (this.activePipelines.has(jobId)) {
      return false;
    }
    
    return this.jobs.delete(jobId);
  }

  /**
   * Execute an ETL job
   */
  async executeJob(jobId: string): Promise<ETLExecutionLog | undefined> {
    const job = this.jobs.get(jobId);
    if (!job) return undefined;
    
    // Update job status
    this.updateJob(jobId, { status: 'running' });
    
    // Start metrics collection
    metricsCollector.startJobMetrics(jobId, job.name);
    
    // Create execution log
    const executionLog: ETLExecutionLog = {
      id: uuidv4(),
      jobId,
      startTime: new Date(),
      status: 'success',
      recordsProcessed: 0,
      errors: []
    };
    
    try {
      // 1. Extract phase
      const extractTaskId = 'extract-' + uuidv4();
      metricsCollector.startTaskMetrics(jobId, extractTaskId, 'Extract Data');
      
      const source = dataConnector.getDataSource(job.sourceId);
      if (!source) {
        throw new Error(`Source data source (${job.sourceId}) not found`);
      }
      
      // Simulate data extraction (would connect to actual data source in real app)
      await this.simulateDelay(1500);
      const extractedData = this.simulateDataExtraction(source.type, 1000);
      
      metricsCollector.updateRecordCount(jobId, extractedData.length, extractTaskId);
      metricsCollector.completeTaskMetrics(jobId, extractTaskId);
      
      // 2. Transform phase
      const transformTaskId = 'transform-' + uuidv4();
      metricsCollector.startTaskMetrics(jobId, transformTaskId, 'Transform Data');
      
      // Apply transformations (would apply actual transformations in real app)
      await this.simulateDelay(800);
      const transformRules = job.transformationRules || [];
      const transformedData = this.simulateDataTransformation(extractedData, transformRules);
      
      metricsCollector.updateRecordCount(jobId, transformedData.length, transformTaskId);
      metricsCollector.completeTaskMetrics(jobId, transformTaskId);
      
      // 3. Load phase
      const loadTaskId = 'load-' + uuidv4();
      metricsCollector.startTaskMetrics(jobId, loadTaskId, 'Load Data');
      
      const target = dataConnector.getDataSource(job.targetId);
      if (!target) {
        throw new Error(`Target data source (${job.targetId}) not found`);
      }
      
      // Simulate data loading (would load to actual target in real app)
      await this.simulateDelay(1200);
      const loadedRecords = this.simulateDataLoading(transformedData, target.type);
      
      metricsCollector.updateRecordCount(jobId, loadedRecords, loadTaskId);
      metricsCollector.completeTaskMetrics(jobId, loadTaskId);
      
      // 4. Complete execution
      executionLog.endTime = new Date();
      executionLog.recordsProcessed = loadedRecords;
      this.executionLogs.push(executionLog);
      
      // Update job status
      this.updateJob(jobId, { 
        status: 'completed',
        lastRunAt: new Date()
      });
      
    } catch (error) {
      // Handle error
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      executionLog.status = 'error';
      executionLog.endTime = new Date();
      executionLog.message = errorMessage;
      executionLog.errors.push({
        code: 'ETL-ERR-001',
        message: errorMessage,
        timestamp: new Date()
      });
      
      this.executionLogs.push(executionLog);
      
      // Record error in metrics
      metricsCollector.recordError(jobId);
      
      // Update job status
      this.updateJob(jobId, { status: 'failed' });
    }
    
    // Complete metrics collection
    metricsCollector.completeJobMetrics(jobId);
    
    return executionLog;
  }

  /**
   * Get execution logs for a job
   */
  getJobExecutionLogs(jobId: string): ETLExecutionLog[] {
    return this.executionLogs.filter(log => log.jobId === jobId);
  }

  /**
   * Get all execution logs
   */
  getAllExecutionLogs(): ETLExecutionLog[] {
    return [...this.executionLogs];
  }

  /**
   * Pause a running job
   */
  pauseJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'running') return false;
    
    // Update job status
    this.updateJob(jobId, { status: 'paused' });
    return true;
  }

  /**
   * Resume a paused job
   */
  resumeJob(jobId: string): boolean {
    const job = this.jobs.get(jobId);
    if (!job || job.status !== 'paused') return false;
    
    // Update job status
    this.updateJob(jobId, { status: 'running' });
    return true;
  }

  /**
   * Initialize with sample jobs
   */
  private initializeSampleJobs() {
    // Create sample transformation rules
    const transformationRules: TransformationRule[] = [
      {
        id: 'rule-1',
        name: 'Uppercase Names',
        description: 'Convert property names to uppercase',
        dataType: 'text',
        transformationCode: 'UPPER(name)',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rule-2',
        name: 'Calculate Area',
        description: 'Calculate property area from length and width',
        dataType: 'number',
        transformationCode: 'LENGTH * WIDTH',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      {
        id: 'rule-3',
        name: 'Format Date',
        description: 'Format date to ISO format',
        dataType: 'date',
        transformationCode: 'FORMAT_DATE(date, "YYYY-MM-DD")',
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    ];
    
    // Create sample job 1
    const job1: ETLJob = {
      id: 'job-1',
      name: 'Property Data Import',
      description: 'Import property data from county database to local storage',
      status: 'completed',
      sourceId: 'source-1',
      targetId: 'target-1',
      transformationIds: [transformationRules[0].id, transformationRules[1].id],
      transformationRules: [transformationRules[0], transformationRules[1]], // For backward compatibility
      createdAt: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // 7 days ago
      updatedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      lastRunAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000)  // 2 days ago
    };
    
    // Create sample job 2
    const job2: ETLJob = {
      id: 'job-2',
      name: 'Demographic Data Sync',
      description: 'Sync demographic data from census API',
      status: 'scheduled',
      sourceId: 'source-2',
      targetId: 'target-1',
      transformationIds: [transformationRules[2].id],
      transformationRules: [transformationRules[2]], // For backward compatibility
      schedule: {
        frequency: 'daily',
        startDate: new Date(Date.now() + 24 * 60 * 60 * 1000) // Tomorrow
      },
      createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000), // 3 days ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)  // 1 day ago
    };
    
    // Create sample job 3
    const job3: ETLJob = {
      id: 'job-3',
      name: 'Market Analysis Data',
      description: 'Process market analysis data from multiple sources',
      status: 'created',
      sourceId: 'source-3',
      targetId: 'target-2',
      transformationIds: transformationRules.map(rule => rule.id),
      transformationRules: transformationRules, // For backward compatibility
      createdAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000), // 1 day ago
      updatedAt: new Date(Date.now() - 1 * 24 * 60 * 60 * 1000)  // 1 day ago
    };
    
    // Add jobs to map
    this.jobs.set(job1.id, job1);
    this.jobs.set(job2.id, job2);
    this.jobs.set(job3.id, job3);
    
    // Create sample execution logs
    const log1: ETLExecutionLog = {
      id: 'log-1',
      jobId: job1.id,
      startTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000), // 2 days ago
      endTime: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000 + 30 * 60 * 1000), // +30 minutes
      status: 'success',
      recordsProcessed: 5000,
      errors: []
    };
    
    const log2: ETLExecutionLog = {
      id: 'log-2',
      jobId: job1.id,
      startTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000), // 9 days ago
      endTime: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 45 * 60 * 1000), // +45 minutes
      status: 'warning',
      recordsProcessed: 4800,
      message: 'Some records could not be processed',
      errors: [
        {
          code: 'ETL-WARN-001',
          message: '200 records had invalid format',
          timestamp: new Date(Date.now() - 9 * 24 * 60 * 60 * 1000 + 40 * 60 * 1000)
        }
      ]
    };
    
    // Add logs to array
    this.executionLogs.push(log1);
    this.executionLogs.push(log2);
  }

  /**
   * Simulate a delay (for async operations)
   */
  private simulateDelay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Simulate data extraction
   */
  private simulateDataExtraction(sourceType: string, count: number): any[] {
    const data = [];
    
    for (let i = 0; i < count; i++) {
      if (sourceType === 'database') {
        data.push({
          id: i,
          name: `Property ${i}`,
          value: Math.floor(Math.random() * 1000000) + 100000,
          address: `${i} Main St`,
          city: 'Benton',
          state: 'WA',
          zip: '99320',
          latitude: 46.2 + (Math.random() * 0.5),
          longitude: -119.1 + (Math.random() * 0.5),
          createdAt: new Date()
        });
      } else if (sourceType === 'api') {
        data.push({
          id: i,
          population: Math.floor(Math.random() * 10000) + 1000,
          medianIncome: Math.floor(Math.random() * 50000) + 30000,
          housingUnits: Math.floor(Math.random() * 5000) + 500,
          region: `Region-${Math.floor(i / 100)}`,
          timestamp: new Date()
        });
      } else {
        data.push({
          id: i,
          value: Math.random() * 1000,
          timestamp: new Date()
        });
      }
    }
    
    return data;
  }

  /**
   * Simulate data transformation
   */
  private simulateDataTransformation(data: any[], rules: TransformationRule[]): any[] {
    // In a real app, this would apply the actual transformation rules
    // Here we just simulate some basic transformations
    
    return data.map(item => {
      const transformed = { ...item };
      
      // Apply some mock transformations based on rule names
      rules.forEach(rule => {
        if (rule.isActive) {
          if (rule.name.includes('Uppercase') && transformed.name) {
            transformed.name = transformed.name.toUpperCase();
          }
          
          if (rule.name.includes('Calculate Area') && transformed.length && transformed.width) {
            transformed.area = transformed.length * transformed.width;
          }
          
          if (rule.name.includes('Format Date') && transformed.timestamp) {
            transformed.formattedDate = transformed.timestamp.toISOString().split('T')[0];
          }
        }
      });
      
      return transformed;
    });
  }

  /**
   * Simulate data loading
   */
  private simulateDataLoading(data: any[], targetType: string): number {
    // Simulate some data loss or failure during loading
    const successRate = 0.98; // 98% success rate
    let loadedCount = 0;
    
    data.forEach(item => {
      if (Math.random() < successRate) {
        loadedCount++;
      }
    });
    
    return loadedCount;
  }
}

// Singleton instance
export const etlPipelineManager = new ETLPipelineManager();