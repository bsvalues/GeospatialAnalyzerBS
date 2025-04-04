/**
 * ETLManagement.tsx
 * 
 * Main page for ETL management system
 */

import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Database, FileUp, GitBranch, BarChart4, History, Play, Plus, Settings, Trash2 } from 'lucide-react';
import ETLDashboard from '../components/etl/ETLDashboard';
import DataSourceManager from '../components/etl/DataSourceManager';
import TransformationRuleManager from '../components/etl/TransformationRuleManager';
import ETLJobManager from '../components/etl/ETLJobManager';
import ETLMonitoring from '../components/etl/ETLMonitoring';

const ETLManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="container mx-auto py-6">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">ETL Management</h1>
          <p className="text-muted-foreground">
            Extract, Transform, Load data pipeline management
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </Button>
          <Button>
            <Plus className="h-4 w-4 mr-2" />
            New Job
          </Button>
        </div>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid grid-cols-5 w-full mb-6">
          <TabsTrigger value="dashboard" className="flex items-center">
            <BarChart4 className="h-4 w-4 mr-2" />
            Dashboard
          </TabsTrigger>
          <TabsTrigger value="sources" className="flex items-center">
            <Database className="h-4 w-4 mr-2" />
            Data Sources
          </TabsTrigger>
          <TabsTrigger value="transformations" className="flex items-center">
            <GitBranch className="h-4 w-4 mr-2" />
            Transformations
          </TabsTrigger>
          <TabsTrigger value="jobs" className="flex items-center">
            <Play className="h-4 w-4 mr-2" />
            Jobs
          </TabsTrigger>
          <TabsTrigger value="monitoring" className="flex items-center">
            <History className="h-4 w-4 mr-2" />
            Monitoring
          </TabsTrigger>
        </TabsList>

        <TabsContent value="dashboard" className="space-y-4">
          <ETLDashboard />
        </TabsContent>

        <TabsContent value="sources" className="space-y-4">
          <DataSourceManager />
        </TabsContent>

        <TabsContent value="transformations" className="space-y-4">
          <TransformationRuleManager />
        </TabsContent>

        <TabsContent value="jobs" className="space-y-4">
          <ETLJobManager />
        </TabsContent>

        <TabsContent value="monitoring" className="space-y-4">
          <ETLMonitoring />
        </TabsContent>
      </Tabs>
    </div>
  );
};

export default ETLManagement;