import React, { useState } from 'react';
import { X, Home, Coins, MapPin, Ruler, CalendarClock, Binary, Layers, ChevronDown, ChevronUp, Map, FileText } from 'lucide-react';
import { Property } from '@/shared/types';
import { overlayLayerSources } from './layerSources';
import { 
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";

interface PropertyInfoPanelProps {
  property: Property;
  onClose: () => void;
}

const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({ property, onClose }) => {
  const [showGisInfo, setShowGisInfo] = useState(false);
  
  // Mock GIS layer data for this property (in a real app, this would be fetched based on property location)
  const gisInfo = [
    { 
      id: 'zoning', 
      label: 'Zoning', 
      value: 'R-1 (Residential Single Family)' 
    },
    { 
      id: 'floodZones', 
      label: 'Flood Zone', 
      value: 'Zone X (Minimal Risk)' 
    },
    { 
      id: 'schools', 
      label: 'School District', 
      value: 'Richland School District' 
    }
  ];
  
  return (
    <div className="absolute top-16 right-4 w-80 bg-gray-800 rounded shadow-lg z-20 border border-gray-700">
      <div className="p-4">
        <div className="flex justify-between items-center mb-3">
          <h3 className="font-bold text-md">Property Details</h3>
          <button 
            onClick={onClose}
            className="hover:bg-gray-700 p-1 rounded-full"
          >
            <X size={18} />
          </button>
        </div>
        
        <div className="space-y-3">
          <div className="flex items-start">
            <Home size={16} className="mt-0.5 mr-3 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs text-gray-400">Address</div>
              <div className="text-sm font-medium">{property.address}</div>
            </div>
          </div>
          
          <div className="flex items-start">
            <Binary size={16} className="mt-0.5 mr-3 text-blue-400 shrink-0" />
            <div>
              <div className="text-xs text-gray-400">Parcel ID</div>
              <div className="text-sm font-medium">{property.parcelId}</div>
            </div>
          </div>
          
          {property.salePrice && (
            <div className="flex items-start">
              <Coins size={16} className="mt-0.5 mr-3 text-green-400 shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Sale Price</div>
                <div className="text-sm font-medium">{property.salePrice}</div>
              </div>
            </div>
          )}
          
          <div className="flex items-start">
            <Ruler size={16} className="mt-0.5 mr-3 text-purple-400 shrink-0" />
            <div>
              <div className="text-xs text-gray-400">Building Size</div>
              <div className="text-sm font-medium">{property.squareFeet.toLocaleString()} sq ft</div>
            </div>
          </div>
          
          {property.yearBuilt && (
            <div className="flex items-start">
              <CalendarClock size={16} className="mt-0.5 mr-3 text-yellow-400 shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Year Built</div>
                <div className="text-sm font-medium">{property.yearBuilt}</div>
              </div>
            </div>
          )}
          
          {property.landValue && (
            <div className="flex items-start">
              <MapPin size={16} className="mt-0.5 mr-3 text-red-400 shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Land Value</div>
                <div className="text-sm font-medium">{property.landValue}</div>
              </div>
            </div>
          )}
          
          {property.coordinates && (
            <div className="flex items-start">
              <MapPin size={16} className="mt-0.5 mr-3 text-blue-400 shrink-0" />
              <div>
                <div className="text-xs text-gray-400">Coordinates</div>
                <div className="text-sm font-medium">
                  {property.coordinates[0].toFixed(5)}, {property.coordinates[1].toFixed(5)}
                </div>
              </div>
            </div>
          )}
          
          {/* GIS Information Collapsible Section */}
          <div className="mt-3">
            <Collapsible
              open={showGisInfo}
              onOpenChange={setShowGisInfo}
              className="border border-gray-700 rounded overflow-hidden"
            >
              <CollapsibleTrigger asChild>
                <button className="flex items-center justify-between w-full p-2 text-sm font-medium bg-gray-750 hover:bg-gray-700">
                  <div className="flex items-center">
                    <Layers size={16} className="text-blue-400 mr-2" />
                    <span>GIS Layer Data</span>
                  </div>
                  <div>
                    {showGisInfo ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                  </div>
                </button>
              </CollapsibleTrigger>
              <CollapsibleContent className="p-3 pt-2 bg-gray-750 border-t border-gray-700">
                <div className="space-y-3">
                  {gisInfo.map(item => {
                    // Find the layer source for more details
                    const layerSource = overlayLayerSources.find(source => source.id === item.id);
                    
                    return (
                      <div key={item.id} className="text-sm">
                        <div className="flex items-center">
                          {item.id === 'zoning' ? (
                            <FileText size={14} className="text-orange-400 mr-1.5 shrink-0" />
                          ) : item.id === 'floodZones' ? (
                            <Map size={14} className="text-blue-400 mr-1.5 shrink-0" />
                          ) : (
                            <Map size={14} className="text-yellow-400 mr-1.5 shrink-0" />
                          )}
                          <span className="text-xs text-gray-400">{item.label}</span>
                          {layerSource?.category && (
                            <Badge variant="outline" className="ml-auto text-[10px] h-4 px-1">
                              {layerSource.category}
                            </Badge>
                          )}
                        </div>
                        <p className="ml-5 text-xs font-medium">{item.value}</p>
                      </div>
                    );
                  })}
                  <div className="text-[10px] text-gray-400 mt-2 pt-2 border-t border-gray-700">
                    GIS data from Benton County. Last updated: March 2024
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>
        </div>
      </div>
      
      <div className="border-t border-gray-700 px-4 py-3 flex justify-between">
        <button className="text-xs px-3 py-1 bg-blue-500 hover:bg-blue-600 rounded">View Details</button>
        <button className="text-xs px-3 py-1 bg-gray-700 hover:bg-gray-600 rounded">Add to Selection</button>
      </div>
    </div>
  );
};

export default PropertyInfoPanel;