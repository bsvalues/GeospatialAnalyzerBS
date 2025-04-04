/**
 * ConnectionTestService
 * 
 * This service provides functionality for testing connections to various data sources,
 * including databases, APIs, and file systems. It performs connectivity checks, 
 * validates credentials, and measures connection performance.
 */

import { DataSource, DataSourceType } from './ETLTypes';

// Connection test result interface
export interface ConnectionTestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  details?: Record<string, any>;
  error?: Error | string;
  timestamp: Date;
}

// Connection statistics interface
export interface ConnectionStats {
  avgLatencyMs: number;
  successRate: number;
  lastSuccess?: Date;
  lastFailure?: Date;
  testCount: number;
}

/**
 * Connection Test Service class
 */
export class ConnectionTestService {
  private static instance: ConnectionTestService;
  private connectionStats: Map<string, ConnectionStats> = new Map();
  
  private constructor() {}
  
  /**
   * Get singleton instance
   */
  public static getInstance(): ConnectionTestService {
    if (!ConnectionTestService.instance) {
      ConnectionTestService.instance = new ConnectionTestService();
    }
    return ConnectionTestService.instance;
  }
  
  /**
   * Test connection to a data source
   * @param dataSource The data source to test
   * @returns Test result with details
   */
  public async testConnection(dataSource: DataSource): Promise<ConnectionTestResult> {
    const startTime = Date.now();
    const result: ConnectionTestResult = {
      success: false,
      message: '',
      timestamp: new Date()
    };
    
    try {
      // Validate data source has minimum required properties
      if (!dataSource || !dataSource.id || !dataSource.type) {
        throw new Error('Invalid data source configuration');
      }
      
      // Perform type-specific connection tests
      switch (dataSource.type) {
        case 'database':
          await this.testDatabaseConnection(dataSource, result);
          break;
        case 'api':
          await this.testApiConnection(dataSource, result);
          break;
        case 'file':
          await this.testFileConnection(dataSource, result);
          break;
        case 'memory':
          this.testMemoryConnection(dataSource, result);
          break;
        default:
          throw new Error(`Unsupported data source type: ${dataSource.type}`);
      }
      
      // Calculate latency
      const endTime = Date.now();
      result.latencyMs = endTime - startTime;
      
      // Update connection statistics
      this.updateConnectionStats(dataSource.id, result);
      
      return result;
    } catch (error: any) {
      // Handle errors and provide useful feedback
      result.success = false;
      result.message = `Connection failed: ${error.message || error}`;
      result.error = error;
      
      // Calculate latency even for failures
      const endTime = Date.now();
      result.latencyMs = endTime - startTime;
      
      // Update connection statistics
      this.updateConnectionStats(dataSource.id, result);
      
      return result;
    }
  }
  
  /**
   * Get connection statistics for a data source
   * @param dataSourceId The data source ID
   * @returns Connection statistics if available
   */
  public getConnectionStats(dataSourceId: string): ConnectionStats | undefined {
    return this.connectionStats.get(dataSourceId);
  }
  
  /**
   * Reset connection statistics for a data source
   * @param dataSourceId The data source ID
   */
  public resetConnectionStats(dataSourceId: string): void {
    this.connectionStats.delete(dataSourceId);
  }
  
  /**
   * Test database connection
   */
  private async testDatabaseConnection(
    dataSource: DataSource, 
    result: ConnectionTestResult
  ): Promise<void> {
    const { connectionDetails } = dataSource;
    
    // Verify required connection details
    if (!connectionDetails) {
      throw new Error('Missing database connection details');
    }
    
    const { host, port, database, username, password, ssl, schema, type } = connectionDetails;
    
    if (!host) {
      throw new Error('Missing database host');
    }
    
    if (!database) {
      throw new Error('Missing database name');
    }
    
    // For a real implementation, attempt actual connection to the database
    // Here we're simulating a successful connection
    
    // Check if using API endpoint for connection test
    try {
      const response = await fetch(`/api/etl/data-sources/${dataSource.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionDetails })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Database connection test failed');
      }
      
      const testData = await response.json();
      
      result.success = true;
      result.message = 'Database connection successful';
      result.details = {
        databaseType: type || 'unknown',
        version: testData.version || 'unknown',
        tables: testData.tables || [],
        schema: schema || 'public'
      };
    } catch (error: any) {
      console.error('Database connection test error:', error);
      throw new Error(`Database connection failed: ${error.message}`);
    }
  }
  
  /**
   * Test API connection
   */
  private async testApiConnection(
    dataSource: DataSource, 
    result: ConnectionTestResult
  ): Promise<void> {
    const { connectionDetails } = dataSource;
    
    // Verify required connection details
    if (!connectionDetails) {
      throw new Error('Missing API connection details');
    }
    
    const { url, method, headers, authType, apiKey, username, password } = connectionDetails;
    
    if (!url) {
      throw new Error('Missing API URL');
    }
    
    // Create headers for the request
    const requestHeaders: Record<string, string> = { 
      ...(headers || {})
    };
    
    // Add authentication headers if specified
    if (authType === 'apiKey' && apiKey) {
      // Determine if it's a header-based or query param-based API key
      if (connectionDetails.apiKeyLocation === 'header' && connectionDetails.apiKeyName) {
        requestHeaders[connectionDetails.apiKeyName] = apiKey;
      }
      // Query param based auth is handled in the URL with endpoint
    } else if (authType === 'basic' && username && password) {
      const basicAuth = btoa(`${username}:${password}`);
      requestHeaders['Authorization'] = `Basic ${basicAuth}`;
    }
    
    // For actual implementation, attempt an API request
    try {
      // Use the test endpoint on our server to avoid CORS issues
      const response = await fetch(`/api/etl/data-sources/${dataSource.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionDetails })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'API connection test failed');
      }
      
