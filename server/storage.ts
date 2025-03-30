import { 
  users, 
  properties, 
  type User, 
  type InsertUser, 
  type Property, 
  type InsertProperty 
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
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private userCurrentId: number;
  private propertyCurrentId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.userCurrentId = 1;
    this.propertyCurrentId = 1;
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
    const user: User = { ...insertUser, id };
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
      
      const [lat, lng] = property.coordinates;
      return lat >= south && lat <= north && lng >= west && lng <= east;
    });
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.propertyCurrentId++;
    const property: Property = { ...insertProperty, id };
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
        : undefined;
      
      const pricePerSqFt = `$${Math.floor(baseValue / squareFeet).toLocaleString()}`;
      
      const lastSaleDate = Math.random() > 0.3 
        ? new Date(Date.now() - Math.random() * 5 * 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]
        : undefined;
        
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
