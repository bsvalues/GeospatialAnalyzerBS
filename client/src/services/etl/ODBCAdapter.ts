/**
 * ODBCAdapter.ts
 * 
 * Browser-compatible adapter for ODBC connections
 * This wrapper avoids direct imports from node-specific modules that cause browser compatibility issues
 */

// Import EventEmitter polyfill
import '../../polyfill';

// Interfaces for ODBC connection
import { ODBCConnectionConfig } from './ETLTypes';

// Define result types
export interface QueryResult {
  recordset: any[];
  recordsets: any[][];
  rowsAffected: number[];
  output?: any;
}

/**
 * Execute a SQL query against an ODBC data source
 * This function uses a browser-compatible approach to connect to ODBC
 */
export async function executeQuery(
  config: ODBCConnectionConfig,
  query: string,
  parameters?: Record<string, any>
): Promise<QueryResult> {
  try {
    // We'll need to use a server endpoint to execute the query
    // Direct connection to ODBC from browser is not possible
    const response = await fetch('/api/odbc/query', {
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
      throw new Error(`ODBC query failed: ${error.message || response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error('ODBC query error:', error);
    throw error;
  }
}

/**
 * Get list of tables from an ODBC data source
 */
export async function getTables(config: ODBCConnectionConfig): Promise<string[]> {
  try {
    // This query works for most ODBC drivers but may need adjustments
    // based on the specific database system
    const result = await executeQuery(
      config,
      'SELECT table_name FROM information_schema.tables WHERE table_type = \'BASE TABLE\' ORDER BY table_name'
    );
    
    return result.recordset.map(row => row.table_name || row.TABLE_NAME);
  } catch (error) {
    console.error('Error getting tables:', error);
    throw error;
  }
}

/**
 * Get schema information for a table
 */
export async function getTableSchema(
  config: ODBCConnectionConfig,
  tableName: string
): Promise<Array<{ name: string; type: string; nullable: boolean }>> {
  try {
    // This query works for most ODBC drivers but may need adjustments
    // based on the specific database system
    const result = await executeQuery(
      config,
      `SELECT 
        column_name, 
        data_type, 
        is_nullable 
      FROM information_schema.columns 
      WHERE table_name = ?
      ORDER BY ordinal_position`,
      [tableName]
    );
    
    return result.recordset.map(row => ({
      name: row.column_name || row.COLUMN_NAME,
      type: row.data_type || row.DATA_TYPE,
      nullable: (row.is_nullable || row.IS_NULLABLE) === 'YES',
    }));
  } catch (error) {
    console.error('Error getting table schema:', error);
    throw error;
  }
}

/**
 * Test connection to ODBC data source
 */
export async function testConnection(config: ODBCConnectionConfig): Promise<boolean> {
  try {
    await executeQuery(config, 'SELECT 1 AS test');
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
}