import React from 'react';
import { Property } from '@/shared/types';
import { usePropertySelection } from './PropertySelectionContext';
import { useNeighborhood } from '@/components/neighborhood/NeighborhoodContext';
import { formatCurrency } from '@/lib/utils';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { X, Home, MapPin, Trash, Star, Info, Tag } from 'lucide-react';

interface PropertyInfoPanelProps {
  property: Property | null;
  onClose?: () => void;
}

export const PropertyInfoPanel: React.FC<PropertyInfoPanelProps> = ({
  property,
  onClose,
}) => {
  const { selectProperty, selectProperties, isPropertySelected } = usePropertySelection();
  const unselectProperty = (property: Property) => {
    // Using selectProperties with an empty array effectively removes the property
    selectProperties([]);
  };
  const { fetchNeighborhoodData, getNeighborhoodDataForProperty, isNeighborhoodLoading } = useNeighborhood();
  
  const handleSelectProperty = () => {
    if (property) {
      selectProperty(property);
    }
  };
  
  const handleUnselectProperty = () => {
    if (property) {
      unselectProperty(property);
    }
  };
  
  // Get neighborhood data for the property
  const handleFetchNeighborhoodData = async () => {
    if (property) {
      await fetchNeighborhoodData(property);
    }
  };
  
  if (!property) {
    return (
      <div className="h-full flex items-center justify-center bg-muted/20">
        <div className="text-center text-muted-foreground">
          <p>No property selected</p>
          <p className="text-sm">Select a property on the map to view details</p>
        </div>
      </div>
    );
  }
  
  const isSelected = isPropertySelected(property);
  const neighborhoodData = getNeighborhoodDataForProperty(property.id);
  const loading = isNeighborhoodLoading(property.id);
  
  return (
    <div className="h-full flex flex-col overflow-y-auto bg-card">
      <div className="sticky top-0 z-10 bg-card border-b">
        <div className="flex items-center justify-between p-4">
          <h3 className="text-lg font-semibold">Property Details</h3>
          {onClose && (
            <Button variant="ghost" size="icon" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
      </div>
      
      <div className="flex-1 p-4">
        <Card>
          <CardHeader className="pb-2">
            <div className="flex items-start justify-between">
              <div>
                <CardTitle>{property.address}</CardTitle>
                <CardDescription>Parcel ID: {property.parcelId}</CardDescription>
              </div>
              <Badge variant={isSelected ? "success" : "outline"}>
                {isSelected ? "Selected" : "Not Selected"}
              </Badge>
            </div>
          </CardHeader>
          
          <CardContent className="pb-2">
            <Tabs defaultValue="details">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="details">Details</TabsTrigger>
                <TabsTrigger value="location">Location</TabsTrigger>
                <TabsTrigger value="neighborhood">Neighborhood</TabsTrigger>
              </TabsList>
              
              <TabsContent value="details" className="space-y-4">
                <div className="grid grid-cols-2 gap-2 pt-2">
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Value</span>
                    <span className="font-semibold">{formatCurrency(property.value)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Land Value</span>
                    <span className="font-semibold">{formatCurrency(property.landValue)}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Square Feet</span>
                    <span className="font-semibold">{property.squareFeet.toLocaleString()}</span>
                  </div>
                  <div className="flex flex-col">
                    <span className="text-sm font-medium text-muted-foreground">Year Built</span>
                    <span className="font-semibold">{property.yearBuilt || 'Unknown'}</span>
                  </div>
                  <div className="flex flex-col col-span-2">
                    <span className="text-sm font-medium text-muted-foreground">Owner</span>
                    <span className="font-semibold">{property.owner || 'Unknown'}</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="location">
                <div className="pt-2">
                  <div className="mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Address</span>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-muted-foreground" />
                      <span>{property.address}</span>
                    </div>
                  </div>
                  
                  {property.coordinates && (
                    <div className="mb-2">
                      <span className="text-sm font-medium text-muted-foreground">Coordinates</span>
                      <div className="text-sm font-mono">
                        <span>Lat: {property.coordinates[0].toFixed(6)}</span>
                        <br />
                        <span>Lng: {property.coordinates[1].toFixed(6)}</span>
                      </div>
                    </div>
                  )}
                  
                  <div className="h-32 bg-muted rounded-md flex items-center justify-center">
                    <span className="text-sm text-muted-foreground">Location preview</span>
                  </div>
                </div>
              </TabsContent>
              
              <TabsContent value="neighborhood">
                <div className="pt-2">
                  {!neighborhoodData && !loading && (
                    <div className="flex flex-col items-center justify-center py-4">
                      <Info className="h-8 w-8 text-muted-foreground mb-2" />
                      <p className="text-sm text-muted-foreground mb-2">
                        No neighborhood data available
                      </p>
                      <Button 
                        size="sm" 
                        onClick={handleFetchNeighborhoodData}
                        disabled={loading}
                      >
                        {loading ? 'Loading...' : 'Load Neighborhood Data'}
                      </Button>
                    </div>
                  )}
                  
                  {loading && (
                    <div className="flex items-center justify-center py-8">
                      <div className="text-center">
                        <p className="text-sm text-muted-foreground animate-pulse">
                          Loading neighborhood data...
                        </p>
                      </div>
                    </div>
                  )}
                  
                  {neighborhoodData && (
                    <div className="space-y-3">
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Neighborhood</span>
                        <h4 className="text-base font-semibold">{neighborhoodData.name}</h4>
                        <p className="text-sm text-muted-foreground">
                          {neighborhoodData.overview.description.slice(0, 120)}...
                        </p>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Housing Market</span>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div>
                            <span className="text-xs text-muted-foreground">Median Value</span>
                            <p className="text-sm font-medium">{neighborhoodData.housing.medianHomeValue}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">1-Year Change</span>
                            <p className="text-sm font-medium">
                              {neighborhoodData.housing.valueChange.oneYear > 0 ? '+' : ''}
                              {neighborhoodData.housing.valueChange.oneYear}%
                            </p>
                          </div>
                        </div>
                      </div>
                      
                      <div>
                        <span className="text-sm font-medium text-muted-foreground">Demographics</span>
                        <div className="grid grid-cols-2 gap-2 mt-1">
                          <div>
                            <span className="text-xs text-muted-foreground">Population</span>
                            <p className="text-sm font-medium">{neighborhoodData.demographics.population.toLocaleString()}</p>
                          </div>
                          <div>
                            <span className="text-xs text-muted-foreground">Median Income</span>
                            <p className="text-sm font-medium">{neighborhoodData.demographics.medianIncome}</p>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
          
          <CardFooter className="flex justify-between pt-2">
            <Button
              variant={isSelected ? "destructive" : "default"}
              size="sm"
              onClick={isSelected ? handleUnselectProperty : handleSelectProperty}
            >
              {isSelected ? (
                <>
                  <Trash className="h-4 w-4 mr-1" /> Remove from Selection
                </>
              ) : (
                <>
                  <Star className="h-4 w-4 mr-1" /> Add to Selection
                </>
              )}
            </Button>
          </CardFooter>
        </Card>
      </div>
    </div>
  );
};