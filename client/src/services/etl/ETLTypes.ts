/**
 * ETLTypes.ts
 * 
 * Type definitions for ETL system
 */

// Data source types
export enum DataSourceType {
  DATABASE = 'DATABASE',
  API = 'API',
  FILE = 'FILE',
  IN_MEMORY = 'IN_MEMORY',
  CUSTOM = 'CUSTOM'
}

// Database types
export enum DatabaseType {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  SQLITE = 'SQLITE',
  MSSQL = 'MSSQL',
  ORACLE = 'ORACLE',
  MONGODB = 'MONGODB'
}

// API types
export enum ApiType {
  REST = 'REST',
  GRAPHQL = 'GRAPHQL',
  SOAP = 'SOAP',
  GRPC = 'GRPC'
}

// File types
export enum FileType {
  CSV = 'CSV',
  JSON = 'JSON',
  XML = 'XML',
  EXCEL = 'EXCEL',
  PARQUET = 'PARQUET',
  AVRO = 'AVRO'
}

// Authentication types
export enum AuthType {
  NONE = 'NONE',
  BASIC = 'BASIC',
  API_KEY = 'API_KEY',
  OAUTH = 'OAUTH',
  JWT = 'JWT',
  CERTIFICATE = 'CERTIFICATE'
}

// Data source configuration
export interface DataSource {
  id: number;
  name: string;
  type: DataSourceType;
  description?: string;
  
  // Connection details based on type
  connection: {
    // For database
    database?: {
      type: DatabaseType;
      host: string;
      port: number;
      database: string;
      schema?: string;
      username?: string;
      password?: string;
      ssl?: boolean;
      connectionString?: string;
    };
    
    // For API
    api?: {
      type: ApiType;
      url: string;
      method?: string;
      headers?: Record<string, string>;
      body?: string;
      authType?: AuthType;
      authDetails?: Record<string, string>;
      pagination?: {
        enabled: boolean;
        pageParam?: string;
        limitParam?: string;
        pageSize?: number;
      };
    };
    
    // For file
    file?: {
      type: FileType;
      path: string;
      delimiter?: string;
      hasHeader?: boolean;
      encoding?: string;
      sheet?: string | number;
    };
    
    // For in-memory
    inMemory?: {
      data: any[];
    };
    
    // For custom
    custom?: {
      config: Record<string, any>;
    };
  };
  
  // Query or extraction details
  extraction: {
    query?: string;
    filters?: Record<string, any>;
    fields?: string[];
    joins?: Array<{
      table: string;
      on: Record<string, string>;
      type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
    }>;
    limit?: number;
    offset?: number;
    orderBy?: string;
    orderDirection?: 'ASC' | 'DESC';
  };
  
  // Transformation rules to apply during extraction
  extractionTransforms?: TransformationRule[];
  
  createdAt?: Date;
  updatedAt?: Date;
  lastTestedAt?: Date;
  isActive: boolean;
}

// Transformation rule types
export enum TransformationType {
  // Column operations
  RENAME_COLUMN = 'RENAME_COLUMN',
  DROP_COLUMN = 'DROP_COLUMN',
  REORDER_COLUMNS = 'REORDER_COLUMNS',
  
  // Data type operations
  CAST_TYPE = 'CAST_TYPE',
  PARSE_DATE = 'PARSE_DATE',
  PARSE_NUMBER = 'PARSE_NUMBER',
  
  // Value operations
  REPLACE_VALUE = 'REPLACE_VALUE',
  FILL_NULL = 'FILL_NULL',
  MAP_VALUES = 'MAP_VALUES',
  
  // String operations
  TO_UPPERCASE = 'TO_UPPERCASE',
  TO_LOWERCASE = 'TO_LOWERCASE',
  TRIM = 'TRIM',
  SUBSTRING = 'SUBSTRING',
  CONCAT = 'CONCAT',
  SPLIT = 'SPLIT',
  
  // Numeric operations
  ROUND = 'ROUND',
  ADD = 'ADD',
  SUBTRACT = 'SUBTRACT',
  MULTIPLY = 'MULTIPLY',
  DIVIDE = 'DIVIDE',
  
  // Row operations
  FILTER = 'FILTER',
  SORT = 'SORT',
  GROUP_BY = 'GROUP_BY',
  AGGREGATE = 'AGGREGATE',
  JOIN = 'JOIN',
  UNION = 'UNION',
  
  // Data quality operations
  REMOVE_DUPLICATES = 'REMOVE_DUPLICATES',
  VALIDATE = 'VALIDATE',
  
  // Advanced operations
  CUSTOM_FUNCTION = 'CUSTOM_FUNCTION',
  JAVASCRIPT = 'JAVASCRIPT',
  SQL = 'SQL',
  FORMULA = 'FORMULA'
}

// Transformation rule
export interface TransformationRule {
  id: number;
  name: string;
  description?: string;
  type: TransformationType;
  
  // Target column(s) to apply transformation on
  columns?: string[];
  
  // Parameters specific to the transformation type
  parameters: Record<string, any>;
  
  // Priority/order of execution (lower = earlier)
  priority?: number;
  
  // Whether this rule is active
  isActive: boolean;
  
  // Condition for applying this rule
  condition?: {
    column?: string;
    operator: 'EQUALS' | 'NOT_EQUALS' | 'GREATER_THAN' | 'LESS_THAN' | 'CONTAINS' | 'NOT_CONTAINS' | 'MATCHES' | 'NOT_MATCHES';
    value: any;
  };
  
  // Tags for organization
  tags?: string[];
  
