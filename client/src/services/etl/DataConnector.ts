import { DataSource, DataSourceType, LoadMode } from './ETLTypes';
import { alertService, AlertType, AlertCategory, AlertSeverity } from './AlertService';

/**
 * Connection result
 */
export interface ConnectionResult {
  /** Whether connection was successful */
  success: boolean;
  
  /** Error message if unsuccessful */
  error?: string;
  
  /** Connection details */
  details?: any;
}

/**
 * Extract options
 */
export interface ExtractOptions {
  /** Query for API or database sources */
  query?: string;
  
  /** Parameters for the query */
  params?: any;
  
  /** Filter to apply during extraction */
  filter?: any;
  
  /** Maximum number of records to extract */
  limit?: number;
  
  /** Number of records to skip */
  offset?: number;
  
  /** Sorting options */
  sort?: { field: string; direction: 'asc' | 'desc' }[];
}

/**
 * Extract result
 */
export interface ExtractResult {
  /** Whether extraction was successful */
  success: boolean;
  
  /** Extracted data */
  data: any[];
  
  /** Error message if unsuccessful */
  error?: string;
  
  /** Number of records extracted */
  count: number;
  
  /** Total records available (may be more than extracted) */
  totalCount?: number;
  
  /** Time taken to extract data (ms) */
  executionTime: number;
}

/**
 * Load options
 */
export interface LoadOptions {
  /** Load mode (INSERT, UPDATE, etc.) */
  mode: LoadMode;
  
  /** Target table or collection name */
  target: string;
  
  /** Mapping of source to target fields */
  mapping?: { source: string; target: string }[];
  
  /** Batch size for bulk operations */
  batchSize?: number;
  
  /** Whether to continue on error */
  continueOnError?: boolean;
}

/**
 * Load result
 */
export interface LoadResult {
  /** Whether load was successful */
  success: boolean;
  
  /** Error message if unsuccessful */
  error?: string;
  
  /** Number of records loaded */
  recordsLoaded: number;
  
  /** Number of records failed */
  recordsFailed: number;
  
  /** Time taken to load data (ms) */
  executionTime: number;
}

/**
 * Data connector class for handling data source connections,
 * extractions, and loads.
 */
class DataConnector {
  private dataSources: Map<number, DataSource> = new Map();
  
