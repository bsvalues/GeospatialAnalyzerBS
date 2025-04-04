import React from 'react';
import ETLDashboard from '../components/etl/ETLDashboard';

const ETLManagementPage: React.FC = () => {
  return (
    <div className="container mx-auto px-4 py-6">
      <h1 className="text-2xl font-bold mb-6">ETL Management</h1>
      <div className="bg-white rounded-lg shadow-sm p-6">
        <ETLDashboard />
      </div>
    </div>
  );
};

export default ETLManagementPage;