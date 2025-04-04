/**
 * DataSourceManager.tsx
 * 
 * Component for managing ETL data sources
 */

import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Database, Globe, File, Server, CheckCircle, XCircle, Edit, Trash2, Plus, MoreHorizontal, FolderInput, RefreshCw } from 'lucide-react';
import { DataSourceType } from '../../services/etl/ETLTypes';

const DataSourceManager: React.FC = () => {
  // State for data sources list
  const [dataSources, setDataSources] = useState([
    { 
      id: 1, 
      name: 'Property Database', 
      type: DataSourceType.DATABASE, 
      isActive: true, 
      lastTested: '2025-04-03T15:30:00', 
      connectionDetails: {
        host: 'db.example.com',
        database: 'properties',
        username: 'etl_user'
      }
    },
    { 
      id: 2, 
      name: 'Market API', 
      type: DataSourceType.API, 
      isActive: true, 
      lastTested: '2025-04-04T09:45:00',
      connectionDetails: {
        url: 'https://api.marketdata.com/v2',
        authType: 'API_KEY'
      }
    },
    { 
      id: 3, 
      name: 'Census Data CSV', 
      type: DataSourceType.FILE, 
      isActive: true, 
      lastTested: '2025-04-02T11:20:00',
      connectionDetails: {
        path: '/data/census/2020.csv',
        format: 'CSV'
      }
    },
    { 
      id: 4, 
      name: 'Legacy Property System', 
      type: DataSourceType.CUSTOM, 
      isActive: false, 
      lastTested: '2025-03-28T16:15:00',
      connectionDetails: {
        custom: 'Legacy integration via custom adapter'
      }
    },
  ]);

  // State for showing add/edit dialog
  const [showDialog, setShowDialog] = useState(false);
  const [currentSource, setCurrentSource] = useState<any>(null);
  const [selectedType, setSelectedType] = useState<DataSourceType | ''>('');

  // Function to get icon based on source type
  const getSourceIcon = (type: DataSourceType) => {
    switch (type) {
      case DataSourceType.DATABASE:
        return <Database className="h-4 w-4" />;
      case DataSourceType.API:
        return <Globe className="h-4 w-4" />;
      case DataSourceType.FILE:
        return <File className="h-4 w-4" />;
      case DataSourceType.IN_MEMORY:
        return <Server className="h-4 w-4" />;
      case DataSourceType.CUSTOM:
        return <FolderInput className="h-4 w-4" />;
      default:
        return <Database className="h-4 w-4" />;
    }
  };

  // Function to get summary of connection details
  const getConnectionSummary = (source: any) => {
    switch (source.type) {
      case DataSourceType.DATABASE:
        return `${source.connectionDetails.host}/${source.connectionDetails.database}`;
      case DataSourceType.API:
        return source.connectionDetails.url;
      case DataSourceType.FILE:
        return source.connectionDetails.path;
      case DataSourceType.CUSTOM:
        return source.connectionDetails.custom;
      default:
        return 'Connection details not available';
    }
  };

  // Function to handle source type selection
  const handleTypeSelect = (type: string) => {
    setSelectedType(type as DataSourceType);
  };

  // Function to handle adding a new source
  const handleAddSource = () => {
    setCurrentSource(null);
    setSelectedType('');
    setShowDialog(true);
  };

  // Function to handle editing a source
  const handleEditSource = (source: any) => {
    setCurrentSource(source);
    setSelectedType(source.type);
    setShowDialog(true);
  };

  // Function to handle testing connection
  const handleTestConnection = (id: number) => {
    console.log(`Testing connection for source ID: ${id}`);
    // In a real implementation, this would call the ConnectionTestService
  };

  // Function to handle deleting a source
  const handleDeleteSource = (id: number) => {
    if (confirm('Are you sure you want to delete this data source?')) {
      setDataSources(dataSources.filter(source => source.id !== id));
    }
  };

  // Function to handle saving a source
  const handleSaveSource = (event: React.FormEvent) => {
    event.preventDefault();
    // In a real implementation, this would save the source to the backend
    setShowDialog(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Data Sources</h2>
          <p className="text-muted-foreground">
            Configure and manage connections to your data sources
          </p>
        </div>
        <Button onClick={handleAddSource}>
          <Plus className="h-4 w-4 mr-2" />
          Add Data Source
        </Button>
      </div>

      {/* Data Source List */}
      <Card>
        <CardHeader>
          <CardTitle>Available Data Sources</CardTitle>
          <CardDescription>
            Data sources available for ETL operations
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Type</TableHead>
                <TableHead>Connection Details</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Last Tested</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dataSources.map(source => (
                <TableRow key={source.id}>
                  <TableCell className="font-medium">
                    <div className="flex items-center">
                      {getSourceIcon(source.type)}
                      <span className="ml-2">{source.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {source.type}
                    </Badge>
                  </TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {getConnectionSummary(source)}
                  </TableCell>
                  <TableCell>
                    {source.isActive ? (
                      <Badge className="bg-green-500">Active</Badge>
                    ) : (
                      <Badge variant="outline" className="text-red-500 border-red-500">Inactive</Badge>
                    )}
                  </TableCell>
                  <TableCell>
                    {new Date(source.lastTested).toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button size="sm" variant="ghost" onClick={() => handleTestConnection(source.id)}>
                        <RefreshCw className="h-4 w-4" />
                        <span className="sr-only">Test</span>
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => handleEditSource(source)}>
                        <Edit className="h-4 w-4" />
                        <span className="sr-only">Edit</span>
                      </Button>
                      <Button size="sm" variant="ghost" className="text-red-500" onClick={() => handleDeleteSource(source.id)}>
                        <Trash2 className="h-4 w-4" />
                        <span className="sr-only">Delete</span>
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Add/Edit Dialog */}
      <Dialog open={showDialog} onOpenChange={setShowDialog}>
        <DialogContent className="sm:max-w-[625px]">
          <DialogHeader>
            <DialogTitle>{currentSource ? 'Edit Data Source' : 'Add New Data Source'}</DialogTitle>
            <DialogDescription>
              Configure the connection details for your data source
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={handleSaveSource}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="name" className="text-right">
                  Name
                </Label>
                <Input
                  id="name"
                  defaultValue={currentSource?.name || ''}
                  className="col-span-3"
                  required
                />
              </div>

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="type" className="text-right">
                  Type
                </Label>
                <Select
                  value={selectedType}
                  onValueChange={handleTypeSelect}
                >
                  <SelectTrigger id="type" className="col-span-3">
                    <SelectValue placeholder="Select a source type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value={DataSourceType.DATABASE}>Database</SelectItem>
                    <SelectItem value={DataSourceType.API}>API</SelectItem>
                    <SelectItem value={DataSourceType.FILE}>File</SelectItem>
                    <SelectItem value={DataSourceType.IN_MEMORY}>In-Memory</SelectItem>
                    <SelectItem value={DataSourceType.CUSTOM}>Custom</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {/* Dynamic fields based on type */}
              {selectedType === DataSourceType.DATABASE && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="host" className="text-right">
                      Host
                    </Label>
                    <Input
                      id="host"
                      defaultValue={currentSource?.connectionDetails?.host || ''}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="port" className="text-right">
                      Port
                    </Label>
                    <Input
                      id="port"
                      defaultValue={currentSource?.connectionDetails?.port || '5432'}
                      className="col-span-3"
                      type="number"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="database" className="text-right">
                      Database
                    </Label>
                    <Input
                      id="database"
                      defaultValue={currentSource?.connectionDetails?.database || ''}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="username" className="text-right">
                      Username
                    </Label>
                    <Input
                      id="username"
                      defaultValue={currentSource?.connectionDetails?.username || ''}
                      className="col-span-3"
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="password" className="text-right">
                      Password
                    </Label>
                    <Input
                      id="password"
                      type="password"
                      className="col-span-3"
                    />
                  </div>
                </>
              )}

              {selectedType === DataSourceType.API && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="url" className="text-right">
                      URL
                    </Label>
                    <Input
                      id="url"
                      defaultValue={currentSource?.connectionDetails?.url || ''}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="authType" className="text-right">
                      Auth Type
                    </Label>
                    <Select
                      defaultValue={currentSource?.connectionDetails?.authType || 'NONE'}
                    >
                      <SelectTrigger id="authType" className="col-span-3">
                        <SelectValue placeholder="Select authentication type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="NONE">None</SelectItem>
                        <SelectItem value="BASIC">Basic Auth</SelectItem>
                        <SelectItem value="API_KEY">API Key</SelectItem>
                        <SelectItem value="OAUTH">OAuth</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              {selectedType === DataSourceType.FILE && (
                <>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="path" className="text-right">
                      File Path
                    </Label>
                    <Input
                      id="path"
                      defaultValue={currentSource?.connectionDetails?.path || ''}
                      className="col-span-3"
                      required
                    />
                  </div>
                  <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="format" className="text-right">
                      Format
                    </Label>
                    <Select
                      defaultValue={currentSource?.connectionDetails?.format || 'CSV'}
                    >
                      <SelectTrigger id="format" className="col-span-3">
                        <SelectValue placeholder="Select file format" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="CSV">CSV</SelectItem>
                        <SelectItem value="JSON">JSON</SelectItem>
                        <SelectItem value="XML">XML</SelectItem>
                        <SelectItem value="EXCEL">Excel</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </>
              )}

              <div className="grid grid-cols-4 items-center gap-4">
                <Label htmlFor="active" className="text-right">
                  Active
                </Label>
                <div className="flex items-center col-span-3">
                  <input
                    type="checkbox"
                    id="active"
                    defaultChecked={currentSource?.isActive ?? true}
                    className="mr-2 h-4 w-4"
                  />
                  <span className="text-sm">Source is active and available for ETL jobs</span>
                </div>
              </div>
            </div>

            <DialogFooter>
              <Button type="submit">Save Data Source</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default DataSourceManager;