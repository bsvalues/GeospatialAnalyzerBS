import React, { useEffect } from 'react';
import { Property } from '@/shared/types';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  BadgeInfo,
  Home,
  Store,
  School,
  Bike,
  UsersRound,
  Compass,
  Trees,
  Loader2
} from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { useNeighborhood } from './NeighborhoodContext';

interface NeighborhoodInsightsProps {
  property: Property;
  onClose?: () => void;
}

export function NeighborhoodInsights({ property, onClose }: NeighborhoodInsightsProps) {
  const { loadNeighborhoodData, currentNeighborhoodData, isLoading, error } = useNeighborhood();
  
  useEffect(() => {
    loadNeighborhoodData(property).catch(console.error);
  }, [property, loadNeighborhoodData]);
  
  // Show loading state
  if (isLoading) {
    return (
      <Card className="w-full shadow-lg max-w-3xl mx-auto min-h-[400px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading neighborhood data...</p>
        </div>
      </Card>
    );
  }
  
  // Show error state
  if (error || !currentNeighborhoodData) {
    return (
      <Card className="w-full shadow-lg max-w-3xl mx-auto min-h-[300px] flex items-center justify-center">
        <div className="flex flex-col items-center gap-2 p-6 max-w-md text-center">
          <BadgeInfo className="h-8 w-8 text-muted-foreground" />
          <h3 className="text-lg font-medium">Unable to load neighborhood data</h3>
          <p className="text-sm text-muted-foreground">{error || "Please try again later."}</p>
          <Button onClick={() => loadNeighborhoodData(property)} className="mt-4">
            Retry
          </Button>
        </div>
      </Card>
    );
  }
  
  // Format number with suffix (e.g., 0.8 -> 0.8 mi)
  const formatDistance = (distance: number) => {
    return `${distance} mi`;
  };

  return (
    <Card className="w-full shadow-lg max-w-3xl mx-auto">
      <CardHeader className="pb-3">
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="text-xl flex items-center">
              <Compass className="mr-2 h-5 w-5 text-primary" />
              {currentNeighborhoodData.name} Insights
            </CardTitle>
            <CardDescription>
              Neighborhood context for {property.address}
            </CardDescription>
          </div>
          <Badge variant="outline" className="text-sm">
            {currentNeighborhoodData.overview.type}
          </Badge>
        </div>
      </CardHeader>

      <Tabs defaultValue="overview" className="w-full">
        <div className="px-6">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="housing">Housing</TabsTrigger>
            <TabsTrigger value="amenities">Amenities</TabsTrigger>
            <TabsTrigger value="demographics">Demographics</TabsTrigger>
            <TabsTrigger value="market">Market</TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="overview" className="px-6 py-4">
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              {currentNeighborhoodData.overview.description}
            </p>
            
            <div className="space-y-3">
              <h3 className="text-sm font-medium">Neighborhood Ratings</h3>
              
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Overall</span>
                  <span className="text-sm font-medium">{currentNeighborhoodData.overview.ratings.overall}/100</span>
                </div>
                <Progress value={currentNeighborhoodData.overview.ratings.overall} className="h-2" />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Safety</span>
                    <span className="text-sm font-medium">{currentNeighborhoodData.overview.ratings.safety}/100</span>
                  </div>
                  <Progress value={currentNeighborhoodData.overview.ratings.safety} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Schools</span>
                    <span className="text-sm font-medium">{currentNeighborhoodData.overview.ratings.schools}/100</span>
                  </div>
                  <Progress value={currentNeighborhoodData.overview.ratings.schools} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Amenities</span>
                    <span className="text-sm font-medium">{currentNeighborhoodData.overview.ratings.amenities}/100</span>
                  </div>
                  <Progress value={currentNeighborhoodData.overview.ratings.amenities} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Cost of Living</span>
                    <span className="text-sm font-medium">{currentNeighborhoodData.overview.ratings.costOfLiving}/100</span>
                  </div>
                  <Progress value={currentNeighborhoodData.overview.ratings.costOfLiving} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="housing" className="px-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <h3 className="text-sm font-medium mb-2">Median Home Value</h3>
                <p className="text-xl font-bold">{currentNeighborhoodData.housing.medianHomeValue}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {currentNeighborhoodData.housing.valueChange.oneYear > 0 ? '+' : ''}
                  {currentNeighborhoodData.housing.valueChange.oneYear}% (1yr)
                </p>
              </div>
              
              <div className="rounded-lg border p-3">
                <h3 className="text-sm font-medium mb-2">Median Rent</h3>
                <p className="text-xl font-bold">{currentNeighborhoodData.housing.medianRent}</p>
                <p className="text-xs text-muted-foreground mt-1">Per month</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-3">Property Types</h3>
              <div className="space-y-2">
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Single Family</span>
                    <span className="text-sm font-medium">{currentNeighborhoodData.housing.propertyTypes.singleFamily}%</span>
                  </div>
                  <Progress value={currentNeighborhoodData.housing.propertyTypes.singleFamily} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Townhouse</span>
                    <span className="text-sm font-medium">{currentNeighborhoodData.housing.propertyTypes.townhouse}%</span>
                  </div>
                  <Progress value={currentNeighborhoodData.housing.propertyTypes.townhouse} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Condo</span>
                    <span className="text-sm font-medium">{currentNeighborhoodData.housing.propertyTypes.condo}%</span>
                  </div>
                  <Progress value={currentNeighborhoodData.housing.propertyTypes.condo} className="h-2" />
                </div>
                
                <div className="space-y-1">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Apartment</span>
                    <span className="text-sm font-medium">{currentNeighborhoodData.housing.propertyTypes.apartment}%</span>
                  </div>
                  <Progress value={currentNeighborhoodData.housing.propertyTypes.apartment} className="h-2" />
                </div>
              </div>
            </div>
            
            <div className="rounded-lg border p-3">
              <h3 className="text-sm font-medium mb-2">5-Year Price Trend</h3>
              <div className="flex items-end gap-3">
                <p className="text-lg font-bold">
                  {currentNeighborhoodData.housing.valueChange.fiveYear > 0 ? '+' : ''}
                  {currentNeighborhoodData.housing.valueChange.fiveYear}%
                </p>
                <p className="text-xs text-muted-foreground">
                  over the last 5 years
                </p>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="amenities" className="px-6 py-4">
          <div className="space-y-4">
            <div>
              <div className="flex items-center mb-3">
                <School className="mr-2 h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Nearby Schools</h3>
              </div>
              <ul className="space-y-2">
                {currentNeighborhoodData.amenities.schools.map((school, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <div>
                      <p className="text-sm font-medium">{school.name}</p>
                      <p className="text-xs text-muted-foreground">{formatDistance(school.distance)}</p>
                    </div>
                    <Badge variant={school.rating >= 8 ? "default" : "secondary"}>
                      {school.rating}/10
                    </Badge>
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center mb-3">
                <Store className="mr-2 h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Grocery & Shopping</h3>
              </div>
              <ul className="space-y-2">
                {currentNeighborhoodData.amenities.groceryStores.map((store, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <p className="text-sm">{store.name}</p>
                    <Badge variant="outline">{formatDistance(store.distance)}</Badge>
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center mb-3">
                <Trees className="mr-2 h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Parks & Recreation</h3>
              </div>
              <ul className="space-y-2">
                {currentNeighborhoodData.amenities.parks.map((park, index) => (
                  <li key={index} className="flex justify-between items-center">
                    <p className="text-sm">{park.name}</p>
                    <Badge variant="outline">{formatDistance(park.distance)}</Badge>
                  </li>
                ))}
              </ul>
            </div>
            
            <Separator />
            
            <div>
              <div className="flex items-center mb-3">
                <Bike className="mr-2 h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Walk/Bike Score</h3>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Walkability</span>
                    <span className="text-sm font-medium">62/100</span>
                  </div>
                  <Progress value={62} className="h-2" />
                </div>
                
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-sm">Bike-friendly</span>
                    <span className="text-sm font-medium">78/100</span>
                  </div>
                  <Progress value={78} className="h-2" />
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        <TabsContent value="demographics" className="px-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4">
              <div className="rounded-lg border p-3">
                <h3 className="text-xs text-muted-foreground mb-1">Population</h3>
                <p className="text-lg font-bold">{currentNeighborhoodData.demographics.population.toLocaleString()}</p>
              </div>
              
              <div className="rounded-lg border p-3">
                <h3 className="text-xs text-muted-foreground mb-1">Median Age</h3>
                <p className="text-lg font-bold">{currentNeighborhoodData.demographics.medianAge}</p>
              </div>
              
              <div className="rounded-lg border p-3">
                <h3 className="text-xs text-muted-foreground mb-1">Households</h3>
                <p className="text-lg font-bold">{currentNeighborhoodData.demographics.households.toLocaleString()}</p>
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <Home className="mr-2 h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Home Ownership</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">Own</span>
                  <span className="text-sm font-medium">{currentNeighborhoodData.demographics.homeownership}%</span>
                </div>
                <Progress value={currentNeighborhoodData.demographics.homeownership} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Rent</span>
                  <span className="text-sm font-medium">{100 - currentNeighborhoodData.demographics.homeownership}%</span>
                </div>
                <Progress value={100 - currentNeighborhoodData.demographics.homeownership} className="h-2" />
              </div>
            </div>
            
            <div className="space-y-3">
              <div className="flex items-center">
                <UsersRound className="mr-2 h-4 w-4 text-muted-foreground" />
                <h3 className="text-sm font-medium">Education</h3>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-sm">High School</span>
                  <span className="text-sm font-medium">{currentNeighborhoodData.demographics.education.highSchool}%</span>
                </div>
                <Progress value={currentNeighborhoodData.demographics.education.highSchool} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Bachelor's</span>
                  <span className="text-sm font-medium">{currentNeighborhoodData.demographics.education.bachelors}%</span>
                </div>
                <Progress value={currentNeighborhoodData.demographics.education.bachelors} className="h-2" />
                
                <div className="flex items-center justify-between">
                  <span className="text-sm">Graduate</span>
                  <span className="text-sm font-medium">{currentNeighborhoodData.demographics.education.graduate}%</span>
                </div>
                <Progress value={currentNeighborhoodData.demographics.education.graduate} className="h-2" />
              </div>
            </div>
            
            <div className="rounded-lg border p-3">
              <h3 className="text-sm font-medium mb-1">Median Income</h3>
              <p className="text-lg font-bold">{currentNeighborhoodData.demographics.medianIncome}</p>
              <p className="text-xs text-muted-foreground mt-1">per household annually</p>
            </div>
          </div>
        </TabsContent>
        
        <TabsContent value="market" className="px-6 py-4">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <h3 className="text-sm font-medium mb-1">Days on Market</h3>
                <p className="text-lg font-bold">{currentNeighborhoodData.marketTrends.avgDaysOnMarket} days</p>
                <p className="text-xs text-muted-foreground mt-1">average time to sell</p>
              </div>
              
              <div className="rounded-lg border p-3">
                <h3 className="text-sm font-medium mb-1">List to Sale</h3>
                <p className="text-lg font-bold">{currentNeighborhoodData.marketTrends.listToSaleRatio}%</p>
                <p className="text-xs text-muted-foreground mt-1">of asking price on average</p>
              </div>
            </div>
            
            <div>
              <h3 className="text-sm font-medium mb-2">Price Per Square Foot</h3>
              <div className="p-3 border rounded-lg">
                <div className="flex justify-between mb-2">
                  <p className="text-xl font-bold">${currentNeighborhoodData.marketTrends.pricePerSqFt.current}/ft²</p>
                  <Badge variant={currentNeighborhoodData.marketTrends.pricePerSqFt.change > 0 ? "default" : "secondary"}>
                    {currentNeighborhoodData.marketTrends.pricePerSqFt.change > 0 ? '+' : ''}
                    {currentNeighborhoodData.marketTrends.pricePerSqFt.change}%
                  </Badge>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>
                    Last year: ${currentNeighborhoodData.marketTrends.pricePerSqFt.lastYear}/ft²
                  </span>
                  <span>
                    Year-over-year change
                  </span>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4">
              <div className="rounded-lg border p-3">
                <h3 className="text-sm font-medium mb-1">Inventory</h3>
                <div className="flex items-center">
                  <Badge 
                    variant={currentNeighborhoodData.marketTrends.inventoryLevel === 'Low' 
                      ? "destructive" 
                      : currentNeighborhoodData.marketTrends.inventoryLevel === 'Medium' 
                        ? "secondary" 
                        : "default"
                    }
                    className="mt-1"
                  >
                    {currentNeighborhoodData.marketTrends.inventoryLevel}
                  </Badge>
                </div>
              </div>
              
              <div className="rounded-lg border p-3">
                <h3 className="text-sm font-medium mb-1">Market Competition</h3>
                <div className="flex items-center">
                  <Badge 
                    variant={currentNeighborhoodData.marketTrends.competitiveIndex === 'High' 
                      ? "destructive" 
                      : currentNeighborhoodData.marketTrends.competitiveIndex === 'Medium' 
                        ? "secondary" 
                        : "default"
                    }
                    className="mt-1"
                  >
                    {currentNeighborhoodData.marketTrends.competitiveIndex}
                  </Badge>
                </div>
              </div>
            </div>
            
            <div className="pt-2 text-center">
              <p className="text-xs text-muted-foreground">
                Data last updated: {new Date().toLocaleDateString()}
              </p>
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {onClose && (
        <CardFooter className="px-6 py-4 flex justify-end">
          <Button variant="outline" onClick={onClose}>
            Close
          </Button>
        </CardFooter>
      )}
    </Card>
  );
}

export default NeighborhoodInsights;