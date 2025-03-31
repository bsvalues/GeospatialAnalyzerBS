import React, { useState } from 'react';
import { Property } from '../../shared/schema';
import { PropertyComparisonTool } from './PropertyComparisonTool';
import { PropertySearchDialogContainer } from './PropertySearchDialogContainer';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
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
  
  return (
    <div className={className}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-2xl font-bold">Property Comparison</h2>
        <PropertySearchDialogContainer 
          buttonText="Search Properties"
          onSelectProperty={handleSelectProperty}
        />
      </div>
      
      <PropertyComparisonTool 
        properties={properties} 
        selectedPropertyId={selectedPropertyId}
        onSelectProperty={handleSelectProperty}
        onFindSimilarProperties={handleFindSimilarProperties}
      />
    </div>
  );
};