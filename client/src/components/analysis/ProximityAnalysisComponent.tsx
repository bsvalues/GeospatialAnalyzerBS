import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  LayerGroup, 
  useMap, 
  Marker, 
  Popup,
  Polygon,
  Circle,
  ZoomControl
} from 'react-leaflet';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
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
  BarChart,
  Download,
  Target,
  MapPin,
  Map,
  Compass,
  ArrowRight,
  Info
} from 'lucide-react';

import { 
  Amenity,
  calculateDistanceToAmenity,
  generateIsochrones,
  quantifyProximityImpact
} from '@/services/proximityAnalysisService';

interface ProximityAnalysisComponentProps {
  properties: Property[];
  amenities?: Amenity[];
  height?: string | number;
  width?: string | number;
  className?: string;
  showControls?: boolean;
}

// Default amenities if none provided
const defaultAmenities: Amenity[] = [
  {
    id: 1,
    name: "Central Park",
    type: "Park",
    latitude: 40.7812,
    longitude: -73.9665,
    description: "Large urban park in Manhattan"
  },
  {
    id: 2,
    name: "Grand Central Terminal",
    type: "Transit",
    latitude: 40.7527,
    longitude: -73.9772,
    description: "Major transit hub"
  },
  {
    id: 3,
    name: "Columbia University",
    type: "School",
    latitude: 40.8075,
    longitude: -73.9626,
    description: "Ivy League university"
  },
  {
    id: 4,
    name: "Bellevue Hospital",
    type: "Hospital",
    latitude: 40.7392,
    longitude: -73.9754,
    description: "Medical center"
  },
  {
    id: 5,
    name: "Times Square",
    type: "Shopping",
    latitude: 40.7580,
    longitude: -73.9855,
    description: "Commercial center"
  }
];

// Travel time options for isochrones
const travelTimeOptions = [5, 10, 15, 20, 30];

// Travel modes
const travelModeOptions = [
  { label: 'Walking', value: 'walking' },
  { label: 'Driving', value: 'driving' },
  { label: 'Cycling', value: 'cycling' },
  { label: 'Transit', value: 'transit' }
];

// Amenity type options
const amenityTypeOptions = [
  { label: 'All', value: 'All' },
  { label: 'Parks', value: 'Park' },
  { label: 'Schools', value: 'School' },
  { label: 'Hospitals', value: 'Hospital' },
  { label: 'Transit', value: 'Transit' },
  { label: 'Shopping', value: 'Shopping' }
];

// Distance threshold options
const distanceThresholdOptions = [0.5, 1, 2, 3, 5];

// Component to display isochrones on map
function IsochroneLayer({
  amenity,
  travelTimes,
  travelMode
}: {
  amenity: Amenity;
  travelTimes: number[];
  travelMode: 'walking' | 'driving' | 'cycling' | 'transit';
}) {
  const [isochrones, setIsochrones] = useState<Array<{
    travelTime: number;
    coordinates: Array<{ lat: number; lng: number }>;
  }>>([]);
  
  useEffect(() => {
    // Generate isochrones
    const result = generateIsochrones({
      latitude: amenity.latitude,
      longitude: amenity.longitude,
      travelTimes,
      mode: travelMode
    });
    
    setIsochrones(result);
  }, [amenity, travelTimes, travelMode]);
  
  return (
    <>
      {isochrones.map((isochrone, index) => (
        <Polygon
          key={`${amenity.id}-${isochrone.travelTime}`}
          positions={isochrone.coordinates.map(coord => [coord.lat, coord.lng])}
          pathOptions={{
            fillColor: index === 0 ? '#3b82f6' : '#60a5fa',
            fillOpacity: 0.1 + (0.2 * (1 - index / isochrones.length)),
            weight: 1,
            color: index === 0 ? '#2563eb' : '#3b82f6',
            dashArray: index > 0 ? '4' : ''
          }}
        >
          <Popup>
            <div className="p-1">
              <strong>{isochrone.travelTime} min {travelMode}</strong> from {amenity.name}
            </div>
          </Popup>
        </Polygon>
      ))}
    </>
  );
}

