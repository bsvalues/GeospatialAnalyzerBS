import React from 'react';
import { Activity, Map, Calculator, Database, Settings, FileText } from 'lucide-react';
import { Tabs, TabsList, TabsTrigger } from '@/components/ui/tabs';

interface TabNavigationProps {
  activeTab: string;
  onTabChange: (tabId: string) => void;
}

const TabNavigation: React.FC<TabNavigationProps> = ({ activeTab, onTabChange }) => {
  const tabs = [
    { id: 'overview', name: 'Overview', icon: <Activity className="h-4 w-4 mr-1" /> },
    { id: 'map', name: 'Map', icon: <Map className="h-4 w-4 mr-1" /> },
    { id: 'script', name: 'Script', icon: <FileText className="h-4 w-4 mr-1" /> },
    { id: 'data', name: 'Data', icon: <Database className="h-4 w-4 mr-1" /> },
    { id: 'regression', name: 'Regression', icon: <Calculator className="h-4 w-4 mr-1" /> },
    { id: 'settings', name: 'Settings', icon: <Settings className="h-4 w-4 mr-1" /> }
  ];

  return (
    <div className="border-b px-4 py-2">
      <Tabs value={activeTab} onValueChange={onTabChange} className="w-full">
        <TabsList className="flex justify-start">
          {tabs.map(tab => (
            <TabsTrigger key={tab.id} value={tab.id} className="flex items-center gap-1 px-4">
              {tab.icon}
              {tab.name}
            </TabsTrigger>
          ))}
        </TabsList>
      </Tabs>
    </div>
  );
};

export default TabNavigation;
