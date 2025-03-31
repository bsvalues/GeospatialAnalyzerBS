import React, { useState, useEffect, useRef } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  LayerGroup, 
  useMap, 
  Marker, 
  Popup,
  ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import 'leaflet.heat';
import { Property } from '@/shared/schema';
import { usePropertyFilter } from '@/contexts/PropertyFilterContext';
import { useMapAccessibility } from '@/contexts/MapAccessibilityContext';
import { formatCurrency } from '@/lib/utils';
import { Button } from '@/components/ui/button';
import { Slider } from '@/components/ui/slider';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';
import {
  MapIcon,
  Layers,
  Filter,
  TrendingUp,
  Info,
  X,
  Activity
} from 'lucide-react';

// Need to declare the HeatLayer module for TypeScript
declare module 'leaflet' {
  export function heatLayer(
    latlngs: Array<[number, number, number]>,
    options?: any
  ): any;
}

// Options for property value visualization types
const valueTypeOptions = [
  { label: 'Assessed Value', value: 'value' },
  { label: 'Price per Sq Ft', value: 'pricePerSqFt' },
  { label: 'Value Growth %', value: 'valueGrowth' },
  { label: 'Sales Volume', value: 'salesVolume' }
];

// Options for time periods
const timePeriodOptions = [
  { label: 'Current', value: 'current' },
  { label: '2023', value: '2023' },
  { label: '2022', value: '2022' },
  { label: '2021', value: '2021' },
  { label: '2020', value: '2020' },
  { label: '5-Year Trend', value: '5year' }
];

// Color scheme options
const colorSchemeOptions = [
  { label: 'Blue-Red', value: 'blueRed', start: '#3b82f6', end: '#ef4444' },
  { label: 'Green-Purple', value: 'greenPurple', start: '#22c55e', end: '#a855f7' },
  { label: 'Yellow-Blue', value: 'yellowBlue', start: '#eab308', end: '#3b82f6' },
  { label: 'Monochrome', value: 'mono', start: '#f8fafc', end: '#0f172a' },
  { label: 'Heat', value: 'heat', start: '#fef9c3', end: '#b91c1c' }
];

// Radius options for heatmap
const radiusOptions = [
  { label: 'Small', value: 15 },
  { label: 'Medium', value: 25 },
  { label: 'Large', value: 35 }
];

// Intensity options for heatmap
const intensityOptions = [
  { label: 'Low', value: 0.5 },
  { label: 'Medium', value: 1 },
  { label: 'High', value: 2 }
];

interface HeatmapVisualizationProps {
  properties: Property[];
  colorScheme?: { start: string, end: string };
  defaultValueType?: string;
  defaultTimePeriod?: string;
  defaultRadius?: number;
  defaultIntensity?: number;
  showControls?: boolean;
  height?: string | number;
  width?: string | number;
  className?: string;
}

