import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, ZoomControl, LayersControl, Popup, useMap, Marker } from 'react-leaflet';
import { HeatmapVisualization } from '../analysis/HeatmapVisualization';
import { HotspotVisualization } from '../analysis/HotspotVisualization';
import PropertyInfoPopup from './PropertyInfoPopup';
import { Property } from '@shared/schema';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix the Leaflet default icon issue - crucial for marker display
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

const { BaseLayer, Overlay } = LayersControl;

// Interface for component props
interface MapComponentProps {
  properties: Property[];
  center?: [number, number];
  zoom?: number;
  children?: React.ReactNode;
}

// Simple marker component to display a single property marker
const PropertyMarker = ({ property, onClick }: { property: Property; onClick: (property: Property) => void }) => {
  if (!property.latitude || !property.longitude) {
    return null;
  }
  
  try {
    // Parse latitude and longitude to numbers
    const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : Number(property.latitude);
    const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : Number(property.longitude);
    
    // Validate coordinates
    if (isNaN(lat) || isNaN(lng) || lat < -90 || lat > 90 || lng < -180 || lng > 180) {
      console.error('Invalid coordinates for property:', property.parcelId, lat, lng);
      return null;
    }
    
    console.log(`Creating marker for ${property.parcelId} at ${lat}, ${lng}`);
    
    return (
      <Marker 
        position={[lat, lng]} 
        eventHandlers={{
          click: () => onClick(property)
        }}
      />
    );
  } catch (error) {
    console.error('Error creating marker for property:', property.parcelId, error);
    return null;
  }
};

// Display test markers at known coordinates
const TestMarkers = () => {
  return (
    <>
      <Marker position={[46.2, -119.2]} />
      <Marker position={[46.3, -119.1]} />
      <Marker position={[46.4, -119.0]} />
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
  
  // Log sample property data for debugging
  if (properties?.length > 0) {
    console.log('Sample property data:', properties[0]);
  }
  
  // State for property selection and popup
  const [selectedProperty, setSelectedProperty] = useState<Property | null>(null);
  const [popupPosition, setPopupPosition] = useState<[number, number] | null>(null);
  
  // Handle property selection
  const handlePropertySelect = (property: Property) => {
    console.log('Selected property:', property);
    setSelectedProperty(property);
    
    // Set popup position
    if (property.latitude && property.longitude) {
      const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : Number(property.latitude);
      const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : Number(property.longitude);
      setPopupPosition([lat, lng]);
    }
  };
  
  // Handle closing the popup
  const handleClosePopup = () => {
    setSelectedProperty(null);
    setPopupPosition(null);
  };

  return (
    <MapContainer 
      center={center} 
      zoom={zoom} 
      style={{ height: '100%', width: '100%', zIndex: 0 }}
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
      </LayersControl>
      
      {/* Test markers at fixed coordinates */}
      <TestMarkers />
      
      {/* Real property markers */}
      {properties.slice(0, 10).map(property => (
        <PropertyMarker
          key={property.id}
          property={property}
          onClick={handlePropertySelect}
        />
      ))}
      
      {/* Selected property popup */}
      {selectedProperty && popupPosition && (
        <Popup 
          position={popupPosition}
          eventHandlers={{ remove: handleClosePopup }}
        >
          <PropertyInfoPopup 
            property={selectedProperty} 
            onClose={handleClosePopup} 
          />
        </Popup>
      )}
      
      {children}
    </MapContainer>
  );
};