/**
 * ETL Types
 * 
 * This file contains common types, enums, and interfaces used across ETL services.
 */

/**
 * ETL job status
 */
export enum JobStatus {
  CREATED = 'CREATED',
  SCHEDULED = 'SCHEDULED',
  QUEUED = 'QUEUED',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELED = 'CANCELED',
  PAUSED = 'PAUSED'
}

/**
 * Schedule frequency
 */
export enum ScheduleFrequency {
  ONCE = 'ONCE',
  MINUTELY = 'MINUTELY',
  HOURLY = 'HOURLY',
  DAILY = 'DAILY',
  WEEKLY = 'WEEKLY',
  MONTHLY = 'MONTHLY',
  CUSTOM = 'CUSTOM'
}

/**
 * Data source type
 */
export enum DataSourceType {
  POSTGRESQL = 'POSTGRESQL',
  MYSQL = 'MYSQL',
  MONGODB = 'MONGODB',
  REST_API = 'REST_API',
  FILE = 'FILE',
  MEMORY = 'MEMORY'
}

/**
 * Load mode
 */
export enum LoadMode {
  INSERT = 'INSERT',
  UPDATE = 'UPDATE',
  UPSERT = 'UPSERT',
  DELETE = 'DELETE',
  TRUNCATE = 'TRUNCATE'
}

/**
 * Transformation type
 */
export enum TransformationType {
  FILTER = 'FILTER',
  MAP = 'MAP',
  AGGREGATE = 'AGGREGATE',
  JOIN = 'JOIN',
  SORT = 'SORT',
  DEDUPLICATE = 'DEDUPLICATE',
  VALIDATE = 'VALIDATE',
  ENRICH = 'ENRICH',
  TRANSFORM = 'TRANSFORM'
}

/**
 * Filter operator
 */
export enum FilterOperator {
  EQUALS = 'EQUALS',
  NOT_EQUALS = 'NOT_EQUALS',
  GREATER_THAN = 'GREATER_THAN',
  GREATER_THAN_OR_EQUALS = 'GREATER_THAN_OR_EQUALS',
  LESS_THAN = 'LESS_THAN',
  LESS_THAN_OR_EQUALS = 'LESS_THAN_OR_EQUALS',
  IN = 'IN',
  NOT_IN = 'NOT_IN',
  CONTAINS = 'CONTAINS',
  NOT_CONTAINS = 'NOT_CONTAINS',
  STARTS_WITH = 'STARTS_WITH',
  ENDS_WITH = 'ENDS_WITH',
  IS_NULL = 'IS_NULL',
  IS_NOT_NULL = 'IS_NOT_NULL',
  BETWEEN = 'BETWEEN',
  NOT_BETWEEN = 'NOT_BETWEEN',
  REGEX = 'REGEX'
}

/**
 * Filter logic
 */
export type FilterLogic = 'AND' | 'OR';

/**
 * Filter condition
 */
export interface FilterCondition {
  field: string;
  operator: string; // Using FilterOperator enum value
  value: any;
  valueEnd?: any; // For BETWEEN operator
}

/**
 * Filter configuration
 */
export interface FilterConfig {
  logic: FilterLogic;
  conditions: FilterCondition[];
}

/**
 * Map configuration
 */
export interface MapConfig {
  mappings: { source: string; target: string }[];
  includeOriginal?: boolean;
}

/**
 * Aggregate configuration
 */
export interface AggregateConfig {
  groupBy: string[];
  aggregations: {
    field: string;
    operation: 'SUM' | 'AVG' | 'MIN' | 'MAX' | 'COUNT';
    alias: string;
  }[];
}

/**
 * Join configuration
 */
export interface JoinConfig {
  rightDataset: any[];
  on: { left: string; right: string }[];
  type: 'INNER' | 'LEFT' | 'RIGHT' | 'FULL';
  alias?: string;
}

/**
 * Sort configuration
 */
export interface SortConfig {
  sortBy: { field: string; direction: 'ASC' | 'DESC' }[];
}

/**
 * Deduplication configuration
 */
export interface DeduplicateConfig {
  fields: string[];
  keepFirst?: boolean;
}

/**
 * Validation configuration
 */
export interface ValidateConfig {
  rules: {
    field: string;
    validation: 'REQUIRED' | 'EMAIL' | 'URL' | 'DATE' | 'NUMBER' | 'BOOLEAN' | 'CUSTOM';
    pattern?: string; // For CUSTOM validation
    errorMessage?: string;
  }[];
  failOnError?: boolean;
}

/**
 * Enrichment configuration
 */
export interface EnrichConfig {
  enrichments: {
    field: string;
    source: 'API' | 'DATABASE' | 'FUNCTION';
    config: any;
  }[];
}

/**
 * Transformation configuration
 */
export interface TransformConfig {
  transformations: {
    field: string;
    operation: 'CONCAT' | 'SUBSTRING' | 'REPLACE' | 'UPPERCASE' | 'LOWERCASE' | 'TRIM' | 'CUSTOM';
    params: any;
  }[];
}

/**
 * Transformation rule
 */
export interface TransformationRule {
  id: number;
  name: string;
  description?: string;
  type: TransformationType;
  config: FilterConfig | MapConfig | AggregateConfig | JoinConfig | SortConfig | DeduplicateConfig | ValidateConfig | EnrichConfig | TransformConfig;
  enabled: boolean;
  order: number;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data source
 */
export interface DataSource {
  id: number;
  name: string;
  description?: string;
  type: string; // Using DataSourceType enum value
  config: any;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ETL job
 */
export interface ETLJob {
  id: number;
  name: string;
  description?: string;
  sources: number[];
  destinations: number[];
  rules?: number[];
  status: JobStatus;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}