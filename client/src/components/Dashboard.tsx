import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
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
  Layers,
  BarChart2,
  CandlestickChart,
  LineChart,
  GitCompare,
  ArrowRight
} from 'lucide-react';
import { PropertyInsightsReport } from '@/components/export/PropertyInsightsReport';
import { MapPanel } from './panels/MapPanel';
import ScriptPanel from './panels/ScriptPanel';
import { SpatialAnalysisPanel } from './panels/SpatialAnalysisPanel';
import { RegressionPanel } from './panels/RegressionPanel';
import { PropertyComparisonPanel } from './panels/PropertyComparisonPanel';
import { PredictiveModelingPanel } from './panels/PredictiveModelingPanel';
import { TimeSeriesAnalysisPanel } from './panels/TimeSeriesAnalysisPanel';
import { SettingsPanel } from './panels/SettingsPanel';
import { ReportGenerator } from '@/components/export/ReportGenerator';
import { KPIDashboardPanel } from './KPIDashboardPanel';
import { AdvancedAnalyticsPanel } from './ml/AdvancedAnalyticsPanel';
import { Property } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';
import TabNavigation from './TabNavigation';
import { Button } from '@/components/ui/button';

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
    <div className={`h-full flex flex-col ${className} bg-gradient-to-b from-[#f8faff] to-[#e6f2ff]`} data-testid="dashboard-container">
      {/* Tab navigation */}
      <TabNavigation activeTab={activeTab} onTabChange={setActiveTab} data-tour="app-navigation" />

      {/* Subtle background elements */}
      <div className="absolute top-1/4 right-1/3 w-[300px] h-[300px] bg-blue-300 rounded-full blur-[130px] opacity-10 z-0 pointer-events-none" />
      <div className="absolute bottom-1/3 left-1/3 w-[250px] h-[250px] bg-purple-300 rounded-full blur-[100px] opacity-10 z-0 pointer-events-none" />

      {/* Panel content */}
      <div className="flex-grow overflow-hidden relative">
        {/* Radial gradient overlay for depth */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0%,rgba(255,255,255,0.7)_70%,rgba(255,255,255,0.9)_100%)] z-[1] pointer-events-none" />

        {activeTab === 'overview' && (
          <div className="h-full p-6 overflow-auto relative z-10" data-tour="overview-panel">
            <div className="max-w-7xl mx-auto">
              <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-8">
                <div data-tour="welcome-message">
                  <motion.h1 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5 }}
                    className="text-3xl font-bold mb-2 bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-indigo-800"
                  >
                    Benton County Property Valuation
                  </motion.h1>
                  <motion.p 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.5, delay: 0.1 }}
                    className="text-gray-600 max-w-3xl"
                  >
                    Welcome to the GIS_BS platform. An advanced spatial analysis and visualization toolset for property valuation assessment in Benton County, Washington.
                  </motion.p>
                </div>
                <motion.div 
                  initial={{ opacity: 0, scale: 0.95 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ duration: 0.5, delay: 0.2 }}
                  className="mt-4 md:mt-0"
                >
                  <PropertyInsightsReport 
                    buttonText="Generate Property Insights"
                    className="px-4 py-2 shadow-sm"
                    showDialog={true}
                  />
                </motion.div>
              </div>

              {/* Quick Stats - Count Cards with glassmorphism */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.1 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-8"
                data-tour="quick-stats"
              >
                <motion.div 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm p-6 border border-blue-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Total Properties</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">8,432</h3>
                      <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +156 from last update
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-blue-400 to-blue-600 p-3 rounded-lg shadow-sm">
                      <Building className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm p-6 border border-green-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Average Value</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">$324,500</h3>
                      <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +2.3% this quarter
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-green-400 to-green-600 p-3 rounded-lg shadow-sm">
                      <DollarSign className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm p-6 border border-purple-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Median Value</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">$298,750</h3>
                      <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +1.8% this quarter
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-purple-400 to-purple-600 p-3 rounded-lg shadow-sm">
                      <PieChart className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </motion.div>

                <motion.div 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/80 backdrop-blur-md rounded-xl shadow-sm p-6 border border-orange-50 transition-all duration-200 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-500">Data Points</p>
                      <h3 className="text-2xl font-bold mt-1 text-gray-900">142,580</h3>
                      <p className="text-xs font-medium text-green-500 mt-1 flex items-center">
                        <ArrowUpRight className="h-3 w-3 mr-1" />
                        +12.4K this month
                      </p>
                    </div>
                    <div className="bg-gradient-to-br from-orange-400 to-orange-600 p-3 rounded-lg shadow-sm">
                      <Layers className="h-5 w-5 text-white" />
                    </div>
                  </div>
                </motion.div>
              </motion.div>

              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.2 }}
                className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8"
                data-tour="detailed-stats"
              >
                {/* Property Statistics Card - redesigned with glassmorphism */}
                <motion.div 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-blue-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)]"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-blue-700 to-blue-500 flex items-center">
                      <BarChart className="h-5 w-5 text-blue-600 mr-2" />
                      Property Statistics
                    </h2>
                    <button className="text-gray-400 hover:text-blue-500 p-1 rounded-full transition-colors duration-200">
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
                    <button className="text-blue-600 text-sm font-medium hover:text-blue-800 transition-colors duration-200 flex items-center">
                      View detailed statistics
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </motion.div>

                {/* Value Distribution Card - redesigned with glassmorphism */}
                <motion.div 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-purple-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)]"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-purple-700 to-purple-500 flex items-center">
                      <TrendingUp className="h-5 w-5 text-purple-600 mr-2" />
                      Value Distribution
                    </h2>
                    <button className="text-gray-400 hover:text-purple-500 p-1 rounded-full transition-colors duration-200">
                      <ExternalLink className="h-4 w-4" />
                    </button>
                  </div>
                  <div className="h-60 flex items-center justify-center bg-gray-50/80 rounded-lg border border-gray-100">
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
                </motion.div>

                {/* Recent Activity Card - redesigned with glassmorphism */}
                <motion.div 
                  whileHover={{ y: -5, transition: { duration: 0.2 } }}
                  className="bg-white/80 backdrop-blur-md p-6 rounded-xl border border-green-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)]"
                >
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-lg font-semibold bg-clip-text text-transparent bg-gradient-to-r from-green-700 to-green-500 flex items-center">
                      <Calendar className="h-5 w-5 text-green-600 mr-2" />
                      Recent Activity
                    </h2>
                    <button className="text-gray-400 hover:text-green-500 p-1 rounded-full transition-colors duration-200">
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
                    <button className="text-green-600 text-sm font-medium hover:text-green-800 transition-colors duration-200 flex items-center">
                      View all activity
                      <ChevronRight className="h-3 w-3 ml-1" />
                    </button>
                  </div>
                </motion.div>
              </motion.div>

              {/* Alert Card - redesigned with glassmorphism */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.3 }}
                className="bg-gradient-to-r from-amber-50/90 to-amber-100/90 backdrop-blur-md p-6 rounded-xl border border-amber-200 shadow-sm mb-8"
                data-tour="alerts-panel"
              >
                <div className="flex flex-col sm:flex-row sm:items-center">
                  <div className="flex-shrink-0 bg-gradient-to-br from-amber-300 to-amber-500 p-3 rounded-full mb-4 sm:mb-0 sm:mr-5 shadow-sm">
                    <AlertCircle className="h-6 w-6 text-white" />
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-amber-900 mb-2">Valuation Data Update Available</h3>
                    <p className="text-sm text-amber-800 mb-4">
                      New property data for Benton County is available. The update includes 156 new properties and 
                      78 revised valuations. Import this data to keep your analysis current.
                    </p>
                    <div className="flex space-x-4">
                      <Button 
                        className="bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-600 hover:to-amber-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-all duration-200 shadow-sm hover:shadow-md"
                      >
                        Import Data Now
                      </Button>
                      <Button 
                        variant="outline"
                        className="bg-transparent hover:bg-amber-200 text-amber-800 border-amber-300 px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                      >
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </motion.div>

              {/* Quick Access Cards */}
              <motion.h2 
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.5, delay: 0.4 }}
                className="text-xl font-bold mb-4 bg-clip-text text-transparent bg-gradient-to-r from-gray-800 to-gray-700"
              >
                Quick Access
              </motion.h2>
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.5 }}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                data-tour="feature-cards"
              >
                <motion.button 
                  onClick={() => setActiveTab('map')}
                  className="p-6 bg-white/80 backdrop-blur-md rounded-xl border border-blue-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                  data-tour="map-feature"
                >
                  <div className="mb-4 bg-gradient-to-br from-blue-400 to-blue-600 w-12 h-12 flex items-center justify-center rounded-lg shadow-sm">
                    <Map className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Property Map</h3>
                  <p className="text-sm text-gray-500">Explore properties with interactive spatial visualization</p>
                </motion.button>

                <motion.button 
                  onClick={() => setActiveTab('analysis')}
                  className="p-6 bg-white/80 backdrop-blur-md rounded-xl border border-purple-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-4 bg-gradient-to-br from-purple-400 to-purple-600 w-12 h-12 flex items-center justify-center rounded-lg shadow-sm">
                    <BarChart2 className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Spatial Analysis</h3>
                  <p className="text-sm text-gray-500">Analyze property patterns and spatial relationships</p>
                </motion.button>

                <motion.button 
                  onClick={() => setActiveTab('comparison')}
                  className="p-6 bg-white/80 backdrop-blur-md rounded-xl border border-green-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-4 bg-gradient-to-br from-green-400 to-green-600 w-12 h-12 flex items-center justify-center rounded-lg shadow-sm">
                    <GitCompare className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Property Comparison</h3>
                  <p className="text-sm text-gray-500">Compare properties and identify value differentials</p>
                </motion.button>

                <motion.button 
                  onClick={() => setActiveTab('modeling')}
                  className="p-6 bg-white/80 backdrop-blur-md rounded-xl border border-red-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-4 bg-gradient-to-br from-red-400 to-red-600 w-12 h-12 flex items-center justify-center rounded-lg shadow-sm">
                    <LineChart className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Predictive Modeling</h3>
                  <p className="text-sm text-gray-500">Create and test property valuation models</p>
                </motion.button>
              </motion.div>

              {/* Additional shortcuts */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.6, delay: 0.6 }}
                className="mt-8 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6"
                data-tour="advanced-features"
              >
                <motion.button 
                  onClick={() => setActiveTab('regression')}
                  className="p-6 bg-white/80 backdrop-blur-md rounded-xl border border-indigo-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-4 bg-gradient-to-br from-indigo-400 to-indigo-600 w-12 h-12 flex items-center justify-center rounded-lg shadow-sm">
                    <CandlestickChart className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Regression Tools</h3>
                  <p className="text-sm text-gray-500">Advanced statistical modeling and regression analysis</p>
                </motion.button>

                <motion.button 
                  onClick={() => setActiveTab('scripts')}
                  className="p-6 bg-white/80 backdrop-blur-md rounded-xl border border-cyan-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-4 bg-gradient-to-br from-cyan-400 to-cyan-600 w-12 h-12 flex items-center justify-center rounded-lg shadow-sm">
                    <Code className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Custom Scripts</h3>
                  <p className="text-sm text-gray-500">Write and execute custom analysis scripts</p>
                </motion.button>

                <motion.button 
                  onClick={() => setActiveTab('reporting')}
                  className="p-6 bg-white/80 backdrop-blur-md rounded-xl border border-yellow-50 shadow-[0_8px_16px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-4 bg-gradient-to-br from-yellow-400 to-yellow-600 w-12 h-12 flex items-center justify-center rounded-lg shadow-sm">
                    <FileText className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Reports</h3>
                  <p className="text-sm text-gray-500">Generate comprehensive property valuation reports</p>
                </motion.button>

                <motion.button 
                  onClick={() => setActiveTab('settings')}
                  className="p-6 bg-white/80 backdrop-blur-md rounded-xl border border-gray-100 shadow-[0_8px_16px_rgba(112,144,176,0.08)] hover:shadow-lg hover:-translate-y-1 transition-all duration-200 text-left"
                  whileHover={{ scale: 1.03 }}
                  whileTap={{ scale: 0.98 }}
                >
                  <div className="mb-4 bg-gradient-to-br from-gray-400 to-gray-600 w-12 h-12 flex items-center justify-center rounded-lg shadow-sm">
                    <Settings className="h-6 w-6 text-white" />
                  </div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">Settings</h3>
                  <p className="text-sm text-gray-500">Configure application preferences and user settings</p>
                </motion.button>
              </motion.div>
            </div>
          </div>
        )}

        {activeTab === 'map' && <MapPanel properties={properties} />}
        {activeTab === 'analysis' && <SpatialAnalysisPanel properties={properties} />}
        {activeTab === 'comparison' && <PropertyComparisonPanel properties={properties} />}
        {activeTab === 'regression' && <RegressionPanel properties={properties} />}
        {activeTab === 'modeling' && <PredictiveModelingPanel properties={properties} />}
        {activeTab === 'timeseries' && <TimeSeriesAnalysisPanel properties={properties} />}
        {activeTab === 'scripts' && <ScriptPanel properties={properties} />}
        {activeTab === 'reporting' && <ReportGenerator properties={properties} />}
        {activeTab === 'kpi' && <KPIDashboardPanel taxYear="2025" />}
        {activeTab === 'analytics' && <AdvancedAnalyticsPanel allProperties={properties} />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
};

export default Dashboard;