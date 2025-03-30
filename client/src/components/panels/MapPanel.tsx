import React, { useState } from 'react';
import { Layers, Map, Search, Plus, Minus, X } from 'lucide-react';
import LayerControl from '../map/LayerControl';
import PropertyInfoPanel from '../map/PropertyInfoPanel';

const MapPanel: React.FC = () => {
  const [selectedProperty, setSelectedProperty] = useState<{
    id: string;
    address: string;
    parcelId: string;
    salePrice: string;
    squareFeet: number;
    yearBuilt: number;
    landValue: string;
  } | null>({
    id: "prop1",
    address: "123 Main Street",
    parcelId: "10425-01-29",
    salePrice: "$375,000",
    squareFeet: 2300,
    yearBuilt: 2005,
    landValue: "$125,000"
  });
  
  // Base map layers
  const baseLayers = [
    { id: 'imagery', name: 'Imagery', checked: true },
    { id: 'street', name: 'Street Map', checked: true },
    { id: 'topo', name: 'Topo', checked: false },
    { id: 'flood', name: 'FEMA Flood', checked: false },
    { id: 'usgs', name: 'USGS Imagery', checked: false }
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
  
  const updateLayerOption = (option: 'opacity' | 'labels', value: number | boolean) => {
    setLayerOptions(prev => ({
      ...prev,
      [option]: value
    }));
  };
  
  const closePropertyInfo = () => {
    setSelectedProperty(null);
  };

  return (
    <div className="flex h-full">
      <LayerControl 
        baseLayers={baseLayers}
        viewableLayers={viewableLayers}
        layerOptions={layerOptions}
        onUpdateLayerOption={updateLayerOption}
      />
      
      <div className="flex-1 relative bg-gradient-to-br from-gray-800 to-gray-900">
        {/* Map Controls */}
        <div className="absolute top-4 right-4 bg-gray-800 rounded shadow-lg z-10">
          <div className="p-1">
            <button className="p-1.5 hover:bg-gray-700 rounded">
              <Plus size={16} />
            </button>
          </div>
          <div className="border-t border-gray-700"></div>
          <div className="p-1">
            <button className="p-1.5 hover:bg-gray-700 rounded">
              <Minus size={16} />
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
            />
            <Search size={16} className="text-gray-400 absolute left-2.5 top-2.5" />
          </div>
        </div>
        
        {/* Property Info Panel */}
        {selectedProperty && (
          <PropertyInfoPanel property={selectedProperty} onClose={closePropertyInfo} />
        )}
        
        {/* Map Content Placeholder */}
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="absolute inset-0 opacity-30 bg-gray-900"></div>
          <div className="relative w-full h-full">
            {/* Map Markers */}
            <div className="absolute top-1/4 left-1/4 h-4 w-4">
              <div className="absolute inset-0 bg-blue-500 rounded-full opacity-90 shadow-lg"></div>
            </div>
            <div className="absolute top-1/3 right-1/3 h-4 w-4">
              <div className="absolute inset-0 bg-blue-500 rounded-full opacity-90 shadow-lg"></div>
            </div>
            <div className="absolute bottom-1/3 right-1/4 h-5 w-5">
              <div className="absolute inset-0 bg-green-500 rounded-full opacity-90 shadow-lg"></div>
            </div>
            <div className="absolute bottom-1/4 left-1/3 h-4 w-4">
              <div className="absolute inset-0 bg-blue-500 rounded-full opacity-90 shadow-lg"></div>
            </div>
          </div>
          
          {/* Placeholder for empty state */}
          <div className="bg-gray-800 bg-opacity-70 px-12 py-6 rounded-lg text-center shadow-lg">
            <Map size={60} className="mx-auto mb-4 text-blue-400" />
            <h3 className="text-xl font-semibold mb-2">GIS Map View</h3>
            <p className="text-gray-300">Interactive property mapping with real-time data integration</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MapPanel;
