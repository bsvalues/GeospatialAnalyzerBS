import { useEffect, useState } from 'react';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Clock, Database, FileText, Server, BarChart, AlertTriangle, CheckCircle, RefreshCw, Play, Pause, RotateCw, XCircle } from 'lucide-react';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import { ETLJobStatus } from '../../services/etl/ETLTypes';
import { etlPipelineManager } from '../../services/etl/ETLPipelineManager';
import { metricsCollector, ETLJobMetrics, MetricsSnapshot } from '../../services/etl/MetricsCollector';

/**
 * Status indicator colors based on job status
 */
const statusColors: Record<ETLJobStatus, string> = {
  created: 'bg-gray-400',
  scheduled: 'bg-blue-400',
  running: 'bg-blue-500',
  paused: 'bg-yellow-500',
  completed: 'bg-green-500',
  failed: 'bg-red-500'
};

/**
 * Status indicator text based on job status
 */
const statusText: Record<ETLJobStatus, string> = {
  created: 'Created',
  scheduled: 'Scheduled',
  running: 'Running',
  paused: 'Paused',
  completed: 'Success',
  failed: 'Failed'
};

/**
 * Status icon based on job status
 */
const StatusIcon = ({ status }: { status: ETLJobStatus }) => {
  switch (status) {
    case 'running':
      return <RefreshCw className="animate-spin h-4 w-4 mr-1" />;
    case 'completed':
      return <CheckCircle className="h-4 w-4 mr-1" />;
    case 'failed':
      return <XCircle className="h-4 w-4 mr-1" />;
    case 'paused':
      return <Pause className="h-4 w-4 mr-1" />;
    case 'scheduled':
      return <Clock className="h-4 w-4 mr-1" />;
    default:
      return <Clock className="h-4 w-4 mr-1" />;
  }
};

/**
 * Format milliseconds into human-readable duration
 */
