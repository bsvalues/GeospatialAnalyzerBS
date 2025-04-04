import { ETLJob, JobStatus } from './ETLTypes';
import { alertService, AlertType, AlertSeverity, AlertCategory } from './AlertService';
import { transformationService, TransformationResult } from './TransformationService';

/**
 * Extract result interface
 */
export interface ExtractResult {
  sourceId: number;
  data: any[];
  success: boolean;
  errors: string[];
  executionTime: number;
}

/**
 * Load result interface
 */
export interface LoadResult {
  destinationId: number;
  recordsLoaded: number;
  success: boolean;
  errors: string[];
  executionTime: number;
}

/**
 * Pipeline execution options interface
 */
export interface PipelineExecutionOptions {
  validateOnly?: boolean;
  batchSize?: number;
  continueOnError?: boolean;
  maxRetries?: number;
  context?: Record<string, any>;
}

/**
 * Pipeline result interface
 */
export interface PipelineResult {
  jobId: number;
  sourceResults: ExtractResult[];
  transformationResult?: TransformationResult;
  destinationResults: LoadResult[];
  recordsExtracted: number;
  recordsTransformed: number;
  recordsLoaded: number;
  executionTime: number;
  startTime: Date;
  endTime: Date;
  success: boolean;
  errors: string[];
}

/**
 * ETL Pipeline class
 */
class ETLPipeline {
  constructor() {
    console.log('ETLPipeline initialized');
  }
  
