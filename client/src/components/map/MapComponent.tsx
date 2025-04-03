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

// Set up the default icon for Leaflet
L.Icon.Default.mergeOptions({
  iconUrl: markerIconPng,
  shadowUrl: markerShadowPng
});

// Define prop types for the MapComponent
interface MapComponentProps {
  center?: [number, number];
  zoom?: number;
  height?: string;
  width?: string;
  className?: string;
}

// Create a unique ID for each map instance
const createMapId = (() => {
  let counter = 0;
  return () => `map-${counter++}`;
})();

export const MapComponent = ({
  center = [46.2087, -119.1372], // Default to Kennewick, WA (Benton County)
  zoom = 12,
  height = '600px',
  width = '100%',
  className = ''
}: MapComponentProps) => {
  // Create a unique ID for this instance
  const mapId = useRef(createMapId());
  // Create a ref to hold the map div element
  const mapRef = useRef<HTMLDivElement>(null);
  // Map instance
  const [mapInstance, setMapInstance] = useState<L.Map | null>(null);
  
  // Initialize the map on component mount
  useEffect(() => {
    // Guard against missing DOM element
    if (!mapRef.current) return;
    
    let map: L.Map | null = null;
    
    // Initialize the map after a small delay to ensure the DOM is ready
    const initTimeout = setTimeout(() => {
      try {
        // Make sure the element exists and isn't being used
        if (!mapRef.current) return;
        
        // Create a new Leaflet map
        map = L.map(mapRef.current, {
          center: center,
          zoom: zoom,
        });
        
        // Add the base tile layer
        L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
          attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
          maxZoom: 19
        }).addTo(map);
        
        // Set the state after map is initialized
        setMapInstance(map);
        
        // Fix any size issues
        setTimeout(() => {
          if (map) map.invalidateSize();
        }, 250);
      } catch (error) {
        console.error('Error initializing map:', error);
      }
    }, 100);
    
    // Cleanup function
    return () => {
      clearTimeout(initTimeout);
      
      // Remove the map instance if it exists
      if (map) {
        console.log('Cleaning up map instance');
        map.remove();
        setMapInstance(null);
      }
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Empty deps array - we only want to initialize once and handle cleanup
  
  // Update view when props change
  useEffect(() => {
    if (mapInstance) {
      mapInstance.setView(center, zoom);
    }
  }, [mapInstance, center, zoom]);
  
  return (
    <div 
      id={mapId.current}
      ref={mapRef} 
      style={{ height, width }} 
      className={`leaflet-map-container ${className}`}
      data-testid="map-container"
    />
  );
};

export default MapComponent;