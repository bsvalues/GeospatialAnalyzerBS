import { TransformationType, TransformationRule, ETLJob, JobStatus, LoadMode } from './ETLTypes';
import { transformationService } from './TransformationService';
import { dataConnector } from './DataConnector';
import { dataQualityService } from './DataQualityService';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * ETL pipeline execution status
 */
export interface ETLPipelineStatus {
  /** Job ID */
  jobId: number;
  
  /** Current status */
  status: JobStatus;
  
  /** Total records processed */
  recordsProcessed: number;
  
  /** Total records extracted */
  recordsExtracted: number;
  
  /** Total records transformed */
  recordsTransformed: number;
  
  /** Total records loaded */
  recordsLoaded: number;
  
  /** Total records failed */
  recordsFailed: number;
  
  /** Error message */
  error?: string;
  
  /** Start time */
  startTime: Date;
  
  /** End time */
  endTime?: Date;
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * ETL pipeline class
 */
class ETLPipeline {
  /**
   * Execute an ETL job
   */
  async executeJob(job: ETLJob, 
    progressCallback?: (status: ETLPipelineStatus) => void
  ): Promise<ETLPipelineStatus> {
    const status: ETLPipelineStatus = {
      jobId: job.id,
      status: JobStatus.RUNNING,
      recordsProcessed: 0,
      recordsExtracted: 0,
      recordsTransformed: 0,
      recordsLoaded: 0,
      recordsFailed: 0,
      startTime: new Date(),
      executionTime: 0
    };
    
    try {
      // Update job status
      this.updateStatus(status, progressCallback);
      
      // Check if job can be executed
      if (!job.enabled) {
        throw new Error('Job is disabled');
      }
      
      if (job.sources.length === 0) {
        throw new Error('No sources specified');
      }
      
      if (job.destinations.length === 0) {
        throw new Error('No destinations specified');
      }
      
      // Get sources and destinations
      const sources = job.sources.map(id => dataConnector.getDataSource(id));
      const destinations = job.destinations.map(id => dataConnector.getDataSource(id));
      
      // Check if all sources and destinations are available
      const missingSources = job.sources.filter(id => !dataConnector.getDataSource(id));
      if (missingSources.length > 0) {
        throw new Error(`Missing sources: ${missingSources.join(', ')}`);
      }
      
      const missingDestinations = job.destinations.filter(id => !dataConnector.getDataSource(id));
      if (missingDestinations.length > 0) {
        throw new Error(`Missing destinations: ${missingDestinations.join(', ')}`);
      }
      
      // Log start of extraction
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.TRANSFORMATION,
        title: `ETL Job Started: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${job.id}) has started extraction from ${sources.length} source(s)`
      });
      
      // Extract data from sources
      const extractedData: any[] = [];
      for (const sourceId of job.sources) {
        const extractResult = await dataConnector.extract(sourceId);
        
        if (!extractResult.success) {
          throw new Error(`Extraction failed: ${extractResult.error}`);
        }
        
        extractedData.push(...extractResult.data);
        status.recordsExtracted += extractResult.data.length;
        this.updateStatus(status, progressCallback);
      }
      