  /**
   * Execute an ETL job
   */
  async executeJob(
    job: ETLJob,
    rules: any[] = [],
    dataConnectors: Record<number, any> = {},
    options: PipelineExecutionOptions = {}
  ): Promise<PipelineResult> {
    console.log(`Executing ETL job: ${job.name} (ID: ${job.id})`);
    
    const startTime = new Date();
    let success = true;
    const errors: string[] = [];
    
    // Set job status to running
    job.status = JobStatus.RUNNING;
    job.lastRun = startTime;
    
    // Initialize the result
    const result: PipelineResult = {
      jobId: job.id,
      sourceResults: [],
      destinationResults: [],
      recordsExtracted: 0,
      recordsTransformed: 0,
      recordsLoaded: 0,
      executionTime: 0,
      startTime,
      endTime: new Date(),
      success: false,
      errors: []
    };
    
    // Create context for transformation
    const context = options.context || {};
    
    try {
      // Extract data from sources
      const extractResults = await this.extractData(job.sources, dataConnectors, options);
      result.sourceResults = extractResults;
      
      // Combine all extracted data
      let combinedData: any[] = [];
      let extractError = false;
      
      for (const extractResult of extractResults) {
        if (extractResult.success) {
          combinedData = combinedData.concat(extractResult.data);
          result.recordsExtracted += extractResult.data.length;
        } else {
          extractError = true;
          errors.push(`Source ${extractResult.sourceId} extraction failed: ${extractResult.errors.join(', ')}`);
          
          if (!options.continueOnError) {
            throw new Error(`Source ${extractResult.sourceId} extraction failed: ${extractResult.errors.join(', ')}`);
          }
        }
      }
      
      // Early return if no data was extracted and we're not continuing on error
      if (combinedData.length === 0 && !options.continueOnError) {
        throw new Error('No data extracted from sources');
      }
      
      // Add extracted data to the context
      context.sourceData = combinedData;
      
      // Transform data if rules are provided
      if (rules.length > 0 && combinedData.length > 0) {
        try {
          const transformationResult = await transformationService.applyTransformations(
            combinedData,
            rules,
            context
          );
          
          result.transformationResult = transformationResult;
          result.recordsTransformed = transformationResult.recordsOutput;
          
          if (!transformationResult.success) {
            errors.push(`Transformation failed: ${transformationResult.errors.map(e => e.message).join(', ')}`);
            
            if (!options.continueOnError) {
              throw new Error(`Transformation failed: ${transformationResult.errors.map(e => e.message).join(', ')}`);
            }
          }
          
          // Replace the data to be loaded with transformed data
          combinedData = transformationResult.data;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Transformation error: ${errorMessage}`);
          
          if (!options.continueOnError) {
            throw error;
          }
        }
      }
      
      // Only load data if not in validate only mode
      if (!options.validateOnly) {
        // Load data to destinations
        const loadResults = await this.loadData(job.destinations, combinedData, dataConnectors, options);
        result.destinationResults = loadResults;
        
        // Calculate records loaded
        for (const loadResult of loadResults) {
          if (loadResult.success) {
            result.recordsLoaded += loadResult.recordsLoaded;
          } else {
            errors.push(`Destination ${loadResult.destinationId} load failed: ${loadResult.errors.join(', ')}`);
            
            if (!options.continueOnError) {
              throw new Error(`Destination ${loadResult.destinationId} load failed: ${loadResult.errors.join(', ')}`);
            }
          }
        }
      }
      
      // Set success flag based on errors
      success = errors.length === 0;
    } catch (error) {
      success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      console.error(`Job execution failed: ${errorMessage}`);
      
      // Create an alert for the error
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.TRANSFORMATION,
        title: `ETL Job Failed: ${job.name}`,
        message: errorMessage,
        details: errors.join('\n'),
        jobId: job.id
      });
    } finally {
      // Update the job status
      job.status = success ? JobStatus.SUCCEEDED : JobStatus.FAILED;
      
      // Calculate execution time
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      
      // Update result
      result.success = success;
      result.errors = errors;
      result.endTime = endTime;
      result.executionTime = executionTime;
      
      console.log(`Job ${job.name} execution completed in ${executionTime}ms, success: ${success}`);
      
      // Create success alert if no errors
      if (success) {
        alertService.createAlert({
          type: AlertType.SUCCESS,
          severity: AlertSeverity.LOW,
          category: AlertCategory.TRANSFORMATION,
          title: `ETL Job Completed: ${job.name}`,
          message: `Job executed successfully in ${executionTime}ms`,
          details: `Records extracted: ${result.recordsExtracted}, transformed: ${result.recordsTransformed}, loaded: ${result.recordsLoaded}`,
          jobId: job.id
        });
      }
    }
    
    return result;
  }
  
  /**
   * Validate an ETL job without executing the load phase
   */
  async validateJob(
    job: ETLJob,
    rules: any[] = [],
    dataConnectors: Record<number, any> = {},
    options: PipelineExecutionOptions = {}
  ): Promise<PipelineResult> {
    // Set validateOnly to true and execute the job
    return this.executeJob(job, rules, dataConnectors, {
      ...options,
      validateOnly: true
    });
  }
  
  /**
   * Execute a data preview for an ETL job
   */
  async previewJob(
    job: ETLJob,
    rules: any[] = [],
    dataConnectors: Record<number, any> = {},
    options: PipelineExecutionOptions = {},
    previewOptions: {
      recordLimit?: number;
      includeSource?: boolean;
      sources?: number[];
    } = {}
  ): Promise<{
    sourceData: any[];
    transformedData: any[];
    recordsProcessed: number;
    executionTime: number;
    success: boolean;
    errors: string[];
  }> {
    console.log(`Executing preview for ETL job: ${job.name} (ID: ${job.id})`);
    
    const startTime = new Date();
    let success = true;
    const errors: string[] = [];
    
    const recordLimit = previewOptions.recordLimit || 100;
    const result = {
      sourceData: [] as any[],
      transformedData: [] as any[],
      recordsProcessed: 0,
      executionTime: 0,
      success: false,
      errors: [] as string[]
    };
    
    // Create context for transformation
    const context = options.context || {};
    
    try {
      // Filter sources if specified
      const sourcesToExtract = previewOptions.sources && previewOptions.sources.length > 0
        ? job.sources.filter(id => previewOptions.sources!.includes(id))
        : job.sources;
      
      // Extract data from sources
      const extractResults = await this.extractData(sourcesToExtract, dataConnectors, {
        ...options,
        batchSize: recordLimit
      });
      
      // Combine all extracted data
      let combinedData: any[] = [];
      let extractError = false;
      
      for (const extractResult of extractResults) {
        if (extractResult.success) {
          combinedData = combinedData.concat(extractResult.data);
          result.recordsProcessed += extractResult.data.length;
        } else {
          extractError = true;
          errors.push(`Source ${extractResult.sourceId} extraction failed: ${extractResult.errors.join(', ')}`);
          
          if (!options.continueOnError) {
            throw new Error(`Source ${extractResult.sourceId} extraction failed: ${extractResult.errors.join(', ')}`);
          }
        }
      }
      
      // Limit records for preview
      if (combinedData.length > recordLimit) {
        combinedData = combinedData.slice(0, recordLimit);
      }
      
      // Save source data if requested
      if (previewOptions.includeSource) {
        result.sourceData = [...combinedData];
      }
      
      // Add extracted data to the context
      context.sourceData = combinedData;
      
      // Transform data if rules are provided
      if (rules.length > 0 && combinedData.length > 0) {
        try {
          const transformationResult = await transformationService.applyTransformations(
            combinedData,
            rules,
            context
          );
          
          if (!transformationResult.success) {
            errors.push(`Transformation failed: ${transformationResult.errors.map(e => e.message).join(', ')}`);
            
            if (!options.continueOnError) {
              throw new Error(`Transformation failed: ${transformationResult.errors.map(e => e.message).join(', ')}`);
            }
          }
          
          // Set transformed data
          result.transformedData = transformationResult.data;
        } catch (error) {
          const errorMessage = error instanceof Error ? error.message : String(error);
          errors.push(`Transformation error: ${errorMessage}`);
          
          if (!options.continueOnError) {
            throw error;
          }
        }
      } else {
        // If no transformations, use source data
        result.transformedData = combinedData;
      }
      
      // Set success flag based on errors
      success = errors.length === 0;
    } catch (error) {
      success = false;
      const errorMessage = error instanceof Error ? error.message : String(error);
      errors.push(errorMessage);
      console.error(`Job preview failed: ${errorMessage}`);
    } finally {
      // Calculate execution time
      const endTime = new Date();
      const executionTime = endTime.getTime() - startTime.getTime();
      
      // Update result
      result.success = success;
      result.errors = errors;
      result.executionTime = executionTime;
      
      console.log(`Job ${job.name} preview completed in ${executionTime}ms, success: ${success}`);
    }
    
    return result;
  }
  
  /**
   * Extract data from sources
   * Note: In a real implementation, this would use DataConnectors to extract from various sources
   */
  private async extractData(
    sourceIds: number[],
    dataConnectors: Record<number, any>,
    options: PipelineExecutionOptions
  ): Promise<ExtractResult[]> {
    const results: ExtractResult[] = [];
    
    // For each source, extract data
    for (const sourceId of sourceIds) {
      const startTime = Date.now();
      let success = true;
      const errors: string[] = [];
      let data: any[] = [];
      
      try {
        // Get the data connector for this source
        const connector = dataConnectors[sourceId];
        
        if (!connector) {
          throw new Error(`Data connector not found for source ID: ${sourceId}`);
        }
        
        // Extract data using the connector
        // In a real implementation, this would call connector.extract()
        // For now, we'll simulate with mock data if the connector has a mockData property
        if (connector.mockData) {
          data = connector.mockData;
        } else if (connector.extract) {
          data = await connector.extract(options);
        } else {
          throw new Error(`Connector for source ID: ${sourceId} does not have an extract method`);
        }
      } catch (error) {
        success = false;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(errorMessage);
        console.error(`Extract failed for source ${sourceId}: ${errorMessage}`);
      }
      
      // Add the result
      results.push({
        sourceId,
        data,
        success,
        errors,
        executionTime: Date.now() - startTime
      });
    }
    
    return results;
  }
  
  /**
   * Load data to destinations
   * Note: In a real implementation, this would use DataConnectors to load to various destinations
   */
  private async loadData(
    destinationIds: number[],
    data: any[],
    dataConnectors: Record<number, any>,
    options: PipelineExecutionOptions
  ): Promise<LoadResult[]> {
    const results: LoadResult[] = [];
    
    // For each destination, load data
    for (const destinationId of destinationIds) {
      const startTime = Date.now();
      let success = true;
      const errors: string[] = [];
      let recordsLoaded = 0;
      
      try {
        // Get the data connector for this destination
        const connector = dataConnectors[destinationId];
        
        if (!connector) {
          throw new Error(`Data connector not found for destination ID: ${destinationId}`);
        }
        
        // Load data using the connector
        // In a real implementation, this would call connector.load()
        if (connector.load) {
          recordsLoaded = await connector.load(data, options);
        } else {
          // Mock successful load if no load method
          recordsLoaded = data.length;
        }
      } catch (error) {
        success = false;
        const errorMessage = error instanceof Error ? error.message : String(error);
        errors.push(errorMessage);
        console.error(`Load failed for destination ${destinationId}: ${errorMessage}`);
      }
      
      // Add the result
      results.push({
        destinationId,
        recordsLoaded,
        success,
        errors,
        executionTime: Date.now() - startTime
      });
    }
    
    return results;
  }
}

// Export a singleton instance
export const etlPipeline = new ETLPipeline();