import { pgTable, text, serial, integer, boolean, jsonb, numeric, varchar, primaryKey, timestamp } from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// User table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: text("username").notNull().unique(),
  password: text("password").notNull(),
  role: text("role").notNull().default("viewer"),
  email: text("email"),
  isActive: boolean("is_active").notNull().default(true)
});

// Property table for storing property data
export const properties = pgTable("properties", {
  id: serial("id").primaryKey(),
  parcelId: text("parcel_id").notNull().unique(),
  address: text("address").notNull(),
  owner: text("owner"),
  value: text("value"),
  salePrice: text("sale_price"),
  squareFeet: integer("square_feet").notNull(),
  yearBuilt: integer("year_built"),
  landValue: text("land_value"),
  coordinates: jsonb("coordinates"),
  latitude: numeric("latitude", { precision: 10, scale: 6 }),
  longitude: numeric("longitude", { precision: 10, scale: 6 }),
  neighborhood: text("neighborhood"),
  propertyType: text("property_type"),
  bedrooms: integer("bedrooms"),
  bathrooms: integer("bathrooms"),
  lotSize: integer("lot_size"),
  zoning: text("zoning"),
  lastSaleDate: text("last_sale_date"),
  taxAssessment: text("tax_assessment"),
  pricePerSqFt: text("price_per_sqft"),
  attributes: jsonb("attributes"),
  sourceId: text("source_id"),
  zillowId: text("zillow_id")
});

// Project table for storing project metadata
export const projects = pgTable("projects", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  year: text("year").notNull(),
  metrics: jsonb("metrics"),
  records: jsonb("records")
});

// Script table for storing script definitions
export const scripts = pgTable("scripts", {
  id: serial("id").primaryKey(),
  groupId: text("group_id").notNull(),
  name: text("name").notNull(),
  status: text("status").notNull(),
  type: text("type").notNull(),
  code: text("code"),
  order: integer("order").notNull()
});

// Script group table
export const scriptGroups = pgTable("script_groups", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  active: boolean("active").notNull().default(false),
  order: integer("order").notNull()
});

// Regression models table
export const regressionModels = pgTable("regression_models", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  r2: text("r2").notNull(),
  variables: integer("variables").notNull(),
  cov: text("cov"),
  samples: integer("samples"),
  lastRun: text("last_run"),
  modelType: text("model_type").notNull(),
  configuration: jsonb("configuration")
});

// Income-related tables have been removed

