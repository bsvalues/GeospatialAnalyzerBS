import { DataSourceType, ConnectionMode, ConnectionType, AuthenticationType, LoadMode } from './ETLTypes';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Connection result
 */
export interface ConnectionResult {
  /** Whether the connection was successful */
  success: boolean;
  
  /** Error message if the connection failed */
  error?: string;
  
  /** Connection metadata */
  metadata?: Record<string, any>;
  
  /** Execution time in milliseconds */
  executionTime?: number;
}

/**
 * Extract options
 */
export interface ExtractOptions {
  /** Fields to extract */
  fields?: string[];
  
  /** Filter conditions */
  filter?: any;
  
  /** Sort options */
  sort?: Array<{
    field: string;
    direction: 'asc' | 'desc';
  }>;
  
  /** Pagination options */
  pagination?: {
    page: number;
    pageSize: number;
  };
  
  /** Maximum number of records to extract */
  limit?: number;
  
  /** Offset for record extraction */
  offset?: number;
}

/**
 * Extract result
 */
export interface ExtractResult {
  /** Whether the extraction was successful */
  success: boolean;
  
  /** Data records */
  data: any[];
  
  /** Error message if the extraction failed */
  error?: string;
  
  /** Total number of records (if known) */
  totalRecords?: number;
  
  /** Number of records extracted */
  recordCount: number;
  
  /** Whether there are more records available */
  hasMore: boolean;
  
  /** Execution time in milliseconds */
  executionTime: number;
  
  /** Source metadata */
  metadata?: Record<string, any>;
}

/**
 * Load options
 */
export interface LoadOptions {
  /** Load mode */
  mode: LoadMode;
  
  /** Target table or collection */
  target: string;
  
  /** Field mappings */
  mappings?: Array<{
    source: string;
    target: string;
  }>;
  
  /** Key fields for update/upsert operations */
  keyFields?: string[];
  
  /** Batch size */
  batchSize?: number;
  
  /** Whether to continue on error */
  continueOnError?: boolean;
  
  /** Whether to validate before loading */
  validateBeforeLoad?: boolean;
  
  /** Whether to skip null values */
  skipNulls?: boolean;
}

/**
 * Load result
 */
export interface LoadResult {
  /** Whether the load was successful */
  success: boolean;
  
  /** Error message if the load failed */
  error?: string;
  
  /** Number of records loaded */
  recordsLoaded: number;
  
  /** Number of records failed */
  recordsFailed: number;
  
  /** Number of records updated */
  recordsUpdated: number;
  
  /** Number of records inserted */
  recordsInserted: number;
  
  /** Number of records deleted */
  recordsDeleted: number;
  
  /** Error details for failed records */
  errors?: Array<{
    record: any;
    error: string;
    index: number;
  }>;
  
  /** Execution time in milliseconds */
  executionTime: number;
}

/**
 * Data connector for connecting to various data sources
 */
class DataConnector {
  private dataSources: Map<number, any> = new Map();
  
