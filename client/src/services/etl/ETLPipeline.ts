/**
 * ETLPipeline.ts
 * 
 * Main ETL pipeline that integrates all ETL services
 */

import { dataConnector } from './DataConnector';
import { transformationService } from './TransformationService';
import { dataValidationService } from './DataValidationService';
import { metricsCollector } from './MetricsCollector';
import { jobExecutionService } from './JobExecutionService';
import {
  ETLJob,
  JobStatus,
  DataSource,
  TransformationRule,
  ETLJobResult,
  DataValidationResult,
  DataQualitySeverity
} from './ETLTypes';

class ETLPipeline {
  /**
   * Execute a complete ETL job
   */
  async executeJob(job: ETLJob, transformationRules: TransformationRule[]): Promise<ETLJobResult> {
    console.log(`Starting ETL job ${job.id}: ${job.name}`);
    
    // Start metrics collection
    metricsCollector.startJobMetrics(job.id);
    
    try {
      // Update job status to running
      job.status = JobStatus.RUNNING;
      
      // Extract data from source
      const sourceData = await this.extractData(job.source);
      
      if (!sourceData || sourceData.length === 0) {
        return this.handleJobFailure(job, 'No data extracted from source');
      }
      
      // Transform data
      const transformedData = await this.transformData(sourceData, transformationRules);
      
      if (!transformedData || transformedData.length === 0) {
        return this.handleJobFailure(job, 'No data after transformation');
      }
      
      // Validate data
      const validationResult = await this.validateData(transformedData, job.validationRules);
      
      if (validationResult.hasFailedValidations) {
        // If critical validation issues exist, fail the job
        const criticalIssues = validationResult.issues.filter(issue => 
          issue.severity === DataQualitySeverity.HIGH
        );
        
        if (criticalIssues.length > 0 && !job.continueOnValidationError) {
          return this.handleJobFailure(job, 'Critical validation issues detected');
        }
      }
      
      // Load data to destination
      const loadResult = await this.loadData(transformedData, job.destination);
      
      if (!loadResult.success) {
        return this.handleJobFailure(job, `Data load failed: ${loadResult.error}`);
      }
      
      // Complete the job
      const metrics = metricsCollector.endJobMetrics(job.id);
      
      const result: ETLJobResult = {
        jobId: job.id,
        status: JobStatus.COMPLETED,
        recordsProcessed: transformedData.length,
        metrics: metrics,
        validationResult: validationResult,
        error: null,
        timestamp: new Date()
      };
      
      console.log(`ETL job ${job.id} completed successfully`);
      return result;
    } catch (error) {
      return this.handleJobFailure(job, error instanceof Error ? error.message : String(error));
    }
  }
  
  /**
   * Handle an ETL job failure
   */
  private handleJobFailure(job: ETLJob, errorMessage: string): ETLJobResult {
    console.error(`ETL job ${job.id} failed: ${errorMessage}`);
    
    // Update job status
    job.status = JobStatus.FAILED;
    
    // End metrics collection
    const metrics = metricsCollector.endJobMetrics(job.id);
    
    return {
      jobId: job.id,
      status: JobStatus.FAILED,
      recordsProcessed: 0,
      metrics,
      validationResult: {
        isValid: false,
        hasFailedValidations: true,
        issues: [{
          field: 'job',
          issue: errorMessage,
          severity: DataQualitySeverity.HIGH,
          recommendation: 'Check job configuration and data sources'
        }],
        completeness: 0,
        accuracy: 0,
        consistency: 0
      },
      error: errorMessage,
      timestamp: new Date()
    };
  }
  
  /**
   * Extract data from a source
   */
  private async extractData(source: DataSource): Promise<any[]> {
    console.log(`Extracting data from ${source.type} source: ${source.name}`);
    
    try {
      // Get connection
      const connection = await dataConnector.getConnection(source);
      
      if (!connection) {
        throw new Error(`Failed to get connection for source: ${source.name}`);
      }
      
      // Extract data using the connection
      const data = await dataConnector.extractData(connection, source);
      
      if (!data || !Array.isArray(data)) {
        throw new Error('Extracted data is not an array');
      }
      
      console.log(`Extracted ${data.length} records from source`);
      
      return data;
    } catch (error) {
      console.error('Error during data extraction:', error);
      throw error;
    }
  }
  
