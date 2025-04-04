// Re-export all types and interfaces
export * from './ETLTypes';

// Re-export all services
export { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';
export type { Alert, AlertPayload, AlertFilterOptions, AlertStats } from './AlertService';

export { dataConnector } from './DataConnector';
export type { ConnectionResult, ExtractOptions, ExtractResult, LoadOptions, LoadResult } from './DataConnector';

export { transformationService } from './TransformationService';
export type { TransformationResult, ErrorMessage } from './TransformationService';

export { dataQualityService, DataQualityIssueSeverity } from './DataQualityService';
export type { 
  DataQualityIssue, 
  FieldStatistics, 
  DataQualityAnalysisOptions, 
  DataQualityAnalysisResult 
} from './DataQualityService';

export { etlPipeline } from './ETLPipeline';
export type { JobRun } from './ETLPipeline';

export { scheduler, ScheduleFrequency } from './Scheduler';
export type { ScheduleConfig, ScheduledJob } from './Scheduler';

export { etlPipelineManager as etlManager } from './ETLPipelineManager';

/**
 * Initialize the ETL pipeline system
 * 
 * This function initializes all ETL services.
 */
// Import directly from ETLPipelineManager to avoid circular dependency
import { etlPipelineManager } from './ETLPipelineManager';

export function initializeETL(): void {
  // Initialize ETL pipeline manager
  // This solves the circular dependency issue
  etlPipelineManager.initialize();
}