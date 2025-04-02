
import React from 'react';
import { render, screen } from '@testing-library/react';
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
  test('app renders without crashing', () => {
    renderWithProviders(<App />);
    const dashboardElement = screen.getByTestId('dashboard-container');
    expect(dashboardElement).toBeInTheDocument();
  });

  test('critical navigation elements are present', () => {
    renderWithProviders(<App />);
    const header = screen.getByRole('banner');
    const navigation = screen.getByRole('navigation');
    expect(header).toBeInTheDocument();
    expect(navigation).toBeInTheDocument();
  });
});
