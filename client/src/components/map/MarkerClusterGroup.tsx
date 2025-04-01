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

const MarkerClusterGroup: React.FC<MarkerClusterGroupProps> = ({
  properties,
  onPropertySelect,
  selectedProperty,
}) => {
  const map = useMap();
  
  // Function to create custom cluster icon
  const createClusterCustomIcon = function(cluster: L.MarkerCluster) {
    const childCount = cluster.getChildCount();
    
    // Determine icon size and class based on marker count
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

  useEffect(() => {
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
      maxClusterRadius: 80, // Adjust for desired clustering density
      iconCreateFunction: createClusterCustomIcon,
      // Animation options
      animate: true,
      animateAddingMarkers: true,
      disableClusteringAtZoom: 18, // At max zoom, disable clustering
    });
    
    // Add markers for each property
    properties.forEach(property => {
      // Skip properties without coordinates
      if (!property.latitude || !property.longitude) return;
      
      // Create marker for this property
      const isSelected = selectedProperty && selectedProperty.id === property.id;
      
      // Custom marker icon based on property type
      const iconUrl = getMarkerIconForProperty(property, isSelected || false);
      const markerIcon = L.icon({
        iconUrl,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
        popupAnchor: [0, -32],
        className: `property-marker-enhanced ${isSelected ? 'marker-selected' : ''}`
      });
      
      // Create and configure the marker
      const marker = L.marker([Number(property.latitude), Number(property.longitude)], {
        icon: markerIcon,
        // Add custom property data with extended MarkerOptions
      }) as L.Marker;
      // Store the property data on the marker instance directly
      (marker as any).property = property;
      
      marker.on('click', () => {
        onPropertySelect(property);
      });
      
      // Add tooltip
      marker.bindTooltip(`
        <div class="property-tooltip">
          <div class="font-medium">${property.address}</div>
          <div>${property.value || 'No value'}</div>
        </div>
      `, { 
        direction: 'top',
        offset: [0, -15],
        opacity: 0.9,
        className: 'property-tooltip'
      });
      
      // Add marker to cluster group
      clusterGroup.addLayer(marker);
    });
    
    // Add the cluster group to the map
    map.addLayer(clusterGroup);
    
    // Clean up on unmount
    return () => {
      map.removeLayer(clusterGroup);
    };
  }, [properties, map, onPropertySelect, selectedProperty]);
  
  // Helper to get icon based on property type
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
    
    // Use our SVG files for marker icons
    return iconPath;
  }
  
  // This component doesn't render any visible elements directly
  return null;
};

export default MarkerClusterGroup;