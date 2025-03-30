import { Property } from '@shared/schema';

/**
 * Interface for point coordinates
 */
export interface Point {
  lat: number;
  lng: number;
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

export default {
  calculateDistance,
  isPointWithinRadius,
  isPointInPolygon,
  calculateBoundingBox,
  filterProperties,
  sortProperties,
  performHotspotAnalysis,
  clusterProperties
};