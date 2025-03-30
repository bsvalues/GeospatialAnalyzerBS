import React, { useState, useEffect } from 'react';
import { useQuery } from '@tanstack/react-query';
import MapComponent from '@/components/map/MapComponent';
import PropertyInfoPanel from '@/components/map/PropertyInfoPanel';
import PropertyFilterPanel from '@/components/filters/PropertyFilterPanel';
import { Property } from '@shared/schema';
import { MapLayer, MapOptions } from '@/shared/types';
import { usePropertyFilter } from '@/contexts/PropertyFilterContext';
import { 
  Layers, 
  Search, 
  Filter, 
  BarChart, 
  Share2, 
  Download, 
  Printer, 
  Maximize2, 
  X 
} from 'lucide-react';

export interface MapPanelProps {
  className?: string;
}

export const MapPanel: React.FC<MapPanelProps> = ({ className }) => {
  // State for the currently selected property
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  
  // State for properties to compare
  const [compareProperties, setCompareProperties] = useState<Property[]>([]);
  
  // State for the panel UI
  const [showLayerPanel, setShowLayerPanel] = useState(false);
  const [showFilterPanel, setShowFilterPanel] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFullScreen, setIsFullScreen] = useState(false);
  
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
    { id: 'schools', name: 'Schools', type: 'viewable', checked: false },
    { id: 'contour', name: 'Elevation Contours', type: 'viewable', checked: false },
    { id: 'landuse', name: 'Land Use', type: 'viewable', checked: false },
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
  
  // Handler for removing a property from comparison
  const handleRemoveFromCompare = (propertyId: number) => {
    setCompareProperties(compareProperties.filter(p => p.id !== propertyId));
  };
  
  // Handler for closing property info
  const handleClosePropertyInfo = () => {
    setSelectedProperty(null);
  };
  
  // Handler for toggling a layer's visibility
  const handleLayerToggle = (layerId: string) => {
    setMapLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.id === layerId 
          ? { ...layer, checked: !layer.checked } 
          : layer
      )
    );
  };
  
  // Handler for changing base layer
  const handleBaseLayerChange = (layerId: string) => {
    setMapLayers(prevLayers => 
      prevLayers.map(layer => 
        layer.type === 'base' 
          ? { ...layer, checked: layer.id === layerId } 
          : layer
      )
    );
  };
  
  // Handler for toggling fullscreen
  const handleToggleFullScreen = () => {
    setIsFullScreen(!isFullScreen);
  };
  
  // Get the property filter context
  const { filters, applyFilters } = usePropertyFilter();
  
  // Filter properties based on search query and property filters
  const searchFilteredProperties = searchQuery 
    ? properties.filter(property => 
        property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
        property.parcelId.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (property.owner && property.owner.toLowerCase().includes(searchQuery.toLowerCase()))
      )
    : properties;
    
  // Apply property filters if they are active
  const filteredProperties = filters.isActive 
    ? applyFilters(searchFilteredProperties)
    : searchFilteredProperties;
  
  return (
    <div className={`flex h-full w-full ${className} ${isFullScreen ? 'fixed inset-0 z-50 bg-white' : ''}`}>
      {/* Map container */}
      <div className={`flex-grow h-full relative ${isFullScreen ? 'w-full' : ''}`}>
        {/* Map toolbar */}
        <div className="absolute top-0 left-0 right-0 z-10 bg-white bg-opacity-90 px-4 py-2 shadow-sm flex items-center">
          <div className="flex items-center space-x-2 mr-4">
            <button 
              onClick={() => setShowLayerPanel(!showLayerPanel)}
              className={`p-2 rounded-md ${showLayerPanel ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'}`}
              title="Toggle layer panel"
            >
              <Layers className="h-5 w-5" />
            </button>
            <button 
              onClick={() => setShowFilterPanel(!showFilterPanel)}
              className={`p-2 rounded-md relative ${showFilterPanel ? 'bg-primary/10 text-primary' : 'text-gray-600 hover:bg-gray-100'} ${filters.isActive ? 'text-primary' : ''}`}
              title="Toggle filter panel"
            >
              <Filter className="h-5 w-5" />
              {filters.isActive && (
                <span className="absolute top-0 right-0 h-2.5 w-2.5 bg-primary rounded-full"></span>
              )}
            </button>
          </div>
          
          <div className="flex-grow relative">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search properties by address, parcel ID, or owner"
              className="w-full py-1.5 pl-8 pr-3 border border-gray-300 rounded-md focus:outline-none focus:ring-1 focus:ring-primary/50"
            />
            <Search className="absolute left-2 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            {searchQuery && (
              <button 
                onClick={() => setSearchQuery('')}
                className="absolute right-2 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
              >
                <X className="h-4 w-4" />
              </button>
            )}
          </div>
          
          <div className="flex items-center space-x-1 ml-4">
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Value analysis">
              <BarChart className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Share map">
              <Share2 className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Export data">
              <Download className="h-5 w-5" />
            </button>
            <button className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" title="Print map">
              <Printer className="h-5 w-5" />
            </button>
            <button 
              onClick={handleToggleFullScreen}
              className="p-2 text-gray-600 hover:bg-gray-100 rounded-md" 
              title={isFullScreen ? "Exit fullscreen" : "Enter fullscreen"}
            >
              <Maximize2 className="h-5 w-5" />
            </button>
          </div>
        </div>
        
        {/* Layer panel */}
        {showLayerPanel && (
          <div className="absolute top-14 left-4 z-10 bg-white rounded-md shadow-md border border-gray-200 w-64 max-h-[60vh] overflow-y-auto">
            <div className="p-3 border-b border-gray-200">
              <h3 className="font-medium text-gray-800">Map Layers</h3>
            </div>
            <div className="p-3">
              <h4 className="text-sm font-medium text-gray-500 mb-2">Base Maps</h4>
              {mapLayers.filter(layer => layer.type === 'base').map(layer => (
                <div key={layer.id} className="flex items-center mb-2">
                  <input
                    type="radio"
                    id={`base-${layer.id}`}
                    checked={layer.checked}
                    onChange={() => handleBaseLayerChange(layer.id)}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor={`base-${layer.id}`} className="text-sm">{layer.name}</label>
                </div>
              ))}
              
              <h4 className="text-sm font-medium text-gray-500 mt-4 mb-2">Overlay Layers</h4>
              {mapLayers.filter(layer => layer.type === 'viewable' || layer.type === 'analysis').map(layer => (
                <div key={layer.id} className="flex items-center mb-2">
                  <input
                    type="checkbox"
                    id={`layer-${layer.id}`}
                    checked={layer.checked}
                    onChange={() => handleLayerToggle(layer.id)}
                    className="mr-2 accent-primary"
                  />
                  <label htmlFor={`layer-${layer.id}`} className="text-sm">{layer.name}</label>
                </div>
              ))}
            </div>
          </div>
        )}
        
        {/* Property Filter Panel */}
        {showFilterPanel && (
          <div className="absolute top-14 left-4 z-10 w-[350px]">
            <PropertyFilterPanel className="w-full" />
          </div>
        )}
        
        {isLoading ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <div className="text-center">
              <div className="animate-spin h-10 w-10 border-4 border-primary/30 border-t-primary rounded-full mx-auto mb-4"></div>
              <p className="text-gray-500">Loading property data...</p>
            </div>
          </div>
        ) : error ? (
          <div className="h-full w-full flex items-center justify-center bg-gray-100">
            <div className="text-center max-w-md px-4">
              <div className="text-red-500 bg-red-100 p-4 rounded-lg inline-block mb-3">
                <X className="h-8 w-8 mx-auto" />
              </div>
              <p className="text-red-600 font-medium">Error loading properties</p>
              <p className="text-sm text-gray-600 mt-1">{error.toString()}</p>
              <button 
                className="mt-4 px-4 py-2 bg-primary/90 text-white rounded-md hover:bg-primary text-sm"
                onClick={() => window.location.reload()}
              >
                Retry
              </button>
            </div>
          </div>
        ) : (
          <MapComponent
            properties={filteredProperties}
            selectedProperty={selectedProperty}
            onPropertySelect={handlePropertySelect}
            layers={mapLayers}
            mapOptions={mapOptions}
            height="100%"
            width="100%"
          />
        )}
        
        {/* Results stats */}
        {!isLoading && !error && (
          <div className="absolute bottom-4 left-4 z-10 bg-white bg-opacity-90 px-3 py-1.5 rounded-md shadow-sm text-sm">
            <span className="font-medium">{filteredProperties.length}</span> properties found 
            {searchQuery && <span> for <span className="italic">"{searchQuery}"</span></span>}
            {filters.isActive && (
              <span className="ml-1 text-primary">
                ({filters.activeFilterCount} active filter{filters.activeFilterCount !== 1 ? 's' : ''})
              </span>
            )}
          </div>
        )}
      </div>
      
      {/* Property info sidebar */}
      <div className={`w-96 h-full overflow-hidden border-l border-gray-200 ${isFullScreen ? 'bg-white' : ''}`}>
        <PropertyInfoPanel
          property={selectedProperty}
          onClose={handleClosePropertyInfo}
          onCompare={handleAddToCompare}
        />
        
        {/* Compare properties list */}
        {compareProperties.length > 0 && (
          <div className="border-t border-gray-200 p-3">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-sm font-medium text-gray-700">Properties to Compare ({compareProperties.length}/3)</h3>
              {compareProperties.length >= 2 && (
                <button className="text-xs px-2 py-1 bg-primary text-white rounded hover:bg-primary/90">
                  Compare Now
                </button>
              )}
            </div>
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {compareProperties.map(property => (
                <div key={property.id} className="flex justify-between items-center bg-gray-50 p-2 rounded text-sm">
                  <div className="truncate flex-grow">
                    <div className="font-medium truncate">{property.address}</div>
                    <div className="text-xs text-gray-500">{property.value || 'No value'}</div>
                  </div>
                  <button 
                    onClick={() => handleRemoveFromCompare(property.id)}
                    className="text-gray-400 hover:text-red-500 ml-2"
                    title="Remove from comparison"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MapPanel;