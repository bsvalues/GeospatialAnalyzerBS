/**
 * ETL Types Service
 * 
 * This file contains type definitions for the ETL system, including data sources,
 * transformations, and jobs.
 */

export type DataSourceType = 'database' | 'api' | 'file' | 'memory';

export interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: DataSourceType;
  connectionDetails: Record<string, any>;
  isConnected?: boolean;
  lastConnected?: Date;
  createdAt?: Date;
  updatedAt?: Date;
}

export interface TransformationRule {
  id: string;
  name: string;
  description?: string;
  dataType: 'text' | 'number' | 'date' | 'boolean' | 'object' | 'location' | 'address' | 'geospatial';
  transformationCode: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

export type ETLJobStatus = 'idle' | 'running' | 'success' | 'failed' | 'warning' | 'paused' | 'completed' | 'scheduled' | 'created';

export interface ETLJob {
  id: string;
  name: string;
  description?: string;
  sourceId: string;
  targetId: string;
  transformationIds: string[];
  transformationRules?: TransformationRule[]; // For backward compatibility 
  status: ETLJobStatus;
  schedule?: {
    frequency: 'once' | 'hourly' | 'daily' | 'weekly' | 'monthly';
    startDate?: Date;
    daysOfWeek?: number[];
    timeOfDay?: string;
    lastRun?: Date;
    nextRun?: Date;
  };
  metrics?: ETLJobMetrics;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
}

export interface ETLJobMetrics {
  executionTimeMs: number;
  cpuUtilization: number;
  memoryUsageMb: number;
  rowsProcessed: number;
  bytesProcessed: number;
  errorCount: number;
  warningCount: number;
  dataQualityScore?: number;
  bottlenecks?: {
    type: 'cpu' | 'memory' | 'network' | 'disk' | 'transformation';
    severity: 'low' | 'medium' | 'high';
    details: string;
  }[];
}

export interface ETLPipelineMetrics {
  totalJobs: number;
  activeJobs: number;
  failedJobs: number;
  warningJobs: number;
  averageExecutionTimeMs: number;
  totalRowsProcessed: number;
  totalBytesProcessed: number;
  overallPerformanceScore: number;
  resourceUtilization: {
    cpu: number;
    memory: number;
    disk: number;
    network: number;
  };
}

export interface OptimizationSuggestion {
  id: string;
  jobId: string;
  type: 'performance' | 'resource' | 'code' | 'scheduling';
  severity: 'low' | 'medium' | 'high';
  title: string;
  description: string;
  suggestedAction: string;
  estimatedImprovement: {
    metric: 'executionTime' | 'memory' | 'cpu' | 'throughput';
    percentage: number;
  };
  status: 'new' | 'in_progress' | 'implemented' | 'ignored';
  createdAt: Date;
  category?: string;
  implementationComplexity?: 'Very Easy' | 'Easy' | 'Moderate' | 'Advanced' | 'Complex';
  suggestedCode?: string;
}

export interface DataQualityRule {
  id: string;
  name: string;
  description?: string;
  field: string;
  rule: string;
  severity: 'info' | 'warning' | 'error';
  isActive: boolean;
}

export interface BatchJob {
  id: string;
  name: string;
  description?: string;
  jobIds: string[];
  status: 'idle' | 'running' | 'success' | 'failed' | 'warning';
  progress: number;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

export interface ETLAlert {
  id: string;
  jobId: string;
  type: 'error' | 'warning' | 'info';
  message: string;
  details?: string;
  timestamp: Date;
  isRead: boolean;
}

export interface ETLDashboardMetrics {
  dailyJobs: {
    date: string;
    successful: number;
    failed: number;
    warning: number;
  }[];
  resourceUtilization: {
    timestamp: string;
    cpu: number;
    memory: number;
  }[];
  dataVolume: {
    timestamp: string;
    bytesProcessed: number;
    rowsProcessed: number;
  }[];
}

export interface ETLPipelineConfig {
  parallelJobs: number;
  maxRetries: number;
  retryDelayMs: number;
  timeoutMs: number;
  logLevel: 'debug' | 'info' | 'warning' | 'error';
  enableDataQualityChecks: boolean;
  enablePerformanceMonitoring: boolean;
  notificationSettings: {
    onSuccess: boolean;
    onWarning: boolean;
    onError: boolean;
    recipients: string[];
  };
}

export interface ETLExecutionError {
  code: string;
  message: string;
  timestamp: Date;
}

export interface ETLExecutionLog {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: 'success' | 'error' | 'warning';
  recordsProcessed: number;
  message?: string;
  errors: ETLExecutionError[];
}