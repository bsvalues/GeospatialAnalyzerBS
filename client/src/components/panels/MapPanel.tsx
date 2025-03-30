import React, { useState, useEffect } from 'react';
import { Layers, Map as MapIcon, Search, Plus, Minus, X, Locate } from 'lucide-react';
import LayerControl from '../map/LayerControl';
import PropertyInfoPanel from '../map/PropertyInfoPanel';
import MapComponent from '../map/MapComponent';
import { Property } from '@/shared/types';
import { LatLngExpression } from 'leaflet';

const MapPanel: React.FC = () => {
  // Selected property state
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
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
  
  // Base map configuration
  const [selectedBasemap, setSelectedBasemap] = useState<'osm' | 'satellite' | 'topo'>('osm');
  
  // Base map layers
  const baseLayers = [
    { id: 'osm', name: 'OpenStreetMap', checked: selectedBasemap === 'osm' },
    { id: 'satellite', name: 'Satellite Imagery', checked: selectedBasemap === 'satellite' },
    { id: 'topo', name: 'Topographic', checked: selectedBasemap === 'topo' }
  ];
  
  // Viewable property layers
  const viewableLayers = [
    { id: 'parcels', name: 'Parcels', checked: true },
    { id: 'shortplats', name: 'Short Plats', checked: false },
    { id: 'longplats', name: 'Long Plats', checked: false },
    { id: 'flood', name: 'Flood Zones', checked: false },
    { id: 'welllogs', name: 'Well Logs', checked: false },
    { id: 'zoning', name: 'Zoning', checked: false }
  ];
  
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
  
  // Update baseLayer selection when changed from layer control
  useEffect(() => {
    const checkedLayer = baseLayers.find(layer => layer.checked);
    if (checkedLayer) {
      setSelectedBasemap(checkedLayer.id as 'osm' | 'satellite' | 'topo');
    }
  }, [baseLayers]);
  
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
  
  const updateLayerOption = (option: 'opacity' | 'labels', value: number | boolean) => {
    setLayerOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };
  
  // Handle base layer selection from the layer control
  const handleBaseLayerChange = (layerId: string, checked: boolean) => {
    if (checked && (layerId === 'osm' || layerId === 'satellite' || layerId === 'topo')) {
      setSelectedBasemap(layerId as 'osm' | 'satellite' | 'topo');
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
      />
      
      <div className="flex-1 relative">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 bg-gray-800 rounded shadow-lg z-10">
          <div className="p-1">
            <button 
              className="p-1.5 hover:bg-gray-700 rounded"
              onClick={handleZoomIn}
            >
              <Plus size={16} />
            </button>
          </div>
          <div className="border-t border-gray-700"></div>
          <div className="p-1">
            <button 
              className="p-1.5 hover:bg-gray-700 rounded"
              onClick={handleZoomOut}
            >
              <Minus size={16} />
            </button>
          </div>
          <div className="border-t border-gray-700"></div>
          <div className="p-1">
            <button 
              className="p-1.5 hover:bg-gray-700 rounded"
              title="Locate All Properties"
              onClick={handleLocateAllProperties}
            >
              <Locate size={16} />
            </button>
          </div>
        </div>
        
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
        </div>
        
        {/* Property Info Panel */}
        {selectedProperty && (
          <PropertyInfoPanel property={selectedProperty} onClose={closePropertyInfo} />
        )}
        
        {/* Real Map Component */}
        <div className="w-full h-full">
          <MapComponent 
            center={mapConfig.center}
            zoom={mapConfig.zoom}
            properties={properties}
            onPropertySelect={handlePropertySelect}
            basemapType={selectedBasemap}
            opacity={layerOptions.opacity}
            showLabels={layerOptions.labels}
          />
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
