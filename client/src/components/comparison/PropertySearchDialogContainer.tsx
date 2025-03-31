import React, { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { PropertySearchDialog } from './PropertySearchDialog';
import { Property } from '../../shared/schema';
import { apiRequest } from '@/lib/queryClient';

interface PropertySearchDialogContainerProps {
  buttonText?: string;
  onSelectProperty: (property: Property) => void;
}

export const PropertySearchDialogContainer: React.FC<PropertySearchDialogContainerProps> = ({
  buttonText,
  onSelectProperty
}) => {
  // Fetch all properties for search
  const { data: properties, isLoading, error } = useQuery({
    queryKey: ['/api/properties'],
    queryFn: async () => {
      const response = await apiRequest(
        'GET',
        '/api/properties'
      );
      return response.json();
    }
  });

  if (isLoading || error || !properties) {
    // Return a button that doesn't do anything while loading or on error
    return (
      <PropertySearchDialog
        properties={[]}
        buttonText={buttonText}
        onSelectProperty={onSelectProperty}
      />
    );
  }

  return (
    <PropertySearchDialog
      properties={properties}
      buttonText={buttonText}
      onSelectProperty={onSelectProperty}
    />
  );
};