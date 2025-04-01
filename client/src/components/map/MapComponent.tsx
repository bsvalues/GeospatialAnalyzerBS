import React, { useState } from 'react';
import { MapContainer, TileLayer, ZoomControl, LayersControl } from 'react-leaflet';
import { HeatmapVisualization } from '../analysis/HeatmapVisualization';
import { HotspotVisualization } from '../analysis/HotspotVisualization';
import { Property } from '@shared/schema';
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
  center = [47.123, -122.456], // Default center (Benton County, WA)
  zoom = 12,
  children 
}) => {
  // State for active visualization layers
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showHotspots, setShowHotspots] = useState<boolean>(false);
  
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
      
      {/* Additional map elements passed as children */}
      {children}
    </MapContainer>
  );
};