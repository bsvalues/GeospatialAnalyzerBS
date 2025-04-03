import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Map, 
  BarChart3, 
  TrendingUp, 
  Building, 
  Home, 
  Info
} from 'lucide-react';
import NeighborhoodComparisonHeatmap from '../components/neighborhood/NeighborhoodComparisonHeatmap';
import NeighborhoodTimeline from '../components/neighborhood/NeighborhoodTimeline';
import { Property } from '@shared/schema';
import { useQuery } from '@tanstack/react-query';

const NeighborhoodComparisonPage: React.FC = () => {
  // State for active tab
  const [activeTab, setActiveTab] = useState('heatmap');
  
  // Fetch properties to use in visualization
  const { data: properties, isLoading, error } = useQuery<Property[]>({
    queryKey: ['/api/properties'],
  });
  
  return (
    <div className="container mx-auto p-4 max-w-7xl">
      <div className="mb-6">
        <h1 className="text-3xl font-bold tracking-tight mb-1">Neighborhood Comparison</h1>
        <p className="text-muted-foreground">
          Compare neighborhoods using interactive visualizations to identify trends and patterns.
        </p>
      </div>
      
      <Tabs defaultValue="heatmap" value={activeTab} onValueChange={setActiveTab} className="w-full mb-8">
        <TabsList className="mb-6">
          <TabsTrigger value="heatmap" className="flex items-center gap-2">
            <Map className="h-4 w-4" />
            <span>Heatmap</span>
          </TabsTrigger>
          <TabsTrigger value="timeline" className="flex items-center gap-2">
            <TrendingUp className="h-4 w-4" />
            <span>Timeline</span>
          </TabsTrigger>
          <TabsTrigger value="about" className="flex items-center gap-2">
            <Info className="h-4 w-4" />
            <span>About</span>
          </TabsTrigger>
        </TabsList>
        
        <TabsContent value="heatmap" className="mt-0">
          <NeighborhoodComparisonHeatmap properties={properties || []} />
        </TabsContent>
        
        <TabsContent value="timeline" className="mt-0">
          <NeighborhoodTimeline />
        </TabsContent>
        
        <TabsContent value="about" className="mt-0">
          <AboutNeighborhoodComparison />
        </TabsContent>
      </Tabs>
    </div>
  );
};

const AboutNeighborhoodComparison: React.FC = () => {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Map className="h-5 w-5" />
            <span>Heatmap Analysis</span>
          </CardTitle>
          <CardDescription>
            Interactive geospatial visualization for neighborhood value patterns
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            The neighborhood comparison heatmap allows you to visualize property values and trends across different neighborhoods on a geographic map. This powerful tool helps you:
          </p>
          <ul className="text-sm list-disc pl-5 space-y-2">
            <li>Identify value hotspots and emerging high-growth areas</li>
            <li>Compare market performance across neighborhood boundaries</li>
            <li>Detect patterns in property value distribution</li>
            <li>Analyze neighborhood-level market trends over time</li>
            <li>Discover undervalued areas with growth potential</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            <span>Timeline Analysis</span>
          </CardTitle>
          <CardDescription>
            Historical value trends and growth rate comparison
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            The neighborhood timeline visualization provides historical context for property values and growth rates across neighborhoods. This feature enables you to:
          </p>
          <ul className="text-sm list-disc pl-5 space-y-2">
            <li>Track property value trends across multiple years</li>
            <li>Compare historical performance between neighborhoods</li>
            <li>Identify neighborhoods with consistent growth patterns</li>
            <li>Evaluate the impact of economic events on different areas</li>
            <li>Project future value trends based on historical data</li>
          </ul>
        </CardContent>
      </Card>
      
      <Card className="md:col-span-2">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Building className="h-5 w-5" />
            <span>Using Neighborhood Analysis for Property Valuation</span>
          </CardTitle>
          <CardDescription>
            Best practices for incorporating neighborhood-level data into your valuation process
          </CardDescription>
        </CardHeader>
        <CardContent>
          <p className="text-sm mb-4">
            Neighborhood-level analysis provides essential context for property valuation that goes beyond individual property characteristics. Here's how to effectively use this data in your valuation process:
          </p>
          
          <h3 className="text-base font-medium mt-4 mb-2">Valuation Applications</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-4">
            <div className="border rounded-md p-3">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <Home className="h-4 w-4" />
                <span>Comparative Market Analysis</span>
              </h4>
              <p className="text-xs">
                Use neighborhood trend data to adjust comparable property values based on location-specific growth patterns. Properties in high-growth neighborhoods may warrant premium adjustments compared to similar properties in slower-growth areas.
              </p>
            </div>
            
            <div className="border rounded-md p-3">
              <h4 className="text-sm font-medium flex items-center gap-2 mb-2">
                <BarChart3 className="h-4 w-4" />
                <span>Investment Analysis</span>
              </h4>
              <p className="text-xs">
                Identify neighborhoods with emerging value patterns or consistent growth for investment opportunities. The heatmap can reveal undervalued areas adjacent to high-value neighborhoods that may represent growth potential.
              </p>
            </div>
          </div>
          
          <h3 className="text-base font-medium mt-4 mb-2">Implementation Strategies</h3>
          <ul className="text-sm list-disc pl-5 space-y-2">
            <li>Use the timeline view to identify neighborhoods with consistent growth patterns versus those with high volatility</li>
            <li>Look for emerging "value clusters" in the heatmap that may indicate neighborhood revitalization</li>
            <li>Compare year-over-year changes to identify neighborhoods recovering from value declines</li>
            <li>Analyze transaction volume alongside value changes to identify liquid markets</li>
            <li>Create neighborhood-based adjustment factors for your appraisal models using the comparative data</li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default NeighborhoodComparisonPage;