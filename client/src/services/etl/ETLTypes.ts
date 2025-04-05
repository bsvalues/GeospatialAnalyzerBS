/**
 * ETLTypes.ts
 * 
 * Common types and interfaces for ETL pipeline components
 */

// Job status enum
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  ABORTED = 'aborted',
  SCHEDULED = 'scheduled',
  IDLE = 'idle',
  SUCCEEDED = 'succeeded'
}

// Filter Logic Types
export enum FilterLogic {
  AND = 'and',
  OR = 'or'
}

// Filter Operator Types
export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IN = 'in',
  NOT_IN = 'not_in',
  BETWEEN = 'between',
  NULL = 'null',
  NOT_NULL = 'not_null'
}

// ETL Job interface
export interface ETLJob {
  id: number;
  name: string;
  description?: string;
  sourceId: string;
  targetId: string;
  transformationIds: string[];
  status: JobStatus;
  lastRun?: Date;
  createdAt: Date;
  updatedAt: Date;
  scheduleId?: string;
  enabled?: boolean;
  sources?: DataSource[];
  destinations?: DataSource[];
  transformations?: TransformationRule[];
}

// Data Source interface
export interface DataSource {
  id: string;
  name: string;
  type: DataSourceType;
  config: Record<string, any>;
}

// Transformation Rule interface
export interface TransformationRule {
  id: string;
  name: string;
  type: TransformationType;
  config: Record<string, any>;
}

// Record Counts interface
export interface RecordCounts {
  extracted: number;
  processed: number;
  loaded: number;
  failed: number;
}

// System Status enum
export enum SystemStatus {
  HEALTHY = 'healthy',
  DEGRADED = 'degraded',
  DOWN = 'down',
  MAINTENANCE = 'maintenance'
}

// ETL Job Result interface
export interface ETLJobResult {
  jobId: number;
  status: JobStatus; 
  startTime: Date;
  endTime: Date;
  extractedRecords: number;
  processedRecords: number;
  failedRecords: number;
  errorMessages: string[];
  warnings: string[];
}

// Job Metrics interface
export interface JobMetrics {
  startTime: Date;
  endTime: Date;
  duration: number;
  extractTime: number;
  transformTime: number; 
  loadTime: number;
  recordsProcessed: number;
  recordsValid: number;
  recordsInvalid: number;
  throughput: number;
  cpuUsage?: number;
  memoryUsage?: number;
}

// Data Source Type enum
export enum DataSourceType {
  DATABASE = 'database',
  FILE = 'file',
  API = 'api',
  FTP = 'ftp',
  MEMORY = 'memory',
  SQLSERVER = 'sqlserver',
  ODBC = 'odbc',
  POSTGRESQL = 'postgresql',
  MYSQL = 'mysql',
  REST_API = 'rest_api',
  GRAPHQL_API = 'graphql_api',
  FILE_CSV = 'file_csv',
  FILE_JSON = 'file_json',
  FILE_XML = 'file_xml',
  FILE_EXCEL = 'file_excel'
}

// Transformation Type enum
export enum TransformationType {
  MAPPING = 'mapping',
  FILTER = 'filter',
  AGGREGATION = 'aggregation',
  ENRICHMENT = 'enrichment',
  VALIDATION = 'validation',
  CUSTOM = 'custom',
  MAP = 'map',
  JOIN = 'join',
  AGGREGATE = 'aggregate',
  VALIDATE = 'validate',
  ENRICH = 'enrich'
}

// Data Connection interface
export interface DataConnection {
  id: string;
  name: string;
  type: DataSourceType;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// Transformation interface
export interface Transformation {
  id: string;
  name: string;
  description?: string;
  type: TransformationType;
  config: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ETL Pipeline interface
export interface ETLPipeline {
  id: string;
  name: string;
  description?: string;
  sourceConnection: DataConnection;
  targetConnection: DataConnection;
  transformations: Transformation[];
  createdAt: Date;
  updatedAt: Date;
  lastRun?: Date;
  status: JobStatus;
}

// Database specific connection types
export interface SQLServerConnectionConfig {
  server: string;
  database: string;
  username: string;
  password: string;
  port: number;
  encrypt: boolean;
  trustServerCertificate: boolean;
}

export interface ODBCConnectionConfig {
  connectionString: string;
  username?: string;
  password?: string;
}

// FTP connection config
export interface FTPConnectionConfig {
  host: string;
  port: number;
  username: string;
  password: string;
  secure: boolean;
  timeout: number;
}