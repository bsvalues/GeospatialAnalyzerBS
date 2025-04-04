import { DataSource, DataDestination, DatabaseType, ApiType, FileFormat, AuthType } from './ETLTypes';
import { alertService } from './AlertService';

/**
 * Connection test result interface
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: Record<string, any>;
  timestamp: Date;
}

/**
 * Load result interface
 */
export interface LoadResult {
  success: boolean;
  created: number;
  updated: number;
  deleted: number;
  errors: string[];
}

/**
 * Data connector for working with data sources and destinations
 */
class DataConnector {
  // Cache connection test results
  private connectionTests: Map<string, ConnectionTestResult> = new Map();
  
  constructor() {
    // Default constructor
  }
  
  /**
   * Test a connection to a data source
   */
  async testConnection(source: DataSource): Promise<ConnectionTestResult> {
    console.log(`Testing connection to ${source.name} (${source.type})`);
    
    const connectionId = `${source.id}`;
    const startTime = new Date();
    let success = false;
    let message = '';
    let details = {};
    
    try {
      // Simulate connection test based on source type
      switch (source.type) {
        case 'database':
          ({ success, message, details } = await this.testDatabaseConnection(source));
          break;
        case 'api':
          ({ success, message, details } = await this.testApiConnection(source));
          break;
        case 'file':
          ({ success, message, details } = await this.testFileConnection(source));
          break;
        case 'memory':
          // Memory connections always succeed
          success = true;
          message = 'Memory connection is available';
          break;
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }
      
      // Create a test result
      const result: ConnectionTestResult = {
        success,
        message,
        details,
        timestamp: new Date()
      };
      
      // Cache the result
      this.connectionTests.set(connectionId, result);
      
      return result;
    } catch (error) {
      console.error(`Error testing connection to ${source.name}:`, error);
      
      // Create a failure alert
      alertService.createConnectionFailureAlert(
        source.name,
        source.type,
        error
      );
      
      // Create a failure result
      const result: ConnectionTestResult = {
        success: false,
        message: `Connection failed: ${error instanceof Error ? error.message : String(error)}`,
        timestamp: new Date()
      };
      
      // Cache the result
      this.connectionTests.set(connectionId, result);
      
      return result;
    }
  }
  
  /**
   * Fetch data from a data source
   */
  async fetchData(source: DataSource): Promise<any[]> {
    console.log(`Fetching data from ${source.name} (${source.type})`);
    
    // First, test the connection
    const testResult = await this.testConnection(source);
    
    if (!testResult.success) {
      throw new Error(`Cannot fetch data, connection failed: ${testResult.message}`);
    }
    
    try {
      // Fetch data based on source type
      switch (source.type) {
        case 'database':
          return await this.fetchDatabaseData(source);
        case 'api':
          return await this.fetchApiData(source);
        case 'file':
          return await this.fetchFileData(source);
        case 'memory':
          return this.fetchMemoryData(source);
        default:
          throw new Error(`Unsupported source type: ${source.type}`);
      }
    } catch (error) {
      console.error(`Error fetching data from ${source.name}:`, error);
      
      // Create a failure alert
      alertService.createConnectionFailureAlert(
        source.name,
        source.type,
        error
      );
      
      throw error;
    }
  }
  
  /**
   * Load data to a destination
   */
  async loadData(destination: DataDestination, data: any[]): Promise<LoadResult> {
    console.log(`Loading ${data.length} records to ${destination.name} (${destination.type})`);
    
    // First, test the connection
    const testResult = await this.testConnection(destination);
    
    if (!testResult.success) {
      throw new Error(`Cannot load data, connection failed: ${testResult.message}`);
    }
    
    try {
      // Load data based on destination type
      switch (destination.type) {
        case 'database':
          return await this.loadDatabaseData(destination, data);
        case 'api':
          return await this.loadApiData(destination, data);
        case 'file':
          return await this.loadFileData(destination, data);
        case 'memory':
          return this.loadMemoryData(destination, data);
        default:
          throw new Error(`Unsupported destination type: ${destination.type}`);
      }
    } catch (error) {
      console.error(`Error loading data to ${destination.name}:`, error);
      
      // Create a failure alert
      alertService.createConnectionFailureAlert(
        destination.name,
        destination.type,
        error
      );
      
      throw error;
    }
  }
  
  /**
   * Get a cached connection test result
   */
  getCachedConnectionTest(sourceId: string): ConnectionTestResult | undefined {
    return this.connectionTests.get(sourceId);
  }
  
  /**
   * Clear cached connection tests
   */
  clearConnectionTests(): void {
    this.connectionTests.clear();
  }
  
