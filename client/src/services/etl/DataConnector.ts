/**
 * Data Connector Service
 * 
 * This service manages connections to various data sources and provides
 * a unified interface for data extraction and loading operations.
 */

import { v4 as uuidv4 } from 'uuid';
import { DataSource, DataSourceType } from './ETLTypes';

interface DatabaseConnectionConfig {
  host: string;
  port: number;
  database: string;
  username: string;
  password: string;
  ssl?: boolean;
}

interface ApiConnectionConfig {
  baseUrl: string;
  authType: 'none' | 'basic' | 'bearer' | 'apiKey';
  authDetails?: {
    username?: string;
    password?: string;
    token?: string;
    apiKey?: string;
    apiKeyName?: string;
    apiKeyLocation?: 'header' | 'query';
  };
  headers?: Record<string, string>;
}

interface FileConnectionConfig {
  fileType: 'csv' | 'json' | 'xml' | 'excel' | 'parquet';
  delimiter?: string; // for CSV
  hasHeader?: boolean; // for CSV, Excel
  sheet?: string; // for Excel
  encoding?: string;
}

export class DataConnector {
  private dataSources: Map<string, DataSource> = new Map();
  private activeConnections: Map<string, any> = new Map();
  
  /**
   * Register a new data source
   */
  registerDataSource(source: Omit<DataSource, 'id' | 'createdAt' | 'updatedAt'>): DataSource {
    const id = uuidv4();
    const now = new Date();
    
    const newSource: DataSource = {
      id,
      ...source,
      createdAt: now,
      updatedAt: now
    };
    
    this.dataSources.set(id, newSource);
    return newSource;
  }
  
  /**
   * Get a data source by ID
   */
  getDataSource(sourceId: string): DataSource | undefined {
    return this.dataSources.get(sourceId);
  }
  
