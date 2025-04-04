/**
 * ETL System
 * 
 * This file exports all components of the ETL system.
 */

// Re-export types
export * from './ETLTypes';

// Re-export AlertService
export {
  alertService,
  AlertType,
  AlertSeverity,
  AlertCategory,
  type Alert,
  type AlertPayload,
  type AlertFilterOptions,
  type AlertStats
} from './AlertService';

// Re-export TransformationService
export {
  transformationService,
  type TransformationResult,
  type ErrorMessage
} from './TransformationService';

// Re-export DataQualityService
export {
  dataQualityService,
  DataQualityIssueSeverity,
  type DataQualityIssue,
  type FieldStatistics,
  type DataQualityAnalysisOptions,
  type DataQualityAnalysisResult
} from './DataQualityService';

// Re-export DataConnector
export {
  dataConnector,
  type ConnectionResult,
  type ExtractOptions,
  type ExtractResult,
  type LoadOptions,
  type LoadResult
} from './DataConnector';

// Re-export Scheduler
export {
  scheduler,
  type JobCallback,
  type ScheduledJob
} from './Scheduler';

// Re-export ETLPipeline
export {
  etlPipeline,
  type JobRun
} from './ETLPipeline';

// Re-export ETLPipelineManager
export {
  etlPipelineManager
} from './ETLPipelineManager';