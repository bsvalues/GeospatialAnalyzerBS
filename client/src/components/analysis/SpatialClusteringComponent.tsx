import React, { useState, useEffect } from 'react';
import { 
  MapContainer, 
  TileLayer, 
  LayerGroup, 
  useMap, 
  Marker, 
  Popup,
  Circle,
  ZoomControl,
  Tooltip
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
  Grid,
  ChevronRight,
  Layers,
  Filter,
  TrendingUp,
  RefreshCw,
  Download,
  Info
} from 'lucide-react';

import { 
  performSpatialClustering, 
  getOptimalClusterCount,
  generateClusterColors,
  Cluster,
  ClusteringOptions
} from '@/services/spatialAnalysisService';

interface SpatialClusteringComponentProps {
  properties: Property[];
  height?: string | number;
  width?: string | number;
  className?: string;
  showControls?: boolean;
}

// Attribute options for clustering
const attributeOptions = [
  { label: 'Location', value: 'location' },
  { label: 'Property Value', value: 'value' },
  { label: 'Square Footage', value: 'squareFeet' },
  { label: 'Year Built', value: 'yearBuilt' },
  { label: 'Property Type', value: 'propertyType' }
];

// Component to display clustered properties on map
function ClusterMapLayer({
  properties,
  clusterCount,
  attributes,
  onClustersGenerated
}: {
  properties: Property[];
  clusterCount: number;
  attributes: string[];
  onClustersGenerated: (clusters: Cluster[], propertyMap: Map<number, number>) => void;
}) {
  const map = useMap();
  const { highContrastMode } = useMapAccessibility();
  
  useEffect(() => {
    // Filter out properties without coordinates
    const validProperties = properties.filter(
      p => p.latitude !== undefined && p.longitude !== undefined
    );
    
    if (validProperties.length === 0) return;
    
    // Perform clustering
    const clusteringResult = performSpatialClustering(validProperties, {
      numberOfClusters: clusterCount,
      attributes,
      maxIterations: 100
    });
    
    const { clusters, propertyClusterMap } = clusteringResult;
    
    // Generate colors for clusters
    const colors = generateClusterColors(clusters.length);
    
    // Notify parent component
    onClustersGenerated(clusters, propertyClusterMap);
    
    // Adjust map view to show all clusters
    if (clusters.length > 0) {
      const bounds = L.latLngBounds(
        clusters.map(cluster => 
          L.latLng(cluster.centroid.latitude, cluster.centroid.longitude)
        )
      );
      map.fitBounds(bounds, { padding: [50, 50] });
    }
    
  }, [map, properties, clusterCount, attributes, onClustersGenerated]);
  
  return null;
}

