import { DataSource, ConnectionTestResult, DataSourceType, DatabaseType, ApiType, FileType } from './ETLTypes';

/**
 * DataConnector is responsible for connecting to various data sources
 * and handling data extraction.
 */
class DataConnector {
  /**
   * Test connection to a data source
   */
  async testConnection(dataSource: DataSource): Promise<ConnectionTestResult> {
    // In a real implementation, this would actually test the connection
    // For demo purposes, we'll simulate success/failure
    try {
      console.log(`Testing connection to ${dataSource.name}`);
      
      // Simulate connection test based on data source type
      switch (dataSource.type) {
        case DataSourceType.DATABASE:
          return this.testDatabaseConnection(dataSource);
        
        case DataSourceType.API:
          return this.testApiConnection(dataSource);
        
        case DataSourceType.FILE:
          return this.testFileConnection(dataSource);
        
        case DataSourceType.IN_MEMORY:
          return this.testInMemoryConnection(dataSource);
        
        case DataSourceType.CUSTOM:
          return {
            success: true,
            message: "Custom data source connection tested successfully",
            timestamp: new Date()
          };
        
        default:
          return {
            success: false,
            message: `Unknown data source type: ${dataSource.type}`,
            timestamp: new Date()
          };
      }
    } catch (error) {
      console.error('Error testing connection:', error);
      return {
        success: false,
        message: error instanceof Error ? error.message : String(error),
        timestamp: new Date(),
        details: error
      };
    }
  }
  
  /**
   * Test connection to a database
   */
  private testDatabaseConnection(dataSource: DataSource): ConnectionTestResult {
    const dbConfig = dataSource.connection.database;
    
    if (!dbConfig) {
      return {
        success: false,
        message: "Missing database configuration",
        timestamp: new Date()
      };
    }
    
    // Simulate different scenarios based on database type
    switch (dbConfig.type) {
      case DatabaseType.POSTGRESQL:
      case DatabaseType.MYSQL:
      case DatabaseType.MSSQL:
        // Simulate success for these DB types
        return {
          success: true,
          message: `Successfully connected to ${dbConfig.type} database at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`,
          timestamp: new Date(),
          details: {
            connectionString: dbConfig.connectionString ? dbConfig.connectionString.replace(/:[^:]*@/, ":***@") : undefined,
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database
          }
        };
      
      case DatabaseType.MONGODB:
        // Simulate potential failure for MongoDB
        const isSuccess = Math.random() > 0.3; // 70% success rate
        
        return {
          success: isSuccess,
          message: isSuccess 
            ? `Successfully connected to MongoDB at ${dbConfig.host}:${dbConfig.port}/${dbConfig.database}`
            : `Failed to connect to MongoDB: Authentication failed`,
          timestamp: new Date()
        };
      
      default:
        // For other DB types, return a generic success
        return {
          success: true,
          message: `Successfully connected to ${dbConfig.type} database`,
          timestamp: new Date()
        };
    }
  }
  
  /**
   * Test connection to an API
   */
  private testApiConnection(dataSource: DataSource): ConnectionTestResult {
    const apiConfig = dataSource.connection.api;
    
    if (!apiConfig) {
      return {
        success: false,
        message: "Missing API configuration",
        timestamp: new Date()
      };
    }
    
    // Simulate API connection test
    // In a real implementation, this would make an actual HTTP request
    
    // Check if URL is missing or malformed
    if (!apiConfig.url || !apiConfig.url.startsWith('http')) {
      return {
        success: false,
        message: `Invalid API URL: ${apiConfig.url}`,
        timestamp: new Date()
      };
    }
    
    // Simulate success for most cases
    const isSuccess = Math.random() > 0.2; // 80% success rate
    
    return {
      success: isSuccess,
      message: isSuccess 
        ? `Successfully connected to API at ${apiConfig.url}`
        : `Failed to connect to API: Timeout after 30 seconds`,
      timestamp: new Date(),
      details: {
        url: apiConfig.url,
        method: apiConfig.method || 'GET',
        authType: apiConfig.authType || 'NONE'
      }
    };
  }
  
  /**
   * Test connection to a file
   */
  private testFileConnection(dataSource: DataSource): ConnectionTestResult {
    const fileConfig = dataSource.connection.file;
    
    if (!fileConfig) {
      return {
        success: false,
        message: "Missing file configuration",
        timestamp: new Date()
      };
    }
    
    // Simulate file connection test
    // In a real implementation, this would check if the file exists and is readable
    
    // Check if path is missing
    if (!fileConfig.path) {
      return {
        success: false,
        message: "File path is required",
        timestamp: new Date()
      };
    }
    
    // Simulate file existence check
    const fileExists = !fileConfig.path.includes('not-found') && !fileConfig.path.includes('missing');
    
    if (!fileExists) {
      return {
        success: false,
        message: `File not found: ${fileConfig.path}`,
        timestamp: new Date()
      };
    }
    
    // Simulate file format validation based on type
    switch (fileConfig.type) {
      case FileType.CSV:
        return {
          success: true,
          message: `Successfully validated CSV file at ${fileConfig.path}`,
          timestamp: new Date(),
          details: {
            delimiter: fileConfig.delimiter || ',',
            hasHeader: fileConfig.hasHeader !== false
          }
        };
      
      case FileType.JSON:
        return {
          success: true,
          message: `Successfully validated JSON file at ${fileConfig.path}`,
          timestamp: new Date()
        };
      
      case FileType.EXCEL:
        return {
          success: true,
          message: `Successfully validated Excel file at ${fileConfig.path}`,
          timestamp: new Date(),
          details: {
            sheet: fileConfig.sheet || 'Sheet1'
          }
        };
      
      default:
        return {
          success: true,
          message: `Successfully located file at ${fileConfig.path}`,
          timestamp: new Date()
        };
    }
  }
  
