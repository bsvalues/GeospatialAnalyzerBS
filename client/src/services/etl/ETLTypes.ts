/**
 * Job status enum
 */
export enum JobStatus {
  IDLE = 'IDLE',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED'
}

/**
 * Data source type enum
 */
export enum DataSourceType {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  REST_API = 'REST_API',
  GRAPHQL_API = 'GRAPHQL_API',
  FILE_CSV = 'FILE_CSV',
  FILE_JSON = 'FILE_JSON',
  FILE_XML = 'FILE_XML',
  FILE_EXCEL = 'FILE_EXCEL',
  MEMORY = 'MEMORY'
}

/**
 * Filter operator enum
 */
export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  LESS_THAN = 'LESS_THAN',
  GREATER_THAN_OR_EQUALS = 'GREATER_THAN_OR_EQUALS',
  LESS_THAN_OR_EQUALS = 'LESS_THAN_OR_EQUALS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
  REGEX = 'REGEX',
  BETWEEN = 'BETWEEN',
  NOT_BETWEEN = 'NOT_BETWEEN'
}

/**
 * Filter logic enum
 */
export enum FilterLogic {
  AND = 'AND',
  OR = 'OR'
}

/**
 * Transformation type enum
 */
export enum TransformationType {
  FILTER = 'FILTER',
  MAP = 'MAP',
  JOIN = 'JOIN',
  AGGREGATE = 'AGGREGATE',
  VALIDATE = 'VALIDATE',
  ENRICH = 'ENRICH',
  CUSTOM = 'CUSTOM'
}

/**
 * Validation type
 */
export type ValidationType = 
  'REQUIRED' | 
  'EMAIL' | 
  'URL' | 
  'NUMBER' | 
  'INTEGER' | 
  'FLOAT' | 
  'DATE' | 
  'REGEX' | 
  'CUSTOM';

/**
 * Aggregation function
 */
export type AggregationFunction = 
  'COUNT' | 
  'SUM' | 
  'AVG' | 
  'MIN' | 
  'MAX' | 
  'FIRST' | 
  'LAST' | 
  'ARRAY_AGG';

/**
 * Enrichment type
 */
export type EnrichmentType = 
  'LOOKUP' | 
  'GEOCODE' | 
  'TRANSLATE' | 
  'CUSTOM';

/**
 * Record counts interface
 */
export interface RecordCounts {
  /** Number of records extracted */
  extracted: number;
  
  /** Number of records transformed */
  transformed: number;
  
  /** Number of records loaded */
  loaded: number;
  
  /** Number of records rejected */
  rejected: number;
}

/**
 * ETL job interface
 */
export interface ETLJob {
  /** Job ID */
  id: number;
  
  /** Job name */
  name: string;
  
  /** Data source IDs */
  sources: number[];
  
  /** Data destination IDs */
  destinations: number[];
  
  /** Transformation rule IDs in order of execution */
  transformations: number[];
  
  /** Job status */
  status: JobStatus;
  
  /** Whether the job is enabled */
  enabled: boolean;
  
  /** Job description */
  description?: string;
}

/**
 * Data source config interface
 */
export interface DataSourceConfig {
  /** Host for database connections */
  host?: string;
  
  /** Port for database connections */
  port?: number;
  
  /** Database name for database connections */
  database?: string;
  
  /** Username for database connections */
  user?: string;
  
  /** Password for database connections */
  password?: string;
  
  /** URL for API connections */
  url?: string;
  
  /** HTTP method for API connections */
  method?: string;
  
  /** HTTP headers for API connections */
  headers?: Record<string, string>;
  
  /** File path for file connections */
  filePath?: string;
  
  /** Delimiter for CSV files */
  delimiter?: string;
  
  /** Whether the CSV file has a header */
  hasHeader?: boolean;
  
  /** In-memory data for testing */
  data?: any[];
  
  /** Additional options */
  options?: Record<string, any>;
}

/**
 * Data source interface
 */
export interface DataSource {
  /** Data source ID */
  id: number;
  
  /** Data source name */
  name: string;
  
  /** Data source type */
  type: DataSourceType;
  
  /** Data source config */
  config: DataSourceConfig;
  
