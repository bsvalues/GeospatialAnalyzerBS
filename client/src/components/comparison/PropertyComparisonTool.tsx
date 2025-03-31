import React, { useState, useMemo } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import { Toggle } from '@/components/ui/toggle';
import { Label } from '@/components/ui/label';
import { Property } from '../../shared/schema';
import { PropertySelectionDisplay } from './PropertySelectionDisplay';
import { PropertyWeights, calculateSimilarityScore, DEFAULT_WEIGHTS } from './PropertyScoring';
import { formatCurrency } from '@/lib/utils';

export interface PropertyComparisonToolProps {
  properties: Property[];
  selectedPropertyId?: number;
  onSelectProperty?: (property: Property) => void;
  onFindSimilarProperties?: (property: Property, count: number) => void;
}

export const PropertyComparisonTool: React.FC<PropertyComparisonToolProps> = ({
  properties,
  selectedPropertyId,
  onSelectProperty,
  onFindSimilarProperties
}) => {
  const [weights, setWeights] = useState<PropertyWeights>({ ...DEFAULT_WEIGHTS });
  const [compareCount, setCompareCount] = useState(5);
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Array<Property & { score: number }>>([]);

  // Find the selected property from the properties array when selectedPropertyId changes
  React.useEffect(() => {
    if (selectedPropertyId) {
      const property = properties.find(p => p.id === selectedPropertyId);
      if (property) {
        setSelectedProperty(property);
      }
    }
  }, [selectedPropertyId, properties]);

  // Calculate similar properties when selectedProperty or weights change
  const findSimilarProperties = useMemo(() => {
    if (!selectedProperty) return [];

    // Calculate similarity scores for all properties
    const propertiesWithScores = properties
      .filter(property => property.id !== selectedProperty.id)
      .map(property => ({
        ...property,
        score: calculateSimilarityScore(selectedProperty, property, weights)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, compareCount);

    return propertiesWithScores;
  }, [selectedProperty, properties, weights, compareCount]);

  // Update similar properties when findSimilarProperties changes
  React.useEffect(() => {
    setSimilarProperties(findSimilarProperties);
  }, [findSimilarProperties]);

  // Handle weight change
  const handleWeightChange = (property: keyof PropertyWeights, value: number) => {
    setWeights(prevWeights => {
      const newWeights = { ...prevWeights, [property]: value / 100 };
      
      // Normalize weights to ensure they sum to 1
      const sum = Object.values(newWeights).reduce((acc, val) => acc + val, 0);
      const normalizedWeights = Object.entries(newWeights).reduce((acc, [key, val]) => {
        acc[key as keyof PropertyWeights] = val / sum;
        return acc;
      }, {} as PropertyWeights);
      
      return normalizedWeights;
    });
  };

  // Handle property selection
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    if (onSelectProperty) {
      onSelectProperty(property);
    }
  };

  // Handle find similar properties
  const handleFindSimilarProperties = () => {
    if (selectedProperty && onFindSimilarProperties) {
      onFindSimilarProperties(selectedProperty, compareCount);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <Card>
        <CardHeader>
          <CardTitle>Property Comparison</CardTitle>
          <CardDescription>
            Compare properties and find similar ones based on customizable factors
          </CardDescription>
        </CardHeader>
        <CardContent>
          {selectedProperty ? (
            <div>
              <h3 className="text-lg font-semibold mb-2">Selected Property</h3>
              <PropertySelectionDisplay property={selectedProperty} />
              
              <div className="mt-6">
                <h3 className="text-lg font-semibold mb-4">Comparison Factors</h3>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="value-weight">Property Value</Label>
                      <span className="text-sm">{Math.round(weights.value * 100)}%</span>
                    </div>
                    <Slider
                      id="value-weight"
                      defaultValue={[weights.value * 100]}
                      max={100}
                      step={5}
                      onValueChange={(values) => handleWeightChange('value', values[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="year-weight">Year Built</Label>
                      <span className="text-sm">{Math.round(weights.yearBuilt * 100)}%</span>
                    </div>
                    <Slider
                      id="year-weight"
                      defaultValue={[weights.yearBuilt * 100]}
                      max={100}
                      step={5}
                      onValueChange={(values) => handleWeightChange('yearBuilt', values[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="sqft-weight">Square Footage</Label>
                      <span className="text-sm">{Math.round(weights.squareFeet * 100)}%</span>
                    </div>
                    <Slider
                      id="sqft-weight"
                      defaultValue={[weights.squareFeet * 100]}
                      max={100}
                      step={5}
                      onValueChange={(values) => handleWeightChange('squareFeet', values[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bedroom-weight">Bedrooms</Label>
                      <span className="text-sm">{Math.round(weights.bedrooms * 100)}%</span>
                    </div>
                    <Slider
                      id="bedroom-weight"
                      defaultValue={[weights.bedrooms * 100]}
                      max={100}
                      step={5}
                      onValueChange={(values) => handleWeightChange('bedrooms', values[0])}
                    />
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <Label htmlFor="bathroom-weight">Bathrooms</Label>
                      <span className="text-sm">{Math.round(weights.bathrooms * 100)}%</span>
                    </div>
                    <Slider
                      id="bathroom-weight"
                      defaultValue={[weights.bathrooms * 100]}
                      max={100}
                      step={5}
                      onValueChange={(values) => handleWeightChange('bathrooms', values[0])}
                    />
                  </div>

                  <div className="flex justify-between gap-2 mt-4">
                    <Button 
                      variant="outline" 
                      onClick={() => setWeights({ ...DEFAULT_WEIGHTS })}
                    >
                      Reset Weights
                    </Button>
                    <Button 
                      onClick={handleFindSimilarProperties}
                    >
                      Find Similar Properties
                    </Button>
                  </div>
                </div>
              </div>
            </div>
          ) : (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Select a property from the map or search to start comparison</p>
            </div>
          )}
        </CardContent>
      </Card>

      {similarProperties.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Similar Properties</CardTitle>
            <CardDescription>
              Top {similarProperties.length} properties most similar to your selection
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {similarProperties.map((property) => (
                <div 
                  key={property.id} 
                  className="border rounded-md p-4 hover:bg-muted transition-colors cursor-pointer"
                  onClick={() => handlePropertySelect(property)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium">{property.address}</h4>
                    <div className="bg-primary text-primary-foreground text-sm font-medium px-2 py-1 rounded-md">
                      {Math.round(property.score * 100)}% Match
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Value:</span> {formatCurrency(parseFloat(property.value?.replace(/[$,]/g, '') || '0'))}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Year Built:</span> {property.yearBuilt}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Sq. Ft:</span> {property.squareFeet?.toLocaleString()}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Beds/Baths:</span> {property.bedrooms} / {property.bathrooms}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};