  /**
   * Test connection to an in-memory data source
   */
  private testInMemoryConnection(dataSource: DataSource): ConnectionTestResult {
    const inMemoryConfig = dataSource.connection.inMemory;
    
    if (!inMemoryConfig) {
      return {
        success: false,
        message: "Missing in-memory configuration",
        timestamp: new Date()
      };
    }
    
    // Verify data exists
    if (!inMemoryConfig.data || !Array.isArray(inMemoryConfig.data)) {
      return {
        success: false,
        message: "In-memory data must be an array",
        timestamp: new Date()
      };
    }
    
    // Return success with data count
    return {
      success: true,
      message: `Successfully validated in-memory data with ${inMemoryConfig.data.length} records`,
      timestamp: new Date(),
      details: {
        recordCount: inMemoryConfig.data.length,
        sampleFields: Object.keys(inMemoryConfig.data[0] || {}).slice(0, 5)
      }
    };
  }
  
  /**
   * Extract data from a data source
   */
  async extractData(dataSource: DataSource, options?: any): Promise<any[]> {
    // In a real implementation, this would extract actual data from the source
    // For demo purposes, we'll return sample data
    
    console.log(`Extracting data from ${dataSource.name}`, options);
    
    // Simulate data extraction based on data source type
    switch (dataSource.type) {
      case DataSourceType.DATABASE:
        return this.extractFromDatabase(dataSource, options);
      
      case DataSourceType.API:
        return this.extractFromApi(dataSource, options);
      
      case DataSourceType.FILE:
        return this.extractFromFile(dataSource, options);
      
      case DataSourceType.IN_MEMORY:
        return this.extractFromInMemory(dataSource, options);
      
      case DataSourceType.CUSTOM:
        return this.extractFromCustom(dataSource, options);
      
      default:
        throw new Error(`Unknown data source type: ${dataSource.type}`);
    }
  }
  
  /**
   * Extract data from a database
   */
  private async extractFromDatabase(dataSource: DataSource, options?: any): Promise<any[]> {
    // Simulate database data extraction
    // In a real implementation, this would execute a SQL query
    
    // Generate sample property data
    return this.generateSampleData(50);
  }
  
  /**
   * Extract data from an API
   */
  private async extractFromApi(dataSource: DataSource, options?: any): Promise<any[]> {
    // Simulate API data extraction
    // In a real implementation, this would make an HTTP request
    
    // Generate sample property data with tax information
    return this.generateSampleData(30, true);
  }
  
  /**
   * Extract data from a file
   */
  private async extractFromFile(dataSource: DataSource, options?: any): Promise<any[]> {
    // Simulate file data extraction
    // In a real implementation, this would read and parse a file
    
    // Generate sample property data
    return this.generateSampleData(20);
  }
  
  /**
   * Extract data from an in-memory data source
   */
  private async extractFromInMemory(dataSource: DataSource, options?: any): Promise<any[]> {
    // Return the in-memory data directly
    const inMemoryConfig = dataSource.connection.inMemory;
    
    if (!inMemoryConfig || !inMemoryConfig.data) {
      return [];
    }
    
    return inMemoryConfig.data;
  }
  
  /**
   * Extract data from a custom data source
   */
  private async extractFromCustom(dataSource: DataSource, options?: any): Promise<any[]> {
    // Simulate custom data extraction
    // In a real implementation, this would use a custom connector
    
    // Generate sample property data
    return this.generateSampleData(10);
  }
  
  /**
   * Generate sample property data
   */
  private generateSampleData(count: number, includeTaxInfo = false): any[] {
    const propertyTypes = ['residential', 'commercial', 'industrial', 'land'];
    const cities = ['Seattle', 'Bellevue', 'Redmond', 'Kirkland', 'Renton'];
    const data = [];
    
    for (let i = 0; i < count; i++) {
      const property = {
        id: i + 1,
        address: `${1000 + i} Main St`,
        city: cities[Math.floor(Math.random() * cities.length)],
        state: 'WA',
        zip: `9800${Math.floor(Math.random() * 10)}`,
        price: Math.floor(Math.random() * 1000000) + 200000,
        bedrooms: Math.floor(Math.random() * 5) + 1,
        bathrooms: Math.floor(Math.random() * 4) + 1,
        sqft: Math.floor(Math.random() * 3000) + 800,
        year_built: Math.floor(Math.random() * 70) + 1950,
        property_type: propertyTypes[Math.floor(Math.random() * propertyTypes.length)],
        status: Math.random() > 0.2 ? 'active' : 'inactive'
      };
      
      // Add tax info if requested
      if (includeTaxInfo) {
        Object.assign(property, {
          parcel_id: `P-${100000 + i}`,
          tax_year: 2024,
          assessed_value: Math.floor(property.price * 0.8),
          tax_amount: Math.floor(property.price * 0.012),
          owner_name: `Owner ${i + 1}`
        });
      }
      
      data.push(property);
    }
    
    return data;
  }
}

// Export a singleton instance
export const dataConnector = new DataConnector();