  /**
   * Register a data source
   */
  registerDataSource(dataSource: any): void {
    this.dataSources.set(dataSource.id, dataSource);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.DATA_SOURCE,
      title: `Data Source Registered: ${dataSource.name}`,
      message: `Data source "${dataSource.name}" (ID: ${dataSource.id}, Type: ${dataSource.type}) has been registered.`
    });
  }
  
  /**
   * Unregister a data source
   */
  unregisterDataSource(id: number): boolean {
    const dataSource = this.dataSources.get(id);
    
    if (!dataSource) {
      return false;
    }
    
    this.dataSources.delete(id);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.DATA_SOURCE,
      title: `Data Source Unregistered: ${dataSource.name}`,
      message: `Data source "${dataSource.name}" (ID: ${dataSource.id}) has been unregistered.`
    });
    
    return true;
  }
  
  /**
   * Get a data source by ID
   */
  getDataSource(id: number): any {
    return this.dataSources.get(id);
  }
  
  /**
   * Get all data sources
   */
  getAllDataSources(): any[] {
    return Array.from(this.dataSources.values());
  }
  
  /**
   * Test a connection to a data source
   */
  async testConnection(dataSource: any): Promise<ConnectionResult> {
    // This is a mock implementation
    try {
      const startTime = Date.now();
      
      // For demonstration purposes, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // For demo purposes, all connections succeed except for specific error cases
      if (dataSource.type === DataSourceType.CUSTOM && dataSource.config.simulateError) {
        return {
          success: false,
          error: 'Simulated connection error',
          executionTime: Date.now() - startTime
        };
      }
      
      return {
        success: true,
        metadata: {
          connectedAt: new Date(),
          serverVersion: '1.0.0',
          serverType: dataSource.type,
          features: ['read', 'write']
        },
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error)
      };
    }
  }
  
  /**
   * Extract data from a data source
   */
  async extract(dataSourceId: number, options: ExtractOptions = {}): Promise<ExtractResult> {
    const dataSource = this.dataSources.get(dataSourceId);
    
    if (!dataSource) {
      return {
        success: false,
        data: [],
        error: `Data source with ID ${dataSourceId} not found`,
        recordCount: 0,
        hasMore: false,
        executionTime: 0
      };
    }
    
    try {
      const startTime = Date.now();
      
      // For demonstration purposes, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 300));
      
      // Mock implementation - in a real application, this would connect to a data source
      let data = dataSource.config.data || [];
      
      // Apply field selection
      if (options.fields && options.fields.length > 0) {
        data = data.map((item: any) => {
          const result: Record<string, any> = {};
          options.fields!.forEach(field => {
            if (field in item) {
              result[field] = item[field];
            }
          });
          return result;
        });
      }
      
      // Apply pagination
      let hasMore = false;
      let totalRecords = data.length;
      
      if (options.pagination) {
        const { page, pageSize } = options.pagination;
        const startIndex = (page - 1) * pageSize;
        const endIndex = startIndex + pageSize;
        
        hasMore = endIndex < data.length;
        data = data.slice(startIndex, endIndex);
      } else if (options.limit) {
        hasMore = options.limit < data.length;
        const startIndex = options.offset || 0;
        data = data.slice(startIndex, startIndex + options.limit);
      }
      
      return {
        success: true,
        data,
        recordCount: data.length,
        totalRecords,
        hasMore,
        executionTime: Date.now() - startTime,
        metadata: {
          sourceType: dataSource.type,
          extractedAt: new Date()
        }
      };
    } catch (error) {
      return {
        success: false,
        data: [],
        error: error instanceof Error ? error.message : String(error),
        recordCount: 0,
        hasMore: false,
        executionTime: 0
      };
    }
  }
  
  /**
   * Load data into a data source
   */
  async load(dataSourceId: number, data: any[], options: LoadOptions): Promise<LoadResult> {
    const dataSource = this.dataSources.get(dataSourceId);
    
    if (!dataSource) {
      return {
        success: false,
        error: `Data source with ID ${dataSourceId} not found`,
        recordsLoaded: 0,
        recordsFailed: data.length,
        recordsUpdated: 0,
        recordsInserted: 0,
        recordsDeleted: 0,
        executionTime: 0
      };
    }
    
    try {
      const startTime = Date.now();
      
      // For demonstration purposes, simulate a delay
      await new Promise(resolve => setTimeout(resolve, 500));
      
      // Mock implementation - in a real application, this would connect to a data source
      
      // Apply field mappings if specified
      let transformedData = data;
      if (options.mappings && options.mappings.length > 0) {
        transformedData = data.map(item => {
          const result: Record<string, any> = {};
          options.mappings!.forEach(mapping => {
            if (mapping.source in item) {
              result[mapping.target] = item[mapping.source];
            }
          });
          return result;
        });
      }
      
      // In this mock implementation, just store the data in the data source's config
      if (!dataSource.config.data) {
        dataSource.config.data = [];
      }
      
      let recordsInserted = 0;
      let recordsUpdated = 0;
      let recordsDeleted = 0;
      
      switch (options.mode) {
        case LoadMode.INSERT:
          dataSource.config.data.push(...transformedData);
          recordsInserted = transformedData.length;
          break;
          
        case LoadMode.TRUNCATE_INSERT:
          dataSource.config.data = [...transformedData];
          recordsInserted = transformedData.length;
          break;
          
        case LoadMode.UPDATE:
        case LoadMode.UPSERT:
          // Simple implementation of update/upsert based on key fields
          if (options.keyFields && options.keyFields.length > 0) {
            transformedData.forEach(newItem => {
              const index = dataSource.config.data.findIndex((existingItem: any) => 
                options.keyFields!.every(field => existingItem[field] === newItem[field])
              );
              
              if (index >= 0) {
                // Update existing item
                dataSource.config.data[index] = {
                  ...dataSource.config.data[index],
                  ...newItem
                };
                recordsUpdated++;
              } else if (options.mode === LoadMode.UPSERT) {
                // Insert new item
                dataSource.config.data.push(newItem);
                recordsInserted++;
              }
            });
          }
          break;
          
        case LoadMode.DELETE:
          // Delete records matching key fields
          if (options.keyFields && options.keyFields.length > 0) {
            const initialLength = dataSource.config.data.length;
            dataSource.config.data = dataSource.config.data.filter((item: any) => 
              !transformedData.some(deleteItem => 
                options.keyFields!.every(field => item[field] === deleteItem[field])
              )
            );
            recordsDeleted = initialLength - dataSource.config.data.length;
          }
          break;
      }
      
      return {
        success: true,
        recordsLoaded: transformedData.length,
        recordsFailed: 0,
        recordsUpdated,
        recordsInserted,
        recordsDeleted,
        executionTime: Date.now() - startTime
      };
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : String(error),
        recordsLoaded: 0,
        recordsFailed: data.length,
        recordsUpdated: 0,
        recordsInserted: 0,
        recordsDeleted: 0,
        executionTime: 0
      };
    }
  }
  
  /**
   * Get metadata for a data source
   */
  async getMetadata(dataSourceId: number): Promise<any> {
    const dataSource = this.dataSources.get(dataSourceId);
    
    if (!dataSource) {
      throw new Error(`Data source with ID ${dataSourceId} not found`);
    }
    
    // This is a mock implementation
    return {
      fields: [
        { name: 'id', type: 'number', nullable: false },
        { name: 'name', type: 'string', nullable: false },
        { name: 'description', type: 'string', nullable: true },
        { name: 'price', type: 'number', nullable: true },
        { name: 'createdAt', type: 'date', nullable: false }
      ],
      recordCount: dataSource.config.data ? dataSource.config.data.length : 0,
      structure: {
        type: dataSource.type,
        name: dataSource.name,
        tables: ['properties', 'users', 'transactions']
      }
    };
  }
}

// Export a singleton instance
export const dataConnector = new DataConnector();