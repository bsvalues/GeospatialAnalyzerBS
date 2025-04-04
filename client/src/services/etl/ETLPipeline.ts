import { 
  ETLJob, 
  JobStatus, 
  RecordCounts, 
  DataSource, 
  TransformationRule 
} from './ETLTypes';
import { dataConnector, ExtractResult, LoadResult } from './DataConnector';
import { transformationService, TransformationResult } from './TransformationService';
import { dataQualityService } from './DataQualityService';
import { alertService, AlertType, AlertSeverity, AlertCategory } from './AlertService';

/**
 * Interface representing a running ETL job
 */
export interface JobRun {
  /** Run ID */
  id: string;
  
  /** Job ID */
  jobId: number;
  
  /** Run status */
  status: JobStatus;
  
  /** Start timestamp */
  startTime: Date;
  
  /** End timestamp */
  endTime?: Date;
  
  /** Execution time (ms) */
  executionTime: number;
  
  /** Record counts */
  recordCounts: RecordCounts;
  
  /** Error message */
  error?: string;
  
  /** Whether this was a manual run */
  isManual: boolean;
}

/**
 * ETL Pipeline
 * 
 * This class is responsible for coordinating the ETL process.
 */
class ETLPipeline {
  private nextRunId = 1;
  
  /**
   * Execute an ETL job
   */
  async executeJob(
    job: ETLJob,
    dataSources: Map<number, DataSource>,
    transformationRules: Map<number, TransformationRule>,
    isManual: boolean = false
  ): Promise<JobRun> {
    // Create a job run
    const runId = `run-${job.id}-${this.nextRunId++}`;
    const startTime = new Date();
    const recordCounts: RecordCounts = {
      extracted: 0,
      transformed: 0,
      loaded: 0,
      failed: 0
    };
    
    // Initialize job run
    const jobRun: JobRun = {
      id: runId,
      jobId: job.id,
      status: JobStatus.RUNNING,
      startTime,
      executionTime: 0,
      recordCounts,
      isManual
    };
    
    try {
      // Check if job is enabled
      if (!job.enabled) {
        throw new Error(`Job is disabled: ${job.name}`);
      }
      
      // Check if job has sources
      if (job.sources.length === 0) {
        throw new Error(`Job has no sources: ${job.name}`);
      }
      
      // Check if job has destinations
      if (job.destinations.length === 0) {
        throw new Error(`Job has no destinations: ${job.name}`);
      }
      
      // Log job start
      alertService.createAlert({
        type: AlertType.INFO,
        severity: AlertSeverity.LOW,
        category: AlertCategory.JOB,
        title: `Job Started: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${job.id}) has started execution`,
        context: { jobId: job.id, runId }
      });
      
      // Extract data from sources
      const extractedData = await this.extractData(job.sources, dataSources, recordCounts);
      
      // Transform data
      const transformedData = await this.transformData(
        extractedData,
        job.transformations,
        transformationRules,
        recordCounts
      );
      
      // Load data into destinations
      await this.loadData(job.destinations, transformedData, dataSources, recordCounts);
      
      // Update job run status
      jobRun.status = JobStatus.SUCCEEDED;
      jobRun.endTime = new Date();
      jobRun.executionTime = jobRun.endTime.getTime() - startTime.getTime();
      jobRun.recordCounts = recordCounts;
      
      // Log job completion
      alertService.createAlert({
        type: AlertType.SUCCESS,
        severity: AlertSeverity.LOW,
        category: AlertCategory.JOB,
        title: `Job Completed: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${job.id}) completed successfully. Processed ${recordCounts.loaded} records in ${jobRun.executionTime}ms.`,
        context: { jobId: job.id, runId, recordCounts }
      });
      
      return jobRun;
    } catch (error) {
      // Handle job error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      // Update job run status
      jobRun.status = JobStatus.FAILED;
      jobRun.endTime = new Date();
      jobRun.executionTime = jobRun.endTime.getTime() - startTime.getTime();
      jobRun.error = errorMessage;
      
      // Log job failure
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.JOB,
        title: `Job Failed: ${job.name}`,
        message: `ETL job "${job.name}" (ID: ${job.id}) failed: ${errorMessage}`,
        context: { jobId: job.id, runId, error: errorMessage }
      });
      
