import React, { useState } from 'react';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Database, 
  BarChart, 
  Calendar, 
  Clock,
  Play,
  Layers,
  Settings,
  AlertCircle
} from 'lucide-react';

// Import our ETLDashboard component
import ETLDashboard from '../components/ETLDashboard';

// This is a stub for our full ETL Management page
const ETLManagement: React.FC = () => {
  const [activeTab, setActiveTab] = useState('dashboard');

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader className="pb-3">
          <CardTitle>ETL Management System</CardTitle>
          <CardDescription>
            Comprehensive data pipeline management for property valuation
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="mb-6">
              <TabsTrigger value="dashboard" className="flex items-center">
                <BarChart className="h-4 w-4 mr-2" />
                Dashboard
              </TabsTrigger>
              <TabsTrigger value="jobs" className="flex items-center">
                <Play className="h-4 w-4 mr-2" />
                Jobs
              </TabsTrigger>
              <TabsTrigger value="datasources" className="flex items-center">
                <Database className="h-4 w-4 mr-2" />
                Data Sources
              </TabsTrigger>
              <TabsTrigger value="transforms" className="flex items-center">
                <Layers className="h-4 w-4 mr-2" />
                Transformations
              </TabsTrigger>
              <TabsTrigger value="schedules" className="flex items-center">
                <Calendar className="h-4 w-4 mr-2" />
                Schedules
              </TabsTrigger>
              <TabsTrigger value="monitoring" className="flex items-center">
                <AlertCircle className="h-4 w-4 mr-2" />
                Monitoring
              </TabsTrigger>
              <TabsTrigger value="settings" className="flex items-center">
                <Settings className="h-4 w-4 mr-2" />
                Settings
              </TabsTrigger>
            </TabsList>

            <TabsContent value="dashboard" className="mt-0">
              <ETLDashboard />
            </TabsContent>

            <TabsContent value="jobs" className="mt-0">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium mb-2">Job Management</h3>
                <p className="text-gray-500 mb-4">Create, configure, and manage data processing jobs</p>
                <div className="bg-blue-50 p-4 rounded-md inline-block">
                  <Clock className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p>This feature is under development</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="datasources" className="mt-0">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium mb-2">Data Source Management</h3>
                <p className="text-gray-500 mb-4">Configure connections to databases, APIs, and file systems</p>
                <div className="bg-blue-50 p-4 rounded-md inline-block">
                  <Database className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p>This feature is under development</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="transforms" className="mt-0">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium mb-2">Transformation Rules</h3>
                <p className="text-gray-500 mb-4">Define data transformations, mappings, and validations</p>
                <div className="bg-blue-50 p-4 rounded-md inline-block">
                  <Layers className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p>This feature is under development</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="schedules" className="mt-0">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium mb-2">Schedule Management</h3>
                <p className="text-gray-500 mb-4">Configure job execution schedules and dependencies</p>
                <div className="bg-blue-50 p-4 rounded-md inline-block">
                  <Calendar className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p>This feature is under development</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="monitoring" className="mt-0">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium mb-2">System Monitoring</h3>
                <p className="text-gray-500 mb-4">Monitor ETL system health, performance, and alerts</p>
                <div className="bg-blue-50 p-4 rounded-md inline-block">
                  <AlertCircle className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p>This feature is under development</p>
                </div>
              </div>
            </TabsContent>

            <TabsContent value="settings" className="mt-0">
              <div className="text-center p-8">
                <h3 className="text-lg font-medium mb-2">System Settings</h3>
                <p className="text-gray-500 mb-4">Configure global ETL system settings and preferences</p>
                <div className="bg-blue-50 p-4 rounded-md inline-block">
                  <Settings className="h-12 w-12 text-blue-500 mx-auto mb-2" />
                  <p>This feature is under development</p>
                </div>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default ETLManagement;