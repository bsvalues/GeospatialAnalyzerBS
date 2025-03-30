import React from 'react';
import { Switch, Route } from 'wouter';
import { queryClient } from './lib/queryClient';
import { QueryClientProvider } from '@tanstack/react-query';
import { Toaster } from '@/components/ui/toaster';
import Dashboard from './components/Dashboard';
import NotFound from '@/pages/not-found';
import { PropertyComparisonProvider } from './components/comparison/PropertyComparisonContext';
import PropertyComparison from './components/comparison/PropertyComparison';
import { PropertySearchDialogContainer } from './components/comparison/PropertySearchDialogContainer';
import { NeighborhoodProvider } from './components/neighborhood/NeighborhoodContext';
import { PropertySelectionProvider } from './components/map/PropertySelectionContext';

function Router() {
  return (
    <Switch>
      <Route path="/" component={Dashboard} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <NeighborhoodProvider>
        <PropertySelectionProvider>
          <PropertyComparisonProvider>
            <Router />
            <PropertyComparison />
            <PropertySearchDialogContainer />
            <Toaster />
          </PropertyComparisonProvider>
        </PropertySelectionProvider>
      </NeighborhoodProvider>
    </QueryClientProvider>
  );
}

export default App;
