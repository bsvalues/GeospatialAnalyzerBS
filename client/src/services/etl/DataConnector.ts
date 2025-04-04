/**
 * Data Connector Service
 * 
 * This service manages connections to different data sources for ETL operations.
 * It provides robust connection management, validation and error handling.
 */

import { v4 as uuidv4 } from 'uuid';
import { DataSource, DataSourceType, ETLAlert, ETLExecutionError } from './ETLTypes';

// Interface for connection validation errors
interface ValidationError {
  field: string;
  message: string;
  severity: 'error' | 'warning';
}

// Interface for connection status
interface ConnectionStatus {
  isConnected: boolean;
  lastAttempt: Date;
  errors: ETLExecutionError[];
  latencyMs?: number;
  connectionPoolSize?: number;
  throughputMbps?: number;
}

/**
 * Data Connector Service
 */
class DataConnector {
  private dataSources: Map<string, DataSource>;
  private activeConnections: Map<string, ConnectionStatus>;
  private connectionLogs: Map<string, ETLExecutionError[]>; 
  private MAX_CONNECTION_RETRIES = 3;
  private CONNECTION_TIMEOUT_MS = 5000;
  
  constructor() {
    this.dataSources = new Map<string, DataSource>();
    this.activeConnections = new Map<string, ConnectionStatus>();
    this.connectionLogs = new Map<string, ETLExecutionError[]>();
    
    // Initialize with sample data sources
    this.initializeSampleDataSources();

    // Register a Google Maps data source with an API key if one exists
    const googleMapsKey = import.meta.env.VITE_GOOGLE_MAPS_API_KEY;
    if (googleMapsKey) {
      const googleSource = this.registerDataSource({
        name: 'Google Maps API',
        description: 'Google Maps API for geocoding and location data',
        type: 'api',
        connectionDetails: {
          baseUrl: 'https://maps.googleapis.com/maps/api',
          apiKey: googleMapsKey,
          authType: 'api_key',
          timeout: 30000
        }
      });
      console.log('Google Maps data source registered with ID:', googleSource.id);
    }
  }
  
  /**
   * Register a new data source with validation
   */
  registerDataSource(params: {
    name: string;
    description?: string;
    type: DataSourceType;
    connectionDetails: Record<string, any>;
  }): DataSource {
    // Validate required fields
    if (!params.name) {
      throw new Error('Data source name is required');
    }
    
    if (!params.type) {
      throw new Error('Data source type is required');
    }
    
    // Validate connection details based on type
    const validationErrors = this.validateConnectionDetails(params.type, params.connectionDetails);
    if (validationErrors.filter(e => e.severity === 'error').length > 0) {
      const errorMessages = validationErrors
        .filter(e => e.severity === 'error')
        .map(e => `${e.field}: ${e.message}`)
        .join(', ');
      
      throw new Error(`Invalid connection details: ${errorMessages}`);
    }
    
    const id = uuidv4();
    const now = new Date();
    
    const dataSource: DataSource = {
      id,
      name: params.name,
      description: params.description,
      type: params.type,
      connectionDetails: this.sanitizeConnectionDetails(params.type, params.connectionDetails),
      isConnected: false,
      createdAt: now,
      updatedAt: now
    };
    
    this.dataSources.set(id, dataSource);
    this.connectionLogs.set(id, []);
    
    return dataSource;
  }
  