export default function SpatialClusteringComponent({
  properties,
  height = 600,
  width = '100%',
  className = '',
  showControls = true
}: SpatialClusteringComponentProps) {
  // State for clustering controls
  const [clusterCount, setClusterCount] = useState(5);
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(['location', 'value']);
  const [clusters, setClusters] = useState<Cluster[]>([]);
  const [propertyClusterMap, setPropertyClusterMap] = useState<Map<number, number>>(new Map());
  const [selectedCluster, setSelectedCluster] = useState<Cluster | null>(null);
  const [clusterColors, setClusterColors] = useState<string[]>([]);
  const [optimalClusterCount, setOptimalClusterCount] = useState<number | null>(null);
  
  // Use the property filter context
  const { filters, applyFilters } = usePropertyFilter();
  
  // Use the map accessibility context
  const { highContrastMode } = useMapAccessibility();
  
  // Filter properties based on the current filters
  const filteredProperties = applyFilters(properties);
  
  // Handle clusters generated
  const handleClustersGenerated = (
    newClusters: Cluster[], 
    newPropertyMap: Map<number, number>
  ) => {
    setClusters(newClusters);
    setPropertyClusterMap(newPropertyMap);
    setClusterColors(generateClusterColors(newClusters.length));
    
    // Reset selected cluster if it no longer exists
    if (selectedCluster && !newClusters.some(c => c.id === selectedCluster.id)) {
      setSelectedCluster(null);
    }
  };
  
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
  
  // Find optimal cluster count
  const calculateOptimalClusterCount = () => {
    // Filter valid properties
    const validProperties = filteredProperties.filter(
      p => p.latitude !== undefined && p.longitude !== undefined
    );
    
    if (validProperties.length < 10) {
      // Too few properties for meaningful optimization
      setOptimalClusterCount(Math.min(3, Math.ceil(validProperties.length / 2)));
      return;
    }
    
    // Get optimal count from service
    const optimal = getOptimalClusterCount(
      validProperties,
      { attributes: selectedAttributes },
      10
    );
    
    setOptimalClusterCount(optimal);
    setClusterCount(optimal);
  };
  
  // Cluster detail view
  const ClusterDetail = ({ cluster }: { cluster: Cluster }) => {
    // Get properties in this cluster
    const clusterProperties = properties.filter(
      p => cluster.properties?.includes(p.id as number)
    );
    
    return (
      <Card className="w-full">
        <CardHeader className="pb-2">
          <div className="flex items-center">
            <div 
              className="w-4 h-4 rounded-full mr-2" 
              style={{ backgroundColor: clusterColors[cluster.id - 1] || '#888' }}
            />
            <CardTitle className="text-lg">Cluster {cluster.id}</CardTitle>
          </div>
          <CardDescription>
            {cluster.dominantNeighborhood && (
              <span className="block">Primary area: {cluster.dominantNeighborhood}</span>
            )}
            <span>{cluster.propertyCount} properties</span>
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm">
            <div>
              <span className="text-gray-500 block">Avg. Value</span>
              <span className="font-medium">{formatCurrency(cluster.averageValue)}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Value Range</span>
              <span className="font-medium">
                {cluster.valueRange ? 
                  `${formatCurrency(cluster.valueRange[0])} - ${formatCurrency(cluster.valueRange[1])}` : 
                  'N/A'}
              </span>
            </div>
            <div>
              <span className="text-gray-500 block">Property Type</span>
              <span className="font-medium">{cluster.dominantPropertyType || 'Mixed'}</span>
            </div>
            <div>
              <span className="text-gray-500 block">Location</span>
              <span className="font-medium truncate">
                {`${cluster.centroid.latitude.toFixed(4)}, ${cluster.centroid.longitude.toFixed(4)}`}
              </span>
            </div>
          </div>
          
          <div>
            <h4 className="font-medium mb-2">Property Breakdown</h4>
            <div className="max-h-40 overflow-y-auto">
              <table className="w-full text-xs">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-2 py-1 text-left">Address</th>
                    <th className="px-2 py-1 text-right">Value</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {clusterProperties.slice(0, 10).map(property => (
                    <tr key={property.id} className="hover:bg-gray-50">
                      <td className="px-2 py-1 truncate max-w-[150px]">{property.address}</td>
                      <td className="px-2 py-1 text-right">{formatCurrency(property.value)}</td>
                    </tr>
                  ))}
                  {clusterProperties.length > 10 && (
                    <tr>
                      <td colSpan={2} className="px-2 py-1 text-center text-gray-500">
                        +{clusterProperties.length - 10} more properties
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
        <CardFooter>
          <Button 
            size="sm" 
            variant="outline" 
            className="w-full"
            onClick={() => {
              // Export cluster data (would integrate with export service)
              console.log('Export cluster data', cluster);
            }}
          >
            <Download className="h-4 w-4 mr-2" />
            Export Cluster Data
          </Button>
        </CardFooter>
      </Card>
    );
  };
  
  // If no properties data is available
  if (properties.length === 0) {
    return (
      <div className={`flex items-center justify-center ${className}`} style={{ height, width }}>
        <div className="text-center p-8 bg-gray-100 rounded-lg">
          <Grid className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-medium text-gray-900 mb-2">No property data available</h3>
          <p className="text-gray-500">
            No property data available for cluster analysis.
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
          {/* Render cluster visualization */}
          <ClusterMapLayer
            properties={filteredProperties}
            clusterCount={clusterCount}
            attributes={selectedAttributes}
            onClustersGenerated={handleClustersGenerated}
          />
          
          {/* Render cluster centroids */}
          {clusters.map((cluster, index) => (
            <React.Fragment key={cluster.id}>
              {/* Cluster centroid marker */}
              <Marker
                position={[cluster.centroid.latitude, cluster.centroid.longitude]}
                icon={L.divIcon({
                  className: 'bg-transparent',
                  html: `<div class="flex items-center justify-center w-8 h-8 rounded-full text-white font-bold text-xs" style="background-color: ${clusterColors[index] || '#888'};">${cluster.id}</div>`,
                  iconSize: [32, 32],
                  iconAnchor: [16, 16]
                })}
                eventHandlers={{
                  click: () => setSelectedCluster(cluster)
                }}
              >
                <Tooltip direction="top">
                  <div>
                    <strong>Cluster {cluster.id}</strong>
                    <div>{cluster.propertyCount} properties</div>
                    <div>Avg. Value: {formatCurrency(cluster.averageValue)}</div>
                  </div>
                </Tooltip>
              </Marker>
              
              {/* Circle indicating cluster boundary (simplified) */}
              <Circle
                center={[cluster.centroid.latitude, cluster.centroid.longitude]}
                radius={500} // Simplified radius - would be calculated based on actual cluster spread
                pathOptions={{
                  color: clusterColors[index] || '#888',
                  fillColor: clusterColors[index] || '#888',
                  fillOpacity: 0.1,
                  weight: 1
                }}
              />
            </React.Fragment>
          ))}
        </LayerGroup>
      </MapContainer>
      
      {/* Controls */}
      {showControls && (
        <div 
          className="absolute top-4 left-4 bg-white p-4 rounded-lg shadow-md z-[1000] max-w-sm"
          data-testid="clustering-controls"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-lg font-medium">Spatial Clustering</h3>
            <div 
              className="text-xs text-gray-500"
              data-testid="property-count-indicator"
            >
              {filteredProperties.length} properties
            </div>
          </div>
          
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2">
                Number of Clusters
              </label>
              <div className="flex space-x-2 items-center">
                <Slider
                  value={[clusterCount]}
                  min={2}
                  max={10}
                  step={1}
                  onValueChange={(value) => setClusterCount(value[0])}
                  className="flex-1"
                />
                <span className="font-medium w-6 text-center">{clusterCount}</span>
              </div>
              {optimalClusterCount && (
                <div className="mt-1 text-xs text-primary">
                  Recommended clusters: {optimalClusterCount}
                </div>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium mb-2">
                Cluster By Attributes
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
            
            <div className="flex space-x-2">
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={calculateOptimalClusterCount}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Optimize Clusters
              </Button>
              
              <Button 
                variant="outline" 
                size="sm"
                className="flex-1"
                onClick={() => {
                  // Export clustering results (would integrate with export service)
                  console.log('Export cluster data', clusters);
                }}
              >
                <Download className="h-4 w-4 mr-2" />
                Export Results
              </Button>
            </div>
          </div>
        </div>
      )}
      
      {/* Cluster details panel */}
      {selectedCluster && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-md z-[1000] max-w-sm">
          <ClusterDetail cluster={selectedCluster} />
          <Button
            variant="ghost"
            size="sm"
            className="absolute top-2 right-2"
            onClick={() => setSelectedCluster(null)}
          >
            ✕
          </Button>
        </div>
      )}
      
      {/* Status information */}
      {clusters.length === 0 && filteredProperties.length > 0 && (
        <div className="absolute bottom-4 left-1/2 transform -translate-x-1/2 bg-white p-2 rounded-lg shadow-md z-[1000]">
          <div className="text-sm text-gray-500 flex items-center">
            <Info className="h-4 w-4 mr-2" />
            Adjust parameters and wait for clustering analysis to complete
          </div>
        </div>
      )}
    </div>
  );
}