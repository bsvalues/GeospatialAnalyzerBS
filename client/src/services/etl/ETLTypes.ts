/**
 * ETL Types
 * 
 * This file contains all the type definitions used throughout the ETL system.
 */

// ===== DATABASE TYPES =====

/**
 * Database type enum
 */
export enum DatabaseType {
  POSTGRES = 'postgres',
  MYSQL = 'mysql',
  SQLITE = 'sqlite',
  MONGODB = 'mongodb',
  MSSQL = 'mssql',
  ORACLE = 'oracle'
}

/**
 * Database authentication type enum
 */
export enum DatabaseAuthType {
  BASIC = 'basic',
  IAM = 'iam',
  CERTIFICATE = 'certificate',
  TOKEN = 'token',
  WINDOWS = 'windows',
  NONE = 'none'
}

/**
 * Database configuration interface
 */
export interface DatabaseConfig {
  id: number;
  name: string;
  description?: string;
  dbType: DatabaseType;
  host: string;
  port?: number;
  database: string;
  username?: string;
  password?: string;
  authType?: DatabaseAuthType;
  options?: Record<string, any>;
  ssl?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== API TYPES =====

/**
 * API type enum
 */
export enum ApiType {
  REST = 'rest',
  GRAPHQL = 'graphql',
  SOAP = 'soap',
  CUSTOM = 'custom'
}

/**
 * HTTP method enum
 */
export enum HttpMethod {
  GET = 'get',
  POST = 'post',
  PUT = 'put',
  DELETE = 'delete',
  PATCH = 'patch',
  HEAD = 'head',
  OPTIONS = 'options'
}

/**
 * Authentication type enum
 */
export enum AuthType {
  NONE = 'none',
  BASIC = 'basic',
  API_KEY = 'api_key',
  BEARER = 'bearer',
  OAUTH1 = 'oauth1',
  OAUTH2 = 'oauth2',
  CUSTOM = 'custom'
}

/**
 * API configuration interface
 */
export interface ApiConfig {
  id: number;
  name: string;
  description?: string;
  apiType: ApiType;
  baseUrl: string;
  endpoint?: string;
  method?: HttpMethod;
  headers?: Record<string, string>;
  queryParams?: Record<string, string>;
  bodyTemplate?: string;
  authType: AuthType;
  authConfig?: Record<string, any>;
  rateLimit?: number;
  timeout?: number;
  createdAt: Date;
  updatedAt: Date;
}

// ===== FILE TYPES =====

/**
 * File format enum
 */
export enum FileFormat {
  CSV = 'csv',
  JSON = 'json',
  XML = 'xml',
  EXCEL = 'excel',
  PARQUET = 'parquet',
  AVRO = 'avro'
}

/**
 * File delimiter enum
 */
export enum FileDelimiter {
  COMMA = ',',
  TAB = '\t',
  SEMICOLON = ';',
  PIPE = '|',
  SPACE = ' '
}

/**
 * File configuration interface
 */
export interface FileConfig {
  id: number;
  name: string;
  description?: string;
  format: FileFormat;
  path: string;
  delimiter?: FileDelimiter;
  hasHeader?: boolean;
  encoding?: string;
  compression?: 'none' | 'gzip' | 'zip' | 'bzip2';
  schema?: Record<string, any>;
  createdAt: Date;
  updatedAt: Date;
}

// ===== MEMORY TYPES =====

/**
 * Memory configuration interface
 */
export interface MemoryConfig {
  id: number;
  name: string;
  description?: string;
  variableName?: string;
  createdAt: Date;
  updatedAt: Date;
}

// ===== TRANSFORMATION TYPES =====

/**
 * Transformation type enum
 */
export enum TransformationType {
  FILTER = 'filter',
  MAP = 'map',
  AGGREGATE = 'aggregate',
  JOIN = 'join',
  SORT = 'sort',
  VALIDATE = 'validate',
  DEDUPLICATE = 'deduplicate',
  CUSTOM = 'custom'
}

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
  config: any;
  createdAt: Date;
  updatedAt: Date;
}

// ===== SCHEDULE TYPES =====

/**
 * Schedule frequency enum
 */
export enum ScheduleFrequency {
  ONCE = 'once',
  HOURLY = 'hourly',
  DAILY = 'daily',
  WEEKLY = 'weekly',
  MONTHLY = 'monthly',
  CUSTOM = 'custom'
}

/**
 * ETL schedule options interface
 */
export interface ETLScheduleOptions {
  frequency: ScheduleFrequency;
  startDate?: Date;
  endDate?: Date;
  hour?: number;
  minute?: number;
  daysOfWeek?: number[]; // 0-6, Sunday = 0
  dayOfMonth?: number; // 1-31
  cron?: string; // For custom schedules
}

/**
 * ETL schedule interface
 */
export interface ETLSchedule {
  id: number;
  jobId: number;
  options: ETLScheduleOptions;
  nextRun?: Date;
  enabled: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// ===== JOB TYPES =====

/**
 * Job status enum
 */
export enum JobStatus {
  IDLE = 'idle',
  RUNNING = 'running',
  SUCCEEDED = 'succeeded',
  FAILED = 'failed',
  CANCELLED = 'cancelled'
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
  lastRun?: Date;
  status: JobStatus;
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
  startTime: Date;
  endTime?: Date;
  status: JobStatus;
  records: {
    extracted: number;
    transformed: number;
    loaded: number;
    failed: number;
  };
  errors: any[];
  executionTime?: number;
  createdAt: Date;
}

// ===== OPTIMIZATION TYPES =====

/**
 * Optimization suggestion type enum
 */
export enum SuggestionType {
  RULE_ORDERING = 'RULE_ORDERING',
  RULE_CONSOLIDATION = 'RULE_CONSOLIDATION',
  REDUNDANT_RULE = 'REDUNDANT_RULE',
  EXCESSIVE_TRANSFORMS = 'EXCESSIVE_TRANSFORMS',
  PERFORMANCE = 'PERFORMANCE'
}

/**
 * Optimization suggestion severity enum
 */
export enum SuggestionSeverity {
  LOW = 'low',
  MEDIUM = 'medium',
  HIGH = 'high',
  CRITICAL = 'critical'
}

/**
 * Optimization suggestion category enum
 */
export enum SuggestionCategory {
  ORDERING = 'ordering',
  EFFICIENCY = 'efficiency',
  PERFORMANCE = 'performance',
  RELIABILITY = 'reliability',
  MAINTAINABILITY = 'maintainability'
}

/**
 * Optimization action type enum
 */
export enum OptimizationActionType {
  REORDER_RULES = 'REORDER_RULES',
  COMBINE_RULES = 'COMBINE_RULES',
  REVIEW_RULES = 'REVIEW_RULES',
  CONSOLIDATE_TRANSFORMS = 'CONSOLIDATE_TRANSFORMS',
  ADD_INDEXES = 'ADD_INDEXES',
  ADD_FILTER = 'ADD_FILTER',
  ADD_CACHING = 'ADD_CACHING',
  PARALLELIZE = 'PARALLELIZE'
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
  type: SuggestionType;
  severity: SuggestionSeverity;
  category: SuggestionCategory;
  impact: 'low' | 'medium' | 'high';
  action?: OptimizationAction;
  applied: boolean;
  timestamp: Date;
}

// ===== DATA SOURCE TYPES =====

/**
 * Data source type
 */
export type DataSource = DatabaseConfig | ApiConfig | FileConfig | MemoryConfig;

/**
 * Data source config type
 */
export type DataSourceConfig = DatabaseConfig | ApiConfig | FileConfig | MemoryConfig;