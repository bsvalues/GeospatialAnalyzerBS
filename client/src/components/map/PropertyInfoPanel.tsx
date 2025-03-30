import React from 'react';
import { X } from 'lucide-react';

interface PropertyInfoPanelProps {
  property: {
    id: string;
    address: string;
    parcelId: string;
    salePrice: string;
    squareFeet: number;
    yearBuilt?: number;
    landValue?: string;
  };
  onClose: () => void;
}

const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({ property, onClose }) => {
  return (
    <div className="absolute bottom-4 left-4 bg-gray-800 rounded-lg shadow-xl w-72 border border-gray-700 overflow-hidden z-10">
      <div className="p-3 bg-blue-900 text-white font-medium flex justify-between items-center">
        <span>{property.address}</span>
        <button className="hover:text-gray-300" onClick={onClose}>
          <X size={16} />
        </button>
      </div>
      <div className="p-3 space-y-2 text-sm">
        <div className="flex justify-between">
          <span className="text-gray-400">Parcel ID:</span>
          <span>{property.parcelId}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Sale Price:</span>
          <span>{property.salePrice}</span>
        </div>
        <div className="flex justify-between">
          <span className="text-gray-400">Square Feet:</span>
          <span>{property.squareFeet.toLocaleString()}</span>
        </div>
        {property.yearBuilt && (
          <div className="flex justify-between">
            <span className="text-gray-400">Year Built:</span>
            <span>{property.yearBuilt}</span>
          </div>
        )}
        {property.landValue && (
          <div className="flex justify-between">
            <span className="text-gray-400">Land Value:</span>
            <span>{property.landValue}</span>
          </div>
        )}
        <div className="border-t border-gray-700 my-2 pt-2 flex justify-center">
          <button className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-xs mr-2">
            View Details
          </button>
          <button className="bg-gray-700 hover:bg-gray-600 text-white px-3 py-1.5 rounded text-xs">
            Run Analysis
          </button>
        </div>
      </div>
    </div>
  );
};

export default PropertyInfoPanel;
