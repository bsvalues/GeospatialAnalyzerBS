/**
 * ETL Data Connector Service
 * 
 * This service handles connections to various data sources including:
 * - PostgreSQL database (property data)
 * - External APIs (GIS data)
 * - File system (CSV, JSON data)
 * 
 * It provides a unified interface for ETL jobs to read from and write to data sources.
 */

import { properties } from '@shared/schema';

// Connector types supported by the ETL system
export type ConnectorType = 'database' | 'api' | 'file' | 'memory';

// Base configuration interface for all connector types
export interface BaseConnectorConfig {
  type: ConnectorType;
  name: string;
  description?: string;
}

// Database connector configuration
export interface DatabaseConnectorConfig extends BaseConnectorConfig {
  type: 'database';
  connectionString: string;
  schema?: string;
  table?: string;
}

// API connector configuration
export interface APIConnectorConfig extends BaseConnectorConfig {
  type: 'api';
  url: string;
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE';
  headers?: Record<string, string>;
  params?: Record<string, string>;
  body?: any;
  authType?: 'none' | 'basic' | 'bearer' | 'api-key';
  username?: string;
  password?: string;
  token?: string;
  apiKey?: string;
  apiKeyHeaderName?: string;
}

// File connector configuration
export interface FileConnectorConfig extends BaseConnectorConfig {
  type: 'file';
  path: string;
  format: 'csv' | 'json' | 'xml' | 'excel';
  delimiter?: string; // For CSV
  sheet?: string; // For Excel
  encoding?: string;
}

// Memory connector configuration (for in-memory data sources)
export interface MemoryConnectorConfig extends BaseConnectorConfig {
  type: 'memory';
  dataKey: string;
}

// Union type of all connector configurations
export type ConnectorConfig = 
  | DatabaseConnectorConfig 
  | APIConnectorConfig 
  | FileConnectorConfig 
  | MemoryConnectorConfig;

/**
 * Interface for data connectors
 */
export interface IDataConnector {
  connect(): Promise<void>;
  disconnect(): Promise<void>;
  test(): Promise<boolean>;
  read(query?: any): Promise<any[]>;
  write(data: any[], options?: any): Promise<number>;
  getMetadata(): Promise<any>;
}

/**
 * Database connector for PostgreSQL
 */
export class PostgreSQLConnector implements IDataConnector {
  private client: any;
  private db: any;
  private config: DatabaseConnectorConfig;
  private connected: boolean = false;

