/**
 * Tests to verify the application rebranding from Spatialest to GIS_BS
 */

import React from 'react';
import { render, screen } from '@testing-library/react';
import { QueryClientProvider } from '@tanstack/react-query';
import { queryClient } from '../lib/queryClient';
import App from '../App';
import Dashboard from '../components/Dashboard';
import { Header } from '../components/Header';

// Wrap components with necessary providers
const renderWithProviders = (ui: React.ReactElement) => {
  return render(
    <QueryClientProvider client={queryClient}>
      {ui}
    </QueryClientProvider>
  );
};

describe('Application Rebranding Tests', () => {
  // Test that the new brand name appears where expected
  test('GIS_BS appears in Dashboard welcome message', () => {
    renderWithProviders(<Dashboard />);
    const welcomeElement = screen.getByText(/GIS_BS property valuation dashboard/i);
    expect(welcomeElement).toBeInTheDocument();
  });

  test('GIS_BS appears in Header', () => {
    renderWithProviders(<Header taxYear="2023" onTaxYearChange={() => {}} />);
    const headerElement = screen.getByText(/GIS_BS/i);
    expect(headerElement).toBeInTheDocument();
  });

  // Test that the old brand name doesn't appear
  test('Spatialest does not appear in Dashboard', () => {
    renderWithProviders(<Dashboard />);
    const oldBrandElements = screen.queryAllByText(/Spatialest/i);
    expect(oldBrandElements.length).toBe(0);
  });

  test('Spatialest does not appear in Header', () => {
    renderWithProviders(<Header taxYear="2023" onTaxYearChange={() => {}} />);
    const oldBrandElements = screen.queryAllByText(/Spatialest/i);
    expect(oldBrandElements.length).toBe(0);
  });

  // Test for proper functioning after rebranding
  test('Dashboard navigation still works with new branding', () => {
    renderWithProviders(<Dashboard />);
    const mapTab = screen.getByText(/Map/);
    expect(mapTab).toBeInTheDocument();
    // Would test click behavior, but we're just verifying presence for now
  });
});