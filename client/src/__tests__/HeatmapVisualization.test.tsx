import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import HeatmapVisualization from '../components/analysis/HeatmapVisualization';
import { Property } from '@/shared/schema';

// Mock leaflet as it's not available in the test environment
jest.mock('leaflet', () => ({
  latLng: (lat: number, lng: number) => ({ lat, lng }),
  divIcon: jest.fn().mockReturnValue({}),
  heatLayer: jest.fn().mockReturnValue({
    addTo: jest.fn(),
    setLatLngs: jest.fn(),
    redraw: jest.fn(),
    removeFrom: jest.fn(),
  }),
  map: jest.fn().mockReturnValue({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    invalidateSize: jest.fn(),
  }),
}));

// Mock the react-leaflet components
jest.mock('react-leaflet', () => ({
  MapContainer: jest.fn().mockImplementation(({ children }) => <div data-testid="map-container">{children}</div>),
  TileLayer: jest.fn().mockImplementation(() => <div data-testid="tile-layer" />),
  LayerGroup: jest.fn().mockImplementation(({ children }) => <div data-testid="layer-group">{children}</div>),
  useMap: jest.fn().mockReturnValue({
    setView: jest.fn(),
    addLayer: jest.fn(),
    removeLayer: jest.fn(),
    on: jest.fn(),
    off: jest.fn(),
    invalidateSize: jest.fn(),
  }),
}));

// Mock property data
const mockProperties: Property[] = [
  {
    id: 1,
    parcelId: "123",
    address: "123 Main St",
    latitude: 40.7128,
    longitude: -74.006,
    value: "500000",
    yearBuilt: 2000,
    squareFeet: 2000,
    neighborhood: "Downtown",
    propertyType: "Residential",
    lastSaleDate: "2020-01-01",
    salePrice: "450000"
  },
  {
    id: 2,
    parcelId: "456",
    address: "456 Elm St",
    latitude: 40.7129,
    longitude: -74.007,
    value: "600000",
    yearBuilt: 2010,
    squareFeet: 2500,
    neighborhood: "Downtown",
    propertyType: "Residential",
    lastSaleDate: "2021-02-01",
    salePrice: "550000"
  },
  {
    id: 3,
    parcelId: "789",
    address: "789 Oak St",
    latitude: 40.713,
    longitude: -74.008,
    value: null, // Test handling null values
    yearBuilt: 1995,
    squareFeet: 1800,
    neighborhood: "Uptown",
    propertyType: "Residential",
    lastSaleDate: "2019-06-15",
    salePrice: "400000"
  }
];

describe('HeatmapVisualization Component', () => {
  test('should render with default property value parameter', async () => {
    render(<HeatmapVisualization properties={mockProperties} />);
    
    // Verify the component renders
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.getByTestId('heatmap-controls')).toBeInTheDocument();
    expect(screen.getByText('Property Value Heatmap')).toBeInTheDocument();
  });
  
  test('should update visualization when time period changes', async () => {
    render(<HeatmapVisualization properties={mockProperties} />);
    
    // Find and interact with time period selector
    const timeSelector = screen.getByLabelText('Time Period');
    expect(timeSelector).toBeInTheDocument();
    
    // Change time period
    fireEvent.change(timeSelector, { target: { value: '2021' } });
    
    // Verify the time period display updates
    expect(screen.getByText('2021')).toBeInTheDocument();
    
    // Verify the heatmap would update (implementation specific)
    // This would typically check if the redraw or update method was called
    await waitFor(() => {
      expect(screen.getByTestId('heatmap-layer')).toHaveAttribute('data-time-period', '2021');
    });
  });
  
  test('should correctly handle properties with null/undefined values', async () => {
    render(<HeatmapVisualization properties={mockProperties} />);
    
    // Verify that properties with null values are excluded or handled
    // This is implementation specific, but we're checking that the component doesn't crash
    expect(screen.getByTestId('heatmap-layer')).toBeInTheDocument();
    
    // Check for appropriate warning or indicator about excluded properties
    expect(screen.getByText(/2 of 3 properties displayed/i)).toBeInTheDocument();
  });
  
  test('should apply custom color gradients when specified', async () => {
    // Define custom color scheme
    const customColors = {
      start: '#ff0000',
      end: '#0000ff',
    };
    
    render(<HeatmapVisualization properties={mockProperties} colorScheme={customColors} />);
    
    // Find color scheme selector
    const colorSelector = screen.getByLabelText('Color Scheme');
    expect(colorSelector).toBeInTheDocument();
    
    // Verify that the custom colors are applied
    expect(screen.getByTestId('heatmap-layer')).toHaveAttribute('data-color-start', customColors.start);
    expect(screen.getByTestId('heatmap-layer')).toHaveAttribute('data-color-end', customColors.end);
  });
  
  test('should render empty state message when no data available', async () => {
    render(<HeatmapVisualization properties={[]} />);
    
    // Verify empty state is shown
    expect(screen.getByText('No property data available for heatmap visualization.')).toBeInTheDocument();
    
    // Verify map is still rendered, but heatmap layer is not
    expect(screen.getByTestId('map-container')).toBeInTheDocument();
    expect(screen.queryByTestId('heatmap-layer')).not.toBeInTheDocument();
  });
  
  test('should filter properties based on selected criteria', async () => {
    render(<HeatmapVisualization properties={mockProperties} />);
    
    // Find filter controls
    const propertyTypeFilter = screen.getByLabelText('Property Type');
    expect(propertyTypeFilter).toBeInTheDocument();
    
    // Apply filter
    fireEvent.change(propertyTypeFilter, { target: { value: 'Residential' } });
    
    // Verify the filter was applied
    expect(screen.getByTestId('heatmap-layer')).toHaveAttribute('data-filter-type', 'Residential');
    
    // Verify filter count displayed
    expect(screen.getByText(/3 of 3 properties displayed/i)).toBeInTheDocument();
  });
  
  test('should display detailed information for selected heatmap area', async () => {
    render(<HeatmapVisualization properties={mockProperties} />);
    
    // Simulate clicking on a heatmap area
    const heatmapLayer = screen.getByTestId('heatmap-layer');
    fireEvent.click(heatmapLayer);
    
    // Verify detailed information panel appears
    await waitFor(() => {
      expect(screen.getByTestId('heatmap-details-panel')).toBeInTheDocument();
    });
    
    // Check for appropriate summary statistics
    expect(screen.getByText(/Average Value:/i)).toBeInTheDocument();
    expect(screen.getByText(/Property Count:/i)).toBeInTheDocument();
  });
});