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
import PropertyTrendsDemo from './components/comparison/PropertyTrendsDemo';
import NeighborhoodTimelineDemo from './components/neighborhood/NeighborhoodTimelineDemo';

// Page imports
import HomePage from '@/pages/home';
import DashboardPage from '@/pages/dashboard';
import AboutPage from '@/pages/about';
import GetSmarterPage from '@/pages/get-smarter';

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
            <div className="flex flex-col h-screen bg-gray-50">
              <div className="flex-grow overflow-hidden">
                <Router />
              </div>
            </div>
            <Toaster />
          </AutoHideProvider>
        </PropertyFilterProvider>
      </MapAccessibilityProvider>
    </QueryClientProvider>
  );
}

export default App;
