import React, { useState } from 'react';
import { Property } from '@/shared/types';
import { PropertyCard } from './PropertyCard';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Search, RefreshCw, Filter } from 'lucide-react';
import { NeighborhoodInsightsDialog } from '../neighborhood/NeighborhoodInsightsDialog';
import { Card, CardContent } from '@/components/ui/card';

// Sample properties for demonstration
const sampleProperties: Property[] = [
  {
    id: 'prop001',
    parcelId: '1005060001',
    address: '123 Main Street, Richland, WA 99352',
    owner: 'John Smith',
    value: '350000',
    squareFeet: 2100,
    yearBuilt: 1995,
    landValue: '85000',
    coordinates: [46.278362, -119.282512]
  },
  {
    id: 'prop002',
    parcelId: '1005060002',
    address: '456 Oak Avenue, Kennewick, WA 99336',
    owner: 'Jane Doe',
    value: '425000',
    squareFeet: 2450,
    yearBuilt: 2005,
    landValue: '95000',
    coordinates: [46.211282, -119.137184]
  },
  {
    id: 'prop003',
    parcelId: '1005060003',
    address: '789 Pine Road, Pasco, WA 99301',
    owner: 'Robert Johnson',
    value: '290000',
    squareFeet: 1850,
    yearBuilt: 1985,
    landValue: '75000',
    coordinates: [46.239972, -119.100843]
  },
  {
    id: 'prop004',
    parcelId: '1005060004',
    address: '101 Cedar Lane, West Richland, WA 99353',
    owner: 'Sarah Williams',
    value: '510000',
    squareFeet: 3200,
    yearBuilt: 2018,
    landValue: '105000',
    coordinates: [46.292652, -119.367482]
  }
];

export function PropertyList() {
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  
  const filteredProperties = sampleProperties.filter(property => 
    property.address.toLowerCase().includes(searchQuery.toLowerCase()) ||
    property.parcelId.includes(searchQuery)
  );
  
  return (
    <div className="space-y-4">
      <div className="flex gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Search properties by address or parcel ID..."
            className="pl-9"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        
        <Button variant="outline" size="icon" title="Refresh properties">
          <RefreshCw className="h-4 w-4" />
        </Button>
        
        <Button variant="outline" size="icon" title="Filter properties">
          <Filter className="h-4 w-4" />
        </Button>
      </div>
      
      {selectedProperty ? (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-medium">Selected Property</h2>
            <Button 
              variant="ghost" 
              size="sm"
              onClick={() => setSelectedProperty(null)}
            >
              Back to list
            </Button>
          </div>
          
          <div className="grid md:grid-cols-2 gap-4">
            <PropertyCard 
              property={selectedProperty} 
              showActions={false}
            />
            
            <Card>
              <CardContent className="p-4">
                <NeighborhoodInsightsDialog property={selectedProperty}>
                  <Button className="w-full">
                    View Neighborhood Insights
                  </Button>
                </NeighborhoodInsightsDialog>
              </CardContent>
            </Card>
          </div>
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
              <p className="text-muted-foreground">No properties found matching "{searchQuery}"</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default PropertyList;