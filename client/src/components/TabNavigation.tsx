import React from 'react';
import { Activity, Map, Calculator, Database, Settings, Workflow } from 'lucide-react';

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
    { id: 'settings', name: 'Settings', icon: <Settings size={14} className="mr-1" /> }
  ];

  return (
    <nav className="bg-gray-800 px-4 py-1 border-b border-gray-700">
      <ul className="flex space-x-1">
        {tabs.map(tab => (
          <li 
            key={tab.id}
            className={`px-4 py-2 rounded-t-md cursor-pointer font-medium transition-all flex items-center ${
              activeTab === tab.id 
                ? 'bg-blue-600 text-white' 
                : 'hover:bg-gray-700'
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
