import React, { useRef, useEffect } from 'react';
import { Marker, Popup, useMap } from 'react-leaflet';
import L from 'leaflet';
import { Property } from '@shared/schema';
import { formatCurrency } from '@/lib/utils';

export interface AccessiblePropertyMarkerProps {
  property: Property;
  coordinates: [number, number];
  isSelected: boolean;
  isHovered?: boolean;
  onClick: (property: Property) => void;
  onMouseOver?: () => void;
  onMouseOut?: () => void;
  markerType?: 'default' | 'cluster' | 'heatmap';
  focusable?: boolean;
  markerRef?: React.RefObject<L.Marker>;
}

// Helper function to create an accessible icon with proper contrast
const createAccessibleIcon = (propertyType: string, isSelected: boolean): L.DivIcon => {
  // Use high contrast colors with proper WCAG compliance
  const getColorByPropertyType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'residential':
        return '#2E8540'; // Green with good contrast
      case 'commercial':
        return '#0071BC'; // Blue with good contrast
      case 'industrial': 
        return '#D83933'; // Red with good contrast
      case 'agricultural':
        return '#FDB81E'; // Amber with good contrast
      default:
        return '#4773AA'; // Default blue with good contrast
    }
  };
  
  const color = getColorByPropertyType(propertyType);
  const selectedBorder = isSelected ? '3px solid #212121' : '2px solid white';
  const selectedSize = isSelected ? 26 : 22; // Larger when selected for better visibility
  
  return L.divIcon({
    className: 'accessible-property-marker',
    html: `
      <div 
        style="
          background-color: ${color}; 
          width: ${selectedSize}px; 
          height: ${selectedSize}px; 
          border-radius: 50%; 
          border: ${selectedBorder}; 
          box-shadow: 0 1px 3px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
        "
        role="img" 
        aria-label="${propertyType} property${isSelected ? ' (selected)' : ''}"
      >
        ${isSelected ? '<span style="color: white; font-weight: bold; font-size: 14px;">✓</span>' : ''}
      </div>
    `,
    iconSize: [selectedSize, selectedSize],
    iconAnchor: [selectedSize/2, selectedSize/2],
    popupAnchor: [0, -(selectedSize/2)]
  });
};

export const AccessiblePropertyMarker: React.FC<AccessiblePropertyMarkerProps> = ({
  property,
  coordinates,
  isSelected,
  isHovered,
  onClick,
  onMouseOver,
  onMouseOut,
  markerType = 'default',
  focusable = true,
  markerRef
}) => {
  const map = useMap();
  const localMarkerRef = useRef<L.Marker>(null);
  const actualMarkerRef = markerRef || localMarkerRef;
  const propertyType = property.propertyType || 'residential';
  
  // Make marker keyboard-focusable
  useEffect(() => {
    if (actualMarkerRef.current && focusable) {
      const marker = actualMarkerRef.current;
      
      // Add tabindex to make marker focusable
      const markerElement = marker.getElement();
      if (markerElement) {
        markerElement.setAttribute('tabindex', '0');
        markerElement.setAttribute('role', 'button');
        markerElement.setAttribute('aria-label', 
          `${propertyType} property at ${property.address}. Value: ${formatCurrency(property.value || 0)}${isSelected ? '. Currently selected' : ''}`
        );
        
        // Add keyboard event listener for Enter/Space to activate marker
        markerElement.addEventListener('keydown', (e: KeyboardEvent) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            onClick(property);
            marker.openPopup();
          }
        });
        
        // Add focus styles
        markerElement.addEventListener('focus', () => {
          markerElement.style.outline = '3px solid #4773AA';
          markerElement.style.outlineOffset = '2px';
        });
        
        markerElement.addEventListener('blur', () => {
          markerElement.style.outline = 'none';
        });
      }
    }
  }, [property, isSelected, propertyType, onClick, focusable]);
  
  // If the marker is selected, ensure proper focus management
  useEffect(() => {
    if (isSelected && actualMarkerRef.current) {
      const markerElement = actualMarkerRef.current.getElement();
      if (markerElement) {
        markerElement.setAttribute('aria-expanded', 'true');
      }
    }
  }, [isSelected]);
  
  // Apply additional styling for hovered state
  useEffect(() => {
    if (actualMarkerRef.current && isHovered) {
      const markerElement = actualMarkerRef.current.getElement();
      if (markerElement) {
        const markerDiv = markerElement.querySelector('div');
        if (markerDiv) {
          markerDiv.style.transform = 'scale(1.1)';
          markerDiv.style.transition = 'transform 0.2s ease-in-out';
        }
      }
    } else if (actualMarkerRef.current) {
      const markerElement = actualMarkerRef.current.getElement();
      if (markerElement) {
        const markerDiv = markerElement.querySelector('div');
        if (markerDiv) {
          markerDiv.style.transform = 'scale(1)';
        }
      }
    }
  }, [isHovered]);
  
  // Different marker styling based on marker type
  const getIcon = () => {
    switch (markerType) {
      case 'cluster':
        return createClusterIcon(propertyType, isSelected);
      case 'heatmap':
        return createHeatmapIcon(propertyType, isSelected);
      default:
        return createAccessibleIcon(propertyType, isSelected);
    }
  };
  
  return (
    <Marker
      ref={actualMarkerRef}
      position={coordinates}
      icon={getIcon()}
      eventHandlers={{
        click: () => {
          onClick(property);
        },
        keypress: (e) => {
          if (e.originalEvent.key === 'Enter') {
            onClick(property);
          }
        },
        mouseover: onMouseOver,
        mouseout: onMouseOut,
      }}
    >
      <Popup>
        <div 
          className="property-popup"
          role="dialog"
          aria-label={`Property information for ${property.address}`}
        >
          <h3 className="font-semibold text-lg" id="property-popup-title">{property.address}</h3>
          <div className="text-sm space-y-1">
            <p><span className="font-medium">Parcel ID:</span> {property.parcelId}</p>
            <p><span className="font-medium">Value:</span> {formatCurrency(property.value || 0)}</p>
            <p><span className="font-medium">Size:</span> {property.squareFeet?.toLocaleString()} sq ft</p>
            {property.yearBuilt && (
              <p><span className="font-medium">Year Built:</span> {property.yearBuilt}</p>
            )}
            <p><span className="font-medium">Type:</span> {propertyType}</p>
          </div>
          
          {/* Accessible button for selecting the property for analysis */}
          <button
            className="mt-2 px-3 py-1 bg-blue-600 text-white rounded hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-opacity-50"
            onClick={() => onClick(property)}
            aria-label={`Select ${property.address} for analysis`}
          >
            Select for Analysis
          </button>
        </div>
      </Popup>
    </Marker>
  );
};

