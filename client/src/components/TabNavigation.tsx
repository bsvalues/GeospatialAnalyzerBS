import React from 'react';
import { Map, Database, Calculator, Settings, Activity, Workflow, BarChartHorizontal } from 'lucide-react';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Activity size={14} className="mr-1" /> },
    { id: 'map', name: 'Map', icon: <Map size={14} className="mr-1" /> },
    { id: 'script', name: 'Script', icon: <Workflow size={14} className="mr-1" /> },
    { id: 'data', name: 'Data', icon: <Database size={14} className="mr-1" /> },
    { id: 'regression', name: 'Regression', icon: <Calculator size={14} className="mr-1" /> },
    { id: 'comparison', name: 'Comparison', icon: <BarChartHorizontal size={14} className="mr-1" /> },
    { id: 'settings', name: 'Settings', icon: <Settings size={14} className="mr-1" /> }
  ];
  
  return (
    <nav className="bg-muted px-4 py-1">
      <ul className="flex space-x-1">
        {tabs.map(tab => (
          <li 
            key={tab.id}
            className={`px-4 py-2 rounded-t-md cursor-pointer font-medium transition-all flex items-center ${
              activeTab === tab.id 
                ? 'bg-primary text-primary-foreground' 
                : 'hover:bg-muted-foreground/10'
            }`}
            onClick={() => onTabChange(tab.id)}
          >
            {tab.icon} {tab.name}
          </li>
        ))}
      </ul>
    </nav>
  );
};

export default TabNavigation;