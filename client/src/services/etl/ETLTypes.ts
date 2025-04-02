/**
 * ETL Types and Interfaces
 * 
 * This file contains the type definitions for the ETL system components.
 */

export type DataSourceType = 'database' | 'api' | 'file' | 'memory';

export type ETLJobStatus = 
  | 'created' 
  | 'scheduled' 
  | 'running'
  | 'paused'
  | 'completed'
  | 'failed';

export interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: DataSourceType;
  connectionDetails: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

export interface ETLJob {
  id: string;
  name: string;
  description?: string;
  status: ETLJobStatus;
  sourceId: string;
  targetId: string;
  transformationRules: TransformationRule[];
  schedule?: JobSchedule;
  dependencies?: string[]; // Job IDs this job depends on
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  nextRunAt?: Date;
}

export interface TransformationRule {
  id: string;
  name: string;
  description?: string;
  dataType: 'number' | 'text' | 'date' | 'boolean' | 'object';
  transformationCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export interface JobSchedule {
  frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly' | 'custom';
  startDate: Date;
  endDate?: Date;
  cronExpression?: string; // For custom schedules
  runImmediately?: boolean;
}

export interface OptimizationSuggestion {
  id: string;
  jobId: string;
  description: string;
  category: 'performance' | 'memory' | 'quality' | 'reliability';
  estimatedImprovement: number; // percentage
  implementationComplexity: 'low' | 'medium' | 'high';
  suggestedCode?: string;
  createdAt: Date;
}

export interface ETLExecutionLog {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'success' | 'warning' | 'error';
  message?: string;
  recordsProcessed: number;
  errors: ETLExecutionError[];
}

export interface ETLExecutionError {
  code: string;
  message: string;
  timestamp: Date;
  context?: Record<string, any>;
}

// Types for the ETL Pipeline
export interface ETLPipelineContext {
  jobId: string;
  source: DataSource;
  target: DataSource;
  transformationRules: TransformationRule[];
  startTime: Date;
  variables: Record<string, any>;
  logs: string[];
}

// Types for ETL optimization
export interface OptimizationMetrics {
  queryTime: number;
  transformationTime: number;
  loadTime: number;
  memoryUsage: number;
  cpuUsage: number;
  dataQualityScore: number;
}

export interface BatchJobContext {
  batchId: string;
  jobIds: string[];
  priority: 'low' | 'medium' | 'high';
  concurrency: number;
  status: 'pending' | 'running' | 'completed' | 'failed';
  startTime?: Date;
  endTime?: Date;
}

// Data quality types
export interface DataQualityRule {
  id: string;
  name: string;
  description?: string;
  ruleType: 'validation' | 'cleansing' | 'enrichment';
  condition: string;
  action: string;
  severity: 'info' | 'warning' | 'error';
  isActive: boolean;
}