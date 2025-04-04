/**
 * ETL system types
 * 
 * This file contains the type definitions for the ETL system.
 */

/**
 * Data source type enum
 */
export enum DataSourceType {
  /** PostgreSQL database */
  POSTGRESQL = 'POSTGRESQL',
  
  /** MySQL database */
  MYSQL = 'MYSQL',
  
  /** MongoDB database */
  MONGODB = 'MONGODB',
  
  /** REST API */
  REST_API = 'REST_API',
  
  /** Local or remote file */
  FILE = 'FILE',
  
  /** In-memory data */
  MEMORY = 'MEMORY',
  
  /** Custom data source */
  CUSTOM = 'CUSTOM'
}

/**
 * Connection mode enum
 */
export enum ConnectionMode {
  /** Direct connection */
  DIRECT = 'DIRECT',
  
  /** Connection via proxy */
  PROXY = 'PROXY',
  
  /** Connection via SSH tunnel */
  SSH_TUNNEL = 'SSH_TUNNEL',
  
  /** Connection via VPN */
  VPN = 'VPN'
}

/**
 * Connection type enum
 */
export enum ConnectionType {
  /** Persistent connection */
  PERSISTENT = 'PERSISTENT',
  
  /** On-demand connection */
  ON_DEMAND = 'ON_DEMAND',
  
  /** Pool of connections */
  POOL = 'POOL'
}

/**
 * Authentication type enum
 */
export enum AuthenticationType {
  /** Username and password */
  BASIC = 'BASIC',
  
  /** API key */
  API_KEY = 'API_KEY',
  
  /** OAuth 2.0 */
  OAUTH2 = 'OAUTH2',
  
  /** JWT token */
  JWT = 'JWT',
  
  /** Certificate */
  CERTIFICATE = 'CERTIFICATE',
  
  /** No authentication */
  NONE = 'NONE'
}

/**
 * Load mode enum
 */
export enum LoadMode {
  /** Insert new records */
  INSERT = 'INSERT',
  
  /** Update existing records */
  UPDATE = 'UPDATE',
  
  /** Insert or update records (upsert) */
  UPSERT = 'UPSERT',
  
  /** Delete records */
  DELETE = 'DELETE',
  
  /** Truncate target and then insert */
  TRUNCATE = 'TRUNCATE',
  
  /** Truncate target and then insert in a single transaction */
  TRUNCATE_INSERT = 'TRUNCATE_INSERT'
}

/**
 * Job status enum
 */
export enum JobStatus {
  /** Job created but not yet scheduled */
  CREATED = 'CREATED',
  
  /** Job is scheduled to run */
  SCHEDULED = 'SCHEDULED',
  
  /** Job is queued for execution */
  QUEUED = 'QUEUED',
  
  /** Job is currently running */
  RUNNING = 'RUNNING',
  
  /** Job completed successfully */
  SUCCEEDED = 'SUCCEEDED',
  
  /** Job failed */
  FAILED = 'FAILED',
  
  /** Job was cancelled */
  CANCELLED = 'CANCELLED',
  
  /** Job was skipped (due to dependencies, etc.) */
  SKIPPED = 'SKIPPED'
}

/**
 * Job frequency enum
 */
export enum JobFrequency {
  /** Run once */
  ONCE = 'ONCE',
  
  /** Run every minute */
  MINUTELY = 'MINUTELY',
  
  /** Run every hour */
  HOURLY = 'HOURLY',
  
  /** Run every day */
  DAILY = 'DAILY',
  
  /** Run every week */
  WEEKLY = 'WEEKLY',
  
  /** Run every month */
  MONTHLY = 'MONTHLY',
  
  /** Custom schedule (cron expression) */
  CUSTOM = 'CUSTOM'
}

/**
 * Transformation type enum
 */
export enum TransformationType {
  /** Filter records */
  FILTER = 'FILTER',
  
  /** Map fields */
  MAP = 'MAP',
  
  /** Sort records */
  SORT = 'SORT',
  
  /** Aggregate records */
  AGGREGATE = 'AGGREGATE',
  
  /** Join data from multiple sources */
  JOIN = 'JOIN',
  
  /** Deduplicate records */
  DEDUPLICATE = 'DEDUPLICATE',
  
  /** Validate data */
  VALIDATE = 'VALIDATE',
  
  /** Enrich data */
  ENRICH = 'ENRICH',
  
  /** Apply custom transformation */
  CUSTOM = 'CUSTOM'
}

/**
 * Filter operator enum
 */
