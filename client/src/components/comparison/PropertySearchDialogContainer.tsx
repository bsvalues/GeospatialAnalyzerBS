import React from 'react';
import { usePropertyComparison } from './PropertyComparisonContext';
import PropertySearchDialog from './PropertySearchDialog';

/**
 * This component serves as a container/wrapper for the PropertySearchDialog,
 * handling the connection between the dialog and the PropertyComparisonContext.
 */
export const PropertySearchDialogContainer: React.FC = () => {
  const { 
    isSearchDialogOpen,
    closeSearchDialog,
    currentReferenceProperty,
    searchForComparableProperties,
    addProperty
  } = usePropertyComparison();
  
  // Don't render anything if the dialog is closed or there's no reference property
  if (!isSearchDialogOpen || !currentReferenceProperty) {
    return null;
  }
  
  // Render the search dialog with the necessary props
  return (
    <PropertySearchDialog
      isOpen={isSearchDialogOpen}
      referenceProperty={currentReferenceProperty}
      onSearch={searchForComparableProperties}
      onSelect={addProperty}
      onClose={closeSearchDialog}
    />
  );
};

export default PropertySearchDialogContainer;