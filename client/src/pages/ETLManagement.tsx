import React, { useEffect } from 'react';
import ETLDashboard from '../components/ETLDashboard';
import { etlPipelineManager } from '../services/etl';

/**
 * ETL Management Page
 * 
 * This page displays the ETL management interface with a dashboard,
 * data source management, transformation rule management, and job management.
 */
const ETLManagement: React.FC = () => {
  // Initialize ETL system on component mount
  useEffect(() => {
    // Initialize the ETL pipeline manager
    if (!etlPipelineManager.getSystemStatus().initialized) {
      etlPipelineManager.initialize();
    }
    
    // Clean up on component unmount
    return () => {
      // Optionally shutdown the ETL pipeline manager
      // Note: In a real app, you might want to keep it running in the background
      // etlPipelineManager.shutdown();
    };
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-3xl font-bold mb-6">ETL Data Management</h1>
      
      <div className="mb-8">
        <p className="text-gray-700 mb-4">
          Manage your data sources, transformation rules, and ETL jobs from this central dashboard.
          Monitor job executions, view alerts, and analyze data quality.
        </p>
      </div>
      
      {/* ETL Dashboard */}
      <div className="mb-8">
        <ETLDashboard />
      </div>
      
      {/* Additional sections could be added here:
          - Data Source Management
          - Transformation Rule Management
          - Job Management
          - Data Quality Reports
      */}
    </div>
  );
};

export default ETLManagement;