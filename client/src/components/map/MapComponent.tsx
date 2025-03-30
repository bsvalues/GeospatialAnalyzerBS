import React, { useState } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import { Icon, LatLngExpression } from 'leaflet';
import { Property } from '@/shared/types';

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
  basemapType: 'osm' | 'satellite' | 'topo';
  opacity: number;
  showLabels: boolean;
}

const MapComponent: React.FC<MapComponentProps> = ({
  center,
  zoom,
  properties = [],
  onPropertySelect,
  basemapType,
  opacity,
  showLabels
}) => {
  // Define different base tile layers
  const basemaps = {
    osm: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}',
    topo: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Topo_Map/MapServer/tile/{z}/{y}/{x}'
  };

  // Attribution for the tile layers
  const attributions = {
    osm: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    satellite: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>',
    topo: '&copy; <a href="https://www.arcgis.com/">ArcGIS</a>'
  };

  // Component that updates the map based on props changes
  const MapUpdater = ({ basemapType }: { basemapType: 'osm' | 'satellite' | 'topo' }) => {
    const map = useMap();
    React.useEffect(() => {
      // Any map updates that need to be applied when props change
      map.invalidateSize();
    }, [map, basemapType]);
    return null;
  };

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%' }}
      zoomControl={false}
    >
      <TileLayer
        attribution={attributions[basemapType]}
        url={basemaps[basemapType]}
        opacity={opacity / 100}
      />
      
      {showLabels && basemapType === 'satellite' && (
        <TileLayer
          url="https://server.arcgisonline.com/ArcGIS/rest/services/Reference/World_Boundaries_and_Places/MapServer/tile/{z}/{y}/{x}"
          opacity={0.8}
        />
      )}
      
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
      
      <MapUpdater basemapType={basemapType} />
    </MapContainer>
  );
};

export default MapComponent;