import React, { useState, useEffect } from 'react';
import { useToast } from "@/hooks/use-toast";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertTriangle, Database, Loader2, CheckCircle, XCircle, FileText, Globe, Server } from 'lucide-react';
import { AlertCircle } from 'lucide-react';
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import DataConnectorService, { ConnectorType, ConnectorConfig, DatabaseConnectorConfig, APIConnectorConfig, FileConnectorConfig, MemoryConnectorConfig } from '@/services/etl/DataConnector';

interface ETLDataSourceManagerProps {
  className?: string;
}

export function ETLDataSourceManager({ className }: ETLDataSourceManagerProps) {
  const { toast } = useToast();
  const [loading, setLoading] = useState<boolean>(true);
  const [testingConnector, setTestingConnector] = useState<string | null>(null);
  const [connectors, setConnectors] = useState<Map<string, ConnectorConfig>>(new Map());
  const [connectorStatuses, setConnectorStatuses] = useState<Map<string, boolean>>(new Map());
  const [isNewConnectorDialogOpen, setIsNewConnectorDialogOpen] = useState<boolean>(false);
  const [newConnectorType, setNewConnectorType] = useState<ConnectorType>('database');
  const [newConnector, setNewConnector] = useState<Partial<ConnectorConfig>>({
    type: 'database',
    name: '',
    description: ''
  });
  
  // Initialize data on component mount
  useEffect(() => {
    // Initialize the connectors from the DataConnectorService
    initializeConnectors();
  }, []);

  const initializeConnectors = async () => {
    try {
      setLoading(true);
      
      // Initialize built-in connectors if none exist
      if (DataConnectorService.getAllConnectorConfigs().size === 0) {
        DataConnectorService.initializeBuiltInConnectors();
      }
      
      // Get all connector configs
      const configs = DataConnectorService.getAllConnectorConfigs();
      setConnectors(new Map(configs));
      
      // Test all connectors
      const statuses = await DataConnectorService.testAllConnectors();
      setConnectorStatuses(statuses);
      
      setLoading(false);
    } catch (error) {
      console.error('Error initializing connectors:', error);
      toast({
        title: "Connection Error",
        description: "Failed to initialize data connectors. Please try again.",
        variant: "destructive",
      });
      setLoading(false);
    }
  };

  const handleTestConnector = async (id: string) => {
    try {
      setTestingConnector(id);
      const connector = DataConnectorService.getConnector(id);
      
      if (connector) {
        const status = await connector.test();
        setConnectorStatuses(prev => new Map(prev).set(id, status));
        
        toast({
          title: status ? "Connection Successful" : "Connection Failed",
          description: status 
            ? `Successfully connected to ${connectors.get(id)?.name}` 
            : `Failed to connect to ${connectors.get(id)?.name}. Please check configuration.`,
          variant: status ? "default" : "destructive",
        });
      }
    } catch (error) {
      console.error(`Error testing connector ${id}:`, error);
      setConnectorStatuses(prev => new Map(prev).set(id, false));
      
      toast({
        title: "Connection Error",
        description: `Error testing connection to ${connectors.get(id)?.name}. ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    } finally {
      setTestingConnector(null);
    }
  };

  const handleRemoveConnector = (id: string) => {
    const success = DataConnectorService.removeConnector(id);
    if (success) {
      const updatedConnectors = new Map(connectors);
      updatedConnectors.delete(id);
      setConnectors(updatedConnectors);
      
      const updatedStatuses = new Map(connectorStatuses);
      updatedStatuses.delete(id);
      setConnectorStatuses(updatedStatuses);
      
      toast({
        title: "Connector Removed",
        description: `Successfully removed ${connectors.get(id)?.name} connector.`,
      });
    } else {
      toast({
        title: "Error",
        description: `Failed to remove ${connectors.get(id)?.name} connector.`,
        variant: "destructive",
      });
    }
  };

  const handleNewConnectorChange = (field: string, value: any) => {
    setNewConnector(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleTypeChange = (type: ConnectorType) => {
    setNewConnectorType(type);
    setNewConnector(prev => ({
      ...prev,
      type
    }));
  };

  const handleAddConnector = () => {
    // Validate the basic connector config
    if (!newConnector.name) {
      toast({
        title: "Validation Error",
        description: "Connector name is required.",
        variant: "destructive",
      });
      return;
    }

    try {
      // Generate a unique ID based on the connector name
      const id = `connector-${Date.now()}`;
      
      // Create the full config based on the connector type
      let config: ConnectorConfig;
      
      switch (newConnectorType) {
        case 'database':
          config = {
            ...(newConnector as DatabaseConnectorConfig),
            type: 'database',
            connectionString: (newConnector as DatabaseConnectorConfig).connectionString || ''
          };
          break;
        case 'api':
          config = {
            ...(newConnector as APIConnectorConfig),
            type: 'api',
            url: (newConnector as APIConnectorConfig).url || ''
          };
          break;
        case 'file':
          config = {
            ...(newConnector as FileConnectorConfig),
            type: 'file',
            path: (newConnector as FileConnectorConfig).path || '',
            format: (newConnector as FileConnectorConfig).format || 'csv'
          };
          break;
        case 'memory':
          config = {
            ...(newConnector as MemoryConnectorConfig),
            type: 'memory',
            dataKey: (newConnector as MemoryConnectorConfig).dataKey || ''
          };
          break;
        default:
          throw new Error(`Unsupported connector type: ${newConnectorType}`);
      }
      
      // Register the connector
      DataConnectorService.registerConnector(id, config);
      
      // Update the state
      const updatedConnectors = new Map(connectors);
      updatedConnectors.set(id, config);
      setConnectors(updatedConnectors);
      
      // Reset form and close dialog
      setNewConnector({
        type: 'database',
        name: '',
        description: ''
      });
      setIsNewConnectorDialogOpen(false);
      
      toast({
        title: "Connector Added",
        description: `Successfully added ${config.name} connector.`,
      });
      
      // Test the new connector
      handleTestConnector(id);
    } catch (error) {
      console.error('Error adding connector:', error);
      toast({
        title: "Error",
        description: `Failed to add connector: ${error instanceof Error ? error.message : 'Unknown error'}`,
        variant: "destructive",
      });
    }
  };

  // Render connector icon based on type
  const renderConnectorIcon = (type: ConnectorType) => {
    switch (type) {
      case 'database':
        return <Database className="h-5 w-5 mr-2" />;
      case 'api':
        return <Globe className="h-5 w-5 mr-2" />;
      case 'file':
        return <FileText className="h-5 w-5 mr-2" />;
      case 'memory':
        return <Server className="h-5 w-5 mr-2" />;
      default:
        return <AlertCircle className="h-5 w-5 mr-2" />;
    }
  };

  // Render connector status badge
  const renderConnectorStatus = (id: string) => {
    const status = connectorStatuses.get(id);
    
    if (testingConnector === id) {
      return (
        <div className="flex items-center">
          <Loader2 className="h-4 w-4 mr-2 animate-spin" />
          <span>Testing...</span>
        </div>
      );
    }
    
    if (status === undefined) {
      return <Badge variant="outline">Unknown</Badge>;
    }
    
    return status ? (
      <Badge variant="outline" className="bg-green-100 text-green-800 border-green-200">
        <CheckCircle className="h-3.5 w-3.5 mr-1" />
        Connected
      </Badge>
    ) : (
      <Badge variant="destructive" className="bg-red-100 text-red-800 border-red-200">
        <XCircle className="h-3.5 w-3.5 mr-1" />
        Disconnected
      </Badge>
    );
  };

  // Render specific connector configuration fields based on type
  const renderConnectorFields = () => {
    switch (newConnectorType) {
      case 'database':
        return (
          <>
            <div className="grid w-full gap-2">
              <Label htmlFor="connectionString">Connection String</Label>
              <Input
                id="connectionString"
                placeholder="postgresql://user:password@localhost:5432/database"
                value={(newConnector as DatabaseConnectorConfig)?.connectionString || ''}
                onChange={(e) => handleNewConnectorChange('connectionString', e.target.value)}
              />
            </div>
            <div className="grid w-full gap-2">
              <Label htmlFor="schema">Schema (Optional)</Label>
              <Input
                id="schema"
                placeholder="public"
                value={(newConnector as DatabaseConnectorConfig)?.schema || ''}
                onChange={(e) => handleNewConnectorChange('schema', e.target.value)}
              />
            </div>
            <div className="grid w-full gap-2">
              <Label htmlFor="table">Table (Optional)</Label>
              <Input
                id="table"
                placeholder="properties"
                value={(newConnector as DatabaseConnectorConfig)?.table || ''}
                onChange={(e) => handleNewConnectorChange('table', e.target.value)}
              />
            </div>
          </>
        );
      case 'api':
        return (
          <>
            <div className="grid w-full gap-2">
              <Label htmlFor="url">API URL</Label>
              <Input
                id="url"
                placeholder="https://api.example.com/data"
                value={(newConnector as APIConnectorConfig)?.url || ''}
                onChange={(e) => handleNewConnectorChange('url', e.target.value)}
              />
            </div>
            <div className="grid w-full gap-2">
              <Label htmlFor="method">Method</Label>
              <Select
                value={(newConnector as APIConnectorConfig)?.method || 'GET'}
                onValueChange={(value) => handleNewConnectorChange('method', value)}
              >
                <SelectTrigger id="method">
                  <SelectValue placeholder="Select method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="GET">GET</SelectItem>
                  <SelectItem value="POST">POST</SelectItem>
                  <SelectItem value="PUT">PUT</SelectItem>
                  <SelectItem value="DELETE">DELETE</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid w-full gap-2">
              <Label htmlFor="authType">Authentication</Label>
              <Select
                value={(newConnector as APIConnectorConfig)?.authType || 'none'}
                onValueChange={(value) => handleNewConnectorChange('authType', value)}
              >
                <SelectTrigger id="authType">
                  <SelectValue placeholder="Select authentication type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">None</SelectItem>
                  <SelectItem value="basic">Basic Auth</SelectItem>
                  <SelectItem value="bearer">Bearer Token</SelectItem>
                  <SelectItem value="api-key">API Key</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newConnector as APIConnectorConfig)?.authType === 'api-key' && (
              <>
                <div className="grid w-full gap-2">
                  <Label htmlFor="apiKey">API Key</Label>
                  <Input
                    id="apiKey"
                    placeholder="Your API key"
                    value={(newConnector as APIConnectorConfig)?.apiKey || ''}
                    onChange={(e) => handleNewConnectorChange('apiKey', e.target.value)}
                  />
                </div>
                <div className="grid w-full gap-2">
                  <Label htmlFor="apiKeyHeaderName">API Key Header Name</Label>
                  <Input
                    id="apiKeyHeaderName"
                    placeholder="X-API-Key"
                    value={(newConnector as APIConnectorConfig)?.apiKeyHeaderName || ''}
                    onChange={(e) => handleNewConnectorChange('apiKeyHeaderName', e.target.value)}
                  />
                </div>
              </>
            )}
          </>
        );
      case 'file':
        return (
          <>
            <div className="grid w-full gap-2">
              <Label htmlFor="path">File Path</Label>
              <Input
                id="path"
                placeholder="/data/file.csv"
                value={(newConnector as FileConnectorConfig)?.path || ''}
                onChange={(e) => handleNewConnectorChange('path', e.target.value)}
              />
            </div>
            <div className="grid w-full gap-2">
              <Label htmlFor="format">File Format</Label>
              <Select
                value={(newConnector as FileConnectorConfig)?.format || 'csv'}
                onValueChange={(value: any) => handleNewConnectorChange('format', value)}
              >
                <SelectTrigger id="format">
                  <SelectValue placeholder="Select format" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="csv">CSV</SelectItem>
                  <SelectItem value="json">JSON</SelectItem>
                  <SelectItem value="xml">XML</SelectItem>
                  <SelectItem value="excel">Excel</SelectItem>
                </SelectContent>
              </Select>
            </div>
            {(newConnector as FileConnectorConfig)?.format === 'csv' && (
              <div className="grid w-full gap-2">
                <Label htmlFor="delimiter">Delimiter</Label>
                <Input
                  id="delimiter"
                  placeholder=","
                  value={(newConnector as FileConnectorConfig)?.delimiter || ','}
                  onChange={(e) => handleNewConnectorChange('delimiter', e.target.value)}
                />
              </div>
            )}
          </>
        );
      case 'memory':
        return (
          <div className="grid w-full gap-2">
            <Label htmlFor="dataKey">Data Key</Label>
            <Input
              id="dataKey"
              placeholder="uniqueDataKey"
              value={(newConnector as MemoryConnectorConfig)?.dataKey || ''}
              onChange={(e) => handleNewConnectorChange('dataKey', e.target.value)}
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="text-xl flex items-center">
          <Database className="h-5 w-5 mr-2" />
          Data Source Manager
        </CardTitle>
        <CardDescription>
          Manage connections to various data sources for ETL operations
        </CardDescription>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center p-6">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p>Loading data sources...</p>
          </div>
        ) : (
          <Tabs defaultValue="sources">
            <TabsList className="mb-4">
              <TabsTrigger value="sources">Data Sources</TabsTrigger>
              <TabsTrigger value="connections">Connection Status</TabsTrigger>
            </TabsList>
            
            <TabsContent value="sources">
              <div className="mb-4">
                <Dialog open={isNewConnectorDialogOpen} onOpenChange={setIsNewConnectorDialogOpen}>
                  <DialogTrigger asChild>
                    <Button>Add Data Source</Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[500px]">
                    <DialogHeader>
                      <DialogTitle>Add New Data Source</DialogTitle>
                      <DialogDescription>
                        Configure a new data source connection for ETL operations
                      </DialogDescription>
                    </DialogHeader>
                    
                    <div className="grid gap-4 py-4">
                      <div className="grid w-full gap-2">
                        <Label htmlFor="type">Source Type</Label>
                        <Select value={newConnectorType} onValueChange={(value: ConnectorType) => handleTypeChange(value)}>
                          <SelectTrigger id="type">
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
                      
                      <div className="grid w-full gap-2">
                        <Label htmlFor="name">Name</Label>
                        <Input
                          id="name"
                          placeholder="Property Database"
                          value={newConnector.name || ''}
                          onChange={(e) => handleNewConnectorChange('name', e.target.value)}
                        />
                      </div>
                      
                      <div className="grid w-full gap-2">
                        <Label htmlFor="description">Description (Optional)</Label>
                        <Input
                          id="description"
                          placeholder="Main database for property data"
                          value={newConnector.description || ''}
                          onChange={(e) => handleNewConnectorChange('description', e.target.value)}
                        />
                      </div>
                      
                      {renderConnectorFields()}
                    </div>
                    
                    <DialogFooter>
                      <Button variant="outline" onClick={() => setIsNewConnectorDialogOpen(false)}>
                        Cancel
                      </Button>
                      <Button onClick={handleAddConnector}>
                        Add Data Source
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
              
              <div className="border rounded-md">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead className="text-right">Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {connectors.size === 0 ? (
                      <TableRow>
                        <TableCell colSpan={4} className="text-center py-4">
                          No data sources configured. Click "Add Data Source" to create one.
                        </TableCell>
                      </TableRow>
                    ) : (
                      Array.from(connectors.entries()).map(([id, config]) => (
                        <TableRow key={id}>
                          <TableCell className="font-medium">
                            <div className="flex flex-col">
                              <span>{config.name}</span>
                              {config.description && (
                                <span className="text-sm text-muted-foreground">{config.description}</span>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="flex items-center">
                              {renderConnectorIcon(config.type)}
                              <span className="capitalize">{config.type}</span>
                            </div>
                          </TableCell>
                          <TableCell>{renderConnectorStatus(id)}</TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleTestConnector(id)}
                                disabled={testingConnector === id}
                              >
                                {testingConnector === id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Testing
                                  </>
                                ) : 'Test'}
                              </Button>
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleRemoveConnector(id)}
                              >
                                Remove
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      ))
                    )}
                  </TableBody>
                </Table>
              </div>
            </TabsContent>
            
            <TabsContent value="connections">
              <div className="space-y-4">
                <div className="flex items-center gap-2 mb-4">
                  <AlertTriangle className="h-5 w-5 text-yellow-500" />
                  <p className="text-sm text-muted-foreground">
                    Connection status is checked periodically. Click "Test" to force a status update.
                  </p>
                </div>
                
                {connectors.size === 0 ? (
                  <div className="border rounded-md p-6 text-center">
                    <p className="text-muted-foreground">No data sources configured.</p>
                  </div>
                ) : (
                  <Accordion type="single" collapsible className="w-full">
                    {Array.from(connectors.entries()).map(([id, config]) => (
                      <AccordionItem key={id} value={id}>
                        <AccordionTrigger>
                          <div className="flex items-center">
                            {renderConnectorIcon(config.type)}
                            <span>{config.name}</span>
                            <div className="ml-4">
                              {renderConnectorStatus(id)}
                            </div>
                          </div>
                        </AccordionTrigger>
                        <AccordionContent>
                          <div className="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 rounded-md">
                            <div>
                              <h4 className="text-sm font-medium mb-2">Connection Details</h4>
                              <div className="text-sm space-y-2">
                                <div className="grid grid-cols-2 gap-2">
                                  <div className="text-muted-foreground">Type:</div>
                                  <div className="capitalize">{config.type}</div>
                                  
                                  {config.type === 'database' && (
                                    <>
                                      <div className="text-muted-foreground">Connection String:</div>
                                      <div className="truncate max-w-[300px]">
                                        {(config as DatabaseConnectorConfig).connectionString}
                                      </div>
                                      
                                      {(config as DatabaseConnectorConfig).schema && (
                                        <>
                                          <div className="text-muted-foreground">Schema:</div>
                                          <div>{(config as DatabaseConnectorConfig).schema}</div>
                                        </>
                                      )}
                                      
                                      {(config as DatabaseConnectorConfig).table && (
                                        <>
                                          <div className="text-muted-foreground">Table:</div>
                                          <div>{(config as DatabaseConnectorConfig).table}</div>
                                        </>
                                      )}
                                    </>
                                  )}
                                  
                                  {config.type === 'api' && (
                                    <>
                                      <div className="text-muted-foreground">URL:</div>
                                      <div className="truncate max-w-[300px]">
                                        {(config as APIConnectorConfig).url}
                                      </div>
                                      
                                      <div className="text-muted-foreground">Method:</div>
                                      <div>{(config as APIConnectorConfig).method || 'GET'}</div>
                                      
                                      <div className="text-muted-foreground">Auth Type:</div>
                                      <div className="capitalize">
                                        {(config as APIConnectorConfig).authType || 'none'}
                                      </div>
                                    </>
                                  )}
                                  
                                  {config.type === 'file' && (
                                    <>
                                      <div className="text-muted-foreground">Path:</div>
                                      <div className="truncate max-w-[300px]">
                                        {(config as FileConnectorConfig).path}
                                      </div>
                                      
                                      <div className="text-muted-foreground">Format:</div>
                                      <div className="uppercase">
                                        {(config as FileConnectorConfig).format}
                                      </div>
                                      
                                      {(config as FileConnectorConfig).delimiter && (
                                        <>
                                          <div className="text-muted-foreground">Delimiter:</div>
                                          <div>{(config as FileConnectorConfig).delimiter}</div>
                                        </>
                                      )}
                                    </>
                                  )}
                                  
                                  {config.type === 'memory' && (
                                    <>
                                      <div className="text-muted-foreground">Data Key:</div>
                                      <div>{(config as MemoryConnectorConfig).dataKey}</div>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>
                            
                            <div className="flex justify-end gap-2">
                              <Button 
                                variant="outline" 
                                size="sm" 
                                onClick={() => handleTestConnector(id)}
                                disabled={testingConnector === id}
                              >
                                {testingConnector === id ? (
                                  <>
                                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                                    Testing
                                  </>
                                ) : 'Test Connection'}
                              </Button>
                            </div>
                          </div>
                        </AccordionContent>
                      </AccordionItem>
                    ))}
                  </Accordion>
                )}
              </div>
            </TabsContent>
          </Tabs>
        )}
      </CardContent>
      <CardFooter className="flex justify-between">
        <div className="text-sm text-muted-foreground">
          {connectors.size} data source(s) configured
        </div>
        <Button variant="outline" onClick={initializeConnectors}>
          Refresh
        </Button>
      </CardFooter>
    </Card>
  );
}

export default ETLDataSourceManager;