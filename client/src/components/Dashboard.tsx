import React, { useState } from 'react';
import Header from './Header';
import TabNavigation from './TabNavigation';
import { MapPanel } from './panels/MapPanel';
import OverviewPanel from './panels/OverviewPanel';
import ScriptPanel from './panels/ScriptPanel';

export const Dashboard: React.FC = () => {
  const [activeTab, setActiveTab] = useState<string>('overview');
  const [taxYear, setTaxYear] = useState<string>('2024');
  
  // Handle tab changes
  const handleTabChange = (tabId: string) => {
    setActiveTab(tabId);
  };
  
  // Handle tax year changes
  const handleTaxYearChange = (year: string) => {
    setTaxYear(year);
  };
  
  // Render the active panel based on the active tab
  const renderActivePanel = () => {
    switch (activeTab) {
      case 'overview':
        return <OverviewPanel />;
      case 'map':
        return <MapPanel />;
      case 'script':
        return <ScriptPanel />;
      case 'data':
        return <div className="p-6">Data Panel (Coming Soon)</div>;
      case 'regression':
        return <div className="p-6">Regression Panel (Coming Soon)</div>;
      case 'settings':
        return <div className="p-6">Settings Panel (Coming Soon)</div>;
      default:
        return <OverviewPanel />;
    }
  };
  
  return (
    <div className="flex flex-col h-screen">
      <Header taxYear={taxYear} onTaxYearChange={handleTaxYearChange} />
      <TabNavigation activeTab={activeTab} onTabChange={handleTabChange} />
      <main className="flex-1 overflow-hidden">
        {renderActivePanel()}
      </main>
    </div>
  );
};