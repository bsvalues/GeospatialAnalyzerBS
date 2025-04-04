import React, { useState, useEffect } from 'react';
import ETLDashboard from '../components/ETLDashboard';
import { initializeETL } from '../services/etl';

/**
 * ETL Management page
 */
const ETLManagement: React.FC = () => {
  const [isLoading, setIsLoading] = useState<boolean>(true);
  
  // Set page title and initialize ETL system
  useEffect(() => {
    document.title = "ETL Management - GeospatialAnalyzerBS";
    
    // Initialize ETL system if needed
    initializeETL();
    
    // Mark loading as complete
    setIsLoading(false);
  }, []);
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">ETL Management</h1>
        <p className="text-gray-600">
          Manage ETL jobs, data sources, and transformations for property data processing.
        </p>
      </div>
      
      {/* ETL Dashboard */}
      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <p>Initializing ETL system...</p>
        </div>
      ) : (
        <ETLDashboard />
      )}
    </div>
  );
};

export default ETLManagement;