      if (extractedData.length === 0) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.TRANSFORMATION,
          title: `No Data Extracted: ${job.name}`,
          message: `No data was extracted for ETL job "${job.name}" (ID: ${job.id})`
        });
        
        // Complete job with warning
        status.status = JobStatus.SUCCEEDED;
        status.endTime = new Date();
        status.executionTime = status.endTime.getTime() - status.startTime.getTime();
        this.updateStatus(status, progressCallback);
        
        return status;
      }
      
      // Log start of transformation
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.TRANSFORMATION,
        title: `ETL Transformation Started: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${job.id}) has started transformation of ${extractedData.length} record(s)`
      });
      
      // Apply transformations
      let transformedData = [...extractedData];
      let transformedDataSource = [...extractedData];
      
      // Get rules if specified
      let rules: TransformationRule[] = [];
      if (job.rules && job.rules.length > 0) {
        // In a real implementation, this would fetch transformation rules from a repository
        // Here, we'll use a mock implementation
        rules = this.getMockTransformationRules(job.rules);
      }
      
      // Sort rules by order
      rules.sort((a, b) => a.order - b.order);
      
      // Apply each transformation rule
      for (const rule of rules) {
        if (!rule.enabled) {
          continue;
        }
        
        const transformResult = transformationService.applyTransformation(
          transformedDataSource,
          rule.type,
          rule.config
        );
        
        if (!transformResult.success) {
          alertService.createAlert({
            type: AlertType.WARNING,
            severity: AlertSeverity.MEDIUM,
            category: AlertCategory.TRANSFORMATION,
            title: `Transformation Warning: ${rule.name}`,
            message: `Transformation "${rule.name}" (ID: ${rule.id}) had errors: ${transformResult.errors.map(e => e.message).join(', ')}`
          });
        }
        
        transformedDataSource = transformResult.data;
        status.recordsProcessed += transformResult.recordsProcessed;
        this.updateStatus(status, progressCallback);
      }
      
      transformedData = transformedDataSource;
      status.recordsTransformed = transformedData.length;
      this.updateStatus(status, progressCallback);
      
      // Log start of load
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.TRANSFORMATION,
        title: `ETL Load Started: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${job.id}) has started loading ${transformedData.length} record(s) to ${destinations.length} destination(s)`
      });
      
      // Load data to destinations
      for (const destinationId of job.destinations) {
        const loadResult = await dataConnector.load(destinationId, transformedData, {
          mode: LoadMode.INSERT,
          target: 'default' // Use actual target in real implementation
        });
        
        if (!loadResult.success) {
          throw new Error(`Load failed: ${loadResult.error}`);
        }
        
        status.recordsLoaded += loadResult.recordsLoaded;
        status.recordsFailed += loadResult.recordsFailed;
        this.updateStatus(status, progressCallback);
      }
      
      // Analyze data quality if there's data to analyze
      if (transformedData.length > 0) {
        const qualityResult = await dataQualityService.analyzeDataQuality(transformedData);
        
        if (qualityResult.issues.length > 0) {
          alertService.createAlert({
            type: AlertType.INFO,
            severity: AlertSeverity.LOW,
            category: AlertCategory.TRANSFORMATION,
            title: `Data Quality Analysis: ${job.name}`,
            message: `Data quality analysis for job "${job.name}" found ${qualityResult.issues.length} issue(s). Overall score: ${qualityResult.overallScore.toFixed(1)}`
          });
        }
      }
      
      // Complete job
      status.status = JobStatus.SUCCEEDED;
      status.endTime = new Date();
      status.executionTime = status.endTime.getTime() - status.startTime.getTime();
      this.updateStatus(status, progressCallback);
      
      alertService.createAlert({
        type: AlertType.SUCCESS,
        severity: AlertSeverity.LOW,
        category: AlertCategory.TRANSFORMATION,
        title: `ETL Job Completed: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${job.id}) completed successfully. ${status.recordsExtracted} extracted, ${status.recordsTransformed} transformed, ${status.recordsLoaded} loaded, ${status.recordsFailed} failed`
      });
      
      return status;
    } catch (error) {
      // Handle error
      status.status = JobStatus.FAILED;
      status.error = error instanceof Error ? error.message : String(error);
      status.endTime = new Date();
      status.executionTime = status.endTime.getTime() - status.startTime.getTime();
      this.updateStatus(status, progressCallback);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.TRANSFORMATION,
        title: `ETL Job Failed: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${job.id}) failed: ${status.error}`
      });
      
      return status;
    }
  }
  
  /**
   * Update pipeline status and notify callback
   */
  private updateStatus(status: ETLPipelineStatus, callback?: (status: ETLPipelineStatus) => void): void {
    if (callback) {
      callback({ ...status });
    }
  }
  
  /**
   * Get mock transformation rules for the specified rule IDs
   */
  private getMockTransformationRules(ruleIds: number[]): TransformationRule[] {
    // In a real implementation, this would fetch from a repository
    // Here we create some mock rules
    
    const mockRules: Record<number, TransformationRule> = {
      1: {
        id: 1,
        name: 'Filter out properties below $100,000',
        description: 'Removes low-value properties from the dataset',
        type: TransformationType.FILTER,
        config: {
          logic: 'AND',
          conditions: [
            {
              field: 'price',
              operator: 'GREATER_THAN',
              value: 100000
            }
          ]
        },
        enabled: true,
        order: 1,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      2: {
        id: 2,
        name: 'Rename property fields',
        description: 'Standardizes property field names',
        type: TransformationType.MAP,
        config: {
          mappings: [
            { source: 'addr', target: 'address' },
            { source: 'latitude', target: 'lat' },
            { source: 'longitude', target: 'lng' },
            { source: 'sqft', target: 'squareFootage' }
          ],
          includeOriginal: false
        },
        enabled: true,
        order: 2,
        createdAt: new Date(),
        updatedAt: new Date()
      },
      3: {
        id: 3,
        name: 'Filter residential properties',
        description: 'Keeps only residential properties',
        type: TransformationType.FILTER,
        config: {
          logic: 'OR',
          conditions: [
            {
              field: 'type',
              operator: 'EQUALS',
              value: 'residential'
            },
            {
              field: 'type',
              operator: 'EQUALS',
              value: 'single-family'
            }
          ]
        },
        enabled: true,
        order: 3,
        createdAt: new Date(),
        updatedAt: new Date()
      }
    };
    
    return ruleIds.map(id => mockRules[id]).filter(rule => rule !== undefined);
  }
}

export const etlPipeline = new ETLPipeline();