import { ApiConfig, ApiType, AuthType, DatabaseConfig, DatabaseType, DataSourceConfig, FileConfig, FileFormat, MemoryConfig } from './ETLTypes';
import { alertService, AlertType, AlertSeverity, AlertCategory } from './AlertService';

/**
 * Connection test result interface
 */
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  details?: any;
  timestamp: Date;
}

/**
 * Connection stats interface
 */
export interface ConnectionStats {
  bytesTransferred: number;
  recordsCount: number;
  duration: number;
  startTime: Date;
  endTime: Date;
  avgTransferRate: number; // bytes per second
  recordsPerSecond: number;
}

/**
 * Service for connecting to various data sources
 */
class DataConnector {
  private connectionCache: Map<string, any> = new Map();
  private activeConnections: Set<string> = new Set();
  
  constructor() {
    console.log('Data connector service initialized');
  }
  
  /**
   * Test a connection to a data source
   */
  async testConnection(config: DataSourceConfig): Promise<ConnectionTestResult> {
    console.log('Testing connection to data source:', config);
    
    const now = new Date();
    
    try {
      if ('dbType' in config) {
        return await this.testDatabaseConnection(config);
      } else if ('apiType' in config) {
        return await this.testApiConnection(config);
      } else if ('format' in config) {
        return await this.testFileConnection(config);
      } else if ('variableName' in config) {
        return await this.testMemoryConnection(config);
      } else {
        throw new Error('Unknown data source configuration type');
      }
    } catch (error) {
      console.error('Connection test failed:', error);
      
      const message = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.CONNECTIVITY,
        title: 'Connection Test Failed',
        message: `Failed to connect to data source: ${message}`
      });
      
