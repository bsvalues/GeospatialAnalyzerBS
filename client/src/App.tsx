import React, { useState } from 'react';
import { Switch, Route, useLocation } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Header from './components/Header';
import NotFound from '@/pages/not-found';
import { MapAccessibilityProvider } from './contexts/MapAccessibilityContext';
import { PropertyFilterProvider } from './contexts/PropertyFilterContext';
import { AutoHideProvider } from './contexts/AutoHideContext';
import { TourProvider } from './contexts/TourContext';
import PropertyTrendsDemo from './components/comparison/PropertyTrendsDemo';
import NeighborhoodTimelineDemo from './components/neighborhood/NeighborhoodTimelineDemo';
import { RegressionPanel } from './components/panels/RegressionPanel';

// Page imports
import HomePage from '@/pages/home';
import DashboardPage from '@/pages/dashboard';
import AboutPage from '@/pages/about';
import GetSmarterPage from '@/pages/get-smarter';
import ScriptingPage from '@/pages/scripting';
import ETLPage from '@/pages/etl';
import ETLManagementPage from '@/pages/ETLManagement';
import DataConnectorsPage from '@/pages/DataConnectors';
import LayersPage from '@/pages/Layers';
import DataPage from '@/pages/Data';
import AnalysisPage from '@/pages/Analysis';
import PropertiesPage from '@/pages/Properties';
import ReportsPage from '@/pages/Reports';
import USPAPExportPage from '@/pages/uspap-export';
import NeighborhoodComparisonPage from '@/pages/neighborhood-comparison';
import PropertyPredictionDemo from '@/pages/PropertyPredictionDemo';
import PropertyDataSourcesPage from '@/pages/PropertyDataSources';
import DataQualityDemo from '@/pages/DataQualityDemo';
import PropertyBulkImportPage from '@/pages/PropertyBulkImportPage';
import { ProjectTrackerPage } from '@/pages/ProjectTrackerPage';
import IncomeTestPage from '@/pages/income-test';
import FTPDataMigrationPage from '@/pages/FTPDataMigrationPage';
import DatabaseConnectionPage from './pages/DatabaseConnectionPage';
import DatabaseTestPage from './pages/DatabaseTestPage';
import IncomeApproachPage from './pages/IncomeApproachPage';
import AnimationDemo from './pages/AnimationDemo';
import ETLWizardPage from './pages/ETLWizardPage';
import ETLAnimationDemo from './pages/ETLAnimationDemo';
import StepProgressDemo from './pages/StepProgressDemo';
import ETLJobSimulationDemo from './pages/ETLJobSimulationDemo';

function Router() {
  const [location] = useLocation();
  const showHeader = !['/'].includes(location);

  return (
    <>
      {showHeader && <HeaderWithYear />}
      <Switch>
        <Route path="/" component={HomePage} />
        <Route path="/dashboard" component={DashboardPage} />
        <Route path="/about" component={AboutPage} />
        <Route path="/get-smarter" component={GetSmarterPage} />
        <Route path="/trends" component={PropertyTrendsDemo} />
        <Route path="/neighborhoods" component={NeighborhoodTimelineDemo} />
        <Route path="/scripting" component={ScriptingPage} />
        <Route path="/etl" component={ETLPage} />
        <Route path="/etl-management" component={ETLManagementPage} />
        <Route path="/data-connectors" component={DataConnectorsPage} />
        <Route path="/layers" component={LayersPage} />
        <Route path="/data" component={DataPage} />
        <Route path="/analysis" component={AnalysisPage} />
        <Route path="/properties" component={PropertiesPage} />
        <Route path="/reports" component={ReportsPage} />
        <Route path="/uspap-export" component={USPAPExportPage} />
        <Route path="/neighborhood-comparison" component={NeighborhoodComparisonPage} />
        <Route path="/prediction" component={PropertyPredictionDemo} />
        <Route path="/property-data-sources" component={PropertyDataSourcesPage} />
        <Route path="/data-quality" component={DataQualityDemo} />
        <Route path="/project-tracker" component={ProjectTrackerPage} />
        <Route path="/property-bulk-import" component={PropertyBulkImportPage} />
        <Route path="/income-test" component={IncomeTestPage} />
        <Route path="/ftp-data-migration" component={FTPDataMigrationPage} />
        <Route path="/database-connection" component={DatabaseConnectionPage} />
        <Route path="/database-test" component={DatabaseTestPage} />
        <Route path="/income-approach" component={IncomeApproachPage} />
        <Route path="/animation-demo" component={AnimationDemo} />
        <Route path="/etl-wizard" component={ETLWizardPage} />
        <Route path="/etl-animation-demo" component={ETLAnimationDemo} />
        <Route path="/step-progress-demo" component={StepProgressDemo} />
        <Route path="/etl-job-simulation" component={ETLJobSimulationDemo} />
        <Route path="/regression">
          {() => (
            <div className="w-full h-full overflow-auto">
              <RegressionPanel properties={[]} />
            </div>
          )}
        </Route>
        <Route component={NotFound} />
      </Switch>
    </>
  );
}

function HeaderWithYear() {
  const [taxYear, setTaxYear] = useState('2025');
  return <Header taxYear={taxYear} onTaxYearChange={setTaxYear} />;
}

export function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <MapAccessibilityProvider>
        <PropertyFilterProvider>
          <AutoHideProvider>
            <TourProvider>
              <div className="flex flex-col min-h-screen bg-gradient-to-b from-[#f8faff] to-[#e6eeff]">
                {/* Background elements - placed at lower z-index */}
                <div className="fixed inset-0 bg-gradient-to-br from-[#f0f4ff] via-white to-[#f0f4ff] z-0" />
                <div className="fixed top-1/4 right-1/4 w-[400px] h-[400px] bg-blue-400 rounded-full blur-[140px] opacity-20 z-0" />
                <div className="fixed bottom-1/4 left-1/4 w-[350px] h-[350px] bg-purple-300 rounded-full blur-[120px] opacity-15 z-0" />
                <div className="fixed inset-0 z-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0)_0%,rgba(255,255,255,0.8)_50%,rgba(255,255,255,0.9)_100%)]" />
                
                {/* Main content area - with higher z-index */}
                <div className="flex-grow relative z-10 overflow-y-auto">
                  <Router />
                </div>
              </div>
              <Toaster />
            </TourProvider>
          </AutoHideProvider>
        </PropertyFilterProvider>
      </MapAccessibilityProvider>
    </QueryClientProvider>
  );
}

export default App;