  /**
   * Test a database connection
   */
  private async testDatabaseConnection(source: DataSource): Promise<{ success: boolean, message: string, details?: Record<string, any> }> {
    // In a real implementation, we would use a database client library
    // For this simulation, we'll just check that the required config properties are present
    const { config } = source;
    
    if (config.type !== 'database') {
      throw new Error('Invalid configuration: not a database config');
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check required properties
    if (!config.host) {
      return { success: false, message: 'Missing host in database configuration' };
    }
    
    if (!config.database) {
      return { success: false, message: 'Missing database name in configuration' };
    }
    
    // Simulate a successful connection
    return { 
      success: true, 
      message: 'Database connection successful', 
      details: {
        dbType: config.dbType,
        host: config.host,
        database: config.database
      } 
    };
  }
  
  /**
   * Test an API connection
   */
  private async testApiConnection(source: DataSource): Promise<{ success: boolean, message: string, details?: Record<string, any> }> {
    // In a real implementation, we would use the fetch API or another HTTP client
    // For this simulation, we'll just check that the required config properties are present
    const { config } = source;
    
    if (config.type !== 'api') {
      throw new Error('Invalid configuration: not an API config');
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Check required properties
    if (!config.baseUrl) {
      return { success: false, message: 'Missing baseUrl in API configuration' };
    }
    
    // Simulate a successful connection
    return { 
      success: true, 
      message: 'API connection successful', 
      details: {
        apiType: config.apiType,
        baseUrl: config.baseUrl,
        endpoint: config.endpoint
      } 
    };
  }
  
  /**
   * Test a file connection
   */
  private async testFileConnection(source: DataSource): Promise<{ success: boolean, message: string, details?: Record<string, any> }> {
    // In a real implementation, we would use the file system API
    // For this simulation, we'll just check that the required config properties are present
    const { config } = source;
    
    if (config.type !== 'file') {
      throw new Error('Invalid configuration: not a file config');
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Check required properties
    if (!config.path) {
      return { success: false, message: 'Missing path in file configuration' };
    }
    
    if (!config.format) {
      return { success: false, message: 'Missing format in file configuration' };
    }
    
    // Simulate a successful connection
    return { 
      success: true, 
      message: 'File connection successful', 
      details: {
        path: config.path,
        format: config.format
      } 
    };
  }
  
  /**
   * Fetch data from a database source
   */
  private async fetchDatabaseData(source: DataSource): Promise<any[]> {
    // In a real implementation, we would use a database client library
    // For this simulation, we'll generate some sample data
    const { config } = source;
    
    if (config.type !== 'database') {
      throw new Error('Invalid configuration: not a database config');
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    // Generate sample data based on database type
    const sampleSize = 20 + Math.floor(Math.random() * 50);
    return this.generateSampleData(String(source.id), sampleSize);
  }
  
  /**
   * Fetch data from an API source
   */
  private async fetchApiData(source: DataSource): Promise<any[]> {
    // In a real implementation, we would use the fetch API or another HTTP client
    // For this simulation, we'll generate some sample data
    const { config } = source;
    
    if (config.type !== 'api') {
      throw new Error('Invalid configuration: not an API config');
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Generate sample data based on API endpoint
    const sampleSize = 10 + Math.floor(Math.random() * 30);
    return this.generateSampleData(String(source.id), sampleSize);
  }
  
  /**
   * Fetch data from a file source
   */
  private async fetchFileData(source: DataSource): Promise<any[]> {
    // In a real implementation, we would use the file system API
    // For this simulation, we'll generate some sample data
    const { config } = source;
    
    if (config.type !== 'file') {
      throw new Error('Invalid configuration: not a file config');
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 600));
    
    // Generate sample data based on file format
    const sampleSize = 30 + Math.floor(Math.random() * 40);
    return this.generateSampleData(String(source.id), sampleSize);
  }
  
  /**
   * Fetch data from a memory source
   */
  private fetchMemoryData(source: DataSource): any[] {
    // In a real implementation, we would use some in-memory data store
    // For this simulation, we'll generate some sample data
    const sampleSize = 5 + Math.floor(Math.random() * 20);
    return this.generateSampleData(String(source.id), sampleSize);
  }
  
  /**
   * Load data to a database destination
   */
  private async loadDatabaseData(destination: DataDestination, data: any[]): Promise<LoadResult> {
    // In a real implementation, we would use a database client library
    // For this simulation, we'll just pretend to load the data
    const { config } = destination;
    
    if (config.type !== 'database') {
      throw new Error('Invalid configuration: not a database config');
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1200));
    
    // Simulate some errors for a small percentage of records
    const errors: string[] = [];
    const errorRate = 0.05;
    
    for (let i = 0; i < data.length; i++) {
      if (Math.random() < errorRate) {
        errors.push(`Error inserting record at index ${i}: Simulated database error`);
      }
    }
    
    // Calculate success rates
    const successCount = data.length - errors.length;
    const createdCount = Math.floor(successCount * 0.7);
    const updatedCount = successCount - createdCount;
    
    return {
      success: errors.length === 0,
      created: createdCount,
      updated: updatedCount,
      deleted: 0,
      errors
    };
  }
  
  /**
   * Load data to an API destination
   */
  private async loadApiData(destination: DataDestination, data: any[]): Promise<LoadResult> {
    // In a real implementation, we would use the fetch API or another HTTP client
    // For this simulation, we'll just pretend to load the data
    const { config } = destination;
    
    if (config.type !== 'api') {
      throw new Error('Invalid configuration: not an API config');
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    // Simulate some errors for a small percentage of records
    const errors: string[] = [];
    const errorRate = 0.08;
    
    for (let i = 0; i < data.length; i++) {
      if (Math.random() < errorRate) {
        errors.push(`Error sending record at index ${i}: Simulated API error`);
      }
    }
    
    // Calculate success rates
    const successCount = data.length - errors.length;
    const createdCount = Math.floor(successCount * 0.9);
    const updatedCount = successCount - createdCount;
    
    return {
      success: errors.length === 0,
      created: createdCount,
      updated: updatedCount,
      deleted: 0,
      errors
    };
  }
  
  /**
   * Load data to a file destination
   */
  private async loadFileData(destination: DataDestination, data: any[]): Promise<LoadResult> {
    // In a real implementation, we would use the file system API
    // For this simulation, we'll just pretend to load the data
    const { config } = destination;
    
    if (config.type !== 'file') {
      throw new Error('Invalid configuration: not a file config');
    }
    
    // Simulate a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Files typically don't have updates/deletes, just creates
    return {
      success: true,
      created: data.length,
      updated: 0,
      deleted: 0,
      errors: []
    };
  }
  
  /**
   * Load data to a memory destination
   */
  private loadMemoryData(destination: DataDestination, data: any[]): LoadResult {
    // In a real implementation, we would use some in-memory data store
    // For this simulation, we'll just pretend to load the data
    
    // Memory typically doesn't have errors
    return {
      success: true,
      created: data.length,
      updated: 0,
      deleted: 0,
      errors: []
    };
  }
  
  /**
   * Generate sample data for testing
   */
  private generateSampleData(seed: string, count: number): any[] {
    const data: any[] = [];
    
    // Use the seed to make the data consistent for the same source
    const seedNumber = seed.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
    
    for (let i = 0; i < count; i++) {
      // Generate a pseudo-random number based on seed and index
      const random = (seedNumber * (i + 1)) % 1000 / 1000;
      
      // Create a sample record
      const record: Record<string, any> = {
        id: `${seed}-${i + 1}`,
        index: i,
        value: Math.floor(random * 100),
        name: `Item ${i + 1}`,
        description: `Description for item ${i + 1}`,
        date: new Date(Date.now() - i * 86400000), // Days in the past
        active: random > 0.3,
        category: ['A', 'B', 'C', 'D'][Math.floor(random * 4)],
        tags: this.generateTags(random),
        metadata: {
          source: seed,
          created: new Date(),
          score: random * 10
        }
      };
      
      // Add some property-specific fields
      if (seed.includes('property')) {
        record.address = `${Math.floor(random * 999) + 1} Main St`;
        record.city = ['Seattle', 'Portland', 'San Francisco', 'Los Angeles'][Math.floor(random * 4)];
        record.state = ['WA', 'OR', 'CA', 'NY'][Math.floor(random * 4)];
        record.zipCode = `${Math.floor(random * 90000) + 10000}`;
        record.price = Math.floor(random * 900000) + 100000;
        record.sqft = Math.floor(random * 3000) + 500;
        record.bedrooms = Math.floor(random * 5) + 1;
        record.bathrooms = Math.floor((random * 5) + 1);
        record.yearBuilt = Math.floor(random * 70) + 1950;
        record.propertyType = ['Single Family', 'Condo', 'Townhouse', 'Multi-Family'][Math.floor(random * 4)];
      }
      
      data.push(record);
    }
    
    return data;
  }
  
  /**
   * Generate sample tags
   */
  private generateTags(random: number): string[] {
    const allTags = ['new', 'featured', 'sale', 'premium', 'budget', 'trending', 'popular', 'recommended'];
    const tagCount = Math.floor(random * 4) + 1;
    const tags: string[] = [];
    
    // Select random tags
    for (let i = 0; i < tagCount; i++) {
      const tagIndex = Math.floor(random * allTags.length * (i + 1)) % allTags.length;
      const tag = allTags[tagIndex];
      
      if (!tags.includes(tag)) {
        tags.push(tag);
      }
    }
    
    return tags;
  }
}

// Export a singleton instance
export const dataConnector = new DataConnector();