// Common ETL types

/**
 * Data Source Types
 */
export enum DataSourceType {
  DATABASE = 'DATABASE',
  API = 'API',
  FILE = 'FILE',
  IN_MEMORY = 'IN_MEMORY',
  CUSTOM = 'CUSTOM'
}

/**
 * Database Types
 */
export enum DatabaseType {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  MSSQL = 'MSSQL',
  ORACLE = 'ORACLE',
  SQLITE = 'SQLITE',
  MONGODB = 'MONGODB'
}

/**
 * API Types
 */
export enum ApiType {
  REST = 'REST',
  GRAPHQL = 'GRAPHQL',
  SOAP = 'SOAP',
  CUSTOM = 'CUSTOM'
}

/**
 * API Authentication Types
 */
export enum AuthType {
  NONE = 'NONE',
  API_KEY = 'API_KEY',
  BASIC = 'BASIC',
  BEARER = 'BEARER',
  JWT = 'JWT',
  OAUTH = 'OAUTH',
  CUSTOM = 'CUSTOM'
}

/**
 * File Types
 */
export enum FileType {
  CSV = 'CSV',
  JSON = 'JSON',
  XML = 'XML',
  EXCEL = 'EXCEL',
  PARQUET = 'PARQUET',
  AVRO = 'AVRO'
}

/**
 * Data Source interface
 */
export interface DataSource {
  id: number;
  name: string;
  description?: string;
  type: DataSourceType;
  connection: {
    database?: {
      type: DatabaseType;
      host: string;
      port: number;
      username: string;
      password: string;
      database: string;
      connectionString?: string;
    };
    api?: {
      type: ApiType;
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      authType?: AuthType;
      authDetails?: Record<string, string>;
      pagination?: {
        type: 'cursor' | 'offset' | 'page';
        nextPageParam?: string;
        totalParam?: string;
        pageSizeParam?: string;
        pageParam?: string;
      };
    };
    file?: {
      path: string;
      type: FileType;
      delimiter?: string;
      encoding?: string;
      hasHeader?: boolean;
      sheet?: string | number;
    };
    inMemory?: {
      data: any[];
    };
    custom?: {
      config: Record<string, any>;
    };
  };
  enabled: boolean;
  extraction: {
    query?: string;
    filters?: Record<string, any>;
    fields?: string[];
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  };
}

/**
 * Connection Test Result
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  timestamp: Date;
  details?: any;
}

/**
 * Transformation Types
 */
export enum TransformationType {
  FILTER = 'FILTER',
  MAP = 'MAP',
  AGGREGATE = 'AGGREGATE',
  JOIN = 'JOIN',
  SORT = 'SORT',
  GROUP = 'GROUP',
  VALIDATE = 'VALIDATE',
  DEDUPLICATE = 'DEDUPLICATE',
  CUSTOM = 'CUSTOM'
}

/**
 * Transformation Rule
 */
export interface TransformationRule {
  id: number;
  name: string;
  description?: string;
  type: TransformationType;
  order: number;
  enabled: boolean;
  config: any;
}

/**
 * ETL Job Status
 */
export enum JobStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Job Schedule
 */
export interface JobSchedule {
  expression: string;
  nextRun?: Date;
  runCount?: number;
  lastRun?: Date;
  timezone?: string;
}

/**
 * Helper function to get schedule string representation
 */
export function getScheduleString(schedule: JobSchedule): string {
  return schedule.expression;
}

/**
 * ETL Job
 */
export interface ETLJob {
  id: string;
  name: string;
  description?: string;
  sources: number[];
  transformations: number[];
  destinations: number[];
  schedule?: JobSchedule;
  enabled: boolean;
  continueOnError: boolean;
}

/**
 * Data Quality Issue Severity
 */
export enum DataQualitySeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high'
}

/**
 * Data Quality Issue
 */
export interface DataQualityIssue {
  field: string;
  issue: string;
  severity: DataQualitySeverity;
  recommendation: string;
  affectedRecords?: number;
}

/**
 * Data Quality Analysis
 */
export interface DataQualityAnalysis {
  totalIssues: number;
  completeness: number;
  accuracy: number;
  consistency: number;
  issues: DataQualityIssue[];
  summary: string;
  aiRecommendations?: string[];
}