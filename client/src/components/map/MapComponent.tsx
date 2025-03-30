import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  WMSTileLayer, 
  LayersControl,
  ZoomControl,
  AttributionControl
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, LatLngExpression } from 'leaflet';
import { Property } from '@/shared/types';
import { basemapSources, satelliteLabelsLayer, overlayLayerSources, GisLayerSource } from './layerSources';
import CustomMapControls from './CustomMapControls';
import CoordinateDisplay from './CoordinateDisplay';
import MapFocusHandler from './MapFocusHandler';
import ScreenReaderMapInfo from './ScreenReaderMapInfo';

// Fix for the default marker icons in leaflet
import markerIcon from 'leaflet/dist/images/marker-icon.png';
import markerIcon2x from 'leaflet/dist/images/marker-icon-2x.png';
import markerShadow from 'leaflet/dist/images/marker-shadow.png';

// Initialize the icon to avoid missing marker issues
const icon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

// Create an accessible marker icon with proper contrast
const accessibleIcon = new Icon({
  iconUrl: markerIcon,
  iconRetinaUrl: markerIcon2x,
  shadowUrl: markerShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41],
  className: 'accessible-marker' // We'll add CSS for this
});

interface MapComponentProps {
  center: LatLngExpression;
  zoom: number;
  properties?: Property[];
  onPropertySelect?: (property: Property) => void;
  basemapType: string;
  opacity: number;
  showLabels: boolean;
  visibleLayers?: string[]; // IDs of layers that should be visible
}

const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom,
  properties = [],
  onPropertySelect,
  basemapType,
  opacity,
  showLabels,
  visibleLayers = []
}) => {
  // Get base layer information from our sources
  const baseLayer = basemapSources[basemapType] || basemapSources.osm;
  const mapRef = useRef<any>(null);
  const [visibleLayerNames, setVisibleLayerNames] = useState<string[]>([]);

  // Get visible layer names for screen reader info
  useEffect(() => {
    const names = overlayLayerSources
      .filter(layer => visibleLayers.includes(layer.id))
      .map(layer => layer.name);
    setVisibleLayerNames(names);
  }, [visibleLayers]);

  // Component that updates the map based on props changes
  const MapUpdater = ({ zoom, center }: { zoom: number, center: LatLngExpression }) => {
    const map = useMap();
    
    useEffect(() => {
      // Any map updates that need to be applied when props change
      map.invalidateSize();
      
      // Update view if center or zoom changed externally
      map.setView(center, zoom);
    }, [map, center, zoom, baseLayer.id]);
    
    return null;
  };

  // Render either WMS or TileLayer based on the layer type
  const renderLayer = (layer: GisLayerSource) => {
    if (layer.type === 'wms') {
      return (
        <WMSTileLayer
          key={layer.id}
          url={layer.url}
          layers={layer.options?.layers}
          format={layer.options?.format || 'image/png'}
          transparent={layer.options?.transparent !== false}
          opacity={layer.opacity * (opacity / 100)}
          attribution={layer.attribution}
        />
      );
    } else {
      return (
        <TileLayer
          key={layer.id}
          url={layer.url}
          opacity={layer.opacity * (opacity / 100)}
          attribution={layer.attribution}
        />
      );
    }
  };

  // Handle when map focus escapes
  const handleMapEscape = () => {
    // Find an element to focus outside the map
    const outsideElement = document.querySelector('[data-focus-after-map]');
    if (outsideElement instanceof HTMLElement) {
      outsideElement.focus();
    }
  };

  // Add CSS for accessible markers
  useEffect(() => {
    // Add CSS for enhanced marker visibility
    const style = document.createElement('style');
    style.innerHTML = `
      .accessible-marker {
        filter: drop-shadow(0 0 3px rgba(0, 0, 0, 0.7));
      }
      .leaflet-popup-content {
        max-width: 300px;
        font-size: 14px;
        line-height: 1.5;
      }
      .leaflet-popup-content h3 {
        margin-bottom: 4px;
        color: #1f2937;
      }
      .leaflet-popup-content p {
        margin: 2px 0;
        color: #4b5563;
      }
      /* High contrast focus indicators */
      .leaflet-container:focus {
        outline: 3px solid #2563eb !important;
        outline-offset: 3px;
      }
      .leaflet-interactive:focus {
        outline: 2px solid #2563eb !important;
        outline-offset: 2px;
      }
    `;
    document.head.appendChild(style);

    return () => {
      document.head.removeChild(style);
    };
  }, []);

  return (
    <div className="h-full w-full relative" role="region" aria-label="Interactive GIS Map">
      {/* Skip link for keyboard users */}
      <a 
        href="#skip-map" 
        className="sr-only focus:not-sr-only focus:absolute focus:top-1 focus:left-1 focus:z-[2000] focus:bg-white focus:p-2 focus:text-blue-700"
      >
        Skip map navigation
      </a>
      
      <MapContainer 
        center={center} 
        zoom={zoom} 
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
        attributionControl={false}
        ref={mapRef}
      >
        {/* Base map layer */}
        {renderLayer(baseLayer)}
        
        {/* Show labels on satellite imagery if enabled */}
        {showLabels && basemapType === 'satellite' && renderLayer(satelliteLabelsLayer)}
        
        {/* Render all visible GIS overlay layers */}
        {overlayLayerSources
          .filter(layer => visibleLayers.includes(layer.id))
          .map(layer => renderLayer(layer))
        }
        
        {/* Property markers */}
        {properties.map((property) => {
          // Only render markers for properties with coordinates
          if (!property.coordinates) return null;
          
          return (
            <Marker 
              key={property.id} 
              position={property.coordinates} 
              icon={accessibleIcon}
              eventHandlers={{
                click: () => {
                  if (onPropertySelect) {
                    onPropertySelect(property);
                  }
                }
              }}
            >
              <Popup>
                <div>
                  <h3 className="font-medium text-base">{property.address}</h3>
                  <p>Parcel ID: {property.parcelId}</p>
                  {property.salePrice && <p>Sale Price: {property.salePrice}</p>}
                  <p>Square Feet: {property.squareFeet.toLocaleString()}</p>
                  {property.yearBuilt && <p>Year Built: {property.yearBuilt}</p>}
                </div>
              </Popup>
            </Marker>
          );
        })}
        
        <MapUpdater zoom={zoom} center={center} />
        
        {/* Accessibility-enhanced map controls */}
        <CustomMapControls 
          defaultCenter={center}
          defaultZoom={zoom}
        />
        
        {/* Coordinate display */}
        <CoordinateDisplay />
        
        {/* Focus and keyboard navigation handler */}
        <MapFocusHandler onEscape={handleMapEscape} />
        
        {/* Screen reader information panel */}
        <ScreenReaderMapInfo 
          properties={properties}
          visibleLayerNames={visibleLayerNames}
        />
      </MapContainer>
      
      {/* Skip target for keyboard users */}
      <div id="skip-map" tabIndex={-1} data-focus-after-map className="sr-only">
        Map navigation skipped
      </div>
    </div>
  );
};

export default MapComponent;