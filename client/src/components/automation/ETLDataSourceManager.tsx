import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Textarea } from '@/components/ui/textarea';
import { 
  Database, 
  Globe, 
  FileText, 
  Trash2, 
  Edit, 
  Plus, 
  RefreshCw, 
  CheckCircle, 
  XCircle
} from 'lucide-react';
import { dataConnector } from '../../services/etl/DataConnector';
import { DataSource, DataSourceType } from '../../services/etl/ETLTypes';

// Icons for data source types
const DataSourceIcon = ({ type }: { type: DataSourceType }) => {
  switch (type) {
    case 'database':
      return <Database className="h-5 w-5 text-blue-500" />;
    case 'api':
      return <Globe className="h-5 w-5 text-green-500" />;
    case 'file':
      return <FileText className="h-5 w-5 text-amber-500" />;
    case 'memory':
      return <Database className="h-5 w-5 text-purple-500" />;
    default:
      return <Database className="h-5 w-5 text-gray-500" />;
  }
};

export function ETLDataSourceManager() {
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [selectedSource, setSelectedSource] = useState<DataSource | null>(null);
  const [isTestingConnection, setIsTestingConnection] = useState(false);
  const [testResult, setTestResult] = useState<{ success: boolean; message: string } | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    type: 'database' as DataSourceType,
    connectionDetails: {}
  });
  const [isEdit, setIsEdit] = useState(false);
  
  // Load data sources on component mount
  useEffect(() => {
    loadDataSources();
  }, []);
  
  // Load all data sources
  const loadDataSources = () => {
    const sources = dataConnector.getAllDataSources();
    setDataSources(sources);
    
    // Select the first source by default if none is selected
    if (!selectedSource && sources.length > 0) {
      setSelectedSource(sources[0]);
    }
  };
  
  // Handle source selection
  const handleSelectSource = (source: DataSource) => {
    setSelectedSource(source);
    setTestResult(null);
  };
  
  // Test connection to selected source
  const handleTestConnection = async () => {
    if (!selectedSource) return;
    
    setIsTestingConnection(true);
    setTestResult(null);
    
    try {
      const result = await dataConnector.testConnection(selectedSource.id);
      setTestResult(result);
    } catch (error) {
      setTestResult({
        success: false,
        message: error instanceof Error ? error.message : 'Connection test failed'
      });
    } finally {
      setIsTestingConnection(false);
    }
  };
  
  // Handle delete source
  const handleDeleteSource = (id: string) => {
    const result = dataConnector.deleteDataSource(id);
    
    if (result) {
      // Reload data sources
      loadDataSources();
      
      // If the deleted source was selected, clear the selection
      if (selectedSource && selectedSource.id === id) {
        setSelectedSource(null);
      }
    }
  };
  
  // Open form to create new source
  const handleOpenCreateForm = () => {
    setFormData({
      name: '',
      description: '',
      type: 'database',
      connectionDetails: {}
    });
    setIsEdit(false);
    setFormOpen(true);
  };
  
  // Open form to edit source
  const handleOpenEditForm = (source: DataSource) => {
    setFormData({
      name: source.name,
      description: source.description || '',
      type: source.type,
      connectionDetails: { ...source.connectionDetails }
    });
    setIsEdit(true);
    setFormOpen(true);
  };
  
  // Handle form submit
  const handleFormSubmit = () => {
    if (isEdit && selectedSource) {
      // Update existing source
      dataConnector.updateDataSource(selectedSource.id, {
        name: formData.name,
        description: formData.description,
        type: formData.type,
        connectionDetails: formData.connectionDetails
      });
    } else {
      // Create new source
      dataConnector.registerDataSource({
        name: formData.name,
        description: formData.description,
        type: formData.type,
        connectionDetails: formData.connectionDetails
      });
    }
    
    // Close form and reload sources
    setFormOpen(false);
    loadDataSources();
  };
  
  // Handle form input change
  const handleFormInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    const { name, value } = e.target;
    
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  // Handle connection details change
  const handleConnectionDetailsChange = (field: string, value: string) => {
    setFormData(prev => ({
      ...prev,
      connectionDetails: {
        ...prev.connectionDetails,
        [field]: value
      }
    }));
  };
  
  // Render connection details based on source type
  const renderConnectionDetailsForm = () => {
    switch (formData.type) {
      case 'database':
        return (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="host">Host</Label>
                <Input
                  id="host"
                  value={(formData.connectionDetails as any).host || ''}
                  onChange={(e) => handleConnectionDetailsChange('host', e.target.value)}
                  placeholder="localhost"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="port">Port</Label>
                <Input
                  id="port"
                  type="number"
                  value={(formData.connectionDetails as any).port || ''}
                  onChange={(e) => handleConnectionDetailsChange('port', e.target.value)}
                  placeholder="5432"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="database">Database Name</Label>
              <Input
                id="database"
                value={(formData.connectionDetails as any).database || ''}
                onChange={(e) => handleConnectionDetailsChange('database', e.target.value)}
                placeholder="my_database"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="username">Username</Label>
                <Input
                  id="username"
                  value={(formData.connectionDetails as any).username || ''}
                  onChange={(e) => handleConnectionDetailsChange('username', e.target.value)}
                  placeholder="user"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="password">Password</Label>
                <Input
                  id="password"
                  type="password"
                  value={(formData.connectionDetails as any).password || ''}
                  onChange={(e) => handleConnectionDetailsChange('password', e.target.value)}
                  placeholder="••••••••"
                />
              </div>
            </div>
            
            <div className="flex items-center space-x-2 pt-2">
              <input
                type="checkbox"
                id="ssl"
                checked={(formData.connectionDetails as any).ssl || false}
                onChange={(e) => handleConnectionDetailsChange('ssl', e.target.checked.toString())}
              />
              <Label htmlFor="ssl">Use SSL</Label>
            </div>
          </div>
        );
        
      case 'api':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="baseUrl">Base URL</Label>
              <Input
                id="baseUrl"
                value={(formData.connectionDetails as any).baseUrl || ''}
                onChange={(e) => handleConnectionDetailsChange('baseUrl', e.target.value)}
                placeholder="https://api.example.com"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="authType">Authentication Type</Label>
              <Select
                value={(formData.connectionDetails as any).authType || 'none'}
                onValueChange={(value) => handleConnectionDetailsChange('authType', value)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select authentication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="api_key">API Key</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            {(formData.connectionDetails as any).authType === 'api_key' && (
              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <Input
                  id="apiKey"
                  type="password"
                  value={(formData.connectionDetails as any).apiKey || ''}
                  onChange={(e) => handleConnectionDetailsChange('apiKey', e.target.value)}
                  placeholder="Enter API key"
                />
              </div>
            )}
            
            {(formData.connectionDetails as any).authType === 'bearer' && (
              <div className="space-y-2">
                <Label htmlFor="token">Bearer Token</Label>
                <Input
                  id="token"
                  type="password"
                  value={(formData.connectionDetails as any).token || ''}
                  onChange={(e) => handleConnectionDetailsChange('token', e.target.value)}
                  placeholder="Enter token"
                />
              </div>
            )}
            
            {(formData.connectionDetails as any).authType === 'basic' && (
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="username">Username</Label>
                  <Input
                    id="username"
                    value={(formData.connectionDetails as any).username || ''}
                    onChange={(e) => handleConnectionDetailsChange('username', e.target.value)}
                    placeholder="user"
                  />
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="password">Password</Label>
                  <Input
                    id="password"
                    type="password"
                    value={(formData.connectionDetails as any).password || ''}
                    onChange={(e) => handleConnectionDetailsChange('password', e.target.value)}
                    placeholder="••••••••"
                  />
                </div>
              </div>
            )}
            
            <div className="space-y-2">
              <Label htmlFor="timeout">Timeout (ms)</Label>
              <Input
                id="timeout"
                type="number"
                value={(formData.connectionDetails as any).timeout || ''}
                onChange={(e) => handleConnectionDetailsChange('timeout', e.target.value)}
                placeholder="30000"
              />
            </div>
          </div>
        );
        
      case 'file':
        return (
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="path">File Path</Label>
              <Input
                id="path"
                value={(formData.connectionDetails as any).path || ''}
                onChange={(e) => handleConnectionDetailsChange('path', e.target.value)}
                placeholder="/data/files"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="filePattern">File Pattern</Label>
              <Input
                id="filePattern"
                value={(formData.connectionDetails as any).filePattern || ''}
                onChange={(e) => handleConnectionDetailsChange('filePattern', e.target.value)}
                placeholder="*.csv"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="encoding">Encoding</Label>
                <Input
                  id="encoding"
                  value={(formData.connectionDetails as any).encoding || ''}
                  onChange={(e) => handleConnectionDetailsChange('encoding', e.target.value)}
                  placeholder="utf-8"
                />
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="delimiter">Delimiter</Label>
                <Input
                  id="delimiter"
                  value={(formData.connectionDetails as any).delimiter || ''}
                  onChange={(e) => handleConnectionDetailsChange('delimiter', e.target.value)}
                  placeholder=","
                />
              </div>
            </div>
          </div>
        );
        
      default:
        return (
          <div className="p-4 text-center text-gray-500">
            Connection details not available for this type
          </div>
        );
    }
  };
  
  // Render connection details for display
  const renderConnectionDetails = (details: Record<string, any>) => {
    return (
      <div className="space-y-2">
        {Object.entries(details).map(([key, value]) => {
          // Skip sensitive fields or show masked values
          if (key === 'password' || key === 'apiKey' || key === 'token') {
            value = '••••••••';
          }
          
          // Format boolean values
          if (typeof value === 'boolean') {
            value = value ? 'Yes' : 'No';
          }
          
          return (
            <div key={key} className="flex justify-between">
              <span className="text-sm font-medium capitalize">{key.replace(/([A-Z])/g, ' $1')}</span>
              <span className="text-sm text-gray-600">{value.toString()}</span>
            </div>
          );
        })}
      </div>
    );
  };
  
  return (
    <div className="container mx-auto p-6">
      <h1 className="text-2xl font-bold mb-6">ETL Data Source Manager</h1>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle>Data Sources</CardTitle>
              <Button size="sm" onClick={handleOpenCreateForm}>
                <Plus className="h-4 w-4 mr-1" />
                Add Source
              </Button>
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[500px] pr-4">
                <div className="space-y-4 pt-2">
                  {dataSources.map(source => (
                    <Card 
                      key={source.id}
                      className={`cursor-pointer transition-colors ${
                        selectedSource?.id === source.id 
                          ? 'bg-gray-50 border-blue-300' 
                          : 'hover:bg-gray-50'
                      }`}
                      onClick={() => handleSelectSource(source)}
                    >
                      <CardContent className="p-4">
                        <div className="flex items-start justify-between">
                          <div className="flex items-start space-x-3">
                            <div className="mt-0.5">
                              <DataSourceIcon type={source.type} />
                            </div>
                            <div>
                              <h3 className="font-medium">{source.name}</h3>
                              <p className="text-sm text-gray-500 mt-0.5">
                                {source.description || `${source.type} data source`}
                              </p>
                            </div>
                          </div>
                          
                          <div className="flex space-x-1">
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleOpenEditForm(source);
                              }}
                            >
                              <Edit className="h-4 w-4 text-gray-500" />
                            </Button>
                            <Button 
                              size="sm" 
                              variant="ghost"
                              className="h-8 w-8 p-0"
                              onClick={(e) => {
                                e.stopPropagation();
                                handleDeleteSource(source.id);
                              }}
                            >
                              <Trash2 className="h-4 w-4 text-gray-500" />
                            </Button>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                  
                  {dataSources.length === 0 && (
                    <div className="text-center p-6 text-gray-500 bg-gray-50 rounded-md">
                      No data sources available
                    </div>
                  )}
                </div>
              </ScrollArea>
            </CardContent>
          </Card>
        </div>
        
        <div className="lg:col-span-2">
          <Card>
            <CardHeader>
              <CardTitle>
                {selectedSource 
                  ? `Data Source: ${selectedSource.name}` 
                  : 'Select a Data Source'}
              </CardTitle>
              <CardDescription>
                {selectedSource
                  ? `Type: ${selectedSource.type}`
                  : 'Click on a data source to view details'}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {selectedSource ? (
                <div className="space-y-6">
                  <div className="space-y-4">
                    <h3 className="text-lg font-semibold">Connection Details</h3>
                    <Card className="bg-gray-50">
                      <CardContent className="p-4">
                        {renderConnectionDetails(selectedSource.connectionDetails)}
                      </CardContent>
                    </Card>
                  </div>
                  
                  <div className="pt-2">
                    <Button 
                      onClick={handleTestConnection}
                      disabled={isTestingConnection}
                    >
                      {isTestingConnection ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Testing Connection...
                        </>
                      ) : (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2" />
                          Test Connection
                        </>
                      )}
                    </Button>
                    
                    {testResult && (
                      <div className={`mt-4 p-4 rounded-md ${
                        testResult.success 
                          ? 'bg-green-50 border border-green-200' 
                          : 'bg-red-50 border border-red-200'
                      }`}>
                        <div className="flex items-start space-x-3">
                          {testResult.success ? (
                            <CheckCircle className="h-5 w-5 text-green-500 mt-0.5" />
                          ) : (
                            <XCircle className="h-5 w-5 text-red-500 mt-0.5" />
                          )}
                          <div>
                            <h4 className={`font-medium ${
                              testResult.success 
                                ? 'text-green-800' 
                                : 'text-red-800'
                            }`}>
                              {testResult.success ? 'Connection Successful' : 'Connection Failed'}
                            </h4>
                            <p className={`text-sm ${
                              testResult.success 
                                ? 'text-green-700' 
                                : 'text-red-700'
                            }`}>
                              {testResult.message}
                            </p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div className="text-center p-6 text-gray-500">
                  Select a data source to view details or create a new one
                </div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
      
      {/* Data Source Form Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle>{isEdit ? 'Edit Data Source' : 'Create New Data Source'}</DialogTitle>
            <DialogDescription>
              {isEdit 
                ? 'Update the information for this data source' 
                : 'Add a new data source for ETL operations'}
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Name</Label>
              <Input
                id="name"
                name="name"
                value={formData.name}
                onChange={handleFormInputChange}
                placeholder="e.g., Production Database"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                name="description"
                value={formData.description}
                onChange={handleFormInputChange}
                placeholder="Brief description of this data source"
                rows={2}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="type">Source Type</Label>
              <Select
                value={formData.type}
                onValueChange={(value) => setFormData(prev => ({ ...prev, type: value as DataSourceType }))}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select source type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="database">Database</SelectItem>
                  <SelectItem value="api">API</SelectItem>
                  <SelectItem value="file">File System</SelectItem>
                  <SelectItem value="memory">In-Memory</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="pt-2">
              <h3 className="text-sm font-medium mb-3">Connection Details</h3>
              {renderConnectionDetailsForm()}
            </div>
          </div>
          
          <DialogFooter>
            <Button variant="outline" onClick={() => setFormOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleFormSubmit}>
              {isEdit ? 'Update' : 'Create'} Data Source
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}