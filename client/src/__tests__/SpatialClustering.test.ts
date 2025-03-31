import { Property } from '@/shared/schema';
import { performSpatialClustering, ClusteringResult } from '../services/spatialAnalysisService';

// Mock property data with geographic distribution
const mockProperties: Property[] = [
  // Cluster 1 - Downtown
  {
    id: 1,
    parcelId: "DT1",
    address: "123 Main St",
    latitude: 40.7128,
    longitude: -74.006,
    value: "500000",
    neighborhood: "Downtown",
    propertyType: "Residential"
  },
  {
    id: 2,
    parcelId: "DT2",
    address: "124 Main St",
    latitude: 40.7129,
    longitude: -74.0061,
    value: "520000",
    neighborhood: "Downtown",
    propertyType: "Residential"
  },
  {
    id: 3,
    parcelId: "DT3",
    address: "125 Main St",
    latitude: 40.713,
    longitude: -74.0062,
    value: "490000",
    neighborhood: "Downtown",
    propertyType: "Residential"
  },
  
  // Cluster 2 - Uptown
  {
    id: 4,
    parcelId: "UT1",
    address: "456 Oak St",
    latitude: 40.8128,
    longitude: -74.106,
    value: "800000",
    neighborhood: "Uptown",
    propertyType: "Residential"
  },
  {
    id: 5,
    parcelId: "UT2",
    address: "457 Oak St",
    latitude: 40.8129,
    longitude: -74.1061,
    value: "820000",
    neighborhood: "Uptown",
    propertyType: "Residential"
  },
  
  // Cluster 3 - Industrial Area
  {
    id: 6,
    parcelId: "IN1",
    address: "789 Industry Way",
    latitude: 40.6128,
    longitude: -74.206,
    value: "1200000",
    neighborhood: "Industrial",
    propertyType: "Commercial"
  },
  {
    id: 7,
    parcelId: "IN2",
    address: "790 Industry Way",
    latitude: 40.6129,
    longitude: -74.2061,
    value: "1250000",
    neighborhood: "Industrial",
    propertyType: "Commercial"
  }
];

// Mock for properties with missing coordinates
const mockPropertiesWithMissing: Property[] = [
  ...mockProperties,
  {
    id: 8,
    parcelId: "NOCOORD",
    address: "999 Unknown St",
    value: "400000",
    neighborhood: "Unknown",
    propertyType: "Residential"
  }
];

