import * as sql from 'mssql';
import { IDataConnector, ConnectionConfig } from './DataConnector';
import { DataSource, DataSourceType } from './ETLTypes';

export interface SQLServerConfig extends ConnectionConfig {
  server: string;
  port: number;
  database: string;
  user: string;
  password: string;
  domain?: string;
  trustServerCertificate?: boolean;
  useWindowsAuth?: boolean;
  connectionTimeout?: number;
  requestTimeout?: number;
}

export class SQLServerConnector implements IDataConnector {
  private config: SQLServerConfig;
  private pool: sql.ConnectionPool | null = null;
  private connectionError: Error | null = null;
  private connected: boolean = false;
  private sourceId: string;

  constructor(config: SQLServerConfig) {
    this.config = config;
    this.sourceId = `sql-server-${config.server}-${config.database}`;
  }

  async connect(): Promise<boolean> {
    try {
      // Create a basic configuration object
      const sqlConfig: any = {
        server: this.config.server,
        port: this.config.port,
        database: this.config.database,
        user: this.config.user,
        password: this.config.password,
        options: {
          trustServerCertificate: this.config.trustServerCertificate || false,
          connectTimeout: this.config.connectionTimeout || 15000,
          requestTimeout: this.config.requestTimeout || 15000,
        },
      };

      // Handle Windows Authentication if enabled
      if (this.config.useWindowsAuth) {
        sqlConfig.options = {
          ...sqlConfig.options,
          trustedConnection: true,
        };
        
        // Add domain if provided
        if (this.config.domain) {
          sqlConfig.domain = this.config.domain;
        }
      }

      this.pool = await new sql.ConnectionPool(sqlConfig).connect();
      this.connected = true;
      this.connectionError = null;
      console.log(`Connected to SQL Server: ${this.config.server}/${this.config.database}`);
      return true;
    } catch (err) {
      this.connectionError = err as Error;
      this.connected = false;
      console.error('SQL Server connection error:', err);
      return false;
    }
  }

  async disconnect(): Promise<boolean> {
    try {
      if (this.pool) {
        await this.pool.close();
        this.pool = null;
        this.connected = false;
        console.log(`Disconnected from SQL Server: ${this.config.server}/${this.config.database}`);
      }
      return true;
    } catch (err) {
      console.error('SQL Server disconnect error:', err);
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
      name: `${this.config.server}/${this.config.database}`,
      type: DataSourceType.SQL_SERVER,
      config: this.config,
      enabled: this.connected,
      description: `SQL Server connection to ${this.config.server}/${this.config.database}`
    };
  }

  async listTables(): Promise<string[]> {
    if (!this.connected || !this.pool) {
      throw new Error('Not connected to SQL Server');
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
      throw new Error('Not connected to SQL Server');
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
      throw new Error('Not connected to SQL Server');
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

  // Special method for retrieving property data specifically formatted for our application
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