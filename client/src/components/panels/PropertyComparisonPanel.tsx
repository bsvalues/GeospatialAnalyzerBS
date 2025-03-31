import React from 'react';
import { PropertyComparison } from '../comparison/PropertyComparison';
import { PropertyComparisonProvider } from '../comparison/PropertyComparisonContext';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Building, BarChart } from 'lucide-react';

interface PropertyComparisonPanelProps {
  className?: string;
}

const PropertyComparisonPanel: React.FC<PropertyComparisonPanelProps> = ({ className }) => {
  return (
    <div className={`h-full p-4 flex flex-col ${className}`}>
      <div className="flex items-center mb-4">
        <Building className="h-5 w-5 mr-2 text-primary" />
        <h2 className="text-lg font-bold">Property Comparison</h2>
      </div>
      
      <div className="flex-grow overflow-auto">
        <Tabs defaultValue="comparison" className="flex flex-col h-full">
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="comparison">Comparison</TabsTrigger>
            <TabsTrigger value="about">About</TabsTrigger>
          </TabsList>
          
          <TabsContent value="comparison" className="flex-grow">
            <PropertyComparisonProvider>
              <PropertyComparison className="h-full" />
            </PropertyComparisonProvider>
          </TabsContent>
          
          <TabsContent value="about" className="flex-grow overflow-auto">
            <Card>
              <CardHeader>
                <CardTitle>About Property Comparison</CardTitle>
                <CardDescription>
                  Understand how the property comparison tool works
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <h3 className="text-base font-medium">Similarity Scoring</h3>
                <p className="text-sm text-muted-foreground">
                  The property comparison tool uses a weighted similarity algorithm to find properties 
                  that match your selected property. Each property attribute contributes to the 
                  similarity score based on its weight.
                </p>
                
                <h3 className="text-base font-medium">Customizing Weights</h3>
                <p className="text-sm text-muted-foreground">
                  You can adjust the importance of different property attributes by using the weight
                  sliders or selecting one of the preset configurations:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Balanced: Equal importance for all attributes</li>
                  <li>Value Focused: Emphasizes property value</li>
                  <li>Physical Characteristics: Emphasizes square footage and rooms</li>
                  <li>Location Focused: Emphasizes neighborhood and property type</li>
                </ul>
                
                <h3 className="text-base font-medium">Using the Results</h3>
                <p className="text-sm text-muted-foreground">
                  The comparison results can be used for:
                </p>
                <ul className="list-disc list-inside text-sm text-muted-foreground space-y-1 ml-4">
                  <li>Finding comparable properties for valuation</li>
                  <li>Analyzing market trends in similar properties</li>
                  <li>Identifying outliers in property values</li>
                  <li>Supporting assessment decisions with data-driven comparisons</li>
                </ul>
                
                <div className="flex items-center p-3 bg-muted rounded-md">
                  <BarChart className="h-10 w-10 text-primary mr-3" />
                  <div>
                    <h4 className="font-medium">Pro Tip</h4>
                    <p className="text-sm text-muted-foreground">
                      For the most accurate comparisons, select properties in the same geographic area 
                      and adjust weights to match your valuation priorities.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default PropertyComparisonPanel;