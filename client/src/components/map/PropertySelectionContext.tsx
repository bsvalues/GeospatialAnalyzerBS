import React, { createContext, useContext, useState, ReactNode, useCallback } from 'react';
import { Property } from '@/shared/types';
import { useToast } from '@/hooks/use-toast';

// Types of bulk operations that can be performed
type BulkOperationType = 'add' | 'remove' | 'toggle' | 'replace';

interface PropertySelectionContextType {
  selectedProperties: Property[];
  selectProperty: (property: Property) => void;
  unselectProperty: (property: Property) => void;
  isPropertySelected: (property: Property) => boolean;
  clearSelectedProperties: () => void;
  selectProperties: (properties: Property[]) => void;
  
  // Enhanced functionality
  filterProperties: (filterFn: (property: Property) => boolean) => void;
  sortProperties: (compareFn: (a: Property, b: Property) => number) => void;
  bulkOperation: (
    operation: BulkOperationType, 
    predicateFn: (property: Property) => boolean
  ) => void;
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
  
  // Filter selected properties based on criteria
  const filterProperties = useCallback((filterFn: (property: Property) => boolean) => {
    const filteredProperties = selectedProperties.filter(filterFn);
    
    if (filteredProperties.length === 0) {
      toast({
        title: "No properties match filter",
        description: "The filter criteria didn't match any selected properties",
        variant: "destructive"
      });
      return;
    }
    
    setSelectedProperties(filteredProperties);
    
    toast({
      title: "Properties filtered",
      description: `Filtered to ${filteredProperties.length} properties that match criteria`,
      variant: "default"
    });
  }, [selectedProperties, toast]);
  
  // Sort selected properties based on comparison function
  const sortProperties = useCallback((compareFn: (a: Property, b: Property) => number) => {
    if (selectedProperties.length <= 1) {
      return; // Nothing to sort
    }
    
    const sortedProperties = [...selectedProperties].sort(compareFn);
    setSelectedProperties(sortedProperties);
    
    toast({
      title: "Properties sorted",
      description: "Properties have been reordered based on the sorting criteria",
      variant: "default"
    });
  }, [selectedProperties, toast]);
  
  // Perform bulk operations based on criteria
  const bulkOperation = useCallback((
    operation: BulkOperationType, 
    predicateFn: (property: Property) => boolean
  ) => {
    switch (operation) {
      case 'add': {
        // Not implemented - would require access to all properties, not just selected
        toast({
          title: "Operation not supported",
          description: "Adding properties requires access to all available properties",
          variant: "destructive"
        });
        break;
      }
      case 'remove': {
        const propertiesBeforeRemoval = selectedProperties.length;
        const newSelectedProperties = selectedProperties.filter(p => !predicateFn(p));
        
        if (newSelectedProperties.length === propertiesBeforeRemoval) {
          toast({
            title: "No properties matched",
            description: "No properties were removed as none matched the criteria",
            variant: "destructive"
          });
          return;
        }
        
        setSelectedProperties(newSelectedProperties);
        
        toast({
          title: "Properties removed",
          description: `Removed ${propertiesBeforeRemoval - newSelectedProperties.length} properties`,
          variant: "default"
        });
        break;
      }
      case 'toggle': {
        // For toggle, we need to separate the predicateFn matches into two groups
        const matchingProperties = selectedProperties.filter(predicateFn);
        const nonMatchingProperties = selectedProperties.filter(p => !predicateFn(p));
        
        // If all properties matched, we'll remove them all (act like 'remove')
        if (matchingProperties.length === selectedProperties.length) {
          setSelectedProperties([]);
          toast({
            title: "All properties removed",
            description: "All properties matched criteria and were removed",
            variant: "default"
          });
          return;
        }
        
        // If no properties matched, do nothing
        if (matchingProperties.length === 0) {
          toast({
            title: "No properties matched",
            description: "No properties matched the criteria for toggling",
            variant: "destructive"
          });
          return;
        }
        
        // Otherwise, keep only the non-matching properties
        setSelectedProperties(nonMatchingProperties);
        
        toast({
          title: "Properties toggled",
          description: `Removed ${matchingProperties.length} matching properties`,
          variant: "default"
        });
        break;
      }
      case 'replace': {
        const matchingProperties = selectedProperties.filter(predicateFn);
        
        if (matchingProperties.length === 0) {
          toast({
            title: "No properties matched",
            description: "No properties matched the replacement criteria",
            variant: "destructive"
          });
          return;
        }
        
        setSelectedProperties(matchingProperties);
        
        toast({
          title: "Selection replaced",
          description: `Now showing only the ${matchingProperties.length} properties that matched criteria`,
          variant: "default"
        });
        break;
      }
    }
  }, [selectedProperties, toast]);

  return (
    <PropertySelectionContext.Provider
      value={{
        selectedProperties,
        selectProperty,
        unselectProperty,
        isPropertySelected,
        clearSelectedProperties,
        selectProperties,
        filterProperties,
        sortProperties,
        bulkOperation
      }}
    >
      {children}
    </PropertySelectionContext.Provider>
  );
};