  constructor(config: DatabaseConnectorConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      // In a real implementation, we would use a proper PostgreSQL client
      // For our demo, we'll simulate the connection using the database URL from environment
      const connectionString = process.env.DATABASE_URL || this.config.connectionString;
      
      if (!connectionString) {
        throw new Error('Database connection string is not provided');
      }

      // Simulated connection - in a real app, you would connect to the actual database
      console.log(`Connecting to database: ${this.config.name}`);
      
      // Simulate successful connection
      this.connected = true;
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error connecting to database:', error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    if (this.connected) {
      console.log(`Disconnecting from database: ${this.config.name}`);
      this.connected = false;
    }
    return Promise.resolve();
  }

  async test(): Promise<boolean> {
    try {
      if (!this.connected) {
        await this.connect();
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async read(query?: any): Promise<any[]> {
    if (!this.connected) {
      await this.connect();
    }

    // For demo purposes, use the in-memory data instead of actual DB queries
    // In a real implementation, this would be a real DB query
    return fetch('/api/properties')
      .then(response => {
        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }
        return response.json();
      })
      .catch(error => {
        console.error('Error reading from database:', error);
        throw error;
      });
  }

  async write(data: any[], options?: any): Promise<number> {
    if (!this.connected) {
      await this.connect();
    }

    // For demo purposes, log the write operation
    console.log(`Writing ${data.length} records to database: ${this.config.name}`);
    
    // Simulate successful write operation
    return Promise.resolve(data.length);
  }

  async getMetadata(): Promise<any> {
    return {
      name: this.config.name,
      type: this.config.type,
      connected: this.connected,
      tables: ['properties', 'users', 'projects', 'scripts', 'script_groups', 'regression_models'],
      schema: this.config.schema || 'public'
    };
  }
}

/**
 * API connector for external REST APIs
 */
export class APIConnector implements IDataConnector {
  private config: APIConnectorConfig;
  private connected: boolean = false;

  constructor(config: APIConnectorConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      // Test the API connection
      const testResponse = await fetch(this.config.url, {
        method: 'HEAD',
        headers: this.getHeaders()
      });
      
      if (testResponse.ok) {
        this.connected = true;
        console.log(`Connected to API: ${this.config.name} (${this.config.url})`);
      } else {
        throw new Error(`Failed to connect to API: ${testResponse.status} ${testResponse.statusText}`);
      }
    } catch (error) {
      console.error('Error connecting to API:', error);
      this.connected = false;
      throw error;
    }
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      ...this.config.headers,
      'Content-Type': 'application/json'
    };

    // Add authentication headers if needed
    if (this.config.authType === 'basic' && this.config.username && this.config.password) {
      const credentials = btoa(`${this.config.username}:${this.config.password}`);
      headers['Authorization'] = `Basic ${credentials}`;
    } else if (this.config.authType === 'bearer' && this.config.token) {
      headers['Authorization'] = `Bearer ${this.config.token}`;
    } else if (this.config.authType === 'api-key' && this.config.apiKey && this.config.apiKeyHeaderName) {
      headers[this.config.apiKeyHeaderName] = this.config.apiKey;
    }

    return headers;
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    return Promise.resolve();
  }

  async test(): Promise<boolean> {
    try {
      if (!this.connected) {
        await this.connect();
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async read(query?: any): Promise<any[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const url = new URL(this.config.url);
      
      // Add query parameters if provided
      if (query && typeof query === 'object') {
        Object.entries(query).forEach(([key, value]) => {
          url.searchParams.append(key, String(value));
        });
      }
      
      const response = await fetch(url.toString(), {
        method: this.config.method || 'GET',
        headers: this.getHeaders(),
      });

      if (!response.ok) {
        throw new Error(`API request failed: ${response.status} ${response.statusText}`);
      }

      const data = await response.json();
      return Array.isArray(data) ? data : [data];
    } catch (error) {
      console.error('Error reading from API:', error);
      throw error;
    }
  }

  async write(data: any[], options?: any): Promise<number> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      const method = options?.method || this.config.method || 'POST';
      const url = options?.url || this.config.url;

      // For bulk operations, make individual requests for each item
      // In a real system, this could be optimized based on the API's capabilities
      const promises = data.map(item => 
        fetch(url, {
          method,
          headers: this.getHeaders(),
          body: JSON.stringify(item)
        })
      );

      const results = await Promise.allSettled(promises);
      const successful = results.filter(r => r.status === 'fulfilled').length;

      return successful;
    } catch (error) {
      console.error('Error writing to API:', error);
      throw error;
    }
  }

  async getMetadata(): Promise<any> {
    return {
      name: this.config.name,
      type: this.config.type,
      url: this.config.url,
      method: this.config.method || 'GET',
      connected: this.connected
    };
  }
}

/**
 * File connector for file-based data sources (CSV, JSON, etc.)
 */
export class FileConnector implements IDataConnector {
  private config: FileConnectorConfig;
  private connected: boolean = false;
  private data: any[] = [];

  constructor(config: FileConnectorConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    try {
      // In a browser environment, we would use the File API or similar
      // For our demo, we'll simulate file reading with fetch
      console.log(`Reading file: ${this.config.path}`);
      
      // Simulate successful connection
      this.connected = true;
      
      return Promise.resolve();
    } catch (error) {
      console.error('Error connecting to file:', error);
      this.connected = false;
      throw error;
    }
  }

