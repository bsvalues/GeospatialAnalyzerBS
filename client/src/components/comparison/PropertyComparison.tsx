import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { usePropertyComparison } from './PropertyComparisonContext';
import PropertyComparisonTool from './PropertyComparisonTool';

export const PropertyComparison: React.FC = () => {
  const { selectedProperties, showComparison, setShowComparison } = usePropertyComparison();

  // Close handler
  const handleClose = () => {
    setShowComparison(false);
  };

  // Only render if there are at least 2 properties and showComparison is true
  const shouldShow = selectedProperties.length >= 2 && showComparison;

  return (
    <Dialog open={shouldShow} onOpenChange={setShowComparison}>
      <DialogContent className="sm:max-w-4xl p-0 overflow-hidden border-none">
        <PropertyComparisonTool 
          properties={selectedProperties} 
          onClose={handleClose}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PropertyComparison;