export enum FilterOperator {
  /** Equal to */
  EQUALS = 'EQUALS',
  
  /** Not equal to */
  NOT_EQUALS = 'NOT_EQUALS',
  
  /** Greater than */
  GREATER_THAN = 'GREATER_THAN',
  
  /** Greater than or equal to */
  GREATER_THAN_OR_EQUALS = 'GREATER_THAN_OR_EQUALS',
  
  /** Less than */
  LESS_THAN = 'LESS_THAN',
  
  /** Less than or equal to */
  LESS_THAN_OR_EQUALS = 'LESS_THAN_OR_EQUALS',
  
  /** In list of values */
  IN = 'IN',
  
  /** Not in list of values */
  NOT_IN = 'NOT_IN',
  
  /** Contains substring */
  CONTAINS = 'CONTAINS',
  
  /** Does not contain substring */
  NOT_CONTAINS = 'NOT_CONTAINS',
  
  /** Starts with substring */
  STARTS_WITH = 'STARTS_WITH',
  
  /** Ends with substring */
  ENDS_WITH = 'ENDS_WITH',
  
  /** Is null */
  IS_NULL = 'IS_NULL',
  
  /** Is not null */
  IS_NOT_NULL = 'IS_NOT_NULL',
  
  /** Between two values */
  BETWEEN = 'BETWEEN',
  
  /** Not between two values */
  NOT_BETWEEN = 'NOT_BETWEEN',
  
  /** Matches regular expression */
  REGEX = 'REGEX'
}

/**
 * Filter logic type (how to combine multiple conditions)
 */
export type FilterLogic = 'AND' | 'OR';

/**
 * Data source configuration
 */
export interface DataSourceConfig {
  /** Connection host */
  host?: string;
  
  /** Connection port */
  port?: number;
  
  /** Database name */
  database?: string;
  
  /** Username */
  user?: string;
  
  /** Password (should be securely stored in real implementation) */
  password?: string;
  
  /** API URL */
  url?: string;
  
  /** API method */
  method?: string;
  
  /** API headers */
  headers?: Record<string, string>;
  
  /** File path */
  path?: string;
  
  /** File format */
  format?: string;
  
  /** In-memory data */
  data?: any[];
  
  /** Connection mode */
  connectionMode?: ConnectionMode;
  
  /** Connection type */
  connectionType?: ConnectionType;
  
  /** Authentication type */
  authenticationType?: AuthenticationType;
  
  /** Authentication config */
  authConfig?: Record<string, any>;
  
  /** Connection pool settings */
  poolConfig?: {
    /** Minimum number of connections */
    min?: number;
    
    /** Maximum number of connections */
    max?: number;
    
    /** Connection idle timeout (ms) */
    idleTimeout?: number;
  };
  
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
  
  /** Data source description */
  description?: string;
  
  /** Data source type */
  type: DataSourceType;
  
  /** Whether the data source is enabled */
  enabled: boolean;
  
  /** Data source configuration */
  config: DataSourceConfig;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * Filter condition interface
 */
export interface FilterCondition {
  /** Field to filter on */
  field: string;
  
  /** Filter operator */
  operator: FilterOperator;
  
  /** Filter value */
  value: any;
  
  /** Second value for operators like BETWEEN */
  valueEnd?: any;
}

/**
 * Filter configuration interface
 */
export interface FilterConfig {
  /** Filter conditions */
  conditions: FilterCondition[];
  
  /** Logic to combine conditions */
  logic: FilterLogic;
}

/**
 * Field mapping interface
 */
export interface FieldMapping {
  /** Source field name */
  source: string;
  
  /** Target field name */
  target: string;
  
  /** Optional transformation function (as string, carefully evaluated) */
  transform?: string;
}

/**
 * Map configuration interface
 */
export interface MapConfig {
  /** Field mappings */
  mappings: FieldMapping[];
  
  /** Whether to include original fields */
  includeOriginal: boolean;
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
  /** Field to validate */
  field: string;
  
  /** Validation rule type */
  type: string;
  
  /** Rule config */
  config: any;
  
  /** Error message */
  message: string;
  
  /** Whether to fail record if validation fails */
  failOnError: boolean;
}

/**
 * Transformation rule interface
 */
export interface TransformationRule {
  /** Rule ID */
  id: number;
  
  /** Rule name */
  name: string;
  
  /** Rule description */
  description?: string;
  
  /** Transformation type */
  type: TransformationType;
  
  /** Rule configuration */
  config: any;
  
