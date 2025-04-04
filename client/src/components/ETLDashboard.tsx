import React, { useState, useEffect } from 'react';
import {
  etlPipelineManager,
  dataConnector,
  alertService,
  JobStatus,
  DataSourceType,
  FilterLogic,
  FilterOperator,
  TransformationType,
  AlertType,
  AlertSeverity,
  AlertCategory
} from '../services/etl';

const ETLDashboard: React.FC = () => {
  const [initialized, setInitialized] = useState(false);
  const [message, setMessage] = useState('Initializing ETL system...');
  const [systemStatus, setSystemStatus] = useState<any>(null);
  const [alertStats, setAlertStats] = useState<any>(null);
  const [jobs, setJobs] = useState<any[]>([]);
  const [dataSources, setDataSources] = useState<any[]>([]);
  
  useEffect(() => {
    // Initialize the ETL system when the component mounts
    const initializeETL = async () => {
      try {
        setMessage('Setting up sample data...');
        
        // Create sample data sources
        const sampleDataSources = [
          {
            id: 1,
            name: 'Property Database',
            description: 'Main property database',
            type: DataSourceType.MEMORY,
            config: {
              data: [
                { id: 1, address: '123 Main St', price: 250000, sqft: 1800, bedrooms: 3, bathrooms: 2, yearBuilt: 1985 },
                { id: 2, address: '456 Oak Ave', price: 320000, sqft: 2200, bedrooms: 4, bathrooms: 2.5, yearBuilt: 1992 },
                { id: 3, address: '789 Pine Rd', price: 180000, sqft: 1500, bedrooms: 2, bathrooms: 1, yearBuilt: 1975 },
                { id: 4, address: '101 Cedar Ln', price: 420000, sqft: 2800, bedrooms: 4, bathrooms: 3, yearBuilt: 2005 },
                { id: 5, address: '202 Elm St', price: 275000, sqft: 1950, bedrooms: 3, bathrooms: 2, yearBuilt: 1988 },
              ]
            },
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            name: 'Property Analytics Store',
            description: 'Destination for transformed property data',
            type: DataSourceType.MEMORY,
            config: {
              data: []
            },
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        // Create sample transformation rules
        const sampleTransformationRules = [
          {
            id: 1,
            name: 'Filter Recent Properties',
            description: 'Filter properties built after 1980',
            type: TransformationType.FILTER,
            config: {
              filter: {
                logic: FilterLogic.AND,
                conditions: [
                  {
                    field: 'yearBuilt',
                    operator: FilterOperator.GREATER_THAN,
                    value: 1980
                  }
                ]
              }
            },
            enabled: true,
            order: 1,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 2,
            name: 'Calculate Price per Sqft',
            description: 'Add price per square foot field',
            type: TransformationType.MAP,
            config: {
              mappings: [
                { source: 'id', target: 'id' },
                { source: 'address', target: 'address' },
                { source: 'price', target: 'price' },
                { source: 'sqft', target: 'sqft' },
                { source: 'bedrooms', target: 'bedrooms' },
                { source: 'bathrooms', target: 'bathrooms' },
                { source: 'yearBuilt', target: 'yearBuilt' }
              ],
              includeOriginal: true
            },
            enabled: true,
            order: 2,
            createdAt: new Date(),
            updatedAt: new Date()
          },
          {
            id: 3,
            name: 'Add Price Category',
            description: 'Add price category field',
            type: TransformationType.MAP,
            config: {
              mappings: [
                {
                  source: 'price',
                  target: 'priceCategory',
                  transform: 'custom'  // Custom transform that would be implemented in a real application
                }
              ],
              includeOriginal: true
            },
            enabled: true,
            order: 3,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        // Create sample ETL jobs
        const sampleJobs = [
          {
            id: 1,
            name: 'Property Data Transformation',
            description: 'Transform property data for analytics',
            sources: [1],  // Property Database
            destinations: [2],  // Property Analytics Store
            rules: [1, 2, 3],  // All transformation rules
            status: JobStatus.CREATED,
            enabled: true,
            createdAt: new Date(),
            updatedAt: new Date()
          }
        ];
        
        // Initialize the ETL pipeline manager with the sample data
        setMessage('Initializing ETL pipeline manager...');
        await etlPipelineManager.initialize(sampleJobs, sampleDataSources, sampleTransformationRules);
        
        // Get the system status
        setSystemStatus(etlPipelineManager.getSystemStatus());
        
        // Get alert stats
        setAlertStats(alertService.getAlertStats());
        
        // Get jobs and data sources
        setJobs(etlPipelineManager.getAllJobs());
        setDataSources(etlPipelineManager.getAllDataSources());
        
        // Create a sample alert
        alertService.createAlert({
          type: AlertType.INFO,
          severity: AlertSeverity.LOW,
          category: AlertCategory.SYSTEM,
          title: 'ETL System Initialized',
          message: 'The ETL system has been initialized with sample data'
        });
        
        setMessage('ETL system initialized successfully.');
        setInitialized(true);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        setMessage(`Error initializing ETL system: ${errorMessage}`);
      }
    };
    
    initializeETL();
    
    // Clean up when component unmounts
    return () => {
      etlPipelineManager.shutdown();
    };
  }, []);
  
  // Execute a job
  const executeJob = async (jobId: number) => {
    try {
      setMessage(`Executing job ${jobId}...`);
      const jobRun = await etlPipelineManager.executeJob(jobId);
      setMessage(`Job ${jobId} execution completed with status: ${jobRun.status}`);
      
      // Refresh the system status
      setSystemStatus(etlPipelineManager.getSystemStatus());
      setAlertStats(alertService.getAlertStats());
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Error executing job: ${errorMessage}`);
    }
  };
  
  // Test a data source connection
  const testConnection = async (dataSourceId: number) => {
    try {
      setMessage(`Testing connection to data source ${dataSourceId}...`);
      const success = await etlPipelineManager.testDataSourceConnection(dataSourceId);
      setMessage(`Connection test ${success ? 'succeeded' : 'failed'}`);
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : String(error);
      setMessage(`Error testing connection: ${errorMessage}`);
    }
  };
  
  return (
    <div className="p-5">
      <h1 className="text-2xl font-bold mb-4">ETL Management Dashboard</h1>
      
      <div className="bg-yellow-50 p-4 mb-4 rounded border border-yellow-200">
        <p className="text-yellow-800"><strong>Note:</strong> This is a demo of the ETL system with simulated data. 
        In a real application, this would connect to actual data sources and perform real transformations.</p>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">System Status</h2>
        <div className="p-4 bg-white rounded shadow-sm">
          <p className="mb-2 text-gray-600">{message}</p>
          
          {systemStatus && (
            <div className="grid grid-cols-4 gap-4 mt-4">
              <div className="bg-blue-50 p-3 rounded border border-blue-100">
                <p className="text-sm text-gray-500">Total Jobs</p>
                <p className="text-xl font-bold">{systemStatus.jobCount}</p>
              </div>
              <div className="bg-green-50 p-3 rounded border border-green-100">
                <p className="text-sm text-gray-500">Data Sources</p>
                <p className="text-xl font-bold">{systemStatus.dataSourceCount}</p>
              </div>
              <div className="bg-purple-50 p-3 rounded border border-purple-100">
                <p className="text-sm text-gray-500">Transformation Rules</p>
                <p className="text-xl font-bold">{systemStatus.transformationRuleCount}</p>
              </div>
              <div className="bg-red-50 p-3 rounded border border-red-100">
                <p className="text-sm text-gray-500">Active Jobs</p>
                <p className="text-xl font-bold">{systemStatus.activeJobsCount}</p>
              </div>
            </div>
          )}
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div>
          <h2 className="text-xl font-semibold mb-2">ETL Jobs</h2>
          {jobs.length === 0 ? (
            <p className="text-gray-500">No jobs available</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {jobs.map(job => (
                    <tr key={job.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{job.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{job.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <span className={`px-2 py-1 text-xs rounded-full ${
                          job.status === JobStatus.SUCCEEDED ? 'bg-green-100 text-green-800' :
                          job.status === JobStatus.FAILED ? 'bg-red-100 text-red-800' :
                          job.status === JobStatus.RUNNING ? 'bg-blue-100 text-blue-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {job.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button 
                          onClick={() => executeJob(job.id)}
                          className="bg-blue-500 hover:bg-blue-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Execute
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div>
          <h2 className="text-xl font-semibold mb-2">Data Sources</h2>
          {dataSources.length === 0 ? (
            <p className="text-gray-500">No data sources available</p>
          ) : (
            <div className="overflow-hidden rounded-lg border border-gray-200">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {dataSources.map(source => (
                    <tr key={source.id}>
                      <td className="px-4 py-3 whitespace-nowrap">{source.id}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{source.name}</td>
                      <td className="px-4 py-3 whitespace-nowrap">{source.type}</td>
                      <td className="px-4 py-3 whitespace-nowrap">
                        <button 
                          onClick={() => testConnection(source.id)}
                          className="bg-green-500 hover:bg-green-600 text-white px-3 py-1 rounded text-sm"
                        >
                          Test Connection
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">Alerts</h2>
        {!alertStats ? (
          <p className="text-gray-500">No alert statistics available</p>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-medium text-gray-700 mb-2">By Severity</h3>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span className="text-green-600">Low:</span>
                  <span className="font-medium">{alertStats.bySeverity.LOW || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-yellow-600">Medium:</span>
                  <span className="font-medium">{alertStats.bySeverity.MEDIUM || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-orange-600">High:</span>
                  <span className="font-medium">{alertStats.bySeverity.HIGH || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-red-600">Critical:</span>
                  <span className="font-medium">{alertStats.bySeverity.CRITICAL || 0}</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-medium text-gray-700 mb-2">By Type</h3>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span className="text-blue-600">Info:</span>
                  <span className="font-medium">{alertStats.byType.INFO || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-green-600">Success:</span>
                  <span className="font-medium">{alertStats.byType.SUCCESS || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-yellow-600">Warning:</span>
                  <span className="font-medium">{alertStats.byType.WARNING || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-red-600">Error:</span>
                  <span className="font-medium">{alertStats.byType.ERROR || 0}</span>
                </li>
              </ul>
            </div>
            
            <div className="bg-white p-4 rounded shadow-sm">
              <h3 className="font-medium text-gray-700 mb-2">By State</h3>
              <ul className="space-y-1">
                <li className="flex justify-between">
                  <span className="text-blue-600">New:</span>
                  <span className="font-medium">{alertStats.byState.NEW || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-purple-600">Acknowledged:</span>
                  <span className="font-medium">{alertStats.byState.ACKNOWLEDGED || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-green-600">Resolved:</span>
                  <span className="font-medium">{alertStats.byState.RESOLVED || 0}</span>
                </li>
                <li className="flex justify-between">
                  <span className="text-gray-600">Closed:</span>
                  <span className="font-medium">{alertStats.byState.CLOSED || 0}</span>
                </li>
              </ul>
            </div>
          </div>
        )}
      </div>
      
      <div className="mb-6">
        <h2 className="text-xl font-semibold mb-2">What This Demonstrates</h2>
        <div className="bg-white p-4 rounded shadow-sm">
          <ul className="list-disc list-inside space-y-2 text-gray-700">
            <li>ETL Pipeline Management: Managing and executing data pipelines</li>
            <li>Data Source Connectivity: Testing and managing connections to data sources</li>
            <li>Transformation Rules: Applying business logic to transform data</li>
            <li>Data Quality Analysis: Checking and validating data quality</li>
            <li>Alerting System: Monitoring and notification of ETL events</li>
            <li>Scheduling: Managing job execution timing and frequency</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ETLDashboard;