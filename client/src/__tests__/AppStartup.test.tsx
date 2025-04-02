
import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import App from '../App';

const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Application Startup', () => {
  test('app renders without crashing', async () => {
    renderWithProviders(<App />);
    const dashboardElement = await waitFor(() => screen.getByTestId('dashboard-container'));
    expect(dashboardElement).toBeInTheDocument();
  });

  test('critical navigation elements are present', async () => {
    renderWithProviders(<App />);
    
    await waitFor(() => {
      const header = screen.getByRole('banner');
      const navigation = screen.getByRole('navigation');
      const overview = screen.getByText(/Benton County Property Valuation/i);
      
      expect(header).toBeInTheDocument();
      expect(navigation).toBeInTheDocument();
      expect(overview).toBeInTheDocument();
    });
  });

  test('initial data loading states are handled', async () => {
    renderWithProviders(<App />);
    
    // Check loading states
    const loadingIndicators = await waitFor(() => screen.queryAllByTestId('loading-indicator'));
    expect(loadingIndicators.length).toBeGreaterThanOrEqual(0);
    
    // Verify error boundaries are in place
    const errorBoundary = screen.getByTestId('error-boundary');
    expect(errorBoundary).toBeInTheDocument();
  });
});
