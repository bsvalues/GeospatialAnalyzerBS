import React from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Property } from '@shared/schema';
import { MapComponent } from '../map/MapComponent';

// Interface for component props
interface MapPanelProps {
  properties: Property[];
  className?: string;
}

/**
 * Panel for displaying the interactive property map
 */
export const MapPanel: React.FC<MapPanelProps> = ({ 
  properties, 
  className = '' 
}) => {
  return (
    <Card className={`shadow-md overflow-visible ${className}`}>
      <CardHeader className="py-3">
        <CardTitle>Property Map</CardTitle>
      </CardHeader>
      <CardContent className="p-0 h-[calc(100%-4rem)] overflow-visible">
        <MapComponent properties={properties} />
      </CardContent>
    </Card>
  );
};