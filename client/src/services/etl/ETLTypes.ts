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
  MANUAL = 'manual',
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
  FILE_CSV = 'file_csv',
  FILE_JSON = 'file_json',
  FILE_XML = 'file_xml',
  FILE_EXCEL = 'file_excel',
  FTP = 'ftp',
  MEMORY = 'memory',
  SQL_SERVER = 'sqlServer',
  ODBC = 'odbc',
  GEOSPATIAL = 'geospatial',
  SHAPEFILE = 'shapefile',
  POSTGIS = 'postgis'
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

export interface FilterConfig {
  conditions: {
    field: string;
    operator: FilterOperator;
    value: any;
  }[];
  logic: FilterLogic;
}

export interface MapConfig {
  mappings: {
    source: string;
    target: string;
  }[];
  includeOriginal: boolean;
}

export interface JoinConfig {
  rightDataset: string;
  joinType: 'inner' | 'left' | 'right' | 'full';
  conditions: {
    leftField: string;
    rightField: string;
  }[];
  includeFields: {
    dataset: 'left' | 'right';
    field: string;
    as?: string;
  }[];
}

export interface AggregateConfig {
  groupBy: string[];
  aggregations: {
    function: 'COUNT' | 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'FIRST' | 'LAST' | 'ARRAY_AGG';
    field: string;
    as: string;
  }[];
}

export interface ValidationConfig {
  validations: {
    field: string;
    type: 'REQUIRED' | 'EMAIL' | 'URL' | 'NUMBER' | 'INTEGER' | 'FLOAT' | 'DATE' | 'REGEX' | 'CUSTOM';
    params?: string;
    message: string;
  }[];
  failOnError: boolean;
}

export interface EnrichmentConfig {
  type: 'LOOKUP' | 'GEOCODE' | 'SENTIMENT' | 'CLASSIFY' | 'TRANSLATE' | 'CUSTOM';
  fields: {
    source: string;
    target: string;
  }[];
  options?: Record<string, any>;
}

export interface CustomConfig {
  code: string;
  language: 'javascript' | 'python' | 'sql';
  parameters?: Record<string, any>;
  function?: string;
}

export interface TransformationRule {
  id: string;
  name: string;
  description?: string;
  type: TransformationType;
  config: Record<string, any>;
  enabled: boolean;
}

export interface Transformation {
  id: string;
  name: string;
  description?: string;
  code: string;
  type?: TransformationType;
  config?: Record<string, any>;
  order?: number;
  inputSchema?: Record<string, any>;
  outputSchema?: Record<string, any>;
  enabled: boolean;
  tags?: string[];
}

export interface ETLJob {
  id: string;
  name: string;
  description?: string;
  // Support both single source and multiple sources
  source?: DataSource | string;
  sources?: Array<string>;
  transformations: Array<Transformation | string>;
  // Support both single destination and multiple destinations
  destination?: DataSource | string;
  destinations?: Array<string>;
  schedule?: {
    frequency: JobFrequency;
    startDate?: Date;
    endDate?: Date;
    cronExpression?: string;
    startTime?: string; // Time in HH:MM format
    daysOfWeek?: number[]; // 0-6 for Sunday-Saturday
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
  SYSTEM = 'system',
  JOB = 'job',
  DATA_SOURCE = 'data_source',
  TRANSFORMATION = 'transformation'
}

export enum FilterOperator {
  EQUALS = 'equals',
  NOT_EQUALS = 'not_equals',
  GREATER_THAN = 'greater_than',
  LESS_THAN = 'less_than',
  GREATER_THAN_OR_EQUALS = 'greater_than_or_equals',
  LESS_THAN_OR_EQUALS = 'less_than_or_equals',
  IN = 'in',
  NOT_IN = 'not_in',
  CONTAINS = 'contains',
  NOT_CONTAINS = 'not_contains',
  STARTS_WITH = 'starts_with',
  ENDS_WITH = 'ends_with',
  IS_NULL = 'is_null',
  IS_NOT_NULL = 'is_not_null',
  REGEX = 'regex'
}

export enum FilterLogic {
  AND = 'and',
  OR = 'or'
}

export enum TransformationType {
  // Column operations
  RENAME_COLUMN = 'rename_column',
  DROP_COLUMN = 'drop_column',
  REORDER_COLUMNS = 'reorder_columns',
  
  // Type conversions
  CAST_TYPE = 'cast_type',
  PARSE_DATE = 'parse_date',
  PARSE_NUMBER = 'parse_number',
  
  // Value operations
  REPLACE_VALUE = 'replace_value',
  FILL_NULL = 'fill_null',
  MAP_VALUES = 'map_values',
  
  // String operations
  TO_UPPERCASE = 'to_uppercase',
  TO_LOWERCASE = 'to_lowercase',
  TRIM = 'trim',
  SUBSTRING = 'substring',
  CONCAT = 'concat',
  SPLIT = 'split',
  
  // Numeric operations
  ROUND = 'round',
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  
  // Data transformation
  FILTER = 'filter',
  SORT = 'sort',
  GROUP_BY = 'group_by',
  AGGREGATE = 'aggregate',
  JOIN = 'join',
  UNION = 'union',
  MAP = 'map',
  
  // Data quality
  REMOVE_DUPLICATES = 'remove_duplicates',
  VALIDATE = 'validate',
  VALIDATION = 'validation',    // Alias for VALIDATE for better readability
  
  // Data enrichment
  ENRICH = 'enrich',
  ENRICHMENT = 'enrichment',    // Alias for ENRICH for better readability
  
  // Advanced
  CUSTOM = 'custom',
  CUSTOM_FUNCTION = 'custom_function',
  JAVASCRIPT = 'javascript',
  SQL = 'sql',
  FORMULA = 'formula',
  
  // Special categories for wizard-based flows
  CLEAN = 'clean',
  STANDARDIZE = 'standardize',
  NORMALIZE = 'normalize',
  GEOCODE = 'geocode',
  COORDINATE_TRANSFORM = 'coordinate_transform',
  PROPERTY_SPECIFIC = 'property_specific',
  TEXT_EXTRACTION = 'text_extraction',
  CLASSIFICATION = 'classification',
  OUTLIER_DETECTION = 'outlier_detection',
  ANOMALY_DETECTION = 'anomaly_detection',
  MISSING_VALUE_PREDICTION = 'missing_value_prediction'
}