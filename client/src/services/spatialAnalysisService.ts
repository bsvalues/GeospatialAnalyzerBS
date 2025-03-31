import { Property } from '@shared/schema';

/**
 * Interface for point coordinates
 */
export interface Point {
  lat: number;
  lng: number;
}

/**
 * Interface for a heatmap data point
 */
export interface HeatmapPoint {
  lat: number;
  lng: number;
  intensity: number;
}

/**
 * Interface for Moran's I statistic result
 */
export interface MoransIResult {
  index: number;
  zScore: number;
  pValue: number;
  pattern: 'clustered' | 'random' | 'dispersed';
}

/**
 * Interface for a property cluster
 */
export interface PropertyCluster {
  properties: Property[];
  centroid: Point;
  averageValue: number;
  radius: number;
}

/**
 * Interface for a spatial regression model
 */
export interface SpatialRegressionResult {
  coefficients: Record<string, number>;
  r2: number;
  adjustedR2: number;
  standardError: number;
  predict: (property: any) => number;
}

/**
 * Interface for an amenity
 */
export interface Amenity {
  id: number;
  name: string;
  type: string;
  latitude: number;
  longitude: number;
}

/**
 * Interface for bounding box coordinates [minLat, minLng, maxLat, maxLng]
 */
export type BoundingBox = [number, number, number, number];

/**
 * Parameters for spatial filtering
 */
export interface SpatialFilterParams {
  centerPoint?: Point;
  radius?: number;
  polygon?: Point[];
  boundingBox?: BoundingBox;
  neighborhood?: string;
  propertyType?: string;
  minValue?: number;
  maxValue?: number;
  minYearBuilt?: number;
  maxYearBuilt?: number;
  minSquareFeet?: number;
  maxSquareFeet?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

/**
 * Interface for hotspot analysis result
 */
export interface HotspotResult {
  property: Property;
  score: number;
  pValue: number;
  isHotspot: boolean;
  isColdspot: boolean;
}

/**
 * Interface for cluster analysis result
 */
export interface ClusterResult {
  properties: Property[];
  clusterId: number;
  clusterCenter: Point;
  avgValue: number;
  minValue: number;
  maxValue: number;
  metrics: Record<string, number>;
}

/**
 * Interface for spatial regression model
 */
export interface SpatialRegressionModel {
  coefficients: Record<string, number>;
  intercept: number;
  rSquared: number;
  adjustedRSquared: number;
  spatialLag: number;
  spatialError: number;
  aic: number;
  observations: number;
}

/**
 * Calculate the distance between two points in kilometers
 * 
 * @param lat1 Latitude of the first point
 * @param lon1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lon2 Longitude of the second point
 * @returns Distance in kilometers
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Check if a point is within a given radius of a center point
 * 
 * @param point The point to check
 * @param center The center point
 * @param radius The radius in kilometers
 * @returns True if the point is within the radius
 */
export function isPointWithinRadius(
  point: Point,
  center: Point,
  radius: number
): boolean {
  const distance = calculateDistance(
    point.lat,
    point.lng,
    center.lat,
    center.lng
  );
  return distance <= radius;
}

/**
 * Check if a point is inside a polygon
 * 
 * @param point The point to check
 * @param polygon Array of polygon vertices
 * @returns True if the point is inside the polygon
 */
export function isPointInPolygon(point: Point, polygon: Point[]): boolean {
  // Ray casting algorithm
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].lat;
    const yi = polygon[i].lng;
    const xj = polygon[j].lat;
    const yj = polygon[j].lng;
    
