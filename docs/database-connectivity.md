# Database Connectivity Guide

## Introduction

The GeospatialAnalyzerBS application provides robust database connectivity options to allow importing property data directly from various database sources. This document outlines the available features and how to use them effectively.

## Available Connection Types

The system currently supports two primary connection types:

1. **SQL Server Connection**: For connecting to Microsoft SQL Server databases, allowing direct access to property data stored in SQL Server tables.

2. **ODBC Connection**: For connecting to a wide variety of database systems through Open Database Connectivity (ODBC) drivers. This option provides flexibility to connect to many different database systems.

## Connection Workflow

### Step 1: Configure Database Connection

#### SQL Server Connection
- Server: The hostname or IP address of the SQL Server
- Port: The port number (default: 1433)
- Database: The name of the database
- Username: SQL Server authentication username
- Password: SQL Server authentication password
- Connection Options:
  - Encrypt: Enable/disable connection encryption
  - Trust Server Certificate: Whether to trust the server's SSL certificate

#### ODBC Connection
- Connection String: The ODBC connection string or DSN name
- Username: Optional authentication username
- Password: Optional authentication password

### Step 2: Connect and Select Table

After configuring the connection parameters, click the Connect button to establish a connection to the database. Upon successful connection:

1. The system will retrieve a list of available tables from the database
2. Select a table from the dropdown list
3. The system will automatically load the table schema (column definitions)

### Step 3: Field Mapping

Once a table is selected, the system will:

1. Analyze the table columns and automatically suggest mappings to property fields
2. Display the current field mappings
3. Allow you to add, edit, or remove field mappings

Each mapping consists of:
- Source Field: The column from the database table
- Target Field: The corresponding property field in GeospatialAnalyzerBS
- Transformation: Optional data transformation to apply (e.g., string to number)
- Required Flag: Whether the field is required
- Default Value: Value to use when the source field is empty or null

### Step 4: Preview and Import

Before finalizing the import:
1. Preview the data to ensure it looks correct
2. Set import limits (number of records)
3. Click Import to process the data

During import, the system will:
- Fetch the records from the database
- Apply the defined field mappings and transformations
- Validate each record
- Import only valid records
- Display the results of the import operation

## Behind the Scenes: Technical Implementation

### Architecture

The database connectivity feature uses a client-server architecture:

1. **Client-side Adapters**: `SQLServerAdapter` and `ODBCAdapter` in the frontend provide a consistent interface for database operations.

2. **Server-side Endpoints**: RESTful API endpoints handle the actual database connections, executing queries, and returning results.

3. **Field Mapping Service**: A utility that handles intelligent mapping between source and target schemas and applies transformations.

### Security Considerations

- Database credentials are not stored in the client but are sent with each request
- Connections from the browser to the SQL Server are proxied through the application server
- For production use, it's recommended to use read-only database accounts with limited permissions

### Performance Considerations

- Database queries use limits to prevent loading too much data
- Data transformations and validations happen on the client to reduce server load
- For very large tables, consider using smaller batches or applying filters at the query level

## Troubleshooting

### Common Connection Issues

- **Connection Failed - Network Error**: Verify that the database server is accessible from the application server
- **Connection Failed - Authentication Error**: Check username and password
- **SQL Server Connection Failed with "Cannot Connect" Error**: Verify port number and server name

### Schema and Mapping Issues

- **No Tables Visible**: Ensure the database user has permissions to view table definitions
- **Missing Columns**: Check for permissions issues on specific columns
- **Data Type Conversion Errors**: Adjust field mappings to include appropriate transformations

## Best Practices

1. **Start Small**: Begin with a small dataset to verify configuration before attempting large imports

2. **Use Preview**: Always preview the data before importing to ensure mappings are correct

3. **Save Connection Profiles**: For frequent imports, save your connection and mapping settings

4. **Import in Batches**: For very large datasets, consider importing data in smaller batches

5. **Validate Data Quality**: After import, use the data quality analysis tools to verify data integrity

## Future Enhancements

Planned enhancements to the database connectivity features include:

- Support for MySQL, PostgreSQL, and Oracle databases
- Saved connection profiles
- Advanced query builder for filtered imports
- Scheduled/automated data imports
- Two-way synchronization between GeospatialAnalyzerBS and external databases

## Support

For additional assistance with database connectivity features, please contact support or consult the full user manual.
