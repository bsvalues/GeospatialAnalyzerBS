import React, { useState } from 'react';
import { X, ChevronDown, ChevronUp, Info } from 'lucide-react';
import { GisLayerSource } from './layerSources';
import { cn } from '@/lib/utils';

interface MapLegendProps {
  visibleLayers: GisLayerSource[];
  className?: string;
}

const MapLegend: React.FC<MapLegendProps> = ({ visibleLayers, className }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);

  // Don't render if there are no visible layers
  if (visibleLayers.length === 0) {
    return null;
  }

  // Map layer ID to color and symbol for legend
  const legendItems: Record<string, { color: string; label: string; pattern?: string }> = {
    'parcels': { 
      color: '#3b82f6', 
      label: 'Parcels',
      pattern: 'border-2 border-dashed'
    },
    'zoning': { 
      color: '#f97316', 
      label: 'Zoning',
      pattern: 'opacity-70'
    },
    'floodZones': { 
      color: '#38bdf8', 
      label: 'Flood Zones',
      pattern: 'opacity-50 bg-gradient-to-br from-blue-300 to-blue-500'
    },
    'wetlands': { 
      color: '#22c55e', 
      label: 'Wetlands',
      pattern: 'opacity-60 bg-gradient-to-br from-green-300 to-green-600'
    },
    'schools': { 
      color: '#fcd34d', 
      label: 'School Districts',
      pattern: 'border border-dashed opacity-70'
    },
    'aerials2021': { 
      color: '#a78bfa', 
      label: '2021 Aerial Photos'
    }
  };

  return (
    <div 
      className={cn(
        "absolute z-10 bg-gray-800 border border-gray-700 rounded-md shadow-lg transition-all",
        isMinimized ? "h-10 w-10" : "max-w-xs",
        isExpanded ? "max-h-96" : "max-h-56",
        className || "right-4 bottom-4"
      )}
    >
      {/* Header */}
      <div className="p-2 flex items-center justify-between bg-gray-750 rounded-t-md">
        {!isMinimized ? (
          <>
            <h3 className="text-sm font-medium flex items-center">
              <Info size={14} className="mr-1.5 text-blue-400" />
              Map Legend
            </h3>
            <div className="flex items-center space-x-1">
              <button 
                onClick={() => setIsExpanded(!isExpanded)}
                className="p-1 hover:bg-gray-700 rounded-md"
              >
                {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
              </button>
              <button 
                onClick={() => setIsMinimized(true)}
                className="p-1 hover:bg-gray-700 rounded-md"
              >
                <X size={14} />
              </button>
            </div>
          </>
        ) : (
          <button 
            onClick={() => setIsMinimized(false)}
            className="w-full h-full flex items-center justify-center"
          >
            <Info size={16} className="text-blue-400" />
          </button>
        )}
      </div>
      
      {/* Legend Content */}
      {!isMinimized && (
        <div className="p-2 overflow-y-auto">
          <div className="space-y-2">
            {visibleLayers.map(layer => {
              const legendItem = legendItems[layer.id];
              if (!legendItem) return null;
              
              return (
                <div key={layer.id} className="flex items-center">
                  <div 
                    className={cn(
                      "w-5 h-5 rounded mr-2", 
                      legendItem.pattern,
                    )}
                    style={{ backgroundColor: legendItem.color }}
                  />
                  <span className="text-xs">{legendItem.label}</span>
                </div>
              );
            })}
          </div>
          
          {/* Additional info if expanded */}
          {isExpanded && (
            <div className="mt-3 pt-3 border-t border-gray-700">
              <h4 className="text-xs font-medium mb-1.5 text-gray-300">About GIS Layers</h4>
              <p className="text-xs text-gray-400 mb-2">
                GIS data layers provide specialized information about properties and geographic features.
                Toggle layers in the left panel to show different types of property data.
              </p>
              <p className="text-xs text-gray-400">
                Data sourced from Benton County GIS, FEMA, and other public sources.
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MapLegend;