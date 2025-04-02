import { 
  users, 
  properties, 
  incomeHotelMotel,
  incomeHotelMotelDetail,
  incomeLeaseUp,
  type User, 
  type InsertUser, 
  type Property, 
  type InsertProperty,
  type IncomeHotelMotel,
  type InsertIncomeHotelMotel,
  type IncomeHotelMotelDetail,
  type InsertIncomeHotelMotelDetail,
  type IncomeLeaseUp,
  type InsertIncomeLeaseUp
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private incomeHotelMotelMap: Map<string, IncomeHotelMotel>;
  private incomeHotelMotelDetailMap: Map<string, IncomeHotelMotelDetail>;
  private incomeLeaseUpMap: Map<number, IncomeLeaseUp>;
  private userCurrentId: number;
  private propertyCurrentId: number;
  private incomeLeaseUpCurrentId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.incomeHotelMotelMap = new Map();
    this.incomeHotelMotelDetailMap = new Map();
    this.incomeLeaseUpMap = new Map();
    this.userCurrentId = 1;
    this.propertyCurrentId = 1;
    this.incomeLeaseUpCurrentId = 1;
    this.initializeSampleProperties();
  }

  // User operations
  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
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
    this.users.set(id, user);
    return user;
  }

  // Property operations
  async getProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getPropertyById(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
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
    let properties = Array.from(this.properties.values());

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
    
    return Array.from(this.properties.values()).filter(property => {
      if (!property.coordinates) return false;
      
      // Check if coordinates is an array or use latitude/longitude fields
      if (property.coordinates && Array.isArray(property.coordinates)) {
        const [lat, lng] = property.coordinates;
        return lat >= south && lat <= north && lng >= west && lng <= east;
      } else if (property.latitude && property.longitude) {
        return property.latitude >= south && property.latitude <= north && 
               property.longitude >= west && property.longitude <= east;
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
      attributes: insertProperty.attributes || {}
    };
    this.properties.set(id, property);
    return property;
  }

  async searchProperties(searchText: string): Promise<Property[]> {
    if (!searchText) {
      return [];
    }
    
    const searchLower = searchText.toLowerCase();
    
    return Array.from(this.properties.values()).filter(property => {
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
    return this.incomeHotelMotelMap.get(key);
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
    
    this.incomeHotelMotelMap.set(key, newItem);
    return newItem;
  }

  async updateIncomeHotelMotel(incomeYear: number, supNum: number, incomeId: number, incomeHotelMotel: Partial<InsertIncomeHotelMotel>): Promise<IncomeHotelMotel | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}`;
    const existingItem = this.incomeHotelMotelMap.get(key);
    
    if (!existingItem) {
      return undefined;
    }
    
    const updatedItem: IncomeHotelMotel = { ...existingItem, ...incomeHotelMotel };
    this.incomeHotelMotelMap.set(key, updatedItem);
    
    return updatedItem;
  }

  // Income Hotel/Motel Detail operations
  async getIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string): Promise<IncomeHotelMotelDetail | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}-${valueType}`;
    return this.incomeHotelMotelDetailMap.get(key);
  }

  async getIncomeHotelMotelDetails(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeHotelMotelDetail[]> {
    const prefix = `${incomeYear}-${supNum}-${incomeId}-`;
    
    return Array.from(this.incomeHotelMotelDetailMap.entries())
      .filter(([key]) => key.startsWith(prefix))
      .map(([_, value]) => value);
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
    
    this.incomeHotelMotelDetailMap.set(key, newItem);
    return newItem;
  }

  async updateIncomeHotelMotelDetail(incomeYear: number, supNum: number, incomeId: number, valueType: string, incomeHotelMotelDetail: Partial<InsertIncomeHotelMotelDetail>): Promise<IncomeHotelMotelDetail | undefined> {
    const key = `${incomeYear}-${supNum}-${incomeId}-${valueType}`;
    const existingItem = this.incomeHotelMotelDetailMap.get(key);
    
    if (!existingItem) {
      return undefined;
    }
    
    const updatedItem: IncomeHotelMotelDetail = { ...existingItem, ...incomeHotelMotelDetail };
    this.incomeHotelMotelDetailMap.set(key, updatedItem);
    
    return updatedItem;
  }

  // Income Lease Up operations
  async getIncomeLeaseUp(incomeLeaseUpId: number): Promise<IncomeLeaseUp | undefined> {
    return this.incomeLeaseUpMap.get(incomeLeaseUpId);
  }

  async getIncomeLeaseUpsByIncomeId(incomeYear: number, supNum: number, incomeId: number): Promise<IncomeLeaseUp[]> {
    return Array.from(this.incomeLeaseUpMap.values())
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
    
    this.incomeLeaseUpMap.set(incomeLeaseUpId, newItem);
    return newItem;
  }

  async updateIncomeLeaseUp(incomeLeaseUpId: number, incomeLeaseUp: Partial<InsertIncomeLeaseUp>): Promise<IncomeLeaseUp | undefined> {
    const existingItem = this.incomeLeaseUpMap.get(incomeLeaseUpId);
    
    if (!existingItem) {
      return undefined;
    }
    
    const updatedItem: IncomeLeaseUp = { ...existingItem, ...incomeLeaseUp };
    this.incomeLeaseUpMap.set(incomeLeaseUpId, updatedItem);
    
    return updatedItem;
  }

  async deleteIncomeLeaseUp(incomeLeaseUpId: number): Promise<boolean> {
    return this.incomeLeaseUpMap.delete(incomeLeaseUpId);
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
        attributes: {}
      };
      
      return property;
    });
    
    // Store properties in the map
    sampleProperties.forEach(property => {
      this.properties.set(property.id, property);
    });
  }
}

export const storage = new MemStorage();
