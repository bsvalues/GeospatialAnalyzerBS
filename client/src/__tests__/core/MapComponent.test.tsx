/**
 * MapComponent Core Test
 * 
 * Tests the basic functionality of the MapComponent, specifically checking
 * if it renders correctly with minimal dependencies.
 */
import React from 'react';
import { render, screen } from '@testing-library/react';
import { MapComponent } from '../../components/map/MapComponent';

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
  Icon: {
    Default: {
      mergeOptions: jest.fn(),
    },
  },
}));

describe('MapComponent', () => {
  test('renders the map container', () => {
    render(<MapComponent />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toBeInTheDocument();
  });
  
  test('applies custom height', () => {
    render(<MapComponent height="400px" />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveStyle('height: 400px');
  });
  
  test('applies custom width', () => {
    render(<MapComponent width="50%" />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveStyle('width: 50%');
  });
  
  test('applies custom class name', () => {
    render(<MapComponent className="custom-map" />);
    
    const mapContainer = screen.getByTestId('map-container');
    expect(mapContainer).toHaveClass('custom-map');
  });
});