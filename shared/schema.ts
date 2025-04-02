import { pgTable, text, serial, integer, boolean, jsonb, numeric, varchar, primaryKey } from "drizzle-orm/pg-core";
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
  attributes: jsonb("attributes")
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

// Income Hotel Motel table
export const incomeHotelMotel = pgTable("income_hotel_motel", {
  incomeYear: numeric("income_yr", { precision: 4, scale: 0 }).notNull(),
  supNum: integer("sup_num").notNull(),
  incomeId: integer("income_id").notNull(),
  sizeInSqft: numeric("size_in_sqft", { precision: 8, scale: 0 }).notNull().default("0"),
  averageDailyRoomRate: numeric("average_daily_room_rate", { precision: 9, scale: 2 }).notNull().default("0"),
  numberOfRooms: numeric("number_of_rooms", { precision: 4, scale: 0 }).notNull().default("0"),
  numberOfRoomNights: numeric("number_of_room_nights", { precision: 8, scale: 0 }).notNull().default("0"),
  incomeValueReconciled: numeric("income_value_reconciled", { precision: 9, scale: 0 }).notNull().default("0"),
  incomeValuePerRoom: numeric("income_value_per_room", { precision: 14, scale: 2 }).notNull().default("0"),
  assessmentValuePerRoom: numeric("assessment_value_per_room", { precision: 14, scale: 2 }).notNull().default("0"),
  incomeValuePerSqft: numeric("income_value_per_sqft", { precision: 14, scale: 2 }).notNull().default("0"),
  assessmentValuePerSqft: numeric("assessment_value_per_sqft", { precision: 14, scale: 2 }).notNull().default("0")
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.incomeYear, table.supNum, table.incomeId] })
  };
});

