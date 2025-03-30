import React from 'react';
import { Property, MapLayer } from '@/shared/types';
import { usePropertySelection } from './PropertySelectionContext';
import LeafletMap from './LeafletMap';

interface MapComponentProps {
  layers: MapLayer[];
  properties: Property[];
  center: [number, number];
  zoom: number;
  selectedProperty?: Property | null;
  onSelectProperty?: (property: Property) => void;
}

export const MapComponent: React.FC<MapComponentProps> = ({
  layers,
  properties,
  center,
  zoom,
  selectedProperty,
  onSelectProperty
}) => {
  const { selectProperty, selectedProperties } = usePropertySelection();
  
  // Handler for property selection
  const handlePropertySelect = (property: Property) => {
    // Call the parent's handler if provided
    if (onSelectProperty) {
      onSelectProperty(property);
    }
    
    // Update the property selection context
    selectProperty(property);
  };

  return (
    <LeafletMap
      properties={properties}
      layers={layers}
      center={center}
      zoom={zoom}
      selectedProperties={selectedProperty ? [selectedProperty, ...selectedProperties] : selectedProperties}
      onSelectProperty={handlePropertySelect}
    />
  );
};