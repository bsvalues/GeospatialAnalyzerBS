import React, { useState } from 'react';
import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import NotFound from '@/pages/not-found';
import { MapAccessibilityProvider } from './contexts/MapAccessibilityContext';
import { PropertyFilterProvider } from './contexts/PropertyFilterContext';
import { AutoHideProvider } from './contexts/AutoHideContext';
import PropertyTrendsDemo from './components/comparison/PropertyTrendsDemo';
import NeighborhoodTimelineDemo from './components/neighborhood/NeighborhoodTimelineDemo';

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard />} />
      <Route path="/trends" component={() => <PropertyTrendsDemo />} />
      <Route path="/neighborhoods" component={() => <NeighborhoodTimelineDemo />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [taxYear, setTaxYear] = useState('2025');
  
  return (
    <QueryClientProvider client={queryClient}>
      <MapAccessibilityProvider>
        <PropertyFilterProvider>
          <AutoHideProvider>
            <div className="flex flex-col h-screen bg-gray-50">
              <Header taxYear={taxYear} onTaxYearChange={setTaxYear} />
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
