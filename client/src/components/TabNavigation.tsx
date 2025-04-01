import React from 'react';
import { Map, Database, Calculator, Settings, Activity, Workflow, BarChartHorizontal, ChevronRight, Brain } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Activity size={16} className="mr-2" /> },
    { id: 'map', name: 'Map', icon: <Map size={16} className="mr-2" /> },
    { id: 'script', name: 'Script', icon: <Workflow size={16} className="mr-2" /> },
    { id: 'data', name: 'Data', icon: <Database size={16} className="mr-2" /> },
    { id: 'regression', name: 'Regression', icon: <Calculator size={16} className="mr-2" /> },
    { id: 'predictive', name: 'Predictive', icon: <Brain size={16} className="mr-2" /> },
    { id: 'comparison', name: 'Comparison', icon: <BarChartHorizontal size={16} className="mr-2" /> },
    { id: 'settings', name: 'Settings', icon: <Settings size={16} className="mr-2" /> }
  ];
  
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-2">
      <ul className="flex space-x-1 overflow-x-auto">
        {tabs.map(tab => (
          <li 
            key={tab.id}
            className={`
              px-4 py-2.5 rounded-md cursor-pointer font-medium transition-all duration-200 flex items-center
              ${activeTab === tab.id 
                ? 'bg-primary/10 text-primary border-primary border shadow-sm' 
                : 'hover:bg-gray-50 text-gray-600 hover:text-gray-800 border border-transparent'
              }
            `}
            onClick={() => onTabChange(tab.id)}
          >
            <div className={`
              ${activeTab === tab.id 
                ? 'text-primary bg-primary/10' 
                : 'text-gray-500 bg-gray-100'
              } p-1.5 rounded-md mr-2
            `}>
              {tab.icon}
            </div>
            <span>{tab.name}</span>
            {activeTab === tab.id && (
              <ChevronRight size={14} className="ml-2 opacity-70" />
            )}
          </li>
        ))}
      </ul>
      
      {/* Breadcrumb path */}
      <div className="flex items-center mt-2 text-xs text-gray-500">
        <span className="font-medium">GIS_BS</span>
        <ChevronRight size={12} className="mx-1" />
        <span className="text-primary font-medium">{tabs.find(tab => tab.id === activeTab)?.name}</span>
      </div>
    </nav>
  );
};

export default TabNavigation;