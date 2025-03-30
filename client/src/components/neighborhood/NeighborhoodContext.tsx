import React, { createContext, useContext, useState, useCallback, ReactNode } from 'react';
import { Property } from '@/shared/types';
import neighborhoodService, { NeighborhoodData } from '@/services/neighborhoodService';

interface NeighborhoodContextType {
  currentNeighborhoodData: NeighborhoodData | null;
  loadNeighborhoodData: (property: Property) => Promise<NeighborhoodData>;
  isLoading: boolean;
  error: string | null;
}

const NeighborhoodContext = createContext<NeighborhoodContextType | undefined>(undefined);

export const useNeighborhood = (): NeighborhoodContextType => {
  const context = useContext(NeighborhoodContext);
  if (!context) {
    throw new Error('useNeighborhood must be used within a NeighborhoodProvider');
  }
  return context;
};

interface NeighborhoodProviderProps {
  children: ReactNode;
}

export const NeighborhoodProvider: React.FC<NeighborhoodProviderProps> = ({ children }) => {
  const [currentNeighborhoodData, setCurrentNeighborhoodData] = useState<NeighborhoodData | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Uses the neighborhood service to load data
  const loadNeighborhoodData = useCallback(async (property: Property): Promise<NeighborhoodData> => {
    setIsLoading(true);
    setError(null);

    try {
      // Use the neighborhood service to fetch data
      const data = await neighborhoodService.getNeighborhoodData(property);
      
      setCurrentNeighborhoodData(data);
      setIsLoading(false);
      return data;
    } catch (err) {
      const errorMsg = err instanceof Error ? err.message : 'Failed to load neighborhood data';
      setError(errorMsg);
      setIsLoading(false);
      throw new Error(errorMsg);
    }
  }, []);

  const value = {
    currentNeighborhoodData,
    loadNeighborhoodData,
    isLoading,
    error,
  };

  return (
    <NeighborhoodContext.Provider value={value}>
      {children}
    </NeighborhoodContext.Provider>
  );
};

export default NeighborhoodProvider;