/**
 * Analysis Page Core Test
 * 
 * Tests the basic functionality of the Analysis page, checking if
 * it renders correctly with the map component.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import AnalysisPage from '../../pages/Analysis';

// Mock the leaflet library to avoid DOM manipulation issues
jest.mock('leaflet', () => ({
  map: jest.fn(() => ({
    setView: jest.fn(),
    remove: jest.fn(),
    addLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
  })),
  tileLayer: jest.fn(() => ({
    addTo: jest.fn(),
  })),
  // Mock other leaflet functions as needed
}));

// Mock any components that might cause issues
jest.mock('../../components/map/MapComponent', () => ({
  MapComponent: () => <div data-testid="map-component">Map Component</div>
}));

describe('Analysis Page', () => {
  test('renders the page title', () => {
    render(<AnalysisPage />);
    
    // Check if the page title is rendered
    expect(screen.getByText('Property Analysis')).toBeInTheDocument();
  });
  
  test('renders the map container', () => {
    render(<AnalysisPage />);
    
    // Check if the map container exists
    const mapContainer = document.querySelector('.map-container');
    expect(mapContainer).not.toBeNull();
  });
  
  test('renders the analysis controls', () => {
    render(<AnalysisPage />);
    
    // Check if the New Analysis button exists
    expect(screen.getByText('New Analysis')).toBeInTheDocument();
  });
});