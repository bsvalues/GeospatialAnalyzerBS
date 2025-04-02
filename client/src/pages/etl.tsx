import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ETLDashboard } from '../components/automation/ETLDashboard';
import { ETLDataSourceManager } from '../components/automation/ETLDataSourceManager';
import { ETLTransformationEditor } from '../components/automation/ETLTransformationEditor';
import { BadgeCheck, Server, Database, Code, Settings, Workflow, FileText, ChevronDown, ChevronRight, Command, Calculator, Building, File, Map } from 'lucide-react';

/**
 * ETL Page Component
 */
export default function ETLPage() {
  const [activeTab, setActiveTab] = useState('dashboard');
  
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex flex-col space-y-6">
        <div>
          <h1 className="text-3xl font-bold">ETL Automation Center</h1>
          <p className="text-gray-500 mt-1">
            Manage, monitor, and optimize your Extract, Transform, Load processes
          </p>
        </div>
        
        <Card className="p-4 md:p-6">
          <Tabs defaultValue="dashboard" onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid grid-cols-3 mb-6">
              <TabsTrigger value="dashboard" className="flex items-center justify-center">
                <Server className="h-4 w-4 mr-2" />
                Jobs Dashboard
              </TabsTrigger>
              <TabsTrigger value="data-sources" className="flex items-center justify-center">
                <Database className="h-4 w-4 mr-2" />
                Data Sources
              </TabsTrigger>
              <TabsTrigger value="transformations" className="flex items-center justify-center">
                <Code className="h-4 w-4 mr-2" />
                Transformations
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="dashboard" className="mt-0">
              <ETLDashboard />
            </TabsContent>
            
            <TabsContent value="data-sources" className="mt-0">
              <ETLDataSourceManager />
            </TabsContent>
            
            <TabsContent value="transformations" className="mt-0">
              <ETLTransformationEditor />
            </TabsContent>
          </Tabs>
        </Card>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Card className="p-4 md:p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <BadgeCheck className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold">ETL Best Practices</h3>
              </div>
              <p className="text-gray-600 text-sm">
                Follow these recommendations to optimize your ETL processes:
              </p>
              <ul className="space-y-2 text-sm">
                <li className="flex items-start">
                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                  <span>Use incremental loads where possible to reduce processing time</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                  <span>Schedule jobs during off-peak hours to minimize system impact</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                  <span>Implement error handling with automated retry mechanisms</span>
                </li>
                <li className="flex items-start">
                  <ChevronRight className="h-4 w-4 text-blue-500 mt-0.5 mr-1 flex-shrink-0" />
                  <span>Use data validation rules to ensure data quality</span>
                </li>
              </ul>
            </div>
          </Card>
          
          <Card className="p-4 md:p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <Workflow className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold">Common ETL Workflows</h3>
              </div>
              <div className="space-y-3">
                <div className="flex items-center p-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <Building className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm">Property Data Import</span>
                </div>
                <div className="flex items-center p-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <Map className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm">GIS Data Processing</span>
                </div>
                <div className="flex items-center p-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <Calculator className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm">Assessment Calculations</span>
                </div>
                <div className="flex items-center p-2 rounded-md border border-gray-200 hover:bg-gray-50 cursor-pointer">
                  <File className="h-4 w-4 text-blue-500 mr-2" />
                  <span className="text-sm">Report Generation</span>
                </div>
              </div>
            </div>
          </Card>
          
          <Card className="p-4 md:p-6">
            <div className="flex flex-col space-y-4">
              <div className="flex items-center">
                <Command className="h-5 w-5 text-blue-500 mr-2" />
                <h3 className="text-lg font-semibold">Quick Actions</h3>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button className="flex flex-col items-center justify-center p-3 rounded-md border border-gray-200 hover:bg-gray-50">
                  <Server className="h-4 w-4 text-blue-500 mb-1" />
                  <span className="text-xs text-center">New Job</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-md border border-gray-200 hover:bg-gray-50">
                  <Database className="h-4 w-4 text-blue-500 mb-1" />
                  <span className="text-xs text-center">Add Source</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-md border border-gray-200 hover:bg-gray-50">
                  <Code className="h-4 w-4 text-blue-500 mb-1" />
                  <span className="text-xs text-center">New Rule</span>
                </button>
                <button className="flex flex-col items-center justify-center p-3 rounded-md border border-gray-200 hover:bg-gray-50">
                  <Settings className="h-4 w-4 text-blue-500 mb-1" />
                  <span className="text-xs text-center">Settings</span>
                </button>
              </div>
              <div className="p-3 bg-gray-50 rounded-md mt-2">
                <h4 className="text-sm font-medium mb-2">System Status</h4>
                <div className="flex items-center text-sm">
                  <div className="h-2 w-2 rounded-full bg-green-500 mr-2"></div>
                  <span>All services operational</span>
                </div>
              </div>
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}