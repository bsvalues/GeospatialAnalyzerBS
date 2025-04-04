/**
 * Data source type enum
 */
export enum DataSourceType {
  DATABASE = 'DATABASE',
  API = 'API',
  FILE = 'FILE',
  MEMORY = 'MEMORY'
}

/**
 * Database type enum
 */
export enum DatabaseType {
  POSTGRES = 'POSTGRES',
  MYSQL = 'MYSQL',
  ORACLE = 'ORACLE',
  SQLSERVER = 'SQLSERVER',
  MONGODB = 'MONGODB',
  SQLITE = 'SQLITE',
  OTHER = 'OTHER'
}

/**
 * API type enum
 */
export enum ApiType {
  REST = 'REST',
  GRAPHQL = 'GRAPHQL',
  SOAP = 'SOAP',
  OTHER = 'OTHER'
}

/**
 * File format enum
 */
export enum FileFormat {
  CSV = 'CSV',
  JSON = 'JSON',
  XML = 'XML',
  EXCEL = 'EXCEL',
  PARQUET = 'PARQUET',
  AVRO = 'AVRO',
  TEXT = 'TEXT',
  OTHER = 'OTHER'
}

/**
 * Authentication type enum
 */
export enum AuthType {
  NONE = 'NONE',
  BASIC = 'BASIC',
  TOKEN = 'TOKEN',
  OAUTH = 'OAUTH',
  API_KEY = 'API_KEY',
  CERT = 'CERT',
  CUSTOM = 'CUSTOM'
}

/**
 * Schedule frequency enum
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
 * Job status enum
 */
export enum JobStatus {
  CREATED = 'CREATED',
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED',
  SCHEDULED = 'SCHEDULED'
}

/**
 * Job run status enum
 */
export enum JobRunStatus {
  PENDING = 'PENDING',
  RUNNING = 'RUNNING',
  SUCCEEDED = 'SUCCEEDED',
  FAILED = 'FAILED',
  CANCELLED = 'CANCELLED'
}

/**
 * Transformation type enum
 */
export enum TransformationType {
  FILTER = 'FILTER',
  MAP = 'MAP',
  AGGREGATE = 'AGGREGATE',
  GROUP = 'GROUP',
  JOIN = 'JOIN',
  SORT = 'SORT',
  VALIDATE = 'VALIDATE',
  ENRICH = 'ENRICH'
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
  REGEX = 'REGEX'
}

/**
 * Filter logic enum
 */
export enum FilterLogic {
  AND = 'AND',
  OR = 'OR'
}

/**
 * Aggregate function enum
 */
export enum AggregateFunction {
  SUM = 'SUM',
  AVG = 'AVG',
  MIN = 'MIN',
  MAX = 'MAX',
  COUNT = 'COUNT',
  COUNT_DISTINCT = 'COUNT_DISTINCT',
  FIRST = 'FIRST',
  LAST = 'LAST',
  MEDIAN = 'MEDIAN',
  STDDEV = 'STDDEV',
  VARIANCE = 'VARIANCE'
}

/**
 * Join type enum
 */
export enum JoinType {
  INNER = 'INNER',
  LEFT = 'LEFT',
  RIGHT = 'RIGHT',
  FULL = 'FULL',
  CROSS = 'CROSS'
}

/**
 * Sort direction enum
 */
export enum SortDirection {
  ASC = 'ASC',
  DESC = 'DESC'
}

/**
 * Data quality issue type enum
 */
export enum DataQualityIssueType {
  MISSING_VALUE = 'MISSING_VALUE',
  INVALID_FORMAT = 'INVALID_FORMAT',
  OUT_OF_RANGE = 'OUT_OF_RANGE',
  DUPLICATE_VALUE = 'DUPLICATE_VALUE',
  INCONSISTENT_VALUE = 'INCONSISTENT_VALUE',
  OUTLIER = 'OUTLIER'
}

/**
 * Data quality issue severity enum
 */
export enum DataQualityIssueSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Optimization suggestion type
 */
export enum OptimizationSuggestionType {
  RULE_ORDERING = 'RULE_ORDERING',
  RULE_CONSOLIDATION = 'RULE_CONSOLIDATION',
  REDUNDANT_RULE = 'REDUNDANT_RULE', 
  EXCESSIVE_TRANSFORMS = 'EXCESSIVE_TRANSFORMS',
  PERFORMANCE = 'PERFORMANCE'
}

/**
 * Optimization suggestion severity
 */
