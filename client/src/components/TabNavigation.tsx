import React from 'react';
import { motion } from 'framer-motion';
import { Map, Database, Calculator, Settings, Activity, BarChartHorizontal, ChevronRight, Brain, LineChart, BarChart, Zap, Home, GitCompare, Code, FileText } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Home size={18} className="mr-2" /> },
    { id: 'map', name: 'Map', icon: <Map size={18} className="mr-2" /> },
    { id: 'analysis', name: 'Spatial Analysis', icon: <Activity size={18} className="mr-2" /> },
    { id: 'comparison', name: 'Comparison', icon: <GitCompare size={18} className="mr-2" /> },
    { id: 'regression', name: 'Regression', icon: <Calculator size={18} className="mr-2" /> },
    { id: 'modeling', name: 'Predictive', icon: <Brain size={18} className="mr-2" /> },
    { id: 'timeseries', name: 'Time Series', icon: <LineChart size={18} className="mr-2" /> },
    { id: 'scripts', name: 'Scripts', icon: <Code size={18} className="mr-2" /> },
    { id: 'reporting', name: 'Reports', icon: <FileText size={18} className="mr-2" /> },
    { id: 'kpi', name: 'KPI Dashboard', icon: <BarChart size={18} className="mr-2" /> },
    { id: 'analytics', name: 'Advanced Analytics', icon: <Zap size={18} className="mr-2" /> },
    { id: 'settings', name: 'Settings', icon: <Settings size={18} className="mr-2" /> }
  ];
  
  return (
    <nav className="bg-gradient-to-b from-gray-50 to-gray-100 border-b border-[rgba(209,213,219,0.3)] sticky top-0 z-20 px-6 py-3 shadow-sm">
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <ul className="flex space-x-2 overflow-x-auto pb-2 md:pb-0 scrollbar-hide">
          {tabs.map(tab => (
            <motion.li 
              key={tab.id}
              whileHover={{ y: -2 }}
              whileTap={{ scale: 0.98 }}
              className={`
                px-4 py-2 rounded-xl cursor-pointer font-medium transition-all duration-200 flex items-center whitespace-nowrap
                ${activeTab === tab.id 
                  ? 'bg-gradient-to-r from-primary/10 to-primary/5 text-primary border-primary/20 border shadow-sm' 
                  : 'hover:bg-gray-200/50 text-gray-600 hover:text-gray-800 border border-transparent'
                }
              `}
              onClick={() => onTabChange(tab.id)}
            >
              <div className={`
                ${activeTab === tab.id 
                  ? 'text-primary' 
                  : 'text-gray-500'
                } mr-2
              `}>
                {tab.icon}
              </div>
              <span className="text-sm">{tab.name}</span>
              {activeTab === tab.id && (
                <ChevronRight size={14} className="ml-2 text-primary" />
              )}
            </motion.li>
          ))}
        </ul>
        
        {/* Breadcrumb path */}
        <motion.div 
          initial={{ opacity: 0, y: 5 }} 
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.3 }}
          className="flex items-center mt-2 md:mt-0 text-xs text-gray-500"
        >
          <span className="font-medium">GIS_BS</span>
          <ChevronRight size={12} className="mx-1" />
          <span className="text-primary font-medium">
            {tabs.find(tab => tab.id === activeTab)?.name}
          </span>
        </motion.div>
      </div>
    </nav>
  );
};

export default TabNavigation;