  /**
   * Get all data sources
   */
  getAllDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }
  
  /**
   * Update a data source
   */
  updateDataSource(sourceId: string, updates: Partial<Omit<DataSource, 'id' | 'createdAt'>>): DataSource | undefined {
    const source = this.dataSources.get(sourceId);
    if (!source) return undefined;
    
    // If updating connection details, close any active connection
    if (updates.connectionDetails) {
      this.closeConnection(sourceId);
    }
    
    const updatedSource: DataSource = {
      ...source,
      ...updates,
      updatedAt: new Date()
    };
    
    this.dataSources.set(sourceId, updatedSource);
    return updatedSource;
  }
  
  /**
   * Delete a data source
   */
  deleteDataSource(sourceId: string): boolean {
    // Close any active connection first
    this.closeConnection(sourceId);
    
    return this.dataSources.delete(sourceId);
  }
  
  /**
   * Connect to a data source
   */
  async connect(sourceId: string): Promise<boolean> {
    const source = this.dataSources.get(sourceId);
    if (!source) return false;
    
    // Check if already connected
    if (this.activeConnections.has(sourceId)) {
      return true;
    }
    
    try {
      let connection;
      
      switch (source.type) {
        case 'database':
          connection = await this.connectToDatabase(source);
          break;
        case 'api':
          connection = await this.connectToApi(source);
          break;
        case 'file':
          connection = await this.connectToFile(source);
          break;
        case 'memory':
          connection = this.createMemoryConnection();
          break;
        default:
          throw new Error(`Unsupported data source type: ${source.type}`);
      }
      
      this.activeConnections.set(sourceId, connection);
      return true;
    } catch (error) {
      console.error(`Failed to connect to data source ${source.name}:`, error);
      return false;
    }
  }
  
  /**
   * Close connection to a data source
   */
  closeConnection(sourceId: string): void {
    const connection = this.activeConnections.get(sourceId);
    if (!connection) return;
    
    const source = this.dataSources.get(sourceId);
    if (!source) return;
    
    try {
      // Perform type-specific cleanup
      switch (source.type) {
        case 'database':
          // Close database connection
          if (connection.end) connection.end();
          break;
        case 'api':
          // API connections typically don't need explicit cleanup
          break;
        case 'file':
          // Close file handles if any
          if (connection.close) connection.close();
          break;
        case 'memory':
          // Clear memory references
          break;
      }
    } catch (error) {
      console.error(`Error closing connection to ${source.name}:`, error);
    } finally {
      this.activeConnections.delete(sourceId);
    }
  }
  
  /**
   * Extract data from a source
   */
  async extractData(sourceId: string, query: string): Promise<any[]> {
    // Ensure connection is active
    if (!this.activeConnections.has(sourceId)) {
      const connected = await this.connect(sourceId);
      if (!connected) {
        throw new Error(`Failed to connect to data source ${sourceId}`);
      }
    }
    
    const source = this.dataSources.get(sourceId);
    if (!source) {
      throw new Error(`Unknown data source ${sourceId}`);
    }
    
    const connection = this.activeConnections.get(sourceId);
    
    try {
      switch (source.type) {
        case 'database':
          return await this.queryDatabase(connection, query);
        case 'api':
          return await this.queryApi(connection, query, source);
        case 'file':
          return await this.queryFile(connection, query);
        case 'memory':
          return this.queryMemory(connection, query);
        default:
          throw new Error(`Unsupported data source type: ${source.type}`);
      }
    } catch (error) {
      console.error(`Error extracting data from ${source.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Load data to a target
   */
  async loadData(targetId: string, data: any[]): Promise<number> {
    // Ensure connection is active
    if (!this.activeConnections.has(targetId)) {
      const connected = await this.connect(targetId);
      if (!connected) {
        throw new Error(`Failed to connect to target ${targetId}`);
      }
    }
    
    const target = this.dataSources.get(targetId);
    if (!target) {
      throw new Error(`Unknown target ${targetId}`);
    }
    
    const connection = this.activeConnections.get(targetId);
    
    try {
      switch (target.type) {
        case 'database':
          return await this.loadToDatabase(connection, data, target);
        case 'api':
          return await this.loadToApi(connection, data, target);
        case 'file':
          return await this.loadToFile(connection, data, target);
        case 'memory':
          return this.loadToMemory(connection, data);
        default:
          throw new Error(`Unsupported target type: ${target.type}`);
      }
    } catch (error) {
      console.error(`Error loading data to ${target.name}:`, error);
      throw error;
    }
  }
  
  /**
   * Test connection to a data source
   */
  async testConnection(sourceId: string): Promise<{ success: boolean; message: string }> {
    try {
      const connected = await this.connect(sourceId);
      if (!connected) {
        return { success: false, message: "Failed to establish connection" };
      }
      
      // Try a simple query to verify connection works
      const source = this.dataSources.get(sourceId);
      if (!source) {
        return { success: false, message: "Data source not found" };
      }
      
      switch (source.type) {
        case 'database':
          await this.queryDatabase(this.activeConnections.get(sourceId), "SELECT 1");
          break;
        case 'api':
          // Send test request
          break;
        case 'file':
          // Verify file access
          break;
        case 'memory':
          // Memory source is always accessible
          break;
      }
      
      // Close the test connection
      this.closeConnection(sourceId);
      
      return { success: true, message: "Connection successful" };
    } catch (error) {
      return { 
        success: false, 
        message: `Connection test failed: ${error instanceof Error ? error.message : String(error)}` 
      };
    }
  }
  
  // Private methods for different connection types
  
  private async connectToDatabase(source: DataSource): Promise<any> {
    const config = source.connectionDetails as DatabaseConnectionConfig;
    
    // In a real implementation, this would create an actual database connection
    // For this demo, we'll simulate a connection
    console.log(`Connecting to database ${config.database} at ${config.host}:${config.port}`);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    return {
      query: async (sql: string) => {
        // Simulate query execution
        console.log(`Executing SQL query: ${sql}`);
        await new Promise(resolve => setTimeout(resolve, 300));
        
        // Return mock data
        return Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          name: `Record ${i + 1}`,
          value: Math.floor(Math.random() * 1000)
        }));
      },
      end: () => {
        console.log(`Disconnecting from database ${config.database}`);
      }
    };
  }
  
  private async connectToApi(source: DataSource): Promise<any> {
    const config = source.connectionDetails as ApiConnectionConfig;
    
    // In a real implementation, this would create an API client
    console.log(`Setting up API client for ${config.baseUrl}`);
    
    // Simulate connection delay
    await new Promise(resolve => setTimeout(resolve, 300));
    
    return {
      request: async (endpoint: string, method = 'GET') => {
        // Simulate API request
        console.log(`Making ${method} request to ${config.baseUrl}${endpoint}`);
        await new Promise(resolve => setTimeout(resolve, 500));
        
        // Return mock data
        return Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          title: `Item ${i + 1}`,
          completed: Math.random() > 0.5
        }));
      }
    };
  }
  
  private async connectToFile(source: DataSource): Promise<any> {
    const config = source.connectionDetails as FileConnectionConfig;
    
    // In a real implementation, this would open a file stream
    console.log(`Opening ${config.fileType} file`);
    
    // Simulate file opening delay
    await new Promise(resolve => setTimeout(resolve, 200));
    
    return {
      read: async () => {
        // Simulate file reading
        console.log(`Reading ${config.fileType} file`);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        // Return mock data
        return Array.from({ length: 10 }, (_, i) => ({
          id: i + 1,
          column1: `Value ${i + 1}`,
          column2: i * 10
        }));
      },
      write: async (data: any[]) => {
        // Simulate file writing
        console.log(`Writing ${data.length} records to ${config.fileType} file`);
        await new Promise(resolve => setTimeout(resolve, 400));
        
        return data.length;
      },
      close: () => {
        console.log(`Closing ${config.fileType} file`);
      }
    };
  }
  
  private createMemoryConnection(): any {
    // In-memory data store
    const dataStore: any[] = [];
    
    return {
      data: dataStore,
      query: (filter: string) => {
        console.log(`Querying in-memory data with filter: ${filter}`);
        // Simple filtering logic
        if (filter === "*") {
          return [...dataStore];
        }
        
        // Parse simple filter expressions
        // This is a very simplified implementation
        const match = filter.match(/(\w+)\s*=\s*['"]?([^'"]+)['"]?/);
        if (match) {
          const [_, field, value] = match;
          return dataStore.filter(item => item[field] == value);
        }
        
        return [...dataStore];
      },
      write: (data: any[]) => {
        dataStore.push(...data);
        return data.length;
      },
      clear: () => {
        dataStore.length = 0;
      }
    };
  }
  
  private async queryDatabase(connection: any, query: string): Promise<any[]> {
    // Execute query on database connection
    return await connection.query(query);
  }
  
  private async queryApi(connection: any, query: string, source: DataSource): Promise<any[]> {
    // Parse the query string to determine API endpoint and method
    // This is a simplified parsing logic
    const config = source.connectionDetails as ApiConnectionConfig;
    let endpoint = query;
    let method = 'GET';
    
    if (query.startsWith('GET ')) {
      endpoint = query.substring(4);
    } else if (query.startsWith('POST ')) {
      endpoint = query.substring(5);
      method = 'POST';
    }
    
    return await connection.request(endpoint, method);
  }
  
  private async queryFile(connection: any, query: string): Promise<any[]> {
    // For files, the query might be a filter expression
    // For simplicity, we'll just read all data
    const data = await connection.read();
    
    // Apply simple filtering if query is not "*"
    if (query !== "*") {
      // Implement simple filtering logic here
      // For now, just return all data
    }
    
    return data;
  }
  
  private queryMemory(connection: any, query: string): any[] {
    // Execute query on in-memory data
    return connection.query(query);
  }
  
  private async loadToDatabase(connection: any, data: any[], target: DataSource): Promise<number> {
    // In a real implementation, this would insert/update data in the database
    console.log(`Loading ${data.length} records to database ${target.name}`);
    
    // Simulate loading delay
    await new Promise(resolve => setTimeout(resolve, 800));
    
    return data.length;
  }
  
  private async loadToApi(connection: any, data: any[], target: DataSource): Promise<number> {
    // In a real implementation, this would send data to an API
    console.log(`Sending ${data.length} records to API ${target.name}`);
    
    // Simulate API calls
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return data.length;
  }
  
  private async loadToFile(connection: any, data: any[], target: DataSource): Promise<number> {
    // Write data to file
    return await connection.write(data);
  }
  
  private loadToMemory(connection: any, data: any[]): number {
    // Write data to in-memory store
    return connection.write(data);
  }
}

// Export singleton instance
export const dataConnector = new DataConnector();