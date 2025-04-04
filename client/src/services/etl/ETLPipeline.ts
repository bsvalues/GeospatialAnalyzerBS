import { ETLJob, JobStatus, TransformationRule } from './ETLTypes';
import { dataConnector } from './DataConnector';
import { transformationService } from './TransformationService';
import { dataQualityService } from './DataQualityService';
import { Alert, alertService } from './AlertService';

/**
 * ETL pipeline result interface
 */
export interface ETLPipelineResult {
  status: JobStatus;
  startTime: Date;
  endTime: Date;
  duration: number;
  recordsProcessed: number;
  recordsCreated: number;
  recordsUpdated: number;
  recordsDeleted: number;
  dataQualityScore?: number;
  alerts: Alert[];
}

/**
 * ETL pipeline for executing ETL jobs
 */
class ETLPipeline {
  constructor() {
    // Default constructor
  }
  
  /**
   * Execute an ETL job
   */
  async executeJob(job: ETLJob, transformationRules: TransformationRule[]): Promise<ETLPipelineResult> {
    console.log(`Executing ETL job: ${job.name} (${job.id})`);
    
    const startTime = new Date();
    const alerts: Alert[] = [];
    
    // Create a job started alert
    const startedAlert = alertService.createJobStartedAlert(job);
    if (startedAlert) {
      alerts.push(startedAlert);
    }
    
    try {
      // Extract data from all sources
      console.log(`Extracting data from ${job.sources.length} sources`);
      const extractedData = await this.extractData(job);
      console.log(`Extracted ${extractedData.length} records`);
      
      // Transform data
      console.log(`Applying ${transformationRules.length} transformation rules`);
      const transformResult = await transformationService.applyTransformations(extractedData, transformationRules);
      console.log(`Transformed ${transformResult.transformedCount} records, filtered ${transformResult.filteredCount} records, added ${transformResult.addedCount} records`);
      
      // Handle transformation errors
      if (transformResult.errors.length > 0) {
        console.warn(`Encountered ${transformResult.errors.length} transformation errors`);
        
        // Check if we should continue on error
        if (!job.continueOnError) {
          throw new Error(`Transformation failed: ${transformResult.errors[0].error}`);
        }
      }
      
      // Analyze data quality
      console.log('Analyzing data quality');
      const qualityAnalysis = dataQualityService.analyzeQuality(transformResult.data);
      console.log(`Data quality score: ${qualityAnalysis.completeness}`);
      
      // Load data to all destinations
      console.log(`Loading data to ${job.destinations.length} destinations`);
      const loadResults = await this.loadData(job, transformResult.data);
      console.log(`Loaded data: created=${loadResults.created}, updated=${loadResults.updated}, deleted=${loadResults.deleted}`);
      
      // Calculate duration
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Create a job completed alert
      const completedAlert = alertService.createJobCompletedAlert(job, duration);
      if (completedAlert) {
        alerts.push(completedAlert);
      }
      
      // Create data quality alert if score is low
      if (qualityAnalysis.completeness < 0.7) {
        const qualityAlert = alertService.createDataQualityAlert(job, qualityAnalysis.completeness, {
          issues: qualityAnalysis.issues.length,
          summary: qualityAnalysis.summary
        });
        
        if (qualityAlert) {
          alerts.push(qualityAlert);
        }
      }
      
      // Return the result
      return {
        status: JobStatus.COMPLETED,
        startTime,
        endTime,
        duration,
        recordsProcessed: extractedData.length,
        recordsCreated: loadResults.created,
        recordsUpdated: loadResults.updated,
        recordsDeleted: loadResults.deleted,
        dataQualityScore: qualityAnalysis.completeness,
        alerts
      };
    } catch (error) {
      console.error(`Error executing ETL job ${job.name}:`, error);
      
      // Calculate duration
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Create a job failure alert
      const failureAlert = alertService.createJobFailureAlert(job, error);
      if (failureAlert) {
        alerts.push(failureAlert);
      }
      
      // Return error result
      return {
        status: JobStatus.FAILED,
        startTime,
        endTime,
        duration,
        recordsProcessed: 0,
        recordsCreated: 0,
        recordsUpdated: 0,
        recordsDeleted: 0,
        alerts
      };
    }
  }
  
  /**
   * Extract data from all sources
   */
  private async extractData(job: ETLJob): Promise<any[]> {
    const allData: any[] = [];
    
    // Process each source
    for (const sourceId of job.sources) {
      try {
        // Find the source
        // Note: In a real implementation, we would fetch the source from storage
        // Here, we'll just create a mock source based on the ID
        const source = {
          id: sourceId,
          name: `Source ${sourceId}`,
          type: sourceId % 3 === 0 ? 'database' : (sourceId % 3 === 1 ? 'api' : 'file'),
          config: {},
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Fetch data from the source
        const data = await dataConnector.fetchData(source);
        
        // Add data to the combined result
        allData.push(...data);
      } catch (error) {
        console.error(`Error extracting data from source ${sourceId}:`, error);
        
        // Create a connection failure alert
        const connectionAlert = alertService.createConnectionFailureAlert(
          `Source ${sourceId}`,
          'source',
          error
        );
        
        // Check if we should continue on error
        if (!job.continueOnError) {
          throw error;
        }
      }
    }
    
    return allData;
  }
  
  /**
   * Load data to all destinations
   */
  private async loadData(job: ETLJob, data: any[]): Promise<{ created: number, updated: number, deleted: number }> {
    let totalCreated = 0;
    let totalUpdated = 0;
    let totalDeleted = 0;
    
    // Process each destination
    for (const destinationId of job.destinations) {
      try {
        // Find the destination
        // Note: In a real implementation, we would fetch the destination from storage
        // Here, we'll just create a mock destination based on the ID
        const destination = {
          id: destinationId,
          name: `Destination ${destinationId}`,
          type: destinationId % 3 === 0 ? 'database' : (destinationId % 3 === 1 ? 'api' : 'file'),
          config: {},
          enabled: true,
          createdAt: new Date(),
          updatedAt: new Date()
        };
        
        // Load data to the destination
        const result = await dataConnector.loadData(destination, data);
        
        // Add to totals
        totalCreated += result.created;
        totalUpdated += result.updated;
        totalDeleted += result.deleted;
      } catch (error) {
        console.error(`Error loading data to destination ${destinationId}:`, error);
        
        // Create a connection failure alert
        const connectionAlert = alertService.createConnectionFailureAlert(
          `Destination ${destinationId}`,
          'destination',
          error
        );
        
        // Check if we should continue on error
        if (!job.continueOnError) {
          throw error;
        }
      }
    }
    
    return {
      created: totalCreated,
      updated: totalUpdated,
      deleted: totalDeleted
    };
  }
}

// Export a singleton instance
export const etlPipeline = new ETLPipeline();