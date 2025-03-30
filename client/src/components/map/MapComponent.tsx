import React, { useState, useEffect, useRef } from 'react';
import { MapContainer, TileLayer, Marker, Popup, useMap, LayersControl, LayerGroup, ZoomControl } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { Property } from '@shared/schema';
import { MapLayer, MapOptions } from '@/shared/types';

// Fix Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41],
  popupAnchor: [1, -34],
  shadowSize: [41, 41]
});

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
  
  // Filter layers by type
  const baseLayers = layers.filter(layer => layer.type === 'base');
  const viewableLayers = layers.filter(layer => layer.type === 'viewable');
  
  // Handler for marker click
  const handleMarkerClick = (property: Property) => {
    if (onPropertySelect) {
      onPropertySelect(property);
    }
  };
  
  return (
    <div style={{ height, width, position: 'relative' }} data-testid="map-container">
      <MapContainer
        center={center}
        zoom={zoom}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false} // We'll add our own zoom control
        ref={mapRef}
        whenReady={() => {
          console.log('Map is ready');
        }}
      >
        <ZoomControl position="topright" />
        
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
          
          {/* Viewable layers */}
          {viewableLayers.map(layer => (
            <LayersControl.Overlay key={layer.id} checked={layer.checked} name={layer.name}>
              <LayerGroup>
                {/* This is a placeholder. In a real application, this would load GeoJSON or other layer data */}
                {layer.id === 'parcels' && properties.map(property => (
                  <Marker
                    key={property.id}
                    position={property.coordinates as [number, number]}
                    eventHandlers={{
                      click: () => handleMarkerClick(property)
                    }}
                    icon={
                      selectedProperty && selectedProperty.id === property.id
                        ? L.icon({
                            iconUrl: 'https://raw.githubusercontent.com/pointhi/leaflet-color-markers/master/img/marker-icon-2x-red.png',
                            shadowUrl: iconShadow,
                            iconSize: [25, 41],
                            iconAnchor: [12, 41],
                            popupAnchor: [1, -34],
                            shadowSize: [41, 41]
                          })
                        : DefaultIcon
                    }
                    data-testid={
                      selectedProperty && selectedProperty.id === property.id
                        ? "property-marker-highlighted"
                        : "property-marker"
                    }
                    data-property-id={property.id}
                  >
                    <Popup>
                      <div>
                        <h3 className="text-base font-semibold">{property.address}</h3>
                        <p className="text-sm">Parcel ID: {property.parcelId}</p>
                        {property.value && <p className="text-sm">Value: {property.value}</p>}
                        <p className="text-sm">Size: {property.squareFeet.toLocaleString()} sq ft</p>
                        {property.yearBuilt && <p className="text-sm">Year Built: {property.yearBuilt}</p>}
                        <button 
                          className="mt-2 px-3 py-1 bg-blue-500 text-white text-xs rounded hover:bg-blue-600"
                          onClick={() => handleMarkerClick(property)}
                        >
                          View Details
                        </button>
                      </div>
                    </Popup>
                  </Marker>
                ))}
              </LayerGroup>
            </LayersControl.Overlay>
          ))}
        </LayersControl>
      </MapContainer>
    </div>
  );
};

export default MapComponent;