      const testData = await response.json();
      
      result.success = true;
      result.message = 'API connection successful';
      result.details = {
        contentType: response.headers.get('content-type'),
        status: response.status,
        responseTime: testData.responseTime,
        dataPreview: testData.dataPreview
      };
    } catch (error: any) {
      console.error('API connection test error:', error);
      throw new Error(`API connection failed: ${error.message}`);
    }
  }
  
  /**
   * Test file connection
   */
  private async testFileConnection(
    dataSource: DataSource, 
    result: ConnectionTestResult
  ): Promise<void> {
    const { connectionDetails } = dataSource;
    
    // Verify required connection details
    if (!connectionDetails) {
      throw new Error('Missing file connection details');
    }
    
    const { path, format, filesystem } = connectionDetails;
    
    if (!path) {
      throw new Error('Missing file path');
    }
    
    if (!format) {
      throw new Error('Missing file format');
    }
    
    // For actual implementation, check file existence and readability
    try {
      const response = await fetch(`/api/etl/data-sources/${dataSource.id}/test`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ connectionDetails })
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'File connection test failed');
      }
      
      const testData = await response.json();
      
      result.success = true;
      result.message = 'File connection successful';
      result.details = {
        fileSize: testData.fileSize,
        lastModified: testData.lastModified,
        format: format,
        previewAvailable: testData.previewAvailable
      };
    } catch (error: any) {
      console.error('File connection test error:', error);
      throw new Error(`File connection failed: ${error.message}`);
    }
  }
  
  /**
   * Test in-memory data connection 
   */
  private testMemoryConnection(
    dataSource: DataSource, 
    result: ConnectionTestResult
  ): void {
    // In-memory connections are always available
    result.success = true;
    result.message = 'In-memory data source is available';
    result.latencyMs = 0; // Instant connection
    
    const { connectionDetails } = dataSource;
    
    // Add some details if available
    if (connectionDetails && connectionDetails.dataSize) {
      result.details = {
        dataSize: connectionDetails.dataSize,
        recordCount: connectionDetails.recordCount || 'unknown',
        inMemory: true
      };
    }
  }
  
  /**
   * Update connection statistics
   */
  private updateConnectionStats(
    dataSourceId: string, 
    result: ConnectionTestResult
  ): void {
    const currentStats = this.connectionStats.get(dataSourceId) || {
      avgLatencyMs: 0,
      successRate: 0,
      testCount: 0
    };
    
    // Update test count
    currentStats.testCount++;
    
    // Update latency stats
    if (result.latencyMs !== undefined) {
      const totalLatency = currentStats.avgLatencyMs * (currentStats.testCount - 1) + result.latencyMs;
      currentStats.avgLatencyMs = totalLatency / currentStats.testCount;
    }
    
    // Update success rate
    const successCount = (currentStats.successRate * (currentStats.testCount - 1)) + (result.success ? 1 : 0);
    currentStats.successRate = successCount / currentStats.testCount;
    
    // Update success/failure timestamps
    if (result.success) {
      currentStats.lastSuccess = result.timestamp;
    } else {
      currentStats.lastFailure = result.timestamp;
    }
    
    // Save updated stats
    this.connectionStats.set(dataSourceId, currentStats);
  }
}

// Export singleton instance
export default ConnectionTestService.getInstance();