export default function ProximityAnalysisComponent({
  properties,
  amenities = defaultAmenities,
  height = 600,
  width = '100%',
  className = '',
  showControls = true
}: ProximityAnalysisComponentProps) {
  // State for proximity analysis controls
  const [selectedAmenity, setSelectedAmenity] = useState<Amenity | null>(amenities[0] || null);
  const [selectedTravelTimes, setSelectedTravelTimes] = useState([5, 10, 15]);
  const [travelMode, setTravelMode] = useState<'walking' | 'driving' | 'cycling' | 'transit'>('walking');
  const [amenityType, setAmenityType] = useState('All');
  const [distanceThresholds, setDistanceThresholds] = useState<number[]>([0.5, 1, 2]);
  const [impactResults, setImpactResults] = useState<any>(null);
  const [mapCenter, setMapCenter] = useState<[number, number] | null>(null);
  const [activeTab, setActiveTab] = useState('isochrones');
  
  // Use the property filter context
  const { filters, applyFilters } = usePropertyFilter();
  
  // Use the map accessibility context
  const { highContrastMode } = useMapAccessibility();
  
  // Filter properties based on the current filters
  const filteredProperties = applyFilters(properties);
  
  // Filter amenities based on selected type
  const filteredAmenities = amenityType === 'All'
    ? amenities
    : amenities.filter(a => a.type === amenityType);
  
  // Set initial map center based on selected amenity
  useEffect(() => {
    if (selectedAmenity) {
      setMapCenter([selectedAmenity.latitude, selectedAmenity.longitude]);
    } else if (filteredAmenities.length > 0) {
      setSelectedAmenity(filteredAmenities[0]);
      setMapCenter([filteredAmenities[0].latitude, filteredAmenities[0].longitude]);
    }
  }, [selectedAmenity, filteredAmenities]);
  
  // Run impact analysis when parameters change
  useEffect(() => {
    if (filteredProperties.length === 0 || filteredAmenities.length === 0) {
      setImpactResults(null);
      return;
    }
    
    // Perform impact analysis
    const results = quantifyProximityImpact({
      amenityType: amenityType,
      distanceThresholds,
      properties: filteredProperties,
      amenities: filteredAmenities
    });
    
    setImpactResults(results);
  }, [filteredProperties, filteredAmenities, amenityType, distanceThresholds]);
  
  // Map zoom handler
  const MapManager = () => {
    const map = useMap();
    
    useEffect(() => {
      if (mapCenter) {
        map.setView(mapCenter, 13);
      }
    }, [map, mapCenter]);
    
    return null;
  };
  
  // If no properties data is available
  if (properties.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height, width }}>
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <Map className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No property data available</h3>
          <p className="text-gray-500">
            No property data available for proximity analysis.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <MapContainer
        center={mapCenter || [40.7128, -74.006]} // Default center
        zoom={13}
        style={{ height: '100%', width: '100%' }}
        zoomControl={false}
      >
        <TileLayer
          attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
          url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
        />
        
        <ZoomControl position="bottomright" />
        <MapManager />
        
        <LayerGroup>
          {/* Render amenity markers */}
          {filteredAmenities.map(amenity => (
            <Marker
              key={amenity.id}
              position={[amenity.latitude, amenity.longitude]}
              icon={L.divIcon({
                className: 'bg-transparent',
                html: `<div class="flex items-center justify-center w-8 h-8 rounded-full bg-primary text-white">
                  <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
                    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"></path>
                    <circle cx="12" cy="10" r="3"></circle>
                  </svg>
                </div>`,
                iconSize: [32, 32],
                iconAnchor: [16, 32]
              })}
              eventHandlers={{
                click: () => {
                  setSelectedAmenity(amenity);
                  setMapCenter([amenity.latitude, amenity.longitude]);
                }
              }}
            >
              <Popup>
                <div className="p-1">
                  <h3 className="font-medium">{amenity.name}</h3>
                  <p className="text-xs text-gray-500">{amenity.type}</p>
                  {amenity.description && (
                    <p className="text-xs mt-1">{amenity.description}</p>
                  )}
                </div>
              </Popup>
            </Marker>
          ))}
          
          {/* Render isochrones for selected amenity */}
          {selectedAmenity && activeTab === 'isochrones' && (
            <IsochroneLayer
              amenity={selectedAmenity}
              travelTimes={selectedTravelTimes}
              travelMode={travelMode}
            />
          )}
          
          {/* Render impact analysis visualization */}
          {impactResults && activeTab === 'impact' && selectedAmenity && (
            <>
              {/* Impact circles */}
              {impactResults.impactByDistance.map((impact: any, index: number) => (
                <Circle
                  key={`impact-${index}`}
                  center={[selectedAmenity.latitude, selectedAmenity.longitude]}
                  radius={impact.distanceThreshold * 1000} // Convert km to meters
                  pathOptions={{
                    color: impact.valueImpact > 0 ? '#22c55e' : '#ef4444',
                    fillColor: impact.valueImpact > 0 ? '#22c55e' : '#ef4444',
                    fillOpacity: Math.min(Math.abs(impact.valueImpact) * 0.5, 0.3),
                    weight: 1,
                    dashArray: index > 0 ? '4' : ''
                  }}
                >
                  <Popup>
                    <div className="p-1">
                      <h3 className="font-medium">{impact.distanceThreshold} km from {selectedAmenity.name}</h3>
                      <p className="text-sm">
                        Properties: {impact.propertyCount}
                      </p>
                      <p className="text-sm">
                        Avg Value: {formatCurrency(impact.averageValue)}
                      </p>
                      <p className="text-sm">
                        Impact: {(impact.valueImpact * 100).toFixed(1)}%
                      </p>
                    </div>
                  </Popup>
                </Circle>
              ))}
            </>
          )}
          
          {/* Optionally show affected properties */}
          {activeTab === 'impact' && selectedAmenity && (
            <>
              {filteredProperties.slice(0, 500).map(property => {
                if (!property.latitude || !property.longitude) return null;
                
                // Skip if not near selected amenity
                try {
                  const distance = calculateDistanceToAmenity(property, selectedAmenity);
                  if (distance > Math.max(...distanceThresholds)) return null;
                  
                  // Determine color based on property value
                  const value = property.value 
                    ? (typeof property.value === 'string' 
                      ? parseFloat(property.value.replace(/[^0-9.-]+/g, ''))
                      : property.value)
                    : 0;
                  
                  let color = '#6b7280'; // Default
                  
                  if (impactResults && impactResults.impactByDistance) {
                    // Find which impact zone this property is in
                    for (let i = 0; i < impactResults.impactByDistance.length; i++) {
                      const impact = impactResults.impactByDistance[i];
                      if (distance <= impact.distanceThreshold) {
                        color = impact.valueImpact > 0 ? '#22c55e' : '#ef4444';
                        break;
                      }
                    }
                  }
                  
                  return (
                    <Marker
                      key={property.id}
                      position={[property.latitude, property.longitude]}
                      icon={L.divIcon({
                        className: 'bg-transparent',
                        html: `<div class="w-2 h-2 rounded-full" style="background-color: ${color};"></div>`,
                        iconSize: [8, 8],
                        iconAnchor: [4, 4]
                      })}
                    >
                      <Popup>
                        <div className="p-1">
                          <h3 className="font-medium">{property.address}</h3>
                          <p className="text-sm">{formatCurrency(property.value)}</p>
                          <p className="text-xs">
                            {distance.toFixed(2)} km from {selectedAmenity.name}
                          </p>
                        </div>
                      </Popup>
                    </Marker>
                  );
                } catch (error) {
                  // Skip invalid properties
                  return null;
                }
              })}
            </>
          )}
        </LayerGroup>
      </MapContainer>
      
      {/* Controls */}
      {showControls && (
        <div className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md z-[1000] max-w-sm w-[320px]">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Proximity Analysis</h3>
          </div>
          
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid grid-cols-2 w-full">
              <TabsTrigger value="isochrones">Travel Time</TabsTrigger>
              <TabsTrigger value="impact">Value Impact</TabsTrigger>
            </TabsList>
            
            <TabsContent value="isochrones" className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amenity
                </label>
                <Select
                  value={selectedAmenity?.id.toString() || ''}
                  onValueChange={(value) => {
                    const amenity = amenities.find(a => a.id.toString() === value);
                    if (amenity) {
                      setSelectedAmenity(amenity);
                      setMapCenter([amenity.latitude, amenity.longitude]);
                    }
                  }}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select amenity" />
                  </SelectTrigger>
                  <SelectContent>
                    {filteredAmenities.map(amenity => (
                      <SelectItem key={amenity.id} value={amenity.id.toString()}>
                        {amenity.name} ({amenity.type})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Travel Mode
                </label>
                <Select
                  value={travelMode}
                  onValueChange={(value: any) => setTravelMode(value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select travel mode" />
                  </SelectTrigger>
                  <SelectContent>
                    {travelModeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Travel Times (minutes)
                </label>
                <div className="flex flex-wrap gap-2">
                  {travelTimeOptions.map(time => (
                    <Button
                      key={time}
                      variant={selectedTravelTimes.includes(time) ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (selectedTravelTimes.includes(time)) {
                          if (selectedTravelTimes.length > 1) {
                            setSelectedTravelTimes(selectedTravelTimes.filter(t => t !== time));
                          }
                        } else {
                          setSelectedTravelTimes([...selectedTravelTimes, time].sort((a, b) => a - b));
                        }
                      }}
                      className="text-xs h-8"
                    >
                      {time} min
                    </Button>
                  ))}
                </div>
              </div>
            </TabsContent>
            
            <TabsContent value="impact" className="space-y-4 mt-4">
              <div>
                <label className="block text-sm font-medium mb-2">
                  Amenity Type
                </label>
                <Select
                  value={amenityType}
                  onValueChange={setAmenityType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select amenity type" />
                  </SelectTrigger>
                  <SelectContent>
                    {amenityTypeOptions.map(option => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              
              <div>
                <label className="block text-sm font-medium mb-2">
                  Distance Thresholds (km)
                </label>
                <div className="flex flex-wrap gap-2">
                  {distanceThresholdOptions.map(distance => (
                    <Button
                      key={distance}
                      variant={distanceThresholds.includes(distance) ? "secondary" : "outline"}
                      size="sm"
                      onClick={() => {
                        if (distanceThresholds.includes(distance)) {
                          if (distanceThresholds.length > 1) {
                            setDistanceThresholds(distanceThresholds.filter(d => d !== distance));
                          }
                        } else {
                          setDistanceThresholds([...distanceThresholds, distance].sort((a, b) => a - b));
                        }
                      }}
                      className="text-xs h-8"
                    >
                      {distance} km
                    </Button>
                  ))}
                </div>
              </div>
              
              {impactResults && impactResults.insights && (
                <Card className="mt-4">
                  <CardHeader className="py-3">
                    <CardTitle className="text-sm">Key Insights</CardTitle>
                  </CardHeader>
                  <CardContent className="py-0">
                    <ul className="space-y-2 text-sm">
                      {impactResults.insights.map((insight: any, index: number) => (
                        <li key={index} className="flex">
                          <Info className="h-4 w-4 mr-2 mt-0.5 text-primary flex-shrink-0" />
                          <span>{insight.description}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter className="pt-3 pb-2">
                    <Button 
                      variant="outline" 
                      size="sm" 
                      className="w-full"
                      onClick={() => {
                        // Export analysis (would integrate with export service)
                        console.log('Export proximity analysis', impactResults);
                      }}
                    >
                      <Download className="h-4 w-4 mr-2" />
                      Export Analysis
                    </Button>
                  </CardFooter>
                </Card>
              )}
            </TabsContent>
          </Tabs>
        </div>
      )}
      
      {/* Selected amenity info */}
      {selectedAmenity && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-md z-[1000]">
          <div className="text-sm flex items-center">
            <MapPin className="h-4 w-4 mr-2 text-primary" />
            <span className="font-medium">{selectedAmenity.name}</span>
            <span className="mx-2">•</span>
            <span className="text-gray-500">{selectedAmenity.type}</span>
          </div>
        </div>
      )}
    </div>
  );
}