  /**
   * Register a data source
   */
  registerDataSource(dataSource: DataSource): void {
    this.dataSources.set(dataSource.id, dataSource);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.DATA_SOURCE,
      title: `Data Source Registered: ${dataSource.name}`,
      message: `Data source "${dataSource.name}" (ID: ${dataSource.id}, Type: ${dataSource.type}) has been registered`
    });
  }
  
  /**
   * Get a data source by ID
   */
  getDataSource(id: number): DataSource | undefined {
    return this.dataSources.get(id);
  }
  
  /**
   * Get all data sources
   */
  getAllDataSources(): DataSource[] {
    return Array.from(this.dataSources.values());
  }
  
  /**
   * Test connection to a data source
   */
  async testConnection(dataSource: DataSource): Promise<ConnectionResult> {
    try {
      // Simulate connection test based on data source type
      switch (dataSource.type) {
        case DataSourceType.POSTGRESQL:
        case DataSourceType.MYSQL:
        case DataSourceType.MONGODB:
          // Database connection test would go here
          // For mock purposes, just return success
          return {
            success: true,
            details: {
              server: dataSource.config.host,
              database: dataSource.config.database,
              user: dataSource.config.user,
              connected: true
            }
          };
          
        case DataSourceType.REST_API:
          // API connection test would go here
          // For mock purposes, just return success
          return {
            success: true,
            details: {
              url: dataSource.config.url,
              method: dataSource.config.method,
              status: 200,
              response: { message: 'Connection successful' }
            }
          };
          
        case DataSourceType.FILE:
          // File connection test would go here
          // For mock purposes, just return success
          return {
            success: true,
            details: {
              path: dataSource.config.path,
              exists: true,
              size: '2.5 MB',
              lastModified: new Date()
            }
          };
          
        case DataSourceType.MEMORY:
          // In-memory data source, always successful
          return {
            success: true,
            details: {
              recordCount: dataSource.config.data?.length || 0
            }
          };
          
        default:
          // Unknown data source type
          return {
            success: false,
            error: `Unsupported data source type: ${dataSource.type}`
          };
      }
    } catch (error) {
      // Handle connection error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: errorMessage
      };
    }
  }
  
  /**
   * Extract data from a data source
   */
  async extract(sourceId: number, options: ExtractOptions = {}): Promise<ExtractResult> {
    const startTime = Date.now();
    
    try {
      // Get data source
      const dataSource = this.getDataSource(sourceId);
      
      if (!dataSource) {
        return {
          success: false,
          data: [],
          error: `Data source not found: ${sourceId}`,
          count: 0,
          executionTime: Date.now() - startTime
        };
      }
      
      if (!dataSource.enabled) {
        return {
          success: false,
          data: [],
          error: `Data source is disabled: ${dataSource.name}`,
          count: 0,
          executionTime: Date.now() - startTime
        };
      }
      
      // Simulate extraction based on data source type
      switch (dataSource.type) {
        case DataSourceType.POSTGRESQL:
        case DataSourceType.MYSQL:
        case DataSourceType.MONGODB:
          // Database extraction would go here
          // For mock purposes, we'll just return some mock data from the source config
          {
            const mockData = dataSource.config.data || [];
            return {
              success: true,
              data: mockData,
              count: mockData.length,
              totalCount: mockData.length,
              executionTime: Date.now() - startTime
            };
          }
          
        case DataSourceType.REST_API:
          // API extraction would go here
          // For mock purposes, we'll just return mock data from the source config
          {
            const mockData = dataSource.config.data || [];
            return {
              success: true,
              data: mockData,
              count: mockData.length,
              totalCount: mockData.length,
              executionTime: Date.now() - startTime
            };
          }
          
        case DataSourceType.FILE:
          // File extraction would go here
          // For mock purposes, we'll just return mock data from the source config
          {
            const mockData = dataSource.config.data || [];
            return {
              success: true,
              data: mockData,
              count: mockData.length,
              totalCount: mockData.length,
              executionTime: Date.now() - startTime
            };
          }
          
        case DataSourceType.MEMORY:
          // In-memory data extraction
          {
            const data = dataSource.config.data || [];
            return {
              success: true,
              data: data.slice(), // Return a copy of the data
              count: data.length,
              totalCount: data.length,
              executionTime: Date.now() - startTime
            };
          }
          
        default:
          // Unknown data source type
          return {
            success: false,
            data: [],
            error: `Unsupported data source type: ${dataSource.type}`,
            count: 0,
            executionTime: Date.now() - startTime
          };
      }
    } catch (error) {
      // Handle extraction error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        data: [],
        error: errorMessage,
        count: 0,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Load data into a data source
   */
  async load(destinationId: number, data: any[], options: LoadOptions): Promise<LoadResult> {
    const startTime = Date.now();
    
    try {
      // Get data source
      const dataSource = this.getDataSource(destinationId);
      
      if (!dataSource) {
        return {
          success: false,
          error: `Data source not found: ${destinationId}`,
          recordsLoaded: 0,
          recordsFailed: data.length,
          executionTime: Date.now() - startTime
        };
      }
      
      if (!dataSource.enabled) {
        return {
          success: false,
          error: `Data source is disabled: ${dataSource.name}`,
          recordsLoaded: 0,
          recordsFailed: data.length,
          executionTime: Date.now() - startTime
        };
      }
      
      // Simulate load based on data source type
      switch (dataSource.type) {
        case DataSourceType.POSTGRESQL:
        case DataSourceType.MYSQL:
        case DataSourceType.MONGODB:
          // Database load would go here
          // For mock purposes, just update the data source config
          {
            const existingData = dataSource.config.data || [];
            
            // Apply load mode
            switch (options.mode) {
              case LoadMode.INSERT:
                // Simply append data
                dataSource.config.data = [...existingData, ...data];
                break;
                
              case LoadMode.UPDATE:
                // Update existing records (mock implementation)
                // In real implementation this would use primary keys/unique fields
                if (existingData.length >= data.length) {
                  dataSource.config.data = [
                    ...data,
                    ...existingData.slice(data.length)
                  ];
                } else {
                  dataSource.config.data = data.slice(0, existingData.length);
                }
                break;
                
              case LoadMode.UPSERT:
                // For mock purposes, just replace data
                dataSource.config.data = data;
                break;
                
              case LoadMode.DELETE:
                // For mock purposes, remove some records
                if (existingData.length > 0) {
                  dataSource.config.data = existingData.slice(0, Math.max(0, existingData.length - data.length));
                }
                break;
                
              case LoadMode.TRUNCATE:
                // Clear data and insert new
                dataSource.config.data = data;
                break;
                
              default:
                // Default to insert
                dataSource.config.data = [...existingData, ...data];
                break;
            }
            
            return {
              success: true,
              recordsLoaded: data.length,
              recordsFailed: 0,
              executionTime: Date.now() - startTime
            };
          }
          
        case DataSourceType.FILE:
          // File load would go here
          // For mock purposes, just update the data source config
          dataSource.config.data = data;
          
          return {
            success: true,
            recordsLoaded: data.length,
            recordsFailed: 0,
            executionTime: Date.now() - startTime
          };
          
        case DataSourceType.MEMORY:
          // In-memory data load
          dataSource.config.data = data;
          
          return {
            success: true,
            recordsLoaded: data.length,
            recordsFailed: 0,
            executionTime: Date.now() - startTime
          };
          
        default:
          // Unsupported data source type for loading
          return {
            success: false,
            error: `Unsupported data source type for loading: ${dataSource.type}`,
            recordsLoaded: 0,
            recordsFailed: data.length,
            executionTime: Date.now() - startTime
          };
      }
    } catch (error) {
      // Handle load error
      const errorMessage = error instanceof Error ? error.message : String(error);
      
      return {
        success: false,
        error: errorMessage,
        recordsLoaded: 0,
        recordsFailed: data.length,
        executionTime: Date.now() - startTime
      };
    }
  }
  
  /**
   * Delete a data source
   */
  deleteDataSource(id: number): boolean {
    const dataSource = this.getDataSource(id);
    
    if (!dataSource) {
      return false;
    }
    
    this.dataSources.delete(id);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.MEDIUM,
      category: AlertCategory.DATA_SOURCE,
      title: `Data Source Deleted: ${dataSource.name}`,
      message: `Data source "${dataSource.name}" (ID: ${id}, Type: ${dataSource.type}) has been deleted`
    });
    
    return true;
  }
  
  /**
   * Update a data source
   */
  updateDataSource(id: number, updates: Partial<Omit<DataSource, 'id'>>): DataSource | undefined {
    const dataSource = this.getDataSource(id);
    
    if (!dataSource) {
      return undefined;
    }
    
    const updatedDataSource: DataSource = {
      ...dataSource,
      ...updates,
      updatedAt: new Date()
    };
    
    this.dataSources.set(id, updatedDataSource);
    
    alertService.createAlert({
      type: AlertType.INFO,
      severity: AlertSeverity.LOW,
      category: AlertCategory.DATA_SOURCE,
      title: `Data Source Updated: ${updatedDataSource.name}`,
      message: `Data source "${updatedDataSource.name}" (ID: ${id}, Type: ${updatedDataSource.type}) has been updated`
    });
    
    return updatedDataSource;
  }
}

// Export a singleton instance
export const dataConnector = new DataConnector();