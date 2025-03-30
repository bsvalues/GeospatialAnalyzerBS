import React, { createContext, useState, useContext, ReactNode } from 'react';
import { Property } from '@/shared/types';
import { useToast } from '@/hooks/use-toast';

// Context type definition
interface PropertyComparisonContextType {
  selectedProperties: Property[];
  isPropertySelected: (property: Property) => boolean;
  togglePropertySelection: (property: Property) => void;
  clearSelectedProperties: () => void;
  addProperty: (property: Property) => void;
  removeProperty: (property: Property) => void;
  showComparison: boolean;
  setShowComparison: (show: boolean) => void;
}

// Create the context with a default value
const PropertyComparisonContext = createContext<PropertyComparisonContextType | undefined>(undefined);

// Custom hook to use the property comparison context
export const usePropertyComparison = () => {
  const context = useContext(PropertyComparisonContext);
  if (!context) {
    throw new Error('usePropertyComparison must be used within a PropertyComparisonProvider');
  }
  return context;
};

// Props type for the provider component
interface PropertyComparisonProviderProps {
  children: ReactNode;
}

// The provider component that will wrap the app and provide the context
export const PropertyComparisonProvider: React.FC<PropertyComparisonProviderProps> = ({ children }) => {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const [showComparison, setShowComparison] = useState<boolean>(false);
  const { toast } = useToast();

  // Maximum number of properties that can be compared at once
  const MAX_PROPERTIES = 5;

  // Check if a property is already selected
  const isPropertySelected = (property: Property): boolean => {
    return selectedProperties.some(p => p.id === property.id);
  };

  // Toggle the selection status of a property
  const togglePropertySelection = (property: Property) => {
    if (isPropertySelected(property)) {
      removeProperty(property);
    } else {
      addProperty(property);
    }
  };

  // Add a property to the comparison list
  const addProperty = (property: Property) => {
    if (selectedProperties.length >= MAX_PROPERTIES) {
      toast({
        title: "Maximum Properties Reached",
        description: `You can compare up to ${MAX_PROPERTIES} properties at a time.`,
        variant: "destructive",
      });
      return;
    }

    if (!isPropertySelected(property)) {
      setSelectedProperties(prev => [...prev, property]);
      toast({
        title: "Property Added",
        description: "Property added to comparison list.",
      });
    }
  };

  // Remove a property from the comparison list
  const removeProperty = (property: Property) => {
    setSelectedProperties(prev => prev.filter(p => p.id !== property.id));
    toast({
      title: "Property Removed",
      description: "Property removed from comparison list.",
    });
  };

  // Clear all selected properties
  const clearSelectedProperties = () => {
    setSelectedProperties([]);
    toast({
      title: "Comparison Cleared",
      description: "All properties have been removed from the comparison.",
    });
  };

  // Context value
  const value: PropertyComparisonContextType = {
    selectedProperties,
    isPropertySelected,
    togglePropertySelection,
    clearSelectedProperties,
    addProperty,
    removeProperty,
    showComparison,
    setShowComparison,
  };

  return (
    <PropertyComparisonContext.Provider value={value}>
      {children}
    </PropertyComparisonContext.Provider>
  );
};