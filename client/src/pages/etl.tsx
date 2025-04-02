import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  Gauge, 
  Cpu, 
  Code, 
  ListFilter
} from 'lucide-react';
import { ETLDashboard } from '../components/automation/ETLDashboard';
import { ETLDataSourceManager } from '../components/automation/ETLDataSourceManager';
import { ETLTransformationEditor } from '../components/automation/ETLTransformationEditor';
import { ETLOptimizationPanel } from '../components/automation/ETLOptimizationPanel';

export default function ETLPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className="container mx-auto py-6">
      <h1 className="text-3xl font-bold mb-8">ETL Optimization Pipeline</h1>
      
      <Card className="mb-6">
        <CardHeader className="pb-3">
          <CardTitle>Data Integration Hub</CardTitle>
          <CardDescription>
            Automated ETL processes with AI-powered optimization
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard" className="flex items-center">
                <Gauge className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="datasources" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Data Sources
              </TabsTrigger>
              <TabsTrigger value="transformations" className="flex items-center">
                <Code className="h-4 w-4 mr-2" />
                Transformations
              </TabsTrigger>
              <TabsTrigger value="optimization" className="flex items-center">
                <Cpu className="h-4 w-4 mr-2" />
                Optimization
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="mt-0">
              <ETLDashboard />
            </TabsContent>
            
            <TabsContent value="datasources" className="mt-0">
              <ETLDataSourceManager />
            </TabsContent>
            
            <TabsContent value="transformations" className="mt-0">
              <ETLTransformationEditor />
            </TabsContent>
            
            <TabsContent value="optimization" className="mt-0">
              <div className="p-6">
                <h2 className="text-2xl font-bold mb-4">ETL Optimization</h2>
                <p className="text-gray-600 mb-6">
                  AI-powered optimization suggestions for your ETL pipelines.
                  Select a job to see detailed optimization metrics and recommendations.
                </p>
                
                <ETLOptimizationPanel jobId="job-1" />
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}