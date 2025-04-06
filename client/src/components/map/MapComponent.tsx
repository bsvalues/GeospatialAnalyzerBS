import React, { useState, useRef, useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, LayersControl, Popup, useMap } from 'react-leaflet';
import { HeatmapVisualization } from '../analysis/HeatmapVisualization';
import { HotspotVisualization } from '../analysis/HotspotVisualization';
import MarkerClusterGroup from './MarkerClusterGroup';
import PropertyInfoPopup from './PropertyInfoPopup';
import { Property } from '@shared/schema';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

const { BaseLayer, Overlay } = LayersControl;

// Interface for component props
interface MapComponentProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
}

/**
 * Main map component that handles various visualization layers
 */
export const MapComponent: React.FC<MapComponentProps> = ({ 
  properties, 
  center = [46.26, -119.28], // Default center (Benton County, WA)
  zoom = 10,
  children 
}) => {
  // State for active visualization layers
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showHotspots, setShowHotspots] = useState<boolean>(false);
  
  // State for property selection and popup position
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null);
  
  // Handler for property selection from cluster
  const handlePropertySelect = (property: any) => {
    setSelectedProperty(property);
    console.log('Selected property:', property);
    
    // Set popup position if coordinates are available
    if (property.latitude && property.longitude) {
      setPopupPosition([Number(property.latitude), Number(property.longitude)]);
    } else {
      setPopupPosition(null);
    }
  };
  
  // Handler to close the popup
  const handleClosePopup = () => {
    setSelectedProperty(null);
    setPopupPosition(null);
  };

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <ZoomControl position="bottomright" />
      
      <LayersControl position="topright">
        <BaseLayer checked name="Street Map">
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          />
        </BaseLayer>
        <BaseLayer name="Satellite">
          <TileLayer
            url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
            attribution='&copy; <a href="https://www.esri.com/">Esri</a>'
          />
        </BaseLayer>
        <BaseLayer name="Topographic">
          <TileLayer
            url="https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png"
            attribution='&copy; <a href="https://opentopomap.org">OpenTopoMap</a> contributors'
          />
        </BaseLayer>
        
        <Overlay name="Heat Map">
          <HeatmapVisualization properties={properties} />
        </Overlay>
        
        <Overlay name="Hotspot Analysis">
          <HotspotVisualization properties={properties} />
        </Overlay>
      </LayersControl>
      
      {/* Property markers with clustering */}
      <MarkerClusterGroup 
        properties={properties} 
        onPropertySelect={handlePropertySelect}
        selectedProperty={selectedProperty}
      />
      
      {/* Selected property popup */}
      {selectedProperty && popupPosition && (
        <Popup 
          position={popupPosition}
          eventHandlers={{ 
            remove: handleClosePopup 
          }}
          className="property-detail-popup"
        >
          <PropertyInfoPopup 
            property={selectedProperty} 
            onClose={handleClosePopup} 
          />
        </Popup>
      )}
      
      {/* Additional map elements passed as children */}
      {children}
    </MapContainer>
  );
};