/**
 * MapComponent
 * 
 * This component renders a Leaflet map with various layers and controls.
 * It serves as the central visualization component for the application.
 */
import { useRef, useEffect, useState } from 'react';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Import images for markers (if used)
// Leaflet needs these for the default markers to display correctly
import markerIconPng from 'leaflet/dist/images/marker-icon.png';
import markerShadowPng from 'leaflet/dist/images/marker-shadow.png';

// Define prop types for the MapComponent
interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  width?: string;
  className?: string;
}

export const MapComponent = ({
  center = [46.2087, -119.1372], // Default to Kennewick, WA (Benton County)
  zoom = 12,
  height = '600px',
  width = '100%',
  className = ''
}: MapComponentProps) => {
  // Create a ref to hold the map div element
  const mapRef = useRef<HTMLDivElement>(null);
  
  // Track the Leaflet map instance
  const [map, setMap] = useState<L.Map | null>(null);
  
  // Initialize the map when the component mounts
  useEffect(() => {
    // This ensures Leaflet is only loaded in browser environment, not during SSR
    if (typeof window !== 'undefined') {
      // Set up the default icon for Leaflet
      L.Icon.Default.mergeOptions({
        iconUrl: markerIconPng,
        shadowUrl: markerShadowPng
      });
    }

    if (mapRef.current && !map) {
      // Create a new Leaflet map instance with invalidateSize option
      // This helps avoid the '_leaflet_pos' error
      const mapInstance = L.map(mapRef.current, {
        attributionControl: true,
        zoomControl: true
      }).setView(center, zoom);
      
      // Add OpenStreetMap tile layer
      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        maxZoom: 19
      }).addTo(mapInstance);
      
      // Force a resize to ensure the map renders correctly
      setTimeout(() => {
        mapInstance.invalidateSize();
      }, 100);
      
      // Store the map instance in state
      setMap(mapInstance);
      
      // Clean up the map when the component unmounts
      return () => {
        mapInstance.remove();
      };
    }
  }, [mapRef, map, center, zoom]);
  
  // Update the map view when center or zoom props change
  useEffect(() => {
    if (map) {
      map.setView(center, zoom);
      // Force a resize to ensure the map renders correctly after any changes
      map.invalidateSize();
    }
  }, [map, center, zoom]);
  
  return (
    <div 
      ref={mapRef} 
      style={{ height, width }} 
      className={`map-container ${className}`} 
      data-testid="map-container"
    />
  );
};

export default MapComponent;