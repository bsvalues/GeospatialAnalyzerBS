import React from 'react';
import { Map, Workflow, Calculator, Clock, Activity } from 'lucide-react';

const OverviewPanel: React.FC = () => {
  // Project metrics data
  const metrics = {
    activeLayers: 8,
    savedLocations: 14,
    activeScripts: 6,
    sqlQueries: 8,
    modelR2: 0.892,
    prdValue: 1.02
  };

  // Records data
  const records = {
    properties: 1250,
    sales: 523,
    models: 8,
    analyses: 438
  };

  // Recent activity data
  const recentActivity = [
    { activity: 'Regression Model Updated', type: 'Modeling', date: 'Today, 11:42 AM', user: 'Sarah Johnson' },
    { activity: 'Property Data Import', type: 'Data', date: 'Today, 09:15 AM', user: 'John Smith' },
    { activity: 'Script Execution Completed', type: 'Script', date: 'Yesterday, 4:30 PM', user: 'Maria Garcia' }
  ];

  return (
    <div className="h-full overflow-auto">
      <div className="p-6">
        <h2 className="text-xl font-bold mb-6 flex items-center">
          <Activity size={20} className="mr-2 text-blue-400" />
          Spatialest Project Overview
        </h2>
        
        {/* Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
          {/* GIS Integration Card */}
          <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Map size={18} className="mr-2 text-blue-400" />
              GIS Integration
            </h3>
            <p className="text-sm text-gray-300 mb-3">
              Comprehensive GIS-based appraisal toolset integrating geographic data with property information for accurate valuations.
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Layers:</span>
              <span>{metrics.activeLayers}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Saved Locations:</span>
              <span>{metrics.savedLocations}</span>
            </div>
          </div>
          
          {/* Script-Driven Analysis Card */}
          <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Workflow size={18} className="mr-2 text-green-400" />
              Script-Driven Analysis
            </h3>
            <p className="text-sm text-gray-300 mb-3">
              Sequential Script Steps for data cleaning, analysis, model generation, and comparable sales analysis.
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Active Scripts:</span>
              <span>{metrics.activeScripts}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">SQL Queries:</span>
              <span>{metrics.sqlQueries}</span>
            </div>
          </div>
          
          {/* Regression Analysis Card */}
          <div className="bg-gray-800 p-4 rounded-xl shadow-md border border-gray-700">
            <h3 className="text-lg font-medium mb-3 flex items-center">
              <Calculator size={18} className="mr-2 text-purple-400" />
              Regression Analysis
            </h3>
            <p className="text-sm text-gray-300 mb-3">
              Multiple Regression Analysis (MRA) with variable selection, coefficient interpretation, and model validation.
            </p>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">Current Model R²:</span>
              <span>{metrics.modelR2}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-gray-400">PRD Value:</span>
              <span>{metrics.prdValue}</span>
            </div>
          </div>
        </div>
        
        {/* Project Status Card */}
        <div className="bg-gray-800 p-5 rounded-xl shadow-md border border-gray-700 mb-6">
          <h3 className="text-lg font-medium mb-4">Project Components</h3>
          <div className="space-y-4">
            {/* Property Records Progress */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Property Records</span>
                <span className="text-sm text-gray-400">{records.properties.toLocaleString()} records</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-blue-500 h-2 rounded-full" style={{ width: '100%' }}></div>
              </div>
            </div>
            
            {/* Validated Sales Progress */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Validated Sales</span>
                <span className="text-sm text-gray-400">{records.sales.toLocaleString()} records</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-green-500 h-2 rounded-full" style={{ width: '85%' }}></div>
              </div>
            </div>
            
            {/* Regression Models Progress */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Regression Models</span>
                <span className="text-sm text-gray-400">{records.models} models</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-purple-500 h-2 rounded-full" style={{ width: '65%' }}></div>
              </div>
            </div>
            
            {/* Comparable Analyses Progress */}
            <div className="flex flex-col">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium">Comparable Analyses</span>
                <span className="text-sm text-gray-400">{records.analyses} analyses</span>
              </div>
              <div className="w-full bg-gray-700 rounded-full h-2">
                <div className="bg-yellow-500 h-2 rounded-full" style={{ width: '75%' }}></div>
              </div>
            </div>
          </div>
        </div>
        
        {/* Recent Activity Section */}
        <div>
          <h3 className="text-lg font-medium mb-4 flex items-center">
            <Clock size={18} className="mr-2 text-blue-400" />
            Recent Activity
          </h3>
          <div className="bg-gray-800 rounded-xl shadow-md border border-gray-700 overflow-hidden">
            <table className="min-w-full divide-y divide-gray-700">
              <thead className="bg-gray-750">
                <tr>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Activity</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Type</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">Date</th>
                  <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-400 uppercase tracking-wider">User</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-700">
                {recentActivity.map((item, index) => (
                  <tr key={index} className={index % 2 === 1 ? 'bg-gray-750 bg-opacity-50' : ''}>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.activity}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        item.type === 'Modeling' ? 'bg-purple-100 text-purple-800' :
                        item.type === 'Data' ? 'bg-blue-100 text-blue-800' :
                        'bg-green-100 text-green-800'
                      }`}>
                        {item.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-300">{item.date}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">{item.user}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OverviewPanel;
