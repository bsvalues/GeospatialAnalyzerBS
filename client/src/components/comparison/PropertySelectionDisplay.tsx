import React from 'react';
import { X, Plus, ChevronRight } from 'lucide-react';
import { usePropertyComparison } from './PropertyComparisonContext';
import { Property } from '@/shared/types';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Card, CardContent, CardHeader } from '@/components/ui/card';

interface PropertySelectionDisplayProps {
  onClose?: () => void;
  className?: string;
}

export const PropertySelectionDisplay: React.FC<PropertySelectionDisplayProps> = ({ 
  onClose,
  className = ""
}) => {
  const { 
    selectedProperties, 
    removeProperty, 
    clearSelectedProperties,
    setShowComparison
  } = usePropertyComparison();

  // Helper to format address to be more concise
  const formatAddress = (address: string) => {
    return address.length > 25 ? `${address.substring(0, 22)}...` : address;
  };

  const handleCompare = () => {
    setShowComparison(true);
    if (onClose) onClose();
  };

  return (
    <Card className={`w-72 shadow-lg ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between py-3 px-4">
        <div>
          <h3 className="text-sm font-medium">Selected Properties</h3>
          <p className="text-xs text-muted-foreground">{selectedProperties.length} properties selected</p>
        </div>
        
        <div className="flex items-center space-x-2">
          {selectedProperties.length > 0 && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={clearSelectedProperties}
              className="h-7 px-2 text-xs"
            >
              Clear
            </Button>
          )}
          {onClose && (
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={onClose}
              className="h-7 w-7 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </CardHeader>
      
      <CardContent className="px-0 pb-3">
        {selectedProperties.length === 0 ? (
          <div className="flex flex-col items-center justify-center p-4 text-center">
            <div className="mb-2 rounded-full bg-muted p-2">
              <Plus className="h-4 w-4" />
            </div>
            <p className="text-sm text-muted-foreground">No properties selected yet</p>
            <p className="text-xs text-muted-foreground mt-1">
              Select properties from the map to compare them
            </p>
          </div>
        ) : (
          <>
            <ScrollArea className="h-[200px] px-4">
              <div className="space-y-2">
                {selectedProperties.map((property) => (
                  <div 
                    key={property.id}
                    className="flex items-center justify-between bg-muted/50 rounded-md p-2"
                  >
                    <div>
                      <p className="text-xs font-medium">{formatAddress(property.address)}</p>
                      <p className="text-[10px] text-muted-foreground">{property.parcelId}</p>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeProperty(property)}
                      className="h-6 w-6 p-0"
                    >
                      <X className="h-3 w-3" />
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
            
            <div className="mt-4 px-4">
              <Button 
                variant="default" 
                size="sm" 
                onClick={handleCompare} 
                className="w-full"
                disabled={selectedProperties.length < 2}
              >
                <ChevronRight className="h-4 w-4 mr-1" />
                Compare Properties
              </Button>
              {selectedProperties.length < 2 && (
                <p className="text-[10px] text-muted-foreground text-center mt-1">
                  Select at least 2 properties to compare
                </p>
              )}
            </div>
          </>
        )}
      </CardContent>
    </Card>
  );
};

export const PropertyCompareButton: React.FC<{ property: Property, className?: string }> = ({ 
  property, 
  className = "" 
}) => {
  const { isPropertySelected, togglePropertySelection } = usePropertyComparison();
  const selected = isPropertySelected(property);
  
  return (
    <Button
      size="sm"
      variant={selected ? "default" : "outline"}
      onClick={() => togglePropertySelection(property)}
      className={`h-7 px-3 text-xs ${className}`}
    >
      {selected ? (
        <>
          <X className="h-3 w-3 mr-1" />
          Remove from Comparison
        </>
      ) : (
        <>
          <Plus className="h-3 w-3 mr-1" />
          Add to Comparison
        </>
      )}
    </Button>
  );
};

export const ComparisonCountBadge: React.FC<{ onClick?: () => void }> = ({ onClick }) => {
  const { selectedProperties } = usePropertyComparison();
  
  if (selectedProperties.length === 0) return null;
  
  return (
    <Badge 
      variant="secondary" 
      className="cursor-pointer"
      onClick={onClick}
    >
      {selectedProperties.length} selected
    </Badge>
  );
};

export default PropertySelectionDisplay;