const formatDuration = (ms: number): string => {
  if (ms < 1000) return `${ms}ms`;
  
  const seconds = Math.floor(ms / 1000);
  if (seconds < 60) return `${seconds}s`;
  
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}m ${remainingSeconds}s`;
};

/**
 * Format bytes into human-readable size
 */
const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

/**
 * Job Card Component
 */
const JobCard = ({ job, metrics }: { job: { id: string; name: string; description?: string; status: ETLJobStatus }, metrics: MetricsSnapshot | null }) => {
  const hasMetrics = metrics !== null;
  
  return (
    <Card className="mb-4 overflow-hidden">
      <div className="p-4">
        <div className="flex justify-between items-start">
          <div>
            <h3 className="text-lg font-semibold">{job.name}</h3>
            <p className="text-sm text-gray-500">{job.description || 'No description'}</p>
          </div>
          <Badge 
            variant="outline" 
            className="flex items-center"
            data-testid={`job-status-${job.id}`}
          >
            <div 
              className={`${statusColors[job.status as ETLJobStatus]} h-2 w-2 rounded-full mr-2`}
              data-testid={`job-indicator-${job.id}`}
            />
            <StatusIcon status={job.status as ETLJobStatus} />
            {statusText[job.status as ETLJobStatus]}
          </Badge>
        </div>
        
        {job.status === 'running' && hasMetrics && (
          <div className="mt-4">
            <div className="flex justify-between items-center mb-1">
              <span className="text-sm">Progress</span>
              <span className="text-sm">{metrics?.recordsProcessed || 0} records</span>
            </div>
            <Progress value={65} className="h-2" />
          </div>
        )}
        
        {hasMetrics && (
          <div className="grid grid-cols-3 gap-2 mt-4">
            <div className="text-center">
              <p className="text-xs text-gray-500">Duration</p>
              <p className="font-medium">{formatDuration(metrics.executionTime)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">Memory</p>
              <p className="font-medium">{formatBytes(metrics.memoryUsage.peakHeapSize)}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-500">CPU</p>
              <p className="font-medium">{metrics.cpuUtilization.toFixed(1)}%</p>
            </div>
          </div>
        )}
        
        <div className="flex space-x-2 mt-4">
          {job.status === 'running' ? (
            <Button size="sm" variant="outline" className="flex items-center">
              <Pause className="h-4 w-4 mr-1" />
              Pause
            </Button>
          ) : (
            <Button size="sm" variant="outline" className="flex items-center">
              <Play className="h-4 w-4 mr-1" />
              Run
            </Button>
          )}
          
          <Button size="sm" variant="ghost" className="flex items-center">
            <RotateCw className="h-4 w-4 mr-1" />
            Refresh
          </Button>
        </div>
      </div>
      
      {hasMetrics && metrics.taskMetrics.length > 0 && (
        <div className="border-t border-gray-100 bg-gray-50 p-4">
          <h4 className="text-sm font-medium mb-2">Task Details</h4>
          <ScrollArea className="h-32">
            <div className="space-y-2">
              {metrics.taskMetrics.map((task) => (
                <div key={task.taskId} className="text-sm">
                  <div className="flex justify-between">
                    <span className="font-medium">{task.taskName}</span>
                    <span>{formatDuration(task.executionTime)}</span>
                  </div>
                  <div className="flex justify-between text-gray-500">
                    <span>Records: {task.recordsProcessed}</span>
                    <span>{task.endTime ? 'Complete' : 'Running'}</span>
                  </div>
                  <Separator className="my-1" />
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>
      )}
    </Card>
  );
};

/**
 * ETL Dashboard Component
 */
export function ETLDashboard() {
  const [activeTab, setActiveTab] = useState('running');
  const [jobs, setJobs] = useState<any[]>([]);
  const [jobMetrics, setJobMetrics] = useState<Record<string, MetricsSnapshot | null>>({});
  
  // Load jobs
  useEffect(() => {
    const allJobs = etlPipelineManager.getAllJobs();
    setJobs(allJobs);
    
    // Create some demo jobs if none exist
    if (allJobs.length === 0) {
      const createDemoJobs = async () => {
        // Create a sample job
        const job1 = etlPipelineManager.createJob({
          name: 'Property Data Import',
          description: 'Import property data from county database',
          sourceId: 'src1',
          targetId: 'tgt1',
          transformationRules: []
        });
        
        // Create another sample job
        const job2 = etlPipelineManager.createJob({
          name: 'Spatial Data Processing',
          description: 'Process and transform GIS data for mapping',
          sourceId: 'src2',
          targetId: 'tgt2',
          transformationRules: []
        });
        
        // Start the first job
        await etlPipelineManager.executeJob(job1.id);
        
        // Update state
        setJobs(etlPipelineManager.getAllJobs());
      };
      
      createDemoJobs();
    }
  }, []);
  
  // Subscribe to metrics updates
  useEffect(() => {
    const metricsListener = (metrics: MetricsSnapshot) => {
      setJobMetrics(prev => ({
        ...prev,
        [metrics.jobId]: metrics
      }));
    };
    
    // Subscribe to updates
    const unsubscribe = metricsCollector.subscribeToMetricsUpdates(metricsListener);
    
    // Load initial metrics for all jobs
    const loadInitialMetrics = () => {
      const initialMetrics: Record<string, MetricsSnapshot | null> = {};
      
      jobs.forEach(job => {
        const metrics = metricsCollector.getJobMetrics(job.id);
        if (metrics) {
          initialMetrics[job.id] = metrics;
        }
      });
      
      setJobMetrics(initialMetrics);
    };
    
    loadInitialMetrics();
    
    // Clean up subscription
    return () => {
      unsubscribe();
    };
  }, [jobs]);
  
  // Filter jobs based on active tab
  const getFilteredJobs = () => {
    switch (activeTab) {
      case 'running':
        return jobs.filter(job => ['running', 'paused'].includes(job.status));
      case 'scheduled':
        return jobs.filter(job => job.status === 'scheduled');
      case 'completed':
        return jobs.filter(job => job.status === 'completed');
      case 'failed':
        return jobs.filter(job => job.status === 'failed');
      default:
        return jobs;
    }
  };
  
  const filteredJobs = getFilteredJobs();
  
  return (
    <div className="p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold">ETL Jobs Dashboard</h2>
        <div className="flex items-center space-x-2">
          <Button variant="outline" size="sm" className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-1" />
            Refresh Data
          </Button>
          <Button size="sm" className="flex items-center">
            <Play className="h-4 w-4 mr-1" />
            New Job
          </Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-blue-100 p-2 rounded-full">
              <RefreshCw className="h-5 w-5 text-blue-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Running Jobs</p>
              <p className="text-xl font-bold">
                {jobs.filter(job => job.status === 'running').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-green-100 p-2 rounded-full">
              <CheckCircle className="h-5 w-5 text-green-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Completed Jobs</p>
              <p className="text-xl font-bold">
                {jobs.filter(job => job.status === 'completed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-red-100 p-2 rounded-full">
              <AlertTriangle className="h-5 w-5 text-red-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Failed Jobs</p>
              <p className="text-xl font-bold">
                {jobs.filter(job => job.status === 'failed').length}
              </p>
            </div>
          </div>
        </Card>
        
        <Card className="p-4">
          <div className="flex items-center space-x-2">
            <div className="bg-yellow-100 p-2 rounded-full">
              <Clock className="h-5 w-5 text-yellow-600" />
            </div>
            <div>
              <p className="text-sm text-gray-500">Scheduled Jobs</p>
              <p className="text-xl font-bold">
                {jobs.filter(job => job.status === 'scheduled').length}
              </p>
            </div>
          </div>
        </Card>
      </div>
      
      <Tabs defaultValue="running" onValueChange={setActiveTab}>
        <TabsList className="mb-4">
          <TabsTrigger value="running" className="flex items-center">
            <RefreshCw className="h-4 w-4 mr-1" />
            Running
          </TabsTrigger>
          <TabsTrigger value="scheduled" className="flex items-center">
            <Clock className="h-4 w-4 mr-1" />
            Scheduled
          </TabsTrigger>
          <TabsTrigger value="completed" className="flex items-center">
            <CheckCircle className="h-4 w-4 mr-1" />
            Completed
          </TabsTrigger>
          <TabsTrigger value="failed" className="flex items-center">
            <AlertTriangle className="h-4 w-4 mr-1" />
            Failed
          </TabsTrigger>
          <TabsTrigger value="all" className="flex items-center">
            <Database className="h-4 w-4 mr-1" />
            All Jobs
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="running" className="mt-0">
          {filteredJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No running jobs</p>
            </Card>
          ) : (
            filteredJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                metrics={jobMetrics[job.id] || null}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="scheduled" className="mt-0">
          {filteredJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No scheduled jobs</p>
            </Card>
          ) : (
            filteredJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                metrics={jobMetrics[job.id] || null}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="completed" className="mt-0">
          {filteredJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No completed jobs</p>
            </Card>
          ) : (
            filteredJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                metrics={jobMetrics[job.id] || null}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="failed" className="mt-0">
          {filteredJobs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No failed jobs</p>
            </Card>
          ) : (
            filteredJobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                metrics={jobMetrics[job.id] || null}
              />
            ))
          )}
        </TabsContent>
        
        <TabsContent value="all" className="mt-0">
          {jobs.length === 0 ? (
            <Card className="p-8 text-center">
              <p className="text-gray-500">No jobs found</p>
            </Card>
          ) : (
            jobs.map(job => (
              <JobCard 
                key={job.id} 
                job={job} 
                metrics={jobMetrics[job.id] || null}
              />
            ))
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}