  /**
   * Get all registered data sources
   */
  getAllDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }
  
  /**
   * Get a data source by ID
   */
  getDataSource(id: string): DataSource | undefined {
    return this.dataSources.get(id);
  }
  
  /**
   * Find data sources by type
   */
  findDataSourcesByType(type: DataSourceType): DataSource[] {
    return this.getAllDataSources().filter(ds => ds.type === type);
  }
  
  /**
   * Find data sources by name pattern
   */
  findDataSourcesByName(pattern: string): DataSource[] {
    const regex = new RegExp(pattern, 'i');
    return this.getAllDataSources().filter(ds => regex.test(ds.name));
  }
  
  /**
   * Update an existing data source with validation
   */
  updateDataSource(id: string, updates: Partial<DataSource>): DataSource | undefined {
    const existingSource = this.dataSources.get(id);
    
    if (!existingSource) {
      return undefined;
    }
    
    // Validate connection details if they're being updated
    if (updates.connectionDetails && updates.type) {
      const validationErrors = this.validateConnectionDetails(
        updates.type, 
        updates.connectionDetails
      );
      
      if (validationErrors.filter(e => e.severity === 'error').length > 0) {
        const errorMessages = validationErrors
          .filter(e => e.severity === 'error')
          .map(e => `${e.field}: ${e.message}`)
          .join(', ');
        
        throw new Error(`Invalid connection details: ${errorMessages}`);
      }
      
      // Sanitize connection details
      updates.connectionDetails = this.sanitizeConnectionDetails(
        updates.type, 
        updates.connectionDetails
      );
    } else if (updates.connectionDetails && existingSource.type) {
      const validationErrors = this.validateConnectionDetails(
        existingSource.type, 
        updates.connectionDetails
      );
      
      if (validationErrors.filter(e => e.severity === 'error').length > 0) {
        const errorMessages = validationErrors
          .filter(e => e.severity === 'error')
          .map(e => `${e.field}: ${e.message}`)
          .join(', ');
        
        throw new Error(`Invalid connection details: ${errorMessages}`);
      }
      
      // Sanitize connection details
      updates.connectionDetails = this.sanitizeConnectionDetails(
        existingSource.type, 
        updates.connectionDetails
      );
    }
    
    // If connection details changed, reset connection status
    if (updates.connectionDetails) {
      updates.isConnected = false;
      this.closeConnection(id);
    }
    
    const updatedSource: DataSource = {
      ...existingSource,
      ...updates,
      updatedAt: new Date()
    };
    
    this.dataSources.set(id, updatedSource);
    return updatedSource;
  }
  
  /**
   * Delete a data source
   */
  deleteDataSource(id: string): boolean {
    // Close connection if active
    if (this.activeConnections.has(id)) {
      this.closeConnection(id);
    }
    
    // Clean up connection logs
    this.connectionLogs.delete(id);
    
    return this.dataSources.delete(id);
  }
  
  /**
   * Connect to a data source with retries and better error handling
   */
  async connectToDataSource(id: string): Promise<boolean> {
    const dataSource = this.dataSources.get(id);
    
    if (!dataSource) {
      this.logConnectionError(id, 'connection_error', `Data source with ID ${id} not found`);
      throw new Error(`Data source with ID ${id} not found`);
    }
    
    // Validate connection details before attempting to connect
    const validationErrors = this.validateConnectionDetails(
      dataSource.type, 
      dataSource.connectionDetails
    );
    
    if (validationErrors.filter(e => e.severity === 'error').length > 0) {
      const errorMessages = validationErrors
        .filter(e => e.severity === 'error')
        .map(e => `${e.field}: ${e.message}`)
        .join(', ');
      
      this.logConnectionError(id, 'validation_error', `Invalid connection details: ${errorMessages}`);
      throw new Error(`Invalid connection details: ${errorMessages}`);
    }
    
    // Try to connect with retries
    let retries = 0;
    let lastError: Error | null = null;
    
    while (retries < this.MAX_CONNECTION_RETRIES) {
      try {
        const startTime = Date.now();
        await this.establishConnection(dataSource);
        const latencyMs = Date.now() - startTime;
        
        // In a real implementation, we would store the actual connection object
        this.activeConnections.set(id, { 
          isConnected: true, 
          lastAttempt: new Date(),
          errors: [],
          latencyMs
        });
        
        // Update the data source with connection status
        this.updateDataSource(id, {
          isConnected: true,
          lastConnected: new Date()
        });
        
        return true;
      } catch (error) {
        retries++;
        lastError = error instanceof Error ? error : new Error('Unknown connection error');
        
        // Log the connection attempt failure
        this.logConnectionError(
          id, 
          'connection_attempt_failed', 
          `Connection attempt ${retries}/${this.MAX_CONNECTION_RETRIES} failed: ${lastError.message}`
        );
        
        if (retries < this.MAX_CONNECTION_RETRIES) {
          // Wait before retrying - exponential backoff
          await new Promise(resolve => setTimeout(resolve, 1000 * Math.pow(2, retries - 1)));
        }
      }
    }
    
    // All retries failed
    if (lastError) {
      this.logConnectionError(id, 'connection_failed', `All connection attempts failed: ${lastError.message}`);
      console.error(`Failed to connect to data source ${dataSource.name} after ${this.MAX_CONNECTION_RETRIES} attempts:`, lastError);
    }
    
    return false;
  }
  
  /**
   * Get connection logs for a data source
   */
  getConnectionLogs(id: string): ETLExecutionError[] {
    return this.connectionLogs.get(id) || [];
  }
  
  /**
   * Close connection to a data source
   */
  closeConnection(id: string): boolean {
    const connection = this.activeConnections.get(id);
    
    if (!connection) {
      return false;
    }
    
    try {
      // In a real implementation, we would properly close the connection
      this.activeConnections.delete(id);
      
      // Update the data source connection status
      const dataSource = this.dataSources.get(id);
      if (dataSource) {
        this.updateDataSource(id, {
          isConnected: false
        });
      }
      
      return true;
    } catch (error) {
      this.logConnectionError(id, 'connection_close_error', `Error closing connection: ${error instanceof Error ? error.message : 'Unknown error'}`);
      return false;
    }
  }
  
  /**
   * Test connection to a data source
   */
  async testConnection(id: string): Promise<{ 
    success: boolean; 
    message: string;
    details?: {
      validationErrors?: ValidationError[];
      connectionLatencyMs?: number;
    }
  }> {
    const dataSource = this.dataSources.get(id);
    
    if (!dataSource) {
      return {
        success: false,
        message: `Data source with ID ${id} not found`
      };
    }
    
    // First validate connection details
    const validationErrors = this.validateConnectionDetails(
      dataSource.type, 
      dataSource.connectionDetails
    );
    
    const criticalErrors = validationErrors.filter(e => e.severity === 'error');
    if (criticalErrors.length > 0) {
      return {
        success: false,
        message: `Invalid connection details: ${criticalErrors[0].message}`,
        details: {
          validationErrors
        }
      };
    }
    
    try {
      const startTime = Date.now();
      await this.establishConnection(dataSource);
      const latencyMs = Date.now() - startTime;
      
      return {
        success: true,
        message: `Successfully connected to ${dataSource.name}`,
        details: {
          connectionLatencyMs: latencyMs,
          validationErrors: validationErrors.filter(e => e.severity === 'warning')
        }
      };
    } catch (error) {
      this.logConnectionError(id, 'test_connection_failed', error instanceof Error ? error.message : 'Unknown error occurred');
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Unknown error occurred',
        details: {
          validationErrors: validationErrors.filter(e => e.severity === 'warning')
        }
      };
    }
  }
  
  /**
   * Private method to log connection errors
   */
  private logConnectionError(dataSourceId: string, code: string, message: string): void {
    const logs = this.connectionLogs.get(dataSourceId) || [];
    logs.push({
      code,
      message,
      timestamp: new Date()
    });
    
    // Keep only the latest 100 logs
    if (logs.length > 100) {
      logs.shift();
    }
    
    this.connectionLogs.set(dataSourceId, logs);
  }
  
  /**
   * Private method to establish connection to a data source
   */
  private async establishConnection(dataSource: DataSource): Promise<void> {
    // Set a timeout to prevent hanging connections
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => {
        reject(new Error(`Connection timed out after ${this.CONNECTION_TIMEOUT_MS}ms`));
      }, this.CONNECTION_TIMEOUT_MS);
    });
    
    // Actual connection attempt
    const connectionPromise = this.simulateConnection(dataSource);
    
    // Race between connection and timeout
    return Promise.race([connectionPromise, timeoutPromise]);
  }
  
  /**
   * Private method to simulate connection to a data source
   */
  private async simulateConnection(dataSource: DataSource): Promise<void> {
    // This is a mock implementation for demonstration purposes
    await new Promise<void>((resolve, reject) => {
      setTimeout(() => {
        // Simulate connection based on data source type
        switch (dataSource.type) {
          case 'database':
            if (!dataSource.connectionDetails.host) {
              reject(new Error('Database host is required'));
              return;
            }
            
            if (dataSource.connectionDetails.port && 
                (isNaN(Number(dataSource.connectionDetails.port)) || 
                Number(dataSource.connectionDetails.port) <= 0)) {
              reject(new Error('Database port must be a positive number'));
              return;
            }
            
            if (!dataSource.connectionDetails.database) {
              reject(new Error('Database name is required'));
              return;
            }
            
            if (dataSource.connectionDetails.host === 'invalid-host') {
              reject(new Error('Could not connect to database host'));
              return;
            }
            
            if (dataSource.connectionDetails.host === 'timeout-host') {
              // Simulate a timeout by not resolving or rejecting
              return;
            }
            
            break;
            
          case 'api':
            if (!dataSource.connectionDetails.baseUrl) {
              reject(new Error('API base URL is required'));
              return;
            }
            
            try {
              new URL(dataSource.connectionDetails.baseUrl);
            } catch (e) {
              reject(new Error('API base URL is not a valid URL'));
              return;
            }
            
            if (dataSource.connectionDetails.baseUrl.includes('invalid')) {
              reject(new Error('Invalid API URL or API is not responding'));
              return;
            }
            
            if (dataSource.connectionDetails.timeout && 
                (isNaN(Number(dataSource.connectionDetails.timeout)) || 
                Number(dataSource.connectionDetails.timeout) <= 0)) {
              reject(new Error('API timeout must be a positive number'));
              return;
            }
            
            if (dataSource.connectionDetails.authType === 'api_key' && 
                !dataSource.connectionDetails.apiKey) {
              reject(new Error('API key is required when auth type is api_key'));
              return;
            }
            
            break;
            
          case 'file':
            if (!dataSource.connectionDetails.path) {
              reject(new Error('File path is required'));
              return;
            }
            
            if (dataSource.connectionDetails.path.includes('invalid')) {
              reject(new Error('File path does not exist or is not accessible'));
              return;
            }
            
            break;
            
          default:
            // Always succeed for other types
            break;
        }
        
        // Connection successful
        resolve();
      }, 1000); // Simulate network delay
    });
  }
  
  /**
   * Validate connection details based on data source type
   */
  private validateConnectionDetails(
    type: DataSourceType, 
    details: Record<string, any>
  ): ValidationError[] {
    const errors: ValidationError[] = [];
    
    switch (type) {
      case 'database':
        if (!details.host) {
          errors.push({
            field: 'host',
            message: 'Database host is required',
            severity: 'error'
          });
        }
        
        if (!details.database) {
          errors.push({
            field: 'database',
            message: 'Database name is required',
            severity: 'error'
          });
        }
        
        if (details.port) {
          const port = Number(details.port);
          if (isNaN(port) || port <= 0 || port > 65535) {
            errors.push({
              field: 'port',
              message: 'Port must be a number between 1 and 65535',
              severity: 'error'
            });
          }
        } else {
          errors.push({
            field: 'port',
            message: 'Port is recommended for database connections',
            severity: 'warning'
          });
        }
        
        if (!details.username) {
          errors.push({
            field: 'username',
            message: 'Username is recommended for database connections',
            severity: 'warning'
          });
        }
        
        break;
        
      case 'api':
        if (!details.baseUrl) {
          errors.push({
            field: 'baseUrl',
            message: 'API base URL is required',
            severity: 'error'
          });
        } else {
          try {
            new URL(details.baseUrl);
          } catch (e) {
            errors.push({
              field: 'baseUrl',
              message: 'API base URL is not a valid URL',
              severity: 'error'
            });
          }
        }
        
        if (details.timeout) {
          const timeout = Number(details.timeout);
          if (isNaN(timeout) || timeout <= 0) {
            errors.push({
              field: 'timeout',
              message: 'Timeout must be a positive number',
              severity: 'error'
            });
          }
        }
        
        if (details.authType === 'api_key' && !details.apiKey) {
          errors.push({
            field: 'apiKey',
            message: 'API key is required when auth type is api_key',
            severity: 'error'
          });
        }
        
        break;
        
      case 'file':
        if (!details.path) {
          errors.push({
            field: 'path',
            message: 'File path is required',
            severity: 'error'
          });
        }
        
        if (!details.filePattern) {
          errors.push({
            field: 'filePattern',
            message: 'File pattern is recommended for file data sources',
            severity: 'warning'
          });
        }
        
        break;
        
      default:
        // No validation for other types
        break;
    }
    
    return errors;
  }
  
  /**
   * Sanitize connection details (remove sensitive info, format properly)
   */
  private sanitizeConnectionDetails(
    type: DataSourceType, 
    details: Record<string, any>
  ): Record<string, any> {
    const sanitized = { ...details };
    
    // Remove any trailing whitespace from string values
    Object.keys(sanitized).forEach(key => {
      if (typeof sanitized[key] === 'string') {
        sanitized[key] = sanitized[key].trim();
      }
    });
    
    switch (type) {
      case 'database':
        // Ensure port is a number
        if (sanitized.port) {
          sanitized.port = Number(sanitized.port);
        }
        
        // Mask password in the returned object (but keep original in internal storage)
        if (sanitized.password) {
          // Create a deep copy with masked password for display
          sanitized.password = '●'.repeat(sanitized.password.length);
        }
        
        break;
        
      case 'api':
        // Ensure timeout is a number
        if (sanitized.timeout) {
          sanitized.timeout = Number(sanitized.timeout);
        }
        
        // Ensure baseUrl doesn't have trailing slash
        if (sanitized.baseUrl && sanitized.baseUrl.endsWith('/')) {
          sanitized.baseUrl = sanitized.baseUrl.slice(0, -1);
        }
        
        // Mask API key in the returned object (but keep original in internal storage)
        if (sanitized.apiKey) {
          const apiKeyLength = sanitized.apiKey.length;
          if (apiKeyLength > 8) {
            sanitized.apiKey = 
              sanitized.apiKey.substring(0, 4) + 
              '●'.repeat(apiKeyLength - 8) + 
              sanitized.apiKey.substring(apiKeyLength - 4);
          } else {
            sanitized.apiKey = '●'.repeat(apiKeyLength);
          }
        }
        
        break;
        
      case 'file':
        // Ensure path doesn't have extra slashes
        if (sanitized.path) {
          sanitized.path = sanitized.path.replace(/\/+/g, '/');
        }
        
        break;
        
      default:
        // No sanitization for other types
        break;
    }
    
    return sanitized;
  }
  
  /**
   * Initialize with sample data sources
   */
  private initializeSampleDataSources() {
    // Sample database source
    const dbSource: DataSource = this.registerDataSource({
      name: 'County Property Database',
      description: 'Main county property records database',
      type: 'database',
      connectionDetails: {
        host: 'property-db.example.com',
        port: 5432,
        database: 'property_records',
        username: 'etl_user',
        ssl: true
      }
    });
    
    // Sample API source
    const apiSource: DataSource = this.registerDataSource({
      name: 'Census API',
      description: 'US Census Bureau API for demographic data (DEMO)',
      type: 'api',
      connectionDetails: {
        baseUrl: 'https://api.census.gov/data',
        authType: 'api_key',
        apiKey: 'SAMPLE_DEMO_KEY_123',  // DEMO key for UI testing only
        timeout: 30000
      }
    });
    
    // Sample file source
    const fileSource: DataSource = this.registerDataSource({
      name: 'GIS Data Files',
      description: 'GIS shapefiles and property boundary data',
      type: 'file',
      connectionDetails: {
        path: '/data/gis',
        filePattern: '*.shp',
        encoding: 'utf-8'
      }
    });
    
    // Sample target database
    const targetDb: DataSource = this.registerDataSource({
      name: 'Analytics Database',
      description: 'Target database for processed property analytics',
      type: 'database',
      connectionDetails: {
        host: 'analytics-db.example.com',
        port: 5432,
        database: 'property_analytics',
        username: 'analytics_user',
        ssl: true
      }
    });
    
    // Sample target file system
    const targetFile: DataSource = this.registerDataSource({
      name: 'Analytics Export Files',
      description: 'Target file system for analytics exports',
      type: 'file',
      connectionDetails: {
        path: '/data/exports',
        filePattern: '*.csv',
        encoding: 'utf-8',
        delimiter: ','
      }
    });
  }
}

export const dataConnector = new DataConnector();