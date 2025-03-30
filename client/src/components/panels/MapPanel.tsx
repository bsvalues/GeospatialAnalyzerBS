import React, { useState, useEffect, useMemo } from 'react';
import { Layers, Map as MapIcon, Search, Plus, Minus, X, Locate, Info, ArrowRightLeft } from 'lucide-react';
import LayerControl from '../map/LayerControl';
import PropertyInfoPanel from '../map/PropertyInfoPanel';
import MapComponent from '../map/MapComponent';
import MapLegend from '../map/MapLegend';
import { Property } from '@/shared/types';
import { LatLngExpression } from 'leaflet';
import { basemapSources, overlayLayerSources, GisLayerSource } from '../map/layerSources';
import { Button } from '@/components/ui/button';
import { usePropertyComparison } from '../comparison/PropertyComparisonContext';
import PropertySelectionDisplay, { ComparisonCountBadge } from '../comparison/PropertySelectionDisplay';

// Interface for Layer Items
interface LayerItem {
  id: string;
  name: string;
  checked: boolean;
}

const MapPanel: React.FC = () => {
  // Selected property state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  // Property comparison state
  const [showPropertySelection, setShowPropertySelection] = useState(false);
  const { selectedProperties } = usePropertyComparison();
  
  // Sample property data with coordinates from Benton County, Washington
  const [properties, setProperties] = useState<Property[]>([
    {
      id: "prop1",
      address: "123 Jadwin Ave, Richland",
      parcelId: "1-0425-100-0129-000",
      salePrice: "$375,000",
      squareFeet: 2300,
      yearBuilt: 2005,
      landValue: "$125,000",
      coordinates: [46.2804, -119.2752] // Richland, Benton County
    },
    {
      id: "prop2",
      address: "456 Columbia Center Blvd, Kennewick",
      parcelId: "1-0425-200-0213-000",
      salePrice: "$425,000",
      squareFeet: 3150,
      yearBuilt: 2010,
      coordinates: [46.2087, -119.2022] // Kennewick, Benton County
    },
    {
      id: "prop3",
      address: "789 Edison St, Kennewick",
      parcelId: "1-0426-500-0052-000",
      salePrice: "$295,000",
      squareFeet: 1320,
      yearBuilt: 1998,
      coordinates: [46.2115, -119.1868] // East Kennewick, Benton County
    },
    {
      id: "prop4",
      address: "321 9th St, Benton City",
      parcelId: "1-0427-300-0178-000",
      salePrice: "$265,000",
      squareFeet: 1750,
      yearBuilt: 2001,
      coordinates: [46.2631, -119.4871] // Benton City, Benton County
    },
    {
      id: "prop5",
      address: "555 Keene Rd, Richland",
      parcelId: "1-0425-700-0092-000",
      salePrice: "$395,000",
      squareFeet: 2650,
      yearBuilt: 2008,
      coordinates: [46.2392, -119.2802] // South Richland, Benton County
    }
  ]);
  
  // Base map configuration - using string ID for more flexibility
  const [selectedBasemap, setSelectedBasemap] = useState<string>('osm');
  
  // Create base map layer items from our sources
  const baseLayers: LayerItem[] = Object.keys(basemapSources).map(key => ({
    id: key,
    name: basemapSources[key].name,
    checked: key === selectedBasemap
  }));
  
  // Create viewable layer items from our overlay sources
  const [viewableLayers, setViewableLayers] = useState<LayerItem[]>(
    overlayLayerSources.map(layer => ({
      id: layer.id,
      name: layer.name,
      checked: layer.id === 'parcels' // Only parcels are checked by default
    }))
  );
  
  // Track visible layers for the map
  const [visibleOverlayLayers, setVisibleOverlayLayers] = useState<string[]>(['parcels']);
  
  // Layer options
  const [layerOptions, setLayerOptions] = useState({
    opacity: 80,
    labels: true
  });
  
  // Map configuration - centered on Benton County, Washington
  const [mapConfig, setMapConfig] = useState({
    center: [46.2400, -119.2800] as LatLngExpression, // Center of Benton County, WA
    zoom: 11
  });
  
  const [searchText, setSearchText] = useState('');
  
  // Handle searching properties
  const handleSearch = () => {
    if (!searchText) return;
    
    const found = properties.find(property => 
      property.address.toLowerCase().includes(searchText.toLowerCase()) ||
      property.parcelId.toLowerCase().includes(searchText.toLowerCase())
    );
    
    if (found && found.coordinates) {
      // Update map to center on the found property
      setMapConfig({
        center: found.coordinates as LatLngExpression,
        zoom: 15
      });
      // Select the property
      setSelectedProperty(found);
    }
  };
  
  // Update layer options (opacity, labels)
  const updateLayerOption = (option: 'opacity' | 'labels', value: number | boolean) => {
    setLayerOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };
  
  // Handle base layer selection from the layer control
  const handleBaseLayerChange = (layerId: string, checked: boolean) => {
    if (checked && basemapSources[layerId]) {
      setSelectedBasemap(layerId);
      
      // Update baseLayers checked states
      const updatedBaseLayers = baseLayers.map(layer => ({
        ...layer,
        checked: layer.id === layerId
      }));
    }
  };
  
  // Handle viewable layer selection from the layer control
  const handleViewableLayerChange = (layerId: string, checked: boolean) => {
    // Update the viewableLayers state
    setViewableLayers(prev => 
      prev.map(layer => 
        layer.id === layerId 
          ? { ...layer, checked } 
          : layer
      )
    );
    
    // Update the visible layers for the map
    if (checked) {
      setVisibleOverlayLayers(prev => [...prev, layerId]);
    } else {
      setVisibleOverlayLayers(prev => prev.filter(id => id !== layerId));
    }
  };
  
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
  };
  
  const closePropertyInfo = () => {
    setSelectedProperty(null);
  };
  
  // Zoom controls
  const handleZoomIn = () => {
    setMapConfig(prev => ({
      ...prev,
      zoom: Math.min(prev.zoom + 1, 18)
    }));
  };
  
  const handleZoomOut = () => {
    setMapConfig(prev => ({
      ...prev,
      zoom: Math.max(prev.zoom - 1, 1)
    }));
  };
  
  // Reset view to show all properties
  const handleLocateAllProperties = () => {
    setMapConfig({
      center: [46.2400, -119.2800], // Center of Benton County
      zoom: 11
    });
    setSelectedProperty(null);
  };

  return (
    <div className="flex h-full">
      <LayerControl 
        baseLayers={baseLayers}
        viewableLayers={viewableLayers}
        layerOptions={layerOptions}
        onUpdateLayerOption={updateLayerOption}
        onBaseLayerChange={handleBaseLayerChange}
        onViewableLayerChange={handleViewableLayerChange}
      />
      
      <div className="flex-1 relative">
        {/* Map controls now handled by the CustomMapControls component */}
        
        {/* Map Search */}
        <div className="absolute top-4 left-4 w-72 z-10">
          <div className="relative">
            <input 
              type="text" 
              placeholder="Search parcels or addresses..." 
              className="w-full bg-gray-800 border border-gray-700 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8 shadow-lg"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
            />
            <Search 
              size={16} 
              className="text-gray-400 absolute left-2.5 top-2.5 cursor-pointer" 
              onClick={handleSearch}
            />
          </div>
          
          {/* Comparison Counter Button */}
          <div className="mt-2 flex justify-between items-center">
            <Button 
              variant="outline" 
              size="sm" 
              className="text-xs bg-opacity-90 hover:bg-opacity-100"
              onClick={() => setShowPropertySelection(!showPropertySelection)}
            >
              <ArrowRightLeft className="h-3 w-3 mr-1" />
              Compare Properties
            </Button>
            {selectedProperties.length > 0 && (
              <ComparisonCountBadge onClick={() => setShowPropertySelection(!showPropertySelection)} />
            )}
          </div>
        </div>
        
        {/* Property Selection Panel */}
        {showPropertySelection && (
          <div className="absolute top-24 left-4 z-10">
            <PropertySelectionDisplay onClose={() => setShowPropertySelection(false)} />
          </div>
        )}
        
        {/* Property Info Panel */}
        {selectedProperty && (
          <PropertyInfoPanel property={selectedProperty} onClose={closePropertyInfo} />
        )}
        
        {/* Enhanced Map Component with GIS Layers */}
        <div className="w-full h-full">
          <MapComponent 
            center={mapConfig.center}
            zoom={mapConfig.zoom}
            properties={properties}
            onPropertySelect={handlePropertySelect}
            basemapType={selectedBasemap}
            opacity={layerOptions.opacity}
            showLabels={layerOptions.labels}
            visibleLayers={visibleOverlayLayers}
          />
          
          {/* Map Legend */}
          {visibleOverlayLayers.length > 0 && (
            <MapLegend 
              visibleLayers={overlayLayerSources.filter(layer => 
                visibleOverlayLayers.includes(layer.id)
              )}
            />
          )}
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
