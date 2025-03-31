import React from 'react';
import { Button } from '@/components/ui/button';
import { Property } from '../../shared/schema';
import { Search } from 'lucide-react';

interface FindSimilarPropertiesButtonProps {
  property?: Property | null;
  onFindSimilar: (property: Property) => void;
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
  disabled?: boolean;
}

export const FindSimilarPropertiesButton: React.FC<FindSimilarPropertiesButtonProps> = ({
  property,
  onFindSimilar,
  className,
  variant = "default",
  size = "sm",
  disabled = false
}) => {
  const handleClick = () => {
    if (property) {
      onFindSimilar(property);
    }
  };

  return (
    <Button
      className={className}
      variant={variant}
      size={size}
      onClick={handleClick}
      disabled={disabled || !property}
    >
      <Search className="h-4 w-4 mr-2" />
      Find Similar Properties
    </Button>
  );
};