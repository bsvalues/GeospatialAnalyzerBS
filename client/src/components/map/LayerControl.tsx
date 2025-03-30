import React, { useState } from 'react';
import { Layers, Search, Globe, MapPin, Map } from 'lucide-react';

interface LayerItem {
  id: string;
  name: string;
  checked: boolean;
}

interface LayerOptions {
  opacity: number;
  labels: boolean;
}

interface LayerControlProps {
  baseLayers: LayerItem[];
  viewableLayers: LayerItem[];
  layerOptions: LayerOptions;
  onUpdateLayerOption: (option: 'opacity' | 'labels', value: number | boolean) => void;
  onBaseLayerChange?: (layerId: string, checked: boolean) => void;
  onViewableLayerChange?: (layerId: string, checked: boolean) => void;
}

const LayerControl: React.FC<LayerControlProps> = ({
  baseLayers,
  viewableLayers,
  layerOptions,
  onUpdateLayerOption,
  onBaseLayerChange,
  onViewableLayerChange
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  // Filter layers based on search term
  const filteredBaseLayers = baseLayers.filter(layer => 
    layer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const filteredViewableLayers = viewableLayers.filter(layer => 
    layer.name.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  // Handle base layer change (radio button behavior - only one can be active)
  const handleBaseLayerChange = (layerId: string, checked: boolean) => {
    if (onBaseLayerChange) {
      onBaseLayerChange(layerId, checked);
    }
  };
  
  // Handle viewable layer change
  const handleViewableLayerChange = (layerId: string, checked: boolean) => {
    if (onViewableLayerChange) {
      onViewableLayerChange(layerId, checked);
    }
  };
  
  // Get icon for base layer type
  const getLayerIcon = (layerId: string) => {
    switch (layerId) {
      case 'osm':
        return <Map size={14} className="text-green-400 mr-2" />;
      case 'satellite':
        return <Globe size={14} className="text-blue-400 mr-2" />;
      case 'topo':
        return <Layers size={14} className="text-purple-400 mr-2" />;
      default:
        return <Map size={14} className="text-gray-400 mr-2" />;
    }
  };
  
  return (
    <div className="w-64 bg-gray-800 border-r border-gray-700 p-4 flex flex-col overflow-auto">
      <h2 className="font-bold text-lg mb-4 flex items-center">
        <Layers size={18} className="mr-2 text-blue-500" />
        Map Layers
      </h2>
      
      {/* Search Input */}
      <div className="relative mb-4">
        <input 
          type="text" 
          placeholder="Search layers..." 
          className="w-full bg-gray-700 border border-gray-600 rounded px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent pl-8"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
        />
        <Search size={16} className="text-gray-400 absolute left-2.5 top-2.5" />
      </div>
      
      {/* Base Layers Section */}
      <h3 className="text-sm font-medium text-blue-400 mt-2 mb-2">Base Layers</h3>
      <div className="space-y-2 mb-4">
        {filteredBaseLayers.map((layer) => (
          <div key={layer.id} className="flex items-center p-2 rounded hover:bg-gray-700">
            <input 
              type="radio" 
              id={`layer-${layer.id}`} 
              name="baseLayer"
              className="mr-2" 
              checked={layer.checked}
              onChange={(e) => handleBaseLayerChange(layer.id, e.target.checked)}
            />
            <label htmlFor={`layer-${layer.id}`} className="cursor-pointer flex-1 text-sm flex items-center">
              {getLayerIcon(layer.id)}
              {layer.name}
            </label>
          </div>
        ))}
      </div>
      
      {/* Viewable Layers Section */}
      <h3 className="text-sm font-medium text-blue-400 mt-4 mb-2">Viewable Layers</h3>
      <div className="space-y-2 mb-4">
        {filteredViewableLayers.map((layer) => (
          <div key={layer.id} className="flex items-center p-2 rounded hover:bg-gray-700">
            <input 
              type="checkbox" 
              id={`viewlayer-${layer.id}`} 
              className="mr-2" 
              checked={layer.checked}
              onChange={(e) => handleViewableLayerChange(layer.id, e.target.checked)}
            />
            <label htmlFor={`viewlayer-${layer.id}`} className="cursor-pointer flex-1 text-sm flex items-center">
              <MapPin size={14} className="text-blue-400 mr-2" />
              {layer.name}
            </label>
          </div>
        ))}
      </div>
      
      {/* Layer Options */}
      <div className="bg-gray-750 rounded p-3 mt-auto border border-gray-700">
        <h3 className="text-sm font-medium mb-2">Layer Options</h3>
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm">Opacity</span>
            <input 
              type="range" 
              min="0" 
              max="100" 
              value={layerOptions.opacity} 
              onChange={(e) => onUpdateLayerOption('opacity', parseInt(e.target.value))}
              className="w-24" 
            />
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm">Labels</span>
            <label className="inline-flex items-center cursor-pointer">
              <div className="relative">
                <input 
                  type="checkbox" 
                  className="sr-only peer" 
                  checked={layerOptions.labels}
                  onChange={(e) => onUpdateLayerOption('labels', e.target.checked)}
                />
                <div className="w-9 h-5 bg-gray-600 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-blue-600"></div>
              </div>
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LayerControl;