  /** Whether the data source is enabled */
  enabled: boolean;
  
  /** Data source description */
  description?: string;
  
  /** Data source tags */
  tags?: string[];
}

/**
 * Filter condition interface
 */
export interface FilterCondition {
  /** Field name */
  field: string;
  
  /** Filter operator */
  operator: FilterOperator;
  
  /** Filter value */
  value: any;
  
  /** Second value for BETWEEN operator */
  valueEnd?: any;
}

/**
 * Filter config interface
 */
export interface FilterConfig {
  /** Filter conditions */
  conditions: FilterCondition[];
  
  /** Filter logic */
  logic: FilterLogic;
}

/**
 * Field mapping interface
 */
export interface FieldMapping {
  /** Source field */
  source: string;
  
  /** Target field */
  target: string;
}

/**
 * Map config interface
 */
export interface MapConfig {
  /** Field mappings */
  mappings: FieldMapping[];
  
  /** Whether to include original fields */
  includeOriginal: boolean;
}

/**
 * Join config interface
 */
export interface JoinConfig {
  /** Right dataset */
  rightDataset: string;
  
  /** Join type */
  joinType: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  
  /** Left join field */
  leftField: string;
  
  /** Right join field */
  rightField: string;
}

/**
 * Aggregation interface
 */
export interface Aggregation {
  /** Field to aggregate */
  field: string;
  
  /** Aggregation function */
  function: AggregationFunction;
  
  /** Output field */
  as: string;
}

/**
 * Aggregate config interface
 */
export interface AggregateConfig {
  /** Fields to group by */
  groupBy: string[];
  
  /** Aggregations to apply */
  aggregations: Aggregation[];
}

/**
 * Validation interface
 */
export interface Validation {
  /** Field to validate */
  field: string;
  
  /** Validation type */
  type: ValidationType;
  
  /** Validation params (for REGEX, etc.) */
  params?: any;
  
  /** Validation message */
  message: string;
}

/**
 * Validation config interface
 */
export interface ValidationConfig {
  /** Validations to apply */
  validations: Validation[];
  
  /** Whether to fail on error */
  failOnError: boolean;
}

/**
 * Enrichment field interface
 */
export interface EnrichmentField {
  /** Source field */
  source: string;
  
  /** Target field */
  target: string;
}

/**
 * Enrichment config interface
 */
export interface EnrichmentConfig {
  /** Enrichment type */
  type: EnrichmentType;
  
  /** Fields to enrich */
  fields: EnrichmentField[];
  
  /** Additional params */
  params?: Record<string, any>;
}

/**
 * Custom config interface
 */
export interface CustomConfig {
  /** Function name */
  function: string;
  
  /** Function parameters */
  params?: Record<string, any>;
}

/**
 * Transformation rule interface
 */
export interface TransformationRule {
  /** Rule ID */
  id: number;
  
  /** Rule name */
  name: string;
  
  /** Transformation type */
  type: TransformationType;
  
  /** Transformation config */
  config: FilterConfig | MapConfig | JoinConfig | AggregateConfig | ValidationConfig | EnrichmentConfig | CustomConfig;
  
  /** Execution order */
  order: number;
  
  /** Whether the rule is enabled */
  enabled: boolean;
  
  /** Rule description */
  description?: string;
}

/**
 * System status interface
 */
export interface SystemStatus {
  /** Number of jobs */
  jobCount: number;
  
  /** Number of enabled jobs */
  enabledJobCount: number;
  
  /** Number of running jobs */
  runningJobCount: number;
  
  /** Number of data sources */
  dataSourceCount: number;
  
  /** Number of enabled data sources */
  enabledDataSourceCount: number;
  
  /** Number of transformation rules */
  transformationRuleCount: number;
  
  /** Number of enabled transformation rules */
  enabledTransformationRuleCount: number;
  
  /** Scheduler status */
  schedulerStatus: Record<JobStatus, number>;
  
  /** Number of recent job runs */
  recentJobRuns: number;
  
  /** Number of failed job runs */
  failedJobRuns: number;
  
  /** Number of successful job runs */
  successJobRuns: number;
  
  /** Record counts */
  recordCounts: RecordCounts;
}