import React, { useState, useEffect } from 'react';
import { usePropertySelection } from '@/components/map/PropertySelectionContext';
import { PropertyInfoPanel } from '@/components/map/PropertyInfoPanel';
import { MapComponent } from '@/components/map/MapComponent';
import { Property, MapLayer } from '@/shared/types';
import { apiRequest } from '@/lib/queryClient';
import {
  ResizablePanel,
  ResizablePanelGroup,
  ResizableHandle
} from '@/components/ui/resizable';

export const MapPanel: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [properties, setProperties] = useState<Property[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const { selectedProperties } = usePropertySelection();
  
  useEffect(() => {
    const fetchProperties = async () => {
      setIsLoading(true);
      try {
        // Fetch properties from the API
        const response = await apiRequest('GET', '/api/properties');
        const data = await response.json();
        setProperties(data as Property[]);
      } catch (error) {
        console.error('Error fetching properties:', error);
        
        // Demo properties for development purposes
        const demoProperties: Property[] = [
          {
            id: '1',
            parcelId: 'P123456',
            address: '123 Main St, Richland, WA',
            owner: 'John Doe',
            value: '450000',
            squareFeet: 2500,
            yearBuilt: 1998,
            landValue: '120000',
            coordinates: [46.2804, -119.2752]
          },
          {
            id: '2',
            parcelId: 'P789012',
            address: '456 Oak Ave, Kennewick, WA',
            owner: 'Jane Smith',
            value: '375000',
            squareFeet: 2100,
            yearBuilt: 2004,
            landValue: '95000',
            coordinates: [46.2087, -119.1361]
          },
          {
            id: '3',
            parcelId: 'P345678',
            address: '789 Pine Ln, Pasco, WA',
            owner: 'Robert Johnson',
            value: '525000',
            squareFeet: 3200,
            yearBuilt: 2012,
            landValue: '150000',
            coordinates: [46.2395, -119.1005]
          }
        ];
        setProperties(demoProperties);
      } finally {
        setIsLoading(false);
      }
    };
    
    fetchProperties();
  }, []);
  
  // Automatically select the first property for the info panel
  useEffect(() => {
    if (properties.length > 0 && !selectedProperty) {
      setSelectedProperty(properties[0]);
    }
  }, [properties, selectedProperty]);
  
  // Show the first selected property in the info panel
  useEffect(() => {
    if (selectedProperties.length > 0) {
      setSelectedProperty(selectedProperties[0]);
    }
  }, [selectedProperties]);
  
  // Set up map layers
  const [mapLayers, setMapLayers] = useState<MapLayer[]>([
    { id: 'imagery', name: 'Imagery', type: 'base', checked: false },
    { id: 'osm', name: 'OpenStreetMap', type: 'base', checked: true },
    { id: 'satellite', name: 'Satellite', type: 'base', checked: false },
    { id: 'parcels', name: 'Parcels', type: 'viewable', checked: true },
    { id: 'zoning', name: 'Zoning', type: 'viewable', checked: false },
    { id: 'flood', name: 'Flood Zones', type: 'viewable', checked: false }
  ]);
  
  // Set up map center to Benton County, WA
  const mapCenter: [number, number] = [46.23, -119.16];
  const mapZoom = 11;
  
  return (
    <div className="h-full w-full">
      <ResizablePanelGroup direction="horizontal" className="h-full">
        <ResizablePanel defaultSize={70} minSize={50}>
          <div className="h-full relative">
            <MapComponent
              properties={properties}
              layers={mapLayers}
              center={mapCenter}
              zoom={mapZoom}
              selectedProperty={selectedProperty}
              onSelectProperty={setSelectedProperty}
            />
            {isLoading && (
              <div className="absolute inset-0 bg-background/80 flex items-center justify-center">
                <div className="text-muted-foreground">Loading map data...</div>
              </div>
            )}
          </div>
        </ResizablePanel>
        
        <ResizableHandle withHandle />
        
        <ResizablePanel defaultSize={30} minSize={25}>
          <PropertyInfoPanel
            property={selectedProperty}
            onClose={() => setSelectedProperty(null)}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
};