import { DataSourceConfig, TransformationRule } from './ETLTypes';
import { dataConnector, ConnectionStats } from './DataConnector';
import { transformationService } from './TransformationService';
import { dataQualityService, DataQualityAnalysisResult } from './DataQualityService';
import { alertService, AlertType, AlertSeverity, AlertCategory } from './AlertService';

/**
 * ETL Pipeline options interface
 */
export interface ETLPipelineOptions {
  validateData?: boolean;
  analyzeDataQuality?: boolean;
  maxRetries?: number;
  logTransformations?: boolean;
  stopOnError?: boolean;
  chunkSize?: number;
  includeMetadata?: boolean;
}

/**
 * ETL Pipeline result interface
 */
export interface ETLPipelineResult {
  success: boolean;
  sourceStats: ConnectionStats;
  destinationStats: ConnectionStats;
  recordCounts: {
    extracted: number;
    transformed: number;
    loaded: number;
    failed: number;
  };
  errors: any[];
  warnings: any[];
  executionTime: number;
  transformationTime: number;
  dataQualityResult?: DataQualityAnalysisResult;
  logs: string[];
}

/**
 * ETL Pipeline class
 */
class ETLPipeline {
  private logs: string[] = [];
  
  constructor() {
    console.log('ETL Pipeline initialized');
  }
  
  /**
   * Execute the ETL pipeline
   */
  async execute(
    source: DataSourceConfig,
    destination: DataSourceConfig,
    transformationRules: TransformationRule[],
    options: ETLPipelineOptions = {}
  ): Promise<ETLPipelineResult> {
    // Reset logs for this execution
    this.logs = [];
    
    const startTime = new Date();
    this.log('Starting ETL pipeline execution');
    
    // Set default options
    const defaultOptions: ETLPipelineOptions = {
      validateData: true,
      analyzeDataQuality: true,
      maxRetries: 3,
      logTransformations: true,
      stopOnError: false,
      chunkSize: 1000,
      includeMetadata: true
    };
    
    const pipelineOptions = { ...defaultOptions, ...options };
    const errors: any[] = [];
    const warnings: any[] = [];
    
    try {
      // Extract data from source
      this.log(`Extracting data from source: ${source.name}`);
      const extractResult = await dataConnector.extractData(source);
      const { data: extractedData, stats: sourceStats } = extractResult;
      
      this.log(`Extracted ${extractedData.length} records in ${sourceStats.duration}ms`);
      
      // Validate and analyze data quality if enabled
      let dataQualityResult: DataQualityAnalysisResult | undefined;
      
      if (pipelineOptions.analyzeDataQuality) {
        this.log('Analyzing data quality');
        
        try {
          dataQualityResult = dataQualityService.analyzeDataQuality(extractedData);
          
          if (dataQualityResult.issues.length > 0) {
            this.log(`Found ${dataQualityResult.issues.length} data quality issues`);
            
            // Add warnings for data quality issues
            for (const issue of dataQualityResult.issues) {
              warnings.push({
                type: 'data_quality',
                issue
              });
            }
          }
        } catch (error) {
          this.log(`Error analyzing data quality: ${error instanceof Error ? error.message : String(error)}`);
          warnings.push({
            type: 'data_quality_analysis_error',
            error
          });
        }
      }
      
      // Apply transformations
      this.log(`Applying ${transformationRules.length} transformation rules`);
      const transformStartTime = new Date();
      
      // Filter out disabled transformation rules
      const activeRules = transformationRules.filter(rule => rule.enabled);
      
      // Sort rules by order if specified
      const sortedRules = [...activeRules].sort((a, b) => {
        if (a.order !== undefined && b.order !== undefined) {
          return a.order - b.order;
        }
        return 0;
      });
      
      // Apply each transformation rule
      let transformedData = [...extractedData];
      let failedRecords = 0;
      
      for (const rule of sortedRules) {
        if (pipelineOptions.logTransformations) {
          this.log(`Applying transformation: ${rule.name} (${rule.type})`);
        }
        
        try {
          const result = await transformationService.applyTransformation(
            transformedData,
            rule
          );
          
          transformedData = result.data;
          failedRecords += result.failedRecords.length;
          
          if (result.failedRecords.length > 0) {
            this.log(`${result.failedRecords.length} records failed transformation: ${rule.name}`);
            
            // Add errors for failed transformations
            for (const failedRecord of result.failedRecords) {
              errors.push({
                type: 'transformation_error',
                rule: rule.name,
                record: failedRecord.record,
                error: failedRecord.error
              });
              
              if (pipelineOptions.stopOnError) {
                throw new Error(`Transformation failed: ${failedRecord.error}`);
              }
            }
          }
        } catch (error) {
          this.log(`Error applying transformation ${rule.name}: ${error instanceof Error ? error.message : String(error)}`);
          
          errors.push({
            type: 'transformation_rule_error',
            rule: rule.name,
            error
          });
          
          if (pipelineOptions.stopOnError) {
            throw error;
          }
        }
      }
      
      const transformEndTime = new Date();
      const transformationTime = transformEndTime.getTime() - transformStartTime.getTime();
      
      this.log(`Transformed ${transformedData.length} records in ${transformationTime}ms`);
      
      // Load data to destination
      this.log(`Loading data to destination: ${destination.name}`);
      const loadResult = await dataConnector.loadData(
        destination,
        transformedData,
        {
          chunkSize: pipelineOptions.chunkSize
        }
      );
      
      const { stats: destinationStats, recordsProcessed } = loadResult;
      
      this.log(`Loaded ${recordsProcessed} records in ${destinationStats.duration}ms`);
      
      // If the load operation had errors, add them to our errors array
      if (loadResult.errors && loadResult.errors.length > 0) {
        for (const error of loadResult.errors) {
          errors.push({
            type: 'load_error',
            error
          });
        }
      }
      
      // Calculate execution time
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      
      this.log(`ETL pipeline execution completed in ${executionTime}ms`);
      
      // Create the result object
      const result: ETLPipelineResult = {
        success: errors.length === 0,
        sourceStats,
        destinationStats,
        recordCounts: {
          extracted: extractedData.length,
          transformed: transformedData.length,
          loaded: recordsProcessed,
          failed: failedRecords
        },
        errors,
        warnings,
        executionTime,
        transformationTime,
        dataQualityResult,
        logs: [...this.logs]
      };
      
      // Create an alert for the ETL result
      if (result.success) {
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.TRANSFORMATION,
          title: 'ETL Pipeline Succeeded',
          message: `ETL pipeline completed successfully: ${extractedData.length} records extracted, ${transformedData.length} records transformed, ${recordsProcessed} records loaded in ${executionTime}ms`
        });
      } else {
        alertService.createAlert({
          type: AlertType.ERROR,
          severity: AlertSeverity.HIGH,
          category: AlertCategory.TRANSFORMATION,
          title: 'ETL Pipeline Failed',
          message: `ETL pipeline completed with errors: ${errors.length} errors occurred during execution`
        });
      }
      
