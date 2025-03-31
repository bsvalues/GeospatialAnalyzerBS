import React, { useState, useEffect } from 'react';
import { Property } from '@/shared/schema';
import { PropertyCard } from './PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { NeighborhoodInsightsDialog } from '../neighborhood/NeighborhoodInsightsDialog';
import { Card, CardContent } from '@/components/ui/card';
import { ExportButton } from '@/components/export';
import { useQuery } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

// Static field definitions for customizable export fields
const CUSTOMIZABLE_FIELDS = [
  'bedrooms', 
  'bathrooms', 
  'yearBuilt', 
  'squareFeet', 
  'lotSize', 
  'neighborhood', 
  'zoning',
  'propertyType',
  'lastSaleDate',
  'salePrice'
];

export function PropertyList() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  // Fetch properties from the API
  const { data: properties = [], isLoading, refetch } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: () => apiRequest<Property[]>('/api/properties'),
    staleTime: 60000,
    refetchOnWindowFocus: false
  });
  
  // Filter properties based on search query
  const filteredProperties = properties.filter(property => 
    (property.address?.toLowerCase().includes(searchQuery.toLowerCase()) || false) ||
    (property.parcelId?.includes(searchQuery) || false)
  );
  
  // Handle refresh button click
  const handleRefresh = () => {
    refetch();
  };
  
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-3 mb-4 items-center">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties by address or parcel ID..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <div className="flex items-center gap-2">
          <Button 
            variant="outline" 
            size="icon" 
            title="Refresh properties"
            onClick={handleRefresh}
            disabled={isLoading}
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </Button>
          
          <Button variant="outline" size="icon" title="Filter properties">
            <Filter className="h-4 w-4" />
          </Button>
          
          {/* Export button for all or filtered properties */}
          <ExportButton 
            properties={filteredProperties}
            text="Export"
            variant="outline"
            customizableFields={CUSTOMIZABLE_FIELDS}
          />
        </div>
      </div>
      
      {selectedProperty ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Selected Property</h2>
            <div className="flex items-center gap-2">
              {/* Export button for just the selected property */}
              <ExportButton 
                properties={[selectedProperty]}
                text="Export Property"
                variant="outline"
                customizableFields={CUSTOMIZABLE_FIELDS}
              />
              
              <Button 
                variant="ghost" 
                size="sm"
                onClick={() => setSelectedProperty(null)}
              >
                Back to list
              </Button>
            </div>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <PropertyCard 
              property={selectedProperty} 
              showActions={false}
            />
            
            <Card>
              <CardContent className="p-4 space-y-4">
                <NeighborhoodInsightsDialog property={selectedProperty}>
                  <Button className="w-full">
                    View Neighborhood Insights
                  </Button>
                </NeighborhoodInsightsDialog>
                
                {/* Additional property details */}
                <div className="grid grid-cols-2 gap-2 text-sm mt-4">
                  <div className="font-medium">Parcel ID:</div>
                  <div>{selectedProperty.parcelId}</div>
                  
                  <div className="font-medium">Value:</div>
                  <div>{selectedProperty.value}</div>
                  
                  <div className="font-medium">Square Feet:</div>
                  <div>{selectedProperty.squareFeet}</div>
                  
                  <div className="font-medium">Year Built:</div>
                  <div>{selectedProperty.yearBuilt}</div>
                  
                  <div className="font-medium">Land Value:</div>
                  <div>{selectedProperty.landValue}</div>
                  
                  <div className="font-medium">Property Type:</div>
                  <div>{selectedProperty.propertyType || 'N/A'}</div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      ) : (
        <>
          {/* Display count and a top-level export button */}
          <div className="flex justify-between items-center mb-4">
            <div className="text-sm text-muted-foreground">
              Showing {filteredProperties.length} {filteredProperties.length === 1 ? 'property' : 'properties'}
              {searchQuery && ` matching "${searchQuery}"`}
            </div>
          </div>
          
          {isLoading ? (
            <div className="flex justify-center items-center p-8">
              <div className="animate-pulse">Loading properties...</div>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
              {filteredProperties.map(property => (
                <PropertyCard
                  key={property.id}
                  property={property}
                  onSelect={setSelectedProperty}
                />
              ))}
              
              {filteredProperties.length === 0 && (
                <div className="col-span-full text-center py-8">
                  <p className="text-muted-foreground">
                    {searchQuery 
                      ? `No properties found matching "${searchQuery}"` 
                      : 'No properties available'}
                  </p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
}

export default PropertyList;