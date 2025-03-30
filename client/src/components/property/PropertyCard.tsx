import React from 'react';
import { Property } from '@/shared/types';
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { MapPin, Home, Building2, Calendar, DollarSign, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { PropertyNeighborhoodInfo } from './PropertyNeighborhoodInfo';

interface PropertyCardProps {
  property: Property;
  onSelect?: (property: Property) => void;
  className?: string;
  showActions?: boolean;
}

export function PropertyCard({
  property,
  onSelect,
  className = '',
  showActions = true
}: PropertyCardProps) {
  const formatCurrency = (value?: string) => {
    if (!value) return 'N/A';
    return value.startsWith('$') ? value : `$${value}`;
  };

  return (
    <Card className={`overflow-hidden ${className}`}>
      <CardHeader className="p-4 pb-2">
        <div className="flex justify-between">
          <CardTitle className="text-base font-medium line-clamp-1">
            {property.address}
          </CardTitle>
          
          <Badge variant="outline" className="ml-2 whitespace-nowrap">
            ID: {property.parcelId.substring(0, 8)}
          </Badge>
        </div>
      </CardHeader>
      
      <CardContent className="p-4 pt-0 pb-2">
        <div className="grid grid-cols-2 gap-y-2 text-sm mt-2">
          <div className="flex items-center gap-1">
            <Home className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{property.squareFeet.toLocaleString()} sqft</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Calendar className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Built {property.yearBuilt || 'N/A'}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <DollarSign className="h-3.5 w-3.5 text-muted-foreground" />
            <span>{formatCurrency(property.value)}</span>
          </div>
          
          <div className="flex items-center gap-1">
            <Building2 className="h-3.5 w-3.5 text-muted-foreground" />
            <span>Land: {formatCurrency(property.landValue)}</span>
          </div>
        </div>
        
        <div className="mt-3 flex items-center space-x-3">
          <PropertyNeighborhoodInfo property={property} variant="badge" />
          
          {property.coordinates && (
            <Badge variant="outline" className="flex items-center gap-1 text-xs">
              <MapPin className="h-3 w-3" />
              {property.coordinates[0].toFixed(5)}, {property.coordinates[1].toFixed(5)}
            </Badge>
          )}
        </div>
      </CardContent>
      
      {showActions && (
        <CardFooter className="p-4 pt-2 flex justify-between items-center">
          <PropertyNeighborhoodInfo property={property} variant="inline" />
          
          {onSelect && (
            <Button 
              variant="ghost" 
              size="sm" 
              className="h-8 text-xs flex items-center gap-1"
              onClick={() => onSelect(property)}
            >
              View Details
              <ArrowRight className="h-3.5 w-3.5" />
            </Button>
          )}
        </CardFooter>
      )}
    </Card>
  );
}

export default PropertyCard;