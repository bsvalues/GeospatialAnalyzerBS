import React from 'react';
import { Property } from '../../shared/schema';
import { formatCurrency } from '@/lib/utils';
import { ScrollArea } from '@/components/ui/scroll-area';

interface PropertySearchResultsProps {
  results: Property[];
  onSelectProperty: (property: Property) => void;
}

export const PropertySearchResults: React.FC<PropertySearchResultsProps> = ({
  results,
  onSelectProperty,
}) => {
  if (results.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No properties found. Try a different search term.
      </div>
    );
  }

  return (
    <ScrollArea className="max-h-[300px]">
      <div className="space-y-2">
        {results.map(property => (
          <div
            key={property.id}
            className="p-3 border rounded-md cursor-pointer hover:bg-muted transition-colors"
            onClick={() => onSelectProperty(property)}
          >
            <div className="flex justify-between items-start">
              <div className="font-medium">{property.address}</div>
              <div className="text-sm font-medium">
                {property.value && formatCurrency(parseFloat(property.value.replace(/[$,]/g, '') || '0'))}
              </div>
            </div>
            <div className="text-sm text-muted-foreground mt-1">
              <div className="flex gap-2">
                <span>{property.propertyType}</span>
                {property.squareFeet && <span>{property.squareFeet.toLocaleString()} sq.ft.</span>}
                {property.bedrooms && <span>{property.bedrooms} bed</span>}
                {property.bathrooms && <span>{property.bathrooms} bath</span>}
              </div>
              <div className="flex gap-2 mt-1">
                <span>Parcel ID: {property.parcelId}</span>
                {property.neighborhood && <span>Area: {property.neighborhood}</span>}
              </div>
            </div>
          </div>
        ))}
      </div>
    </ScrollArea>
  );
};