import { DataSourceConfig, DatabaseType, FileFormat, ApiType } from './ETLTypes';
import { alertService, AlertType, AlertSeverity, AlertCategory } from './AlertService';

/**
 * Connection statistics interface
 */
export interface ConnectionStats {
  bytesTransferred: number;
  recordsCount: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  avgTransferRate: number;
  recordsPerSecond: number;
}

/**
 * Data loading options interface
 */
export interface DataLoadingOptions {
  chunkSize?: number;
  batchSize?: number;
  continueOnError?: boolean;
  retryCount?: number;
  retryDelay?: number;
  validateBeforeLoad?: boolean;
}

/**
 * Extract result interface
 */
export interface ExtractResult {
  data: any[];
  stats: ConnectionStats;
  metadata?: Record<string, any>;
}

/**
 * Load result interface
 */
export interface LoadResult {
  success: boolean;
  recordsProcessed: number;
  stats: ConnectionStats;
  errors?: any[];
}

/**
 * Connection test result interface
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latency?: number;
  details?: Record<string, any>;
}

/**
 * DataConnector class
 */
class DataConnector {
  private cache: Map<string, any> = new Map();
  private connectionPool: Map<string, any> = new Map();
  
  constructor() {
    console.log('DataConnector initialized');
  }
  
  /**
   * Extract data from a source
   */
  async extractData(source: DataSourceConfig): Promise<ExtractResult> {
    console.log(`Extracting data from source: ${source.name}`);
    
    const startTime = new Date();
    let data: any[] = [];
    
    try {
      // Extract data based on source type
      if ('dbType' in source) {
        // Database source
        data = await this.extractFromDatabase(source);
      } else if ('format' in source) {
        // File source
        data = await this.extractFromFile(source);
      } else if ('apiType' in source) {
        // API source
        data = await this.extractFromApi(source);
      } else if ('key' in source) {
        // Memory source
        data = await this.extractFromMemory(source);
      } else {
        throw new Error('Unknown source type');
      }
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Calculate connection statistics
      const stats: ConnectionStats = {
        bytesTransferred: this.calculateDataSize(data),
        recordsCount: data.length,
        duration,
        startTime,
        endTime,
        avgTransferRate: 0,
        recordsPerSecond: 0
      };
      
      // Calculate rates
      if (duration > 0) {
        stats.avgTransferRate = stats.bytesTransferred / (duration / 1000);
        stats.recordsPerSecond = stats.recordsCount / (duration / 1000);
      }
      
      console.log(`Extracted ${data.length} records in ${duration}ms`);
      
      return {
        data,
        stats,
        metadata: {
          sourceType: this.getSourceType(source),
          sourceName: source.name
        }
      };
    } catch (error) {
      console.error(`Error extracting data from source ${source.name}:`, error);
      
      // Create an alert for the extraction error
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.DATA_SOURCE,
        title: 'Data Extraction Failed',
        message: `Failed to extract data from source: ${source.name}`,
        details: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Load data to a destination
   */
  async loadData(
    destination: DataSourceConfig,
    data: any[],
    options: DataLoadingOptions = {}
  ): Promise<LoadResult> {
    console.log(`Loading data to destination: ${destination.name}`);
    
    const startTime = new Date();
    const errors: any[] = [];
    
    // Default options
    const defaultOptions: Required<DataLoadingOptions> = {
      chunkSize: options.chunkSize || 1000,
      batchSize: options.batchSize || 100,
      continueOnError: options.continueOnError !== false,
      retryCount: options.retryCount || 3,
      retryDelay: options.retryDelay || 1000,
      validateBeforeLoad: options.validateBeforeLoad !== false
    };
    
    try {
      // Load data based on destination type
      let success = false;
      
      if ('dbType' in destination) {
        // Database destination
        await this.loadToDatabase(destination, data, defaultOptions);
        success = true;
      } else if ('format' in destination) {
        // File destination
        await this.loadToFile(destination, data, defaultOptions);
        success = true;
      } else if ('apiType' in destination) {
        // API destination
        await this.loadToApi(destination, data, defaultOptions);
        success = true;
      } else if ('key' in destination) {
        // Memory destination
        await this.loadToMemory(destination, data, defaultOptions);
        success = true;
      } else {
        throw new Error('Unknown destination type');
      }
      
      const endTime = new Date();
      const duration = endTime.getTime() - startTime.getTime();
      
      // Calculate connection statistics
      const stats: ConnectionStats = {
        bytesTransferred: this.calculateDataSize(data),
        recordsCount: data.length,
        duration,
        startTime,
        endTime,
        avgTransferRate: 0,
        recordsPerSecond: 0
      };
      
      // Calculate rates
      if (duration > 0) {
        stats.avgTransferRate = stats.bytesTransferred / (duration / 1000);
        stats.recordsPerSecond = stats.recordsCount / (duration / 1000);
      }
      
      console.log(`Loaded ${data.length} records in ${duration}ms`);
      
      return {
        success,
        recordsProcessed: data.length,
        stats,
        errors: errors.length > 0 ? errors : undefined
      };
    } catch (error) {
      console.error(`Error loading data to destination ${destination.name}:`, error);
      
      // Create an alert for the load error
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.DATA_SOURCE,
        title: 'Data Loading Failed',
        message: `Failed to load data to destination: ${destination.name}`,
        details: error instanceof Error ? error.message : String(error)
      });
      
      throw error;
    }
  }
  
