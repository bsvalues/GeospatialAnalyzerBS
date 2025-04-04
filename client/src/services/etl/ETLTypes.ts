import { ScheduleFrequency } from './Scheduler';

/**
 * Job status enum
 */
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
}

/**
 * Database type enum
 */
export enum DatabaseType {
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
  MONGODB = 'mongodb',
  SQLITE = 'sqlite',
  MSSQL = 'mssql',
  ORACLE = 'oracle'
}

/**
 * API type enum
 */
export enum ApiType {
  REST = 'rest',
  GRAPHQL = 'graphql',
  SOAP = 'soap',
  WEBHOOK = 'webhook'
}

/**
 * Authentication type enum
 */
export enum AuthType {
  NONE = 'none',
  API_KEY = 'api_key',
  BASIC_AUTH = 'basic_auth',
  BEARER_TOKEN = 'bearer_token',
  OAUTH1 = 'oauth1',
  OAUTH2 = 'oauth2'
}

/**
 * File format enum
 */
export enum FileFormat {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  PARQUET = 'parquet',
  AVRO = 'avro',
  EXCEL = 'excel',
  TEXT = 'text'
}

/**
 * ETL Schedule options
 */
export interface ETLScheduleOptions {
  datetime?: Date; // For ONCE
  minute?: number; // For HOURLY, DAILY, WEEKLY, MONTHLY
  hour?: number; // For DAILY, WEEKLY, MONTHLY
  dayOfWeek?: number; // For WEEKLY (0 = Sunday, 1 = Monday, ..., 6 = Saturday)
  dayOfMonth?: number; // For MONTHLY (1-31)
  expression?: string; // For custom cron expressions (not implemented in this version)
}

/**
 * ETL Schedule interface
 */
export interface ETLSchedule {
  frequency: ScheduleFrequency;
  options?: ETLScheduleOptions;
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  dbType: DatabaseType;
  host: string;
  port: number;
  database: string;
  table?: string;
  username: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  query?: string;
  connectionOptions?: Record<string, any>;
}

/**
 * API configuration interface
 */
export interface ApiConfig {
  apiType: ApiType;
  baseUrl: string;
  endpoint?: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  requestBody?: Record<string, any>;
  authType: AuthType;
  authConfig?: Record<string, string>;
  rateLimitRequests?: number;
  rateLimitPeriod?: number;
  timeout?: number;
}

/**
 * File configuration interface
 */
export interface FileConfig {
  path: string;
  format: FileFormat;
  delimiter?: string; // For CSV
  encoding?: string;
  header?: boolean; // For CSV
  compression?: 'none' | 'gzip' | 'zip';
  sheet?: string; // For Excel
  skipRows?: number;
  limitRows?: number;
}

/**
 * Memory configuration interface
 */
export interface MemoryConfig {
  key?: string;
  expiration?: number;
}

/**
 * Config union type
 */
export type DataSourceConfig = DatabaseConfig | ApiConfig | FileConfig | MemoryConfig;

/**
 * Data source interface
 */
export interface DataSource {
  id: number;
  name: string;
  description?: string;
  type: 'database' | 'api' | 'file' | 'memory';
  config: DataSourceConfig;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data destination interface (same as DataSource for now)
 */
export interface DataDestination extends DataSource {}

/**
 * Transformation type enum
 */
export enum TransformationType {
  // Basic transformations
  MAP = 'map',
  FILTER = 'filter',
  RENAME_COLUMN = 'rename_column',
  DROP_COLUMN = 'drop_column',
  CAST_TYPE = 'cast_type',
  
  // Mathematical operations
  ADD = 'add',
  SUBTRACT = 'subtract',
  MULTIPLY = 'multiply',
  DIVIDE = 'divide',
  ROUND = 'round',
  
  // String operations
  CONCAT = 'concat',
  REPLACE_VALUE = 'replace_value',
  FILL_NULL = 'fill_null',
  TO_UPPERCASE = 'to_uppercase',
  TO_LOWERCASE = 'to_lowercase',
  TRIM = 'trim',
  SUBSTRING = 'substring',
  
  // Date operations
  DATE_FORMAT = 'date_format',
  DATE_EXTRACT = 'date_extract',
  DATE_DIFF = 'date_diff',
  
  // Aggregation operations
  GROUP = 'group',
  GROUP_BY = 'group_by',
  AGGREGATE = 'aggregate',
  COUNT = 'count',
  SUM = 'sum',
  AVERAGE = 'average',
  MIN = 'min',
  MAX = 'max',
  
