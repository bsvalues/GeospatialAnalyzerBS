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
  FileText,
  ChevronRight,
  ExternalLink,
  Info,
  ArrowUpRight,
  PieChart,
  DollarSign,
  Layers
} from 'lucide-react';
import { MapPanel } from './panels/MapPanel';
import ScriptPanel from './panels/ScriptPanel';
import { SpatialAnalysisPanel } from './panels/SpatialAnalysisPanel';
import { RegressionPanel } from './panels/RegressionPanel';
import { PropertyComparisonPanel } from './panels/PropertyComparisonPanel';
import { PredictiveModelingPanel } from './panels/PredictiveModelingPanel';
import { TimeSeriesAnalysisPanel } from './panels/TimeSeriesAnalysisPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { ReportGenerator } from './export/ReportGenerator';
import { KPIDashboardPanel } from './KPIDashboardPanel';
import { AdvancedAnalyticsPanel } from './ml/AdvancedAnalyticsPanel';
import { Property } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import TabNavigation from './TabNavigation';

export interface DashboardProps {
  className?: string;
}

const Dashboard: React.FC<DashboardProps> = ({ className }) => {
  const [activeTab, setActiveTab] = useState('overview');
  
  // Fetch properties data
  const { data: properties = [] } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
    staleTime: 1000 * 60 * 5, // 5 minutes
  });
  
  return (
    <div className={`h-full flex flex-col ${className}`}>
      {/* Tab navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} />
      
      {/* Panel content */}
      <div className="flex-grow overflow-hidden bg-gray-50">
        {activeTab === 'overview' && (
          <div className="h-full p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div>
                  <h1 className="text-3xl font-bold mb-2 text-gray-900">Benton County Property Valuation</h1>
                  <p className="text-gray-600 max-w-3xl">
                    Welcome to the GIS_BS platform. An advanced spatial analysis and visualization toolset for property valuation assessment in Benton County, Washington.
                  </p>
                </div>
                <div className="mt-4 md:mt-0">
                  <button className="bg-primary text-white px-4 py-2 rounded-lg shadow-sm hover:bg-primary/90 transition-colors duration-200 flex items-center">
                    <FileText className="h-4 w-4 mr-2" />
                    Generate Report
                  </button>
                </div>
              </div>
              
              {/* Quick Stats - Count Cards */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Properties</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">8,432</h3>
                      <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +156 from last update
                      </p>
                    </div>
                    <div className="bg-blue-50 p-3 rounded-lg">
                      <Building className="h-5 w-5 text-blue-500" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Value</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">$324,500</h3>
                      <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +2.3% this quarter
                      </p>
                    </div>
                    <div className="bg-green-50 p-3 rounded-lg">
                      <DollarSign className="h-5 w-5 text-green-500" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Median Value</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">$298,750</h3>
                      <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +1.8% this quarter
                      </p>
                    </div>
                    <div className="bg-purple-50 p-3 rounded-lg">
                      <PieChart className="h-5 w-5 text-purple-500" />
                    </div>
                  </div>
                </div>
                
                <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100 transition-all duration-200 hover:shadow-md">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data Points</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">142,580</h3>
                      <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +12.4K this month
                      </p>
                    </div>
                    <div className="bg-orange-50 p-3 rounded-lg">
                      <Layers className="h-5 w-5 text-orange-500" />
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
                {/* Property Statistics Card - redesigned */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <BarChart className="h-5 w-5 text-primary mr-2" />
                      Property Statistics
                    </h2>
                    <button className="text-gray-400 hover:text-primary p-1 rounded-full transition-colors duration-200">
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="space-y-4">
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-gray-600">Total Properties</span>
                      <span className="font-medium text-gray-900">8,432</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-gray-600">Average Value</span>
                      <span className="font-medium text-gray-900">$324,500</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-gray-600">Median Value</span>
                      <span className="font-medium text-gray-900">$298,750</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-gray-600">Property Count</span>
                      <span className="font-medium text-gray-900">6,284</span>
                    </div>
                    <div className="flex justify-between items-center border-b border-gray-100 pb-3">
                      <span className="text-gray-600">Avg. Land Size</span>
                      <span className="font-medium text-gray-900">0.34 acres</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-600">Avg. Year Built</span>
                      <span className="font-medium text-gray-900">1992</span>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button className="text-primary text-sm font-medium hover:text-primary/80 transition-colors duration-200 flex items-center">
                      View detailed statistics
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
                
                {/* Value Distribution Card - redesigned */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <TrendingUp className="h-5 w-5 text-primary mr-2" />
                      Value Distribution
                    </h2>
                    <button className="text-gray-400 hover:text-primary p-1 rounded-full transition-colors duration-200">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="h-60 flex items-center justify-center bg-gray-50 rounded-lg border border-gray-100">
                    <div className="text-center">
                      <BarChart className="h-10 w-10 text-gray-300 mx-auto mb-2" />
                      <p className="text-gray-500 text-sm max-w-xs mx-auto">
                        Property value distribution visualization showing the range of property values across the county
                      </p>
                    </div>
                  </div>
                  <div className="mt-6 flex flex-wrap gap-3">
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-blue-500 mr-2"></span>
                      <span className="text-xs text-gray-600">Residential</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-green-500 mr-2"></span>
                      <span className="text-xs text-gray-600">Commercial</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-orange-500 mr-2"></span>
                      <span className="text-xs text-gray-600">Agricultural</span>
                    </div>
                    <div className="flex items-center">
                      <span className="w-3 h-3 rounded-full bg-purple-500 mr-2"></span>
                      <span className="text-xs text-gray-600">Industrial</span>
                    </div>
                  </div>
                </div>
                
                {/* Recent Activity Card - redesigned */}
                <div className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center">
                      <Calendar className="h-5 w-5 text-primary mr-2" />
                      Recent Activity
                    </h2>
                    <button className="text-gray-400 hover:text-primary p-1 rounded-full transition-colors duration-200">
                      <Info className="h-4 w-4" />
                    </button>
                  </div>
                  <ul className="space-y-4">
                    <li className="flex items-start">
                      <div className="bg-green-100 p-1.5 rounded-lg mr-3 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-green-500 block"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Property analysis completed</p>
                        <p className="text-xs text-gray-500">Today, 2:30 PM</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-blue-100 p-1.5 rounded-lg mr-3 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-blue-500 block"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">12 new properties added</p>
                        <p className="text-xs text-gray-500">Today, 1:15 PM</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-yellow-100 p-1.5 rounded-lg mr-3 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-yellow-500 block"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Regression model updated</p>
                        <p className="text-xs text-gray-500">Yesterday</p>
                      </div>
                    </li>
                    <li className="flex items-start">
                      <div className="bg-purple-100 p-1.5 rounded-lg mr-3 mt-0.5">
                        <span className="w-2 h-2 rounded-full bg-purple-500 block"></span>
                      </div>
                      <div>
                        <p className="text-sm font-medium">Data export completed</p>
                        <p className="text-xs text-gray-500">2 days ago</p>
                      </div>
                    </li>
                  </ul>
                  <div className="mt-6">
                    <button className="text-primary text-sm font-medium hover:text-primary/80 transition-colors duration-200 flex items-center">
                      View all activity
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </div>
              </div>
              
              {/* Alert Card - redesigned */}
              <div className="bg-gradient-to-r from-amber-50 to-amber-100 p-6 rounded-xl border border-amber-200 shadow-sm mb-8">
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex-shrink-0 bg-amber-200 p-3 rounded-full mb-4 sm:mb-0 sm:mr-5">
                    <AlertCircle className="h-6 w-6 text-amber-700" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">Valuation Data Update Available</h3>
                    <p className="text-sm text-amber-800 mb-4">
                      New property data for Benton County is available. The update includes 156 new properties and 
                      78 revised valuations. Import this data to keep your analysis current.
                    </p>
                    <div className="flex space-x-4">
                      <button className="bg-amber-600 hover:bg-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        Import Data Now
                      </button>
                      <button className="bg-transparent hover:bg-amber-200 text-amber-800 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200">
                        View Details
                      </button>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Quick Access Cards */}
              <h2 className="text-xl font-bold mb-4 text-gray-900">Quick Access</h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
                <button 
                  onClick={() => setActiveTab('map')}
                  className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left"
                >
                  <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                    <Map className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Property Map</h3>
                  <p className="text-sm text-gray-600">
                    Visualize properties across Benton County with our interactive mapping tools
                  </p>
                </button>
                <button 
                  onClick={() => setActiveTab('regression')}
                  className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left"
                >
                  <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                    <TrendingUp className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Regression Tools</h3>
                  <p className="text-sm text-gray-600">
                    Create and analyze valuation models with statistical regression tools
                  </p>
                </button>
                <button 
                  onClick={() => setActiveTab('comparison')}
                  className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left"
                >
                  <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                    <Building className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Property Comparison</h3>
                  <p className="text-sm text-gray-600">
                    Compare similar properties and analyze valuation differentials
                  </p>
                </button>
                <button 
                  onClick={() => setActiveTab('reports')}
                  className="bg-white p-6 rounded-xl border border-gray-100 shadow-sm hover:shadow-md hover:border-primary/20 transition-all duration-200 text-left"
                >
                  <div className="bg-primary/10 p-3 rounded-lg inline-block mb-4">
                    <FileText className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">Generate Reports</h3>
                  <p className="text-sm text-gray-600">
                    Create detailed reports for properties, neighborhoods, or trends
                  </p>
                </button>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'map' && <MapPanel properties={properties} />}
        
        {activeTab === 'scripts' && <ScriptPanel />}
        
        {activeTab === 'data' && (
          <div className="h-full p-6 flex items-center justify-center">
            <div className="text-center max-w-md">
              <div className="bg-gray-50 p-5 rounded-full inline-block mb-4">
                <Database className="w-12 h-12 text-gray-300" />
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3">Data Management</h3>
              <p className="text-gray-600 mb-6">
                The Data panel will provide tools for importing, exporting, and managing property data.
              </p>
              <button className="bg-primary/10 text-primary px-4 py-2 rounded-lg text-sm font-medium hover:bg-primary/20 transition-colors duration-200">
                Coming Soon
              </button>
            </div>
          </div>
        )}
        
        {activeTab === 'regression' && <RegressionPanel />}
        
        {activeTab === 'predictive' && <PredictiveModelingPanel />}
        
        {activeTab === 'timeseries' && <TimeSeriesAnalysisPanel properties={properties} />}
        
        {activeTab === 'spatial' && (
          <SpatialAnalysisPanel properties={properties} />
        )}
        
        {activeTab === 'comparison' && <PropertyComparisonPanel />}
        
        {activeTab === 'kpi' && <KPIDashboardPanel />}
        
        {activeTab === 'advanced' && (
          <div className="h-full p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Advanced Analytics & Machine Learning</h2>
                <p className="text-gray-600 max-w-3xl">
                  Leverage machine learning and advanced analytics for precise property valuation, time series forecasting, and spatial intelligence.
                </p>
              </div>
              <AdvancedAnalyticsPanel selectedProperty={properties[0]} allProperties={properties} />
            </div>
          </div>
        )}
        
        {activeTab === 'reports' && (
          <div className="h-full p-6 overflow-auto">
            <div className="max-w-7xl mx-auto">
              <div className="mb-8">
                <h2 className="text-2xl font-bold text-gray-900 mb-2">Property Reports</h2>
                <p className="text-gray-600 max-w-3xl">
                  Create, customize, and export detailed property reports with the information you need.
                </p>
              </div>
              <ReportGenerator />
            </div>
          </div>
        )}
        
        {activeTab === 'settings' && (
          <div className="h-full">
            <SettingsPanel />
          </div>
        )}
      </div>
    </div>
  );
};

export default Dashboard;