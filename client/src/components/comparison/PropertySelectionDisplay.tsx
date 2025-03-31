import React from 'react';
import { Card } from '@/components/ui/card';
import { Property } from '../../shared/schema';
import { formatCurrency } from '@/lib/utils';

interface PropertySelectionDisplayProps {
  property: Property;
}

export const PropertySelectionDisplay: React.FC<PropertySelectionDisplayProps> = ({ property }) => {
  // Format property value for display
  const formattedValue = property.value 
    ? formatCurrency(parseFloat(property.value.replace(/[$,]/g, '') || '0'))
    : 'N/A';

  return (
    <Card className="p-4">
      <div className="space-y-2">
        <div className="flex justify-between">
          <h4 className="font-medium">{property.address}</h4>
          <span className="font-semibold">{formattedValue}</span>
        </div>
        
        <div className="grid grid-cols-2 md:grid-cols-3 gap-x-4 gap-y-2 text-sm">
          <div>
            <span className="text-muted-foreground">Parcel ID:</span> {property.parcelId}
          </div>
          <div>
            <span className="text-muted-foreground">Year Built:</span> {property.yearBuilt || 'N/A'}
          </div>
          <div>
            <span className="text-muted-foreground">Square Feet:</span> {property.squareFeet?.toLocaleString() || 'N/A'}
          </div>
          <div>
            <span className="text-muted-foreground">Property Type:</span> {property.propertyType || 'N/A'}
          </div>
          <div>
            <span className="text-muted-foreground">Bedrooms:</span> {property.bedrooms || 'N/A'}
          </div>
          <div>
            <span className="text-muted-foreground">Bathrooms:</span> {property.bathrooms || 'N/A'}
          </div>
          <div>
            <span className="text-muted-foreground">Neighborhood:</span> {property.neighborhood || 'N/A'}
          </div>
          <div>
            <span className="text-muted-foreground">Land Value:</span> {
              property.landValue 
                ? formatCurrency(parseFloat(property.landValue.replace(/[$,]/g, '') || '0'))
                : 'N/A'
            }
          </div>
          <div>
            <span className="text-muted-foreground">Last Sale:</span> {property.lastSaleDate || 'N/A'}
          </div>
        </div>
      </div>
    </Card>
  );
};