  async disconnect(): Promise<void> {
    this.connected = false;
    return Promise.resolve();
  }

  async test(): Promise<boolean> {
    try {
      if (!this.connected) {
        await this.connect();
      }
      return true;
    } catch (error) {
      return false;
    }
  }

  async read(query?: any): Promise<any[]> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      // For demo purposes, simulate reading from a file
      // In a real app, this would read and parse the actual file
      
      // Generate some sample data based on the file type
      if (this.config.format === 'csv') {
        // Simulate CSV data
        return Array.from({ length: 20 }, (_, i) => ({
          id: i + 1,
          name: `Record ${i + 1}`,
          value: Math.floor(Math.random() * 1000),
          category: ['A', 'B', 'C'][Math.floor(Math.random() * 3)]
        }));
      } else if (this.config.format === 'json') {
        // Simulate JSON data
        return Array.from({ length: 15 }, (_, i) => ({
          id: `json-${i + 1}`,
          properties: {
            name: `Item ${i + 1}`,
            attributes: {
              color: ['red', 'green', 'blue'][Math.floor(Math.random() * 3)],
              size: Math.floor(Math.random() * 100)
            }
          },
          metadata: {
            createdAt: new Date().toISOString(),
            version: '1.0'
          }
        }));
      } else {
        // Default case
        return [];
      }
    } catch (error) {
      console.error('Error reading from file:', error);
      throw error;
    }
  }

  async write(data: any[], options?: any): Promise<number> {
    if (!this.connected) {
      await this.connect();
    }

    try {
      // For demo purposes, log the write operation
      console.log(`Writing ${data.length} records to file: ${this.config.path}`);
      
      // Store data in memory for demo purposes
      this.data = data;
      
      // Simulate successful write operation
      return Promise.resolve(data.length);
    } catch (error) {
      console.error('Error writing to file:', error);
      throw error;
    }
  }

  async getMetadata(): Promise<any> {
    return {
      name: this.config.name,
      type: this.config.type,
      path: this.config.path,
      format: this.config.format,
      connected: this.connected,
      recordCount: this.data.length
    };
  }
}

/**
 * Memory connector for in-memory data sources
 */
export class MemoryConnector implements IDataConnector {
  private config: MemoryConnectorConfig;
  private connected: boolean = false;
  private data: any[] = [];

  constructor(config: MemoryConnectorConfig) {
    this.config = config;
  }

  async connect(): Promise<void> {
    // Memory connectors are always connected
    this.connected = true;
    return Promise.resolve();
  }

  async disconnect(): Promise<void> {
    // Clear the data when disconnecting
    this.data = [];
    this.connected = false;
    return Promise.resolve();
  }

  async test(): Promise<boolean> {
    return true; // Memory connectors always pass the test
  }

  async read(query?: any): Promise<any[]> {
    if (!this.connected) {
      await this.connect();
    }

    // Return a copy of the data to prevent direct mutations
    return [...this.data];
  }

  async write(data: any[], options?: any): Promise<number> {
    if (!this.connected) {
      await this.connect();
    }

    // Replace or append the data based on options
    if (options?.append) {
      this.data = [...this.data, ...data];
    } else {
      this.data = [...data];
    }

    return this.data.length;
  }

  async getMetadata(): Promise<any> {
    return {
      name: this.config.name,
      type: this.config.type,
      connected: this.connected,
      recordCount: this.data.length,
      dataKey: this.config.dataKey
    };
  }
}

/**
 * Factory class to create appropriate connector based on configuration
 */
export class ConnectorFactory {
  static createConnector(config: ConnectorConfig): IDataConnector {
    switch (config.type) {
      case 'database':
        return new PostgreSQLConnector(config);
      case 'api':
        return new APIConnector(config);
      case 'file':
        return new FileConnector(config);
      case 'memory':
        return new MemoryConnector(config);
      default:
        throw new Error(`Unsupported connector type: ${(config as any).type}`);
    }
  }
}

