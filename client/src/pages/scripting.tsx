import React, { useState, useEffect } from 'react';
import ScriptingPlayground from '../components/scripting/ScriptingPlayground';
import { Property } from '@shared/schema';
import { useToast } from '@/hooks/use-toast';

const ScriptingPage: React.FC = () => {
  const [properties, setProperties] = useState<Property[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();
  
  // Load property data
  useEffect(() => {
    fetch('/api/properties')
      .then(response => {
        if (!response.ok) {
          throw new Error('Failed to fetch properties');
        }
        return response.json();
      })
      .then(data => {
        setProperties(data);
        setLoading(false);
      })
      .catch(error => {
        console.error('Error fetching properties:', error);
        toast({
          title: 'Error',
          description: 'Failed to load property data for scripting.',
          variant: 'destructive'
        });
        setLoading(false);
      });
  }, [toast]);
  
  // Handle script execution results
  const handleScriptResult = (result: any) => {
    console.log('Script execution result:', result);
    // You can do additional processing of results here if needed
  };
  
  return (
    <div className="container mx-auto py-6 space-y-8">
      <h1 className="text-3xl font-bold tracking-tight">Scripting Playground</h1>
      <p className="text-muted-foreground">
        Write and execute custom JavaScript code to analyze property data and ETL processing results.
      </p>
      
      {loading ? (
        <div className="flex justify-center py-8">
          <div className="animate-pulse">Loading property data...</div>
        </div>
      ) : (
        <ScriptingPlayground 
          properties={properties} 
          onScriptResult={handleScriptResult} 
        />
      )}
    </div>
  );
};

export default ScriptingPage;