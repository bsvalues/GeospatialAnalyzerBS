/**
 * ETLPipelineManager.ts
 * 
 * Service for managing the entire ETL pipeline
 */

import { 
  ETLJob, 
  DataSource, 
  Transformation,
  JobStatus,
  ETLJobRun
} from './ETLTypes';
import { Alert, TransformationRule } from './index';

// Dummy implementation of ETL pipeline manager
class ETLPipelineManager {
  private jobs: ETLJob[] = [];
  private dataSources: DataSource[] = [];
  private transformationRules: TransformationRule[] = [];
  private jobRuns: ETLJobRun[] = [];
  
  /**
   * Get all jobs
   */
  getAllJobs(): ETLJob[] {
    return this.jobs;
  }
  
  /**
   * Get all data sources
   */
  getAllDataSources(): DataSource[] {
    return this.dataSources;
  }
  
  /**
   * Get all transformation rules
   */
  getAllTransformationRules(): TransformationRule[] {
    return this.transformationRules;
  }
  
  /**
   * Get all job runs
   */
  getAllJobRuns(): ETLJobRun[] {
    return this.jobRuns;
  }
  
  /**
   * Get system status
   */
  getSystemStatus(): any {
    return {
      jobCount: this.jobs.length,
      enabledJobCount: this.jobs.filter(job => job.enabled).length,
      dataSourceCount: this.dataSources.length,
      enabledDataSourceCount: this.dataSources.filter(source => source.status === 'active').length,
      transformationRuleCount: this.transformationRules.length,
      enabledTransformationRuleCount: this.transformationRules.filter(rule => rule.enabled).length,
      runningJobCount: this.jobs.filter(job => job.status === JobStatus.RUNNING).length,
      recentJobRuns: this.jobRuns.length,
      schedulerStatus: {
        [JobStatus.IDLE]: 0,
        [JobStatus.RUNNING]: 0,
        [JobStatus.SUCCESS]: 0,
        [JobStatus.ERROR]: 0,
        [JobStatus.SCHEDULED]: 0,
        [JobStatus.CANCELED]: 0,
        [JobStatus.PAUSED]: 0,
        [JobStatus.ABORTED]: 0
      },
      lastRefreshed: new Date()
    };
  }
  
  /**
   * Run a job
   */
  async runJob(jobId: number): Promise<void> {
    console.log(`Running job ${jobId}`);
    // In a real implementation, this would start the job execution
  }
  
  /**
   * Enable a job
   */
  enableJob(jobId: number): void {
    const job = this.jobs.find(j => Number(j.id) === jobId);
    if (job) {
      job.enabled = true;
    }
  }
  
  /**
   * Disable a job
   */
  disableJob(jobId: number): void {
    const job = this.jobs.find(j => Number(j.id) === jobId);
    if (job) {
      job.enabled = false;
    }
  }
  
  /**
   * Enable a data source
   */
  enableDataSource(dataSourceId: number): void {
    const dataSource = this.dataSources.find(ds => Number(ds.id) === dataSourceId);
    if (dataSource) {
      dataSource.status = 'active';
    }
  }
  
  /**
   * Disable a data source
   */
  disableDataSource(dataSourceId: number): void {
    const dataSource = this.dataSources.find(ds => Number(ds.id) === dataSourceId);
    if (dataSource) {
      dataSource.status = 'inactive';
    }
  }
  
  /**
   * Enable a transformation rule
   */
  enableTransformationRule(transformationRuleId: number): void {
    const transformationRule = this.transformationRules.find(tr => Number(tr.id) === transformationRuleId);
    if (transformationRule) {
      transformationRule.enabled = true;
    }
  }
  
  /**
   * Disable a transformation rule
   */
  disableTransformationRule(transformationRuleId: number): void {
    const transformationRule = this.transformationRules.find(tr => Number(tr.id) === transformationRuleId);
    if (transformationRule) {
      transformationRule.enabled = false;
    }
  }
  
  /**
   * Delete a job
   */
  deleteJob(jobId: number): void {
    this.jobs = this.jobs.filter(j => Number(j.id) !== jobId);
  }
  
  /**
   * Delete a data source
   */
  deleteDataSource(dataSourceId: number): void {
    this.dataSources = this.dataSources.filter(ds => Number(ds.id) !== dataSourceId);
  }
  
  /**
   * Delete a transformation rule
   */
  deleteTransformationRule(transformationRuleId: number): void {
    this.transformationRules = this.transformationRules.filter(tr => Number(tr.id) !== transformationRuleId);
  }
  
  /**
   * Create a job
   */
  createJob(job: any): void {
    const newJob: ETLJob = {
      id: String(Date.now()),
      name: job.name,
      description: job.description,
      sourceId: Array.isArray(job.sources) && job.sources.length > 0 ? job.sources[0] : "",
      transformations: job.transformations || [],
      enabled: job.enabled,
      status: JobStatus.IDLE,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    
    this.jobs.push(newJob);
  }
  
  /**
   * Create a data source
   */
  createDataSource(dataSource: any): void {
    const newDataSource: DataSource = {
      id: String(Date.now()),
      name: dataSource.name,
      type: dataSource.type,
      description: dataSource.description,
      config: dataSource.config || {},
      status: dataSource.enabled ? 'active' : 'inactive'
    };
    
    this.dataSources.push(newDataSource);
  }
  
  /**
   * Create a transformation rule
   */
  createTransformationRule(rule: any): void {
    const newRule: TransformationRule = {
      id: String(Date.now()),
      name: rule.name,
      type: rule.type,
      description: rule.description,
      config: rule.config || {},
      enabled: rule.enabled
    };
    
    this.transformationRules.push(newRule);
  }
}

// Export a singleton instance
export const etlPipelineManager = new ETLPipelineManager();