import { Property } from '@shared/schema';
import { haversineDistance } from '../../lib/utils';

/**
 * Weight configuration for similarity calculation
 */
export interface SimilarityWeights {
  location: number;  // Weight for location-related factors
  features: number;  // Weight for property features (bedrooms, bathrooms, etc.)
  size: number;      // Weight for property size-related factors
  age: number;       // Weight for property age and condition
}

/**
 * Default weights for similarity calculation
 */
export const DEFAULT_WEIGHTS: SimilarityWeights = {
  location: 0.4,     // Location is very important for property value
  features: 0.25,    // Features are quite important
  size: 0.25,        // Size is also quite important
  age: 0.1           // Age is less important than other factors
};

/**
 * Maximum distance in kilometers for location similarity
 */
const MAX_DISTANCE = 10;

/**
 * Calculate similarity score between two properties
 * @param baseProperty The reference property
 * @param compareProperty The property to compare with
 * @param weights Optional custom weights for the similarity calculation
 * @returns Similarity score between 0-100, where 100 is identical
 */
export function calculateSimilarityScore(
  baseProperty: Property,
  compareProperty: Property,
  weights: Partial<SimilarityWeights> = {}
): number {
  // Merge provided weights with defaults
  const calculationWeights: SimilarityWeights = {
    ...DEFAULT_WEIGHTS,
    ...weights
  };
  
  // Normalize weights to ensure they sum to 1
  const weightSum = Object.values(calculationWeights).reduce((sum, weight) => sum + weight, 0);
  const normalizedWeights: SimilarityWeights = {
    location: calculationWeights.location / weightSum,
    features: calculationWeights.features / weightSum,
    size: calculationWeights.size / weightSum,
    age: calculationWeights.age / weightSum
  };
  
  // Calculate individual similarity scores
  const locationScore = calculateLocationSimilarity(baseProperty, compareProperty);
  const featureScore = calculateFeatureSimilarity(baseProperty, compareProperty);
  const sizeScore = calculateSizeSimilarity(baseProperty, compareProperty);
  const ageScore = calculateAgeSimilarity(baseProperty, compareProperty);
  
  // Apply weights to each score and sum
  const weightedScore = 
    (locationScore * normalizedWeights.location) +
    (featureScore * normalizedWeights.features) +
    (sizeScore * normalizedWeights.size) +
    (ageScore * normalizedWeights.age);
  
  // Return score rounded to nearest integer
  return Math.round(weightedScore);
}

/**
 * Calculate location similarity between properties
 * @returns Score from 0-100
 */
function calculateLocationSimilarity(baseProperty: Property, compareProperty: Property): number {
  // If either property is missing location data, return minimal score
  if (!baseProperty.latitude || !baseProperty.longitude || 
      !compareProperty.latitude || !compareProperty.longitude) {
    
    // If they're in the same neighborhood, that's at least something
    if (baseProperty.neighborhood && compareProperty.neighborhood && 
        baseProperty.neighborhood === compareProperty.neighborhood) {
      return 50;
    }
    
    return 25; // Minimal location similarity
  }
  
  // Calculate distance between properties in kilometers
  const distance = haversineDistance(
    [baseProperty.latitude, baseProperty.longitude],
    [compareProperty.latitude, compareProperty.longitude]
  );
  
  // Convert distance to similarity score (100 = same location, 0 = MAX_DISTANCE or further)
  let distanceScore = 100 * Math.max(0, 1 - (distance / MAX_DISTANCE));
  
  // Bonus for same neighborhood
  if (baseProperty.neighborhood && compareProperty.neighborhood && 
      baseProperty.neighborhood === compareProperty.neighborhood) {
    distanceScore = Math.min(100, distanceScore + 10);
  }
  
  return distanceScore;
}

/**
 * Calculate feature similarity between properties
 * @returns Score from 0-100
 */
function calculateFeatureSimilarity(baseProperty: Property, compareProperty: Property): number {
  let scores: number[] = [];
  
  // Property type similarity (exact match)
  if (baseProperty.propertyType && compareProperty.propertyType) {
    scores.push(baseProperty.propertyType === compareProperty.propertyType ? 100 : 0);
  }
  
  // Bedroom similarity
  if (baseProperty.bedrooms && compareProperty.bedrooms) {
    const bedroomDiff = Math.abs(baseProperty.bedrooms - compareProperty.bedrooms);
    scores.push(100 * Math.max(0, 1 - (bedroomDiff / 3))); // 3+ bedroom difference = 0 similarity
  }
  
  // Bathroom similarity
  if (baseProperty.bathrooms && compareProperty.bathrooms) {
    const bathroomDiff = Math.abs(baseProperty.bathrooms - compareProperty.bathrooms);
    scores.push(100 * Math.max(0, 1 - (bathroomDiff / 2))); // 2+ bathroom difference = 0 similarity
  }
  
  // Zoning similarity (exact match)
  if (baseProperty.zoning && compareProperty.zoning) {
    scores.push(baseProperty.zoning === compareProperty.zoning ? 100 : 0);
  }
  
  // If we have no scores, return a default middle value
  if (scores.length === 0) {
    return 50;
  }
  
  // Return average of all feature scores
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Calculate size similarity between properties
 * @returns Score from 0-100
 */
function calculateSizeSimilarity(baseProperty: Property, compareProperty: Property): number {
  let scores: number[] = [];
  
  // Square footage similarity
  if (baseProperty.squareFeet && compareProperty.squareFeet) {
    const sqftRatio = Math.min(baseProperty.squareFeet, compareProperty.squareFeet) / 
                      Math.max(baseProperty.squareFeet, compareProperty.squareFeet);
    scores.push(100 * sqftRatio);
  }
  
  // Lot size similarity
  if (baseProperty.lotSize && compareProperty.lotSize) {
    const lotRatio = Math.min(baseProperty.lotSize, compareProperty.lotSize) / 
                     Math.max(baseProperty.lotSize, compareProperty.lotSize);
    scores.push(100 * lotRatio);
  }
  
  // If we have no scores, return a default middle value
  if (scores.length === 0) {
    return 50;
  }
  
  // Return average of all size scores
  return scores.reduce((sum, score) => sum + score, 0) / scores.length;
}

/**
 * Calculate age and condition similarity between properties
 * @returns Score from 0-100
 */
function calculateAgeSimilarity(baseProperty: Property, compareProperty: Property): number {
  // If year built is missing, return middle value
  if (!baseProperty.yearBuilt || !compareProperty.yearBuilt) {
    return 50;
  }
  
  // Calculate age difference
  const ageDiff = Math.abs(baseProperty.yearBuilt - compareProperty.yearBuilt);
  
  // Convert to similarity score (0 difference = 100, 20+ years difference = 0)
  return 100 * Math.max(0, 1 - (ageDiff / 20));
}