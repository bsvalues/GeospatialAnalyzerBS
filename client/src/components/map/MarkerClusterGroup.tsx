import React, { useEffect } from 'react';
import { useMap } from 'react-leaflet';
import L from 'leaflet';
import 'leaflet.markercluster/dist/leaflet.markercluster';
import 'leaflet.markercluster/dist/MarkerCluster.css';
import 'leaflet.markercluster/dist/MarkerCluster.Default.css';
import { Property } from '@/shared/schema';
import { formatCurrency } from '@/lib/utils';

// Import extended CSS for custom cluster styling
import './marker-cluster-custom.css';

// Extend leaflet typings to include MarkerClusterGroup
declare module 'leaflet' {
  interface MarkerClusterGroupOptions {
    chunkedLoading?: boolean;
    spiderfyOnMaxZoom?: boolean;
    showCoverageOnHover?: boolean;
    zoomToBoundsOnClick?: boolean;
    maxClusterRadius?: number;
    iconCreateFunction?: (cluster: MarkerCluster) => L.DivIcon;
    animate?: boolean;
    animateAddingMarkers?: boolean;
    disableClusteringAtZoom?: number;
  }

  class MarkerCluster {
    getChildCount(): number;
    getAllChildMarkers(): L.Marker[];
  }

  class MarkerClusterGroup extends L.FeatureGroup {
    constructor(options?: MarkerClusterGroupOptions);
    addLayer(layer: L.Layer): this;
    removeLayers(layers: L.Layer[]): this;
    clearLayers(): this;
  }

  function markerClusterGroup(options?: MarkerClusterGroupOptions): MarkerClusterGroup;
}

interface MarkerClusterGroupProps {
  properties: Property[];
  onPropertySelect: (property: Property) => void;
  selectedProperty?: Property | null;
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
  const iconPath = iconMap[type] || iconMap.unknown;
  
  return iconPath;
}

const MarkerClusterGroup: React.FC<MarkerClusterGroupProps> = ({
  properties,
  onPropertySelect,
  selectedProperty,
}) => {
  const map = useMap();
  
  console.log('MarkerClusterGroup received properties:', properties?.length);
  console.log('Map instance:', map ? 'Available' : 'Not available');

  useEffect(() => {
    // Skip if no map or no properties
    if (!map || !properties?.length) {
      console.log('No map or no properties available');
      return;
    }
    
    console.log('Creating cluster group with', properties.length, 'properties');
    
    // Function to create custom cluster icon
    const createClusterCustomIcon = function(cluster: L.MarkerCluster) {
      const childCount = cluster.getChildCount();
      
      // Determine icon size based on marker count
      let size = 'small';
      let additionalClass = '';
      
      if (childCount > 50) {
        size = 'large';
        additionalClass = 'cluster-large';
      } else if (childCount > 20) {
        size = 'medium';
        additionalClass = 'cluster-medium';
      } else {
        additionalClass = 'cluster-small';
      }
      
      // Calculate average property value for the cluster
      const markers = cluster.getAllChildMarkers();
      let totalValue = 0;
      let validValueCount = 0;
      
      markers.forEach(marker => {
        // Access property from the custom property we added to the marker
        const property = (marker as any).property as Property;
        if (property && property.value) {
          // Extract numeric value from string like '$350,000'
          const numericValue = parseInt(property.value.replace(/[^0-9.-]+/g, ''));
          if (!isNaN(numericValue)) {
            totalValue += numericValue;
            validValueCount++;
          }
        }
      });
      
      const avgValue = validValueCount > 0 ? Math.round(totalValue / validValueCount) : 0;
      const formattedAvgValue = avgValue > 0 ? formatCurrency(avgValue) : '';
      
      // Create HTML for cluster icon
      const html = `
        <div class="marker-cluster marker-cluster-${size} ${additionalClass}">
          <div class="marker-cluster-inner">
            <span class="marker-cluster-count">${childCount}</span>
            ${formattedAvgValue ? `<span class="marker-cluster-value">${formattedAvgValue}</span>` : ''}
          </div>
        </div>
      `;
      
      return L.divIcon({
        html: html,
        className: `custom-marker-cluster custom-marker-cluster-${size}`,
        iconSize: L.point(40, 40)
      });
    };
    
    // Clean up previous clusters
    map.eachLayer(layer => {
      if ((layer as any)._leaflet_id && (layer as any)._markerCluster) {
        map.removeLayer(layer);
      }
    });
    
    // Create new cluster group with custom options
    const clusterGroup = L.markerClusterGroup({
      chunkedLoading: true,
      spiderfyOnMaxZoom: true,
      showCoverageOnHover: false,
      zoomToBoundsOnClick: true,
      maxClusterRadius: 80,
      iconCreateFunction: createClusterCustomIcon,
      animate: true,
      animateAddingMarkers: true,
      disableClusteringAtZoom: 18
    });
    
    // Add markers for each property
    let markersAdded = 0;
    
    for (const property of properties) {
      // Skip properties without coordinates
      if (!property.latitude || !property.longitude) {
        console.log('Property missing coordinates:', property.parcelId);
        continue;
      }
      
      try {
        // Safely convert coordinates to numbers
        const lat = typeof property.latitude === 'string' ? parseFloat(property.latitude) : Number(property.latitude);
        const lng = typeof property.longitude === 'string' ? parseFloat(property.longitude) : Number(property.longitude);
        
        // Validate coordinates
        if (isNaN(lat) || isNaN(lng)) {
          console.error('Invalid coordinates for property:', property.parcelId);
          continue;
        }
        
        // Check if coordinates are within reasonable range
        if (lat < -90 || lat > 90 || lng < -180 || lng > 180) {
          console.error('Coordinates out of range for property:', property.parcelId, lat, lng);
          continue;
        }
        
        // Determine if this property is selected
        const isSelected = selectedProperty && selectedProperty.id === property.id;
        
        // Get icon for this property type
        const iconUrl = getMarkerIconForProperty(property, isSelected);
        
        // Create marker icon
        const markerIcon = L.icon({
          iconUrl,
          iconSize: [32, 32],
          iconAnchor: [16, 32],
          popupAnchor: [0, -32],
          className: `property-marker-enhanced ${isSelected ? 'marker-selected' : ''}`
        });
        
        // Create the marker
        const marker = L.marker([lat, lng], { icon: markerIcon });
        
        // Store property data on marker
        (marker as any).property = property;
        
        // Set up click handler
        marker.on('click', () => {
          onPropertySelect(property);
        });
        
        // Add tooltip
        marker.bindTooltip(`
          <div class="property-tooltip">
            <div class="font-medium">${property.address || 'Unknown Address'}</div>
            <div>${property.propertyType ? property.propertyType + ' - ' : ''}${property.value || 'No value'}</div>
          </div>
        `, { 
          direction: 'top',
          offset: [0, -15],
          opacity: 0.9,
          className: 'property-tooltip'
        });
        
        // Add marker to cluster group
        clusterGroup.addLayer(marker);
        markersAdded++;
      } catch (error) {
        console.error('Error creating marker for property:', property.parcelId, error);
      }
    }
    
    console.log(`Added ${markersAdded} markers out of ${properties.length} properties`);
    
    // Add the cluster group to the map
    map.addLayer(clusterGroup);
    
    // Clean up on unmount
    return () => {
      console.log('Cleaning up cluster group');
      map.removeLayer(clusterGroup);
    };
  }, [properties, map, onPropertySelect, selectedProperty]);
  
  // This component doesn't render any visible elements directly
  return null;
};

export default MarkerClusterGroup;