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
  
  // Search and compare functionality
  isSearchDialogOpen: boolean;
  openSearchDialog: (referenceProperty: Property) => void;
  closeSearchDialog: () => void;
  currentReferenceProperty: Property | null;
  searchForComparableProperties: (params: any) => Promise<Property[]>;
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
  const [isSearchDialogOpen, setIsSearchDialogOpen] = useState<boolean>(false);
  const [currentReferenceProperty, setCurrentReferenceProperty] = useState<Property | null>(null);
  const { toast } = useToast();

  // Maximum number of properties that can be compared at once
  const MAX_PROPERTIES = 9;

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
  
  // Search dialog management
  const openSearchDialog = (referenceProperty: Property) => {
    setCurrentReferenceProperty(referenceProperty);
    setIsSearchDialogOpen(true);
  };
  
  const closeSearchDialog = () => {
    setIsSearchDialogOpen(false);
  };
  
  // Mock implementation for searching comparable properties
  // In a real implementation, this would call an API endpoint
  const searchForComparableProperties = async (params: any): Promise<Property[]> => {
    // Simulate API call with a delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Return some mock data for development purposes
    // In production, this would be replaced with actual API calls
    const properties: Property[] = [
      {
        id: "prop-1",
        parcelId: "APN123456",
        address: "125 Main St, Richland, WA",
        owner: "Jane Smith",
        value: "$320,000",
        salePrice: "$305,000",
        squareFeet: 2100,
        yearBuilt: 2008,
        landValue: "$95,000",
        coordinates: [46.28, -119.28]
      },
      {
        id: "prop-2",
        parcelId: "APN123457",
        address: "130 Oak Ave, Kennewick, WA",
        owner: "John Doe",
        value: "$350,000",
        salePrice: "$335,000",
        squareFeet: 2300,
        yearBuilt: 2010,
        landValue: "$105,000",
        coordinates: [46.21, -119.17]
      },
      {
        id: "prop-3",
        parcelId: "APN123458",
        address: "240 Vineyard Dr, Prosser, WA",
        owner: "Robert Johnson",
        value: "$290,000",
        salePrice: "$275,000",
        squareFeet: 1950,
        yearBuilt: 2005,
        landValue: "$85,000",
        coordinates: [46.24, -119.76]
      },
      {
        id: "prop-4",
        parcelId: "APN123459",
        address: "555 Columbia Ave, Richland, WA",
        owner: "Mary Williams",
        value: "$380,000",
        salePrice: "$365,000",
        squareFeet: 2600,
        yearBuilt: 2012,
        landValue: "$120,000",
        coordinates: [46.29, -119.29]
      },
      {
        id: "prop-5",
        parcelId: "APN123460",
        address: "720 Franklin St, Pasco, WA",
        owner: "Steven Davis",
        value: "$275,000",
        salePrice: "$260,000",
        squareFeet: 1850,
        yearBuilt: 2003,
        landValue: "$80,000",
        coordinates: [46.23, -119.10]
      }
    ];
    
    // Filter based on search parameters
    const filteredProperties = properties.filter(property => {
      // Basic filtering example - in a real implementation this would be more sophisticated
      if (params.squareFootageMin && property.squareFeet < params.squareFootageMin) return false;
      if (params.squareFootageMax && property.squareFeet > params.squareFootageMax) return false;
      if (params.yearBuiltMin && property.yearBuilt && property.yearBuilt < params.yearBuiltMin) return false;
      if (params.yearBuiltMax && property.yearBuilt && property.yearBuilt > params.yearBuiltMax) return false;
      
      // Price filtering
      if (params.priceMin || params.priceMax) {
        const propertyValue = property.value ? parseFloat(property.value.replace(/[$,]/g, '')) : 0;
        if (params.priceMin && propertyValue < params.priceMin) return false;
        if (params.priceMax && propertyValue > params.priceMax) return false;
      }
      
      return true;
    });
    
    return filteredProperties;
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
    
    // Search functionality
    isSearchDialogOpen,
    openSearchDialog,
    closeSearchDialog,
    currentReferenceProperty,
    searchForComparableProperties,
  };

  return (
    <PropertyComparisonContext.Provider value={value}>
      {children}
    </PropertyComparisonContext.Provider>
  );
};