describe('Spatial Clustering Service', () => {
  test('should cluster properties by location and value', () => {
    // Execute clustering with 3 clusters
    const result = performSpatialClustering(mockProperties, {
      numberOfClusters: 3,
      attributes: ['location', 'value']
    });
    
    // Verify we got the expected number of clusters
    expect(result.clusters.length).toBe(3);
    
    // Verify each property is assigned to a cluster
    expect(result.propertyClusterMap.size).toBe(mockProperties.length);
    
    // Verify Downtown properties are in the same cluster
    const downtown1ClusterId = result.propertyClusterMap.get(1);
    const downtown2ClusterId = result.propertyClusterMap.get(2);
    const downtown3ClusterId = result.propertyClusterMap.get(3);
    
    expect(downtown1ClusterId).toBeDefined();
    expect(downtown2ClusterId).toBe(downtown1ClusterId);
    expect(downtown3ClusterId).toBe(downtown1ClusterId);
    
    // Verify Uptown properties are in the same cluster
    const uptown1ClusterId = result.propertyClusterMap.get(4);
    const uptown2ClusterId = result.propertyClusterMap.get(5);
    
    expect(uptown1ClusterId).toBeDefined();
    expect(uptown2ClusterId).toBe(uptown1ClusterId);
    
    // Verify Industrial properties are in the same cluster
    const industrial1ClusterId = result.propertyClusterMap.get(6);
    const industrial2ClusterId = result.propertyClusterMap.get(7);
    
    expect(industrial1ClusterId).toBeDefined();
    expect(industrial2ClusterId).toBe(industrial1ClusterId);
    
    // Verify Downtown and Uptown are in different clusters
    expect(downtown1ClusterId).not.toBe(uptown1ClusterId);
    
    // Verify cluster statistics are calculated
    for (const cluster of result.clusters) {
      expect(cluster.propertyCount).toBeGreaterThan(0);
      expect(cluster.averageValue).toBeGreaterThan(0);
      expect(cluster.valueRange).toBeDefined();
      expect(cluster.centroid).toBeDefined();
    }
  });
  
  test('should handle edge case of insufficient data points', () => {
    // Try to create more clusters than data points
    const result = performSpatialClustering(mockProperties.slice(0, 2), {
      numberOfClusters: 5,
      attributes: ['location', 'value']
    });
    
    // Should adjust to create only 2 clusters
    expect(result.clusters.length).toBe(2);
    
    // Each property should be in its own cluster
    expect(result.propertyClusterMap.get(1)).not.toBe(result.propertyClusterMap.get(2));
  });
  
  test('should recalculate clusters when parameters change', () => {
    // Initial clustering with 3 clusters
    const initialResult = performSpatialClustering(mockProperties, {
      numberOfClusters: 3,
      attributes: ['location', 'value']
    });
    
    // Recalculate with 2 clusters
    const updatedResult = performSpatialClustering(mockProperties, {
      numberOfClusters: 2,
      attributes: ['location', 'value']
    });
    
    // Verify the number of clusters changed
    expect(initialResult.clusters.length).toBe(3);
    expect(updatedResult.clusters.length).toBe(2);
    
    // Verify cluster assignments changed
    expect(initialResult.propertyClusterMap).not.toEqual(updatedResult.propertyClusterMap);
  });
  
  test('should cluster by different attributes when specified', () => {
    // Cluster by location only
    const locationOnlyResult = performSpatialClustering(mockProperties, {
      numberOfClusters: 3,
      attributes: ['location']
    });
    
    // Cluster by property type only
    const propertyTypeResult = performSpatialClustering(mockProperties, {
      numberOfClusters: 2,
      attributes: ['propertyType']
    });
    
    // Verify property type clustering resulted in 2 clusters (Residential and Commercial)
    expect(propertyTypeResult.clusters.length).toBe(2);
    
    // Residential properties should be in one cluster, Commercial in another
    const residentialIds = [1, 2, 3, 4, 5];
    const commercialIds = [6, 7];
    
    const residentialClusterId = propertyTypeResult.propertyClusterMap.get(1);
    const commercialClusterId = propertyTypeResult.propertyClusterMap.get(6);
    
    for (const id of residentialIds) {
      expect(propertyTypeResult.propertyClusterMap.get(id)).toBe(residentialClusterId);
    }
    
    for (const id of commercialIds) {
      expect(propertyTypeResult.propertyClusterMap.get(id)).toBe(commercialClusterId);
    }
    
    // The results should be different when clustering by different attributes
    expect(locationOnlyResult.propertyClusterMap).not.toEqual(propertyTypeResult.propertyClusterMap);
  });
  
  test('should provide meaningful statistics for each cluster', () => {
    const result = performSpatialClustering(mockProperties, {
      numberOfClusters: 3,
      attributes: ['location', 'value']
    });
    
    // Get the cluster containing Downtown properties
    const downtownClusterId = result.propertyClusterMap.get(1);
    const downtownCluster = result.clusters.find(c => c.id === downtownClusterId);
    
    expect(downtownCluster).toBeDefined();
    if (downtownCluster) {
      // Verify statistics
      expect(downtownCluster.propertyCount).toBe(3);
      expect(downtownCluster.averageValue).toBeCloseTo(503333.33, 0); // Average of 500k, 520k, 490k
      expect(downtownCluster.dominantPropertyType).toBe('Residential');
      expect(downtownCluster.dominantNeighborhood).toBe('Downtown');
      
      // Verify centroid is in the middle of the Downtown properties
      expect(downtownCluster.centroid?.latitude).toBeCloseTo(40.7129, 4);
      expect(downtownCluster.centroid?.longitude).toBeCloseTo(-74.0061, 4);
    }
  });
  
  test('should handle properties with missing coordinate data', () => {
    // Call with properties that have missing coordinates
    const result = performSpatialClustering(mockPropertiesWithMissing, {
      numberOfClusters: 3,
      attributes: ['location', 'value']
    });
    
    // Verify only properties with coordinates are included
    expect(result.propertyClusterMap.size).toBe(mockProperties.length);
    
    // Verify property with missing coordinates is not assigned to a cluster
    expect(result.propertyClusterMap.has(8)).toBe(false);
    
    // Verify we get appropriate metadata about excluded properties
    expect(result.metadata.excludedProperties).toBe(1);
    expect(result.metadata.totalProperties).toBe(mockPropertiesWithMissing.length);
    expect(result.metadata.includedProperties).toBe(mockProperties.length);
  });
});