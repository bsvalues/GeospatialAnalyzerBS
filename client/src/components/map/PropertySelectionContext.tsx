import React, { createContext, useContext, useState, ReactNode } from 'react';
import { Property } from '@/shared/types';
import { useToast } from '@/hooks/use-toast';

interface PropertySelectionContextType {
  selectedProperties: Property[];
  selectProperty: (property: Property) => void;
  unselectProperty: (property: Property) => void;
  isPropertySelected: (property: Property) => boolean;
  clearSelectedProperties: () => void;
  selectProperties: (properties: Property[]) => void;
}

const PropertySelectionContext = createContext<PropertySelectionContextType | undefined>(undefined);

export const usePropertySelection = (): PropertySelectionContextType => {
  const context = useContext(PropertySelectionContext);
  
  if (!context) {
    throw new Error('usePropertySelection must be used within a PropertySelectionProvider');
  }
  
  return context;
};

interface PropertySelectionProviderProps {
  children: ReactNode;
  maxSelectedProperties?: number;
}

export const PropertySelectionProvider: React.FC<PropertySelectionProviderProps> = ({
  children,
  maxSelectedProperties = 10,
}) => {
  const [selectedProperties, setSelectedProperties] = useState<Property[]>([]);
  const { toast } = useToast();
  
  // Helper to check if a property is already selected
  const isPropertySelected = (property: Property): boolean => {
    return selectedProperties.some(p => p.id === property.id);
  };
  
  // Add a property to the selection
  const selectProperty = (property: Property) => {
    if (isPropertySelected(property)) {
      return; // Already selected
    }
    
    if (selectedProperties.length >= maxSelectedProperties) {
      toast({
        title: "Selection limit reached",
        description: `You can only select up to ${maxSelectedProperties} properties at once`,
        variant: "destructive"
      });
      return;
    }
    
    setSelectedProperties(prev => [...prev, property]);
    
    toast({
      title: "Property selected",
      description: `Added ${property.address} to your selection`,
      variant: "default"
    });
  };
  
  // Remove a property from the selection
  const unselectProperty = (property: Property) => {
    if (!isPropertySelected(property)) {
      return; // Not selected
    }
    
    setSelectedProperties(prev => prev.filter(p => p.id !== property.id));
    
    toast({
      title: "Property removed",
      description: `Removed ${property.address} from your selection`,
      variant: "default"
    });
  };
  
  // Clear all selected properties
  const clearSelectedProperties = () => {
    if (selectedProperties.length === 0) {
      return;
    }
    
    setSelectedProperties([]);
    
    toast({
      title: "Selection cleared",
      description: "All properties have been removed from your selection",
      variant: "default"
    });
  };
  
  // Select multiple properties at once
  const selectProperties = (properties: Property[]) => {
    if (properties.length === 0) {
      return;
    }
    
    // Filter out properties that would exceed the limit
    const availableSlots = maxSelectedProperties - selectedProperties.length;
    
    if (availableSlots <= 0) {
      toast({
        title: "Selection limit reached",
        description: `You can only select up to ${maxSelectedProperties} properties at once`,
        variant: "destructive"
      });
      return;
    }
    
    // Filter out already selected properties and limit to available slots
    const newProperties = properties
      .filter(property => !isPropertySelected(property))
      .slice(0, availableSlots);
    
    if (newProperties.length === 0) {
      return;
    }
    
    setSelectedProperties(prev => [...prev, ...newProperties]);
    
    toast({
      title: "Properties selected",
      description: `Added ${newProperties.length} properties to your selection`,
      variant: "default"
    });
  };
  
  return (
    <PropertySelectionContext.Provider
      value={{
        selectedProperties,
        selectProperty,
        unselectProperty,
        isPropertySelected,
        clearSelectedProperties,
        selectProperties,
      }}
    >
      {children}
    </PropertySelectionContext.Provider>
  );
};