/**
 * DataConnector service for managing all ETL data connections
 */
export class DataConnectorService {
  private connectors: Map<string, IDataConnector> = new Map();
  private configs: Map<string, ConnectorConfig> = new Map();
  
  private static instance: DataConnectorService;
  
  private constructor() {
    // Private constructor for singleton pattern
  }
  
  /**
   * Get the singleton instance
   */
  public static getInstance(): DataConnectorService {
    if (!DataConnectorService.instance) {
      DataConnectorService.instance = new DataConnectorService();
    }
    return DataConnectorService.instance;
  }
  
  /**
   * Register a new connector
   */
  public registerConnector(id: string, config: ConnectorConfig): void {
    const connector = ConnectorFactory.createConnector(config);
    this.connectors.set(id, connector);
    this.configs.set(id, config);
  }
  
  /**
   * Get a connector by ID
   */
  public getConnector(id: string): IDataConnector | undefined {
    return this.connectors.get(id);
  }
  
  /**
   * Get all registered connectors
   */
  public getAllConnectors(): Map<string, IDataConnector> {
    return this.connectors;
  }
  
  /**
   * Get connector configuration
   */
  public getConnectorConfig(id: string): ConnectorConfig | undefined {
    return this.configs.get(id);
  }
  
  /**
   * Get all connector configurations
   */
  public getAllConnectorConfigs(): Map<string, ConnectorConfig> {
    return this.configs;
  }
  
  /**
   * Remove a connector
   */
  public removeConnector(id: string): boolean {
    const connector = this.connectors.get(id);
    if (connector) {
      connector.disconnect().catch(error => {
        console.error(`Error disconnecting connector ${id}:`, error);
      });
      this.connectors.delete(id);
      this.configs.delete(id);
      return true;
    }
    return false;
  }
  
  /**
   * Initialize built-in connectors
   */
  public initializeBuiltInConnectors(): void {
    // Register a database connector for property data
    this.registerConnector('property-db', {
      type: 'database',
      name: 'Property Database',
      description: 'Main PostgreSQL database for property data',
      connectionString: process.env.DATABASE_URL || 'postgresql://localhost:5432/properties',
      schema: 'public',
      table: 'properties'
    });
    
    // Register a GIS API connector
    this.registerConnector('gis-api', {
      type: 'api',
      name: 'GIS Data API',
      description: 'External API for GIS data',
      url: 'https://api.gis.example.com/data',
      method: 'GET',
      authType: 'api-key',
      apiKeyHeaderName: 'X-API-Key'
    });
    
    // Register a demographic data file connector
    this.registerConnector('demographic-data', {
      type: 'file',
      name: 'Demographic Data',
      description: 'CSV file with demographic data by census tract',
      path: '/data/demographics.csv',
      format: 'csv',
      delimiter: ','
    });
    
    // Register an in-memory connector for script execution results
    this.registerConnector('script-results', {
      type: 'memory',
      name: 'Script Execution Results',
      description: 'In-memory storage for script execution results',
      dataKey: 'scriptResults'
    });
  }
  
  /**
   * Test all connectors
   */
  public async testAllConnectors(): Promise<Map<string, boolean>> {
    const results = new Map<string, boolean>();
    
    // Use Array.from to avoid for...of on Map.entries() compatibility issues
    const entries = Array.from(this.connectors.entries());
    for (let i = 0; i < entries.length; i++) {
      const [id, connector] = entries[i];
      try {
        const result = await connector.test();
        results.set(id, result);
      } catch (error) {
        console.error(`Error testing connector ${id}:`, error);
        results.set(id, false);
      }
    }
    
    return results;
  }
}

// Export singleton instance
export default DataConnectorService.getInstance();