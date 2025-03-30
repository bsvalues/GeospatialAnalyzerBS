import React from 'react';
import { X, Home, Coins, MapPin, Ruler, CalendarClock, Binary } from 'lucide-react';
import { Property } from '@/shared/types';

interface PropertyInfoPanelProps {
  property: Property;
  onClose: () => void;
}

const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({ property, onClose }) => {
  return (
    <div className="absolute top-16 right-4 w-72 bg-gray-800 rounded shadow-lg z-20 border border-gray-700">
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