    const intersect = ((yi > point.lng) !== (yj > point.lng))
        && (point.lat < (xj - xi) * (point.lng - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  
  return inside;
}

/**
 * Calculate the bounding box for a set of properties
 * 
 * @param properties Array of properties
 * @returns Bounding box as [minLat, minLng, maxLat, maxLng]
 */
export function calculateBoundingBox(properties: Property[]): BoundingBox {
  if (!properties.length) {
    return [0, 0, 0, 0];
  }
  
  const validProperties = properties.filter(p => 
    p.latitude !== undefined && p.longitude !== undefined);
  
  if (!validProperties.length) {
    return [0, 0, 0, 0];
  }
  
  let minLat = Number.MAX_VALUE;
  let minLng = Number.MAX_VALUE;
  let maxLat = -Number.MAX_VALUE;
  let maxLng = -Number.MAX_VALUE;
  
  for (const property of validProperties) {
    const lat = property.latitude as number;
    const lng = property.longitude as number;
    
    minLat = Math.min(minLat, lat);
    minLng = Math.min(minLng, lng);
    maxLat = Math.max(maxLat, lat);
    maxLng = Math.max(maxLng, lng);
  }
  
  return [minLat, minLng, maxLat, maxLng];
}

/**
 * Filter properties based on spatial and attribute filters
 * 
 * @param properties Array of properties to filter
 * @param filters Spatial and attribute filter parameters
 * @returns Filtered properties array
 */
export function filterProperties(
  properties: Property[],
  filters: SpatialFilterParams
): Property[] {
  if (!Object.keys(filters).length) {
    return properties;
  }
  
  return properties.filter(property => {
    // Skip properties without coordinates for spatial filters
    const hasCoordinates = property.latitude !== undefined && property.longitude !== undefined;
    
    // Check spatial filters
    if (filters.centerPoint && filters.radius && hasCoordinates) {
      const point = { 
        lat: property.latitude as number, 
        lng: property.longitude as number 
      };
      if (!isPointWithinRadius(point, filters.centerPoint, filters.radius)) {
        return false;
      }
    }
    
    if (filters.polygon && filters.polygon.length >= 3 && hasCoordinates) {
      const point = { 
        lat: property.latitude as number, 
        lng: property.longitude as number 
      };
      if (!isPointInPolygon(point, filters.polygon)) {
        return false;
      }
    }
    
    // Check attribute filters
    if (filters.neighborhood && property.neighborhood !== filters.neighborhood) {
      return false;
    }
    
    if (filters.propertyType && property.propertyType !== filters.propertyType) {
      return false;
    }
    
    if (typeof filters.minValue === 'number') {
      const value = parseFloat(property.value || '0');
      if (value < filters.minValue) {
        return false;
      }
    }
    
    if (typeof filters.maxValue === 'number') {
      const value = parseFloat(property.value || '0');
      if (value > filters.maxValue) {
        return false;
      }
    }
    
    if (typeof filters.minYearBuilt === 'number' && 
        property.yearBuilt !== null && 
        property.yearBuilt < filters.minYearBuilt) {
      return false;
    }
    
    if (typeof filters.maxYearBuilt === 'number' && 
        property.yearBuilt !== null && 
        property.yearBuilt > filters.maxYearBuilt) {
      return false;
    }
    
    if (typeof filters.minSquareFeet === 'number' && 
        property.squareFeet < filters.minSquareFeet) {
      return false;
    }
    
    if (typeof filters.maxSquareFeet === 'number' && 
        property.squareFeet > filters.maxSquareFeet) {
      return false;
    }
    
    return true;
  });
}

/**
 * Sort properties based on sort criteria
 * 
 * @param properties Array of properties to sort
 * @param sortBy Property field to sort by
 * @param sortOrder Sort order ('asc' or 'desc')
 * @returns Sorted properties array
 */
export function sortProperties(
  properties: Property[],
  sortBy?: string,
  sortOrder: 'asc' | 'desc' = 'asc'
): Property[] {
  if (!sortBy) {
    return properties;
  }
  
  return [...properties].sort((a, b) => {
    let valueA, valueB;
    
    switch (sortBy) {
      case 'value':
        valueA = parseFloat(a.value || '0');
        valueB = parseFloat(b.value || '0');
        break;
      case 'yearBuilt':
        valueA = a.yearBuilt || 0;
        valueB = b.yearBuilt || 0;
        break;
      case 'squareFeet':
        valueA = a.squareFeet;
        valueB = b.squareFeet;
        break;
      default:
        return 0;
    }
    
    if (sortOrder === 'asc') {
      return valueA - valueB;
    } else {
      return valueB - valueA;
    }
  });
}

/**
 * Perform hotspot analysis on a set of properties
 * 
 * @param properties Array of properties to analyze
 * @param valueField Property field to use for analysis
 * @param distanceThreshold Distance threshold in kilometers
 * @param significanceLevel Significance level (p-value threshold)
 * @returns Array of hotspot analysis results
 */
export function performHotspotAnalysis(
  properties: Property[],
  valueField: string = 'value',
  distanceThreshold: number = 2,
  significanceLevel: number = 0.05
): HotspotResult[] {
  const validProperties = properties.filter(p => 
    p.latitude !== undefined && p.longitude !== undefined);
    
  if (validProperties.length < 3) {
    return [];
  }
  
  // Extract property values
  const values = validProperties.map(p => {
    let value = 0;
    if (valueField === 'value') {
      value = parseFloat(p.value || '0');
    } else if (valueField === 'squareFeet') {
      value = p.squareFeet;
    } else if (valueField === 'yearBuilt') {
      value = p.yearBuilt || 0;
    }
    return value;
  });
  
  // Calculate global mean and standard deviation
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  // Create weight matrix
  const weights: number[][] = [];
  for (let i = 0; i < validProperties.length; i++) {
    weights[i] = [];
    let totalWeight = 0;
    for (let j = 0; j < validProperties.length; j++) {
      if (i === j) {
        weights[i][j] = 0;
        continue;
      }
      
      const p1 = validProperties[i];
      const p2 = validProperties[j];
      const distance = calculateDistance(
        p1.latitude as number, p1.longitude as number,
        p2.latitude as number, p2.longitude as number
      );
      
      // Binary weight matrix based on distance threshold
      if (distance <= distanceThreshold) {
        weights[i][j] = 1;
        totalWeight += 1;
      } else {
        weights[i][j] = 0;
      }
    }
    
    // Row standardization
    if (totalWeight > 0) {
      for (let j = 0; j < validProperties.length; j++) {
        weights[i][j] /= totalWeight;
      }
    }
  }
  
  // Calculate local Gi* statistic for each property
  const results: HotspotResult[] = [];
  for (let i = 0; i < validProperties.length; i++) {
    let weightedSum = 0;
    for (let j = 0; j < validProperties.length; j++) {
      weightedSum += weights[i][j] * values[j];
    }
    
    // Calculate Gi* statistic
    const Gi = weightedSum / (stdDev * Math.sqrt(validProperties.length));
    
    // Calculate p-value from z-score using normal distribution
    const pValue = 2 * (1 - normalCDF(Math.abs(Gi)));
    
    results.push({
      property: validProperties[i],
      score: Gi,
      pValue: pValue,
      isHotspot: (Gi > 0 && pValue < significanceLevel),
      isColdspot: (Gi < 0 && pValue < significanceLevel)
    });
  }
  
  return results;
}

/**
 * Helper function to calculate the cumulative distribution function of the standard normal distribution
 * 
 * @param z Z-score
 * @returns Probability
 */
function normalCDF(z: number): number {
  // Approximation of normal CDF
  if (z < -8.0) return 0.0;
  if (z > 8.0) return 1.0;
  
  let sum = 0.0;
  let term = z;
  for (let i = 3; sum + term !== sum; i += 2) {
    sum += term;
    term = term * z * z / i;
  }
  
  return 0.5 + sum * Math.exp(-z * z / 2) / Math.sqrt(2 * Math.PI);
}

/**
 * Run K-means clustering on a set of properties
 * 
 * @param properties Array of properties to cluster
 * @param k Number of clusters
 * @param maxIterations Maximum number of iterations
 * @returns Array of cluster analysis results
 */
export function clusterProperties(
  properties: Property[],
  k: number = 5,
  maxIterations: number = 100
): ClusterResult[] {
  const validProperties = properties.filter(p => 
    p.latitude !== undefined && p.longitude !== undefined);
    
  if (validProperties.length < k) {
    return [];
  }
  
  // Extract property coordinates and values
  const points: [number, number, number][] = validProperties.map(p => [
    p.latitude as number,
    p.longitude as number,
    parseFloat(p.value || '0')
  ]);
  
  // Initialize centroids using k-means++ method
  const centroids = kMeansPlusPlusInit(points, k);
  
  // Run k-means algorithm
  let assignments: number[] = [];
  let iteration = 0;
  let changed = true;
  
  while (changed && iteration < maxIterations) {
    // Assign points to nearest centroid
    const newAssignments = points.map(point => {
      let minDistance = Number.MAX_VALUE;
      let closestCentroid = 0;
      
      for (let i = 0; i < centroids.length; i++) {
        const distance = euclideanDistance(
          point[0], point[1],
          centroids[i][0], centroids[i][1]
        );
        
        if (distance < minDistance) {
          minDistance = distance;
          closestCentroid = i;
        }
      }
      
      return closestCentroid;
    });
    
    // Check if assignments changed
    changed = !arraysEqual(assignments, newAssignments);
    assignments = newAssignments;
    
    // Update centroids
    for (let i = 0; i < centroids.length; i++) {
      const clusterPoints = points.filter((_, idx) => assignments[idx] === i);
      
      if (clusterPoints.length > 0) {
        centroids[i] = [
          clusterPoints.reduce((sum, p) => sum + p[0], 0) / clusterPoints.length,
          clusterPoints.reduce((sum, p) => sum + p[1], 0) / clusterPoints.length,
          clusterPoints.reduce((sum, p) => sum + p[2], 0) / clusterPoints.length
        ];
      }
    }
    
    iteration++;
  }
  
  // Prepare result
  const results: ClusterResult[] = [];
  for (let i = 0; i < k; i++) {
    const clusterProperties = validProperties.filter((_, idx) => assignments[idx] === i);
    
    if (clusterProperties.length > 0) {
      const values = clusterProperties.map(p => parseFloat(p.value || '0'));
      const clusterCenter: Point = {
        lat: centroids[i][0],
        lng: centroids[i][1]
      };
      
      results.push({
        properties: clusterProperties,
        clusterId: i,
        clusterCenter: clusterCenter,
        avgValue: values.reduce((sum, val) => sum + val, 0) / values.length,
        minValue: Math.min(...values),
        maxValue: Math.max(...values),
        metrics: {
          count: clusterProperties.length,
          squareFeetAvg: clusterProperties.reduce((sum, p) => sum + p.squareFeet, 0) / clusterProperties.length,
          yearBuiltAvg: clusterProperties.reduce((sum, p) => sum + (p.yearBuilt || 0), 0) / clusterProperties.length
        }
      });
    }
  }
  
  return results;
}

/**
 * Helper function to initialize centroids using k-means++ method
 * 
 * @param points Array of points [lat, lng, value]
 * @param k Number of centroids
 * @returns Array of centroids [lat, lng, value]
 */
function kMeansPlusPlusInit(
  points: [number, number, number][],
  k: number
): [number, number, number][] {
  const centroids: [number, number, number][] = [];
  
  // Choose first centroid randomly
  const firstIdx = Math.floor(Math.random() * points.length);
  centroids.push([...points[firstIdx]]);
  
  // Choose remaining centroids
  for (let i = 1; i < k; i++) {
    // Calculate distances to nearest centroid for each point
    const distances = points.map(point => {
      let minDistance = Number.MAX_VALUE;
      
      for (const centroid of centroids) {
        const distance = euclideanDistance(
          point[0], point[1],
          centroid[0], centroid[1]
        );
        
        minDistance = Math.min(minDistance, distance);
      }
      
      return minDistance;
    });
    
    // Calculate probabilities proportional to squared distances
    const totalDistance = distances.reduce((sum, dist) => sum + Math.pow(dist, 2), 0);
    const probabilities = distances.map(dist => Math.pow(dist, 2) / totalDistance);
    
    // Choose next centroid based on probabilities
    let r = Math.random();
    let cumulativeProbability = 0;
    let selectedIdx = 0;
    
    for (let j = 0; j < probabilities.length; j++) {
      cumulativeProbability += probabilities[j];
      if (r <= cumulativeProbability) {
        selectedIdx = j;
        break;
      }
    }
    
    centroids.push([...points[selectedIdx]]);
  }
  
  return centroids;
}

/**
 * Calculate Euclidean distance between two points
 * 
 * @param lat1 Latitude of the first point
 * @param lng1 Longitude of the first point
 * @param lat2 Latitude of the second point
 * @param lng2 Longitude of the second point
 * @returns Euclidean distance
 */
function euclideanDistance(
  lat1: number,
  lng1: number,
  lat2: number,
  lng2: number
): number {
  return Math.sqrt(Math.pow(lat1 - lat2, 2) + Math.pow(lng1 - lng2, 2));
}

/**
 * Check if two arrays are equal
 * 
 * @param a First array
 * @param b Second array
 * @returns True if arrays are equal
 */
function arraysEqual(a: any[], b: any[]): boolean {
  if (a.length !== b.length) return false;
  for (let i = 0; i < a.length; i++) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}

/**
 * Calculate neighbor weights based on distance between properties
 * 
 * @param properties Array of properties
 * @param maxDistance Maximum distance to consider for neighbors (in km)
 * @returns Object with property IDs as keys and neighbor weights as values
 */
export function getNeighborWeights(
  properties: Property[],
  maxDistance: number = 2
): Record<string, Record<string, number>> {
  const weights: Record<string, Record<string, number>> = {};
  
  // Filter properties with valid coordinates
  const validProperties = properties.filter(p => 
    typeof p.latitude === 'number' && 
    typeof p.longitude === 'number'
  );
  
  if (validProperties.length < 2) {
    throw new Error('At least 2 properties with valid coordinates are required');
  }
  
  // Calculate weights based on inverse distance
  for (const p1 of validProperties) {
    weights[p1.id.toString()] = {};
    let totalWeight = 0;
    
    for (const p2 of validProperties) {
      if (p1.id === p2.id) continue;
      
      const distance = calculateDistance(
        p1.latitude as number, p1.longitude as number,
        p2.latitude as number, p2.longitude as number
      );
      
      // Use inverse distance weighting with cutoff
      if (distance <= maxDistance) {
        // Closer properties have higher weights (inverse distance)
        const weight = 1 / Math.max(distance, 0.01); // Avoid division by zero
        weights[p1.id.toString()][p2.id.toString()] = weight;
        totalWeight += weight;
      }
    }
    
    // Normalize weights to sum to 1
    if (totalWeight > 0) {
      for (const neighborId in weights[p1.id.toString()]) {
        weights[p1.id.toString()][neighborId] /= totalWeight;
      }
    }
  }
  
  return weights;
}

/**
 * Calculate Moran's I spatial autocorrelation statistic
 * 
 * @param properties Array of properties
 * @param attribute Property attribute to analyze
 * @param maxDistance Maximum distance to consider for neighbors (in km)
 * @returns Moran's I result with index, significance, and pattern
 */
export function calculateMoranI(
  properties: Property[],
  attribute: 'value' | 'squareFeet' | 'yearBuilt' = 'value',
  maxDistance: number = 2
): MoransIResult {
  if (properties.length < 3) {
    throw new Error('At least 3 properties are required for Moran\'s I calculation');
  }
  
  // Filter properties with valid coordinates and attribute values
  const validProperties = properties.filter(p => {
    if (typeof p.latitude !== 'number' || typeof p.longitude !== 'number') {
      return false;
    }
    
    if (attribute === 'value') {
      return p.value !== null && p.value !== undefined;
    } else if (attribute === 'squareFeet') {
      return p.squareFeet !== null && p.squareFeet !== undefined;
    } else if (attribute === 'yearBuilt') {
      return p.yearBuilt !== null && p.yearBuilt !== undefined;
    }
    
    return false;
  });
  
  if (validProperties.length < 3) {
    throw new Error('At least 3 properties with valid coordinates and attribute values are required');
  }
  
  // Extract attribute values
  const values: number[] = validProperties.map(p => {
    if (attribute === 'value') {
      return parseFloat(p.value || '0');
    } else if (attribute === 'squareFeet') {
      return p.squareFeet;
    } else if (attribute === 'yearBuilt') {
      return p.yearBuilt || 0;
    }
    return 0;
  });
  
  // Calculate mean
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  
  // Center the values by subtracting the mean
  const centeredValues = values.map(val => val - mean);
  
  // Get neighbor weights
  const weights = getNeighborWeights(validProperties, maxDistance);
  
  // Calculate Moran's I
  let numerator = 0;
  let denominator = 0;
  let weightSum = 0;
  
  // Calculate numerator
  for (let i = 0; i < validProperties.length; i++) {
    const id1 = validProperties[i].id.toString();
    
    for (let j = 0; j < validProperties.length; j++) {
      if (i === j) continue;
      
      const id2 = validProperties[j].id.toString();
      const weight = weights[id1]?.[id2] || 0;
      
      if (weight > 0) {
        numerator += weight * centeredValues[i] * centeredValues[j];
        weightSum += weight;
      }
    }
    
    // Calculate denominator (sum of squared deviations)
    denominator += centeredValues[i] * centeredValues[i];
  }
  
  // Calculate final Moran's I statistic
  const n = validProperties.length;
  const I = (n / weightSum) * (numerator / denominator);
  
  // Calculate expected value E(I) under the null hypothesis
  const EI = -1 / (n - 1);
  
  // Calculate variance of I
  let s1 = 0;
  let s2 = 0;
  
  // First moment
  for (const id1 in weights) {
    let rowSum = 0;
    let rowSumSquared = 0;
    
    for (const id2 in weights[id1]) {
      const weight = weights[id1][id2];
      rowSum += weight;
      rowSumSquared += weight * weight;
    }
    
    s1 += (rowSum + rowSum) * rowSum;
    s2 += rowSum * rowSum;
  }
  
  const s0 = weightSum;
  s1 /= 2; // correct for double counting
  
  // Calculate variance
  const k = (centeredValues.reduce((sum, val) => sum + Math.pow(val, 4), 0) / n) / 
            Math.pow(denominator / n, 2);
  
  const varI = (n * ((n*n - 3*n + 3)*s1 - n*s2 + 3*s0*s0) - 
                k * (n*n - n)*s1 - 2*n*s0*s0) / 
               ((n-1)*(n-2)*(n-3)*s0*s0);
  
  // Calculate z-score and p-value
  const zScore = (I - EI) / Math.sqrt(varI);
  const pValue = 2 * (1 - normalCDF(Math.abs(zScore)));
  
  // Determine spatial pattern
  let pattern: 'clustered' | 'random' | 'dispersed' = 'random';
  if (pValue < 0.05) {
    pattern = I > EI ? 'clustered' : 'dispersed';
  }
  
  return {
    index: I,
    zScore,
    pValue,
    pattern
  };
}

/**
 * Generate heatmap data points from property values
 * 
 * @param properties Array of properties
 * @param attribute Property attribute to use for intensity
 * @returns Array of heatmap points with lat, lng, and intensity
 */
export function generateHeatmapData(
  properties: Property[],
  attribute: 'value' | 'squareFeet' | 'yearBuilt' = 'value'
): HeatmapPoint[] {
  // Filter properties with valid coordinates
  const validProperties = properties.filter(p => 
    typeof p.latitude === 'number' && 
    typeof p.longitude === 'number'
  );
  
  if (validProperties.length === 0) {
    return [];
  }
  
  // Extract attribute values
  const values: number[] = validProperties.map(p => {
    if (attribute === 'value') {
      return parseFloat(p.value || '0');
    } else if (attribute === 'squareFeet') {
      return p.squareFeet;
    } else if (attribute === 'yearBuilt') {
      return p.yearBuilt || 0;
    }
    return 0;
  });
  
  // Find min and max values for normalization
  const minValue = Math.min(...values);
  const maxValue = Math.max(...values);
  const valueRange = maxValue - minValue;
  
  // Create heatmap points with normalized intensity
  return validProperties.map((property, index) => {
    // Normalize intensity to range [0, 1]
    const normalizedIntensity = valueRange === 0 
      ? 0.5 // If all properties have the same value
      : (values[index] - minValue) / valueRange;
    
    return {
      lat: property.latitude as number,
      lng: property.longitude as number,
      intensity: normalizedIntensity
    };
  });
}

/**
 * Identify clusters of similar properties
 * 
 * @param properties Array of properties
 * @param attribute Property attribute to use for clustering
 * @param distanceThreshold Distance threshold for cluster formation (in degrees)
 * @returns Array of property clusters
 */
export function identifyPropertyClusters(
  properties: Property[],
  attribute: 'value' | 'squareFeet' | 'yearBuilt' = 'value',
  distanceThreshold: number = 0.1
): PropertyCluster[] {
  // Filter properties with valid coordinates
  const validProperties = properties.filter(p => 
    typeof p.latitude === 'number' && 
    typeof p.longitude === 'number'
  );
  
  if (validProperties.length === 0) {
    return [];
  }
  
  // Initialize clusters (each property starts in its own cluster)
  const clusters: PropertyCluster[] = validProperties.map(property => {
    const value = attribute === 'value' 
      ? parseFloat(property.value || '0')
      : attribute === 'squareFeet'
        ? property.squareFeet
        : property.yearBuilt || 0;
    
    return {
      properties: [property],
      centroid: {
        lat: property.latitude as number,
        lng: property.longitude as number
      },
      averageValue: value,
      radius: 0
    };
  });
  
  // Hierarchical clustering - merge clusters that are close to each other
  let merged = true;
  while (merged) {
    merged = false;
    
    for (let i = 0; i < clusters.length; i++) {
      if (merged) break; // Start over if a merge occurred
      
      for (let j = i + 1; j < clusters.length; j++) {
        // Calculate distance between cluster centroids
        const distance = calculateDistance(
          clusters[i].centroid.lat, clusters[i].centroid.lng,
          clusters[j].centroid.lat, clusters[j].centroid.lng
        );
        
        // Merge clusters if they are close enough
        if (distance <= distanceThreshold) {
          // Combine properties from both clusters
          const combinedProperties = [
            ...clusters[i].properties,
            ...clusters[j].properties
          ];
          
          // Calculate new centroid
          const newCentroid = {
            lat: combinedProperties.reduce((sum, p) => sum + (p.latitude as number), 0) / combinedProperties.length,
            lng: combinedProperties.reduce((sum, p) => sum + (p.longitude as number), 0) / combinedProperties.length
          };
          
          // Calculate new average value
          const newAvgValue = combinedProperties.reduce((sum, p) => {
            const value = attribute === 'value' 
              ? parseFloat(p.value || '0')
              : attribute === 'squareFeet'
                ? p.squareFeet
                : p.yearBuilt || 0;
            return sum + value;
          }, 0) / combinedProperties.length;
          
          // Calculate maximum distance from centroid to any point (radius)
          const radius = Math.max(
            ...combinedProperties.map(p => 
              calculateDistance(
                newCentroid.lat, newCentroid.lng,
                p.latitude as number, p.longitude as number
              )
            )
          );
          
          // Create merged cluster
          clusters[i] = {
            properties: combinedProperties,
            centroid: newCentroid,
            averageValue: newAvgValue,
            radius
          };
          
          // Remove the second cluster
          clusters.splice(j, 1);
          
          merged = true;
          break;
        }
      }
    }
  }
  
  return clusters;
}

/**
 * Generate a spatial regression model to predict property values
 * 
 * @param properties Array of properties to use for model training
 * @param amenities Array of amenities to consider as factors
 * @returns Spatial regression model with coefficients and prediction function
 */
export function generateSpatialRegressionModel(
  properties: Property[],
  amenities: Amenity[]
): SpatialRegressionResult {
  // Filter properties with valid coordinates and values
  const validProperties = properties.filter(p => 
    typeof p.latitude === 'number' && 
    typeof p.longitude === 'number' &&
    p.value !== null && p.value !== undefined
  );
  
  if (validProperties.length < 10) {
    throw new Error('At least 10 properties with valid coordinates and values are required');
  }
  
  // Prepare input variables
  interface RegressionObservation {
    y: number; // Dependent variable (property value)
    squareFeet: number;
    yearBuilt: number;
    distanceToPark?: number;
    distanceToSchool?: number;
    distanceToShopping?: number;
    neighborhoodFactor?: number;
    [key: string]: number | undefined;
  }
  
  // Generate observations with property characteristics and distances to amenities
  const observations: RegressionObservation[] = validProperties.map(property => {
    const observation: RegressionObservation = {
      y: parseFloat(property.value || '0'),
      squareFeet: property.squareFeet,
      yearBuilt: property.yearBuilt || 0,
    };
    
    // Calculate distances to different types of amenities
    const parkAmenities = amenities.filter(a => a.type === 'park');
    const schoolAmenities = amenities.filter(a => a.type === 'school');
    const shoppingAmenities = amenities.filter(a => a.type === 'shopping');
    
    if (parkAmenities.length > 0) {
      observation.distanceToPark = Math.min(
        ...parkAmenities.map(a => 
          calculateDistance(
            property.latitude as number, property.longitude as number,
            a.latitude, a.longitude
          )
        )
      );
    }
    
    if (schoolAmenities.length > 0) {
      observation.distanceToSchool = Math.min(
        ...schoolAmenities.map(a => 
          calculateDistance(
            property.latitude as number, property.longitude as number,
            a.latitude, a.longitude
          )
        )
      );
    }
    
    if (shoppingAmenities.length > 0) {
      observation.distanceToShopping = Math.min(
        ...shoppingAmenities.map(a => 
          calculateDistance(
            property.latitude as number, property.longitude as number,
            a.latitude, a.longitude
          )
        )
      );
    }
    
    // Add neighborhood factor (if available)
    if (property.neighborhood) {
      // Calculate average value in the neighborhood
      const neighborhoodProperties = validProperties.filter(p => 
        p.neighborhood === property.neighborhood
      );
      
      if (neighborhoodProperties.length > 1) {
        const avgNeighborhoodValue = neighborhoodProperties.reduce(
          (sum, p) => sum + parseFloat(p.value || '0'), 0
        ) / neighborhoodProperties.length;
        
        observation.neighborhoodFactor = avgNeighborhoodValue;
      }
    }
    
    return observation;
  });
  
  // Simple multiple linear regression (ordinary least squares)
  // First, get a list of all variables
  const variables = Object.keys(observations[0]).filter(key => key !== 'y');
  
  // Calculate means
  const means: Record<string, number> = { y: 0 };
  variables.forEach(variable => {
    means[variable] = 0;
  });
  
  // Sum values for each variable
  observations.forEach(obs => {
    means.y += obs.y;
    
    variables.forEach(variable => {
      if (obs[variable] !== undefined) {
        means[variable] += obs[variable] as number;
      }
    });
  });
  
  // Divide by number of observations to get means
  const n = observations.length;
  
  means.y /= n;
  variables.forEach(variable => {
    means[variable] /= n;
  });
  
  // Calculate coefficient matrix
  const coefficients: Record<string, number> = {};
  
  // Calculate covariance and variance for each variable
  variables.forEach(variable => {
    let covariance = 0;
    let variance = 0;
    
    observations.forEach(obs => {
      if (obs[variable] !== undefined) {
        const x = obs[variable] as number;
        covariance += (obs.y - means.y) * (x - means[variable]);
        variance += Math.pow(x - means[variable], 2);
      }
    });
    
    // Calculate coefficient
    if (variance !== 0) {
      coefficients[variable] = covariance / variance;
    } else {
      coefficients[variable] = 0;
    }
  });
  
  // Calculate intercept
  const intercept = means.y - variables.reduce(
    (sum, variable) => sum + coefficients[variable] * means[variable], 0
  );
  
  // Calculate predicted values and residuals
  const predictions = observations.map(obs => {
    let predicted = intercept;
    
    variables.forEach(variable => {
      if (obs[variable] !== undefined) {
        predicted += coefficients[variable] * (obs[variable] as number);
      }
    });
    
    return predicted;
  });
  
  const residuals = observations.map((obs, i) => obs.y - predictions[i]);
  
  // Calculate R-squared
  const sst = observations.reduce((sum, obs) => sum + Math.pow(obs.y - means.y, 2), 0);
  const sse = residuals.reduce((sum, residual) => sum + Math.pow(residual, 2), 0);
  const r2 = 1 - (sse / sst);
  
  // Calculate adjusted R-squared
  const k = variables.length;
  const adjustedR2 = 1 - ((1 - r2) * (n - 1) / (n - k - 1));
  
  // Calculate standard error
  const standardError = Math.sqrt(sse / (n - k - 1));
  
  // Create prediction function
  const predict = (property: {
    squareFeet?: number;
    yearBuilt?: number;
    latitude?: number;
    longitude?: number;
    neighborhood?: string;
  }) => {
    let predicted = intercept;
    
    if (property.squareFeet !== undefined && coefficients.squareFeet !== undefined) {
      predicted += coefficients.squareFeet * property.squareFeet;
    }
    
    if (property.yearBuilt !== undefined && coefficients.yearBuilt !== undefined) {
      predicted += coefficients.yearBuilt * property.yearBuilt;
    }
    
    if (property.latitude !== undefined && property.longitude !== undefined) {
      // Calculate distances to amenities
      if (coefficients.distanceToPark !== undefined && amenities.some(a => a.type === 'park')) {
        const distanceToPark = Math.min(
          ...amenities.filter(a => a.type === 'park').map(a => 
            calculateDistance(
              property.latitude as number, property.longitude as number,
              a.latitude, a.longitude
            )
          )
        );
        predicted += coefficients.distanceToPark * distanceToPark;
      }
      
      if (coefficients.distanceToSchool !== undefined && amenities.some(a => a.type === 'school')) {
        const distanceToSchool = Math.min(
          ...amenities.filter(a => a.type === 'school').map(a => 
            calculateDistance(
              property.latitude as number, property.longitude as number,
              a.latitude, a.longitude
            )
          )
        );
        predicted += coefficients.distanceToSchool * distanceToSchool;
      }
      
      if (coefficients.distanceToShopping !== undefined && amenities.some(a => a.type === 'shopping')) {
        const distanceToShopping = Math.min(
          ...amenities.filter(a => a.type === 'shopping').map(a => 
            calculateDistance(
              property.latitude as number, property.longitude as number,
              a.latitude, a.longitude
            )
          )
        );
        predicted += coefficients.distanceToShopping * distanceToShopping;
      }
    }
    
    if (property.neighborhood !== undefined && coefficients.neighborhoodFactor !== undefined) {
      // Find average value for the neighborhood
      const neighborhoodProperties = validProperties.filter(p => 
        p.neighborhood === property.neighborhood
      );
      
      if (neighborhoodProperties.length > 0) {
        const avgNeighborhoodValue = neighborhoodProperties.reduce(
          (sum, p) => sum + parseFloat(p.value || '0'), 0
        ) / neighborhoodProperties.length;
        
        predicted += coefficients.neighborhoodFactor * avgNeighborhoodValue;
      }
    }
    
    return predicted;
  };
  
  return {
    coefficients,
    r2,
    adjustedR2,
    standardError,
    predict
  };
}

export default {
  calculateDistance,
  isPointWithinRadius,
  isPointInPolygon,
  calculateBoundingBox,
  filterProperties,
  sortProperties,
  performHotspotAnalysis,
  clusterProperties,
  getNeighborWeights,
  calculateMoranI,
  generateHeatmapData,
  identifyPropertyClusters,
  generateSpatialRegressionModel
};