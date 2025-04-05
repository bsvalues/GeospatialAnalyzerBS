import React from 'react';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Home, Building, Warehouse, LandPlot, Sprout, HelpCircle } from 'lucide-react';

interface PropertyInfoPopupProps {
  property: Property;
  onClose?: () => void;
}

/**
 * Popup component for displaying property details when a marker is clicked
 */
export const PropertyInfoPopup: React.FC<PropertyInfoPopupProps> = ({ 
  property, 
  onClose 
}) => {
  // Function to get icon based on property type
  const getPropertyTypeIcon = () => {
    const type = property.propertyType?.toLowerCase() || '';
    
    switch (type) {
      case 'residential':
        return <Home className="h-4 w-4 mr-1" />;
      case 'commercial':
        return <Building className="h-4 w-4 mr-1" />;
      case 'industrial':
        return <Warehouse className="h-4 w-4 mr-1" />;
      case 'agricultural':
        return <Sprout className="h-4 w-4 mr-1" />;
      case 'vacant':
        return <LandPlot className="h-4 w-4 mr-1" />;
      default:
        return <HelpCircle className="h-4 w-4 mr-1" />;
    }
  };
  
  return (
    <Card className="property-info-popup shadow-lg border-0 w-[300px] max-w-[90vw]">
      <CardHeader className="py-3 px-4 bg-muted/30">
        <CardTitle className="text-sm font-medium flex justify-between items-center">
          <div className="truncate mr-2">
            {property.address || 'Unknown Location'}
          </div>
          <Badge variant="outline" className="flex items-center text-xs" title={property.propertyType || 'Unknown'}>
            {getPropertyTypeIcon()}
            {property.propertyType || 'Unknown'}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="p-3 text-sm">
        <div className="grid grid-cols-2 gap-y-2 gap-x-4">
          <div className="text-muted-foreground">Parcel ID:</div>
          <div className="font-medium">{property.parcelId || 'N/A'}</div>
          
          <div className="text-muted-foreground">Value:</div>
          <div className="font-medium">
            {property.value ? formatCurrency(property.value as string) : 'Not Available'}
          </div>
          
          {property.yearBuilt && (
            <>
              <div className="text-muted-foreground">Year Built:</div>
              <div className="font-medium">{property.yearBuilt}</div>
            </>
          )}
          
          {property.squareFeet && (
            <>
              <div className="text-muted-foreground">Area:</div>
              <div className="font-medium">{property.squareFeet.toLocaleString()} sq ft</div>
            </>
          )}
          
          {property.owner && (
            <>
              <div className="text-muted-foreground">Owner:</div>
              <div className="font-medium truncate">{property.owner}</div>
            </>
          )}
          
          {property.zoning && (
            <>
              <div className="text-muted-foreground">Zoning:</div>
              <div className="font-medium">{property.zoning}</div>
            </>
          )}
        </div>
      </CardContent>
    </Card>
  );
};

export default PropertyInfoPopup;