// Additional icon types for different map modes
const createClusterIcon = (propertyType: string, isSelected: boolean): L.DivIcon => {
  // Use high contrast colors with proper WCAG compliance
  const getColorByPropertyType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'residential':
        return '#2E8540'; // Green with good contrast
      case 'commercial':
        return '#0071BC'; // Blue with good contrast
      case 'industrial': 
        return '#D83933'; // Red with good contrast
      case 'agricultural':
        return '#FDB81E'; // Amber with good contrast
      default:
        return '#4773AA'; // Default blue with good contrast
    }
  };
  
  const color = getColorByPropertyType(propertyType);
  const selectedSize = isSelected ? 32 : 28; // Larger for cluster markers
  
  return L.divIcon({
    className: 'accessible-property-cluster-marker',
    html: `
      <div 
        style="
          background-color: ${color}; 
          width: ${selectedSize}px; 
          height: ${selectedSize}px; 
          border-radius: 50%; 
          border: 3px solid white; 
          box-shadow: 0 1px 5px rgba(0,0,0,0.4);
          display: flex;
          align-items: center;
          justify-content: center;
          color: white;
          font-weight: bold;
          font-size: 13px;
        "
        role="img" 
        aria-label="${propertyType} property cluster${isSelected ? ' (selected)' : ''}"
      >
        C
      </div>
    `,
    iconSize: [selectedSize, selectedSize],
    iconAnchor: [selectedSize/2, selectedSize/2],
    popupAnchor: [0, -(selectedSize/2)]
  });
};

const createHeatmapIcon = (propertyType: string, isSelected: boolean): L.DivIcon => {
  // Heatmap markers are more transparent
  const getColorByPropertyType = (type: string): string => {
    switch (type.toLowerCase()) {
      case 'residential':
        return 'rgba(46, 133, 64, 0.7)'; // Green with transparency
      case 'commercial':
        return 'rgba(0, 113, 188, 0.7)'; // Blue with transparency
      case 'industrial': 
        return 'rgba(216, 57, 51, 0.7)'; // Red with transparency
      case 'agricultural':
        return 'rgba(253, 184, 30, 0.7)'; // Amber with transparency
      default:
        return 'rgba(71, 115, 170, 0.7)'; // Default blue with transparency
    }
  };
  
  const color = getColorByPropertyType(propertyType);
  const selectedSize = isSelected ? 24 : 20; // Smaller for heatmap markers
  
  return L.divIcon({
    className: 'accessible-property-heatmap-marker',
    html: `
      <div 
        style="
          background-color: ${color}; 
          width: ${selectedSize}px; 
          height: ${selectedSize}px; 
          border-radius: 50%; 
          box-shadow: 0 0 8px ${color.replace('0.7', '0.5')};
          display: flex;
          align-items: center;
          justify-content: center;
          filter: blur(1px);
        "
        role="img" 
        aria-label="${propertyType} property heatmap point${isSelected ? ' (selected)' : ''}"
      >
      </div>
    `,
    iconSize: [selectedSize, selectedSize],
    iconAnchor: [selectedSize/2, selectedSize/2],
    popupAnchor: [0, -(selectedSize/2)]
  });
};