import React, { useState } from 'react';
import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Dashboard from './components/Dashboard';
import Header from './components/Header';
import NotFound from '@/pages/not-found';
import { MapAccessibilityProvider } from './contexts/MapAccessibilityContext';

function Router() {
  return (
    <Switch>
      <Route path="/" component={() => <Dashboard />} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  const [taxYear, setTaxYear] = useState('2025');
  
  return (
    <QueryClientProvider client={queryClient}>
      <MapAccessibilityProvider>
        <div className="flex flex-col h-screen bg-gray-50">
          <Header taxYear={taxYear} onTaxYearChange={setTaxYear} />
          <div className="flex-grow overflow-hidden">
            <Router />
          </div>
        </div>
        <Toaster />
      </MapAccessibilityProvider>
    </QueryClientProvider>
  );
}

export default App;
