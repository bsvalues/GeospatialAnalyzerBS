import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

interface PropertyInfoPanelProps {
  property: Property | null;
  onClose?: () => void;
  onCompare?: (property: Property) => void;
}

export const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({
  property,
  onClose,
  onCompare
}) => {
  const [expanded, setExpanded] = useState(false);
  
  if (!property) {
    return (
      <div className="bg-white border rounded shadow p-4 h-full flex flex-col items-center justify-center text-center">
        <p className="text-gray-500">Select a property on the map to view its details</p>
      </div>
    );
  }

  // Calculate price per square foot
  const pricePerSqFt = property.value 
    ? formatCurrency(parseFloat(property.value.replace(/[^0-9.-]+/g, '')) / property.squareFeet)
    : 'N/A';
  
  return (
    <div className="bg-white border rounded shadow p-4 h-full flex flex-col overflow-hidden">
      <div className="flex justify-between items-start mb-4">
        <h2 className="text-lg font-semibold">{property.address}</h2>
        {onClose && (
          <button 
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
            aria-label="Close property info"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
            </svg>
          </button>
        )}
      </div>
      
      <div className="flex flex-col space-y-2 overflow-y-auto flex-grow">
        <div className="grid grid-cols-2 gap-2 text-sm">
          <div className="text-gray-600">Parcel ID:</div>
          <div className="font-medium">{property.parcelId}</div>
          
          <div className="text-gray-600">Value:</div>
          <div className="font-medium">{property.value || 'N/A'}</div>
          
          <div className="text-gray-600">Year Built:</div>
          <div className="font-medium">{property.yearBuilt || 'N/A'}</div>
          
          <div className="text-gray-600">Square Feet:</div>
          <div className="font-medium">{property.squareFeet.toLocaleString()}</div>
          
          {property.owner && (
            <>
              <div className="text-gray-600">Owner:</div>
              <div className="font-medium">{property.owner}</div>
            </>
          )}
          
          {property.landValue && (
            <>
              <div className="text-gray-600">Land Value:</div>
              <div className="font-medium">{property.landValue}</div>
            </>
          )}
          
          {property.neighborhood && (
            <>
              <div className="text-gray-600">Neighborhood:</div>
              <div className="font-medium">{property.neighborhood}</div>
            </>
          )}
          
          {expanded && (
            <>
              <div className="text-gray-600">Price/Sq. Ft.:</div>
              <div className="font-medium">{pricePerSqFt}</div>
              
              {property.propertyType && (
                <>
                  <div className="text-gray-600">Property Type:</div>
                  <div className="font-medium">{property.propertyType}</div>
                </>
              )}
              
              {property.bedrooms !== undefined && (
                <>
                  <div className="text-gray-600">Bedrooms:</div>
                  <div className="font-medium">{property.bedrooms}</div>
                </>
              )}
              
              {property.bathrooms !== undefined && (
                <>
                  <div className="text-gray-600">Bathrooms:</div>
                  <div className="font-medium">{property.bathrooms}</div>
                </>
              )}
              
              {property.lotSize && (
                <>
                  <div className="text-gray-600">Lot Size:</div>
                  <div className="font-medium">{property.lotSize.toString()} sq ft</div>
                </>
              )}
              
              {property.zoning && (
                <>
                  <div className="text-gray-600">Zoning:</div>
                  <div className="font-medium">{property.zoning}</div>
                </>
              )}
              
              {property.lastSaleDate && (
                <>
                  <div className="text-gray-600">Last Sale Date:</div>
                  <div className="font-medium">{property.lastSaleDate}</div>
                </>
              )}
              
              {property.taxAssessment && (
                <>
                  <div className="text-gray-600">Tax Assessment:</div>
                  <div className="font-medium">{property.taxAssessment}</div>
                </>
              )}
            </>
          )}
        </div>
      </div>
      
      <div className="mt-4 flex justify-between">
        <button 
          onClick={() => setExpanded(!expanded)}
          className="text-blue-600 text-sm hover:text-blue-800"
        >
          {expanded ? 'Show less' : 'Show more'}
        </button>
        
        {onCompare && (
          <button 
            onClick={() => onCompare(property)}
            className="px-3 py-1 bg-blue-500 text-white text-sm rounded hover:bg-blue-600"
          >
            Compare
          </button>
        )}
      </div>
    </div>
  );
};

export default PropertyInfoPanel;