  createdAt?: Date;
  updatedAt?: Date;
}

// Validation rule types
export enum ValidationRuleType {
  NOT_NULL = 'NOT_NULL',
  UNIQUENESS = 'UNIQUENESS',
  MIN_VALUE = 'MIN_VALUE',
  MAX_VALUE = 'MAX_VALUE',
  REGEX = 'REGEX',
  ENUM = 'ENUM',
  DATE_FORMAT = 'DATE_FORMAT',
  CUSTOM = 'CUSTOM'
}

// Validation rule
export interface ValidationRule {
  field: string;
  type: ValidationRuleType;
  parameters: any;
  message?: string;
}

// Data quality severity levels
export enum DataQualitySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

// Data quality issue
export interface DataQualityIssue {
  field: string;
  issue: string;
  severity: DataQualitySeverity;
  recommendation: string;
}

// Data validation result
export interface DataValidationResult {
  isValid: boolean;
  hasFailedValidations: boolean;
  issues: DataQualityIssue[];
  completeness: number;
  accuracy: number;
  consistency: number;
}

// Job status
export enum JobStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  COMPLETED = 'COMPLETED',
  FAILED = 'FAILED',
  ABORTED = 'ABORTED',
  SCHEDULED = 'SCHEDULED'
}

// Job frequency
export enum JobFrequency {
  ONCE = 'ONCE',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

// Job schedule
export interface JobSchedule {
  frequency: JobFrequency;
  startTime?: Date;
  endTime?: Date;
  daysOfWeek?: number[]; // 0 = Sunday, 1 = Monday, etc.
  dayOfMonth?: number; // 1-31
  cronExpression?: string; // For custom schedules
}

// ETL Job
export interface ETLJob {
  id: number;
  name: string;
  description?: string;
  sourceId: number;
  destinationId: number;
  
  // References to actual sources (populated at runtime)
  source?: DataSource;
  destination?: DataSource;
  
  // Job configuration
  transformationRuleIds: number[];
  validationRuleIds?: number[];
  
  // For saving validation rules directly with the job
  validationRules?: ValidationRule[];
  
  // Job execution options
  continueOnValidationError?: boolean;
  maxRetries?: number;
  retryInterval?: number;
  timeout?: number;
  
  // Notification settings
  notifyOnSuccess?: boolean;
  notifyOnFailure?: boolean;
  notificationChannels?: string[];
  
  // Job scheduling
  schedule?: JobSchedule;
  
  // Job status
  status: JobStatus;
  lastRun?: Date;
  nextRun?: Date;
  lastRunDuration?: number;
  lastRunRecordsProcessed?: number;
  
  createdAt?: Date;
  updatedAt?: Date;
  createdBy?: number;
  updatedBy?: number;
}

// ETL Job result
export interface ETLJobResult {
  jobId: number;
  status: JobStatus;
  recordsProcessed: number;
  metrics: JobMetrics;
  validationResult: DataValidationResult;
  error: string | null;
  timestamp: Date;
}

// Job metrics
export interface JobMetrics {
  startTime: Date;
  endTime: Date;
  duration: number; // in milliseconds
  extractTime: number;
  transformTime: number;
  loadTime: number;
  recordsProcessed: number;
  recordsValid: number;
  recordsInvalid: number;
  throughput: number; // records per second
  cpuUsage?: number;
  memoryUsage?: number;
}

// Connection test result
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: {
    latency?: number;
    status?: number;
    error?: string;
    connectionInfo?: Record<string, any>;
  };
  timestamp: Date;
}

// ETL Optimization Suggestion
export interface ETLOptimizationSuggestion {
  id: number;
  jobId: number;
  type: 'PERFORMANCE' | 'QUALITY' | 'RELIABILITY';
  description: string;
  impact: 'LOW' | 'MEDIUM' | 'HIGH';
  recommendation: string;
  implementationHint?: string;
  implemented: boolean;
  implementedAt?: Date;
  createdAt: Date;
}

// ETL Alert
export interface ETLAlert {
  id: number;
  jobId: number;
  type: 'ERROR' | 'WARNING' | 'INFO';
  message: string;
  details?: string;
  timestamp: Date;
  acknowledged: boolean;
  acknowledgedBy?: number;
  acknowledgedAt?: Date;
}

// ETL Batch Job
export interface ETLBatchJob {
  id: number;
  name: string;
  description?: string;
  jobIds: number[];
  dependencyGraph?: Record<number, number[]>; // jobId -> dependencies
  parallelExecution: boolean;
  status: JobStatus;
  lastRun?: Date;
  nextRun?: Date;
  schedule?: JobSchedule;
  createdAt: Date;
  updatedAt?: Date;
}

// Legacy interface type
export enum LegacyInterfaceType {
  SQL = 'SQL',
  SOAP = 'SOAP',
  XML_RPC = 'XML_RPC',
  FIXED_WIDTH_FILE = 'FIXED_WIDTH_FILE',
  MAINFRAME = 'MAINFRAME',
  CUSTOM = 'CUSTOM'
}

// Legacy system adapter
export interface LegacyAdapter {
  id: number;
  name: string;
  interfaceType: LegacyInterfaceType;
  configuration: Record<string, any>;
  mappings: Record<string, string>;
  enabled: boolean;
  lastSyncTime?: Date;
}

// Data quality analysis result
export interface DataQualityAnalysis {
  totalIssues: number;
  completeness: number; // 0-100%
  accuracy: number; // 0-100%
  consistency: number; // 0-100%
  issues: DataQualityIssue[];
  summary: string;
  aiRecommendations?: string[];
}