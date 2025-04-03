import { 
  users, 
  properties, 
  incomeHotelMotel,
  incomeHotelMotelDetail,
  incomeLeaseUp,
  etlDataSources,
  etlTransformationRules,
  etlJobs,
  etlOptimizationSuggestions,
  etlBatchJobs,
  etlAlerts,
  type User, 
  type InsertUser, 
  type Property, 
  type InsertProperty,
  type IncomeHotelMotel,
  type InsertIncomeHotelMotel,
  type IncomeHotelMotelDetail,
  type InsertIncomeHotelMotelDetail,
  type IncomeLeaseUp,
  type InsertIncomeLeaseUp,
  type EtlDataSource,
  type InsertEtlDataSource,
  type EtlTransformationRule,
  type InsertEtlTransformationRule,
  type EtlJob,
  type InsertEtlJob,
  type EtlOptimizationSuggestion,
  type InsertEtlOptimizationSuggestion,
  type EtlBatchJob,
  type InsertEtlBatchJob,
  type EtlAlert,
  type InsertEtlAlert
} from "@shared/schema";

// modify the interface with any CRUD methods
// you might need

export interface IStorage {
  // User operations
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  
  // Property operations
  getProperties(): Promise<Property[]>;
  getPropertyById(id: number): Promise<Property | undefined>;
  getPropertiesByFilter(filters: {
    neighborhood?: string;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    minValue?: number;
    maxValue?: number;
    minSquareFeet?: number;
    maxSquareFeet?: number;
    propertyType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Property[]>;
  getPropertiesInRegion(bounds: [number, number, number, number]): Promise<Property[]>;
  createProperty(property: InsertProperty): Promise<Property>;
  searchProperties(searchText: string): Promise<Property[]>;
  
  // Income Hotel/Motel operations
  getIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotel | undefined>;
  createIncomeHotelMotel(incomeHotelMotel: InsertIncomeHotelMotel): Promise<IncomeHotelMotel>;
  updateIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number, incomeHotelMotel: Partial<InsertIncomeHotelMotel>): Promise<IncomeHotelMotel | undefined>;
  
  // Income Hotel/Motel Detail operations
  getIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string): Promise<IncomeHotelMotelDetail | undefined>;
  getIncomeHotelMotelDetails(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotelDetail[]>;
  createIncomeHotelMotelDetail(incomeHotelMotelDetail: InsertIncomeHotelMotelDetail): Promise<IncomeHotelMotelDetail>;
  updateIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string, incomeHotelMotelDetail: Partial<InsertIncomeHotelMotelDetail>): Promise<IncomeHotelMotelDetail | undefined>;
  
  // Income Lease Up operations
  getIncomeLeaseUp(incomeLeaseUpId: number): Promise<IncomeLeaseUp | undefined>;
  getIncomeLeaseUpsByIncomeId(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeLeaseUp[]>;
  createIncomeLeaseUp(incomeLeaseUp: InsertIncomeLeaseUp): Promise<IncomeLeaseUp>;
  updateIncomeLeaseUp(incomeLeaseUpId: number, incomeLeaseUp: Partial<InsertIncomeLeaseUp>): Promise<IncomeLeaseUp | undefined>;
  deleteIncomeLeaseUp(incomeLeaseUpId: number): Promise<boolean>;

  // ETL Data Source operations
  getEtlDataSources(): Promise<EtlDataSource[]>;
  getEtlDataSourceById(id: number): Promise<EtlDataSource | undefined>;
  createEtlDataSource(dataSource: InsertEtlDataSource): Promise<EtlDataSource>;
  updateEtlDataSource(id: number, dataSource: Partial<InsertEtlDataSource>): Promise<EtlDataSource | undefined>;
  deleteEtlDataSource(id: number): Promise<boolean>;
  
  // ETL Transformation Rule operations
  getEtlTransformationRules(): Promise<EtlTransformationRule[]>;
  getEtlTransformationRuleById(id: number): Promise<EtlTransformationRule | undefined>;
  createEtlTransformationRule(rule: InsertEtlTransformationRule): Promise<EtlTransformationRule>;
  updateEtlTransformationRule(id: number, rule: Partial<InsertEtlTransformationRule>): Promise<EtlTransformationRule | undefined>;
  deleteEtlTransformationRule(id: number): Promise<boolean>;
  
  // ETL Job operations
  getEtlJobs(): Promise<EtlJob[]>;
  getEtlJobById(id: number): Promise<EtlJob | undefined>;
  createEtlJob(job: InsertEtlJob): Promise<EtlJob>;
  updateEtlJob(id: number, job: Partial<InsertEtlJob>): Promise<EtlJob | undefined>;
  deleteEtlJob(id: number): Promise<boolean>;
  
  // ETL Optimization Suggestion operations
  getEtlOptimizationSuggestions(): Promise<EtlOptimizationSuggestion[]>;
  getEtlOptimizationSuggestionsByJobId(jobId: number): Promise<EtlOptimizationSuggestion[]>;
  getEtlOptimizationSuggestionById(id: number): Promise<EtlOptimizationSuggestion | undefined>;
  createEtlOptimizationSuggestion(suggestion: InsertEtlOptimizationSuggestion): Promise<EtlOptimizationSuggestion>;
  updateEtlOptimizationSuggestion(id: number, suggestion: Partial<InsertEtlOptimizationSuggestion>): Promise<EtlOptimizationSuggestion | undefined>;
  deleteEtlOptimizationSuggestion(id: number): Promise<boolean>;
  
  // ETL Batch Job operations
  getEtlBatchJobs(): Promise<EtlBatchJob[]>;
  getEtlBatchJobById(id: number): Promise<EtlBatchJob | undefined>;
  createEtlBatchJob(batchJob: InsertEtlBatchJob): Promise<EtlBatchJob>;
  updateEtlBatchJob(id: number, batchJob: Partial<InsertEtlBatchJob>): Promise<EtlBatchJob | undefined>;
  deleteEtlBatchJob(id: number): Promise<boolean>;
  
  // ETL Alert operations
  getEtlAlerts(): Promise<EtlAlert[]>;
  getEtlAlertsByJobId(jobId: number): Promise<EtlAlert[]>;
  getEtlAlertById(id: number): Promise<EtlAlert | undefined>;
  createEtlAlert(alert: InsertEtlAlert): Promise<EtlAlert>;
  updateEtlAlert(id: number, alert: Partial<InsertEtlAlert>): Promise<EtlAlert | undefined>;
  deleteEtlAlert(id: number): Promise<boolean>;
}

// MemStorage class implementation
export class MemStorage implements IStorage {
  private users: Record<number, User>;
  private properties: Record<number, Property>;
  private incomeHotelMotelMap: Record<string, IncomeHotelMotel>;
  private incomeHotelMotelDetailMap: Record<string, IncomeHotelMotelDetail>;
  private incomeLeaseUpMap: Record<number, IncomeLeaseUp>;
  private etlDataSourcesMap: Record<number, EtlDataSource>;
  private etlTransformationRulesMap: Record<number, EtlTransformationRule>;
  private etlJobsMap: Record<number, EtlJob>;
  private etlOptimizationSuggestionsMap: Record<number, EtlOptimizationSuggestion>;
  private etlBatchJobsMap: Record<number, EtlBatchJob>;
  private etlAlertsMap: Record<number, EtlAlert>;
  private userCurrentId: number;
  private propertyCurrentId: number;
  private incomeLeaseUpCurrentId: number;
  private etlDataSourceCurrentId: number;
  private etlTransformationRuleCurrentId: number;
  private etlJobCurrentId: number;
  private etlOptimizationSuggestionCurrentId: number;
  private etlBatchJobCurrentId: number;
  private etlAlertCurrentId: number;

