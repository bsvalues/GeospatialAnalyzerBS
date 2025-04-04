import React, { useState, useEffect } from 'react';
import { 
  etlPipelineManager, 
  alertService, 
  Alert, 
  AlertType, 
  AlertSeverity, 
  SystemStatus, 
  JobStatus,
  DataSource,
  TransformationRule,
  ETLJob,
  JobRun
} from '../services/etl';

/**
 * ETL Dashboard Component
 * 
 * This component displays a dashboard for the ETL system, including:
 * - System status
 * - Recent alerts
 * - Job statistics
 * - Recent job runs
 */
const ETLDashboard: React.FC = () => {
  // State for system status
  const [systemStatus, setSystemStatus] = useState<SystemStatus>(etlPipelineManager.getSystemStatus());
  
  // State for alerts
  const [alerts, setAlerts] = useState<Alert[]>([]);
  
  // State for jobs
  const [jobs, setJobs] = useState<ETLJob[]>([]);
  const [jobRuns, setJobRuns] = useState<JobRun[]>([]);
  
  // State for data sources and transformation rules
  const [dataSources, setDataSources] = useState<DataSource[]>([]);
  const [transformationRules, setTransformationRules] = useState<TransformationRule[]>([]);
  
  // State for job stats
  const [jobStats, setJobStats] = useState<{
    total: number;
    active: number;
    inactive: number;
    byStatus: Record<JobStatus, number>;
  }>({
    total: 0,
    active: 0,
    inactive: 0,
    byStatus: {
      [JobStatus.CREATED]: 0,
      [JobStatus.SCHEDULED]: 0,
      [JobStatus.QUEUED]: 0,
      [JobStatus.RUNNING]: 0,
      [JobStatus.SUCCEEDED]: 0,
      [JobStatus.FAILED]: 0,
      [JobStatus.CANCELLED]: 0,
      [JobStatus.SKIPPED]: 0
    }
  });
  
  // State for selected tab
  const [selectedTab, setSelectedTab] = useState<
    'overview' | 'data-sources' | 'transformations' | 'jobs' | 'alerts'
  >('overview');
  
  // Update data on component mount and at regular intervals
  useEffect(() => {
    // Helper function to refresh data
    const refreshData = () => {
      setSystemStatus(etlPipelineManager.getSystemStatus());
      setAlerts(alertService.getAllAlerts().slice(0, 5)); // Get only 5 most recent alerts
      setJobs(etlPipelineManager.getAllJobs());
      setJobRuns(etlPipelineManager.getJobRuns().slice(0, 5)); // Get only 5 most recent job runs
      setDataSources(etlPipelineManager.getAllDataSources());
      setTransformationRules(etlPipelineManager.getAllTransformationRules());
      setJobStats(etlPipelineManager.getJobStats());
    };
    
    // Initial data load
    refreshData();
    
    // Subscribe to alert updates
    const alertListener = () => {
      setAlerts(alertService.getAllAlerts().slice(0, 5));
    };
    
    alertService.addListener(alertListener);
    
    // Set up interval for refreshing data
    const intervalId = setInterval(refreshData, 5000);
    
    // Cleanup
    return () => {
      clearInterval(intervalId);
      alertService.removeListener(alertListener);
    };
  }, []);
  
  // Helper function to format date
  const formatDate = (date: Date): string => {
    return new Date(date).toLocaleString();
  };
  
  // Helper function to format duration
  const formatDuration = (ms: number): string => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    const days = Math.floor(hours / 24);
    
    if (days > 0) {
      return `${days}d ${hours % 24}h`;
    } else if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };
  
  // Helper function to get alert type class
  const getAlertTypeClass = (type: AlertType): string => {
    switch (type) {
      case AlertType.SUCCESS:
        return 'bg-green-100 text-green-800';
      case AlertType.ERROR:
        return 'bg-red-100 text-red-800';
      case AlertType.WARNING:
        return 'bg-yellow-100 text-yellow-800';
      case AlertType.INFO:
      default:
        return 'bg-blue-100 text-blue-800';
    }
  };
  
  // Helper function to get job status class
  const getJobStatusClass = (status: JobStatus): string => {
    switch (status) {
      case JobStatus.CREATED:
        return 'bg-gray-200 text-gray-800';
      case JobStatus.SCHEDULED:
        return 'bg-blue-100 text-blue-800';
      case JobStatus.QUEUED:
        return 'bg-purple-100 text-purple-800';
      case JobStatus.RUNNING:
        return 'bg-yellow-100 text-yellow-800';
      case JobStatus.SUCCEEDED:
        return 'bg-green-100 text-green-800';
      case JobStatus.FAILED:
        return 'bg-red-100 text-red-800';
      case JobStatus.CANCELLED:
        return 'bg-orange-100 text-orange-800';
      case JobStatus.SKIPPED:
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };
  
  // Render system overview
  const renderOverview = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
      {/* System Status Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium text-gray-700 mb-2">System Status</h3>
        <div className="flex items-center mb-2">
          <div className={`w-3 h-3 rounded-full mr-2 ${systemStatus.running ? 'bg-green-500' : 'bg-red-500'}`}></div>
          <span>{systemStatus.running ? 'Running' : 'Stopped'}</span>
        </div>
        <div className="text-sm text-gray-600">
          <div>Uptime: {formatDuration(systemStatus.uptime)}</div>
          <div>Active Jobs: {systemStatus.activeJobs}</div>
          <div>Pending Jobs: {systemStatus.pendingJobs}</div>
        </div>
      </div>
      
      {/* Job Stats Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium text-gray-700 mb-2">Job Statistics</h3>
        <div className="text-sm text-gray-600">
          <div>Total Jobs: {jobStats.total}</div>
          <div>Active Jobs: {jobStats.active}</div>
          <div>Inactive Jobs: {jobStats.inactive}</div>
        </div>
        <div className="mt-2">
          <div className="flex items-center text-xs">
            <div className="w-16">Created:</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-gray-500 h-2 rounded-full" 
                style={{ width: `${(jobStats.byStatus[JobStatus.CREATED] / jobStats.total) * 100}%` }}
              ></div>
            </div>
            <div className="ml-2">{jobStats.byStatus[JobStatus.CREATED]}</div>
          </div>
          <div className="flex items-center text-xs mt-1">
            <div className="w-16">Scheduled:</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-blue-500 h-2 rounded-full" 
                style={{ width: `${(jobStats.byStatus[JobStatus.SCHEDULED] / jobStats.total) * 100}%` }}
              ></div>
            </div>
            <div className="ml-2">{jobStats.byStatus[JobStatus.SCHEDULED]}</div>
          </div>
          <div className="flex items-center text-xs mt-1">
            <div className="w-16">Running:</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-yellow-500 h-2 rounded-full" 
                style={{ width: `${(jobStats.byStatus[JobStatus.RUNNING] / jobStats.total) * 100}%` }}
              ></div>
            </div>
            <div className="ml-2">{jobStats.byStatus[JobStatus.RUNNING]}</div>
          </div>
          <div className="flex items-center text-xs mt-1">
            <div className="w-16">Succeeded:</div>
            <div className="flex-1 bg-gray-200 rounded-full h-2">
              <div 
                className="bg-green-500 h-2 rounded-full" 
                style={{ width: `${(jobStats.byStatus[JobStatus.SUCCEEDED] / jobStats.total) * 100}%` }}
              ></div>
            </div>
            <div className="ml-2">{jobStats.byStatus[JobStatus.SUCCEEDED]}</div>
          </div>
        </div>
      </div>
      
      {/* Data Sources Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium text-gray-700 mb-2">Data Sources</h3>
        <div className="text-sm text-gray-600">
          <div>Total Sources: {dataSources.length}</div>
          <div>Active Sources: {dataSources.filter(ds => ds.enabled).length}</div>
          <div>
            Types: {
              Object.entries(
                dataSources.reduce((acc, ds) => {
                  acc[ds.type] = (acc[ds.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => `${type} (${count})`).join(', ')
            }
          </div>
        </div>
      </div>
      
      {/* Transformation Rules Card */}
      <div className="bg-white p-4 rounded-lg shadow">
        <h3 className="font-medium text-gray-700 mb-2">Transformation Rules</h3>
        <div className="text-sm text-gray-600">
          <div>Total Rules: {transformationRules.length}</div>
          <div>Active Rules: {transformationRules.filter(rule => rule.enabled).length}</div>
          <div>
            Types: {
              Object.entries(
                transformationRules.reduce((acc, rule) => {
                  acc[rule.type] = (acc[rule.type] || 0) + 1;
                  return acc;
                }, {} as Record<string, number>)
              ).map(([type, count]) => `${type} (${count})`).join(', ')
            }
          </div>
        </div>
      </div>
    </div>
  );
  
  // Render recent alerts
  const renderAlerts = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">Recent Alerts</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {alerts.length === 0 ? (
          <div className="px-4 py-3 text-gray-500 text-sm">No alerts found</div>
        ) : (
          alerts.map(alert => (
            <div key={alert.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className={`px-2 py-1 text-xs rounded-full ${getAlertTypeClass(alert.type)}`}>
                  {AlertType[alert.type]}
                </span>
                <span className="text-xs text-gray-500">
                  {formatDate(alert.timestamp)}
                </span>
              </div>
              <div className="font-medium mt-1">{alert.title}</div>
              <div className="text-sm text-gray-600">{alert.message}</div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  
  // Render job runs
  const renderJobRuns = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">Recent Job Runs</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {jobRuns.length === 0 ? (
          <div className="px-4 py-3 text-gray-500 text-sm">No job runs found</div>
        ) : (
          jobRuns.map(run => {
            const job = jobs.find(j => j.id === run.jobId);
            return (
              <div key={run.id} className="px-4 py-3">
                <div className="flex items-center justify-between">
                  <span className="font-medium">{job?.name || `Job #${run.jobId}`}</span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getJobStatusClass(run.status)}`}>
                    {JobStatus[run.status]}
                  </span>
                </div>
                <div className="flex items-center justify-between mt-1 text-sm">
                  <span className="text-gray-600">
                    {run.isManual ? 'Manual Execution' : 'Scheduled Execution'}
                  </span>
                  <span className="text-gray-500">
                    {formatDate(run.startTime)}
                  </span>
                </div>
                <div className="text-sm text-gray-600 mt-1">
                  <span>Duration: {formatDuration(run.executionTime)}</span>
                  {run.error && (
                    <span className="text-red-600 ml-4">Error: {run.error}</span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1">
                  <span>Records: {run.recordCounts.extracted} extracted, {run.recordCounts.transformed} transformed, {run.recordCounts.loaded} loaded</span>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
  
  // Render data sources
  const renderDataSources = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">Data Sources</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {dataSources.length === 0 ? (
          <div className="px-4 py-3 text-gray-500 text-sm">No data sources found</div>
        ) : (
          dataSources.map(source => (
            <div key={source.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{source.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${source.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {source.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">{source.description}</div>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded-full">{source.type}</span>
                <span className="ml-2">ID: {source.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  
  // Render transformation rules
  const renderTransformationRules = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">Transformation Rules</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {transformationRules.length === 0 ? (
          <div className="px-4 py-3 text-gray-500 text-sm">No transformation rules found</div>
        ) : (
          transformationRules.map(rule => (
            <div key={rule.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{rule.name}</span>
                <span className={`px-2 py-1 text-xs rounded-full ${rule.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {rule.enabled ? 'Enabled' : 'Disabled'}
                </span>
              </div>
              <div className="text-sm text-gray-600 mt-1">{rule.description}</div>
              <div className="flex items-center mt-1 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded-full">{rule.type}</span>
                <span className="ml-2">Order: {rule.order}</span>
                <span className="ml-2">ID: {rule.id}</span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  
  // Render jobs
  const renderJobs = () => (
    <div className="bg-white rounded-lg shadow overflow-hidden mb-6">
      <div className="px-4 py-3 border-b border-gray-200">
        <h3 className="font-medium text-gray-700">ETL Jobs</h3>
      </div>
      <div className="divide-y divide-gray-200">
        {jobs.length === 0 ? (
          <div className="px-4 py-3 text-gray-500 text-sm">No jobs found</div>
        ) : (
          jobs.map(job => (
            <div key={job.id} className="px-4 py-3">
              <div className="flex items-center justify-between">
                <span className="font-medium">{job.name}</span>
                <div className="flex space-x-2">
                  <span className={`px-2 py-1 text-xs rounded-full ${job.enabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {job.enabled ? 'Enabled' : 'Disabled'}
                  </span>
                  <span className={`px-2 py-1 text-xs rounded-full ${getJobStatusClass(job.status)}`}>
                    {JobStatus[job.status]}
                  </span>
                </div>
              </div>
              <div className="text-sm text-gray-600 mt-1">{job.description}</div>
              <div className="flex flex-wrap items-center mt-1 text-xs text-gray-500">
                <span className="px-2 py-1 bg-gray-100 rounded-full mr-2 mb-1">ID: {job.id}</span>
                <span className="px-2 py-1 bg-gray-100 rounded-full mr-2 mb-1">Frequency: {job.frequency}</span>
                {job.nextRunAt && (
                  <span className="px-2 py-1 bg-gray-100 rounded-full mr-2 mb-1">
                    Next Run: {formatDate(job.nextRunAt)}
                  </span>
                )}
                {job.lastRunAt && (
                  <span className="px-2 py-1 bg-gray-100 rounded-full mr-2 mb-1">
                    Last Run: {formatDate(job.lastRunAt)}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap mt-2">
                <div className="w-full sm:w-1/2 text-xs">
                  <span className="text-gray-500">Sources:</span>
                  <div className="flex flex-wrap mt-1">
                    {job.sources.map(sourceId => {
                      const source = dataSources.find(ds => ds.id === sourceId);
                      return (
                        <span key={sourceId} className="px-2 py-1 bg-blue-50 text-blue-800 rounded mr-1 mb-1">
                          {source?.name || `Source #${sourceId}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
                <div className="w-full sm:w-1/2 text-xs mt-2 sm:mt-0">
                  <span className="text-gray-500">Destinations:</span>
                  <div className="flex flex-wrap mt-1">
                    {job.destinations.map(destId => {
                      const dest = dataSources.find(ds => ds.id === destId);
                      return (
                        <span key={destId} className="px-2 py-1 bg-green-50 text-green-800 rounded mr-1 mb-1">
                          {dest?.name || `Destination #${destId}`}
                        </span>
                      );
                    })}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
  
  // Render tabs
  const renderTabs = () => (
    <div className="border-b border-gray-200 mb-6">
      <nav className="-mb-px flex space-x-8">
        <button
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            selectedTab === 'overview'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setSelectedTab('overview')}
        >
          Overview
        </button>
        <button
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            selectedTab === 'jobs'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setSelectedTab('jobs')}
        >
          Jobs
        </button>
        <button
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            selectedTab === 'data-sources'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setSelectedTab('data-sources')}
        >
          Data Sources
        </button>
        <button
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            selectedTab === 'transformations'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setSelectedTab('transformations')}
        >
          Transformations
        </button>
        <button
          className={`py-4 px-1 border-b-2 font-medium text-sm ${
            selectedTab === 'alerts'
              ? 'border-blue-500 text-blue-600'
              : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
          }`}
          onClick={() => setSelectedTab('alerts')}
        >
          Alerts
        </button>
      </nav>
    </div>
  );
  
  // Render tab content
  const renderTabContent = () => {
    switch (selectedTab) {
      case 'overview':
        return (
          <>
            {renderOverview()}
            {renderJobRuns()}
            {renderAlerts()}
          </>
        );
      case 'jobs':
        return renderJobs();
      case 'data-sources':
        return renderDataSources();
      case 'transformations':
        return renderTransformationRules();
      case 'alerts':
        return renderAlerts();
      default:
        return null;
    }
  };
  
  return (
    <div>
      {renderTabs()}
      {renderTabContent()}
    </div>
  );
};

export default ETLDashboard;