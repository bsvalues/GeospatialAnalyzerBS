import React, { createContext, useState, useContext, useCallback, ReactNode } from 'react';
import { useQuery } from '@tanstack/react-query';
import { Property } from '../../shared/schema';
import { apiRequest } from '@/lib/queryClient';
import { calculateSimilarityScore, PropertyWeights, DEFAULT_WEIGHTS } from './PropertyScoring';

interface PropertyComparisonContextType {
  // Properties
  properties: Property[];
  isLoading: boolean;
  error: Error | null;
  
  // Selected property
  selectedPropertyId: number | null;
  selectedProperty: Property | null;
  setSelectedProperty: (property: Property) => void;
  
  // Similar properties
  similarProperties: Property[];
  findSimilarProperties: (property: Property, count?: number) => void;
  
  // Comparison weights
  weights: PropertyWeights;
  setWeights: (weights: PropertyWeights) => void;
}

const PropertyComparisonContext = createContext<PropertyComparisonContextType | undefined>(undefined);

export const PropertyComparisonProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  // Fetch properties
  const { data: properties = [], isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await apiRequest('GET', '/api/properties') as Response;
      return response.json();
    }
  });
  
  // Selected property state
  const [selectedPropertyId, setSelectedPropertyId] = useState<number | null>(null);
  const [similarProperties, setSimilarProperties] = useState<Property[]>([]);
  const [weights, setWeights] = useState<PropertyWeights>({ ...DEFAULT_WEIGHTS });
  
  // Find selected property object
  const selectedProperty = selectedPropertyId 
    ? properties.find(p => p.id === selectedPropertyId) || null 
    : null;
  
  // Set selected property
  const setSelectedProperty = useCallback((property: Property) => {
    setSelectedPropertyId(property.id);
  }, []);
  
  // Find similar properties
  const findSimilarProperties = useCallback((property: Property, count: number = 5) => {
    if (!property || properties.length === 0) {
      setSimilarProperties([]);
      return;
    }
    
    // Calculate similarity scores
    const propertiesWithScores = properties
      .filter(p => p.id !== property.id)
      .map(p => ({
        ...p,
        score: calculateSimilarityScore(property, p, weights)
      }))
      .sort((a, b) => b.score - a.score)
      .slice(0, count);
    
    setSimilarProperties(propertiesWithScores);
  }, [properties, weights]);
  
  return (
    <PropertyComparisonContext.Provider value={{
      properties,
      isLoading,
      error: error as Error | null,
      selectedPropertyId,
      selectedProperty,
      setSelectedProperty,
      similarProperties,
      findSimilarProperties,
      weights,
      setWeights
    }}>
      {children}
    </PropertyComparisonContext.Provider>
  );
};

export const usePropertyComparison = (): PropertyComparisonContextType => {
  const context = useContext(PropertyComparisonContext);
  if (context === undefined) {
    throw new Error('usePropertyComparison must be used within a PropertyComparisonProvider');
  }
  return context;
};