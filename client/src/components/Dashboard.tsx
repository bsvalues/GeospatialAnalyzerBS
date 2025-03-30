import React, { useState } from 'react';
import Header from './Header';
import TabNavigation from './TabNavigation';
import OverviewPanel from './panels/OverviewPanel';
import { MapPanel } from './panels/MapPanel';
import ScriptPanel from './panels/ScriptPanel';
import DataPanel from './panels/DataPanel';
import RegressionPanel from './regression/RegressionPanel';
import SettingsPanel from './panels/SettingsPanel';

const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('data'); // Set data tab as default to showcase neighborhood features
  const [taxYear, setTaxYear] = useState<string>('2024');

  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };

  return (
    <div className="flex flex-col h-screen bg-background text-foreground">
      <Header taxYear={taxYear} onTaxYearChange={setTaxYear} />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      
      <div className="flex-1 overflow-hidden">
        {activeTab === 'overview' && <OverviewPanel />}
        {activeTab === 'map' && <MapPanel />}
        {activeTab === 'script' && <ScriptPanel />}
        {activeTab === 'data' && <DataPanel />}
        {activeTab === 'regression' && <RegressionPanel />}
        {activeTab === 'settings' && <SettingsPanel />}
      </div>
    </div>
  );
};

export default Dashboard;