export enum SuggestionSeverity {
  INFO = 'INFO',
  WARNING = 'WARNING',
  ERROR = 'ERROR',
  CRITICAL = 'CRITICAL'
}

/**
 * Optimization suggestion category
 */
export enum SuggestionCategory {
  PERFORMANCE = 'PERFORMANCE',
  QUALITY = 'QUALITY',
  RELIABILITY = 'RELIABILITY',
  MAINTAINABILITY = 'MAINTAINABILITY',
  COMPLEXITY = 'COMPLEXITY',
  COST = 'COST',
  DATA_QUALITY = 'DATA_QUALITY'
}

/**
 * Optimization impact
 */
export enum OptimizationImpact {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH'
}

/**
 * Optimization action type
 */
export enum OptimizationActionType {
  REORDER_RULES = 'REORDER_RULES',
  COMBINE_RULES = 'COMBINE_RULES',
  REMOVE_RULE = 'REMOVE_RULE',
  REVIEW_RULES = 'REVIEW_RULES',
  CONSOLIDATE_TRANSFORMS = 'CONSOLIDATE_TRANSFORMS',
  ADD_INDEXES = 'ADD_INDEXES',
  ADD_FILTER = 'ADD_FILTER',
  ADD_CACHING = 'ADD_CACHING',
  PARALLELIZE = 'PARALLELIZE'
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  dbType: DatabaseType;
  host: string;
  port: number;
  database: string;
  schema?: string;
  username?: string;
  password?: string;
  ssl?: boolean;
  connectionString?: string;
  connectionOptions?: Record<string, any>;
  query?: string;
  table?: string;
}

/**
 * API configuration interface
 */
export interface ApiConfig {
  apiType: ApiType;
  url: string;
  method?: string;
  headers?: Record<string, string>;
  params?: Record<string, any>;
  body?: any;
  path?: string;
  pagination?: {
    enabled: boolean;
    type?: 'offset' | 'page' | 'cursor';
    paramName?: string;
    limitParamName?: string;
    pageSize?: number;
    maxPages?: number;
  };
  authentication?: {
    type: AuthType;
    credentials?: Record<string, any>;
  };
}

/**
 * File configuration interface
 */
export interface FileConfig {
  format: FileFormat;
  path: string;
  delimiter?: string;
  quoteChar?: string;
  escapeChar?: string;
  encoding?: string;
  hasHeader?: boolean;
  sheet?: string | number;
  compression?: string;
}

/**
 * Memory configuration interface
 */
export interface MemoryConfig {
  data?: any[] | string;
  sourceId?: string;
}

/**
 * Data source configuration union type
 */
export type DataSourceConfig = DatabaseConfig | ApiConfig | FileConfig | MemoryConfig;

/**
 * Filter condition interface
 */
export interface FilterCondition {
  field: string;
  operator: FilterOperator;
  value: any;
  valueType?: 'string' | 'number' | 'boolean' | 'date' | 'array';
  caseSensitive?: boolean;
}

/**
 * Filter group interface
 */
export interface FilterGroup {
  logic: FilterLogic;
  conditions: (FilterCondition | FilterGroup)[];
}

/**
 * Field mapping interface
 */
export interface FieldMapping {
  source: string;
  target: string;
  transform?: string;
}

/**
 * Aggregate field interface
 */
export interface AggregateField {
  source: string;
  target: string;
  function: AggregateFunction;
}

/**
 * Join condition interface
 */
export interface JoinCondition {
  leftField: string;
  rightField: string;
}

/**
 * Sort field interface
 */
export interface SortField {
  field: string;
  direction: SortDirection;
}

/**
 * Validation rule interface
 */
export interface ValidationRule {
  field: string;
  rules: {
    required?: boolean;
    type?: string;
    min?: number;
    max?: number;
    minLength?: number;
    maxLength?: number;
    pattern?: string;
    enum?: any[];
    custom?: string;
  };
  errorMessage?: string;
}

/**
 * Enrichment source interface
 */
export interface EnrichmentSource {
  type: 'static' | 'api' | 'database' | 'computed';
  config: any;
}

/**
 * Filter transformation configuration
 */
export interface FilterTransformConfig {
  filter: FilterGroup;
}

/**
 * Map transformation configuration
 */
export interface MapTransformConfig {
  mappings: FieldMapping[];
  includeOriginal?: boolean;
}

/**
 * Aggregate transformation configuration
 */
export interface AggregateTransformConfig {
  groupBy: string[];
  aggregates: AggregateField[];
}

/**
 * Group transformation configuration
 */
export interface GroupTransformConfig {
  groupBy: string[];
}

