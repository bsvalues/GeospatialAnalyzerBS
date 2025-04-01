import React, { ReactNode, useState } from 'react';
import { cn } from '@/lib/utils';

export interface TooltipProps {
  children: ReactNode;
  content: ReactNode;
  placement?: 'top' | 'right' | 'bottom' | 'left';
  delay?: number;
  className?: string;
}

export const Tooltip: React.FC<TooltipProps> = ({
  children,
  content,
  placement = 'top',
  delay = 300,
  className,
}) => {
  const [isVisible, setIsVisible] = useState(false);
  const [timeoutId, setTimeoutId] = useState<NodeJS.Timeout | null>(null);

  const handleMouseEnter = () => {
    const id = setTimeout(() => {
      setIsVisible(true);
    }, delay);
    setTimeoutId(id);
  };

  const handleMouseLeave = () => {
    if (timeoutId) {
      clearTimeout(timeoutId);
      setTimeoutId(null);
    }
    setIsVisible(false);
  };

  const placementClasses = {
    top: 'bottom-full left-1/2 transform -translate-x-1/2 -translate-y-2 mb-1',
    right: 'left-full top-1/2 transform -translate-y-1/2 translate-x-2 ml-1',
    bottom: 'top-full left-1/2 transform -translate-x-1/2 translate-y-2 mt-1',
    left: 'right-full top-1/2 transform -translate-y-1/2 -translate-x-2 mr-1',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 transform -translate-x-1/2 border-t-2 border-r-2 border-transparent',
    right: 'right-full top-1/2 transform -translate-y-1/2 border-r-2 border-b-2 border-transparent',
    bottom: 'bottom-full left-1/2 transform -translate-x-1/2 border-b-2 border-l-2 border-transparent',
    left: 'left-full top-1/2 transform -translate-y-1/2 border-l-2 border-t-2 border-transparent',
  };

  return (
    <div className="relative inline-block" onMouseEnter={handleMouseEnter} onMouseLeave={handleMouseLeave}>
      {children}
      {isVisible && (
        <div
          className={cn(
            'absolute z-50 px-2 py-1 bg-gray-900 text-white text-xs rounded shadow-md whitespace-nowrap',
            placementClasses[placement],
            className
          )}
        >
          {content}
          <div 
            className={cn(
              'absolute w-2 h-2 bg-gray-900 transform rotate-45',
              arrowClasses[placement]
            )}
          />
        </div>
      )}
    </div>
  );
};

export default Tooltip;