  constructor() {
    this.users = {};
    this.properties = {};
    this.incomeHotelMotelMap = {};
    this.incomeHotelMotelDetailMap = {};
    this.incomeLeaseUpMap = {};
    this.etlDataSourcesMap = {};
    this.etlTransformationRulesMap = {};
    this.etlJobsMap = {};
    this.etlOptimizationSuggestionsMap = {};
    this.etlBatchJobsMap = {};
    this.etlAlertsMap = {};
    this.userCurrentId = 1;
    this.propertyCurrentId = 1;
    this.incomeLeaseUpCurrentId = 1;
    this.etlDataSourceCurrentId = 1;
    this.etlTransformationRuleCurrentId = 1;
    this.etlJobCurrentId = 1;
    this.etlOptimizationSuggestionCurrentId = 1;
    this.etlBatchJobCurrentId = 1;
    this.etlAlertCurrentId = 1;
    this.initializeSampleProperties();
    this.initializeSampleEtlData();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users[id];
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Object.values(this.users).find(
      (user) => user.username === username,
    );
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.userCurrentId++;
    const user: User = { 
      id,
      username: insertUser.username,
      password: insertUser.password,
      role: insertUser.role || 'viewer', 
      email: insertUser.email || null,
      isActive: insertUser.isActive !== undefined ? insertUser.isActive : true
    };
    this.users[id] = user;
    return user;
  }

  // Property operations
  async getProperties(): Promise<Property[]> {
    return Object.values(this.properties);
  }

  async getPropertyById(id: number): Promise<Property | undefined> {
    return this.properties[id];
  }

  async getPropertiesByFilter(filters: {
    neighborhood?: string;
    minYearBuilt?: number;
    maxYearBuilt?: number;
    minValue?: number;
    maxValue?: number;
    minSquareFeet?: number;
    maxSquareFeet?: number;
    propertyType?: string;
    sortBy?: string;
    sortOrder?: 'asc' | 'desc';
    limit?: number;
    offset?: number;
  }): Promise<Property[]> {
    let properties = Object.values(this.properties);

    // Apply filters
    if (filters.neighborhood) {
      properties = properties.filter(p => p.neighborhood === filters.neighborhood);
    }

    if (filters.minYearBuilt !== undefined) {
      properties = properties.filter(p => p.yearBuilt && p.yearBuilt >= filters.minYearBuilt!);
    }

    if (filters.maxYearBuilt !== undefined) {
      properties = properties.filter(p => p.yearBuilt && p.yearBuilt <= filters.maxYearBuilt!);
    }

    if (filters.minSquareFeet !== undefined) {
      properties = properties.filter(p => p.squareFeet >= filters.minSquareFeet!);
    }

    if (filters.maxSquareFeet !== undefined) {
      properties = properties.filter(p => p.squareFeet <= filters.maxSquareFeet!);
    }

    if (filters.propertyType) {
      properties = properties.filter(p => p.propertyType === filters.propertyType);
    }

    if (filters.minValue !== undefined || filters.maxValue !== undefined) {
      properties = properties.filter(p => {
        if (!p.value) return false;
        
        const numValue = parseFloat(p.value.replace(/[^0-9.-]+/g, ''));
        
        if (filters.minValue !== undefined && numValue < filters.minValue) {
          return false;
        }
        
        if (filters.maxValue !== undefined && numValue > filters.maxValue) {
          return false;
        }
        
        return true;
      });
    }

    // Apply sorting
    if (filters.sortBy) {
      const sortOrder = filters.sortOrder === 'desc' ? -1 : 1;
      
      properties.sort((a, b) => {
        const aValue = a[filters.sortBy as keyof Property];
        const bValue = b[filters.sortBy as keyof Property];
        
        if (typeof aValue === 'string' && typeof bValue === 'string') {
          return sortOrder * aValue.localeCompare(bValue);
        }
        
        if (typeof aValue === 'number' && typeof bValue === 'number') {
          return sortOrder * (aValue - bValue);
        }
        
        if (!aValue && bValue) return sortOrder;
        if (aValue && !bValue) return -sortOrder;
        
        return 0;
      });
    }

    // Apply pagination
    const offset = filters.offset || 0;
    const limit = filters.limit || properties.length;
    
    return properties.slice(offset, offset + limit);
  }

  async getPropertiesInRegion(bounds: [number, number, number, number]): Promise<Property[]> {
    const [south, west, north, east] = bounds;
    
    return Object.values(this.properties).filter(property => {
      if (!property.coordinates) return false;
      
      // Check if coordinates is an array or use latitude/longitude fields
      if (property.coordinates && Array.isArray(property.coordinates)) {
        const [lat, lng] = property.coordinates;
        return lat >= south && lat <= north && lng >= west && lng <= east;
      } else if (property.latitude && property.longitude) {
        return Number(property.latitude) >= south && Number(property.latitude) <= north && 
               Number(property.longitude) >= west && Number(property.longitude) <= east;
      }
      return false;
    });
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.propertyCurrentId++;
    const property: Property = { 
      id,
      parcelId: insertProperty.parcelId,
      address: insertProperty.address,
      owner: insertProperty.owner || null,
      value: insertProperty.value || null,
      salePrice: insertProperty.salePrice || null,
      squareFeet: insertProperty.squareFeet,
      yearBuilt: insertProperty.yearBuilt || null,
      landValue: insertProperty.landValue || null,
      coordinates: insertProperty.coordinates || null,
      latitude: insertProperty.latitude || null,
      longitude: insertProperty.longitude || null,
      neighborhood: insertProperty.neighborhood || null,
      propertyType: insertProperty.propertyType || null,
      bedrooms: insertProperty.bedrooms || null,
      bathrooms: insertProperty.bathrooms || null,
      lotSize: insertProperty.lotSize || null,
      zoning: insertProperty.zoning || null,
      lastSaleDate: insertProperty.lastSaleDate || null,
      taxAssessment: insertProperty.taxAssessment || null,
      pricePerSqFt: insertProperty.pricePerSqFt || null,
      attributes: insertProperty.attributes || {},
      sourceId: insertProperty.sourceId || null,
      zillowId: insertProperty.zillowId || null
    };
    this.properties[id] = property;
    return property;
  }

  async searchProperties(searchText: string): Promise<Property[]> {
    if (!searchText) {
      return [];
    }
    
    const searchLower = searchText.toLowerCase();
    
    return Object.values(this.properties).filter(property => {
      const address = property.address.toLowerCase();
      const owner = property.owner?.toLowerCase() || '';
      const parcelId = property.parcelId.toLowerCase();
      const neighborhood = property.neighborhood?.toLowerCase() || '';
      
      return (
        address.includes(searchLower) ||
        owner.includes(searchLower) ||
        parcelId.includes(searchLower) ||
        neighborhood.includes(searchLower)
      );
    });
  }