  /**
   * Test a connection to a data source
   */
  async testConnection(source: DataSourceConfig): Promise<ConnectionTestResult> {
    console.log(`Testing connection to source: ${source.name}`);
    
    const startTime = new Date();
    
    try {
      // Test connection based on source type
      if ('dbType' in source) {
        // Database source
        await this.testDatabaseConnection(source);
      } else if ('format' in source) {
        // File source
        await this.testFileConnection(source);
      } else if ('apiType' in source) {
        // API source
        await this.testApiConnection(source);
      } else if ('key' in source) {
        // Memory source
        await this.testMemoryConnection(source);
      } else {
        throw new Error('Unknown source type');
      }
      
      const endTime = new Date();
      const latency = endTime.getTime() - startTime.getTime();
      
      console.log(`Connection test successful (${latency}ms)`);
      
      return {
        success: true,
        message: `Connection successful (${latency}ms)`,
        latency,
        details: {
          sourceType: this.getSourceType(source),
          sourceName: source.name,
          timestamp: new Date().toISOString()
        }
      };
    } catch (error) {
      console.error(`Connection test failed for source ${source.name}:`, error);
      
      // Create an alert for the connection error
      alertService.createAlert({
        type: AlertType.WARNING,
        severity: AlertSeverity.MEDIUM,
        category: AlertCategory.DATA_SOURCE,
        title: 'Connection Test Failed',
        message: `Failed to connect to data source: ${source.name}`,
        details: error instanceof Error ? error.message : String(error)
      });
      
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        details: {
          sourceType: this.getSourceType(source),
          sourceName: source.name,
          timestamp: new Date().toISOString(),
          error: error instanceof Error ? error.stack : String(error)
        }
      };
    }
  }
  
  /**
   * Extract data from a database source
   */
  private async extractFromDatabase(source: DataSourceConfig & { dbType: DatabaseType }): Promise<any[]> {
    // For this implementation, we'll simulate the database extraction
    // In a real application, you would use a proper database client
    
    console.log(`Extracting from ${source.dbType} database: ${source.name}`);
    
    // Simulate delay for database querying
    await new Promise(resolve => setTimeout(resolve, 500));
    
    // Use cached data if available
    const cacheKey = `DB_${source.id}`;
    if (this.cache.has(cacheKey)) {
      console.log(`Using cached data for source: ${source.name}`);
      return this.cache.get(cacheKey);
    }
    
    // Generate some mock data for simulation purposes
    const mockData = this.generateMockData(100);
    
    // Cache the data
    this.cache.set(cacheKey, mockData);
    
    return mockData;
  }
  
  /**
   * Extract data from an API source
   */
  private async extractFromApi(source: DataSourceConfig & { apiType: ApiType }): Promise<any[]> {
    // For this implementation, we'll simulate the API extraction
    // In a real application, you would use fetch or axios
    
    console.log(`Extracting from ${source.apiType} API: ${source.name}`);
    
    // Simulate delay for API request
    await new Promise(resolve => setTimeout(resolve, 700));
    
    // Use cached data if available
    const cacheKey = `API_${source.id}`;
    if (this.cache.has(cacheKey)) {
      console.log(`Using cached data for source: ${source.name}`);
      return this.cache.get(cacheKey);
    }
    
    // Generate some mock data for simulation purposes
    const mockData = this.generateMockData(50);
    
    // Cache the data
    this.cache.set(cacheKey, mockData);
    
    return mockData;
  }
  
  /**
   * Extract data from a file source
   */
  private async extractFromFile(source: DataSourceConfig & { format: FileFormat }): Promise<any[]> {
    // For this implementation, we'll simulate the file extraction
    // In a real application, you would use fs or a file handling library
    
    console.log(`Extracting from ${source.format} file: ${source.name}`);
    
    // Simulate delay for file reading
    await new Promise(resolve => setTimeout(resolve, 300));
    
    // Use cached data if available
    const cacheKey = `FILE_${source.id}`;
    if (this.cache.has(cacheKey)) {
      console.log(`Using cached data for source: ${source.name}`);
      return this.cache.get(cacheKey);
    }
    
    // Generate some mock data for simulation purposes
    const mockData = this.generateMockData(75);
    
    // Cache the data
    this.cache.set(cacheKey, mockData);
    
    return mockData;
  }
  
  /**
   * Extract data from a memory source
   */
  private async extractFromMemory(source: DataSourceConfig & { key: string }): Promise<any[]> {
    console.log(`Extracting from memory source: ${source.name}`);
    
    // Use cached data if available
    const cacheKey = `MEM_${source.key}`;
    if (this.cache.has(cacheKey)) {
      console.log(`Using cached data for source: ${source.name}`);
      return this.cache.get(cacheKey);
    }
    
    // Generate some mock data for simulation purposes
    const mockData = this.generateMockData(25);
    
    // Cache the data
    this.cache.set(cacheKey, mockData);
    
    return mockData;
  }
  
  /**
   * Load data to a database destination
   */
  private async loadToDatabase(
    destination: DataSourceConfig & { dbType: DatabaseType },
    data: any[],
    options: Required<DataLoadingOptions>
  ): Promise<void> {
    // For this implementation, we'll simulate the database loading
    // In a real application, you would use a proper database client
    
    console.log(`Loading to ${destination.dbType} database: ${destination.name}`);
    
    // Process data in chunks
    const chunks = this.chunkArray(data, options.chunkSize);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} records)`);
      
      // Simulate delay for inserting data
      await new Promise(resolve => setTimeout(resolve, 300));
    }
  }
  
  /**
   * Load data to an API destination
   */
  private async loadToApi(
    destination: DataSourceConfig & { apiType: ApiType },
    data: any[],
    options: Required<DataLoadingOptions>
  ): Promise<void> {
    // For this implementation, we'll simulate the API loading
    // In a real application, you would use fetch or axios
    
    console.log(`Loading to ${destination.apiType} API: ${destination.name}`);
    
    // Process data in chunks
    const chunks = this.chunkArray(data, options.chunkSize);
    
    for (let i = 0; i < chunks.length; i++) {
      const chunk = chunks[i];
      console.log(`Processing chunk ${i + 1}/${chunks.length} (${chunk.length} records)`);
      
      // Process records in batches
      const batches = this.chunkArray(chunk, options.batchSize);
      
      for (let j = 0; j < batches.length; j++) {
        // Simulate API call for each batch
        await new Promise(resolve => setTimeout(resolve, 200));
      }
    }
  }
  
  /**
   * Load data to a file destination
   */
  private async loadToFile(
    destination: DataSourceConfig & { format: FileFormat },
    data: any[],
    options: Required<DataLoadingOptions>
  ): Promise<void> {
    // For this implementation, we'll simulate the file writing
    // In a real application, you would use fs or a file handling library
    
    console.log(`Loading to ${destination.format} file: ${destination.name}`);
    
    // Simulate delay for file writing
    await new Promise(resolve => setTimeout(resolve, 500));
  }
  
  /**
   * Load data to a memory destination
   */
  private async loadToMemory(
    destination: DataSourceConfig & { key: string },
    data: any[],
    options: Required<DataLoadingOptions>
  ): Promise<void> {
    console.log(`Loading to memory destination: ${destination.name}`);
    
    // Cache the data
    const cacheKey = `MEM_${destination.key}`;
    this.cache.set(cacheKey, data);
  }
  
  /**
   * Test database connection
   */
  private async testDatabaseConnection(source: DataSourceConfig & { dbType: DatabaseType }): Promise<void> {
    console.log(`Testing ${source.dbType} database connection: ${source.name}`);
    
    // Simulate database connection test
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Simulate a 90% success rate
        if (Math.random() < 0.9) {
          resolve();
        } else {
          reject(new Error(`Failed to connect to ${source.dbType} database: ${source.host}:${source.port}`));
        }
      }, 300);
    });
  }
  
  /**
   * Test API connection
   */
  private async testApiConnection(source: DataSourceConfig & { apiType: ApiType }): Promise<void> {
    console.log(`Testing ${source.apiType} API connection: ${source.name}`);
    
    // Simulate API connection test
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Simulate a 90% success rate
        if (Math.random() < 0.9) {
          resolve();
        } else {
          reject(new Error(`Failed to connect to ${source.apiType} API: ${source.url}`));
        }
      }, 200);
    });
  }
  
  /**
   * Test file connection
   */
  private async testFileConnection(source: DataSourceConfig & { format: FileFormat }): Promise<void> {
    console.log(`Testing ${source.format} file connection: ${source.name}`);
    
    // Simulate file connection test
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Simulate a 95% success rate
        if (Math.random() < 0.95) {
          resolve();
        } else {
          reject(new Error(`Failed to access ${source.format} file: ${source.path}`));
        }
      }, 100);
    });
  }
  
  /**
   * Test memory connection
   */
  private async testMemoryConnection(source: DataSourceConfig & { key: string }): Promise<void> {
    console.log(`Testing memory connection: ${source.name}`);
    
    // Memory connections always succeed
    await Promise.resolve();
  }
  
  /**
   * Generate mock data for simulations
   */
  private generateMockData(count: number): any[] {
    const data: any[] = [];
    
    for (let i = 0; i < count; i++) {
      data.push({
        id: i + 1,
        name: `Item ${i + 1}`,
        value: Math.round(Math.random() * 1000) / 10,
        date: new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000).toISOString(),
        active: Math.random() > 0.3,
        category: ['A', 'B', 'C', 'D'][Math.floor(Math.random() * 4)],
        tags: Array(Math.floor(Math.random() * 3) + 1)
          .fill(0)
          .map((_, idx) => `tag-${idx + 1}`)
      });
    }
    
    return data;
  }
  
  /**
   * Calculate approximate size of data in bytes
   */
  private calculateDataSize(data: any[]): number {
    return JSON.stringify(data).length;
  }
  
  /**
   * Split array into chunks
   */
  private chunkArray<T>(array: T[], chunkSize: number): T[][] {
    const chunks: T[][] = [];
    for (let i = 0; i < array.length; i += chunkSize) {
      chunks.push(array.slice(i, i + chunkSize));
    }
    return chunks;
  }
  
  /**
   * Get source type as a string
   */
  private getSourceType(source: DataSourceConfig): string {
    if ('dbType' in source) {
      return `DATABASE_${source.dbType}`;
    } else if ('format' in source) {
      return `FILE_${source.format}`;
    } else if ('apiType' in source) {
      return `API_${source.apiType}`;
    } else if ('key' in source) {
      return 'MEMORY';
    } else {
      return 'UNKNOWN';
    }
  }
  
  /**
   * Clear the data cache
   */
  clearCache(): void {
    console.log('Clearing data connector cache');
    this.cache.clear();
  }
}

// Export a singleton instance
export const dataConnector = new DataConnector();