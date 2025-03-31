import React, { useState } from 'react';
import { Property } from '../../shared/schema';
import { PropertyComparisonTool } from './PropertyComparisonTool';
import { PropertySearchDialogContainer } from './PropertySearchDialogContainer';
import ValuationTrendChart from './ValuationTrendChart';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { usePropertyComparison } from './PropertyComparisonContext';

interface PropertyComparisonProps {
  className?: string;
}

export const PropertyComparison: React.FC<PropertyComparisonProps> = ({ className }) => {
  const { properties, selectedPropertyId, setSelectedProperty, findSimilarProperties } = usePropertyComparison();
  
  const handleSelectProperty = (property: Property) => {
    setSelectedProperty(property);
  };
  
  const handleFindSimilarProperties = (property: Property, count: number) => {
    findSimilarProperties(property, count);
  };
  
  // Get the selected property
  const selectedProperty = properties.find(prop => prop.id === selectedPropertyId);
  
  return (
    <div className={`${className} flex flex-col h-full`}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Property Comparison</h2>
        <PropertySearchDialogContainer 
          buttonText="Search Properties"
          onSelectProperty={handleSelectProperty}
        />
      </div>
      
      <Tabs defaultValue="comparison" className="flex-grow flex flex-col">
        <TabsList className="mb-4">
          <TabsTrigger value="comparison">Comparison</TabsTrigger>
          <TabsTrigger value="trends">Value Trends</TabsTrigger>
        </TabsList>
        
        <TabsContent value="comparison" className="flex-grow overflow-auto">
          <PropertyComparisonTool 
            properties={properties} 
            selectedPropertyId={selectedPropertyId}
            onSelectProperty={handleSelectProperty}
            onFindSimilarProperties={handleFindSimilarProperties}
          />
        </TabsContent>
        
        <TabsContent value="trends" className="flex-grow overflow-auto">
          {selectedProperty ? (
            <div className="space-y-4">
              <ValuationTrendChart property={selectedProperty} />
              
              {properties.length > 1 && (
                <>
                  <Separator className="my-6" />
                  <Card>
                    <CardHeader className="pb-3">
                      <CardTitle className="text-lg">Comparison Properties Value Trends</CardTitle>
                      <CardDescription>
                        Historical and projected trends for similar properties
                      </CardDescription>
                    </CardHeader>
                    <CardContent>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {properties
                          .filter(p => p.id !== selectedPropertyId)
                          .slice(0, 4)
                          .map(property => (
                            <ValuationTrendChart 
                              key={property.id} 
                              property={property} 
                            />
                          ))
                        }
                      </div>
                    </CardContent>
                  </Card>
                </>
              )}
            </div>
          ) : (
            <Card className="flex items-center justify-center p-8">
              <div className="text-center">
                <h3 className="text-lg font-semibold mb-2">No Property Selected</h3>
                <p className="text-muted-foreground mb-4">
                  Select a property using the search button or from the comparison tab to view value trend predictions.
                </p>
                <PropertySearchDialogContainer 
                  buttonText="Select a Property"
                  onSelectProperty={handleSelectProperty}
                />
              </div>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
};