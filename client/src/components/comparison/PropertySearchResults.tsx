import React, { useState, useMemo } from 'react';
import { Property } from '@/shared/types';
import { SimilarityScore } from './PropertyScoring';
import { 
  Table, 
  TableBody, 
  TableCell, 
  TableHead, 
  TableHeader, 
  TableRow 
} from '@/components/ui/table';
import { 
  Card, 
  CardContent, 
  CardDescription, 
  CardFooter, 
  CardHeader, 
  CardTitle 
} from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Search,
  Map,
  List,
  ChevronUp,
  ChevronDown,
  Loader2,
  Home,
  DollarSign,
  Ruler,
  Calendar,
  ArrowUpDown
} from 'lucide-react';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Progress } from '@/components/ui/progress';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

interface PropertySearchResultsProps {
  properties: Property[];
  similarityScores: Record<string, SimilarityScore>;
  onSelect: (property: Property) => void;
  onSelectAll: (properties: Property[]) => void;
  onSelectTop: (count: number) => void;
  selectedProperties: Property[];
  isLoading?: boolean;
  referenceProperty?: Property;
}

interface SortConfig {
  key: string;
  direction: 'ascending' | 'descending';
}

export const PropertySearchResults: React.FC<PropertySearchResultsProps> = ({
  properties,
  similarityScores,
  onSelect,
  onSelectAll,
  onSelectTop,
  selectedProperties,
  isLoading = false,
  referenceProperty
}) => {
  const [activeTab, setActiveTab] = useState<string>('list');
  const [filterValue, setFilterValue] = useState<string>('');
  const [sortConfig, setSortConfig] = useState<SortConfig>({ 
    key: 'similarity', 
    direction: 'descending' 
  });
  const [topCount, setTopCount] = useState<string>('3');

  // Filter properties based on search input
  const filteredProperties = useMemo(() => {
    if (!filterValue.trim()) {
      return properties;
    }
    
    const searchTerms = filterValue.toLowerCase().split(' ');
    return properties.filter(property => {
      // Search multiple fields
      const searchableText = [
        property.address,
        property.parcelId,
        property.owner,
        property.value,
        property.salePrice,
        property.squareFeet?.toString(),
        property.yearBuilt?.toString()
      ].join(' ').toLowerCase();
      
      // Match all search terms (AND search)
      return searchTerms.every(term => searchableText.includes(term));
    });
  }, [properties, filterValue]);
  
  // Sort the filtered properties
  const sortedProperties = useMemo(() => {
    const sorted = [...filteredProperties];
    
    sorted.sort((a, b) => {
      let valueA: any;
      let valueB: any;
      
      switch (sortConfig.key) {
        case 'similarity':
          valueA = similarityScores[a.id]?.total || 0;
          valueB = similarityScores[b.id]?.total || 0;
          break;
        case 'address':
          valueA = a.address;
          valueB = b.address;
          return sortConfig.direction === 'ascending' 
            ? valueA.localeCompare(valueB) 
            : valueB.localeCompare(valueA);
        case 'squareFeet':
          valueA = a.squareFeet || 0;
          valueB = b.squareFeet || 0;
          break;
        case 'yearBuilt':
          valueA = a.yearBuilt || 0;
          valueB = b.yearBuilt || 0;
          break;
        case 'value':
          valueA = parseFloat((a.value || '0').replace(/[$,]/g, ''));
          valueB = parseFloat((b.value || '0').replace(/[$,]/g, ''));
          break;
        case 'salePrice':
          valueA = parseFloat((a.salePrice || '0').replace(/[$,]/g, ''));
          valueB = parseFloat((b.salePrice || '0').replace(/[$,]/g, ''));
          break;
        default:
          valueA = 0;
          valueB = 0;
      }
      
      // For numeric values
      if (sortConfig.direction === 'ascending') {
        return valueA - valueB;
      } else {
        return valueB - valueA;
      }
    });
    
    return sorted;
  }, [filteredProperties, sortConfig, similarityScores]);
  
  // Handle sort request for a column
  const requestSort = (key: string) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'ascending' 
        ? 'descending' 
        : 'ascending'
    }));
  };
  
  // Check if a property is already selected
  const isPropertySelected = (property: Property) => {
    return selectedProperties.some(p => p.id === property.id);
  };
  
  // Handle top N selection
  const handleSelectTop = () => {
    const count = parseInt(topCount, 10);
    if (!isNaN(count) && count > 0) {
      onSelectTop(count);
    }
  };
  
  // Get sort indicator
  const getSortIndicator = (key: string) => {
    if (sortConfig.key !== key) return null;
    
    return sortConfig.direction === 'ascending' 
      ? <ChevronUp className="h-4 w-4 ml-1" />
      : <ChevronDown className="h-4 w-4 ml-1" />;
  };
  
  // Render loading state
  if (isLoading) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64">
            <Loader2 className="h-8 w-8 text-primary animate-spin mb-4" data-testid="loading-spinner" />
            <p className="text-lg text-muted-foreground">Searching for comparable properties...</p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  // Render empty state
  if (!properties.length) {
    return (
      <Card className="w-full">
        <CardContent className="pt-6">
          <div className="flex flex-col items-center justify-center h-64">
            <Search className="h-8 w-8 text-muted-foreground mb-4" />
            <p className="text-lg font-medium mb-2">No comparable properties found</p>
            <p className="text-muted-foreground text-center max-w-md">
              Try adjusting your search criteria to find more potential matches.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }
  
  return (
    <Card className="w-full">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle>Comparable Properties</CardTitle>
            <CardDescription>
              Found {properties.length} potential matches
            </CardDescription>
          </div>
          <div className="flex space-x-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={() => onSelectAll(properties)}
            >
              Select All
            </Button>
            <Select value={topCount} onValueChange={setTopCount}>
              <SelectTrigger className="w-[100px]">
                <SelectValue placeholder="Select Top" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1">Top 1</SelectItem>
                <SelectItem value="3">Top 3</SelectItem>
                <SelectItem value="5">Top 5</SelectItem>
                <SelectItem value="10">Top 10</SelectItem>
              </SelectContent>
            </Select>
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleSelectTop}
            >
              Select Top
            </Button>
          </div>
        </div>
      </CardHeader>
      
      <div className="px-6 mb-4">
        <div className="flex w-full max-w-sm items-center space-x-2">
          <Search className="h-4 w-4 text-muted-foreground" />
          <Input
            placeholder="Filter results..."
            value={filterValue}
            onChange={(e) => setFilterValue(e.target.value)}
            className="h-8"
          />
        </div>
      </div>
      
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <div className="px-6">
          <TabsList className="grid w-[200px] grid-cols-2">
            <TabsTrigger value="list">
              <List className="h-4 w-4 mr-2" />
              List
            </TabsTrigger>
            <TabsTrigger value="map">
              <Map className="h-4 w-4 mr-2" />
              Map
            </TabsTrigger>
          </TabsList>
        </div>
        
        <TabsContent value="list" className="px-6">
          <CardContent className="p-0">
            <ScrollArea className="h-[500px] w-full">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => requestSort('similarity')}
                    >
                      <div className="flex items-center">
                        Match %
                        {getSortIndicator('similarity')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => requestSort('address')}
                    >
                      <div className="flex items-center">
                        <Home className="h-4 w-4 mr-2" />
                        Address
                        {getSortIndicator('address')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => requestSort('value')}
                    >
                      <div className="flex items-center">
                        <DollarSign className="h-4 w-4 mr-2" />
                        Value
                        {getSortIndicator('value')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => requestSort('squareFeet')}
                    >
                      <div className="flex items-center">
                        <Ruler className="h-4 w-4 mr-2" />
                        Square Feet
                        {getSortIndicator('squareFeet')}
                      </div>
                    </TableHead>
                    <TableHead 
                      className="cursor-pointer"
                      onClick={() => requestSort('yearBuilt')}
                    >
                      <div className="flex items-center">
                        <Calendar className="h-4 w-4 mr-2" />
                        Year Built
                        {getSortIndicator('yearBuilt')}
                      </div>
                    </TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {sortedProperties.map((property) => {
                    const score = similarityScores[property.id]?.total || 0;
                    const selected = isPropertySelected(property);
                    
                    return (
                      <TableRow key={property.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant={
                                score >= 90 ? "default" : 
                                score >= 70 ? "secondary" : 
                                "outline"
                              }
                            >
                              {score}%
                            </Badge>
                            <Progress value={score} className="h-2 w-16" />
                          </div>
                        </TableCell>
                        <TableCell className="font-medium">{property.address}</TableCell>
                        <TableCell>{property.value || 'N/A'}</TableCell>
                        <TableCell>{property.squareFeet?.toLocaleString() || 'N/A'}</TableCell>
                        <TableCell>{property.yearBuilt || 'N/A'}</TableCell>
                        <TableCell>
                          <Button
                            variant={selected ? "secondary" : "default"}
                            size="sm"
                            onClick={() => !selected && onSelect(property)}
                            disabled={selected}
                          >
                            {selected ? 'Already Added' : 'Add to Comparison'}
                          </Button>
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </ScrollArea>
          </CardContent>
        </TabsContent>
        
        <TabsContent value="map" className="px-6">
          <CardContent className="p-0">
            <div className="h-[500px] w-full rounded-md overflow-hidden">
              {properties.length > 0 && properties[0].coordinates && (
                <MapContainer
                  center={referenceProperty?.coordinates || [46.2, -119.1]}
                  zoom={12}
                  style={{ height: '100%', width: '100%' }}
                >
                  <TileLayer
                    url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                    attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                  />
                  
                  {/* Reference property marker */}
                  {referenceProperty?.coordinates && (
                    <Marker position={referenceProperty.coordinates}>
                      <Popup>
                        <div className="p-1">
                          <p className="font-semibold">Reference Property</p>
                          <p className="text-sm">{referenceProperty.address}</p>
                          <p className="text-sm">{referenceProperty.value}</p>
                        </div>
                      </Popup>
                    </Marker>
                  )}
                  
                  {/* Comparable properties markers */}
                  {sortedProperties.map(property => {
                    if (!property.coordinates) return null;
                    
                    const score = similarityScores[property.id]?.total || 0;
                    const selected = isPropertySelected(property);
                    
                    return (
                      <Marker key={property.id} position={property.coordinates}>
                        <Popup>
                          <div className="p-1">
                            <div className="flex justify-between items-center">
                              <p className="font-semibold">Match: {score}%</p>
                              <Badge 
                                variant={
                                  score >= 90 ? "default" : 
                                  score >= 70 ? "secondary" : 
                                  "outline"
                                }
                              >
                                {score}%
                              </Badge>
                            </div>
                            <p className="text-sm">{property.address}</p>
                            <p className="text-sm">{property.value}</p>
                            <p className="text-sm">{property.squareFeet} sq ft, built {property.yearBuilt}</p>
                            <div className="mt-2">
                              <Button
                                variant={selected ? "secondary" : "default"}
                                size="sm"
                                onClick={() => !selected && onSelect(property)}
                                disabled={selected}
                                className="w-full"
                              >
                                {selected ? 'Already Added' : 'Add to Comparison'}
                              </Button>
                            </div>
                          </div>
                        </Popup>
                      </Marker>
                    );
                  })}
                  
                  {/* Auto center on reference property */}
                  {referenceProperty?.coordinates && (
                    <MapCenterUpdater position={referenceProperty.coordinates} />
                  )}
                </MapContainer>
              )}
            </div>
          </CardContent>
        </TabsContent>
      </Tabs>
      
      <CardFooter>
        <p className="text-sm text-muted-foreground">
          Click on column headers to sort • Match percentage is based on similarity to reference property
        </p>
      </CardFooter>
    </Card>
  );
};

// Helper component to center map on mount
const MapCenterUpdater: React.FC<{ position: [number, number] }> = ({ position }) => {
  const map = useMap();
  
  React.useEffect(() => {
    map.setView(position, map.getZoom());
  }, [map, position]);
  
  return null;
};

export default PropertySearchResults;