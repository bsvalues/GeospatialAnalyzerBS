import React, { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Form, FormControl, FormDescription, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from '@/hooks/use-toast';
import { Badge } from '@/components/ui/badge';
import { apiRequest } from '@/lib/queryClient';
import { useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Loader2, Play, Edit, Trash, Plus, RefreshCw } from 'lucide-react';
// Import DataConnector for connection management
import { dataConnector } from '../services/etl/DataConnector';

// Data Source Form Schema
const dataSourceFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  type: z.enum(['database', 'api', 'file', 'memory']),
  connectionDetails: z.string().min(1, 'Connection details are required'),
  isConnected: z.boolean().optional()
});

// Transformation Rule Form Schema
const transformationRuleFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  dataType: z.enum(['text', 'number', 'date', 'boolean', 'object', 'location', 'address', 'geospatial']),
  transformationCode: z.string().min(1, 'Transformation code is required'),
  isActive: z.boolean().optional()
});

// ETL Job Form Schema
const etlJobFormSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  description: z.string().optional(),
  sourceId: z.string().min(1, 'Source is required'),
  targetId: z.string().min(1, 'Target is required'),
  transformationIds: z.array(z.string()).min(1, 'At least one transformation is required'),
  status: z.string().optional(),
  schedule: z.object({
    frequency: z.enum(['once', 'hourly', 'daily', 'weekly', 'monthly']),
    startDate: z.string().optional(),
    daysOfWeek: z.array(z.number()).optional(),
    timeOfDay: z.string().optional()
  }).optional()
});

export default function ETLManagement() {
  const [activeTab, setActiveTab] = useState('data-sources');
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-4">ETL Data Management</h1>
      <p className="text-gray-500 mb-6">
        Manage your Extract, Transform, Load (ETL) processes for property data.
      </p>
      
      <Tabs defaultValue="data-sources" value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="grid w-full grid-cols-3">
          <TabsTrigger value="data-sources">Data Sources</TabsTrigger>
          <TabsTrigger value="transformations">Transformations</TabsTrigger>
          <TabsTrigger value="jobs">ETL Jobs</TabsTrigger>
        </TabsList>
        
        <TabsContent value="data-sources">
          <DataSourcesTab />
        </TabsContent>
        
        <TabsContent value="transformations">
          <TransformationsTab />
        </TabsContent>
        
        <TabsContent value="jobs">
          <JobsTab />
        </TabsContent>
      </Tabs>
    </div>
  );
}