  /** Whether the rule is enabled */
  enabled: boolean;
  
  /** Rule order (for applying multiple rules) */
  order: number;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
}

/**
 * ETL job interface
 */
export interface ETLJob {
  /** Job ID */
  id: number;
  
  /** Job name */
  name: string;
  
  /** Job description */
  description?: string;
  
  /** Source data source IDs */
  sources: number[];
  
  /** Destination data source IDs */
  destinations: number[];
  
  /** Transformation rule IDs */
  transformations: number[];
  
  /** Job status */
  status: JobStatus;
  
  /** Whether the job is enabled */
  enabled: boolean;
  
  /** Job frequency */
  frequency: JobFrequency;
  
  /** Job schedule (cron expression for custom frequency) */
  schedule?: string;
  
  /** Last run timestamp */
  lastRunAt?: Date;
  
  /** Next run timestamp */
  nextRunAt?: Date;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Last update timestamp */
  updatedAt: Date;
  
  /** Job dependencies (IDs of jobs that must complete first) */
  dependencies?: number[];
  
  /** Retry configuration */
  retryConfig?: {
    /** Maximum number of retries */
    maxRetries: number;
    
    /** Retry delay (ms) */
    retryDelay: number;
    
    /** Whether to use exponential backoff */
    useExponentialBackoff: boolean;
  };
  
  /** Notification settings */
  notificationSettings?: {
    /** Whether to notify on success */
    onSuccess: boolean;
    
    /** Whether to notify on failure */
    onFailure: boolean;
    
    /** Notification recipients */
    recipients: string[];
  };
}

/**
 * Record counts for job runs
 */
export interface RecordCounts {
  /** Number of records extracted */
  extracted: number;
  
  /** Number of records transformed */
  transformed: number;
  
  /** Number of records loaded */
  loaded: number;
  
  /** Number of records that failed */
  failed: number;
}

/**
 * Job run interface
 */
export interface JobRun {
  /** Run ID */
  id: string;
  
  /** Job ID */
  jobId: number;
  
  /** Run status */
  status: JobStatus;
  
  /** Start timestamp */
  startTime: Date;
  
  /** End timestamp */
  endTime?: Date;
  
  /** Execution time (ms) */
  executionTime: number;
  
  /** Record counts */
  recordCounts: RecordCounts;
  
  /** Error message */
  error?: string;
  
  /** Whether this was a manual run */
  isManual: boolean;
}

/**
 * System status interface
 */
export interface SystemStatus {
  /** Whether the system is initialized */
  initialized: boolean;
  
  /** Whether the system is running */
  running: boolean;
  
  /** Last error message */
  lastError?: string;
  
  /** Number of active jobs */
  activeJobs: number;
  
  /** Number of pending jobs */
  pendingJobs: number;
  
  /** Memory usage (MB) */
  memoryUsage: number;
  
  /** System uptime (ms) */
  uptime: number;
  
  /** Current time */
  currentTime: Date;
}

/**
 * Optimization suggestion interface
 */
export interface OptimizationSuggestion {
  /** Suggestion ID */
  id: number;
  
  /** Job ID */
  jobId: number;
  
  /** Suggestion title */
  title: string;
  
  /** Suggestion description */
  description: string;
  
  /** Impact level (1-10) */
  impact: number;
  
  /** Effort level (1-10) */
  effort: number;
  
  /** Whether the suggestion has been implemented */
  implemented: boolean;
  
  /** Creation timestamp */
  createdAt: Date;
  
  /** Implementation timestamp */
  implementedAt?: Date;
  
  /** Suggested code changes */
  codeChanges?: string;
}

/**
 * Data quality issue severity enum
 */
export enum DataQualityIssueSeverity {
  /** Low severity */
  LOW = 'LOW',
  
  /** Medium severity */
  MEDIUM = 'MEDIUM',
  
  /** High severity */
  HIGH = 'HIGH',
  
  /** Critical severity */
  CRITICAL = 'CRITICAL'
}

/**
 * Data quality issue interface
 */
export interface DataQualityIssue {
  /** Issue ID */
  id: string;
  
  /** Issue description */
  description: string;
  
  /** Field name (if applicable) */
  field?: string;
  
  /** Issue severity */
  severity: DataQualityIssueSeverity;
  
  /** Recommendation to fix the issue */
  recommendation: string;
  
  /** Number of records affected */
  affectedRecords: number;
  
  /** Percentage of records affected */
  affectedPercentage: number;
}