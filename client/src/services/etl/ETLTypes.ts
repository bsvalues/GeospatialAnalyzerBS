/**
 * ETLTypes.ts
 * 
 * Type definitions for ETL (Extract, Transform, Load) operations
 */

export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  SUCCESS = 'success',
  ERROR = 'error',
  CANCELLED = 'cancelled'
}

export enum JobFrequency {
  ONCE = 'once',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

export enum DataSourceType {
  DATABASE = 'database',
  API = 'api',
  FILE = 'file',
  FTP = 'ftp',
  MEMORY = 'memory',
  SQL_SERVER = 'sqlServer',
  ODBC = 'odbc'
}

export interface SQLServerConnectionConfig {
  server: string;
  port: number;
  database: string;
  username: string;
  password: string;
  encrypt: boolean;
  trustServerCertificate: boolean;
}

export interface ODBCConnectionConfig {
  connectionString: string;
  username: string;
  password: string;
}

export interface DatabaseAdapter {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  query(sql: string, params?: any[]): Promise<any>;
  getTableSchema(tableName: string): Promise<any>;
  getTableList(): Promise<string[]>;
  testConnection(): Promise<boolean>;
}

export interface DataSource {
  id: string;
  name: string;
  description?: string;
  type: DataSourceType;
  config: Record<string, any>;
  lastSyncDate?: Date;
  enabled: boolean;
  tags?: string[];
}

export interface Transformation {
  id: string;
  name: string;
  description?: string;
  code: string;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  enabled: boolean;
  tags?: string[];
}

export interface ETLJob {
  id: string;
  name: string;
  description?: string;
  source: DataSource | string;
  transformations: Array<Transformation | string>;
  destination: DataSource | string;
  schedule?: {
    frequency: JobFrequency;
    startDate?: Date;
    endDate?: Date;
    cronExpression?: string;
  };
  settings?: {
    batchSize?: number;
    timeout?: number;
    maxRetries?: number;
    alertOnSuccess?: boolean;
    alertOnFailure?: boolean;
    validateData?: boolean;
    truncateDestination?: boolean;
  };
  enabled: boolean;
  tags?: string[];
}

export interface ETLJobRun {
  id: string;
  jobId: string;
  startTime: Date;
  endTime?: Date;
  status: JobStatus;
  recordsProcessed: number;
  recordsFailed: number;
  duration: number;
  error?: string;
  logs: JobLogEntry[];
}

export interface ETLJobResult {
  status: JobStatus;
  recordsProcessed: number;
  recordsFailed: number;
  startTime: Date;
  endTime: Date;
  duration: number;
  warnings: string[];
  errorMessage?: string;
}

export interface JobLogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error';
  message: string;
  data?: Record<string, any>;
}

export interface ETLContext {
  jobId: string;
  startTime: Date;
  endTime?: Date;
  sourceData?: any[];
  transformedData?: any[];
  variables: Record<string, any>;
  logs: JobLogEntry[];
  batch?: number;
  batchIndex?: number;
}

export interface ETLMetrics {
  jobsCount: number;
  completedJobsCount: number;
  failedJobsCount: number;
  averageJobDuration: number;
  recordsProcessedTotal: number;
  recordsFailedTotal: number;
  lastJobCompletionDate?: Date;
  topFailingJobs: Array<{ jobId: string; jobName: string; failureCount: number }>;
  recentRuns: ETLJobRun[];
}

export interface ExecutableETLJob {
  job: ETLJob;
  context: ETLContext;
}

export enum AlertType {
  INFO = 'info',
  SUCCESS = 'success',
  WARNING = 'warning',
  ERROR = 'error',
  CRITICAL = 'critical'
}

export enum AlertCategory {
  IMPORT = 'import',
  EXPORT = 'export',
  DATA_QUALITY = 'data_quality',
  CONNECTION = 'connection',
  TRANSFORM = 'transform',
  SECURITY = 'security',
  VALIDATION = 'validation',
  PERFORMANCE = 'performance',
  SYSTEM = 'system'
}