import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { dataConnector } from '../../services/etl/DataConnector';
import { DataSource, DataSourceType } from '../../services/etl/ETLTypes';
import { PlusCircle, Database, Globe, FileText, Server, Trash2, RefreshCw, Check } from 'lucide-react';

/**
 * ETL Data Source Manager Component
 * 
 * This component provides a UI for managing data source connections,
 * including creating, editing, testing, and deleting connections.
 */
export function ETLDataSourceManager() {
  const [activeTab, setActiveTab] = useState('database');
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [connectionTesting, setConnectionTesting] = useState<Record<string, boolean>>({});
  const [connectionStatus, setConnectionStatus] = useState<Record<string, { success: boolean; message: string }>>({});
  
  // Form state for new connection
  const [newSource, setNewSource] = useState({
    name: '',
    description: '',
    type: 'database' as DataSourceType,
    // Database connection details
    db: {
      host: '',
      port: '5432',
      database: '',
      username: '',
      password: '',
      ssl: false
    },
    // API connection details
    api: {
      baseUrl: '',
      authType: 'none' as 'none' | 'basic' | 'bearer' | 'apiKey',
      username: '',
      password: '',
      token: '',
      apiKey: '',
      apiKeyName: '',
      apiKeyLocation: 'header' as 'header' | 'query'
    },
    // File connection details
    file: {
      fileType: 'csv' as 'csv' | 'json' | 'xml' | 'excel' | 'parquet',
      delimiter: ',',
      hasHeader: true,
      sheet: '',
      encoding: 'utf-8'
    }
  });
  
  // Load data sources
  useEffect(() => {
    setDataSources(dataConnector.getAllDataSources());
    
    // Create some demo data sources if none exist
    if (dataConnector.getAllDataSources().length === 0) {
      // Sample database source
      dataConnector.registerDataSource({
        name: 'Property Database',
        description: 'County property database',
        type: 'database',
        connectionDetails: {
          host: 'localhost',
          port: 5432,
          database: 'property_db',
          username: 'user',
          password: 'password',
          ssl: false
        }
      });
      
      // Sample API source
      dataConnector.registerDataSource({
        name: 'Census API',
        description: 'US Census Bureau API',
        type: 'api',
        connectionDetails: {
          baseUrl: 'https://api.census.gov/data',
          authType: 'apiKey',
          authDetails: {
            apiKey: 'demo_key',
            apiKeyName: 'key',
            apiKeyLocation: 'query'
          }
        }
      });
      
      // Update state
      setDataSources(dataConnector.getAllDataSources());
    }
  }, []);
  
  // Handle form input changes
  const handleInputChange = (
    section: 'general' | 'db' | 'api' | 'file',
    field: string,
    value: string | boolean
  ) => {
    setNewSource(prev => {
      if (section === 'general') {
        return { ...prev, [field]: value };
      } else {
        const sectionObj = prev[section as keyof typeof prev];
        if (sectionObj && typeof sectionObj === 'object') {
          return {
            ...prev,
            [section]: {
              ...sectionObj,
              [field]: value
            }
          };
        }
        return prev;
      }
    });
  };
  
  // Handle creating a new data source
  const handleCreateDataSource = () => {
    // Prepare connection details based on the type
    let connectionDetails: any = {};
    
    switch (newSource.type) {
      case 'database':
        connectionDetails = {
          host: newSource.db.host,
          port: parseInt(newSource.db.port),
          database: newSource.db.database,
          username: newSource.db.username,
          password: newSource.db.password,
          ssl: newSource.db.ssl
        };
        break;
      case 'api':
        connectionDetails = {
          baseUrl: newSource.api.baseUrl,
          authType: newSource.api.authType,
          authDetails: {}
        };
        
        if (newSource.api.authType === 'basic') {
          connectionDetails.authDetails = {
            username: newSource.api.username,
            password: newSource.api.password
          };
        } else if (newSource.api.authType === 'bearer') {
          connectionDetails.authDetails = {
            token: newSource.api.token
          };
        } else if (newSource.api.authType === 'apiKey') {
          connectionDetails.authDetails = {
            apiKey: newSource.api.apiKey,
            apiKeyName: newSource.api.apiKeyName,
            apiKeyLocation: newSource.api.apiKeyLocation
          };
        }
        break;
      case 'file':
        connectionDetails = {
          fileType: newSource.file.fileType,
          delimiter: newSource.file.delimiter,
          hasHeader: newSource.file.hasHeader,
          sheet: newSource.file.sheet,
          encoding: newSource.file.encoding
        };
        break;
      case 'memory':
        // No additional details needed for memory sources
        break;
    }
    
    // Register the data source
    dataConnector.registerDataSource({
      name: newSource.name,
      description: newSource.description,
      type: newSource.type,
      connectionDetails
    });
    
    // Update the list
    setDataSources(dataConnector.getAllDataSources());
    
    // Reset form
    setNewSource({
      name: '',
      description: '',
      type: 'database',
      db: {
        host: '',
        port: '5432',
        database: '',
        username: '',
        password: '',
        ssl: false
      },
      api: {
        baseUrl: '',
        authType: 'none',
        username: '',
        password: '',
        token: '',
        apiKey: '',
        apiKeyName: '',
        apiKeyLocation: 'header'
      },
      file: {
        fileType: 'csv',
        delimiter: ',',
        hasHeader: true,
        sheet: '',
        encoding: 'utf-8'
      }
    });
  };
  
  // Handle deleting a data source
  const handleDeleteDataSource = (id: string) => {
    dataConnector.deleteDataSource(id);
    setDataSources(dataConnector.getAllDataSources());
  };
  
  // Handle testing a connection
  const handleTestConnection = async (id: string) => {
    setConnectionTesting(prev => ({ ...prev, [id]: true }));
    
    const result = await dataConnector.testConnection(id);
    
    setConnectionStatus(prev => ({ ...prev, [id]: result }));
    setConnectionTesting(prev => ({ ...prev, [id]: false }));
    
    // Clear status after 5 seconds
    setTimeout(() => {
      setConnectionStatus(prev => {
        const newStatus = { ...prev };
        delete newStatus[id];
        return newStatus;
      });
    }, 5000);
  };
  
  // Get icon for data source type
  const getSourceTypeIcon = (type: DataSourceType) => {
    switch (type) {
      case 'database':
        return <Database className="h-4 w-4" />;
      case 'api':
        return <Globe className="h-4 w-4" />;
      case 'file':
        return <FileText className="h-4 w-4" />;
      case 'memory':
        return <Server className="h-4 w-4" />;
    }
  };
  
  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6">Data Source Manager</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Data source list */}
        <div className="md:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>Available Data Sources</CardTitle>
              <CardDescription>
                Manage existing data source connections
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[400px]">
                {dataSources.length === 0 ? (
                  <div className="text-center p-4">
                    <p className="text-gray-500">No data sources configured</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {dataSources.map((source) => (
                      <Card key={source.id} className="p-4">
                        <div className="flex justify-between">
                          <div>
                            <div className="flex items-center space-x-2">
                              <Badge variant="outline" className="flex items-center space-x-1">
                                {getSourceTypeIcon(source.type)}
                                <span className="capitalize">{source.type}</span>
                              </Badge>
                              <h3 className="text-lg font-semibold">{source.name}</h3>
                            </div>
                            <p className="text-sm text-gray-500 mt-1">
                              {source.description || 'No description'}
                            </p>
                          </div>
                          <div className="flex items-start space-x-2">
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleTestConnection(source.id)}
                              disabled={connectionTesting[source.id]}
                              className="flex items-center"
                            >
                              {connectionTesting[source.id] ? (
                                <RefreshCw className="h-4 w-4 mr-1 animate-spin" />
                              ) : (
                                <RefreshCw className="h-4 w-4 mr-1" />
                              )}
                              Test
                            </Button>
                            <Button 
                              variant="outline" 
                              size="sm" 
                              onClick={() => handleDeleteDataSource(source.id)}
                              className="flex items-center text-red-500 hover:text-red-700"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </div>
                        </div>
                        
                        {connectionStatus[source.id] && (
                          <div className={`mt-2 text-sm p-2 rounded ${
                            connectionStatus[source.id].success 
                              ? 'bg-green-100 text-green-800' 
                              : 'bg-red-100 text-red-800'
                          }`}>
                            <div className="flex items-center">
                              {connectionStatus[source.id].success ? (
                                <Check className="h-4 w-4 mr-1" />
                              ) : (
                                <AlertTriangle className="h-4 w-4 mr-1" />
                              )}
                              {connectionStatus[source.id].message}
                            </div>
                          </div>
                        )}
                      </Card>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        {/* New data source form */}
        <div>
          <Card>
            <CardHeader>
              <CardTitle>Add New Data Source</CardTitle>
              <CardDescription>
                Configure a new data source connection
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="source-name">Name</Label>
                  <Input 
                    id="source-name" 
                    value={newSource.name}
                    onChange={(e) => handleInputChange('general', 'name', e.target.value)}
                    placeholder="My Data Source"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="source-description">Description</Label>
                  <Input 
                    id="source-description" 
                    value={newSource.description}
                    onChange={(e) => handleInputChange('general', 'description', e.target.value)}
                    placeholder="Optional description"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label>Source Type</Label>
                  <Select 
                    value={newSource.type}
                    onValueChange={(value) => handleInputChange('general', 'type', value as DataSourceType)}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                
                {/* Database-specific fields */}
                {newSource.type === 'database' && (
                  <div className="space-y-4 border rounded-md p-4">
                    <h4 className="font-medium">Database Connection</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="db-host">Host</Label>
                      <Input 
                        id="db-host" 
                        value={newSource.db.host}
                        onChange={(e) => handleInputChange('db', 'host', e.target.value)}
                        placeholder="localhost"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="db-port">Port</Label>
                      <Input 
                        id="db-port" 
                        value={newSource.db.port}
                        onChange={(e) => handleInputChange('db', 'port', e.target.value)}
                        placeholder="5432"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="db-name">Database Name</Label>
                      <Input 
                        id="db-name" 
                        value={newSource.db.database}
                        onChange={(e) => handleInputChange('db', 'database', e.target.value)}
                        placeholder="my_database"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="db-username">Username</Label>
                      <Input 
                        id="db-username" 
                        value={newSource.db.username}
                        onChange={(e) => handleInputChange('db', 'username', e.target.value)}
                        placeholder="username"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="db-password">Password</Label>
                      <Input 
                        id="db-password" 
                        type="password"
                        value={newSource.db.password}
                        onChange={(e) => handleInputChange('db', 'password', e.target.value)}
                        placeholder="********"
                      />
                    </div>
                    
                    <div className="flex items-center space-x-2">
                      <Checkbox 
                        id="db-ssl"
                        checked={newSource.db.ssl}
                        onCheckedChange={(checked) => handleInputChange('db', 'ssl', checked === true)}
                      />
                      <Label htmlFor="db-ssl">Use SSL</Label>
                    </div>
                  </div>
                )}
                
                {/* API-specific fields */}
                {newSource.type === 'api' && (
                  <div className="space-y-4 border rounded-md p-4">
                    <h4 className="font-medium">API Connection</h4>
                    
                    <div className="space-y-2">
                      <Label htmlFor="api-base-url">Base URL</Label>
                      <Input 
                        id="api-base-url" 
                        value={newSource.api.baseUrl}
                        onChange={(e) => handleInputChange('api', 'baseUrl', e.target.value)}
                        placeholder="https://api.example.com"
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label>Authentication Type</Label>
                      <Select 
                        value={newSource.api.authType}
                        onValueChange={(value) => handleInputChange('api', 'authType', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select authentication type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="none">None</SelectItem>
                          <SelectItem value="basic">Basic Auth</SelectItem>
                          <SelectItem value="bearer">Bearer Token</SelectItem>
                          <SelectItem value="apiKey">API Key</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newSource.api.authType === 'basic' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="api-username">Username</Label>
                          <Input 
                            id="api-username" 
                            value={newSource.api.username}
                            onChange={(e) => handleInputChange('api', 'username', e.target.value)}
                            placeholder="username"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="api-password">Password</Label>
                          <Input 
                            id="api-password" 
                            type="password"
                            value={newSource.api.password}
                            onChange={(e) => handleInputChange('api', 'password', e.target.value)}
                            placeholder="********"
                          />
                        </div>
                      </>
                    )}
                    
                    {newSource.api.authType === 'bearer' && (
                      <div className="space-y-2">
                        <Label htmlFor="api-token">Bearer Token</Label>
                        <Input 
                          id="api-token" 
                          value={newSource.api.token}
                          onChange={(e) => handleInputChange('api', 'token', e.target.value)}
                          placeholder="token"
                        />
                      </div>
                    )}
                    
                    {newSource.api.authType === 'apiKey' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="api-key">API Key</Label>
                          <Input 
                            id="api-key" 
                            value={newSource.api.apiKey}
                            onChange={(e) => handleInputChange('api', 'apiKey', e.target.value)}
                            placeholder="api_key"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label htmlFor="api-key-name">API Key Name</Label>
                          <Input 
                            id="api-key-name" 
                            value={newSource.api.apiKeyName}
                            onChange={(e) => handleInputChange('api', 'apiKeyName', e.target.value)}
                            placeholder="key"
                          />
                        </div>
                        
                        <div className="space-y-2">
                          <Label>API Key Location</Label>
                          <Select 
                            value={newSource.api.apiKeyLocation}
                            onValueChange={(value) => handleInputChange('api', 'apiKeyLocation', value as 'header' | 'query')}
                          >
                            <SelectTrigger>
                              <SelectValue placeholder="Select location" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="header">Header</SelectItem>
                              <SelectItem value="query">Query Parameter</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>
                      </>
                    )}
                  </div>
                )}
                
                {/* File-specific fields */}
                {newSource.type === 'file' && (
                  <div className="space-y-4 border rounded-md p-4">
                    <h4 className="font-medium">File Connection</h4>
                    
                    <div className="space-y-2">
                      <Label>File Type</Label>
                      <Select 
                        value={newSource.file.fileType}
                        onValueChange={(value) => handleInputChange('file', 'fileType', value as any)}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select file type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="csv">CSV</SelectItem>
                          <SelectItem value="json">JSON</SelectItem>
                          <SelectItem value="xml">XML</SelectItem>
                          <SelectItem value="excel">Excel</SelectItem>
                          <SelectItem value="parquet">Parquet</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>
                    
                    {newSource.file.fileType === 'csv' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="file-delimiter">Delimiter</Label>
                          <Input 
                            id="file-delimiter" 
                            value={newSource.file.delimiter}
                            onChange={(e) => handleInputChange('file', 'delimiter', e.target.value)}
                            placeholder=","
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="file-has-header"
                            checked={newSource.file.hasHeader}
                            onCheckedChange={(checked) => handleInputChange('file', 'hasHeader', checked === true)}
                          />
                          <Label htmlFor="file-has-header">Has Header Row</Label>
                        </div>
                      </>
                    )}
                    
                    {newSource.file.fileType === 'excel' && (
                      <>
                        <div className="space-y-2">
                          <Label htmlFor="file-sheet">Sheet Name</Label>
                          <Input 
                            id="file-sheet" 
                            value={newSource.file.sheet}
                            onChange={(e) => handleInputChange('file', 'sheet', e.target.value)}
                            placeholder="Sheet1"
                          />
                        </div>
                        
                        <div className="flex items-center space-x-2">
                          <Checkbox 
                            id="file-has-header"
                            checked={newSource.file.hasHeader}
                            onCheckedChange={(checked) => handleInputChange('file', 'hasHeader', checked === true)}
                          />
                          <Label htmlFor="file-has-header">Has Header Row</Label>
                        </div>
                      </>
                    )}
                    
                    <div className="space-y-2">
                      <Label htmlFor="file-encoding">Encoding</Label>
                      <Input 
                        id="file-encoding" 
                        value={newSource.file.encoding}
                        onChange={(e) => handleInputChange('file', 'encoding', e.target.value)}
                        placeholder="utf-8"
                      />
                    </div>
                  </div>
                )}
              </div>
            </CardContent>
            <CardFooter>
              <Button 
                onClick={handleCreateDataSource}
                disabled={!newSource.name}
                className="w-full"
              >
                <PlusCircle className="h-4 w-4 mr-2" />
                Add Data Source
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}

// Missing import
import { AlertTriangle } from 'lucide-react';