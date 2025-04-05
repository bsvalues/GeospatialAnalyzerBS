import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, LayersControl, Popup, useMap, Marker } from 'react-leaflet';
import { HeatmapVisualization } from '../analysis/HeatmapVisualization';
import { HotspotVisualization } from '../analysis/HotspotVisualization';
import PropertyInfoPopup from './PropertyInfoPopup';
import { Property } from '@shared/schema';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix the Leaflet default icon issue
import icon from 'leaflet/dist/images/marker-icon.png';
import iconShadow from 'leaflet/dist/images/marker-shadow.png';

let DefaultIcon = L.icon({
  iconUrl: icon,
  shadowUrl: iconShadow,
  iconSize: [25, 41],
  iconAnchor: [12, 41]
});

L.Marker.prototype.options.icon = DefaultIcon;

const { BaseLayer, Overlay } = LayersControl;

// Interface for component props
interface MapComponentProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
}

/**
 * Helper function to get marker icon path based on property type
 */
function getMarkerIconForProperty(property: Property, isSelected: boolean): string {
  const baseUrl = '/markers/';
  const type = property.propertyType?.toLowerCase() || 'unknown';
  
  // Base markers by property type
  const iconMap: {[key: string]: string} = {
    'residential': baseUrl + 'house.svg',
    'commercial': baseUrl + 'commercial.svg',
    'industrial': baseUrl + 'industrial.svg',
    'agricultural': baseUrl + 'farm.svg',
    'vacant': baseUrl + 'vacant.svg',
    'unknown': baseUrl + 'property.svg'
  };
  
  // Use default if type not in mapping
  return iconMap[type] || iconMap.unknown;
}

// Simple property markers component - no clustering
const PropertyMarkers = ({ properties, onSelect }: { properties: Property[]; onSelect: (property: Property) => void }) => {
  console.log('PropertyMarkers received', properties?.length, 'properties');
  
  return (
    <>
      {properties?.map((property) => {
        if (!property.latitude || !property.longitude) {
          return null;
        }
        
        try {
          // Convert to numbers
          const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : Number(property.latitude);
          const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : Number(property.longitude);
          
          // Skip invalid coordinates
          if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
            console.error('Invalid coordinates for property:', property.parcelId, lat, lng);
            return null;
          }
          
          // Get icon based on property type
          const iconUrl = getMarkerIconForProperty(property, false);
          const customIcon = L.icon({
            iconUrl,
            iconSize: [32, 32],
            iconAnchor: [16, 32],
            popupAnchor: [0, -32]
          });
          
          return (
            <Marker 
              key={property.id} 
              position={[lat, lng]} 
              icon={customIcon}
              eventHandlers={{
                click: () => {
                  console.log('Marker clicked for property:', property.parcelId);
                  onSelect(property);
                }
              }}
            />
          );
        } catch (error) {
          console.error('Error creating marker for property:', property.parcelId, error);
          return null;
        }
      })}
    </>
  );
};

/**
 * Main map component that handles various visualization layers
 */
export const MapComponent: React.FC<MapComponentProps> = ({ 
  properties, 
  center = [46.26, -119.28], // Default center (Benton County, WA)
  zoom = 10,
  children 
}) => {
  console.log('MapComponent loaded with properties:', properties?.length, 'items');
  
  // Log some sample properties to debug
  if (properties?.length > 0) {
    console.log('Sample property data:', properties[0]);
  }
  
  // State for active visualization layers
  const [showHeatmap, setShowHeatmap] = useState<boolean>(false);
  const [showHotspots, setShowHotspots] = useState<boolean>(false);
  
  // State for property selection and popup position
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null);
  
  // Handler for property selection
  const handlePropertySelect = (property: Property) => {
    setSelectedProperty(property);
    console.log('Selected property:', property);
    
    // Set popup position if coordinates are available
    if (property.latitude && property.longitude) {
      const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : Number(property.latitude);
      const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : Number(property.longitude);
      setPopupPosition([lat, lng]);
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
      
      {/* Property markers - simple implementation */}
      <PropertyMarkers properties={properties} onSelect={handlePropertySelect} />
      
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