  // Advanced operations
  JOIN = 'join',
  SORT = 'sort',
  DISTINCT = 'distinct',
  WINDOW = 'window',
  LAG = 'lag',
  LEAD = 'lead',
  CUSTOM = 'custom',
  CUSTOM_FUNCTION = 'custom_function',
  SQL = 'sql',
  JAVASCRIPT = 'javascript',
  
  // Data quality operations
  VALIDATE = 'validate',
  STANDARDIZE = 'standardize',
  DEDUPLICATE = 'deduplicate',
  NORMALIZE = 'normalize',
  IMPUTE = 'impute',
  
  // Geospatial operations
  GEO_DISTANCE = 'geo_distance',
  GEO_WITHIN = 'geo_within',
  GEO_INTERSECT = 'geo_intersect',
  GEO_CENTROID = 'geo_centroid',
  
  // Property valuation specific
  PRICE_ADJUST = 'price_adjust',
  PRICE_PER_SQFT = 'price_per_sqft',
  VALUE_TREND = 'value_trend',
  COMPARABLES = 'comparables',
  PROPERTY_ATTRIBUTES = 'property_attributes',
  INCOME_CALCULATION = 'income_calculation',
  
  // Additional transformations for ETL system
  REORDER_COLUMNS = 'reorder_columns',
  SPLIT = 'split',
  PARSE_DATE = 'parse_date',
  PARSE_NUMBER = 'parse_number',
  MAP_VALUES = 'map_values',
  UNION = 'union',
  REMOVE_DUPLICATES = 'remove_duplicates',
  FORMULA = 'formula'
}

/**
 * Transformation rule interface
 */
export interface TransformationRule {
  id: number;
  name: string;
  description?: string;
  type: TransformationType | string;
  config: Record<string, any>;
  order: number;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ETL job interface
 */
export interface ETLJob {
  id: string;
  name: string;
  description?: string;
  sources: number[];
  transformations: number[];
  destinations: number[];
  schedule?: ETLSchedule;
  enabled: boolean;
  continueOnError: boolean;
  maxAttempts: number;
  timeout: number;
  createdAt: Date;
  updatedAt: Date;
  lastRunAt?: Date;
  lastRunStatus?: JobStatus;
}

/**
 * Suggestion severity enum
 */
export enum SuggestionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Suggestion category enum
 */
export enum SuggestionCategory {
  PERFORMANCE = 'performance',
  RELIABILITY = 'reliability',
  MAINTAINABILITY = 'maintainability',
  SECURITY = 'security',
  COST = 'cost',
  SCALABILITY = 'scalability',
  DATA_QUALITY = 'data_quality'
}

/**
 * Optimization action type enum
 */
export enum OptimizationActionType {
  REORDER_RULES = 'reorder_rules',
  COMBINE_RULES = 'combine_rules',
  SPLIT_RULE = 'split_rule',
  MODIFY_RULE = 'modify_rule',
  REMOVE_RULE = 'remove_rule',
  ADD_RULE = 'add_rule',
  REVIEW_RULES = 'review_rules',
  OPTIMIZE_QUERY = 'optimize_query',
  ADD_INDEXES = 'add_indexes',
  CACHE_DATA = 'cache_data',
  CHANGE_SCHEDULE = 'change_schedule',
  PARALLELIZE = 'parallelize',
  BATCH_PROCESSING = 'batch_processing',
  SET_TIMEOUT = 'set_timeout',
  ADD_VALIDATION = 'add_validation',
  CHANGE_DATA_TYPE = 'change_data_type',
  CONSOLIDATE_TRANSFORMS = 'consolidate_transforms',
  ADD_FILTER = 'add_filter',
  ADD_CACHING = 'add_caching'
}

/**
 * Optimization action interface
 */
export interface OptimizationAction {
  type: OptimizationActionType;
  parameters: Record<string, any>;
}

/**
 * Optimization suggestion interface
 */
export interface OptimizationSuggestion {
  id: string;
  jobId: string;
  title: string;
  type: string;
  severity: SuggestionSeverity;
  category: SuggestionCategory;
  description: string;
  details: string;
  impact: 'low' | 'medium' | 'high';
  action: OptimizationAction;
  appliedAt?: Date;
}

/**
 * Types are already exported through their declarations
 */