import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import ScriptingPlayground from '@/components/scripting/ScriptingPlayground';
import { Property } from '@shared/schema';
import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';

const ScriptingPage: React.FC = () => {
  const [scriptResults, setScriptResults] = useState<any>(null);

  // Fetch property data to use in the scripts
  const { data: properties, isLoading, isError } = useQuery({
    queryKey: ['/api/properties'],
    retry: 1
  });

  const handleScriptResult = (result: any) => {
    setScriptResults(result);
  };

  // Visualize script results if available
  const renderVisualization = () => {
    if (!scriptResults) return null;

    return (
      <Card className="mt-8">
        <CardHeader>
          <CardTitle>Script Result Visualization</CardTitle>
          <CardDescription>Visual representation of the script output</CardDescription>
        </CardHeader>
        <CardContent>
          {/* This area would display charts or maps based on script results */}
          <div className="p-4 bg-muted rounded-md text-center">
            <p>Visualization features coming soon!</p>
            <p className="text-sm text-muted-foreground mt-2">
              Results data is available in the Results tab of the scripting playground
            </p>
          </div>
        </CardContent>
      </Card>
    );
  };

  return (
    <div className="container mx-auto p-6 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-3xl font-bold tracking-tight">Interactive Scripting Playground</h1>
        <p className="text-muted-foreground mt-2">
          Write custom scripts to analyze and visualize property data using our interactive environment
        </p>
      </div>

      {isLoading ? (
        <div className="flex justify-center items-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <span className="ml-3 text-lg">Loading property data...</span>
        </div>
      ) : isError ? (
        <div className="p-6 text-center text-red-500 bg-red-50 rounded-md">
          <p>Error loading property data. Please try refreshing the page.</p>
        </div>
      ) : (
        <>
          <ScriptingPlayground 
            properties={properties as Property[]} 
            onScriptResult={handleScriptResult} 
          />
          
          {renderVisualization()}
          
          <div className="mt-8 text-sm text-muted-foreground">
            <p className="mb-2">
              <strong>Note:</strong> The scripting playground is a powerful tool that allows you to analyze property data
              with custom JavaScript code. All scripts are executed in your browser and have access only to the data provided.
            </p>
            <p>
              For best results, keep scripts concise and focused on specific analytical tasks.
              Results can be used to generate reports or visualize trends in the property dataset.
            </p>
          </div>
        </>
      )}
    </div>
  );
};

export default ScriptingPage;