import React from 'react';
import { PageHeader } from '@/components/ui/page-header';
import { SchemaValidationTool } from '@/components/etl/SchemaValidationTool';
import { Separator } from '@/components/ui/separator';
import { SchemaName } from '@/services/etl/SchemaValidationService';

/**
 * Schema Validation Page
 * 
 * This page provides a UI for validating data against predefined schemas
 * as part of the ETL validation pipeline.
 */
export function SchemaValidationPage() {
  return (
    <div className="container py-6 space-y-6 max-w-7xl">
      <PageHeader
        heading="Schema Validation"
        description="Validate data against predefined schemas from the database"
      />
      
      <Separator />
      
      <div className="grid grid-cols-1 gap-6">
        <SchemaValidationTool />
      </div>
      
      <div className="mt-6 space-y-4">
        <h2 className="text-xl font-semibold">About Schema Validation</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-medium">What is Schema Validation?</h3>
            <p className="text-sm text-muted-foreground">
              Schema validation ensures that data conforms to a predefined structure before it enters your system.
              It helps identify data quality issues early in the ETL pipeline, preventing downstream errors and improving
              data consistency.
            </p>
          </div>
          
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-medium">Available Schemas</h3>
            <p className="text-sm text-muted-foreground">
              The following schemas are available for validation:
            </p>
            <ul className="text-sm list-disc list-inside space-y-1 mt-2">
              {Object.values(SchemaName).map((schema) => (
                <li key={schema}>{schema}</li>
              ))}
            </ul>
          </div>
          
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-medium">Benefits</h3>
            <ul className="text-sm list-disc list-inside space-y-1 mt-1">
              <li>Prevent invalid data from entering your system</li>
              <li>Identify data quality issues early in the ETL process</li>
              <li>Ensure data consistency across your application</li>
              <li>Improve data reliability and reduce downstream errors</li>
              <li>Validate external data before importing</li>
            </ul>
          </div>
          
          <div className="rounded-lg border p-4 space-y-2">
            <h3 className="font-medium">How to Use</h3>
            <ol className="text-sm list-decimal list-inside space-y-1 mt-1">
              <li>Select the schema that matches your data structure</li>
              <li>Paste your JSON data into the input field</li>
              <li>Configure validation options as needed</li>
              <li>Click "Validate" to check your data</li>
              <li>Review the validation results and address any issues</li>
            </ol>
          </div>
        </div>
      </div>
    </div>
  );
}