  /**
   * Transform data using provided rules
   */
  private async transformData(data: any[], transformationRules: TransformationRule[]): Promise<any[]> {
    console.log(`Transforming data with ${transformationRules.length} rules`);
    
    try {
      // Apply all transformation rules in sequence
      let transformedData = [...data];
      
      // Sort rules by priority (if available) to ensure proper execution order
      const sortedRules = [...transformationRules].sort((a, b) => 
        (a.priority || 0) - (b.priority || 0)
      );
      
      for (const rule of sortedRules) {
        transformedData = await transformationService.applyTransformation(transformedData, rule);
      }
      
      console.log(`Transformed data now has ${transformedData.length} records`);
      
      return transformedData;
    } catch (error) {
      console.error('Error during data transformation:', error);
      throw error;
    }
  }
  
  /**
   * Validate data against validation rules
   */
  private async validateData(data: any[], validationRules?: any[]): Promise<DataValidationResult> {
    console.log(`Validating ${data.length} records`);
    
    try {
      const validationResult = await dataValidationService.validateData(data, validationRules);
      
      console.log(`Validation completed with ${validationResult.issues.length} issues`);
      
      if (validationResult.issues.length > 0) {
        const severityCounts = validationResult.issues.reduce((acc, issue) => {
          acc[issue.severity] = (acc[issue.severity] || 0) + 1;
          return acc;
        }, {} as Record<string, number>);
        
        console.log('Validation issues by severity:', severityCounts);
      }
      
      return validationResult;
    } catch (error) {
      console.error('Error during data validation:', error);
      
      // Return a default validation result with the error
      return {
        isValid: false,
        hasFailedValidations: true,
        issues: [{
          field: 'validation',
          issue: error instanceof Error ? error.message : String(error),
          severity: DataQualitySeverity.HIGH,
          recommendation: 'Check validation rules configuration'
        }],
        completeness: 0,
        accuracy: 0,
        consistency: 0
      };
    }
  }
  
  /**
   * Load data to destination
   */
  private async loadData(data: any[], destination: DataSource): Promise<{ success: boolean; error?: string }> {
    console.log(`Loading ${data.length} records to ${destination.type} destination: ${destination.name}`);
    
    try {
      // Get connection to destination
      const connection = await dataConnector.getConnection(destination);
      
      if (!connection) {
        throw new Error(`Failed to get connection for destination: ${destination.name}`);
      }
      
      // Load data to destination
      await dataConnector.loadData(connection, data, destination);
      
      console.log(`Successfully loaded ${data.length} records to destination`);
      
      return { success: true };
    } catch (error) {
      console.error('Error during data loading:', error);
      return { 
        success: false, 
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Create a preview of transformation results
   */
  async previewTransformation(data: any[], rule: TransformationRule): Promise<any[]> {
    try {
      return await transformationService.applyTransformation(data, rule);
    } catch (error) {
      console.error('Error previewing transformation:', error);
      throw error;
    }
  }
  
  /**
   * Test a job configuration without executing the full pipeline
   */
  async testJobConfiguration(job: ETLJob): Promise<{ isValid: boolean; issues: string[] }> {
    const issues: string[] = [];
    
    try {
      // Validate source configuration
      const sourceValid = await dataConnector.testConnection(job.source);
      
      if (!sourceValid) {
        issues.push(`Source connection failed: ${job.source.name}`);
      }
      
      // Validate destination configuration
      const destinationValid = await dataConnector.testConnection(job.destination);
      
      if (!destinationValid) {
        issues.push(`Destination connection failed: ${job.destination.name}`);
      }
      
      // Check for job configuration issues
      if (!job.name) {
        issues.push('Job name is required');
      }
      
      if (job.schedule && job.schedule.frequency === 'CUSTOM' && !job.schedule.cronExpression) {
        issues.push('Custom frequency requires a cron expression');
      }
      
      return {
        isValid: issues.length === 0,
        issues
      };
    } catch (error) {
      issues.push(error instanceof Error ? error.message : String(error));
      
      return {
        isValid: false,
        issues
      };
    }
  }
  
  /**
   * Abort a running job
   */
  async abortJob(jobId: number): Promise<boolean> {
    return jobExecutionService.abortJob(jobId);
  }
}

// Export a singleton instance
export const etlPipeline = new ETLPipeline();