// Data Sources Tab
function DataSourcesTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedDataSource, setSelectedDataSource] = useState<any>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [dataSources, setDataSources] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  
  const queryClient = useQueryClient();
  
  // Load data sources directly from DataConnector
  useEffect(() => {
    // Use dataConnector to get all data sources
    const sources = dataConnector.getAllDataSources();
    setDataSources(sources);
    setIsLoading(false);
    
    // Log for debugging
    console.log("Loaded data sources:", sources);
  }, []);
  
  const createDataSourceMutation = useMutation({
    mutationFn: (dataSource: any) => apiRequest('/api/etl/data-sources', 'POST', dataSource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/data-sources'] });
      toast({
        title: 'Data source created',
        description: 'The data source was created successfully.'
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating data source',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  const updateDataSourceMutation = useMutation({
    mutationFn: ({ id, dataSource }: { id: number, dataSource: any }) => 
      apiRequest(`/api/etl/data-sources/${id}`, 'PUT', dataSource),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/data-sources'] });
      toast({
        title: 'Data source updated',
        description: 'The data source was updated successfully.'
      });
      setIsEditDialogOpen(false);
      setSelectedDataSource(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating data source',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  const deleteDataSourceMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/etl/data-sources/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/data-sources'] });
      toast({
        title: 'Data source deleted',
        description: 'The data source was deleted successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting data source',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  // Handle testing data source connection
  const handleTestDataConnection = async (id: string | number) => {
    try {
      setIsConnecting(true);
      
      // Convert id to string for API request if it's not already a string
      const dataId = String(id);
      
      const result = await dataConnector.testConnection(dataId);
      
      toast({
        title: result.success ? 'Connection successful' : 'Connection failed',
        description: result.message,
        variant: result.success ? 'default' : 'destructive'
      });
      
      // If connection was successful, refresh data sources
      if (result.success) {
        // Get fresh data sources
        const sources = dataConnector.getAllDataSources();
        setDataSources(sources);
      }
    } catch (error) {
      toast({
        title: 'Connection error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle connecting to data source
  const handleConnectDataSource = async (id: string | number) => {
    try {
      setIsConnecting(true);
      
      // Convert id to string for API request if it's not already a string
      const dataId = String(id);
      
      const success = await dataConnector.connectToDataSource(dataId);
      
      // Get the data source info for the toast message
      const dataSource = dataSources.find(ds => String(ds.id) === dataId);
      const name = dataSource ? dataSource.name : 'data source';
      
      toast({
        title: success ? 'Connection established' : 'Connection failed',
        description: success 
          ? `Successfully connected to ${name}`
          : `Failed to connect to ${name}`,
        variant: success ? 'default' : 'destructive'
      });
      
      // Refresh data sources to update the UI
      const updatedSources = dataConnector.getAllDataSources();
      setDataSources(updatedSources);
    } catch (error) {
      toast({
        title: 'Connection error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    } finally {
      setIsConnecting(false);
    }
  };
  
  // Handle disconnecting from data source
  const handleDisconnectDataSource = (id: string | number) => {
    try {
      // Convert id to string for API request if it's not already a string
      const dataId = String(id);
      
      const success = dataConnector.closeConnection(dataId);
      
      // Get the data source info for the toast message
      const dataSource = dataSources.find(ds => String(ds.id) === dataId);
      const name = dataSource ? dataSource.name : 'data source';
      
      toast({
        title: success ? 'Disconnected' : 'Disconnect failed',
        description: success 
          ? `Successfully disconnected from ${name}`
          : `Failed to disconnect from ${name}`,
        variant: success ? 'default' : 'destructive'
      });
      
      // Refresh data sources to update the UI
      const updatedSources = dataConnector.getAllDataSources();
      setDataSources(updatedSources);
    } catch (error) {
      toast({
        title: 'Disconnect error',
        description: error instanceof Error ? error.message : 'An unknown error occurred',
        variant: 'destructive'
      });
    }
  };
  
  const handleEditDataSource = (dataSource: any) => {
    setSelectedDataSource(dataSource);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteDataSource = (id: number) => {
    if (window.confirm('Are you sure you want to delete this data source?')) {
      deleteDataSourceMutation.mutate(id);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Data Sources</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Data Source
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : dataSources && dataSources.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {dataSources.map((dataSource: any) => (
            <Card key={dataSource.id} className="h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {dataSource.name}
                  <Badge variant={dataSource.isConnected ? "default" : "destructive"}>
                    {dataSource.isConnected ? "Connected" : "Disconnected"}
                  </Badge>
                </CardTitle>
                <CardDescription>{dataSource.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="font-semibold">Type:</span> {dataSource.type}
                </div>
                <div className="mb-4">
                  <span className="font-semibold">Connection Details:</span>
                  <pre className="text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32">
                    {JSON.stringify(dataSource.connectionDetails, null, 2)}
                  </pre>
                </div>
                {dataSource.lastConnected && (
                  <div className="mb-4">
                    <span className="font-semibold">Last Connected:</span>{' '}
                    {new Date(dataSource.lastConnected).toLocaleString()}
                  </div>
                )}
                
                {/* Data Connection Manager */}
                <div className="mt-4 border-t pt-4">
                  <span className="font-semibold block mb-2">Connection Management:</span>
                  <div className="flex items-center">
                    <Button 
                      variant="outline" 
                      size="sm"
                      className="mr-2"
                      onClick={() => handleTestDataConnection(dataSource.id)}
                    >
                      Test Connection
                    </Button>
                    <Button 
                      variant={dataSource.isConnected ? "secondary" : "default"}
                      size="sm"
                      onClick={() => dataSource.isConnected 
                        ? handleDisconnectDataSource(dataSource.id)
                        : handleConnectDataSource(dataSource.id)
                      }
                    >
                      {dataSource.isConnected ? "Disconnect" : "Connect"}
                    </Button>
                  </div>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEditDataSource(dataSource)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteDataSource(dataSource.id)}>
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No data sources found.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Data Source
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Create Data Source Dialog */}
      <DataSourceDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(values) => {
          // Parse the connectionDetails string to an object
          const dataSource = {
            ...values,
            connectionDetails: JSON.parse(values.connectionDetails),
            isConnected: false
          };
          createDataSourceMutation.mutate(dataSource);
        }}
        isLoading={createDataSourceMutation.isPending}
        title="Create Data Source"
        description="Add a new data source for ETL operations."
      />
      
      {/* Edit Data Source Dialog */}
      {selectedDataSource && (
        <DataSourceDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={(values) => {
            // Parse the connectionDetails string to an object
            const dataSource = {
              ...values,
              connectionDetails: JSON.parse(values.connectionDetails),
              isConnected: selectedDataSource.isConnected
            };
            updateDataSourceMutation.mutate({ id: selectedDataSource.id, dataSource });
          }}
          isLoading={updateDataSourceMutation.isPending}
          title="Edit Data Source"
          description="Update the data source details."
          defaultValues={{
            ...selectedDataSource,
            connectionDetails: JSON.stringify(selectedDataSource.connectionDetails, null, 2)
          }}
        />
      )}
    </div>
  );
}

// Transformations Tab
function TransformationsTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedRule, setSelectedRule] = useState<any>(null);
  
  const queryClient = useQueryClient();
  
  const { data: transformationRules = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/etl/transformation-rules'],
    staleTime: 10000
  });
  
  const createRuleMutation = useMutation({
    mutationFn: (rule: any) => apiRequest('/api/etl/transformation-rules', 'POST', rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/transformation-rules'] });
      toast({
        title: 'Transformation rule created',
        description: 'The transformation rule was created successfully.'
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating transformation rule',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  const updateRuleMutation = useMutation({
    mutationFn: ({ id, rule }: { id: number, rule: any }) => 
      apiRequest(`/api/etl/transformation-rules/${id}`, 'PUT', rule),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/transformation-rules'] });
      toast({
        title: 'Transformation rule updated',
        description: 'The transformation rule was updated successfully.'
      });
      setIsEditDialogOpen(false);
      setSelectedRule(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating transformation rule',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  const deleteRuleMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/etl/transformation-rules/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/transformation-rules'] });
      toast({
        title: 'Transformation rule deleted',
        description: 'The transformation rule was deleted successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting transformation rule',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  const handleEditRule = (rule: any) => {
    setSelectedRule(rule);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteRule = (id: number) => {
    if (window.confirm('Are you sure you want to delete this transformation rule?')) {
      deleteRuleMutation.mutate(id);
    }
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Transformation Rules</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add Transformation Rule
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : transformationRules && transformationRules.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {transformationRules.map((rule: any) => (
            <Card key={rule.id} className="h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {rule.name}
                  <Badge variant={rule.isActive ? "default" : "secondary"}>
                    {rule.isActive ? "Active" : "Inactive"}
                  </Badge>
                </CardTitle>
                <CardDescription>{rule.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="font-semibold">Data Type:</span> {rule.dataType}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Transformation Code:</span>
                  <pre className="text-xs mt-1 p-2 bg-gray-100 dark:bg-gray-800 rounded overflow-auto max-h-32">
                    {rule.transformationCode}
                  </pre>
                </div>
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button size="sm" variant="outline" onClick={() => handleEditRule(rule)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteRule(rule.id)}>
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No transformation rules found.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add Transformation Rule
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Create Transformation Rule Dialog */}
      <TransformationRuleDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(values) => {
          const rule = {
            ...values,
            isActive: true
          };
          createRuleMutation.mutate(rule);
        }}
        isLoading={createRuleMutation.isPending}
        title="Create Transformation Rule"
        description="Add a new transformation rule for data processing."
      />
      
      {/* Edit Transformation Rule Dialog */}
      {selectedRule && (
        <TransformationRuleDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={(values) => {
            const rule = {
              ...values,
              isActive: selectedRule.isActive
            };
            updateRuleMutation.mutate({ id: selectedRule.id, rule });
          }}
          isLoading={updateRuleMutation.isPending}
          title="Edit Transformation Rule"
          description="Update the transformation rule details."
          defaultValues={selectedRule}
        />
      )}
    </div>
  );
}

// ETL Jobs Tab
function JobsTab() {
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState<any>(null);
  
  const queryClient = useQueryClient();
  
  const { data: jobs = [], isLoading } = useQuery<any[]>({
    queryKey: ['/api/etl/jobs'],
    staleTime: 10000
  });
  
  const { data: dataSources = [] } = useQuery<any[]>({
    queryKey: ['/api/etl/data-sources'],
    staleTime: 10000
  });
  
  const { data: transformationRules = [] } = useQuery<any[]>({
    queryKey: ['/api/etl/transformation-rules'],
    staleTime: 10000
  });
  
  const createJobMutation = useMutation({
    mutationFn: (job: any) => apiRequest('/api/etl/jobs', 'POST', job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/jobs'] });
      toast({
        title: 'ETL job created',
        description: 'The ETL job was created successfully.'
      });
      setIsCreateDialogOpen(false);
    },
    onError: (error: any) => {
      toast({
        title: 'Error creating ETL job',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  const updateJobMutation = useMutation({
    mutationFn: ({ id, job }: { id: number, job: any }) => 
      apiRequest(`/api/etl/jobs/${id}`, 'PUT', job),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/jobs'] });
      toast({
        title: 'ETL job updated',
        description: 'The ETL job was updated successfully.'
      });
      setIsEditDialogOpen(false);
      setSelectedJob(null);
    },
    onError: (error: any) => {
      toast({
        title: 'Error updating ETL job',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  const deleteJobMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/etl/jobs/${id}`, 'DELETE'),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/jobs'] });
      toast({
        title: 'ETL job deleted',
        description: 'The ETL job was deleted successfully.'
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error deleting ETL job',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  const executeJobMutation = useMutation({
    mutationFn: (id: number) => apiRequest(`/api/etl/jobs/${id}/execute`, 'POST'),
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ['/api/etl/jobs'] });
      toast({
        title: 'ETL job started',
        description: `Job execution has started. Job ID: ${variables}`
      });
    },
    onError: (error: any) => {
      toast({
        title: 'Error executing ETL job',
        description: error.message || 'Something went wrong.',
        variant: 'destructive'
      });
    }
  });
  
  const handleEditJob = (job: any) => {
    // Convert transformationIds to array of strings
    const formattedJob = {
      ...job,
      transformationIds: Array.isArray(job.transformationIds) 
        ? job.transformationIds.map((id: any) => id.toString())
        : []
    };
    setSelectedJob(formattedJob);
    setIsEditDialogOpen(true);
  };
  
  const handleDeleteJob = (id: number) => {
    if (window.confirm('Are you sure you want to delete this ETL job?')) {
      deleteJobMutation.mutate(id);
    }
  };
  
  const handleExecuteJob = (id: number) => {
    executeJobMutation.mutate(id);
  };
  
  const getStatusBadge = (status: string) => {
    const variants: Record<string, any> = {
      'idle': { variant: 'secondary', label: 'Idle' },
      'running': { variant: 'default', label: 'Running' },
      'success': { variant: 'default', label: 'Success' },
      'failed': { variant: 'destructive', label: 'Failed' },
      'warning': { variant: 'secondary', label: 'Warning' },
      'scheduled': { variant: 'secondary', label: 'Scheduled' },
      'completed': { variant: 'default', label: 'Completed' },
      'paused': { variant: 'secondary', label: 'Paused' },
      'created': { variant: 'secondary', label: 'Created' }
    };
    
    const statusInfo = variants[status] || { variant: 'secondary', label: status };
    
    return (
      <Badge variant={statusInfo.variant}>
        {statusInfo.label}
      </Badge>
    );
  };
  
  return (
    <div>
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">ETL Jobs</h2>
        <Button onClick={() => setIsCreateDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" /> Add ETL Job
        </Button>
      </div>
      
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin" />
        </div>
      ) : jobs && jobs.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {jobs.map((job: any) => (
            <Card key={job.id} className="h-full">
              <CardHeader>
                <CardTitle className="flex justify-between items-center">
                  {job.name}
                  {getStatusBadge(job.status)}
                </CardTitle>
                <CardDescription>{job.description}</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="mb-2">
                  <span className="font-semibold">Source:</span>{' '}
                  {dataSources?.find((source: any) => source.id.toString() === job.sourceId)?.name || job.sourceId}
                </div>
                <div className="mb-2">
                  <span className="font-semibold">Target:</span>{' '}
                  {dataSources?.find((source: any) => source.id.toString() === job.targetId)?.name || job.targetId}
                </div>
                {job.transformationIds && (
                  <div className="mb-2">
                    <span className="font-semibold">Transformations:</span>
                    <div className="mt-1 flex flex-wrap gap-1">
                      {Array.isArray(job.transformationIds) && job.transformationIds.map((ruleId: any) => {
                        const rule = transformationRules?.find((r: any) => r.id.toString() === ruleId.toString());
                        return (
                          <Badge key={ruleId} variant="outline">
                            {rule?.name || ruleId}
                          </Badge>
                        );
                      })}
                    </div>
                  </div>
                )}
                {job.schedule && (
                  <div className="mb-2">
                    <span className="font-semibold">Schedule:</span>{' '}
                    {job.schedule.frequency}{' '}
                    {job.schedule.timeOfDay && `at ${job.schedule.timeOfDay}`}
                  </div>
                )}
                {job.lastRunAt && (
                  <div>
                    <span className="font-semibold">Last Run:</span>{' '}
                    {new Date(job.lastRunAt).toLocaleString()}
                  </div>
                )}
              </CardContent>
              <CardFooter className="flex justify-end gap-2">
                <Button 
                  size="sm" 
                  onClick={() => handleExecuteJob(job.id)} 
                  disabled={job.status === 'running'}
                >
                  {job.status === 'running' ? (
                    <Loader2 className="h-4 w-4 mr-1 animate-spin" />
                  ) : (
                    <Play className="h-4 w-4 mr-1" />
                  )}
                  Run
                </Button>
                <Button size="sm" variant="outline" onClick={() => handleEditJob(job)}>
                  <Edit className="h-4 w-4 mr-1" /> Edit
                </Button>
                <Button size="sm" variant="destructive" onClick={() => handleDeleteJob(job.id)}>
                  <Trash className="h-4 w-4 mr-1" /> Delete
                </Button>
              </CardFooter>
            </Card>
          ))}
        </div>
      ) : (
        <Card>
          <CardContent className="flex flex-col items-center justify-center h-64">
            <p className="text-muted-foreground mb-4">No ETL jobs found.</p>
            <Button onClick={() => setIsCreateDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" /> Add ETL Job
            </Button>
          </CardContent>
        </Card>
      )}
      
      {/* Create ETL Job Dialog */}
      <ETLJobDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
        onSubmit={(values) => {
          const job = {
            ...values,
            status: 'idle',
            schedule: values.schedule || { 
              frequency: 'once', 
              startDate: new Date().toISOString().split('T')[0] 
            }
          };
          createJobMutation.mutate(job);
        }}
        isLoading={createJobMutation.isPending}
        title="Create ETL Job"
        description="Add a new ETL job for data processing."
        dataSources={dataSources || []}
        transformationRules={transformationRules || []}
      />
      
      {/* Edit ETL Job Dialog */}
      {selectedJob && (
        <ETLJobDialog
          open={isEditDialogOpen}
          onOpenChange={setIsEditDialogOpen}
          onSubmit={(values) => {
            const job = {
              ...values,
              status: selectedJob.status
            };
            updateJobMutation.mutate({ id: selectedJob.id, job });
          }}
          isLoading={updateJobMutation.isPending}
          title="Edit ETL Job"
          description="Update the ETL job details."
          defaultValues={selectedJob}
          dataSources={dataSources || []}
          transformationRules={transformationRules || []}
        />
      )}
    </div>
  );
}

// Data Source Dialog
function DataSourceDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  title,
  description,
  defaultValues
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  isLoading: boolean;
  title: string;
  description: string;
  defaultValues?: any;
}) {
  const form = useForm({
    resolver: zodResolver(dataSourceFormSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      type: 'database',
      connectionDetails: JSON.stringify({
        host: '',
        port: 5432,
        database: '',
        username: '',
        password: '',
        ssl: true
      }, null, 2)
    }
  });
  
  const handleSubmit = form.handleSubmit((values) => {
    try {
      // Validate that connectionDetails is valid JSON
      JSON.parse(values.connectionDetails);
      onSubmit(values);
    } catch (error) {
      toast({
        title: 'Invalid JSON',
        description: 'Connection details must be valid JSON.',
        variant: 'destructive'
      });
    }
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={handleSubmit} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Property Database" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Main database for property records" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="type"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data source type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="database">Database</SelectItem>
                      <SelectItem value="api">API</SelectItem>
                      <SelectItem value="file">File</SelectItem>
                      <SelectItem value="memory">Memory</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="connectionDetails"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Connection Details (JSON)</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={8} 
                      className="font-mono text-sm"
                      placeholder='{"host": "localhost", "port": 5432, "database": "properties"}'
                    />
                  </FormControl>
                  <FormDescription>
                    Enter connection details as a JSON object.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// Transformation Rule Dialog
function TransformationRuleDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  title,
  description,
  defaultValues
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  isLoading: boolean;
  title: string;
  description: string;
  defaultValues?: any;
}) {
  const form = useForm({
    resolver: zodResolver(transformationRuleFormSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      dataType: 'text',
      transformationCode: 'function transform(value) {\n  return value;\n}'
    }
  });
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Address Normalization" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Standardizes address format" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="dataType"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Data Type</FormLabel>
                  <Select 
                    onValueChange={field.onChange} 
                    defaultValue={field.value}
                  >
                    <FormControl>
                      <SelectTrigger>
                        <SelectValue placeholder="Select data type" />
                      </SelectTrigger>
                    </FormControl>
                    <SelectContent>
                      <SelectItem value="text">Text</SelectItem>
                      <SelectItem value="number">Number</SelectItem>
                      <SelectItem value="date">Date</SelectItem>
                      <SelectItem value="boolean">Boolean</SelectItem>
                      <SelectItem value="object">Object</SelectItem>
                      <SelectItem value="location">Location</SelectItem>
                      <SelectItem value="address">Address</SelectItem>
                      <SelectItem value="geospatial">Geospatial</SelectItem>
                    </SelectContent>
                  </Select>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="transformationCode"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transformation Code</FormLabel>
                  <FormControl>
                    <Textarea 
                      {...field} 
                      rows={8} 
                      className="font-mono text-sm"
                      placeholder="function transform(value) {\n  return value;\n}"
                    />
                  </FormControl>
                  <FormDescription>
                    Enter JavaScript function to transform the data.
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}

// ETL Job Dialog
function ETLJobDialog({
  open,
  onOpenChange,
  onSubmit,
  isLoading,
  title,
  description,
  defaultValues,
  dataSources,
  transformationRules
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (values: any) => void;
  isLoading: boolean;
  title: string;
  description: string;
  defaultValues?: any;
  dataSources: any[];
  transformationRules: any[];
}) {
  const [frequency, setFrequency] = useState(defaultValues?.schedule?.frequency || 'once');
  
  // Create a custom schema with dynamic validation based on selected frequency
  const dynamicJobFormSchema = etlJobFormSchema.extend({
    schedule: z.object({
      frequency: z.enum(['once', 'hourly', 'daily', 'weekly', 'monthly']),
      startDate: frequency === 'once' ? z.string().min(1, 'Start date is required') : z.string().optional(),
      daysOfWeek: frequency === 'weekly' ? z.array(z.number()).min(1, 'Select at least one day') : z.array(z.number()).optional(),
      timeOfDay: ['daily', 'weekly', 'monthly'].includes(frequency) ? z.string().min(1, 'Time is required') : z.string().optional(),
    }).optional(),
  });
  
  const form = useForm({
    resolver: zodResolver(dynamicJobFormSchema),
    defaultValues: defaultValues || {
      name: '',
      description: '',
      sourceId: '',
      targetId: '',
      transformationIds: [],
      schedule: {
        frequency: 'once',
        startDate: new Date().toISOString().split('T')[0],
        daysOfWeek: [],
        timeOfDay: '00:00'
      }
    }
  });
  
  // Update form when frequency changes
  useEffect(() => {
    const scheduleValue = form.getValues('schedule');
    if (scheduleValue) {
      form.setValue('schedule', {
        ...scheduleValue,
        frequency
      });
    }
  }, [frequency, form]);
  
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} placeholder="Property Records Import" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <FormField
              control={form.control}
              name="description"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea {...field} placeholder="Daily import of new property records" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="sourceId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Source</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select source" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataSources.map((source) => (
                          <SelectItem key={source.id} value={source.id.toString()}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              <FormField
                control={form.control}
                name="targetId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Target</FormLabel>
                    <Select 
                      onValueChange={field.onChange} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select target" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        {dataSources.map((source) => (
                          <SelectItem key={source.id} value={source.id.toString()}>
                            {source.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            
            <FormField
              control={form.control}
              name="transformationIds"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Transformations</FormLabel>
                  <div className="space-y-2">
                    {transformationRules.map((rule) => (
                      <div key={rule.id} className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          id={`rule-${rule.id}`}
                          checked={field.value?.includes(rule.id.toString())}
                          onChange={(e) => {
                            const checked = e.target.checked;
                            const updatedTransformations = checked
                              ? [...(field.value || []), rule.id.toString()]
                              : (field.value || []).filter((id: string) => id !== rule.id.toString());
                            field.onChange(updatedTransformations);
                          }}
                          className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                        />
                        <label htmlFor={`rule-${rule.id}`} className="text-sm font-medium">
                          {rule.name} <span className="text-muted-foreground">({rule.dataType})</span>
                        </label>
                      </div>
                    ))}
                  </div>
                  <FormMessage />
                </FormItem>
              )}
            />
            
            <div className="border rounded-md p-4">
              <h3 className="text-sm font-medium mb-3">Schedule</h3>
              
              <FormField
                control={form.control}
                name="schedule.frequency"
                render={({ field }) => (
                  <FormItem className="mb-4">
                    <FormLabel>Frequency</FormLabel>
                    <Select 
                      onValueChange={(value) => {
                        field.onChange(value);
                        setFrequency(value as any);
                      }} 
                      defaultValue={field.value}
                    >
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Select frequency" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="once">Once</SelectItem>
                        <SelectItem value="hourly">Hourly</SelectItem>
                        <SelectItem value="daily">Daily</SelectItem>
                        <SelectItem value="weekly">Weekly</SelectItem>
                        <SelectItem value="monthly">Monthly</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
              
              {frequency === 'once' && (
                <FormField
                  control={form.control}
                  name="schedule.startDate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Start Date</FormLabel>
                      <FormControl>
                        <Input type="date" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {frequency === 'weekly' && (
                <FormField
                  control={form.control}
                  name="schedule.daysOfWeek"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Days of Week</FormLabel>
                      <div className="flex flex-wrap gap-2">
                        {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day, index) => (
                          <div key={day} className="flex items-center space-x-2">
                            <input
                              type="checkbox"
                              id={`day-${index}`}
                              checked={field.value?.includes(index)}
                              onChange={(e) => {
                                const checked = e.target.checked;
                                const updatedDays = checked
                                  ? [...(field.value || []), index]
                                  : (field.value || []).filter((dayIndex: number) => dayIndex !== index);
                                field.onChange(updatedDays);
                              }}
                              className="h-4 w-4 rounded border-gray-300 text-primary focus:ring-primary"
                            />
                            <label htmlFor={`day-${index}`}>{day}</label>
                          </div>
                        ))}
                      </div>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              
              {['daily', 'weekly', 'monthly'].includes(frequency) && (
                <FormField
                  control={form.control}
                  name="schedule.timeOfDay"
                  render={({ field }) => (
                    <FormItem className="mt-4">
                      <FormLabel>Time</FormLabel>
                      <FormControl>
                        <Input type="time" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={isLoading}>
                {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}