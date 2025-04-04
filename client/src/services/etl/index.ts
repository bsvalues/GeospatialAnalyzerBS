/**
 * ETL Services
 * 
 * This is the main entry point for ETL services. It exports all the ETL-related
 * services, interfaces, and enums in a single module for easier imports.
 */

// Export ETL types and enums
export * from './ETLTypes';

// Export ETL services
export { etlPipeline } from './ETLPipeline';
export { etlPipelineManager } from './ETLPipelineManager';
export { dataConnector } from './DataConnector';
export { transformationService } from './TransformationService';
export { dataQualityService } from './DataQualityService';
export { alertService } from './AlertService';
export { scheduler } from './Scheduler';

// Export ETL service types
export type { ETLPipelineStatus } from './ETLPipeline';
export type { JobRun } from './ETLPipelineManager';
export type { TransformationResult, ErrorMessage } from './TransformationService';
export type { 
  DataQualityAnalysisOptions,
  DataQualityAnalysisResult,
  FieldStatistics
} from './DataQualityService';
export type { 
  Alert, 
  CreateAlertOptions, 
  UpdateAlertOptions, 
  AlertFilterOptions, 
  AlertListenerCallback 
} from './AlertService';
export type { 
  ScheduleConfig, 
  ScheduledJob, 
  JobExecutionResult 
} from './Scheduler';
export type { 
  ConnectionResult, 
  ExtractOptions, 
  ExtractResult, 
  LoadOptions, 
  LoadResult 
} from './DataConnector';