  // Income Hotel/Motel operations
  async getIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotel | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}`;
    return this.incomeHotelMotelMap[key];
  }

  async createIncomeHotelMotel(incomeHotelMotel: InsertIncomeHotelMotel): Promise<IncomeHotelMotel> {
    const key = `${incomeHotelMotel.incomeYear}-${incomeHotelMotel.supNum}-${incomeHotelMotel.incomeId}`;
    
    const newItem: IncomeHotelMotel = {
      incomeYear: incomeHotelMotel.incomeYear,
      supNum: incomeHotelMotel.supNum,
      incomeId: incomeHotelMotel.incomeId,
      sizeInSqft: incomeHotelMotel.sizeInSqft || "0",
      averageDailyRoomRate: incomeHotelMotel.averageDailyRoomRate || "0",
      numberOfRooms: incomeHotelMotel.numberOfRooms || "0",
      numberOfRoomNights: incomeHotelMotel.numberOfRoomNights || "0",
      incomeValueReconciled: incomeHotelMotel.incomeValueReconciled || "0",
      incomeValuePerRoom: incomeHotelMotel.incomeValuePerRoom || "0",
      assessmentValuePerRoom: incomeHotelMotel.assessmentValuePerRoom || "0",
      incomeValuePerSqft: incomeHotelMotel.incomeValuePerSqft || "0",
      assessmentValuePerSqft: incomeHotelMotel.assessmentValuePerSqft || "0"
    };
    
    this.incomeHotelMotelMap[key] = newItem;
    return newItem;
  }

  async updateIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number, incomeHotelMotel: Partial<InsertIncomeHotelMotel>): Promise<IncomeHotelMotel | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}`;
    const existingItem = this.incomeHotelMotelMap[key];
    
    if (!existingItem) {
      return undefined;
    }
    
    const updatedItem: IncomeHotelMotel = { ...existingItem, ...incomeHotelMotel };
    this.incomeHotelMotelMap[key] = updatedItem;
    
