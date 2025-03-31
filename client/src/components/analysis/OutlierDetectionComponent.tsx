import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  LayerGroup, 
  useMap, 
  Marker, 
  Popup,
  CircleMarker,
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
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
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
  AlertTriangle,
  TrendingUp,
  TrendingDown,
  Download,
  Search,
  List,
  BarChart4,
  AlertCircle,
  Info,
  RefreshCw
} from 'lucide-react';

import { 
  detectOutliers, 
  generateOutlierExplanation,
  PropertyOutlier,
  OutlierDetectionOptions,
  OutlierDetectionResult
} from '@/services/outlierDetectionService';

interface OutlierDetectionComponentProps {
  properties: Property[];
  height?: string | number;
  width?: string | number;
  className?: string;
  showControls?: boolean;
}

// Attribute options for outlier detection
const attributeOptions = [
  { label: 'Property Value', value: 'value' },
  { label: 'Square Footage', value: 'squareFeet' },
  { label: 'Year Built', value: 'yearBuilt' },
  { label: 'Bedrooms', value: 'bedrooms' },
  { label: 'Bathrooms', value: 'bathrooms' },
  { label: 'Lot Size', value: 'lotSize' }
];

export default function OutlierDetectionComponent({
  properties,
  height = 600,
  width = '100%',
  className = '',
  showControls = true
}: OutlierDetectionComponentProps) {
  // State for outlier detection controls
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(['value']);
  const [threshold, setThreshold] = useState(2.0);
  const [useNeighborhoodContext, setUseNeighborhoodContext] = useState(true);
  const [detectionResults, setDetectionResults] = useState<OutlierDetectionResult | null>(null);
  const [selectedOutlier, setSelectedOutlier] = useState<PropertyOutlier | null>(null);
  const [outlierExplanation, setOutlierExplanation] = useState<any>(null);
  const [activeNeighborhood, setActiveNeighborhood] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState('map');
  
  // Use the property filter context
  const { filters, applyFilters } = usePropertyFilter();
  
  // Use the map accessibility context
  const { highContrastMode } = useMapAccessibility();
  
  // Filter properties based on the current filters
  const filteredProperties = applyFilters(properties);
  
  // Run outlier detection when parameters change
  useEffect(() => {
    if (filteredProperties.length === 0) {
      setDetectionResults(null);
      return;
    }
    
    // Perform outlier detection
    const options: OutlierDetectionOptions = {
      attributes: selectedAttributes,
      threshold,
      neighborhoodContext: useNeighborhoodContext,
      minPropertiesForStats: 5
    };
    
    const results = detectOutliers(filteredProperties, options);
    setDetectionResults(results);
    
    // Reset selected outlier if it no longer exists
    if (selectedOutlier && !results.outliers.some(o => o.propertyId === selectedOutlier.propertyId)) {
      setSelectedOutlier(null);
      setOutlierExplanation(null);
    }
  }, [filteredProperties, selectedAttributes, threshold, useNeighborhoodContext]);
  
  // Generate explanation when outlier is selected
  useEffect(() => {
    if (selectedOutlier && filteredProperties.length > 0) {
      try {
        const explanation = generateOutlierExplanation(selectedOutlier, filteredProperties);
        setOutlierExplanation(explanation);
      } catch (error) {
        console.error('Error generating explanation:', error);
        setOutlierExplanation(null);
      }
    } else {
      setOutlierExplanation(null);
    }
  }, [selectedOutlier, filteredProperties]);
  
  // Handle attribute selection change
  const handleAttributeChange = (attribute: string) => {
    // Toggle attribute selection
    if (selectedAttributes.includes(attribute)) {
      // Don't allow deselecting the last attribute
      if (selectedAttributes.length > 1) {
        setSelectedAttributes(selectedAttributes.filter(a => a !== attribute));
      }
    } else {
      setSelectedAttributes([...selectedAttributes, attribute]);
    }
  };
  
  // Function to determine marker color based on outlier type
  const getOutlierColor = (outlier: PropertyOutlier): string => {
    const score = outlier.deviationScores[outlier.primaryAttribute];
    
    if (score > 0) {
      // Above average (higher value)
      return '#ef4444'; // Red for high outliers
    } else {
      // Below average (lower value)
      return '#3b82f6'; // Blue for low outliers
    }
  };
  
  // Function to determine outlier size based on deviation magnitude
  const getOutlierSize = (outlier: PropertyOutlier): number => {
    const score = outlier.deviationScores[outlier.primaryAttribute];
    const magnitude = Math.abs(score);
    
    // Base size of 6, increasing with magnitude
    return Math.min(6 + magnitude * 2, 16);
  };
  
  // Get neighborhoods for filtering
  const neighborhoods = React.useMemo(() => {
    if (!detectionResults) return [];
    
    return Object.keys(detectionResults.neighborhoodStatistics).sort();
  }, [detectionResults]);
  
  // Filter outliers by neighborhood
  const filteredOutliers = React.useMemo(() => {
    if (!detectionResults) return [];
    
    if (activeNeighborhood) {
      return detectionResults.outliers.filter(o => o.neighborhood === activeNeighborhood);
    }
    
    return detectionResults.outliers;
  }, [detectionResults, activeNeighborhood]);
  
  // Get property by ID
  const getPropertyById = (id: number): Property | undefined => {
    return filteredProperties.find(p => p.id === id);
  };
  
  // If no properties data is available
  if (properties.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height, width }}>
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <AlertTriangle className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No property data available</h3>
          <p className="text-gray-500">
            No property data available for outlier detection.
          </p>
        </div>
      </div>
    );
  }
  
  return (
    <div className={`relative ${className}`} style={{ height, width }}>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full w-full">
        <div className={`absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md z-[1000] max-w-md ${!showControls ? 'hidden' : ''}`}>
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Outlier Detection</h3>
            <div className="text-xs text-gray-500">
              {detectionResults?.outliers.length || 0} outliers found
            </div>
          </div>
          
          <TabsList className="grid grid-cols-2 mb-4">
            <TabsTrigger value="map" data-testid="outliers-tab">Map View</TabsTrigger>
            <TabsTrigger value="list">List View</TabsTrigger>
          </TabsList>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Attributes to Analyze
              </label>
              <div className="flex flex-wrap gap-2">
                {attributeOptions.map(attribute => (
                  <Button
                    key={attribute.value}
                    variant={selectedAttributes.includes(attribute.value) ? "secondary" : "outline"}
                    size="sm"
                    onClick={() => handleAttributeChange(attribute.value)}
                    className="text-xs h-8"
                  >
                    {attribute.label}
                  </Button>
                ))}
              </div>
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Outlier Threshold ({threshold.toFixed(1)} σ)
              </label>
              <Slider
                value={[threshold]}
                min={1.5}
                max={3.5}
                step={0.1}
                onValueChange={(value) => setThreshold(value[0])}
                className="mb-2"
              />
              <div className="flex justify-between text-xs text-gray-500">
                <span>Less Strict</span>
                <span>More Strict</span>
              </div>
            </div>
            
            <div className="flex items-center space-x-2">
              <Switch
                id="neighborhood-context"
                checked={useNeighborhoodContext}
                onCheckedChange={setUseNeighborhoodContext}
              />
              <Label htmlFor="neighborhood-context">
                Use neighborhood context
              </Label>
            </div>
            
            {neighborhoods.length > 0 && (
              <div>
                <label className="block text-sm font-medium mb-2">
                  Filter by Neighborhood
                </label>
                <Select
                  value={activeNeighborhood || ''}
                  onValueChange={(value) => setActiveNeighborhood(value || null)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="All Neighborhoods" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">All Neighborhoods</SelectItem>
                    {neighborhoods.map(neighborhood => (
                      <SelectItem key={neighborhood} value={neighborhood}>
                        {neighborhood} ({detectionResults?.neighborhoodStatistics[neighborhood]?.outlierCount || 0})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}
          </div>
        </div>
        
        <TabsContent value="map" className="h-full">
          <MapContainer
            center={[40.7128, -74.006]} // Default center
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
              {/* Render background markers for context */}
              {filteredProperties.slice(0, 1000).map(property => {
                if (!property.latitude || !property.longitude) return null;
                
                // Skip if this property is an outlier (will be rendered separately)
                if (detectionResults?.outliers.some(o => o.propertyId === property.id)) {
                  return null;
                }
                
                return (
                  <CircleMarker
                    key={property.id}
                    center={[property.latitude, property.longitude]}
                    radius={3}
                    pathOptions={{
                      fillColor: '#9ca3af',
                      fillOpacity: 0.3,
                      weight: 1,
                      color: '#6b7280',
                      opacity: 0.5
                    }}
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
                  </CircleMarker>
                );
              })}
              
              {/* Render outlier markers */}
              {filteredOutliers.map(outlier => {
                const property = getPropertyById(outlier.propertyId);
                if (!property || !property.latitude || !property.longitude) return null;
                
                const color = getOutlierColor(outlier);
                const size = getOutlierSize(outlier);
                
                return (
                  <CircleMarker
                    key={property.id}
                    center={[property.latitude, property.longitude]}
                    radius={size}
                    pathOptions={{
                      fillColor: color,
                      fillOpacity: 0.6,
                      weight: 2,
                      color: 'white',
                      opacity: 1
                    }}
                    eventHandlers={{
                      click: () => {
                        setSelectedOutlier(outlier);
                      }
                    }}
                  >
                    <Popup>
                      <div className="p-1">
                        <h3 className="font-medium flex items-center">
                          <AlertTriangle className="h-4 w-4 mr-1 text-amber-500" />
                          {property.address}
                        </h3>
                        <p className="text-sm">{formatCurrency(property.value)}</p>
                        {property.propertyType && (
                          <p className="text-xs text-gray-500">{property.propertyType}</p>
                        )}
                        <Button
                          size="sm"
                          variant="outline"
                          className="w-full mt-2 h-7 text-xs"
                          onClick={() => setSelectedOutlier(outlier)}
                        >
                          View Outlier Details
                        </Button>
                      </div>
                    </Popup>
                  </CircleMarker>
                );
              })}
            </LayerGroup>
          </MapContainer>
        </TabsContent>
        
        <TabsContent value="list" className="h-full">
          <div className="h-full flex flex-col p-4">
            <div className="text-sm text-gray-500 mb-4">
              {filteredOutliers.length} outliers found out of {filteredProperties.length} properties
              {activeNeighborhood && ` in ${activeNeighborhood}`}
            </div>
            
            <div className="flex-1 overflow-auto">
              {filteredOutliers.length > 0 ? (
                <div className="space-y-2">
                  {filteredOutliers.map(outlier => {
                    const property = getPropertyById(outlier.propertyId);
                    if (!property) return null;
                    
                    const color = getOutlierColor(outlier);
                    const score = outlier.deviationScores[outlier.primaryAttribute];
                    const isHighOutlier = score > 0;
                    
                    return (
                      <div 
                        key={outlier.propertyId}
                        className={`p-3 border rounded-lg cursor-pointer ${
                          selectedOutlier?.propertyId === outlier.propertyId 
                            ? 'border-primary bg-primary/5' 
                            : 'border-gray-200 hover:bg-gray-50'
                        }`}
                        onClick={() => setSelectedOutlier(outlier)}
                      >
                        <div className="flex justify-between items-start">
                          <div>
                            <h3 className="font-medium text-sm">{property.address}</h3>
                            <p className="text-gray-500 text-xs">{property.neighborhood || 'Unknown neighborhood'}</p>
                          </div>
                          <div
                            className="px-2 py-1 rounded-full text-white text-xs font-medium flex items-center"
                            style={{ backgroundColor: color }}
                          >
                            {isHighOutlier ? (
                              <TrendingUp className="h-3 w-3 mr-1" />
                            ) : (
                              <TrendingDown className="h-3 w-3 mr-1" />
                            )}
                            {Math.abs(score).toFixed(1)}σ
                          </div>
                        </div>
                        
                        <div className="mt-2 flex justify-between">
                          <div className="text-sm">
                            {formatCurrency(property.value)}
                            {property.squareFeet && (
                              <span className="text-xs text-gray-500 ml-1">
                                ({property.squareFeet.toLocaleString()} sq ft)
                              </span>
                            )}
                          </div>
                          {property.yearBuilt && (
                            <div className="text-xs text-gray-500">
                              Built {property.yearBuilt}
                            </div>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center h-full text-gray-500">
                  <AlertCircle className="h-12 w-12 mb-4 text-gray-400" />
                  <p className="text-center">
                    No outliers found with current settings.
                    <br/>
                    Try adjusting the outlier threshold or selected attributes.
                  </p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>
      </Tabs>
      
      {/* Outlier detail panel */}
      {selectedOutlier && outlierExplanation && (
        <div 
          className="absolute top-4 right-4 bg-white p-4 rounded-lg shadow-md z-[1000] max-w-md w-[350px]"
          data-testid="outlier-details-panel"
        >
          <div className="flex justify-between items-start mb-4">
            <div>
              <h3 className="text-lg font-medium">Outlier Details</h3>
              <p className="text-sm text-gray-500">
                Property {selectedOutlier.propertyId}
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              className="h-8 w-8 p-0"
              onClick={() => {
                setSelectedOutlier(null);
                setOutlierExplanation(null);
              }}
            >
              ✕
            </Button>
          </div>
          
          <div className="space-y-4">
            {/* Property details */}
            {(() => {
              const property = getPropertyById(selectedOutlier.propertyId);
              if (!property) return null;
              
              return (
                <div className="p-3 border border-gray-200 rounded-lg">
                  <h4 className="font-medium">{property.address}</h4>
                  <div className="mt-1 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-gray-500">Value:</span>
                      <span className="ml-1 font-medium">{formatCurrency(property.value)}</span>
                    </div>
                    {property.squareFeet && (
                      <div>
                        <span className="text-gray-500">Area:</span>
                        <span className="ml-1 font-medium">{property.squareFeet.toLocaleString()} sq ft</span>
                      </div>
                    )}
                    {property.yearBuilt && (
                      <div>
                        <span className="text-gray-500">Built:</span>
                        <span className="ml-1 font-medium">{property.yearBuilt}</span>
                      </div>
                    )}
                    {property.propertyType && (
                      <div>
                        <span className="text-gray-500">Type:</span>
                        <span className="ml-1 font-medium">{property.propertyType}</span>
                      </div>
                    )}
                    {property.neighborhood && (
                      <div className="col-span-2">
                        <span className="text-gray-500">Neighborhood:</span>
                        <span className="ml-1 font-medium">{property.neighborhood}</span>
                      </div>
                    )}
                  </div>
                </div>
              );
            })()}
            
            {/* Outlier explanation */}
            <div>
              <div className="flex items-center mb-2">
                <AlertTriangle className="h-5 w-5 mr-2 text-amber-500" />
                <h4 className="font-medium">Outlier Analysis</h4>
              </div>
              
              <p className="text-sm mb-3">
                {outlierExplanation.summary}
              </p>
              
              <div className="p-3 bg-gray-50 rounded-lg mb-3">
                <div className="text-sm">
                  <span className="text-gray-500">Statistical Deviation:</span>
                  <span className="ml-1 font-medium">
                    {Math.abs(outlierExplanation.zScore).toFixed(1)} standard deviations
                    {' '}
                    {outlierExplanation.anomalyDirection === 'above' ? 'above' : 'below'}
                    {' '}average
                  </span>
                </div>
                <div className="text-sm">
                  <span className="text-gray-500">Comparison:</span>
                  <span className="ml-1 font-medium">
                    {outlierExplanation.neighborhoodComparison}
                  </span>
                </div>
              </div>
              
              <h5 className="font-medium text-sm mb-2">Contributing Factors</h5>
              <ul className="space-y-1 text-sm">
                {outlierExplanation.factors.map((factor: string, index: number) => (
                  <li key={index} className="flex items-start">
                    <span className="text-primary mr-2">•</span>
                    {factor}
                  </li>
                ))}
              </ul>
            </div>
            
            <Button 
              variant="outline" 
              size="sm" 
              className="w-full"
              onClick={() => {
                // Export outlier details (would integrate with export service)
                console.log('Export outlier details', {
                  property: getPropertyById(selectedOutlier.propertyId),
                  outlier: selectedOutlier,
                  explanation: outlierExplanation
                });
              }}
            >
              <Download className="h-4 w-4 mr-2" />
              Export Outlier Report
            </Button>
          </div>
        </div>
      )}
      
      {/* Status information */}
      {detectionResults && (
        <div 
          className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white px-3 py-2 rounded-lg shadow-md z-[1000]"
          data-testid="url-state-indicator" // For testing
          data-current-url=""
        >
          <div className="text-sm text-gray-700 flex items-center">
            <span className="font-medium mr-1 text-primary">{detectionResults.metadata.outlierPercentage.toFixed(1)}%</span>
            <span>of properties identified as statistical outliers</span>
          </div>
        </div>
      )}
    </div>
  );
}