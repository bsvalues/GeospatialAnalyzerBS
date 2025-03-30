import React, { useState, useEffect } from 'react';
import { MapContainer, TileLayer, CircleMarker, Tooltip, Polygon, useMap } from 'react-leaflet';
import { Property } from '@shared/schema';
import { 
  clusterProperties, 
  ClusteringResults 
} from '@/services/spatialAnalysisService';
import { formatCurrency } from '@/lib/utils';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Slider
} from "@/components/ui/slider";
import { 
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

interface ClusteringMapProps {
  properties: Property[];
  className?: string;
}

// Component to handle map bounds
const MapBoundsHandler: React.FC<{properties: Property[]}> = ({ properties }) => {
  const map = useMap();
  
  useEffect(() => {
    if (properties.length === 0) return;
    
    // Extract valid coordinates
    const validCoords = properties
      .filter(p => p.latitude && p.longitude)
      .map(p => [p.latitude as number, p.longitude as number] as [number, number]);
    
    if (validCoords.length > 0) {
      map.fitBounds(validCoords);
    }
  }, [properties, map]);
  
  return null;
};

// Convex hull algorithm to draw polygon around cluster points
const getConvexHull = (points: Array<[number, number]>): Array<[number, number]> => {
  if (points.length < 3) return points;
  
  // Find point with lowest y-coordinate (and leftmost if tied)
  let anchor = points[0];
  for (let i = 1; i < points.length; i++) {
    if (points[i][1] < anchor[1] || (points[i][1] === anchor[1] && points[i][0] < anchor[0])) {
      anchor = points[i];
    }
  }
  
  // Sort points by polar angle with respect to anchor
  const sortedPoints = [...points].sort((a, b) => {
    if (a === anchor) return -1;
    if (b === anchor) return 1;
    
    const angleA = Math.atan2(a[1] - anchor[1], a[0] - anchor[0]);
    const angleB = Math.atan2(b[1] - anchor[1], b[0] - anchor[0]);
    
    if (angleA === angleB) {
      // If angles are the same, sort by distance from anchor
      const distA = Math.hypot(a[0] - anchor[0], a[1] - anchor[1]);
      const distB = Math.hypot(b[0] - anchor[0], b[1] - anchor[1]);
      return distA - distB;
    }
    
    return angleA - angleB;
  });
  
  // Graham scan algorithm
  const hull: Array<[number, number]> = [sortedPoints[0], sortedPoints[1]];
  
  for (let i = 2; i < sortedPoints.length; i++) {
    while (
      hull.length > 1 && 
      !isLeftTurn(
        hull[hull.length - 2], 
        hull[hull.length - 1], 
        sortedPoints[i]
      )
    ) {
      hull.pop();
    }
    hull.push(sortedPoints[i]);
  }
  
  return hull;
};

// Check if three points make a left turn
const isLeftTurn = (p1: [number, number], p2: [number, number], p3: [number, number]): boolean => {
  return (p2[0] - p1[0]) * (p3[1] - p1[1]) - (p2[1] - p1[1]) * (p3[0] - p1[0]) > 0;
};

// Get cluster color from index
const getClusterColor = (index: number): string => {
  const colors = [
    '#ff4444', // Red
    '#44ff44', // Green
    '#4444ff', // Blue
    '#ffff44', // Yellow
    '#ff44ff', // Magenta
    '#44ffff', // Cyan
    '#ff8844', // Orange
    '#88ff44', // Lime
    '#4488ff', // Sky blue
    '#ff4488', // Pink
  ];
  
  return colors[index % colors.length];
};

export const ClusteringMap: React.FC<ClusteringMapProps> = ({ 
  properties,
  className = ''
}) => {
  // Available attributes for clustering
  const availableAttributes = [
    { value: 'value', label: 'Property Value' },
    { value: 'squareFeet', label: 'Square Feet' },
    { value: 'yearBuilt', label: 'Year Built' },
    { value: 'bedrooms', label: 'Bedrooms' },
    { value: 'bathrooms', label: 'Bathrooms' },
    { value: 'lotSize', label: 'Lot Size' }
  ];
  
  // State for clustering parameters
  const [selectedAttributes, setSelectedAttributes] = useState<string[]>(['value']);
  const [clusters, setClusters] = useState<number>(5);
  const [spatialWeight, setSpatialWeight] = useState<number>(0.5);
  
  // State for clustering results
  const [results, setResults] = useState<ClusteringResults | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // State for visualization
  const [showHulls, setShowHulls] = useState<boolean>(true);
  
  // Run clustering analysis
  const runClustering = async () => {
    if (properties.length < clusters) {
      setError(`Cannot create ${clusters} clusters from ${properties.length} properties`);
      return;
    }
    
    if (selectedAttributes.length === 0) {
      setError("Please select at least one attribute for clustering");
      return;
    }
    
    setLoading(true);
    setError(null);
    
    try {
      const clusteringResults = clusterProperties(
        properties,
        selectedAttributes,
        clusters,
        spatialWeight
      );
      
      setResults(clusteringResults);
      setLoading(false);
    } catch (err: any) {
      console.error("Error in clustering analysis:", err);
      setError(err.message || "Failed to perform clustering analysis");
      setLoading(false);
    }
  };
  
  // Toggle selection of attributes
  const toggleAttribute = (attribute: string) => {
    setSelectedAttributes(prev => {
      if (prev.includes(attribute)) {
        return prev.filter(a => a !== attribute);
      } else {
        return [...prev, attribute];
      }
    });
  };
  
  // Format field name for display
  const formatFieldName = (field: string): string => {
    return field
      .replace(/([A-Z])/g, ' $1') // Add space before capital letters
      .replace(/^./, str => str.toUpperCase()); // Capitalize first letter
  };
  
  // Get cluster points for convex hull
  const getClusterPoints = (clusterIndex: number): Array<[number, number]> => {
    if (!results) return [];
    
    return properties
      .filter((_, i) => results.clusters[i] === clusterIndex)
      .filter(p => p.latitude && p.longitude)
      .map(p => [p.latitude as number, p.longitude as number] as [number, number]);
  };
  
  return (
    <div className={`bg-white rounded-lg shadow ${className}`}>
      <div className="p-4 border-b border-gray-200">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Spatial Clustering Analysis
        </h2>
        <p className="text-sm text-gray-600 mb-4">
          Group properties into clusters based on attributes and spatial proximity.
        </p>
        
        <div className="space-y-4">
          {/* Attribute Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Attributes for Clustering
            </label>
            <div className="grid grid-cols-2 gap-2">
              {availableAttributes.map(attr => (
                <div 
                  key={attr.value}
                  className={`p-2 border rounded cursor-pointer text-sm ${
                    selectedAttributes.includes(attr.value) 
                      ? 'border-primary bg-primary/10 text-primary' 
                      : 'border-gray-300 hover:border-gray-400'
                  }`}
                  onClick={() => toggleAttribute(attr.value)}
                >
                  {attr.label}
                </div>
              ))}
            </div>
          </div>
          
          {/* Number of Clusters */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Number of Clusters: {clusters}
            </label>
            <Slider
              min={2}
              max={10}
              step={1}
              value={[clusters]}
              onValueChange={(values) => setClusters(values[0])}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>2 clusters</span>
              <span>10 clusters</span>
            </div>
          </div>
          
          {/* Spatial Weight */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Spatial Weight: {spatialWeight.toFixed(1)}
            </label>
            <Slider
              min={0}
              max={1}
              step={0.1}
              value={[spatialWeight]}
              onValueChange={(values) => setSpatialWeight(values[0])}
              className="py-2"
            />
            <div className="flex justify-between text-xs text-gray-500">
              <span>Attribute-only (0.0)</span>
              <span>Equal weight (0.5)</span>
              <span>Location-focused (1.0)</span>
            </div>
          </div>
          
          {/* Run Button */}
          <button
            onClick={runClustering}
            disabled={loading || selectedAttributes.length === 0}
            className="w-full py-2 bg-primary text-white rounded-md hover:bg-primary/90 disabled:bg-gray-300 disabled:cursor-not-allowed"
          >
            {loading ? (
              <span className="flex items-center justify-center">
                <svg className="animate-spin h-5 w-5 mr-2" viewBox="0 0 24 24">
                  <circle 
                    className="opacity-25" 
                    cx="12" 
                    cy="12" 
                    r="10" 
                    stroke="currentColor" 
                    strokeWidth="4"
                    fill="none"
                  />
                  <path 
                    className="opacity-75" 
                    fill="currentColor" 
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  />
                </svg>
                Running Clustering...
              </span>
            ) : "Perform Cluster Analysis"}
          </button>
          
          {/* Error Display */}
          {error && (
            <div className="p-3 rounded-md bg-red-50 text-red-700 text-sm">
              {error}
            </div>
          )}
        </div>
      </div>
      
      {/* Results Section */}
      {results && (
        <div className="p-4">
          <div className="flex justify-between items-center mb-4">
            <h3 className="text-md font-medium text-gray-800">Clustering Results</h3>
            
            <label className="flex items-center text-sm">
              <input
                type="checkbox"
                checked={showHulls}
                onChange={(e) => setShowHulls(e.target.checked)}
                className="mr-1.5 h-4 w-4 rounded text-primary"
              />
              Show Cluster Boundaries
            </label>
          </div>
          
          {/* Cluster Map */}
          <div className="h-96 rounded-lg overflow-hidden mb-4">
            <MapContainer
              style={{ height: '100%', width: '100%' }}
              zoom={12}
              center={[46.2, -119.1]} // Default center - will be adjusted by MapBoundsHandler
            >
              <TileLayer
                attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              />
              
              <MapBoundsHandler properties={properties} />
              
              {/* Cluster Hulls */}
              {showHulls && [...Array(clusters)].map((_, clusterIndex) => {
                const points = getClusterPoints(clusterIndex);
                if (points.length < 3) return null;
                
                const hull = getConvexHull(points);
                if (hull.length < 3) return null;
                
                // Add first point at the end to close the polygon
                const positions = [...hull, hull[0]];
                const color = getClusterColor(clusterIndex);
                
                return (
                  <Polygon
                    key={`hull-${clusterIndex}`}
                    positions={positions}
                    pathOptions={{
                      color,
                      weight: 2,
                      opacity: 0.7,
                      fillOpacity: 0.1
                    }}
                  />
                );
              })}
              
              {/* Property Markers */}
              {properties.map((property, index) => {
                if (!property.latitude || !property.longitude) return null;
                
                const clusterIndex = results.clusters[index];
                const color = getClusterColor(clusterIndex);
                
                return (
                  <CircleMarker
                    key={property.id}
                    center={[property.latitude as number, property.longitude as number]}
                    radius={6}
                    fillOpacity={0.8}
                    weight={1}
                    color="#ffffff"
                    fillColor={color}
                    data-testid={`cluster-marker-${property.id}`}
                  >
                    <Tooltip>
                      <div>
                        <strong>{property.address}</strong>
                        <div>Cluster: {clusterIndex + 1}</div>
                        {selectedAttributes.map(attr => (
                          <div key={attr}>
                            {formatFieldName(attr)}: {
                              attr === 'value' || attr === 'salePrice' || attr === 'landValue'
                                ? property[attr] || 'N/A'
                                : (property[attr] !== null && property[attr] !== undefined)
                                  ? property[attr]?.toString()
                                  : 'N/A'
                            }
                          </div>
                        ))}
                      </div>
                    </Tooltip>
                  </CircleMarker>
                );
              })}
            </MapContainer>
          </div>
          
          {/* Cluster Legend */}
          <div className="flex flex-wrap justify-center mb-4">
            {[...Array(clusters)].map((_, i) => (
              <div key={i} className="flex items-center mx-2 mb-2">
                <div 
                  className="h-3 w-3 rounded-full mr-1"
                  style={{ backgroundColor: getClusterColor(i) }}
                ></div>
                <span className="text-xs text-gray-600">Cluster {i + 1} ({
                  results.clusters.filter(c => c === i).length
                } properties)</span>
              </div>
            ))}
          </div>
          
          {/* Cluster Statistics */}
          <div className="bg-gray-50 p-4 rounded-lg overflow-x-auto">
            <h3 className="text-md font-medium text-gray-800 mb-3">Cluster Statistics</h3>
            
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Cluster</TableHead>
                  <TableHead>Properties</TableHead>
                  <TableHead>Avg. Value</TableHead>
                  <TableHead>Min Value</TableHead>
                  <TableHead>Max Value</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {results.clusterStats.map((stats, i) => (
                  <TableRow key={i}>
                    <TableCell className="font-medium">
                      <div className="flex items-center">
                        <div 
                          className="h-3 w-3 rounded-full mr-2"
                          style={{ backgroundColor: getClusterColor(i) }}
                        ></div>
                        Cluster {i + 1}
                      </div>
                    </TableCell>
                    <TableCell>{stats.count}</TableCell>
                    <TableCell>{formatCurrency(stats.meanValue)}</TableCell>
                    <TableCell>{formatCurrency(stats.minValue)}</TableCell>
                    <TableCell>{formatCurrency(stats.maxValue)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          
          <div className="mt-4 text-xs text-gray-500">
            <p>
              <strong>Spatial clustering</strong> groups properties based on similar characteristics 
              while considering geographic proximity.
              {spatialWeight > 0 && ` Spatial weighting of ${spatialWeight.toFixed(1)} was applied to balance attribute similarity with location.`}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default ClusteringMap;