    return updatedItem;
  }

  // Income Hotel/Motel Detail operations
  async getIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string): Promise<IncomeHotelMotelDetail | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}-${valueType}`;
    return this.incomeHotelMotelDetailMap[key];
  }

  async getIncomeHotelMotelDetails(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotelDetail[]> {
    const prefix = `${incomeYear}-${supNum}-${incomeId}-`;
    
    return Object.entries(this.incomeHotelMotelDetailMap)
      .filter(([key]) => key.startsWith(prefix))
      .map(([_, value]) => value as IncomeHotelMotelDetail);
  }

  async createIncomeHotelMotelDetail(incomeHotelMotelDetail: InsertIncomeHotelMotelDetail): Promise<IncomeHotelMotelDetail> {
    const key = `${incomeHotelMotelDetail.incomeYear}-${incomeHotelMotelDetail.supNum}-${incomeHotelMotelDetail.incomeId}-${incomeHotelMotelDetail.valueType}`;
    
    const newItem: IncomeHotelMotelDetail = {
      incomeYear: incomeHotelMotelDetail.incomeYear,
      supNum: incomeHotelMotelDetail.supNum,
      incomeId: incomeHotelMotelDetail.incomeId,
      valueType: incomeHotelMotelDetail.valueType,
      roomRevenue: incomeHotelMotelDetail.roomRevenue || "0",
      roomRevenuePct: incomeHotelMotelDetail.roomRevenuePct || "0",
      roomRevenueUpdate: incomeHotelMotelDetail.roomRevenueUpdate || "",
      vacancyCollectionLoss: incomeHotelMotelDetail.vacancyCollectionLoss || "0",
      vacancyCollectionLossPct: incomeHotelMotelDetail.vacancyCollectionLossPct || "0",
      vacancyCollectionLossUpdate: incomeHotelMotelDetail.vacancyCollectionLossUpdate || "",
      foodBeverageIncome: incomeHotelMotelDetail.foodBeverageIncome || "0",
      foodBeverageIncomePct: incomeHotelMotelDetail.foodBeverageIncomePct || "0",
      foodBeverageIncomeUpdate: incomeHotelMotelDetail.foodBeverageIncomeUpdate || "",
      miscIncome: incomeHotelMotelDetail.miscIncome || "0",
      miscIncomePct: incomeHotelMotelDetail.miscIncomePct || "0",
      miscIncomeUpdate: incomeHotelMotelDetail.miscIncomeUpdate || "",
      effectiveGrossIncome: incomeHotelMotelDetail.effectiveGrossIncome || "0",
      effectiveGrossIncomePct: incomeHotelMotelDetail.effectiveGrossIncomePct || "0",
      utilities: incomeHotelMotelDetail.utilities || "0",
      utilitiesPct: incomeHotelMotelDetail.utilitiesPct || "0",
      utilitiesUpdate: incomeHotelMotelDetail.utilitiesUpdate || "",
      maintenanceRepair: incomeHotelMotelDetail.maintenanceRepair || "0",
      maintenanceRepairPct: incomeHotelMotelDetail.maintenanceRepairPct || "0",
      maintenanceRepairUpdate: incomeHotelMotelDetail.maintenanceRepairUpdate || "",
      departmentExpenses: incomeHotelMotelDetail.departmentExpenses || "0",
      departmentExpensesPct: incomeHotelMotelDetail.departmentExpensesPct || "0",
      departmentExpensesUpdate: incomeHotelMotelDetail.departmentExpensesUpdate || "",
      management: incomeHotelMotelDetail.management || "0",
      managementPct: incomeHotelMotelDetail.managementPct || "0",
      managementUpdate: incomeHotelMotelDetail.managementUpdate || "",
      administrative: incomeHotelMotelDetail.administrative || "0",
      administrativePct: incomeHotelMotelDetail.administrativePct || "0",
      administrativeUpdate: incomeHotelMotelDetail.administrativeUpdate || "",
      payroll: incomeHotelMotelDetail.payroll || "0",
      payrollPct: incomeHotelMotelDetail.payrollPct || "0",
      payrollUpdate: incomeHotelMotelDetail.payrollUpdate || "",
      insurance: incomeHotelMotelDetail.insurance || "0",
      insurancePct: incomeHotelMotelDetail.insurancePct || "0",
      insuranceUpdate: incomeHotelMotelDetail.insuranceUpdate || "",
      marketing: incomeHotelMotelDetail.marketing || "0",
      marketingPct: incomeHotelMotelDetail.marketingPct || "0",
      marketingUpdate: incomeHotelMotelDetail.marketingUpdate || "",
      realEstateTax: incomeHotelMotelDetail.realEstateTax || "0",
      realEstateTaxPct: incomeHotelMotelDetail.realEstateTaxPct || "0",
      realEstateTaxUpdate: incomeHotelMotelDetail.realEstateTaxUpdate || "",
      franchiseFee: incomeHotelMotelDetail.franchiseFee || "0",
      franchiseFeePct: incomeHotelMotelDetail.franchiseFeePct || "0",
      franchiseFeeUpdate: incomeHotelMotelDetail.franchiseFeeUpdate || "",
      other: incomeHotelMotelDetail.other || "0",
      otherPct: incomeHotelMotelDetail.otherPct || "0",
      otherUpdate: incomeHotelMotelDetail.otherUpdate || "",
      totalExpenses: incomeHotelMotelDetail.totalExpenses || "0",
      totalExpensesPct: incomeHotelMotelDetail.totalExpensesPct || "0",
      totalExpensesUpdate: incomeHotelMotelDetail.totalExpensesUpdate || "",
      netOperatingIncome: incomeHotelMotelDetail.netOperatingIncome || "0",
      netOperatingIncomePct: incomeHotelMotelDetail.netOperatingIncomePct || "0",
      capRate: incomeHotelMotelDetail.capRate || "0",
      capRateUpdate: incomeHotelMotelDetail.capRateUpdate || "",
      taxRate: incomeHotelMotelDetail.taxRate || "0",
      taxRateUpdate: incomeHotelMotelDetail.taxRateUpdate || "",
      overallCapRate: incomeHotelMotelDetail.overallCapRate || "0",
      incomeValue: incomeHotelMotelDetail.incomeValue || "0",
      personalPropertyValue: incomeHotelMotelDetail.personalPropertyValue || "0",
      personalPropertyValueUpdate: incomeHotelMotelDetail.personalPropertyValueUpdate || "",
      otherValue: incomeHotelMotelDetail.otherValue || "0",
      otherValueUpdate: incomeHotelMotelDetail.otherValueUpdate || "",
      indicatedIncomeValue: incomeHotelMotelDetail.indicatedIncomeValue || "0"
    };
    
    this.incomeHotelMotelDetailMap[key] = newItem;
    return newItem;
  }

  async updateIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string, incomeHotelMotelDetail: Partial<InsertIncomeHotelMotelDetail>): Promise<IncomeHotelMotelDetail | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}-${valueType}`;
    const existingItem = this.incomeHotelMotelDetailMap[key];
    
    if (!existingItem) {
      return undefined;
    }
    
    const updatedItem: IncomeHotelMotelDetail = { ...existingItem, ...incomeHotelMotelDetail };
    this.incomeHotelMotelDetailMap[key] = updatedItem;
    
    return updatedItem;
  }

  // Income Lease Up operations
  async getIncomeLeaseUp(incomeLeaseUpId: number): Promise<IncomeLeaseUp | undefined> {
    return this.incomeLeaseUpMap[incomeLeaseUpId];
  }

  async getIncomeLeaseUpsByIncomeId(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeLeaseUp[]> {
    return Object.values(this.incomeLeaseUpMap)
      .filter(leaseUp => 
        Number(leaseUp.incomeYear) === incomeYear && 
        leaseUp.supNum === supNum && 
        leaseUp.incomeId === incomeId
      );
  }

  async createIncomeLeaseUp(incomeLeaseUp: InsertIncomeLeaseUp): Promise<IncomeLeaseUp> {
    const incomeLeaseUpId = this.incomeLeaseUpCurrentId++;
    
    const newItem: IncomeLeaseUp = {
      incomeYear: incomeLeaseUp.incomeYear,
      supNum: incomeLeaseUp.supNum,
      incomeId: incomeLeaseUp.incomeId,
      incomeLeaseUpId: incomeLeaseUpId,
      frequency: incomeLeaseUp.frequency || "A",
      leaseType: incomeLeaseUp.leaseType || null,
      unitOfMeasure: incomeLeaseUp.unitOfMeasure || null,
      rentLossAreaSqft: incomeLeaseUp.rentLossAreaSqft || null,
      rentSqft: incomeLeaseUp.rentSqft || null,
      rentNumberOfYears: incomeLeaseUp.rentNumberOfYears || null,
      rentTotal: incomeLeaseUp.rentTotal || null,
      leasePct: incomeLeaseUp.leasePct || null,
      leaseTotal: incomeLeaseUp.leaseTotal || null
    };
    
    this.incomeLeaseUpMap[incomeLeaseUpId] = newItem;
    return newItem;
  }

  async updateIncomeLeaseUp(incomeLeaseUpId: number, incomeLeaseUp: Partial<InsertIncomeLeaseUp>): Promise<IncomeLeaseUp | undefined> {
    const existingItem = this.incomeLeaseUpMap[incomeLeaseUpId];
    
    if (!existingItem) {
      return undefined;
    }
    
    const updatedItem: IncomeLeaseUp = { ...existingItem, ...incomeLeaseUp };
    this.incomeLeaseUpMap[incomeLeaseUpId] = updatedItem;
    
    return updatedItem;
  }

  async deleteIncomeLeaseUp(incomeLeaseUpId: number): Promise<boolean> {
    if (this.incomeLeaseUpMap[incomeLeaseUpId]) {
      delete this.incomeLeaseUpMap[incomeLeaseUpId];
      return true;
    }
    return false;
  }
  
  // ETL Data Source operations
  async getEtlDataSources(): Promise<EtlDataSource[]> {
    return Object.values(this.etlDataSourcesMap);
  }
  
  async getEtlDataSourceById(id: number): Promise<EtlDataSource | undefined> {
    return this.etlDataSourcesMap[id];
  }
  
  async createEtlDataSource(dataSource: InsertEtlDataSource): Promise<EtlDataSource> {
    const id = this.etlDataSourceCurrentId++;
    const newDataSource: EtlDataSource = {
      id,
      name: dataSource.name,
      description: dataSource.description || null,
      type: dataSource.type,
      connectionDetails: dataSource.connectionDetails,
      isConnected: dataSource.isConnected || false,
      lastConnected: dataSource.lastConnected ? new Date(dataSource.lastConnected) : null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.etlDataSourcesMap[id] = newDataSource;
    return newDataSource;
  }
  
  async updateEtlDataSource(id: number, dataSource: Partial<InsertEtlDataSource>): Promise<EtlDataSource | undefined> {
    const existingDataSource = this.etlDataSourcesMap[id];
    if (!existingDataSource) {
      return undefined;
    }
    
    const updatedDataSource: EtlDataSource = {
      ...existingDataSource,
      ...dataSource,
      lastConnected: dataSource.lastConnected ? new Date(dataSource.lastConnected) : existingDataSource.lastConnected,
      updatedAt: new Date()
    };
    
    this.etlDataSourcesMap[id] = updatedDataSource;
    return updatedDataSource;
  }
  
  async deleteEtlDataSource(id: number): Promise<boolean> {
    if (this.etlDataSourcesMap[id]) {
      delete this.etlDataSourcesMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Transformation Rule operations
  async getEtlTransformationRules(): Promise<EtlTransformationRule[]> {
    return Object.values(this.etlTransformationRulesMap);
  }
  
  async getEtlTransformationRuleById(id: number): Promise<EtlTransformationRule | undefined> {
    return this.etlTransformationRulesMap[id];
  }
  
  async createEtlTransformationRule(rule: InsertEtlTransformationRule): Promise<EtlTransformationRule> {
    const id = this.etlTransformationRuleCurrentId++;
    const newRule: EtlTransformationRule = {
      id,
      name: rule.name,
      description: rule.description || null,
      dataType: rule.dataType,
      transformationCode: rule.transformationCode,
      isActive: rule.isActive !== undefined ? rule.isActive : true,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.etlTransformationRulesMap[id] = newRule;
    return newRule;
  }
  
  async updateEtlTransformationRule(id: number, rule: Partial<InsertEtlTransformationRule>): Promise<EtlTransformationRule | undefined> {
    const existingRule = this.etlTransformationRulesMap[id];
    if (!existingRule) {
      return undefined;
    }
    
    const updatedRule: EtlTransformationRule = {
      ...existingRule,
      ...rule,
      updatedAt: new Date()
    };
    
    this.etlTransformationRulesMap[id] = updatedRule;
    return updatedRule;
  }
  
  async deleteEtlTransformationRule(id: number): Promise<boolean> {
    if (this.etlTransformationRulesMap[id]) {
      delete this.etlTransformationRulesMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Job operations
  async getEtlJobs(): Promise<EtlJob[]> {
    return Object.values(this.etlJobsMap);
  }
  
  async getEtlJobById(id: number): Promise<EtlJob | undefined> {
    return this.etlJobsMap[id];
  }
  
  async createEtlJob(job: InsertEtlJob): Promise<EtlJob> {
    const id = this.etlJobCurrentId++;
    const newJob: EtlJob = {
      id,
      name: job.name,
      description: job.description || null,
      sourceId: job.sourceId,
      targetId: job.targetId,
      transformationIds: job.transformationIds || [],
      status: job.status || "idle",
      schedule: job.schedule,
      metrics: job.metrics || {},
      createdAt: new Date(),
      updatedAt: new Date(),
      lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : null
    };
    this.etlJobsMap[id] = newJob;
    return newJob;
  }
  
  async updateEtlJob(id: number, job: Partial<InsertEtlJob>): Promise<EtlJob | undefined> {
    const existingJob = this.etlJobsMap[id];
    if (!existingJob) {
      return undefined;
    }
    
    const updatedJob: EtlJob = {
      ...existingJob,
      ...job,
      lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : existingJob.lastRunAt,
      updatedAt: new Date()
    };
    
    this.etlJobsMap[id] = updatedJob;
    return updatedJob;
  }
  
  async deleteEtlJob(id: number): Promise<boolean> {
    if (this.etlJobsMap[id]) {
      delete this.etlJobsMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Optimization Suggestion operations
  async getEtlOptimizationSuggestions(): Promise<EtlOptimizationSuggestion[]> {
    return Object.values(this.etlOptimizationSuggestionsMap);
  }
  
  async getEtlOptimizationSuggestionsByJobId(jobId: number): Promise<EtlOptimizationSuggestion[]> {
    return Object.values(this.etlOptimizationSuggestionsMap)
      .filter(suggestion => suggestion.jobId === jobId);
  }
  
  async getEtlOptimizationSuggestionById(id: number): Promise<EtlOptimizationSuggestion | undefined> {
    return this.etlOptimizationSuggestionsMap[id];
  }
  
  async createEtlOptimizationSuggestion(suggestion: InsertEtlOptimizationSuggestion): Promise<EtlOptimizationSuggestion> {
    const id = this.etlOptimizationSuggestionCurrentId++;
    const newSuggestion: EtlOptimizationSuggestion = {
      id,
      jobId: suggestion.jobId,
      type: suggestion.type,
      severity: suggestion.severity,
      title: suggestion.title,
      description: suggestion.description,
      suggestedAction: suggestion.suggestedAction,
      estimatedImprovement: suggestion.estimatedImprovement,
      status: suggestion.status || "new",
      category: suggestion.category || null,
      implementationComplexity: suggestion.implementationComplexity || null,
      suggestedCode: suggestion.suggestedCode || null,
      createdAt: new Date(),
      updatedAt: new Date()
    };
    this.etlOptimizationSuggestionsMap[id] = newSuggestion;
    return newSuggestion;
  }
  
  async updateEtlOptimizationSuggestion(id: number, suggestion: Partial<InsertEtlOptimizationSuggestion>): Promise<EtlOptimizationSuggestion | undefined> {
    const existingSuggestion = this.etlOptimizationSuggestionsMap[id];
    if (!existingSuggestion) {
      return undefined;
    }
    
    const updatedSuggestion: EtlOptimizationSuggestion = {
      ...existingSuggestion,
      ...suggestion,
      updatedAt: new Date()
    };
    
    this.etlOptimizationSuggestionsMap[id] = updatedSuggestion;
    return updatedSuggestion;
  }
  
  async deleteEtlOptimizationSuggestion(id: number): Promise<boolean> {
    if (this.etlOptimizationSuggestionsMap[id]) {
      delete this.etlOptimizationSuggestionsMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Batch Job operations
  async getEtlBatchJobs(): Promise<EtlBatchJob[]> {
    return Object.values(this.etlBatchJobsMap);
  }
  
  async getEtlBatchJobById(id: number): Promise<EtlBatchJob | undefined> {
    return this.etlBatchJobsMap[id];
  }
  
  async createEtlBatchJob(batchJob: InsertEtlBatchJob): Promise<EtlBatchJob> {
    const id = this.etlBatchJobCurrentId++;
    const newBatchJob: EtlBatchJob = {
      id,
      name: batchJob.name,
      description: batchJob.description || null,
      jobIds: batchJob.jobIds,
      status: batchJob.status || "idle",
      progress: batchJob.progress || 0,
      createdAt: new Date(),
      updatedAt: new Date(),
      startedAt: batchJob.startedAt ? new Date(batchJob.startedAt) : null,
      completedAt: batchJob.completedAt ? new Date(batchJob.completedAt) : null
    };
    this.etlBatchJobsMap[id] = newBatchJob;
    return newBatchJob;
  }
  
  async updateEtlBatchJob(id: number, batchJob: Partial<InsertEtlBatchJob>): Promise<EtlBatchJob | undefined> {
    const existingBatchJob = this.etlBatchJobsMap[id];
    if (!existingBatchJob) {
      return undefined;
    }
    
    const updatedBatchJob: EtlBatchJob = {
      ...existingBatchJob,
      ...batchJob,
      startedAt: batchJob.startedAt ? new Date(batchJob.startedAt) : existingBatchJob.startedAt,
      completedAt: batchJob.completedAt ? new Date(batchJob.completedAt) : existingBatchJob.completedAt,
      updatedAt: new Date()
    };
    
    this.etlBatchJobsMap[id] = updatedBatchJob;
    return updatedBatchJob;
  }
  
  async deleteEtlBatchJob(id: number): Promise<boolean> {
    if (this.etlBatchJobsMap[id]) {
      delete this.etlBatchJobsMap[id];
      return true;
    }
    return false;
  }
  
  // ETL Alert operations
  async getEtlAlerts(): Promise<EtlAlert[]> {
    return Object.values(this.etlAlertsMap);
  }
  
  async getEtlAlertsByJobId(jobId: number): Promise<EtlAlert[]> {
    return Object.values(this.etlAlertsMap)
      .filter(alert => alert.jobId === jobId);
  }
  
  async getEtlAlertById(id: number): Promise<EtlAlert | undefined> {
    return this.etlAlertsMap[id];
  }
  
  async createEtlAlert(alert: InsertEtlAlert): Promise<EtlAlert> {
    const id = this.etlAlertCurrentId++;
    const newAlert: EtlAlert = {
      id,
      jobId: alert.jobId,
      type: alert.type,
      message: alert.message,
      details: alert.details || null,
      timestamp: new Date(),
      isRead: alert.isRead || false
    };
    this.etlAlertsMap[id] = newAlert;
    return newAlert;
  }
  
  async updateEtlAlert(id: number, alert: Partial<InsertEtlAlert>): Promise<EtlAlert | undefined> {
    const existingAlert = this.etlAlertsMap[id];
    if (!existingAlert) {
      return undefined;
    }
    
    const updatedAlert: EtlAlert = {
      ...existingAlert,
      ...alert
    };
    
    this.etlAlertsMap[id] = updatedAlert;
    return updatedAlert;
  }
  
  async deleteEtlAlert(id: number): Promise<boolean> {
    if (this.etlAlertsMap[id]) {
      delete this.etlAlertsMap[id];
      return true;
    }
    return false;
  }

  private initializeSampleProperties() {
    // Benton County, WA neighborhoods
    const neighborhoods = ['West Richland', 'Kennewick', 'Richland', 'Prosser', 'Benton City'];
    const propertyTypes = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family', 'Vacant Land', 'Commercial'];
    const zoningTypes = ['Residential', 'Commercial', 'Agricultural', 'Industrial', 'Mixed Use'];
    
    // Add 50 sample properties for Benton County, WA
    const sampleProperties = Array(50).fill(0).map((_, index) => {
      const id = this.propertyCurrentId++;
      const neighborhood = neighborhoods[Math.floor(Math.random() * neighborhoods.length)];
      const propertyType = propertyTypes[Math.floor(Math.random() * propertyTypes.length)];
      const zoning = zoningTypes[Math.floor(Math.random() * zoningTypes.length)];
      
      // Generate coordinates in Benton County, WA (approximate)
      const lat = 46.2 + Math.random() * 0.3; // 46.2 to 46.5
      const lng = -119.4 + Math.random() * 0.5; // -119.4 to -118.9
      
      const squareFeet = Math.floor(800 + Math.random() * 3000);
      const lotSize = Math.floor(5000 + Math.random() * 20000);
      const yearBuilt = Math.floor(1950 + Math.random() * 73); // 1950 to 2023
      
      // Randomize bedrooms and bathrooms based on property type
      let bedrooms = 0;
      let bathrooms = 0;
      
      if (propertyType === 'Single Family' || propertyType === 'Multi-Family') {
        bedrooms = Math.floor(2 + Math.random() * 5); // 2 to 6
        bathrooms = Math.floor(1 + Math.random() * 4); // 1 to 4
      } else if (propertyType === 'Condo' || propertyType === 'Townhouse') {
        bedrooms = Math.floor(1 + Math.random() * 3); // 1 to 3
        bathrooms = Math.floor(1 + Math.random() * 2.5); // 1 to 2.5
      }
      
      const baseValue = squareFeet * (100 + Math.random() * 300);
      const value = `$${Math.floor(baseValue).toLocaleString()}`;
      const landValue = `$${Math.floor(lotSize * (5 + Math.random() * 15)).toLocaleString()}`;
      const salePrice = Math.random() > 0.3 
        ? `$${Math.floor(baseValue * (0.9 + Math.random() * 0.3)).toLocaleString()}`
        : null;
      
      const pricePerSqFt = `$${Math.floor(baseValue / squareFeet).toLocaleString()}`;
      
      const lastSaleDate = Math.random() > 0.3 
        ? new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : null;
        
      const taxAssessment = `$${Math.floor(baseValue * 0.85).toLocaleString()}`;
      
      const property: Property = {
        id,
        parcelId: `${neighborhood.slice(0, 2).toUpperCase()}${id.toString().padStart(6, '0')}`,
        address: `${Math.floor(100 + Math.random() * 9900)} ${['Main', 'Oak', 'Maple', 'Washington', 'Canyon', 'River', 'Valley', 'Desert', 'Vineyard', 'Cherry'][Math.floor(Math.random() * 10)]} ${['St', 'Ave', 'Blvd', 'Dr', 'Ln', 'Way', 'Rd'][Math.floor(Math.random() * 7)]}, ${neighborhood}, WA`,
        owner: `${['Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson', 'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin', 'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee', 'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King'][Math.floor(Math.random() * 30)]} Family`,
        value,
        salePrice,
        squareFeet,
        yearBuilt,
        landValue,
        coordinates: [lat, lng],
        latitude: lat.toString(),
        longitude: lng.toString(),
        neighborhood,
        propertyType,
        bedrooms,
        bathrooms,
        lotSize,
        zoning,
        lastSaleDate,
        taxAssessment,
        pricePerSqFt,
        attributes: {},
        sourceId: 1, // Default to internal database source
        zillowId: null // No Zillow ID for sample data
      };
      
      return property;
    });
    
    // Store properties in the map
    sampleProperties.forEach(property => {
      this.properties[property.id] = property;
    });
  }
  
  private initializeSampleEtlData() {
    // Initialize ETL Data Sources
    const dataSources: InsertEtlDataSource[] = [
      {
        name: "Benton County Property Database",
        description: "Main county property data source containing assessment records",
        type: "database",
        connectionDetails: {
          databaseType: "postgresql",
          host: "county-db.bentoncounty.gov",
          port: 5432,
          database: "property_records",
          schema: "public"
        },
        isConnected: true,
        lastConnected: new Date()
      },
      {
        name: "Washington State GIS Portal",
        description: "State-level GIS data for geospatial analysis",
        type: "api",
        connectionDetails: {
          endpoint: "https://gis-api.wa.gov/property",
          authType: "apiKey",
          rateLimitPerMinute: 100
        },
        isConnected: true,
        lastConnected: new Date()
      },
      {
        name: "Census Bureau API",
        description: "Demographic data from US Census Bureau",
        type: "api",
        connectionDetails: {
          endpoint: "https://api.census.gov/data/latest",
          authType: "apiKey",
          rateLimitPerMinute: 500
        },
        isConnected: true,
        lastConnected: new Date()
      },
      {
        name: "Historical Property Sales CSV",
        description: "Historical property sales data in CSV format",
        type: "file",
        connectionDetails: {
          fileType: "csv",
          path: "/data/historical_sales.csv",
          hasHeader: true
        },
        isConnected: true,
        lastConnected: new Date()
      },
      {
        name: "Local PostGIS Database",
        description: "Local geospatial database for analysis",
        type: "database",
        connectionDetails: {
          databaseType: "postgresql",
          host: "localhost",
          port: 5432,
          database: "postgis_data",
          schema: "public",
          extensions: ["postgis"]
        },
        isConnected: true,
        lastConnected: new Date()
      }
    ];
    
    // Add data sources to the map
    dataSources.forEach(source => {
      const id = this.etlDataSourceCurrentId++;
      const dataSource: EtlDataSource = {
        id,
        name: source.name,
        description: source.description || null,
        type: source.type,
        connectionDetails: source.connectionDetails,
        isConnected: source.isConnected || false,
        lastConnected: source.lastConnected ? new Date(source.lastConnected) : null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.etlDataSourcesMap[id] = dataSource;
    });
    
    // Initialize ETL Transformation Rules
    const transformationRules: InsertEtlTransformationRule[] = [
      {
        name: "Normalize Address Format",
        description: "Standardizes address formats to USPS standards",
        dataType: "text",
        transformationCode: `
          function normalizeAddress(address) {
            // Convert to uppercase
            let result = address.toUpperCase();
            // Replace abbreviated directions
            result = result.replace(/\\bN\\b/g, 'NORTH')
                          .replace(/\\bS\\b/g, 'SOUTH')
                          .replace(/\\bE\\b/g, 'EAST')
                          .replace(/\\bW\\b/g, 'WEST');
            // Standardize common abbreviations
            result = result.replace(/\\bST\\b/g, 'STREET')
                          .replace(/\\bAVE\\b/g, 'AVENUE')
                          .replace(/\\bRD\\b/g, 'ROAD');
            return result;
          }
        `,
        isActive: true
      },
      {
        name: "Calculate Price Per Square Foot",
        description: "Computes the price per square foot from sale price and area",
        dataType: "number",
        transformationCode: `
          function calculatePricePerSqFt(salePrice, squareFeet) {
            // Remove currency symbols and commas
            const price = parseFloat(salePrice.replace(/[$,]/g, ''));
            // Guard against division by zero
            if (!squareFeet || squareFeet <= 0) return null;
            // Calculate and format to 2 decimal places
            return (price / squareFeet).toFixed(2);
          }
        `,
        isActive: true
      },
      {
        name: "Parse GeoJSON to Coordinates",
        description: "Extracts lat/long coordinates from GeoJSON format",
        dataType: "object",
        transformationCode: `
          function parseGeoJSON(geojson) {
            try {
              const data = JSON.parse(geojson);
              if (data.type === 'Point' && Array.isArray(data.coordinates)) {
                return {
                  longitude: data.coordinates[0],
                  latitude: data.coordinates[1]
                };
              }
              return null;
            } catch (e) {
              return null;
            }
          }
        `,
        isActive: true
      },
      {
        name: "Date Format Standardization",
        description: "Converts various date formats to ISO standard",
        dataType: "date",
        transformationCode: `
          function standardizeDate(dateString) {
            // Try to parse the date using various formats
            const date = new Date(dateString);
            // Check if date is valid
            if (isNaN(date.getTime())) return null;
            // Return ISO format
            return date.toISOString().split('T')[0];
          }
        `,
        isActive: true
      },
      {
        name: "Clean Property Type Classification",
        description: "Maps various property type descriptions to standard categories",
        dataType: "text",
        transformationCode: `
          function standardizePropertyType(typeString) {
            const typeMap = {
              'SFR': 'Single Family',
              'SINGLE FAMILY': 'Single Family',
              'SINGLE-FAMILY': 'Single Family',
              'APT': 'Apartment',
              'APARTMENT': 'Apartment',
              'CONDO': 'Condominium',
              'CONDOMINIUM': 'Condominium',
              'COMMERCIAL': 'Commercial',
              'COM': 'Commercial',
              'IND': 'Industrial',
              'INDUSTRIAL': 'Industrial',
              'VACANT': 'Vacant Land',
              'VAC': 'Vacant Land'
            };
            
            const type = typeString.toUpperCase().trim();
            return typeMap[type] || 'Other';
          }
        `,
        isActive: true
      }
    ];
    
    // Add transformation rules to the map
    transformationRules.forEach(rule => {
      const id = this.etlTransformationRuleCurrentId++;
      const transformationRule: EtlTransformationRule = {
        id,
        name: rule.name,
        description: rule.description || null,
        dataType: rule.dataType,
        transformationCode: rule.transformationCode,
        isActive: rule.isActive !== undefined ? rule.isActive : true,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.etlTransformationRulesMap[id] = transformationRule;
    });
    
    // Initialize ETL Jobs
    const jobs: InsertEtlJob[] = [
      {
        name: "Daily Property Update",
        description: "Imports new and updated properties from county database",
        sourceId: 1, // Reference to Benton County Property Database
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [1, 2, 3, 4, 5], // Reference to transformation rules
        status: "success",
        schedule: {
          frequency: "daily",
          time: "02:00",
          timezone: "America/Los_Angeles"
        },
        metrics: {
          lastExecutionTime: 187.4, // seconds
          recordsProcessed: 1250,
          memoryUsage: 512, // MB
          cpuUtilization: 45.2, // percentage
          successRate: 99.8 // percentage
        },
        lastRunAt: new Date(Date.now() - 3600000) // 1 hour ago
      },
      {
        name: "Weekly Census Data Integration",
        description: "Imports demographic data for property analysis",
        sourceId: 3, // Reference to Census Bureau API
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [3, 4], // Reference to transformation rules
        status: "idle",
        schedule: {
          frequency: "weekly",
          dayOfWeek: "Sunday",
          time: "03:00",
          timezone: "America/Los_Angeles"
        },
        metrics: {
          lastExecutionTime: 432.1, // seconds
          recordsProcessed: 5200,
          memoryUsage: 1024, // MB
          cpuUtilization: 75.3, // percentage
          successRate: 100 // percentage
        },
        lastRunAt: new Date(Date.now() - 86400000 * 5) // 5 days ago
      },
      {
        name: "Historical Sales Data Import",
        description: "One-time import of historical sales data",
        sourceId: 4, // Reference to Historical Property Sales CSV
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [2, 4], // Reference to transformation rules
        status: "success",
        schedule: null, // One-time job, no schedule
        metrics: {
          lastExecutionTime: 1456.7, // seconds
          recordsProcessed: 25000,
          memoryUsage: 2048, // MB
          cpuUtilization: 92.1, // percentage
          successRate: 99.5 // percentage
        },
        lastRunAt: new Date(Date.now() - 86400000 * 30) // 30 days ago
      },
      {
        name: "GIS Boundary Update",
        description: "Updates property boundaries from state GIS data",
        sourceId: 2, // Reference to Washington State GIS Portal
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [3], // Reference to transformation rules
        status: "failed",
        schedule: {
          frequency: "monthly",
          dayOfMonth: 1,
          time: "01:00",
          timezone: "America/Los_Angeles"
        },
        metrics: {
          lastExecutionTime: 856.3, // seconds
          recordsProcessed: 7500,
          memoryUsage: 1536, // MB
          cpuUtilization: 85.4, // percentage
          successRate: 68.2 // percentage
        },
        lastRunAt: new Date(Date.now() - 86400000 * 2) // 2 days ago
      },
      {
        name: "Real-time Property Sales Feed",
        description: "Streams real-time property sales data",
        sourceId: 1, // Reference to Benton County Property Database
        targetId: 5, // Reference to Local PostGIS Database
        transformationIds: [1, 2, 4], // Reference to transformation rules
        status: "running",
        schedule: {
          frequency: "continuous",
          pollingInterval: 300 // seconds
        },
        metrics: {
          lastExecutionTime: "ongoing",
          recordsProcessed: 150,
          memoryUsage: 384, // MB
          cpuUtilization: 25.6, // percentage
          successRate: 100 // percentage
        },
        lastRunAt: new Date() // Now
      }
    ];
    
    // Add jobs to the map
    jobs.forEach(job => {
      const id = this.etlJobCurrentId++;
      const etlJob: EtlJob = {
        id,
        name: job.name,
        description: job.description || null,
        sourceId: job.sourceId,
        targetId: job.targetId,
        transformationIds: job.transformationIds,
        status: job.status || 'idle',
        schedule: job.schedule,
        metrics: job.metrics,
        createdAt: new Date(),
        updatedAt: new Date(),
        lastRunAt: job.lastRunAt ? new Date(job.lastRunAt) : null
      };
      this.etlJobsMap[id] = etlJob;
    });
    
    // Initialize ETL Optimization Suggestions
    const optimizationSuggestions: InsertEtlOptimizationSuggestion[] = [
      {
        jobId: 1, // Daily Property Update
        type: "performance",
        severity: "medium",
        title: "Implement database indexing for faster queries",
        description: "Current queries on the property_records table are not using indexes effectively",
        suggestedAction: "Add an index on the last_updated_date column to improve query performance",
        estimatedImprovement: {
          metric: "execution_time",
          percentage: 40
        },
        status: "new",
        category: "database",
        implementationComplexity: "low",
        suggestedCode: "CREATE INDEX idx_property_last_updated ON property_records(last_updated_date);"
      },
      {
        jobId: 5, // Real-time Property Sales Feed
        type: "resource",
        severity: "high",
        title: "Reduce memory usage by optimizing JSON parsing",
        description: "The job is consuming excessive memory when processing large JSON responses",
        suggestedAction: "Use streaming JSON parser instead of loading entire response into memory",
        estimatedImprovement: {
          metric: "memory_usage",
          percentage: 65
        },
        status: "in_progress",
        category: "code",
        implementationComplexity: "medium",
        suggestedCode: "const JSONStream = require('JSONStream');\nconst parser = JSONStream.parse('*.properties');\nrequest.pipe(parser);"
      },
      {
        jobId: 3, // Historical Sales Data Import
        type: "scheduling",
        severity: "low",
        title: "Run job during off-peak hours",
        description: "This resource-intensive job is running during peak system usage times",
        suggestedAction: "Reschedule the job to run during off-peak hours (2AM-5AM)",
        estimatedImprovement: {
          metric: "system_impact",
          percentage: 30
        },
        status: "implemented",
        category: "scheduling",
        implementationComplexity: "low",
        suggestedCode: null
      },
      {
        jobId: 4, // GIS Boundary Update
        type: "code",
        severity: "high",
        title: "Implement retry logic for API failures",
        description: "Job is failing due to intermittent API timeouts with no retry mechanism",
        suggestedAction: "Add exponential backoff retry logic for API requests",
        estimatedImprovement: {
          metric: "success_rate",
          percentage: 95
        },
        status: "new",
        category: "resiliency",
        implementationComplexity: "medium",
        suggestedCode: "async function fetchWithRetry(url, options, maxRetries = 3) {\n  let retries = 0;\n  while (retries < maxRetries) {\n    try {\n      return await fetch(url, options);\n    } catch (err) {\n      retries++;\n      if (retries >= maxRetries) throw err;\n      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, retries)));\n    }\n  }\n}"
      },
      {
        jobId: 2, // Weekly Census Data Integration
        type: "performance",
        severity: "medium",
        title: "Parallelize data processing tasks",
        description: "Data processing is currently single-threaded and could benefit from parallelization",
        suggestedAction: "Implement worker threads to process data chunks in parallel",
        estimatedImprovement: {
          metric: "execution_time",
          percentage: 60
        },
        status: "new",
        category: "architecture",
        implementationComplexity: "high",
        suggestedCode: "const { Worker } = require('worker_threads');\n\nfunction processChunksInParallel(chunks, workerCount = 4) {\n  return Promise.all(chunks.map((chunk, i) => {\n    return new Promise((resolve, reject) => {\n      const worker = new Worker('./worker.js');\n      worker.postMessage(chunk);\n      worker.on('message', resolve);\n      worker.on('error', reject);\n    });\n  }));\n}"
      }
    ];
    
    // Add optimization suggestions to the map
    optimizationSuggestions.forEach(suggestion => {
      const id = this.etlOptimizationSuggestionCurrentId++;
      const optimizationSuggestion: EtlOptimizationSuggestion = {
        id,
        jobId: suggestion.jobId || 1,
        type: suggestion.type || 'performance',
        severity: suggestion.severity || 'medium',
        title: suggestion.title || '',
        description: suggestion.description || '',
        suggestedAction: suggestion.suggestedAction || '',
        estimatedImprovement: suggestion.estimatedImprovement || { metric: 'executionTime', percentage: 0 },
        status: suggestion.status || 'new',
        category: suggestion.category || null,
        implementationComplexity: suggestion.implementationComplexity || null,
        suggestedCode: suggestion.suggestedCode || null,
        createdAt: new Date(),
        updatedAt: new Date()
      };
      this.etlOptimizationSuggestionsMap[id] = optimizationSuggestion;
    });
    
    // Initialize ETL Batch Jobs
    const batchJobs: InsertEtlBatchJob[] = [
      {
        name: "Monthly Full Refresh",
        description: "Complete refresh of all property data at month end",
        jobIds: [1, 2, 4], // References to job IDs
        status: "idle",
        progress: 0,
        startedAt: null,
        completedAt: null
      },
      {
        name: "Annual Tax Assessment Data",
        description: "Annual processing of tax assessment data",
        jobIds: [1, 3], // References to job IDs
        status: "success",
        progress: 100,
        startedAt: new Date(Date.now() - 86400000 * 60), // 60 days ago
        completedAt: new Date(Date.now() - 86400000 * 59) // 59 days ago
      },
      {
        name: "Data Quality Check",
        description: "Runs validation checks on property data",
        jobIds: [1, 2, 3, 4], // References to job IDs
        status: "running",
        progress: 45,
        startedAt: new Date(Date.now() - 3600000), // 1 hour ago
        completedAt: null
      }
    ];
    
    // Add batch jobs to the map
    batchJobs.forEach(batchJob => {
      const id = this.etlBatchJobCurrentId++;
      const etlBatchJob: EtlBatchJob = {
        id,
        name: batchJob.name,
        description: batchJob.description || null,
        jobIds: batchJob.jobIds,
        status: batchJob.status || 'idle',
        progress: batchJob.progress || 0,
        createdAt: new Date(),
        updatedAt: new Date(),
        startedAt: batchJob.startedAt ? new Date(batchJob.startedAt) : null,
        completedAt: batchJob.completedAt ? new Date(batchJob.completedAt) : null
      };
      this.etlBatchJobsMap[id] = etlBatchJob;
    });
    
    // Initialize ETL Alerts
    const alerts: InsertEtlAlert[] = [
      {
        jobId: 4, // GIS Boundary Update
        type: "error",
        message: "Job failed: API request timeout",
        details: "Connection to Washington State GIS Portal timed out after 30 seconds",
        isRead: false
      },
      {
        jobId: 1, // Daily Property Update
        type: "warning",
        message: "High memory usage detected",
        details: "Memory usage spiked to 85% during data transformation phase",
        isRead: true
      },
      {
        jobId: 3, // Historical Sales Data Import
        type: "info",
        message: "Job completed successfully",
        details: "Processed 25,000 records in 24 minutes and 16 seconds",
        isRead: true
      },
      {
        jobId: 5, // Real-time Property Sales Feed
        type: "warning",
        message: "Connection intermittently dropping",
        details: "Connection to data source has dropped 3 times in the past hour",
        isRead: false
      },
      {
        jobId: 2, // Weekly Census Data Integration
        type: "info",
        message: "Job scheduled for next run",
        details: "Next execution scheduled for Sunday, April 07, 2025 at 03:00 AM",
        isRead: true
      }
    ];
    
    // Add alerts to the map
    alerts.forEach(alert => {
      const id = this.etlAlertCurrentId++;
      const etlAlert: EtlAlert = {
        id,
        jobId: alert.jobId,
        type: alert.type,
        message: alert.message || '',
        details: alert.details || null,
        timestamp: new Date(),
        isRead: alert.isRead !== undefined ? alert.isRead : false
      };
      this.etlAlertsMap[id] = etlAlert;
    });
  }
}

export const storage = new MemStorage();
