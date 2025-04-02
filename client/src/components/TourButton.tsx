import React from 'react';
import { Button } from '@/components/ui/button';
import { useTour } from '@/contexts/TourContext';
import { HelpCircle } from 'lucide-react';
import Tooltip from '@/components/ui/tooltip';
import { 
  mainTourSteps, 
  comparisonTourSteps, 
  heatmapTourSteps, 
  mapTourSteps, 
  exportTourSteps 
} from '@/services/tourService';

interface TourButtonProps {
  className?: string;
  variant?: 'default' | 'secondary' | 'outline' | 'ghost' | 'link' | 'destructive';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  showTooltip?: boolean;
  tooltipContent?: string;
  tourSteps?: 'main' | 'comparison' | 'heatmap' | 'map' | 'export';
}

export function TourButton({
  className = '',
  variant = 'outline',
  size = 'icon',
  showTooltip = true,
  tooltipContent = 'Start guided tour',
  tourSteps = 'main'
}: TourButtonProps) {
  const { startTour, steps, setSteps } = useTour();
  
  const handleStartTour = () => {
    // Set the appropriate tour steps based on the context
    let selectedSteps;
    switch (tourSteps) {
      case 'comparison':
        selectedSteps = comparisonTourSteps;
        break;
      case 'heatmap':
        selectedSteps = heatmapTourSteps;
        break;
      case 'map':
        selectedSteps = mapTourSteps;
        break;
      case 'export':
        selectedSteps = exportTourSteps;
        break;
      default:
        selectedSteps = mainTourSteps;
    }
    
    startTour(selectedSteps);
  };
  
  const button = (
    <Button 
      variant={variant} 
      size={size}
      className={className}
      onClick={handleStartTour}
      aria-label="Start guided tour"
      data-tour="help-button"
    >
      <HelpCircle className="h-4 w-4" />
    </Button>
  );
  
  if (showTooltip) {
    return (
      <Tooltip content={tooltipContent}>
        {button}
      </Tooltip>
    );
  }
  
  return button;
}