      return result;
    } catch (error) {
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      
      this.log(`ETL pipeline execution failed after ${executionTime}ms: ${error instanceof Error ? error.message : String(error)}`);
      
      // Create an alert for the failure
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.CRITICAL,
        category: AlertCategory.TRANSFORMATION,
        title: 'ETL Pipeline Failed',
        message: `ETL pipeline execution failed: ${error instanceof Error ? error.message : String(error)}`
      });
      
      // Return a failed result object
      return {
        success: false,
        sourceStats: {
          bytesTransferred: 0,
          recordsCount: 0,
          duration: executionTime,
          startTime: startTime,
          endTime: endTime,
          avgTransferRate: 0,
          recordsPerSecond: 0
        },
        destinationStats: {
          bytesTransferred: 0,
          recordsCount: 0,
          duration: 0,
          startTime: endTime,
          endTime: endTime,
          avgTransferRate: 0,
          recordsPerSecond: 0
        },
        recordCounts: {
          extracted: 0,
          transformed: 0,
          loaded: 0,
          failed: 0
        },
        errors: [
          {
            type: 'execution_error',
            error
          }
        ],
        warnings: [],
        executionTime,
        transformationTime: 0,
        logs: [...this.logs]
      };
    }
  }
  
  /**
   * Add a log entry
   */
  private log(message: string): void {
    const timestamp = new Date().toISOString();
    const logEntry = `[${timestamp}] ${message}`;
    
    console.log(logEntry);
    this.logs.push(logEntry);
  }
}

// Export a singleton instance
export const etlPipeline = new ETLPipeline();