      return {
        success: false,
        message,
        timestamp: now
      };
    }
  }
  
  /**
   * Extract data from a data source
   */
  async extractData(
    config: DataSourceConfig,
    options: {
      limit?: number;
      offset?: number;
      filter?: Record<string, any>;
      fields?: string[];
      sort?: Record<string, 'asc' | 'desc'>;
    } = {}
  ): Promise<{
    data: any[];
    stats: ConnectionStats;
    metadata?: Record<string, any>;
  }> {
    console.log('Extracting data from source:', config, 'with options:', options);
    
    const startTime = new Date();
    let data: any[] = [];
    let bytesTransferred = 0;
    
    try {
      // Generate a unique key for this connection
      const connectionKey = this.getConnectionKey(config);
      this.activeConnections.add(connectionKey);
      
      if ('dbType' in config) {
        // Database extraction
        const result = await this.extractFromDatabase(config, options);
        data = result.data;
        bytesTransferred = result.bytesTransferred;
      } else if ('apiType' in config) {
        // API extraction
        const result = await this.extractFromApi(config, options);
        data = result.data;
        bytesTransferred = result.bytesTransferred;
      } else if ('format' in config) {
        // File extraction
        const result = await this.extractFromFile(config, options);
        data = result.data;
        bytesTransferred = result.bytesTransferred;
      } else if ('variableName' in config) {
        // Memory extraction
        const result = await this.extractFromMemory(config, options);
        data = result.data;
        bytesTransferred = result.bytesTransferred;
      } else {
        throw new Error('Unknown data source configuration type');
      }
      
      this.activeConnections.delete(connectionKey);
    } catch (error) {
      console.error('Data extraction failed:', error);
      
      const message = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.CONNECTIVITY,
        title: 'Data Extraction Failed',
        message: `Failed to extract data from source: ${message}`
      });
      
      throw error;
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    const stats: ConnectionStats = {
      bytesTransferred,
      recordsCount: data.length,
      duration,
      startTime,
      endTime,
      avgTransferRate: duration > 0 ? bytesTransferred / (duration / 1000) : 0,
      recordsPerSecond: duration > 0 ? data.length / (duration / 1000) : 0
    };
    
    console.log(`Extracted ${data.length} records in ${duration}ms`);
    
    return {
      data,
      stats,
      metadata: {
        sourceType: this.getSourceType(config),
        fields: this.getFieldsFromData(data),
        recordCount: data.length
      }
    };
  }
  
  /**
   * Load data into a destination
   */
  async loadData(
    config: DataSourceConfig,
    data: any[],
    options: {
      mode?: 'insert' | 'update' | 'upsert' | 'replace';
      chunkSize?: number;
      keyField?: string;
    } = {}
  ): Promise<{
    success: boolean;
    recordsProcessed: number;
    stats: ConnectionStats;
    errors?: any[];
  }> {
    console.log('Loading data to destination:', config, 'with options:', options);
    
    const startTime = new Date();
    let bytesTransferred = 0;
    let recordsProcessed = 0;
    const errors: any[] = [];
    
    try {
      // Generate a unique key for this connection
      const connectionKey = this.getConnectionKey(config);
      this.activeConnections.add(connectionKey);
      
      const mode = options.mode || 'insert';
      const chunkSize = options.chunkSize || 1000;
      
      if ('dbType' in config) {
        // Database loading
        const result = await this.loadToDatabase(config, data, {
          mode,
          chunkSize,
          keyField: options.keyField
        });
        recordsProcessed = result.recordsProcessed;
        bytesTransferred = result.bytesTransferred;
        if (result.errors) {
          errors.push(...result.errors);
        }
      } else if ('apiType' in config) {
        // API loading
        const result = await this.loadToApi(config, data, {
          mode,
          chunkSize
        });
        recordsProcessed = result.recordsProcessed;
        bytesTransferred = result.bytesTransferred;
        if (result.errors) {
          errors.push(...result.errors);
        }
      } else if ('format' in config) {
        // File loading
        const result = await this.loadToFile(config, data);
        recordsProcessed = result.recordsProcessed;
        bytesTransferred = result.bytesTransferred;
        if (result.errors) {
          errors.push(...result.errors);
        }
      } else if ('variableName' in config) {
        // Memory loading
        const result = await this.loadToMemory(config, data, {
          mode
        });
        recordsProcessed = result.recordsProcessed;
        bytesTransferred = result.bytesTransferred;
        if (result.errors) {
          errors.push(...result.errors);
        }
      } else {
        throw new Error('Unknown data destination configuration type');
      }
      
      this.activeConnections.delete(connectionKey);
    } catch (error) {
      console.error('Data loading failed:', error);
      
      const message = error instanceof Error ? error.message : String(error);
      
      alertService.createAlert({
        type: AlertType.ERROR,
        severity: AlertSeverity.HIGH,
        category: AlertCategory.CONNECTIVITY,
        title: 'Data Loading Failed',
        message: `Failed to load data to destination: ${message}`
      });
      
      throw error;
    }
    
    const endTime = new Date();
    const duration = endTime.getTime() - startTime.getTime();
    
    const stats: ConnectionStats = {
      bytesTransferred,
      recordsCount: recordsProcessed,
      duration,
      startTime,
      endTime,
      avgTransferRate: duration > 0 ? bytesTransferred / (duration / 1000) : 0,
      recordsPerSecond: duration > 0 ? recordsProcessed / (duration / 1000) : 0
    };
    
    console.log(`Loaded ${recordsProcessed} records in ${duration}ms`);
    
    return {
      success: errors.length === 0,
      recordsProcessed,
      stats,
      errors: errors.length > 0 ? errors : undefined
    };
  }
  
  /**
   * Abort active connections
   */
  abortConnections(): number {
    const count = this.activeConnections.size;
    this.activeConnections.clear();
    return count;
  }
  
  /**
   * Get fields from the first few records of data
   */
  private getFieldsFromData(data: any[]): string[] {
    if (!data || data.length === 0) {
      return [];
    }
    
    // Take the first record as a sample
    const sample = data[0];
    
    if (typeof sample !== 'object' || sample === null) {
      return [];
    }
    
    return Object.keys(sample);
  }
  
  /**
   * Get type name from config
   */
  private getSourceType(config: DataSourceConfig): string {
    if ('dbType' in config) {
      return `database:${config.dbType}`;
    } else if ('apiType' in config) {
      return `api:${config.apiType}`;
    } else if ('format' in config) {
      return `file:${config.format}`;
    } else if ('variableName' in config) {
      return 'memory';
    }
    return 'unknown';
  }
  
  /**
   * Get unique key for connection caching
   */
  private getConnectionKey(config: DataSourceConfig): string {
    if ('dbType' in config) {
      const { dbType, host, port, database, username } = config;
      return `db:${dbType}:${host}:${port || 'default'}:${database}:${username || 'default'}`;
    } else if ('apiType' in config) {
      const { apiType, baseUrl, endpoint } = config;
      return `api:${apiType}:${baseUrl}:${endpoint || 'default'}`;
    } else if ('format' in config) {
      const { format, path } = config;
      return `file:${format}:${path}`;
    } else if ('variableName' in config) {
      const { variableName } = config;
      return `memory:${variableName || 'default'}`;
    }
    return `unknown:${JSON.stringify(config)}`;
  }
  
  // ===== DATABASE METHODS =====
  
  /**
   * Test database connection
   */
  private async testDatabaseConnection(config: DatabaseConfig): Promise<ConnectionTestResult> {
    // Simulated database connection test
    // In a real implementation, this would use the appropriate database driver
    
    const now = new Date();
    
    switch (config.dbType) {
      case DatabaseType.POSTGRES:
      case DatabaseType.MYSQL:
      case DatabaseType.SQLITE:
      case DatabaseType.MONGODB:
      case DatabaseType.MSSQL:
      case DatabaseType.ORACLE:
        // Simulated successful test
        return {
          success: true,
          message: `Successfully connected to ${config.dbType} database ${config.database} on ${config.host}`,
          details: {
            database: config.database,
            host: config.host,
            port: config.port,
            user: config.username
          },
          timestamp: now
        };
      
      default:
        return {
          success: false,
          message: `Unsupported database type: ${config.dbType}`,
          timestamp: now
        };
    }
  }
  
  /**
   * Extract data from database
   */
  private async extractFromDatabase(
    config: DatabaseConfig,
    options: {
      limit?: number;
      offset?: number;
      filter?: Record<string, any>;
      fields?: string[];
      sort?: Record<string, 'asc' | 'desc'>;
    }
  ): Promise<{
    data: any[];
    bytesTransferred: number;
  }> {
    // Simulated database data extraction
    // In a real implementation, this would execute a query on the database
    
    // Simplified mock data
    const mockData = Array.from({ length: options.limit || 10 }, (_, i) => ({
      id: i + (options.offset || 0) + 1,
      name: `Record ${i + (options.offset || 0) + 1}`,
      value: Math.random() * 100,
      createdAt: new Date()
    }));
    
    // Estimate bytes transferred (simplified)
    const bytesTransferred = JSON.stringify(mockData).length;
    
    return {
      data: mockData,
      bytesTransferred
    };
  }
  
  /**
   * Load data to database
   */
  private async loadToDatabase(
    config: DatabaseConfig,
    data: any[],
    options: {
      mode: 'insert' | 'update' | 'upsert' | 'replace';
      chunkSize: number;
      keyField?: string;
    }
  ): Promise<{
    recordsProcessed: number;
    bytesTransferred: number;
    errors?: any[];
  }> {
    // Simulated database loading
    // In a real implementation, this would execute insert/update queries
    
    // Estimate bytes transferred (simplified)
    const bytesTransferred = JSON.stringify(data).length;
    
    return {
      recordsProcessed: data.length,
      bytesTransferred
    };
  }
  
  // ===== API METHODS =====
  
  /**
   * Test API connection
   */
  private async testApiConnection(config: ApiConfig): Promise<ConnectionTestResult> {
    // Simulated API connection test
    // In a real implementation, this would make an actual API request
    
    const now = new Date();
    
    switch (config.apiType) {
      case ApiType.REST:
      case ApiType.GRAPHQL:
      case ApiType.SOAP:
      case ApiType.CUSTOM:
        // Simulated successful test
        return {
          success: true,
          message: `Successfully connected to ${config.apiType} API at ${config.baseUrl}`,
          details: {
            baseUrl: config.baseUrl,
            endpoint: config.endpoint,
            method: config.method
          },
          timestamp: now
        };
      
      default:
        return {
          success: false,
          message: `Unsupported API type: ${config.apiType}`,
          timestamp: now
        };
    }
  }
  
  /**
   * Extract data from API
   */
  private async extractFromApi(
    config: ApiConfig,
    options: {
      limit?: number;
      offset?: number;
      filter?: Record<string, any>;
      fields?: string[];
      sort?: Record<string, 'asc' | 'desc'>;
    }
  ): Promise<{
    data: any[];
    bytesTransferred: number;
  }> {
    // Simulated API data extraction
    // In a real implementation, this would make actual API requests
    
    // Simplified mock data
    const mockData = Array.from({ length: options.limit || 10 }, (_, i) => ({
      id: i + (options.offset || 0) + 1,
      title: `API Item ${i + (options.offset || 0) + 1}`,
      value: Math.random() * 100,
      createdAt: new Date()
    }));
    
    // Estimate bytes transferred (simplified)
    const bytesTransferred = JSON.stringify(mockData).length;
    
    return {
      data: mockData,
      bytesTransferred
    };
  }
  
  /**
   * Load data to API
   */
  private async loadToApi(
    config: ApiConfig,
    data: any[],
    options: {
      mode: 'insert' | 'update' | 'upsert' | 'replace';
      chunkSize: number;
    }
  ): Promise<{
    recordsProcessed: number;
    bytesTransferred: number;
    errors?: any[];
  }> {
    // Simulated API loading
    // In a real implementation, this would make actual API requests
    
    // Estimate bytes transferred (simplified)
    const bytesTransferred = JSON.stringify(data).length;
    
    return {
      recordsProcessed: data.length,
      bytesTransferred
    };
  }
  
  // ===== FILE METHODS =====
  
  /**
   * Test file connection
   */
  private async testFileConnection(config: FileConfig): Promise<ConnectionTestResult> {
    // Simulated file connection test
    // In a real implementation, this would check file existence and permissions
    
    const now = new Date();
    
    switch (config.format) {
      case FileFormat.CSV:
      case FileFormat.JSON:
      case FileFormat.XML:
      case FileFormat.EXCEL:
      case FileFormat.PARQUET:
      case FileFormat.AVRO:
        // Simulated successful test
        return {
          success: true,
          message: `Successfully accessed ${config.format} file at ${config.path}`,
          details: {
            path: config.path,
            format: config.format
          },
          timestamp: now
        };
      
      default:
        return {
          success: false,
          message: `Unsupported file format: ${config.format}`,
          timestamp: now
        };
    }
  }
  
  /**
   * Extract data from file
   */
  private async extractFromFile(
    config: FileConfig,
    options: {
      limit?: number;
      offset?: number;
      filter?: Record<string, any>;
      fields?: string[];
      sort?: Record<string, 'asc' | 'desc'>;
    }
  ): Promise<{
    data: any[];
    bytesTransferred: number;
  }> {
    // Simulated file data extraction
    // In a real implementation, this would read and parse the file
    
    // Simplified mock data
    const mockData = Array.from({ length: options.limit || 10 }, (_, i) => ({
      id: i + (options.offset || 0) + 1,
      filename: `file_record_${i + (options.offset || 0) + 1}`,
      value: Math.random() * 100,
      createdAt: new Date()
    }));
    
    // Estimate bytes transferred (simplified)
    const bytesTransferred = JSON.stringify(mockData).length;
    
    return {
      data: mockData,
      bytesTransferred
    };
  }
  
  /**
   * Load data to file
   */
  private async loadToFile(
    config: FileConfig,
    data: any[]
  ): Promise<{
    recordsProcessed: number;
    bytesTransferred: number;
    errors?: any[];
  }> {
    // Simulated file loading
    // In a real implementation, this would write data to the file
    
    // Estimate bytes transferred (simplified)
    const bytesTransferred = JSON.stringify(data).length;
    
    return {
      recordsProcessed: data.length,
      bytesTransferred
    };
  }
  
  // ===== MEMORY METHODS =====
  
  /**
   * Test memory connection
   */
  private async testMemoryConnection(config: MemoryConfig): Promise<ConnectionTestResult> {
    // Memory connections are always successful as they're in-memory
    
    const now = new Date();
    
    return {
      success: true,
      message: `Successfully accessed in-memory variable ${config.variableName || 'default'}`,
      details: {
        variableName: config.variableName
      },
      timestamp: now
    };
  }
  
  /**
   * Extract data from memory
   */
  private async extractFromMemory(
    config: MemoryConfig,
    options: {
      limit?: number;
      offset?: number;
      filter?: Record<string, any>;
      fields?: string[];
      sort?: Record<string, 'asc' | 'desc'>;
    }
  ): Promise<{
    data: any[];
    bytesTransferred: number;
  }> {
    // In a real implementation, this would access a variable from memory
    
    // For simulation, we'll create mock data
    const mockData = Array.from({ length: options.limit || 10 }, (_, i) => ({
      id: i + (options.offset || 0) + 1,
      memoryKey: `memory_item_${i + (options.offset || 0) + 1}`,
      value: Math.random() * 100,
      createdAt: new Date()
    }));
    
    // Estimate bytes transferred (simplified)
    const bytesTransferred = JSON.stringify(mockData).length;
    
    return {
      data: mockData,
      bytesTransferred
    };
  }
  
  /**
   * Load data to memory
   */
  private async loadToMemory(
    config: MemoryConfig,
    data: any[],
    options: {
      mode: 'insert' | 'update' | 'upsert' | 'replace';
    }
  ): Promise<{
    recordsProcessed: number;
    bytesTransferred: number;
    errors?: any[];
  }> {
    // In a real implementation, this would store data in a variable in memory
    
    // Estimate bytes transferred (simplified)
    const bytesTransferred = JSON.stringify(data).length;
    
    return {
      recordsProcessed: data.length,
      bytesTransferred
    };
  }
}

// Export a singleton instance
export const dataConnector = new DataConnector();