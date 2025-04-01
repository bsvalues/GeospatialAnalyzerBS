import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, LayerGroup, CircleMarker, ZoomControl, GeoJSON, Tooltip, Rectangle, Polygon } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@shared/schema';
import { MapLayer, MapOptions } from '@/shared/types';
import { formatCurrency } from '@/lib/utils';

// Import accessibility components
import { AccessibleMapComponents } from './AccessibleMapComponents';
import { AccessiblePropertyMarker } from './AccessiblePropertyMarker';
import MapLegend from './MapLegend';

// Import new map tools
import MeasurementTools from './MeasurementTools';
import MiniMap from './MiniMap';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Note: We're referencing these CSS files but not actually importing them
// as they would be added in a real implementation with the actual plugins
// import 'leaflet-fullscreen/dist/Leaflet.fullscreen.css';
// import 'leaflet-measure/dist/leaflet-measure.css';

// Extend Leaflet with additional plugins
// (Note: In a real implementation, we would actually load these plugins)

// Custom animated marker effect - creates a pulsing effect around markers
const createPulsingIcon = (color: string, size: number = 24) => {
  return L.divIcon({
    className: 'custom-pulsing-icon',
    html: `
      <div style="position: relative;">
        <div style="
          background-color: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 0 15px rgba(0,0,0,0.4);
          position: relative;
          z-index: 2;
        "></div>
        <div style="
          position: absolute;
          top: -10px;
          left: -10px;
          right: -10px;
          bottom: -10px;
          border-radius: 50%;
          background: ${color};
          opacity: 0.4;
          animation: pulse 1.5s infinite;
          z-index: 1;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

// 3D Effect marker with shadow
const create3DIcon = (color: string, size: number = 24) => {
  const darkColor = adjustColor(color, -30); // Darker shade for 3D effect
  
  return L.divIcon({
    className: 'custom-3d-icon',
    html: `
      <div style="
        position: relative;
        width: ${size}px;
        height: ${size}px;
      ">
        <!-- Main marker -->
        <div style="
          position: absolute;
          top: 0;
          left: 0;
          width: 100%;
          height: 100%;
          background: linear-gradient(135deg, ${color}, ${darkColor});
          border-radius: 50%;
          border: 2px solid white;
          box-shadow: 0 4px 8px rgba(0,0,0,0.3);
          z-index: 10;
        "></div>
        
        <!-- Shadow effect -->
        <div style="
          position: absolute;
          bottom: -4px;
          left: 2px;
          width: 90%;
          height: 10%;
          background: rgba(0,0,0,0.3);
          border-radius: 50%;
          filter: blur(2px);
          z-index: 5;
        "></div>
        
        <!-- Top highlight for 3D effect -->
        <div style="
          position: absolute;
          top: 4px;
          left: 4px;
          width: 35%;
          height: 35%;
          background: rgba(255,255,255,0.7);
          border-radius: 50%;
          z-index: 15;
        "></div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

// Helper function to adjust color brightness
function adjustColor(hex: string, percent: number): string {
  // Remove # if present
  hex = hex.replace(/^#/, '');
  
  // Parse the hex color
  let r = parseInt(hex.substring(0, 2), 16);
  let g = parseInt(hex.substring(2, 4), 16);
  let b = parseInt(hex.substring(4, 6), 16);
  
  // Adjust brightness
  r = Math.min(255, Math.max(0, r + percent));
  g = Math.min(255, Math.max(0, g + percent));
  b = Math.min(255, Math.max(0, b + percent));
  
  // Convert back to hex
  return `#${r.toString(16).padStart(2, '0')}${g.toString(16).padStart(2, '0')}${b.toString(16).padStart(2, '0')}`;
}

// Create standard marker icons
const createStandardIcon = (color: string, size: number = 22) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: ${size}px; height: ${size}px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

// Fancy text labels for markers
const createLabeledIcon = (color: string, label: string, size: number = 26) => {
  return L.divIcon({
    className: 'custom-labeled-icon',
    html: `
      <div style="position: relative;">
        <div style="
          background-color: ${color}; 
          width: ${size}px; 
          height: ${size}px; 
          border-radius: 50%; 
          border: 2px solid white; 
          box-shadow: 0 2px 5px rgba(0,0,0,0.3);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: ${size * 0.6}px;
        ">${label}</div>
      </div>
    `,
    iconSize: [size, size],
    iconAnchor: [size/2, size/2],
    popupAnchor: [0, -size/2]
  });
};

const DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create custom markers based on property types (now with enhanced 3D look)
const ResidentialIcon = create3DIcon('#4ade80', 26); // Green
const CommercialIcon = create3DIcon('#3b82f6', 26); // Blue
const IndustrialIcon = create3DIcon('#ef4444', 26); // Red
const AgriculturalIcon = create3DIcon('#f59e0b', 26); // Amber
const SelectedIcon = createPulsingIcon('#f43f5e', 28); // Pink with pulsing effect
const DefaultDotIcon = createStandardIcon('#6b7280', 22); // Gray

// Create labeled icons for specific categories
const PropertyIcon1 = createLabeledIcon('#8b5cf6', 'R', 28); // Purple with R label
const PropertyIcon2 = createLabeledIcon('#ec4899', 'C', 28); // Pink with C label
const PropertyIcon3 = createLabeledIcon('#14b8a6', 'A', 28); // Teal with A label

L.Marker.prototype.options.icon = DefaultIcon;

interface MapComponentProps {
  properties?: Property[];
  selectedProperty?: Property | null;
  onPropertySelect?: (property: Property) => void;
  layers?: MapLayer[];
  mapOptions?: Partial<MapOptions>;
  height?: string;
  width?: string;
}

// Component that handles map center and zoom changes
const MapController: React.FC<{
  center: [number, number];
  zoom: number;
  selectedProperty?: Property | null;
}> = ({ center, zoom, selectedProperty }) => {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center, zoom);
  }, [map, center, zoom]);
  
  useEffect(() => {
    if (selectedProperty?.coordinates) {
      map.setView(selectedProperty.coordinates as [number, number], Math.max(zoom, 15));
    }
  }, [map, selectedProperty, zoom]);
  
  return null;
};

// Helper to get property value as number
const getPropertyValueAsNumber = (property: Property): number => {
  if (!property.value) return 0;
  return parseFloat(property.value.replace(/[^0-9.-]+/g, '')) || 0;
};

// Helper to get the marker icon based on property type
const getPropertyIcon = (property: Property, isSelected: boolean): L.DivIcon => {
  if (isSelected) {
    return SelectedIcon;
  }
  
  const propertyType = property.propertyType?.toLowerCase() || '';
  
  if (propertyType.includes('residential') || propertyType.includes('home')) {
    return ResidentialIcon;
  } else if (propertyType.includes('commercial') || propertyType.includes('office') || propertyType.includes('retail')) {
    return CommercialIcon;
  } else if (propertyType.includes('industrial') || propertyType.includes('manufacturing')) {
    return IndustrialIcon;
  } else if (propertyType.includes('agricultural') || propertyType.includes('farm')) {
    return AgriculturalIcon;
  }
  
  return DefaultDotIcon;
};

export const MapComponent: React.FC<MapComponentProps> = ({
  properties = [],
  selectedProperty = null,
  onPropertySelect,
  layers = [],
  mapOptions = {},
  height = '100%',
  width = '100%'
}) => {
  // Benton County, WA default center and zoom
  const defaultCenter: [number, number] = [46.2800, -119.2680]; // Coordinates for Benton County
  const defaultZoom = 11;
  
  const { center = defaultCenter, zoom = defaultZoom, opacity = 1, labels = true } = mapOptions;
  
  // Keep track of the map instance
  const mapRef = useRef<L.Map | null>(null);
  
  // State for hover effect
  const [hoveredPropertyId, setHoveredPropertyId] = useState<number | null>(null);
  
  // Filter layers by type
  const baseLayers = layers.filter(layer => layer.type === 'base');
  const viewableLayers = layers.filter(layer => layer.type === 'viewable');
  const analysisLayers = layers.filter(layer => layer.type === 'analysis');
  
  // Handler for marker click
  const handleMarkerClick = (property: Property) => {
    if (onPropertySelect) {
      onPropertySelect(property);
    }
  };
  
  // Calculate min/max values for property values (for heat visualization)
  const propertyValues = properties
    .map(p => getPropertyValueAsNumber(p))
    .filter(val => val > 0);
  
  const minValue = Math.min(...(propertyValues.length ? propertyValues : [0]));
  const maxValue = Math.max(...(propertyValues.length ? propertyValues : [1]));
  
  // Get color based on property value (for heatmap)
  const getValueColor = (value: number): string => {
    if (!value || minValue === maxValue) return '#6b7280';
    
    const normalizedValue = (value - minValue) / (maxValue - minValue);
    
    if (normalizedValue < 0.2) return '#4ade80'; // Low values (green)
    if (normalizedValue < 0.4) return '#a3e635';
    if (normalizedValue < 0.6) return '#facc15';
    if (normalizedValue < 0.8) return '#fb923c'; 
    return '#ef4444'; // High values (red)
  };
  
  return (
    <div 
      style={{ height, width, position: 'relative' }} 
      data-testid="map-container"
      aria-label="Interactive map of properties in Benton County, Washington"
      role="application"
    >
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // We'll use our accessible controls instead
        ref={mapRef}
        whenReady={() => {
          console.log('Map is ready');
        }}
      >
        {/* Use our custom accessible map controls */}
        <AccessibleMapComponents 
          defaultCenter={center}
          defaultZoom={zoom}
          enableFullScreen={true}
          enablePanControls={true}
        />
        
        <MapController 
          center={center} 
          zoom={zoom} 
          selectedProperty={selectedProperty} 
        />
        
        {/* Base layers */}
        <LayersControl position="topright">
          {/* Default OpenStreetMap layer */}
          <LayersControl.BaseLayer checked={!baseLayers.some(l => l.checked)} name="OpenStreetMap">
            <TileLayer
              attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              opacity={opacity}
            />
          </LayersControl.BaseLayer>
          
          {/* ESRI World Imagery */}
          <LayersControl.BaseLayer checked={baseLayers.some(l => l.id === 'imagery' && l.checked)} name="Satellite Imagery">
            <TileLayer
              attribution='Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community'
              url="https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}"
              opacity={opacity}
            />
          </LayersControl.BaseLayer>
          
          {/* USGS Topo */}
          <LayersControl.BaseLayer checked={baseLayers.some(l => l.id === 'topo' && l.checked)} name="USGS Topographic">
            <TileLayer
              attribution='Tiles courtesy of the <a href="https://usgs.gov/">U.S. Geological Survey</a>'
              url="https://basemap.nationalmap.gov/arcgis/rest/services/USGSTopo/MapServer/tile/{z}/{y}/{x}"
              opacity={opacity}
            />
          </LayersControl.BaseLayer>
          
          {/* Property parcels layer */}
          <LayersControl.Overlay 
            checked={viewableLayers.find(l => l.id === 'parcels')?.checked || false} 
            name="Property Parcels"
          >
            <LayerGroup>
              {properties.map(property => (
                <AccessiblePropertyMarker
                  key={property.id}
                  property={property}
                  coordinates={property.coordinates as [number, number]}
                  isSelected={selectedProperty?.id === property.id}
                  isHovered={hoveredPropertyId === property.id}
                  onClick={handleMarkerClick}
                  onMouseOver={() => setHoveredPropertyId(property.id)}
                  onMouseOut={() => setHoveredPropertyId(null)}
                  markerType="default"
                  focusable={true}
                />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
          
          {/* Value heatmap layer */}
          <LayersControl.Overlay 
            checked={analysisLayers.find(l => l.id === 'heat')?.checked || false} 
            name="Property Value Heatmap"
          >
            <LayerGroup>
              {properties.map(property => (
                <AccessiblePropertyMarker
                  key={`heat-${property.id}`}
                  property={property}
                  coordinates={property.coordinates as [number, number]}
                  isSelected={selectedProperty?.id === property.id}
                  onClick={handleMarkerClick}
                  markerType="heatmap"
                  focusable={true}
                />
              ))}
            </LayerGroup>
          </LayersControl.Overlay>
          
          {/* Other viewable layers */}
          {viewableLayers
            .filter(layer => layer.id !== 'parcels')
            .map(layer => (
              <LayersControl.Overlay key={layer.id} checked={layer.checked} name={layer.name}>
                <LayerGroup>
                  {/* Placeholder for other layer types - would have actual GIS data in production */}
                  <div style={{ display: 'none' }}>{layer.name} would load real GIS data</div>
                </LayerGroup>
              </LayersControl.Overlay>
            ))
          }
        </LayersControl>
        
        {/* Map Legend */}
        <MapLegend />
        
        {/* Measurement Tools */}
        <MeasurementTools />
        
        {/* Mini Map */}
        <MiniMap position="bottomright" width={200} height={150} />
      </MapContainer>
    </div>
  );
};

export default MapComponent;