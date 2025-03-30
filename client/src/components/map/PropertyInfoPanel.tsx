import React, { useState } from 'react';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import { 
  X, 
  ChevronDown, 
  ChevronUp, 
  BarChart3, 
  Home, 
  MapPin, 
  User, 
  Calendar, 
  DollarSign, 
  Ruler, 
  Bed, 
  Bath, 
  Tag, 
  Map, 
  FileText, 
  Scale,
  ArrowRightLeft
} from 'lucide-react';

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
  const [activeTab, setActiveTab] = useState('details');
  
  if (!property) {
    return (
      <div className="h-full flex flex-col items-center justify-center text-center p-6">
        <MapPin className="h-10 w-10 text-gray-300 mb-3" />
        <p className="text-gray-500 mb-1">Select a property on the map</p>
        <p className="text-xs text-gray-400">Click on any property marker to view detailed information</p>
      </div>
    );
  }

  // Calculate price per square foot
  const pricePerSqFt = property.value 
    ? formatCurrency(parseFloat(property.value.replace(/[^0-9.-]+/g, '')) / property.squareFeet)
    : 'N/A';
  
  return (
    <div className="h-full flex flex-col overflow-hidden">
      {/* Header */}
      <div className="p-4 border-b border-gray-200">
        <div className="flex justify-between items-start mb-2">
          <h2 className="text-lg font-semibold text-gray-800 pr-6">{property.address}</h2>
          {onClose && (
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100"
              aria-label="Close property info"
            >
              <X className="h-5 w-5" />
            </button>
          )}
        </div>
        
        {/* Property highlight stats */}
        <div className="flex items-center justify-between text-sm mt-2 mb-1">
          <div className="flex items-center text-primary">
            <DollarSign className="h-4 w-4 mr-1" />
            <span className="font-semibold">{property.value || 'Not valued'}</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Ruler className="h-4 w-4 mr-1" />
            <span>{property.squareFeet.toLocaleString()} sq ft</span>
          </div>
          <div className="flex items-center text-gray-600">
            <Calendar className="h-4 w-4 mr-1" />
            <span>{property.yearBuilt || 'N/A'}</span>
          </div>
        </div>
        
        {/* Tabs */}
        <div className="flex mt-3 border-b border-gray-200">
          <button
            className={`px-3 py-2 text-sm font-medium ${activeTab === 'details' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('details')}
          >
            Details
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium ${activeTab === 'assessment' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('assessment')}
          >
            Assessment
          </button>
          <button
            className={`px-3 py-2 text-sm font-medium ${activeTab === 'history' ? 'text-primary border-b-2 border-primary' : 'text-gray-500 hover:text-gray-700'}`}
            onClick={() => setActiveTab('history')}
          >
            History
          </button>
        </div>
      </div>
      
      {/* Tab content */}
      <div className="flex-grow overflow-y-auto p-4">
        {activeTab === 'details' && (
          <div className="space-y-4">
            {/* Basic property details */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Home className="h-4 w-4 mr-1.5 text-gray-500" />
                  Property Information
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-600">Parcel ID:</div>
                <div className="font-medium">{property.parcelId}</div>
                
                {property.propertyType && (
                  <>
                    <div className="text-gray-600">Type:</div>
                    <div className="font-medium">{property.propertyType}</div>
                  </>
                )}
                
                {property.owner && (
                  <>
                    <div className="text-gray-600">Owner:</div>
                    <div className="font-medium">{property.owner}</div>
                  </>
                )}
                
                {property.neighborhood && (
                  <>
                    <div className="text-gray-600">Neighborhood:</div>
                    <div className="font-medium">{property.neighborhood}</div>
                  </>
                )}
                
                {property.zoning && (
                  <>
                    <div className="text-gray-600">Zoning:</div>
                    <div className="font-medium">{property.zoning}</div>
                  </>
                )}
              </div>
            </div>
            
            {/* Building details */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Ruler className="h-4 w-4 mr-1.5 text-gray-500" />
                  Building Details
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-600">Year Built:</div>
                <div className="font-medium">{property.yearBuilt || 'N/A'}</div>
                
                <div className="text-gray-600">Square Feet:</div>
                <div className="font-medium">{property.squareFeet.toLocaleString()}</div>
                
                <div className="text-gray-600">Price/Sq. Ft.:</div>
                <div className="font-medium">{pricePerSqFt}</div>
                
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
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'assessment' && (
          <div className="space-y-4">
            {/* Valuation details */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <DollarSign className="h-4 w-4 mr-1.5 text-gray-500" />
                  Assessment Values
                </h3>
              </div>
              
              <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                <div className="text-gray-600">Total Value:</div>
                <div className="font-medium">{property.value || 'N/A'}</div>
                
                {property.landValue && (
                  <>
                    <div className="text-gray-600">Land Value:</div>
                    <div className="font-medium">{property.landValue}</div>
                  </>
                )}
                
                {property.taxAssessment && (
                  <>
                    <div className="text-gray-600">Tax Assessment:</div>
                    <div className="font-medium">{property.taxAssessment}</div>
                  </>
                )}
              </div>
              
              {/* Assessment history chart placeholder */}
              <div className="mt-4 bg-white p-3 border border-gray-200 rounded-md text-center">
                <BarChart3 className="h-6 w-6 mx-auto text-gray-300 mb-2" />
                <p className="text-xs text-gray-500">Assessment value history chart</p>
              </div>
            </div>
          </div>
        )}
        
        {activeTab === 'history' && (
          <div className="space-y-4">
            {/* Sales history */}
            <div className="bg-gray-50 p-3 rounded-lg">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-sm font-semibold text-gray-700 flex items-center">
                  <Calendar className="h-4 w-4 mr-1.5 text-gray-500" />
                  Sales History
                </h3>
              </div>
              
              {property.lastSaleDate && (
                <div className="border-b border-gray-200 pb-2 mb-2">
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-sm font-medium">{property.lastSaleDate}</span>
                    <span className="text-sm font-medium text-primary">{property.salePrice || 'Price not available'}</span>
                  </div>
                  <p className="text-xs text-gray-500">Last recorded sale</p>
                </div>
              )}
              
              <p className="text-sm text-gray-500 text-center py-2">No additional sales history available</p>
            </div>
          </div>
        )}
      </div>
      
      {/* Footer with actions */}
      <div className="p-3 border-t border-gray-200">
        <div className="flex justify-between">
          <button 
            onClick={() => setExpanded(!expanded)}
            className="text-primary text-sm font-medium flex items-center hover:text-primary/80"
          >
            {expanded ? (
              <>
                <ChevronUp className="h-4 w-4 mr-1" />
                Show less
              </>
            ) : (
              <>
                <ChevronDown className="h-4 w-4 mr-1" />
                Show more
              </>
            )}
          </button>
          
          {onCompare && (
            <button 
              onClick={() => onCompare(property)}
              className="px-3 py-1.5 bg-primary text-white text-sm rounded-md hover:bg-primary/90 flex items-center"
            >
              <ArrowRightLeft className="h-4 w-4 mr-1.5" />
              Compare
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default PropertyInfoPanel;