import React from 'react';
import { Button } from '@/components/ui/button';
import { usePropertyComparison } from './PropertyComparisonContext';
import { Property } from '@shared/schema';
import { Search } from 'lucide-react';

interface FindSimilarPropertiesButtonProps {
  property: Property;
  variant?: 'default' | 'outline' | 'secondary';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
}

/**
 * A button component that opens the property search dialog with
 * the specified property as the reference point.
 */
export const FindSimilarPropertiesButton: React.FC<FindSimilarPropertiesButtonProps> = ({
  property,
  variant = 'default',
  size = 'default', 
  className = ''
}) => {
  const { openSearchDialog } = usePropertyComparison();
  
  const handleClick = () => {
    openSearchDialog(property);
  };
  
  return (
    <Button
      variant={variant}
      size={size}
      onClick={handleClick}
      className={className}
    >
      <Search className="h-4 w-4 mr-2" />
      Find Similar Properties
    </Button>
  );
};

export default FindSimilarPropertiesButton;