// ETL Data Sources table
export const etlDataSources = pgTable("etl_data_sources", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  type: text("type").notNull(), // database, api, file, memory
  connectionDetails: jsonb("connection_details").notNull(),
  isConnected: boolean("is_connected").default(false),
  lastConnected: timestamp("last_connected"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ETL Transformation Rules table
export const etlTransformationRules = pgTable("etl_transformation_rules", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  dataType: text("data_type").notNull(), // text, number, date, boolean, object
  transformationCode: text("transformation_code").notNull(),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ETL Jobs table
export const etlJobs = pgTable("etl_jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  sourceId: text("source_id").notNull(), // References etlDataSources.id
  targetId: text("target_id").notNull(), // References etlDataSources.id
  transformationIds: jsonb("transformation_ids").notNull().default([]), // Array of transformation rule IDs
  status: text("status").notNull().default("idle"), // idle, running, success, failed, warning
  schedule: jsonb("schedule"), // frequency, start_date, days_of_week, time_of_day, etc.
  metrics: jsonb("metrics"), // execution time, CPU/memory utilization, rows processed, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  lastRunAt: timestamp("last_run_at")
});

// ETL Optimization Suggestions table
export const etlOptimizationSuggestions = pgTable("etl_optimization_suggestions", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull(), // References etlJobs.id
  type: text("type").notNull(), // performance, resource, code, scheduling
  severity: text("severity").notNull(), // low, medium, high
  title: text("title").notNull(),
  description: text("description").notNull(),
  suggestedAction: text("suggested_action").notNull(),
  estimatedImprovement: jsonb("estimated_improvement").notNull(), // metric, percentage
  status: text("status").notNull().default("new"), // new, in_progress, implemented, ignored
  category: text("category"),
  implementationComplexity: text("implementation_complexity"),
  suggestedCode: text("suggested_code"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow()
});

// ETL Batch Jobs table
export const etlBatchJobs = pgTable("etl_batch_jobs", {
  id: serial("id").primaryKey(),
  name: text("name").notNull(),
  description: text("description"),
  jobIds: jsonb("job_ids").notNull(), // Array of job IDs
  status: text("status").notNull().default("idle"), // idle, running, success, failed, warning
  progress: integer("progress").notNull().default(0), // 0-100
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  startedAt: timestamp("started_at"),
  completedAt: timestamp("completed_at")
});

// ETL Alerts table
export const etlAlerts = pgTable("etl_alerts", {
  id: serial("id").primaryKey(),
  jobId: text("job_id").notNull(), // References etlJobs.id
  type: text("type").notNull(), // error, warning, info
  message: text("message").notNull(),
  details: text("details"),
  timestamp: timestamp("timestamp").defaultNow(),
  isRead: boolean("is_read").default(false)
});

// Create schemas for inserting data
export const insertUserSchema = createInsertSchema(users).pick({
  username: true,
  password: true,
  role: true,
  email: true,
  isActive: true
});

export const insertPropertySchema = createInsertSchema(properties).pick({
  parcelId: true,
  address: true,
  owner: true,
  value: true,
  salePrice: true,
  squareFeet: true,
  yearBuilt: true,
  landValue: true,
  coordinates: true,
  latitude: true,
  longitude: true,
  neighborhood: true,
  propertyType: true,
  bedrooms: true,
  bathrooms: true,
  lotSize: true,
  zoning: true,
  lastSaleDate: true,
  taxAssessment: true,
  pricePerSqFt: true,
  attributes: true,
  sourceId: true,
  zillowId: true
});

// Type definitions
// These are properly defined as a group at the end of the file

export const insertProjectSchema = createInsertSchema(projects).pick({
  name: true,
  year: true,
  metrics: true,
  records: true
});

export const insertScriptSchema = createInsertSchema(scripts).pick({
  groupId: true,
  name: true,
  status: true,
  type: true,
  code: true,
  order: true
});

export const insertScriptGroupSchema = createInsertSchema(scriptGroups).pick({
  name: true,
  active: true,
  order: true
});

export const insertRegressionModelSchema = createInsertSchema(regressionModels).pick({
  name: true,
  r2: true,
  variables: true,
  cov: true,
  samples: true,
  lastRun: true,
  modelType: true,
  configuration: true
});

// Income-related insert schemas have been removed

// Export types
export type InsertUser = z.infer<typeof insertUserSchema>;
export type User = typeof users.$inferSelect;

export type InsertProperty = z.infer<typeof insertPropertySchema>;
export type Property = typeof properties.$inferSelect;

export type InsertProject = z.infer<typeof insertProjectSchema>;
export type Project = typeof projects.$inferSelect;

export type InsertScript = z.infer<typeof insertScriptSchema>;
export type Script = typeof scripts.$inferSelect;

export type InsertScriptGroup = z.infer<typeof insertScriptGroupSchema>;
export type ScriptGroup = typeof scriptGroups.$inferSelect;

export type InsertRegressionModel = z.infer<typeof insertRegressionModelSchema>;
export type RegressionModel = typeof regressionModels.$inferSelect;

// Income-related types have been removed

// ETL insert schemas
export const insertEtlDataSourceSchema = createInsertSchema(etlDataSources).pick({
  name: true,
  description: true,
  type: true,
  connectionDetails: true,
  isConnected: true,
  lastConnected: true
});

export const insertEtlTransformationRuleSchema = createInsertSchema(etlTransformationRules).pick({
  name: true,
  description: true,
  dataType: true,
  transformationCode: true,
  isActive: true
});

export const insertEtlJobSchema = createInsertSchema(etlJobs).pick({
  name: true,
  description: true,
  sourceId: true,
  targetId: true,
  transformationIds: true,
  status: true,
  schedule: true,
  metrics: true,
  lastRunAt: true
});

export const insertEtlOptimizationSuggestionSchema = createInsertSchema(etlOptimizationSuggestions).pick({
  jobId: true,
  type: true,
  severity: true,
  title: true,
  description: true,
  suggestedAction: true,
  estimatedImprovement: true,
  status: true,
  category: true,
  implementationComplexity: true,
  suggestedCode: true
});

export const insertEtlBatchJobSchema = createInsertSchema(etlBatchJobs).pick({
  name: true,
  description: true,
  jobIds: true,
  status: true,
  progress: true,
  startedAt: true,
  completedAt: true
});

export const insertEtlAlertSchema = createInsertSchema(etlAlerts).pick({
  jobId: true,
  type: true,
  message: true,
  details: true,
  isRead: true
});

// ETL type exports
export type InsertEtlDataSource = z.infer<typeof insertEtlDataSourceSchema>;
export type EtlDataSource = typeof etlDataSources.$inferSelect;

export type InsertEtlTransformationRule = z.infer<typeof insertEtlTransformationRuleSchema>;
export type EtlTransformationRule = typeof etlTransformationRules.$inferSelect;

export type InsertEtlJob = z.infer<typeof insertEtlJobSchema>;
export type EtlJob = typeof etlJobs.$inferSelect;

export type InsertEtlOptimizationSuggestion = z.infer<typeof insertEtlOptimizationSuggestionSchema>;
export type EtlOptimizationSuggestion = typeof etlOptimizationSuggestions.$inferSelect;

export type InsertEtlBatchJob = z.infer<typeof insertEtlBatchJobSchema>;
export type EtlBatchJob = typeof etlBatchJobs.$inferSelect;

export type InsertEtlAlert = z.infer<typeof insertEtlAlertSchema>;
export type EtlAlert = typeof etlAlerts.$inferSelect;