      return jobRun;
    }
  }
  
  /**
   * Extract data from sources
   */
  private async extractData(
    sourceIds: number[],
    dataSources: Map<number, DataSource>,
    recordCounts: RecordCounts
  ): Promise<any[]> {
    let allData: any[] = [];
    
    for (const sourceId of sourceIds) {
      const dataSource = dataSources.get(sourceId);
      
      if (!dataSource) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_SOURCE,
          title: `Data Source Not Found`,
          message: `Data source with ID ${sourceId} not found`
        });
        continue;
      }
      
      if (!dataSource.enabled) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_SOURCE,
          title: `Data Source Disabled`,
          message: `Data source "${dataSource.name}" (ID: ${sourceId}) is disabled`
        });
        continue;
      }
      
      try {
        const extractResult: ExtractResult = await dataConnector.extract(sourceId);
        
        if (!extractResult.success) {
          alertService.createAlert({
            type: AlertType.ERROR,
            severity: AlertSeverity.HIGH,
            category: AlertCategory.DATA_SOURCE,
            title: `Data Extraction Failed: ${dataSource.name}`,
            message: `Failed to extract data from "${dataSource.name}" (ID: ${sourceId}): ${extractResult.error}`
          });
          continue;
        }
        
        // Add data to combined result
        allData = allData.concat(extractResult.data);
        recordCounts.extracted += extractResult.count;
        
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.DATA_SOURCE,
          title: `Data Extracted: ${dataSource.name}`,
          message: `Successfully extracted ${extractResult.count} records from "${dataSource.name}" (ID: ${sourceId}) in ${extractResult.executionTime}ms`
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.DATA_SOURCE,
          title: `Data Extraction Error: ${dataSource.name}`,
          message: `Error extracting data from "${dataSource.name}" (ID: ${sourceId}): ${errorMessage}`
        });
      }
    }
    
    return allData;
  }
  
  /**
   * Transform data using transformation rules
   */
  private async transformData(
    data: any[],
    transformationIds: number[],
    transformationRules: Map<number, TransformationRule>,
    recordCounts: RecordCounts
  ): Promise<any[]> {
    if (data.length === 0) {
      return [];
    }
    
    // Sort transformation rules by order
    const sortedTransformationIds = [...transformationIds].sort((a, b) => {
      const ruleA = transformationRules.get(a);
      const ruleB = transformationRules.get(b);
      return (ruleA?.order || 0) - (ruleB?.order || 0);
    });
    
    let transformedData = [...data];
    
    for (const transformationId of sortedTransformationIds) {
      const rule = transformationRules.get(transformationId);
      
      if (!rule) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.TRANSFORMATION,
          title: `Transformation Rule Not Found`,
          message: `Transformation rule with ID ${transformationId} not found`
        });
        continue;
      }
      
      if (!rule.enabled) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.LOW,
          category: AlertCategory.TRANSFORMATION,
          title: `Transformation Rule Disabled`,
          message: `Transformation rule "${rule.name}" (ID: ${transformationId}) is disabled`
        });
        continue;
      }
      
      try {
        const transformResult: TransformationResult = transformationService.applyTransformation(
          transformedData,
          rule.type,
          rule.config
        );
        
        if (!transformResult.success) {
          alertService.createAlert({
            type: AlertType.ERROR,
            severity: AlertSeverity.HIGH,
            category: AlertCategory.TRANSFORMATION,
            title: `Transformation Failed: ${rule.name}`,
            message: `Failed to apply transformation "${rule.name}" (ID: ${transformationId}): ${transformResult.errors[0]?.message}`
          });
          continue;
        }
        
        transformedData = transformResult.data;
        recordCounts.transformed = transformedData.length;
        
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.TRANSFORMATION,
          title: `Transformation Applied: ${rule.name}`,
          message: `Successfully applied transformation "${rule.name}" (ID: ${transformationId}). Result: ${transformResult.resultingRecords} records in ${transformResult.executionTime}ms`
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.TRANSFORMATION,
          title: `Transformation Error: ${rule.name}`,
          message: `Error applying transformation "${rule.name}" (ID: ${transformationId}): ${errorMessage}`
        });
      }
    }
    
    // Check data quality
    try {
      const qualityResult = await dataQualityService.analyzeDataQuality(transformedData);
      
      if (qualityResult.issues.length > 0) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_QUALITY,
          title: `Data Quality Issues Detected`,
          message: `Detected ${qualityResult.issues.length} data quality issues. Overall score: ${qualityResult.overallScore.toFixed(1)}/100`
        });
      } else {
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.DATA_QUALITY,
          title: `Data Quality Check Passed`,
          message: `No data quality issues detected. Overall score: ${qualityResult.overallScore.toFixed(1)}/100`
        });
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.DATA_QUALITY,
        title: `Data Quality Check Error`,
        message: `Error checking data quality: ${errorMessage}`
      });
    }
    
    return transformedData;
  }
  
  /**
   * Load data into destinations
   */
  private async loadData(
    destinationIds: number[],
    data: any[],
    dataSources: Map<number, DataSource>,
    recordCounts: RecordCounts
  ): Promise<void> {
    if (data.length === 0) {
      return;
    }
    
    for (const destinationId of destinationIds) {
      const dataSource = dataSources.get(destinationId);
      
      if (!dataSource) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_SOURCE,
          title: `Destination Not Found`,
          message: `Destination data source with ID ${destinationId} not found`
        });
        continue;
      }
      
      if (!dataSource.enabled) {
        alertService.createAlert({
          type: AlertType.WARNING,
          severity: AlertSeverity.MEDIUM,
          category: AlertCategory.DATA_SOURCE,
          title: `Destination Disabled`,
          message: `Destination data source "${dataSource.name}" (ID: ${destinationId}) is disabled`
        });
        continue;
      }
      
      try {
        const loadResult: LoadResult = await dataConnector.load(
          destinationId,
          data,
          {
            mode: dataSource.config.options?.loadMode || 'INSERT',
            target: dataSource.config.options?.target || 'default'
          }
        );
        
        if (!loadResult.success) {
          alertService.createAlert({
            type: AlertType.ERROR,
            severity: AlertSeverity.HIGH,
            category: AlertCategory.DATA_SOURCE,
            title: `Data Load Failed: ${dataSource.name}`,
            message: `Failed to load data into "${dataSource.name}" (ID: ${destinationId}): ${loadResult.error}`
          });
          
          recordCounts.failed += loadResult.recordsFailed;
          continue;
        }
        
        recordCounts.loaded += loadResult.recordsLoaded;
        
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.DATA_SOURCE,
          title: `Data Loaded: ${dataSource.name}`,
          message: `Successfully loaded ${loadResult.recordsLoaded} records into "${dataSource.name}" (ID: ${destinationId}) in ${loadResult.executionTime}ms`
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.DATA_SOURCE,
          title: `Data Load Error: ${dataSource.name}`,
          message: `Error loading data into "${dataSource.name}" (ID: ${destinationId}): ${errorMessage}`
        });
        
        recordCounts.failed += data.length;
      }
    }
  }
}

// Export singleton instance
export const etlPipeline = new ETLPipeline();