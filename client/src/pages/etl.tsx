import React from 'react';
import ETLManager from '../components/automation/ETLManager';

const ETLPage: React.FC = () => {
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">ETL Automation</h1>
      <p className="text-muted-foreground">
        Manage automated data extraction, transformation, and loading processes for GeospatialAnalyzerBS.
      </p>
      
      <ETLManager />
    </div>
  );
};

export default ETLPage;