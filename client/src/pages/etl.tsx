import React from 'react';
import ETLManager from '../components/automation/ETLManager';

export default function ETLPage() {
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-6">ETL Management</h1>
      <ETLManager />
    </div>
  );
}