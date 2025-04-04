// No imports needed

export interface ConnectionConfig {
  type: 'database' | 'api' | 'file' | 'memory';
  details: any;
}

export interface TestResult {
  success: boolean;
  message: string;
  latencyMs?: number;
  metadata?: any;
}

export interface ConnectionStatus {
  id: number;
  isConnected: boolean;
  lastConnected?: Date;
  lastError?: string;
  metadata?: {
    version?: string;
    features?: string[];
    supportedFormats?: string[];
    schema?: any;
  };
}

// Connection Test Service
export class ConnectionTestService {
  /**
   * Test a database connection
   */
  public static async testConnection(dataSourceId: number, config?: ConnectionConfig): Promise<TestResult> {
    try {
      const startTime = performance.now();
      
      const response = await fetch(`/api/etl/data-sources/${dataSourceId}/test${config ? '' : ''}`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: config ? JSON.stringify(config) : undefined,
      });

      const endTime = performance.now();
      const latencyMs = Math.round(endTime - startTime);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Connection test failed');
      }

      const result = await response.json();
      
      return {
        success: result.success,
        message: result.message,
        latencyMs,
        metadata: result.metadata
      };
    } catch (error) {
      console.error('Connection test error:', error);
      
      return {
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed with an unknown error',
      };
    }
  }

  /**
   * Update the connection status of a data source
   */
  public static async updateConnectionStatus(dataSourceId: number, isConnected: boolean, lastError?: string): Promise<boolean> {
    try {
      const response = await fetch(`/api/etl/data-sources/${dataSourceId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          isConnected,
          lastConnected: isConnected ? new Date() : undefined,
          lastError: isConnected ? undefined : lastError
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update connection status');
      }

      return true;
    } catch (error) {
      console.error('Error updating connection status:', error);
      
      return false;
    }
  }

  /**
   * Get a preview of data from a data source
   */
  public static async getDataPreview(dataSourceId: number): Promise<{
    columns: string[];
    rows: any[][];
    totalRows: number;
  } | null> {
    try {
      const response = await fetch(`/api/etl/data-sources/${dataSourceId}/preview`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to get data preview');
      }

      return await response.json();
    } catch (error) {
      console.error('Error getting data preview:', error);
      
      return null;
    }
  }

  /**
   * Detect the schema of a data source
   */
  public static async detectSchema(dataSourceId: number): Promise<{
    tables?: string[];
    fields?: { name: string; type: string; nullable: boolean }[];
    error?: string;
  }> {
    try {
      const response = await fetch(`/api/etl/data-sources/${dataSourceId}/schema`);

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to detect schema');
      }

      return await response.json();
    } catch (error) {
      console.error('Error detecting schema:', error);
      
      return {
        error: error instanceof Error ? error.message : 'Failed to detect schema'
      };
    }
  }

  /**
   * Get connection tips based on connection type and error message
   */
  public static getConnectionTips(type: string, errorMessage?: string): string[] {
    const tips: string[] = [];
    
    // Common tips for all connection types
    tips.push('Verify that all connection parameters are correct');
    tips.push('Ensure that the data source is online and accessible from this application');
    
    // Type-specific tips
    switch (type) {
      case 'database':
        tips.push('Check that the database username and password are correct');
        tips.push('Verify the database host is accessible from this network');
        tips.push('Make sure the specified database exists and the user has permission to access it');
        
        if (errorMessage) {
          if (errorMessage.includes('permission denied')) {
            tips.push('The database user lacks sufficient permissions. Contact your database administrator.');
          } else if (errorMessage.includes('connection refused')) {
            tips.push('The database server is not accepting connections. Check firewall settings.');
          } else if (errorMessage.includes('does not exist')) {
            tips.push('The specified database or table does not exist. Verify the database name.');
          }
        }
        break;
        
      case 'api':
        tips.push('Verify API endpoint URL is correct and accessible');
        tips.push('Check that authentication credentials (API key, tokens) are valid');
        tips.push('Confirm the API service is operational by checking its status page');
        
        if (errorMessage) {
          if (errorMessage.includes('401') || errorMessage.includes('unauthorized')) {
            tips.push('Authentication failed. Verify your API key or token.');
          } else if (errorMessage.includes('404') || errorMessage.includes('not found')) {
            tips.push('The API endpoint URL is incorrect or the resource does not exist.');
          } else if (errorMessage.includes('429') || errorMessage.includes('too many requests')) {
            tips.push('You have exceeded the rate limit for this API. Reduce request frequency.');
          }
        }
        break;
        
      case 'file':
        tips.push('Ensure the file path is correct and accessible');
        tips.push('Check that the file format is supported (CSV, JSON, etc.)');
        tips.push('Verify file permissions allow reading');
        
        if (errorMessage) {
          if (errorMessage.includes('not found')) {
            tips.push('The specified file does not exist at the given path.');
          } else if (errorMessage.includes('permission')) {
            tips.push('The application does not have permission to read the file.');
          } else if (errorMessage.includes('format')) {
            tips.push('The file format is invalid or corrupted.');
          }
        }
        break;
        
      case 'memory':
        tips.push('Ensure the in-memory data structure is properly initialized');
        tips.push('Verify that the memory data source has not been cleared');
        break;
    }
    
    return tips;
  }
}