import * as sql from 'mssql';
import { IDataConnector, ConnectionConfig } from './DataConnector';
import { DataSource, DataSourceType } from './ETLTypes';

export interface ODBCConfig extends ConnectionConfig {
  connectionString: string;
  username?: string;
  password?: string;
  connectionTimeout?: number;
  requestTimeout?: number;
  driver?: string;
}

export class ODBCConnector implements IDataConnector {
  private config: ODBCConfig;
  private pool: sql.ConnectionPool | null = null;
  private connectionError: Error | null = null;
  private connected: boolean = false;
  private sourceId: string;

  constructor(config: ODBCConfig) {
    this.config = config;
    // Create a unique but deterministic ID from the connection string
    // Using simple hash function instead of Buffer for browser compatibility
    let hash = 0;
    for (let i = 0; i < config.connectionString.length; i++) {
      const char = config.connectionString.charCodeAt(i);
      hash = ((hash << 5) - hash) + char;
      hash = hash & hash; // Convert to 32bit integer
    }
    this.sourceId = `odbc-${Math.abs(hash).toString(16).substring(0, 8)}`;
  }

  async connect(): Promise<boolean> {
    try {
      // Configure ODBC connection - using any to bypass type checking since mssql doesn't have direct ODBC config type
      const odbcConfig: any = {
        driver: this.config.driver || 'ODBC Driver 17 for SQL Server', // Default driver
        options: {
          connectTimeout: this.config.connectionTimeout || 15000,
          requestTimeout: this.config.requestTimeout || 15000,
        }
      };
      
      // Add connection string
      odbcConfig.connectionString = this.config.connectionString;

      // Add credentials if provided
      if (this.config.username && this.config.password) {
        odbcConfig.user = this.config.username;
        odbcConfig.password = this.config.password;
      }

      this.pool = await new sql.ConnectionPool(odbcConfig).connect();
      this.connected = true;
      this.connectionError = null;
      console.log(`Connected to database via ODBC: ${this.config.connectionString}`);
      return true;
    } catch (err) {
      this.connectionError = err as Error;
      this.connected = false;
      console.error('ODBC connection error:', err);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        this.connected = false;
        console.log(`Disconnected from ODBC data source`);
      }
      return true;
    } catch (err) {
      console.error('ODBC disconnect error:', err);
      return false;
    }
  }

  isConnected(): boolean {
    return this.connected;
  }

  getConnectionError(): Error | null {
    return this.connectionError;
  }

  getDataSource(): DataSource {
    return {
      id: this.sourceId.length, // Convert string ID to numeric ID for compatibility
      name: `ODBC Connection - ${this.config.connectionString.substring(0, 20)}...`,
      type: DataSourceType.ODBC,
      config: this.config,
      enabled: this.connected,
      description: `ODBC connection using ${this.config.driver || 'default driver'}`
    };
  }

  async listTables(): Promise<string[]> {
    if (!this.connected || !this.pool) {
      throw new Error('Not connected to ODBC data source');
    }

    try {
      const result = await this.pool.request().query(`
        SELECT TABLE_NAME 
        FROM INFORMATION_SCHEMA.TABLES 
        WHERE TABLE_TYPE = 'BASE TABLE'
        ORDER BY TABLE_NAME
      `);
      
      return result.recordset.map(record => record.TABLE_NAME);
    } catch (err) {
      console.error('Error listing tables:', err);
      throw err;
    }
  }

  async listColumns(tableName: string): Promise<{ name: string; type: string }[]> {
    if (!this.connected || !this.pool) {
      throw new Error('Not connected to ODBC data source');
    }

    try {
      const result = await this.pool.request()
        .input('tableName', sql.VarChar, tableName)
        .query(`
          SELECT COLUMN_NAME, DATA_TYPE 
          FROM INFORMATION_SCHEMA.COLUMNS 
          WHERE TABLE_NAME = @tableName
          ORDER BY ORDINAL_POSITION
        `);
      
      return result.recordset.map(record => ({
        name: record.COLUMN_NAME,
        type: record.DATA_TYPE
      }));
    } catch (err) {
      console.error(`Error listing columns for table ${tableName}:`, err);
      throw err;
    }
  }

  async executeQuery(query: string, params?: Record<string, any>): Promise<any[]> {
    if (!this.connected || !this.pool) {
      throw new Error('Not connected to ODBC data source');
    }

    try {
      const request = this.pool.request();
      
      // Add parameters to the request if provided
      if (params) {
        for (const [key, value] of Object.entries(params)) {
          // Attempt to determine the SQL data type based on JavaScript type
          let sqlType;
          if (typeof value === 'number') {
            sqlType = Number.isInteger(value) ? sql.Int : sql.Float;
          } else if (typeof value === 'boolean') {
            sqlType = sql.Bit;
          } else if (value instanceof Date) {
            sqlType = sql.DateTime;
          } else {
            sqlType = sql.VarChar;
          }
          
          request.input(key, sqlType, value);
        }
      }
      
      const result = await request.query(query);
      return result.recordset;
    } catch (err) {
      console.error('Query execution error:', err);
      throw err;
    }
  }

  async fetchTableData(tableName: string, limit: number = 1000): Promise<any[]> {
    return this.executeQuery(`SELECT TOP ${limit} * FROM ${tableName}`);
  }

  async fetchPropertyData(tableName: string, limit: number = 1000): Promise<any[]> {
    const query = `
      SELECT TOP ${limit} 
        *,
        CONCAT(PropertyNumber, ' ', StreetName) AS address,
        CAST(Latitude AS FLOAT) AS latitude,
        CAST(Longitude AS FLOAT) AS longitude,
        PropertyClass AS propertyType
      FROM ${tableName}
      WHERE Latitude IS NOT NULL AND Longitude IS NOT NULL
    `;
    
    return this.executeQuery(query);
  }
}