// Income Hotel Motel Detail table
export const incomeHotelMotelDetail = pgTable("income_hotel_motel_detail", {
  incomeYear: numeric("income_yr", { precision: 4, scale: 0 }).notNull(),
  supNum: integer("sup_num").notNull(),
  incomeId: integer("income_id").notNull(),
  valueType: varchar("value_type", { length: 1 }).notNull(),
  roomRevenue: numeric("room_revenue", { precision: 9, scale: 0 }).notNull().default("0"),
  roomRevenuePct: numeric("room_revenue_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  roomRevenueUpdate: varchar("room_revenue_update", { length: 1 }).notNull().default(""),
  vacancyCollectionLoss: numeric("vacancy_collection_loss", { precision: 9, scale: 0 }).notNull().default("0"),
  vacancyCollectionLossPct: numeric("vacancy_collection_loss_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  vacancyCollectionLossUpdate: varchar("vacancy_collection_loss_update", { length: 1 }).notNull().default(""),
  foodBeverageIncome: numeric("food_beverage_income", { precision: 9, scale: 0 }).notNull().default("0"),
  foodBeverageIncomePct: numeric("food_beverage_income_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  foodBeverageIncomeUpdate: varchar("food_beverage_income_update", { length: 1 }).notNull().default(""),
  miscIncome: numeric("misc_income", { precision: 9, scale: 0 }).notNull().default("0"),
  miscIncomePct: numeric("misc_income_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  miscIncomeUpdate: varchar("misc_income_update", { length: 1 }).notNull().default(""),
  effectiveGrossIncome: numeric("effective_gross_income", { precision: 9, scale: 0 }).notNull().default("0"),
  effectiveGrossIncomePct: numeric("effective_gross_income_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  utilities: numeric("utilities", { precision: 9, scale: 0 }).notNull().default("0"),
  utilitiesPct: numeric("utilities_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  utilitiesUpdate: varchar("utilities_update", { length: 1 }).notNull().default(""),
  maintenanceRepair: numeric("maintenance_repair", { precision: 9, scale: 0 }).notNull().default("0"),
  maintenanceRepairPct: numeric("maintenance_repair_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  maintenanceRepairUpdate: varchar("maintenance_repair_update", { length: 1 }).notNull().default(""),
  departmentExpenses: numeric("department_expenses", { precision: 9, scale: 0 }).notNull().default("0"),
  departmentExpensesPct: numeric("department_expenses_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  departmentExpensesUpdate: varchar("department_expenses_update", { length: 1 }).notNull().default(""),
  management: numeric("management", { precision: 9, scale: 0 }).notNull().default("0"),
  managementPct: numeric("management_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  managementUpdate: varchar("management_update", { length: 1 }).notNull().default(""),
  administrative: numeric("administrative", { precision: 9, scale: 0 }).notNull().default("0"),
  administrativePct: numeric("administrative_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  administrativeUpdate: varchar("administrative_update", { length: 1 }).notNull().default(""),
  payroll: numeric("payroll", { precision: 9, scale: 0 }).notNull().default("0"),
  payrollPct: numeric("payroll_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  payrollUpdate: varchar("payroll_update", { length: 1 }).notNull().default(""),
  insurance: numeric("insurance", { precision: 9, scale: 0 }).notNull().default("0"),
  insurancePct: numeric("insurance_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  insuranceUpdate: varchar("insurance_update", { length: 1 }).notNull().default(""),
  marketing: numeric("marketing", { precision: 9, scale: 0 }).notNull().default("0"),
  marketingPct: numeric("marketing_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  marketingUpdate: varchar("marketing_update", { length: 1 }).notNull().default(""),
  realEstateTax: numeric("real_estate_tax", { precision: 9, scale: 0 }).notNull().default("0"),
  realEstateTaxPct: numeric("real_estate_tax_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  realEstateTaxUpdate: varchar("real_estate_tax_update", { length: 1 }).notNull().default(""),
  franchiseFee: numeric("franchise_fee", { precision: 9, scale: 0 }).notNull().default("0"),
  franchiseFeePct: numeric("franchise_fee_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  franchiseFeeUpdate: varchar("franchise_fee_update", { length: 1 }).notNull().default(""),
  other: numeric("other", { precision: 9, scale: 0 }).notNull().default("0"),
  otherPct: numeric("other_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  otherUpdate: varchar("other_update", { length: 1 }).notNull().default(""),
  totalExpenses: numeric("total_expenses", { precision: 9, scale: 0 }).notNull().default("0"),
  totalExpensesPct: numeric("total_expenses_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  totalExpensesUpdate: varchar("total_expenses_update", { length: 1 }).notNull().default(""),
  netOperatingIncome: numeric("net_operating_income", { precision: 9, scale: 0 }).notNull().default("0"),
  netOperatingIncomePct: numeric("net_operating_income_pct", { precision: 5, scale: 2 }).notNull().default("0"),
  capRate: numeric("cap_rate", { precision: 4, scale: 2 }).notNull().default("0"),
  capRateUpdate: varchar("cap_rate_update", { length: 1 }).notNull().default(""),
  taxRate: numeric("tax_rate", { precision: 4, scale: 2 }).notNull().default("0"),
  taxRateUpdate: varchar("tax_rate_update", { length: 1 }).notNull().default(""),
  overallCapRate: numeric("overall_cap_rate", { precision: 4, scale: 2 }).notNull().default("0"),
  incomeValue: numeric("income_value", { precision: 9, scale: 0 }).notNull().default("0"),
  personalPropertyValue: numeric("personal_property_value", { precision: 9, scale: 0 }).notNull().default("0"),
  personalPropertyValueUpdate: varchar("personal_property_value_update", { length: 1 }).notNull().default(""),
  otherValue: numeric("other_value", { precision: 9, scale: 0 }).notNull().default("0"),
  otherValueUpdate: varchar("other_value_update", { length: 1 }).notNull().default(""),
  indicatedIncomeValue: numeric("indicated_income_value", { precision: 9, scale: 0 }).notNull().default("0")
}, (table) => {
  return {
    pk: primaryKey({ columns: [table.incomeYear, table.supNum, table.incomeId, table.valueType] })
  };
});

// Income Lease Up table
export const incomeLeaseUp = pgTable("income_lease_up", {
  incomeLeaseUpId: integer("income_lease_up_id").notNull().primaryKey(),
  incomeYear: numeric("income_yr", { precision: 4, scale: 0 }).notNull(),
  supNum: integer("sup_num").notNull(),
  incomeId: integer("income_id").notNull(),
  frequency: varchar("frequency", { length: 1 }).notNull().default("A"),
  leaseType: varchar("lease_type", { length: 1 }),
  unitOfMeasure: varchar("unit_of_measure", { length: 1 }),
  rentLossAreaSqft: numeric("rent_loss_area_sqft", { precision: 14, scale: 0 }),
  rentSqft: numeric("rent_sqft", { precision: 14, scale: 2 }),
  rentNumberOfYears: numeric("rent_number_of_years", { precision: 5, scale: 2 }),
  rentTotal: numeric("rent_total", { precision: 14, scale: 0 }),
  leasePct: numeric("lease_pct", { precision: 5, scale: 2 }),
  leaseTotal: numeric("lease_total", { precision: 14, scale: 0 })
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
  attributes: true
});

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

export const insertIncomeHotelMotelSchema = createInsertSchema(incomeHotelMotel).pick({
  incomeYear: true,
  supNum: true,
  incomeId: true,
  sizeInSqft: true,
  averageDailyRoomRate: true,
  numberOfRooms: true,
  numberOfRoomNights: true,
  incomeValueReconciled: true,
  incomeValuePerRoom: true,
  assessmentValuePerRoom: true,
  incomeValuePerSqft: true,
  assessmentValuePerSqft: true
});

export const insertIncomeHotelMotelDetailSchema = createInsertSchema(incomeHotelMotelDetail).pick({
  incomeYear: true,
  supNum: true,
  incomeId: true,
  valueType: true,
  roomRevenue: true,
  roomRevenuePct: true,
  roomRevenueUpdate: true,
  vacancyCollectionLoss: true,
  vacancyCollectionLossPct: true,
  vacancyCollectionLossUpdate: true,
  foodBeverageIncome: true,
  foodBeverageIncomePct: true,
  foodBeverageIncomeUpdate: true,
  miscIncome: true,
  miscIncomePct: true,
  miscIncomeUpdate: true,
  effectiveGrossIncome: true,
  effectiveGrossIncomePct: true,
  utilities: true,
  utilitiesPct: true,
  utilitiesUpdate: true,
  maintenanceRepair: true,
  maintenanceRepairPct: true,
  maintenanceRepairUpdate: true,
  departmentExpenses: true,
  departmentExpensesPct: true,
  departmentExpensesUpdate: true,
  management: true,
  managementPct: true,
  managementUpdate: true,
  administrative: true,
  administrativePct: true,
  administrativeUpdate: true,
  payroll: true,
  payrollPct: true,
  payrollUpdate: true,
  insurance: true,
  insurancePct: true,
  insuranceUpdate: true,
  marketing: true,
  marketingPct: true,
  marketingUpdate: true,
  realEstateTax: true,
  realEstateTaxPct: true,
  realEstateTaxUpdate: true,
  franchiseFee: true,
  franchiseFeePct: true,
  franchiseFeeUpdate: true,
  other: true,
  otherPct: true,
  otherUpdate: true,
  totalExpenses: true,
  totalExpensesPct: true,
  totalExpensesUpdate: true,
  netOperatingIncome: true,
  netOperatingIncomePct: true,
  capRate: true,
  capRateUpdate: true,
  taxRate: true,
  taxRateUpdate: true,
  overallCapRate: true,
  incomeValue: true,
  personalPropertyValue: true,
  personalPropertyValueUpdate: true,
  otherValue: true,
  otherValueUpdate: true,
  indicatedIncomeValue: true
});

export const insertIncomeLeaseUpSchema = createInsertSchema(incomeLeaseUp).pick({
  incomeYear: true,
  supNum: true,
  incomeId: true,
  frequency: true,
  leaseType: true,
  unitOfMeasure: true,
  rentLossAreaSqft: true,
  rentSqft: true,
  rentNumberOfYears: true,
  rentTotal: true,
  leasePct: true,
  leaseTotal: true
});

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

export type InsertIncomeHotelMotel = z.infer<typeof insertIncomeHotelMotelSchema>;
export type IncomeHotelMotel = typeof incomeHotelMotel.$inferSelect;

export type InsertIncomeHotelMotelDetail = z.infer<typeof insertIncomeHotelMotelDetailSchema>;
export type IncomeHotelMotelDetail = typeof incomeHotelMotelDetail.$inferSelect;

export type InsertIncomeLeaseUp = z.infer<typeof insertIncomeLeaseUpSchema>;
export type IncomeLeaseUp = typeof incomeLeaseUp.$inferSelect;
