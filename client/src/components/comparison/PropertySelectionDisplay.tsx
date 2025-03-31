import React from 'react';
import { Property } from '../../shared/schema';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Building,
  Calendar,
  Home,
  SquareDot,
  DollarSign,
  MapPin,
  Bath,
  Bed,
  Hash
} from 'lucide-react';
import { formatCurrency } from '@/lib/utils';

interface PropertySelectionDisplayProps {
  property: Property;
  className?: string;
}

export const PropertySelectionDisplay: React.FC<PropertySelectionDisplayProps> = ({
  property,
  className
}) => {
  // Format property value
  const formattedValue = property.value 
    ? formatCurrency(property.value) 
    : 'N/A';
  
  return (
    <div className={`space-y-4 ${className}`}>
      <div className="border-b pb-2">
        <h3 className="text-lg font-medium">{property.address}</h3>
        <p className="text-sm text-muted-foreground">
          {property.neighborhood || 'Unknown'} • {property.propertyType || 'Unknown'}
        </p>
      </div>
      
      <div className="grid grid-cols-2 gap-4">
        <div className="flex items-start gap-2">
          <DollarSign className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Value</p>
            <p className="text-sm">{formattedValue}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <SquareDot className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Square Feet</p>
            <p className="text-sm">{property.squareFeet?.toLocaleString() || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Calendar className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Year Built</p>
            <p className="text-sm">{property.yearBuilt || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Bed className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Bedrooms</p>
            <p className="text-sm">{property.bedrooms || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Bath className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Bathrooms</p>
            <p className="text-sm">{property.bathrooms || 'N/A'}</p>
          </div>
        </div>
        
        <div className="flex items-start gap-2">
          <Hash className="h-4 w-4 mt-0.5 text-muted-foreground" />
          <div>
            <p className="text-sm font-medium">Parcel ID</p>
            <p className="text-sm">{property.parcelId}</p>
          </div>
        </div>
      </div>
      
      {/* Description section - Note: uncomment if property.description exists in your schema
      {property.attributes?.description && (
        <div className="border-t pt-2">
          <p className="text-sm text-muted-foreground">{property.attributes.description}</p>
        </div>
      )}
      */}
    </div>
  );
};