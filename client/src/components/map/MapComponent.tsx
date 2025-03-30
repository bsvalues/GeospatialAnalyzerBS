import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, LayerGroup, CircleMarker, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@shared/schema';
import { MapLayer, MapOptions } from '@/shared/types';
import { formatCurrency } from '@/lib/utils';

// Import accessibility components
import { AccessibleMapComponents } from './AccessibleMapComponents';
import { AccessiblePropertyMarker } from './AccessiblePropertyMarker';
import MapLegend from './MapLegend';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

// Create custom icons for different property types
const createIcon = (color: string) => {
  return L.divIcon({
    className: 'custom-div-icon',
    html: `<div style="background-color: ${color}; width: 22px; height: 22px; border-radius: 50%; border: 2px solid white; box-shadow: 0 1px 3px rgba(0,0,0,0.4);"></div>`,
    iconSize: [22, 22],
    iconAnchor: [11, 11],
    popupAnchor: [0, -11]
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

// Create custom markers based on property types
const ResidentialIcon = createIcon('#4ade80'); // Green
const CommercialIcon = createIcon('#3b82f6'); // Blue
const IndustrialIcon = createIcon('#ef4444'); // Red
const AgriculturalIcon = createIcon('#f59e0b'); // Amber
const SelectedIcon = createIcon('#f43f5e'); // Pink
const DefaultDotIcon = createIcon('#6b7280'); // Gray

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
      </MapContainer>
    </div>
  );
};

export default MapComponent;