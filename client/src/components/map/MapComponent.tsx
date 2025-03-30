import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  Marker, 
  Popup, 
  useMap, 
  WMSTileLayer, 
  LayersControl,
  ZoomControl
} from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, LatLngExpression } from 'leaflet';
import { Property } from '@/shared/types';
import { basemapSources, satelliteLabelsLayer, overlayLayerSources, GisLayerSource } from './layerSources';

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

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
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
            icon={icon}
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
                <h3 className="font-medium">{property.address}</h3>
                <p>Parcel ID: {property.parcelId}</p>
                {property.salePrice && <p>Sale Price: {property.salePrice}</p>}
                <p>Square Feet: {property.squareFeet.toLocaleString()}</p>
              </div>
            </Popup>
          </Marker>
        );
      })}
      
      <MapUpdater zoom={zoom} center={center} />
    </MapContainer>
  );
};

export default MapComponent;