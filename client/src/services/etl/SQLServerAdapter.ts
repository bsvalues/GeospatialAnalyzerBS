/**
 * SQLServerAdapter.ts
 * 
 * Browser-compatible adapter for SQL Server connections
 * This wrapper avoids direct imports from node-specific modules that cause browser compatibility issues
 */

// Import EventEmitter polyfill
import '../../polyfill';

// Interfaces for SQL Server connection
import { SQLServerConnectionConfig } from './ETLTypes';

// Define result types
export interface QueryResult {
  recordset: any[];
  recordsets: any[][];
  rowsAffected: number[];
  output?: any;
}

/**
 * Execute a SQL query against a SQL Server database
 * This function uses a browser-compatible approach to connect to SQL Server
 */
export async function executeQuery(
  config: SQLServerConnectionConfig,
  query: string,
  parameters?: Record<string, any>
): Promise<QueryResult> {
  try {
    // We'll need to use a server endpoint to execute the query
    // Direct connection to SQL Server from browser is not possible
    const response = await fetch('/api/sqlserver/query', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        config,
        query,
        parameters,
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(`SQL Server query failed: ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('SQL Server query error:', error);
    throw error;
  }
}

/**
 * Get list of databases from SQL Server
 */
export async function getDatabases(config: SQLServerConnectionConfig): Promise<string[]> {
  try {
    const result = await executeQuery(
      config,
      'SELECT name FROM sys.databases WHERE name NOT IN (\'master\', \'tempdb\', \'model\', \'msdb\') ORDER BY name'
    );
    
    return result.recordset.map(row => row.name);
  } catch (error) {
    console.error('Error getting databases:', error);
    throw error;
  }
}

/**
 * Get list of tables from a SQL Server database
 */
export async function getTables(config: SQLServerConnectionConfig): Promise<string[]> {
  try {
    const result = await executeQuery(
      config,
      'SELECT table_name FROM information_schema.tables WHERE table_type = \'BASE TABLE\' ORDER BY table_name'
    );
    
    return result.recordset.map(row => row.table_name);
  } catch (error) {
    console.error('Error getting tables:', error);
    throw error;
  }
}

/**
 * Get schema information for a table
 */
export async function getTableSchema(
  config: SQLServerConnectionConfig,
  tableName: string
): Promise<Array<{ name: string; type: string; nullable: boolean }>> {
  try {
    const result = await executeQuery(
      config,
      `SELECT 
        c.name,
        t.name as type,
        c.is_nullable
      FROM sys.columns c
      INNER JOIN sys.types t ON c.system_type_id = t.system_type_id
      INNER JOIN sys.tables tbl ON c.object_id = tbl.object_id
      WHERE tbl.name = @tableName
      ORDER BY c.column_id`,
      { tableName }
    );
    
    return result.recordset.map(row => ({
      name: row.name,
      type: row.type,
      nullable: !!row.is_nullable,
    }));
  } catch (error) {
    console.error('Error getting table schema:', error);
    throw error;
  }
}

/**
 * Test connection to SQL Server
 */
export async function testConnection(config: SQLServerConnectionConfig): Promise<boolean> {
  try {
    await executeQuery(config, 'SELECT 1 AS test');
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}