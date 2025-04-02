import React, { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Building, 
  MapPin, 
  Search, 
  Filter, 
  ArrowUpDown, 
  Home, 
  Store, 
  Factory, 
  Hotel, 
  Grid, 
  List, 
  LayoutList
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";

// Sample data for properties
const sampleProperties = [
  {
    id: 1,
    address: "123 Main Street",
    city: "Richland",
    state: "WA",
    zipCode: "99352",
    type: "Residential",
    value: "$325,000",
    sqft: 2100,
    yearBuilt: 2001,
    lastAssessed: "January 10, 2024",
    parcelId: "1-2345-6789"
  },
  {
    id: 2,
    address: "456 Commerce Ave",
    city: "Kennewick",
    state: "WA",
    zipCode: "99336",
    type: "Commercial",
    value: "$1,250,000",
    sqft: 8500,
    yearBuilt: 1995,
    lastAssessed: "January 12, 2024",
    parcelId: "2-3456-7890"
  },
  {
    id: 3,
    address: "789 Industrial Blvd",
    city: "Pasco",
    state: "WA",
    zipCode: "99301",
    type: "Industrial",
    value: "$3,750,000",
    sqft: 25000,
    yearBuilt: 2008,
    lastAssessed: "January 15, 2024",
    parcelId: "3-4567-8901"
  },
  {
    id: 4,
    address: "101 Vineyard Lane",
    city: "Richland",
    state: "WA",
    zipCode: "99352",
    type: "Agricultural",
    value: "$875,000",
    sqft: 0,
    acres: 25.4,
    yearBuilt: 1975,
    lastAssessed: "January 18, 2024",
    parcelId: "4-5678-9012"
  },
  {
    id: 5,
    address: "202 Hotel Circle",
    city: "Kennewick",
    state: "WA",
    zipCode: "99336",
    type: "Hotel/Motel",
    value: "$4,200,000",
    sqft: 32000,
    rooms: 120,
    yearBuilt: 2012,
    lastAssessed: "January 20, 2024",
    parcelId: "5-6789-0123"
  },
  {
    id: 6,
    address: "303 Highland Drive",
    city: "Richland",
    state: "WA",
    zipCode: "99352",
    type: "Residential",
    value: "$415,000",
    sqft: 2800,
    yearBuilt: 2005,
    lastAssessed: "January 22, 2024",
    parcelId: "6-7890-1234"
  }
];

const PropertyTypeIcon = ({ type }: { type: string }) => {
  switch (type) {
    case "Residential":
      return <Home className="h-4 w-4 text-blue-500" />;
    case "Commercial":
      return <Store className="h-4 w-4 text-green-500" />;
    case "Industrial":
      return <Factory className="h-4 w-4 text-yellow-500" />;
    case "Hotel/Motel":
      return <Hotel className="h-4 w-4 text-purple-500" />;
    default:
      return <Building className="h-4 w-4 text-gray-500" />;
  }
};

const PropertiesPage = () => {
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid');
  
  return (
    <div className="container mx-auto px-4 sm:px-6 py-4 sm:py-6 space-y-4 sm:space-y-6">
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center">
        <div>
          <h1 className="text-2xl sm:text-3xl font-bold">Properties</h1>
          <p className="text-muted-foreground text-sm sm:text-base">Manage and view property information</p>
        </div>
      </div>
      
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center space-y-3 sm:space-y-0">
            <CardTitle>Property Search</CardTitle>
            <div className="flex items-center space-x-2">
              <div className="relative w-full sm:w-auto">
                <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input type="search" placeholder="Search properties..." className="pl-8 h-9 w-full sm:w-[250px]" />
              </div>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <Filter className="h-4 w-4" />
              </Button>
              <Button size="sm" variant="ghost" className="h-9 w-9 p-0">
                <ArrowUpDown className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-2">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between space-y-3 sm:space-y-0 mb-4">
            <div className="flex flex-wrap gap-2">
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Property Type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Types</SelectItem>
                  <SelectItem value="residential">Residential</SelectItem>
                  <SelectItem value="commercial">Commercial</SelectItem>
                  <SelectItem value="industrial">Industrial</SelectItem>
                  <SelectItem value="hotel">Hotel/Motel</SelectItem>
                  <SelectItem value="agricultural">Agricultural</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="City" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Cities</SelectItem>
                  <SelectItem value="richland">Richland</SelectItem>
                  <SelectItem value="kennewick">Kennewick</SelectItem>
                  <SelectItem value="pasco">Pasco</SelectItem>
                </SelectContent>
              </Select>
              
              <Select defaultValue="all">
                <SelectTrigger className="w-[140px]">
                  <SelectValue placeholder="Year Built" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Years</SelectItem>
                  <SelectItem value="2020-present">2020-Present</SelectItem>
                  <SelectItem value="2010-2019">2010-2019</SelectItem>
                  <SelectItem value="2000-2009">2000-2009</SelectItem>
                  <SelectItem value="1990-1999">1990-1999</SelectItem>
                  <SelectItem value="before-1990">Before 1990</SelectItem>
                </SelectContent>
              </Select>
            </div>
            
            <div className="flex items-center space-x-2">
              <Button 
                size="sm" 
                variant={viewMode === 'grid' ? 'default' : 'outline'} 
                className="h-9 w-9 p-0" 
                onClick={() => setViewMode('grid')}
              >
                <Grid className="h-4 w-4" />
              </Button>
              <Button 
                size="sm" 
                variant={viewMode === 'list' ? 'default' : 'outline'} 
                className="h-9 w-9 p-0"
                onClick={() => setViewMode('list')}
              >
                <LayoutList className="h-4 w-4" />
              </Button>
            </div>
          </div>
          
          <ScrollArea className="h-[600px] rounded-md">
            {viewMode === 'grid' ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {sampleProperties.map((property) => (
                  <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="h-40 bg-slate-100 relative">
                      <div className="absolute top-2 right-2">
                        <Badge variant="secondary" className="flex items-center space-x-1">
                          <PropertyTypeIcon type={property.type} />
                          <span>{property.type}</span>
                        </Badge>
                      </div>
                    </div>
                    <CardHeader className="pb-2">
                      <CardTitle className="text-base">{property.address}</CardTitle>
                      <CardDescription>
                        {property.city}, {property.state} {property.zipCode}
                      </CardDescription>
                    </CardHeader>
                    <CardContent className="pb-2">
                      <div className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm">
                        <div>
                          <p className="text-muted-foreground">Value</p>
                          <p className="font-medium">{property.value}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Size</p>
                          <p className="font-medium">
                            {property.sqft ? `${property.sqft} sqft` : `${property.acres} acres`}
                          </p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Year Built</p>
                          <p className="font-medium">{property.yearBuilt}</p>
                        </div>
                        <div>
                          <p className="text-muted-foreground">Parcel ID</p>
                          <p className="font-medium">{property.parcelId}</p>
                        </div>
                      </div>
                    </CardContent>
                    <CardFooter className="pt-0">
                      <Button size="sm" variant="outline" className="w-full">View Details</Button>
                    </CardFooter>
                  </Card>
                ))}
              </div>
            ) : (
              <div className="space-y-3">
                {sampleProperties.map((property) => (
                  <Card key={property.id} className="overflow-hidden hover:shadow-md transition-shadow">
                    <div className="flex flex-col sm:flex-row">
                      <div className="w-full sm:w-48 h-32 bg-slate-100 relative flex-shrink-0">
                        <div className="absolute top-2 right-2">
                          <Badge variant="secondary" className="flex items-center space-x-1">
                            <PropertyTypeIcon type={property.type} />
                            <span>{property.type}</span>
                          </Badge>
                        </div>
                      </div>
                      <div className="p-4 flex-grow">
                        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between">
                          <div>
                            <h3 className="font-medium">{property.address}</h3>
                            <p className="text-sm text-muted-foreground">
                              {property.city}, {property.state} {property.zipCode}
                            </p>
                          </div>
                          <div className="mt-2 sm:mt-0">
                            <p className="text-lg font-bold">{property.value}</p>
                          </div>
                        </div>
                        <div className="mt-3 grid grid-cols-2 md:grid-cols-4 gap-y-2 gap-x-4 text-sm">
                          <div>
                            <p className="text-muted-foreground">Size</p>
                            <p className="font-medium">
                              {property.sqft ? `${property.sqft} sqft` : `${property.acres} acres`}
                            </p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Year Built</p>
                            <p className="font-medium">{property.yearBuilt}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Parcel ID</p>
                            <p className="font-medium">{property.parcelId}</p>
                          </div>
                          <div>
                            <p className="text-muted-foreground">Last Assessed</p>
                            <p className="font-medium">{property.lastAssessed}</p>
                          </div>
                        </div>
                        <div className="mt-3 flex justify-end">
                          <Button size="sm" variant="outline">View Details</Button>
                        </div>
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            )}
          </ScrollArea>
        </CardContent>
        <CardFooter className="flex flex-col sm:flex-row items-center justify-between border-t pt-4">
          <div className="text-sm text-muted-foreground mb-2 sm:mb-0">
            Showing 6 of 2,487 properties
          </div>
          <div className="flex items-center space-x-2">
            <Button size="sm" variant="outline" disabled>Previous</Button>
            <Button size="sm" variant="outline">Next</Button>
          </div>
        </CardFooter>
      </Card>
    </div>
  );
};

export default PropertiesPage;