import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MapComponent from '@/components/map/MapComponent';
import PropertyInfoPanel from '@/components/map/PropertyInfoPanel';
import { Property } from '@shared/schema';
import { MapLayer, MapOptions } from '@/shared/types';

export interface MapPanelProps {
  className?: string;
}

export const MapPanel: React.FC<MapPanelProps> = ({ className }) => {
  // State for the currently selected property
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // State for properties to compare
  const [compareProperties, setCompareProperties] = useState<Property[]>([]);
  
  // Fetch properties from the API
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    refetchOnWindowFocus: false,
  });
  
  // Define map layers
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    { id: 'osm', name: 'OpenStreetMap', type: 'base', checked: true },
    { id: 'imagery', name: 'Satellite Imagery', type: 'base', checked: false },
    { id: 'topo', name: 'USGS Topographic', type: 'base', checked: false },
    { id: 'parcels', name: 'Property Parcels', type: 'viewable', checked: true },
    { id: 'zoning', name: 'Zoning Districts', type: 'viewable', checked: false },
    { id: 'flood', name: 'Flood Zones', type: 'viewable', checked: false },
    { id: 'heat', name: 'Property Value Heatmap', type: 'analysis', checked: false },
  ]);
  
  // Map options
  const [mapOptions, setMapOptions] = useState<Partial<MapOptions>>({
    center: [46.2800, -119.2680], // Default center on Benton County, WA
    zoom: 11,
    opacity: 1,
    labels: true,
  });
  
  // Handler for selecting a property
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };
  
  // Handler for adding a property to comparison
  const handleAddToCompare = (property: Property) => {
    // Don't add duplicates
    if (!compareProperties.some(p => p.id === property.id)) {
      // Limit to 3 properties for comparison
      if (compareProperties.length < 3) {
        setCompareProperties([...compareProperties, property]);
      } else {
        alert('You can compare up to 3 properties at a time.');
      }
    }
  };
  
  // Handler for closing property info
  const handleClosePropertyInfo = () => {
    setSelectedProperty(null);
  };
  
  return (
    <div className={`flex h-full w-full ${className}`}>
      {/* Map container */}
      <div className="flex-grow h-full">
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <p className="text-gray-500">Loading property data...</p>
          </div>
        ) : error ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <p className="text-red-500">Error loading properties: {error.toString()}</p>
          </div>
        ) : (
          <MapComponent
            properties={properties}
            selectedProperty={selectedProperty}
            onPropertySelect={handlePropertySelect}
            layers={mapLayers}
            mapOptions={mapOptions}
            height="100%"
            width="100%"
          />
        )}
      </div>
      
      {/* Property info sidebar */}
      <div className="w-96 h-full overflow-hidden border-l border-gray-200">
        <PropertyInfoPanel
          property={selectedProperty}
          onClose={handleClosePropertyInfo}
          onCompare={handleAddToCompare}
        />
      </div>
    </div>
  );
};

export default MapPanel;