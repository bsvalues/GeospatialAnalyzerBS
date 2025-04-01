import React, { useState, useEffect } from 'react';
import { 
  Home, 
  Map, 
  Code, 
  Database, 
  TrendingUp, 
  Settings,
  BarChart,
  Calendar,
  AlertCircle,
  Globe,
  Building,
  FileText
} from 'lucide-react';
import MapPanel from './panels/MapPanel';
import ScriptPanel from './panels/ScriptPanel';
import SpatialAnalysisPanel from './panels/SpatialAnalysisPanel';
import { RegressionPanel } from './panels/RegressionPanel';
import { PropertyComparisonPanel } from './panels/PropertyComparisonPanel';
import { ReportGenerator } from './export/ReportGenerator';
import { Property } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

export interface DashboardProps {
  className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('map');
  
  // Fetch properties data
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Tab navigation */}
      <div className="bg-white border-b border-gray-200">
        <nav className="flex overflow-x-auto">
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center ${activeTab === 'overview' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('overview')}
          >
            <Home className="h-4 w-4 mr-2" />
            Overview
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center ${activeTab === 'map' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('map')}
          >
            <Map className="h-4 w-4 mr-2" />
            Map
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center ${activeTab === 'scripts' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('scripts')}
          >
            <Code className="h-4 w-4 mr-2" />
            Scripts
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center ${activeTab === 'data' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('data')}
          >
            <Database className="h-4 w-4 mr-2" />
            Data
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center ${activeTab === 'regression' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('regression')}
          >
            <TrendingUp className="h-4 w-4 mr-2" />
            Regression
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center ${activeTab === 'spatial' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('spatial')}
          >
            <Globe className="h-4 w-4 mr-2" />
            Spatial Analysis
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center ${activeTab === 'comparison' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('comparison')}
          >
            <Building className="h-4 w-4 mr-2" />
            Property Comparison
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center ${activeTab === 'reports' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('reports')}
          >
            <FileText className="h-4 w-4 mr-2" />
            Reports
          </button>
          <button
            className={`px-4 py-3 font-medium text-sm flex items-center ${activeTab === 'settings' ? 'text-primary border-b-2 border-primary' : 'text-gray-600 hover:text-gray-900'}`}
            onClick={() => setActiveTab('settings')}
          >
            <Settings className="h-4 w-4 mr-2" />
            Settings
          </button>
        </nav>
      </div>
      
      {/* Panel content */}
      <div className="flex-grow overflow-hidden">
        {activeTab === 'overview' && (
          <div className="h-full p-6 overflow-auto">
            <h1 className="text-2xl font-bold mb-4 text-gray-800">Benton County Property Valuation Dashboard</h1>
            <p className="mb-6 text-gray-600">
              Welcome to the Spatialest property valuation dashboard. This application provides advanced
              spatial analysis and visualization tools for property assessment in Benton County, Washington.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {/* Property Statistics Card */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Property Statistics</h2>
                  <BarChart className="h-5 w-5 text-primary/70" />
                </div>
                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Total Properties:</span>
                    <span className="font-medium">8,432</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Average Value:</span>
                    <span className="font-medium">$324,500</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Median Value:</span>
                    <span className="font-medium">$298,750</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Property Count:</span>
                    <span className="font-medium">6,284</span>
                  </div>
                </div>
              </div>
              
              {/* Value Distribution Card */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Value Distribution</h2>
                  <TrendingUp className="h-5 w-5 text-primary/70" />
                </div>
                <div className="h-48 flex items-center justify-center bg-gray-50 rounded-md border border-gray-100">
                  <div className="text-center">
                    <BarChart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                    <span className="text-gray-500 text-sm">Property value distribution chart will be displayed here</span>
                  </div>
                </div>
              </div>
              
              {/* Recent Activity Card */}
              <div className="bg-white p-5 rounded-lg border border-gray-200 shadow-sm">
                <div className="flex justify-between items-center mb-4">
                  <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
                  <Calendar className="h-5 w-5 text-primary/70" />
                </div>
                <ul className="space-y-3">
                  <li className="flex items-center text-sm">
                    <span className="w-2 h-2 rounded-full bg-green-500 mr-2"></span>
                    <span className="text-gray-500 mr-2">Today, 2:30 PM:</span> 
                    <span>Property analysis completed</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="w-2 h-2 rounded-full bg-blue-500 mr-2"></span>
                    <span className="text-gray-500 mr-2">Today, 1:15 PM:</span>
                    <span>12 new properties added</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="w-2 h-2 rounded-full bg-yellow-500 mr-2"></span>
                    <span className="text-gray-500 mr-2">Yesterday:</span>
                    <span>Regression model updated</span>
                  </li>
                  <li className="flex items-center text-sm">
                    <span className="w-2 h-2 rounded-full bg-purple-500 mr-2"></span>
                    <span className="text-gray-500 mr-2">2 days ago:</span>
                    <span>Data export completed</span>
                  </li>
                </ul>
              </div>
              
              {/* Alert Card */}
              <div className="md:col-span-2 lg:col-span-3 bg-amber-50 p-5 rounded-lg border border-amber-200">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-amber-500 mr-3 flex-shrink-0 mt-0.5" />
                  <div>
                    <h3 className="text-sm font-medium text-amber-800 mb-1">Valuation Data Update Available</h3>
                    <p className="text-sm text-amber-700">
                      New property data for Benton County is available. The update includes 156 new properties and 
                      78 revised valuations. Click 'Import Data' in the Data panel to update your workspace.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'map' && <MapPanel />}
        
        {activeTab === 'scripts' && <ScriptPanel />}
        
        {activeTab === 'data' && (
          <div className="h-full p-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Database className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                The Data panel will provide tools for importing, exporting, and managing property data.
              </p>
              <p className="text-sm text-gray-400">
                This feature will be implemented in the next phase.
              </p>
            </div>
          </div>
        )}
        
        {activeTab === 'regression' && <RegressionPanel />}
        
        {activeTab === 'spatial' && (
          <SpatialAnalysisPanel properties={properties} />
        )}
        
        {activeTab === 'comparison' && <PropertyComparisonPanel />}
        
        {activeTab === 'reports' && (
          <div className="h-full p-6 overflow-auto">
            <div className="mb-6">
              <h2 className="text-2xl font-bold text-gray-800 mb-2">Property Reports</h2>
              <p className="text-gray-600">
                Create, customize, and export detailed property reports with the information you need.
              </p>
            </div>
            <ReportGenerator />
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="h-full p-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <Settings className="w-12 h-12 text-gray-300 mx-auto mb-4" />
              <p className="text-gray-500 mb-2">
                The Settings panel will allow you to configure application preferences.
              </p>
              <p className="text-sm text-gray-400">
                This feature will be implemented in the next phase.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;