/**
 * Join transformation configuration
 */
export interface JoinTransformConfig {
  rightSource: string;
  joinType: JoinType;
  conditions: JoinCondition[];
  includeFields?: {
    left?: string[];
    right?: string[];
  };
}

/**
 * Sort transformation configuration
 */
export interface SortTransformConfig {
  sortFields: SortField[];
}

/**
 * Validate transformation configuration
 */
export interface ValidateTransformConfig {
  validations: ValidationRule[];
  errorHandling: 'fail' | 'filter' | 'tag';
}

/**
 * Enrich transformation configuration
 */
export interface EnrichTransformConfig {
  sources: Record<string, EnrichmentSource>;
  mappings: FieldMapping[];
}

/**
 * Transformation configuration union type
 */
export type TransformationConfig =
  | FilterTransformConfig
  | MapTransformConfig
  | AggregateTransformConfig
  | GroupTransformConfig
  | JoinTransformConfig
  | SortTransformConfig
  | ValidateTransformConfig
  | EnrichTransformConfig;

/**
 * Transformation rule interface
 */
export interface TransformationRule {
  id: number;
  name: string;
  description?: string;
  type: TransformationType;
  order?: number;
  enabled: boolean;
  config: TransformationConfig;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * ETL schedule options interface
 */
export interface ETLScheduleOptions {
  frequency: ScheduleFrequency;
  minute?: number;
  hour?: number;
  dayOfMonth?: number;
  month?: number;
  dayOfWeek?: number;
  timezone?: string;
  startDate?: Date;
  endDate?: Date;
}

/**
 * ETL job interface
 */
export interface ETLJob {
  id: number;
  name: string;
  description?: string;
  sources: number[];
  destinations: number[];
  rules: number[];
  schedule?: ETLScheduleOptions;
  enabled: boolean;
  status: JobStatus;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
  createdBy?: string;
  updatedBy?: string;
}

/**
 * Job run interface
 */
export interface JobRun {
  id: number;
  jobId: number;
  status: JobRunStatus;
  startTime: Date;
  endTime?: Date;
  duration?: number;
  errorMessage?: string;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Data quality issue interface
 */
export interface DataQualityIssue {
  id: string;
  type: DataQualityIssueType;
  severity: DataQualityIssueSeverity;
  field?: string;
  description: string;
  affectedRows: number;
  affectedRowsPercentage: number;
  examples?: any[];
  createdAt: Date;
}

/**
 * Field statistics interface
 */
export interface FieldStatistics {
  fieldName: string;
  dataType: string;
  count: number;
  distinctCount: number;
  nullCount: number;
  emptyCount: number;
  min?: any;
  max?: any;
  mean?: number;
  median?: number;
  stdDev?: number;
  percentiles?: Record<string, number>;
  mostCommonValues?: [any, number][];
  leastCommonValues?: [any, number][];
  histogram?: [number, number][];
  patternAnalysis?: {
    patterns: [string, number][];
    examples: Record<string, string[]>;
  };
}

/**
 * Data quality analysis result interface
 */
export interface DataQualityAnalysisResult {
  datasetSize: number;
  fieldCount: number;
  issueCount: number;
  issuesBySeverity: Record<DataQualityIssueSeverity, number>;
  issuesByType: Record<DataQualityIssueType, number>;
  issuesByField: Record<string, DataQualityIssue[]>;
  fieldStatistics: Record<string, FieldStatistics>;
  qualityScore: number;
  completenessScore: number;
  validityScore: number;
  consistencyScore: number;
  timestamp: Date;
}

/**
 * Optimization action interface
 */
export interface OptimizationAction {
  type: OptimizationActionType;
  parameters: any;
}

/**
 * Optimization suggestion interface
 */
export interface OptimizationSuggestion {
  id: string;
  jobId: string;
  title: string;
  description: string;
  details: string;
  type: OptimizationSuggestionType;
  severity: SuggestionSeverity;
  category: SuggestionCategory;
  impact: OptimizationImpact;
  status: 'pending' | 'applied' | 'rejected' | 'expired';
  action?: OptimizationAction;
}

/**
 * Data source interface
 */
export interface DataSource {
  id: number;
  name: string;
  description?: string;
  type: DataSourceType;
  config: DataSourceConfig;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Job schedule interface
 */
export interface JobSchedule {
  id: number;
  jobId: number;
  name: string;
  schedule: ETLScheduleOptions;
  enabled: boolean;
  lastRun?: Date;
  nextRun?: Date;
  createdAt: Date;
  updatedAt: Date;
}