// Component to update the heatmap when settings change
function HeatmapLayer({
  properties,
  valueType,
  radius,
  intensity,
  colorScheme,
  timePeriod,
  filter
}: {
  properties: Property[];
  valueType: string;
  radius: number;
  intensity: number;
  colorScheme: { start: string, end: string };
  timePeriod: string;
  filter: (properties: Property[]) => Property[];
}) {
  const map = useMap();
  const heatLayerRef = useRef<any>(null);
  
  useEffect(() => {
    // Filter properties
    const filteredProperties = filter(properties);
    
    // Convert filtered properties to heatmap points
    const points: Array<[number, number, number]> = [];
    let validCount = 0;
    
    filteredProperties.forEach(property => {
      if (!property.latitude || !property.longitude) return;
      
      // Get property value based on the selected value type
      let value: number | undefined;
      
      if (valueType === 'value') {
        if (property.value) {
          value = typeof property.value === 'string' 
            ? parseFloat(property.value.replace(/[^0-9.-]+/g, '')) 
            : property.value as number;
        }
      } else if (valueType === 'pricePerSqFt') {
        if (property.pricePerSqFt) {
          value = typeof property.pricePerSqFt === 'string'
            ? parseFloat(property.pricePerSqFt.replace(/[^0-9.-]+/g, ''))
            : property.pricePerSqFt as number;
        } else if (property.value && property.squareFeet && property.squareFeet > 0) {
          const propValue = typeof property.value === 'string'
            ? parseFloat(property.value.replace(/[^0-9.-]+/g, ''))
            : property.value as number;
          value = propValue / property.squareFeet;
        }
      } else if (valueType === 'valueGrowth') {
        // In a real application, this would use historical data
        // For demo purposes we'll use a random growth percentage
        value = Math.random() * 15; // 0-15% growth
      } else if (valueType === 'salesVolume') {
        // In a real application, this would use transaction count data
        // For demo purposes we'll use random volume
        value = Math.random() * 10; // 0-10 sales
      }
      
      // Skip properties with undefined values
      if (value === undefined || isNaN(value)) return;
      
      // Normalize value to a 0-1 scale for intensity
      // A more sophisticated implementation would use statistical normalization
      const normalizedValue = Math.min(Math.max(value / 1000000, 0), 1) * intensity;
      
      points.push([property.latitude, property.longitude, normalizedValue]);
      validCount++;
    });
    
    // Remove existing heat layer if it exists
    if (heatLayerRef.current) {
      map.removeLayer(heatLayerRef.current);
    }
    
    // Skip creating the heatmap if there are no valid points
    if (points.length === 0) return;
    
    // Create a new heat layer
    heatLayerRef.current = L.heatLayer(points, {
      radius,
      gradient: {
        0.4: colorScheme.start,
        0.8: colorScheme.end
      },
      blur: 15,
      maxZoom: 17
    }).addTo(map);
    
    // Clean up on unmount
    return () => {
      if (heatLayerRef.current) {
        map.removeLayer(heatLayerRef.current);
      }
    };
  }, [map, properties, valueType, radius, intensity, colorScheme, timePeriod, filter]);
  
  // data-* attributes for testing
  return (
    <div 
      data-testid="heatmap-layer"
      data-value-type={valueType}
      data-time-period={timePeriod}
      data-color-start={colorScheme.start}
      data-color-end={colorScheme.end}
      data-filter-type={filter.name}
    />
  );
}

