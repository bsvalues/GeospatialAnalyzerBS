# Database Connectivity Guide

This document explains how to use the database connectivity features in the GeospatialAnalyzerBS application.

## Table of Contents
1. [Overview](#overview)
2. [Connection Types](#connection-types)
3. [Testing Database Connections](#testing-database-connections)
4. [Using SQL Server Connection](#using-sql-server-connection)
5. [Using ODBC Connection](#using-odbc-connection)
6. [Troubleshooting](#troubleshooting)

## Overview

The GeospatialAnalyzerBS application supports connecting to external database systems to retrieve and analyze property data. This is especially useful when working on the county network where direct database access is available. The application supports two main connection types:

- **SQL Server** - For connecting to Microsoft SQL Server databases
- **ODBC** - For connecting to any database system that provides an ODBC driver

## Connection Types

### SQL Server Connection

Use this connection type when you need to connect directly to a Microsoft SQL Server database. You will need:
- Server name or IP address
- Database name
- Username and password (if SQL Server authentication is used)
- Port number (default is 1433)

### ODBC Connection

Use this connection type when you need to connect to other database systems through an ODBC driver. You will need:
- A properly formatted ODBC connection string
- Optional: Username and password if not included in the connection string

## Testing Database Connections

The application provides a dedicated testing interface at `/database-test` that allows you to:

1. Configure connection settings
2. Write and execute test queries
3. View query results

## Using SQL Server Connection

To connect to a SQL Server database:

1. Navigate to `/database-test` in the application
2. Select the "SQL Server" tab
3. Enter the connection details:
   - Server: The hostname or IP address of the SQL Server
   - Port: Default is 1433
   - Database: The name of the database to connect to
   - Username: SQL Server login (if using SQL authentication)
   - Password: SQL Server password (if using SQL authentication)
4. Configure encryption settings if needed
5. Enter a SQL query in the query box (default is `SELECT TOP 10 * FROM INFORMATION_SCHEMA.TABLES`)
6. Click "Execute Query" to run the query

The results will be displayed in a table below the form.

### Example SQL Server Connection Settings

```
Server: 192.168.1.100
Port: 1433
Database: CountyProperties
Username: readonly_user
Password: ********
```

## Using ODBC Connection

To connect using ODBC:

1. Navigate to `/database-test` in the application
2. Select the "ODBC" tab
3. Enter the full connection string in the "Connection String" field
4. Optionally provide a username and password if not included in the connection string
5. Enter a SQL query in the query box
6. Click "Execute Query" to run the query

The results will be displayed in a table below the form.

### Example ODBC Connection Strings

**SQL Server via ODBC:**
```
Driver={SQL Server};Server=192.168.1.100;Database=CountyProperties;Trusted_Connection=yes;
```

**SQL Server with username/password:**
```
Driver={SQL Server};Server=192.168.1.100;Database=CountyProperties;UID=username;PWD=password;
```

## Troubleshooting

### Common Issues

1. **Connection Failed**: Verify that the server is reachable and that the credentials are correct.

2. **Invalid Object Name**: Check that the table or view you are querying exists in the database you are connected to.

3. **Permission Denied**: Ensure the user account has appropriate permissions to execute the query.

4. **ODBC Driver Not Found**: Make sure the appropriate ODBC driver is installed on the server.

### SQL Server-Specific Issues

- Check that SQL Server is configured to allow remote connections
- Verify that the SQL Server Browser service is running
- Ensure that TCP/IP protocol is enabled in SQL Server Configuration Manager

### ODBC-Specific Issues

- Verify the connection string format is correct
- Check that the ODBC driver specified in the connection string is installed
- For Windows Authentication, ensure "Trusted_Connection=yes" is included in the connection string

For persistent connection issues, please consult with your database administrator.