export default function HeatmapVisualization({
  properties,
  colorScheme = colorSchemeOptions[0],
  defaultValueType = 'value',
  defaultTimePeriod = 'current',
  defaultRadius = 25,
  defaultIntensity = 1,
  showControls = true,
  height = 600,
  width = '100%',
  className = ''
}: HeatmapVisualizationProps) {
  // State for heatmap controls
  const [valueType, setValueType] = useState(defaultValueType);
  const [timePeriod, setTimePeriod] = useState(defaultTimePeriod);
  const [selectedColorScheme, setSelectedColorScheme] = useState(
    colorScheme || colorSchemeOptions[0]
  );
  const [radius, setRadius] = useState(defaultRadius);
  const [intensity, setIntensity] = useState(defaultIntensity);
  const [selectedArea, setSelectedArea] = useState<{
    center: [number, number];
    properties: Property[];
  } | null>(null);
  
  // Use the property filter context
  const { filters, applyFilters } = usePropertyFilter();
  
  // Use the map accessibility context
  const { highContrastMode } = useMapAccessibility();
  
  // Update color scheme when high contrast mode changes
  useEffect(() => {
    if (highContrastMode) {
      setSelectedColorScheme(colorSchemeOptions[3]); // Monochrome
    } else if (selectedColorScheme.value === 'mono') {
      setSelectedColorScheme(colorSchemeOptions[0]); // Default
    }
  }, [highContrastMode]);
  
  // Count properties that have valid coordinates and values
  const validProperties = properties.filter(
    p => p.latitude && p.longitude && p.value
  );
  
  // Filter properties based on the current filters
  const filteredProperties = applyFilters(validProperties);
  
  // Handle area selection
  const handleAreaSelect = (center: [number, number], radius: number) => {
    // Find properties within the selected area
    const propertiesInArea = filteredProperties.filter(property => {
      if (!property.latitude || !property.longitude) return false;
      
      // Calculate distance from center (simplified)
      const dx = center[0] - property.latitude;
      const dy = center[1] - property.longitude;
      const distance = Math.sqrt(dx * dx + dy * dy);
      
      // Convert lat/lng distance to approximate km
      const distanceKm = distance * 111; // 1 degree is roughly 111km
      
      return distanceKm <= radius;
    });
    
    setSelectedArea({
      center,
      properties: propertiesInArea
    });
  };
  
  // Close area detail panel
  const closeAreaDetail = () => {
    setSelectedArea(null);
  };
  
  // Generate area statistics
  const areaStats = selectedArea ? {
    propertyCount: selectedArea.properties.length,
    averageValue: selectedArea.properties.length > 0
      ? selectedArea.properties.reduce((sum, p) => {
          const value = typeof p.value === 'string'
            ? parseFloat(p.value.replace(/[^0-9.-]+/g, ''))
            : (p.value as number) || 0;
          return sum + value;
        }, 0) / selectedArea.properties.length
      : 0,
    minValue: selectedArea.properties.length > 0
      ? Math.min(...selectedArea.properties.map(p => {
          const value = typeof p.value === 'string'
            ? parseFloat(p.value.replace(/[^0-9.-]+/g, ''))
            : (p.value as number) || 0;
          return value;
        }))
      : 0,
    maxValue: selectedArea.properties.length > 0
      ? Math.max(...selectedArea.properties.map(p => {
          const value = typeof p.value === 'string'
            ? parseFloat(p.value.replace(/[^0-9.-]+/g, ''))
            : (p.value as number) || 0;
          return value;
        }))
      : 0,
    dominantPropertyType: selectedArea.properties.length > 0
      ? getMostCommonValue(selectedArea.properties.map(p => p.propertyType || 'Unknown'))
      : 'Unknown',
    dominantNeighborhood: selectedArea.properties.length > 0
      ? getMostCommonValue(selectedArea.properties.map(p => p.neighborhood || 'Unknown'))
      : 'Unknown'
  } : null;
  
  // Get the most common value in an array
  function getMostCommonValue(values: string[]): string {
    const counts = values.reduce((acc, value) => {
      acc[value] = (acc[value] || 0) + 1;
      return acc;
    }, {} as Record<string, number>);
    
    let mostCommon = '';
    let maxCount = 0;
    
    Object.entries(counts).forEach(([value, count]) => {
      if (count > maxCount) {
        mostCommon = value;
        maxCount = count;
      }
    });
    
    return mostCommon;
  }
  
  // If no properties data is available
  if (properties.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height, width }}>
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <MapIcon className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No property data available</h3>
          <p className="text-gray-500">
            No property data available for heatmap visualization.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <MapContainer
        center={[40.7128, -74.006]} // Default center (should be adjusted based on property data)
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ZoomControl position="bottomright" />
        
        <LayerGroup>
          <HeatmapLayer
            properties={properties}
            valueType={valueType}
            radius={radius}
            intensity={intensity}
            colorScheme={selectedColorScheme}
            timePeriod={timePeriod}
            filter={applyFilters}
          />
        </LayerGroup>
        
        {/* Display markers for the selected area properties if needed */}
        {selectedArea && selectedArea.properties.slice(0, 50).map(property => (
          <Marker
            key={property.id}
            position={[property.latitude || 0, property.longitude || 0]}
            icon={L.divIcon({
              className: 'bg-transparent',
              html: `<div class="w-3 h-3 rounded-full bg-primary border border-white"></div>`,
              iconSize: [10, 10],
              iconAnchor: [5, 5]
            })}
          >
            <Popup>
              <div className="p-1">
                <h3 className="font-medium">{property.address}</h3>
                <p className="text-sm">{formatCurrency(property.value)}</p>
                {property.propertyType && (
                  <p className="text-xs text-gray-500">{property.propertyType}</p>
                )}
              </div>
            </Popup>
          </Marker>
        ))}
      </MapContainer>
      
      {/* Controls */}
      {showControls && (
        <div 
          className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md z-[1000] max-w-sm"
          data-testid="heatmap-controls"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Property Value Heatmap</h3>
            <div className="text-xs text-gray-500">
              {filteredProperties.length} of {validProperties.length} properties displayed
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label htmlFor="valueType" className="block text-sm font-medium mb-1">
                Value Type
              </label>
              <Select
                value={valueType}
                onValueChange={setValueType}
              >
                <SelectTrigger id="valueType">
                  <SelectValue placeholder="Select value type" />
                </SelectTrigger>
                <SelectContent>
                  {valueTypeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="timePeriod" className="block text-sm font-medium mb-1">
                Time Period
              </label>
              <Select
                value={timePeriod}
                onValueChange={setTimePeriod}
              >
                <SelectTrigger id="timePeriod">
                  <SelectValue placeholder="Select time period" />
                </SelectTrigger>
                <SelectContent>
                  {timePeriodOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label htmlFor="colorScheme" className="block text-sm font-medium mb-1">
                Color Scheme
              </label>
              <Select
                value={selectedColorScheme.value}
                onValueChange={(value) => {
                  const scheme = colorSchemeOptions.find(s => s.value === value);
                  if (scheme) setSelectedColorScheme(scheme);
                }}
              >
                <SelectTrigger id="colorScheme">
                  <SelectValue placeholder="Select color scheme" />
                </SelectTrigger>
                <SelectContent>
                  {colorSchemeOptions.map(option => (
                    <SelectItem key={option.value} value={option.value}>
                      <div className="flex items-center">
                        <div 
                          className="w-4 h-4 mr-2 rounded-full"
                          style={{ 
                            background: `linear-gradient(to right, ${option.start}, ${option.end})` 
                          }}
                        />
                        {option.label}
                      </div>
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Radius
              </label>
              <Slider
                value={[radius]}
                min={10}
                max={50}
                step={5}
                onValueChange={(value) => setRadius(value[0])}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Small</span>
                <span>Large</span>
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Intensity
              </label>
              <Slider
                value={[intensity]}
                min={0.2}
                max={2}
                step={0.1}
                onValueChange={(value) => setIntensity(value[0])}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Low</span>
                <span>High</span>
              </div>
            </div>
          </div>
        </div>
      )}
      
      {/* Selected area details panel */}
      {selectedArea && areaStats && (
        <div 
          className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md z-[1000] max-w-sm"
          data-testid="heatmap-details-panel"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Area Details</h3>
            <Button
              variant="ghost"
              size="sm"
              onClick={closeAreaDetail}
              className="h-8 w-8 p-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          
          <div className="space-y-3">
            <div>
              <span className="text-sm text-gray-500">Property Count:</span>
              <span className="ml-2 font-medium">{areaStats.propertyCount}</span>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Average Value:</span>
              <span className="ml-2 font-medium">{formatCurrency(areaStats.averageValue)}</span>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Value Range:</span>
              <span className="ml-2 font-medium">
                {formatCurrency(areaStats.minValue)} - {formatCurrency(areaStats.maxValue)}
              </span>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Dominant Property Type:</span>
              <span className="ml-2 font-medium">{areaStats.dominantPropertyType}</span>
            </div>
            
            <div>
              <span className="text-sm text-gray-500">Dominant Neighborhood:</span>
              <span className="ml-2 font-medium">{areaStats.dominantNeighborhood}</span>
            </div>
          </div>
          
          <Button 
            className="w-full mt-4"
            onClick={() => {
              // This would integrate with other analysis tools
              console.log('Export area data', selectedArea);
            }}
          >
            Export Area Data
          </Button>
        </div>
      )}
    </div>
  );
}