import { Property } from '@/shared/types';

/**
 * Configuration for property similarity calculation
 */
export interface PropertySimilarityConfig {
  // Weights for each factor, should sum to 100
  weights: {
    squareFeet: number;
    yearBuilt: number;
    value: number;
    landValue: number;
    location: number;
  };
  
  // Thresholds for determining similarity
  thresholds: {
    squareFeet: { min: number; max: number }; // Percent range (e.g., 0.8-1.2 for ±20%)
    yearBuilt: { min: number; max: number };  // Absolute range (e.g., -10 to +10 years)
    value: { min: number; max: number };      // Percent range
    landValue: { min: number; max: number };  // Percent range
    location: number;                        // Distance in miles
  };
}

/**
 * Result of a property similarity calculation
 */
export interface SimilarityScore {
  total: number;  // Overall similarity score from 0-100
  components: {   // Individual factor scores
    squareFeet?: number;
    yearBuilt?: number;
    value?: number;
    landValue?: number;
    location?: number;
    [key: string]: number | undefined;
  };
}

/**
 * Default configuration for property similarity
 */
export const DEFAULT_SIMILARITY_CONFIG: PropertySimilarityConfig = {
  weights: {
    squareFeet: 25,
    yearBuilt: 20,
    value: 20,
    landValue: 15,
    location: 20
  },
  thresholds: {
    squareFeet: { min: 0.8, max: 1.2 }, // ±20%
    yearBuilt: { min: -10, max: 10 },   // ±10 years
    value: { min: 0.8, max: 1.2 },      // ±20%
    landValue: { min: 0.7, max: 1.3 },  // ±30%
    location: 5                         // 5 miles
  }
};

/**
 * Calculate the similarity between two properties
 * 
 * @param reference The reference property to compare against
 * @param compare The property to compare
 * @param config Configuration for similarity calculation
 * @returns A similarity score from 0-100, with component breakdown
 */
export function calculatePropertySimilarity(
  reference: Property,
  compare: Property,
  config: PropertySimilarityConfig = DEFAULT_SIMILARITY_CONFIG
): SimilarityScore {
  const components: SimilarityScore['components'] = {};
  let totalWeight = 0;
  
  // Square Footage comparison
  if (reference.squareFeet && compare.squareFeet) {
    const ratio = compare.squareFeet / reference.squareFeet;
    components.squareFeet = calculateScoreFromRatio(
      ratio,
      config.thresholds.squareFeet.min, 
      config.thresholds.squareFeet.max,
      config.weights.squareFeet
    );
    totalWeight += config.weights.squareFeet;
  } else {
    components.squareFeet = 0;
  }
  
  // Year Built comparison
  if (reference.yearBuilt !== undefined && compare.yearBuilt !== undefined) {
    const difference = compare.yearBuilt - reference.yearBuilt;
    components.yearBuilt = calculateScoreFromDifference(
      difference,
      config.thresholds.yearBuilt.min,
      config.thresholds.yearBuilt.max,
      config.weights.yearBuilt
    );
    totalWeight += config.weights.yearBuilt;
  } else {
    components.yearBuilt = 0;
  }
  
  // Value comparison
  if (reference.value && compare.value) {
    const refValue = parseNumericValue(reference.value);
    const compValue = parseNumericValue(compare.value);
    
    if (!isNaN(refValue) && !isNaN(compValue) && refValue > 0) {
      const ratio = compValue / refValue;
      components.value = calculateScoreFromRatio(
        ratio,
        config.thresholds.value.min,
        config.thresholds.value.max,
        config.weights.value
      );
      totalWeight += config.weights.value;
    } else {
      components.value = 0;
    }
  } else {
    components.value = 0;
  }
  
  // Land Value comparison
  if (reference.landValue && compare.landValue) {
    const refLandValue = parseNumericValue(reference.landValue);
    const compLandValue = parseNumericValue(compare.landValue);
    
    if (!isNaN(refLandValue) && !isNaN(compLandValue) && refLandValue > 0) {
      const ratio = compLandValue / refLandValue;
      components.landValue = calculateScoreFromRatio(
        ratio,
        config.thresholds.landValue.min,
        config.thresholds.landValue.max,
        config.weights.landValue
      );
      totalWeight += config.weights.landValue;
    } else {
      components.landValue = 0;
    }
  } else {
    components.landValue = 0;
  }
  
  // Location comparison
  if (reference.coordinates && compare.coordinates) {
    const distance = calculateDistance(
      reference.coordinates[0], reference.coordinates[1],
      compare.coordinates[0], compare.coordinates[1]
    );
    
    components.location = calculateScoreFromDistance(
      distance,
      config.thresholds.location,
      config.weights.location
    );
    totalWeight += config.weights.location;
  } else {
    components.location = 0;
  }
  
  // If we don't have any valid properties to compare (very unlikely), return zero
  if (totalWeight === 0) {
    return { total: 0, components };
  }
  
  // Calculate total score based on weighted components and normalize to 100 scale
  const weightedSum = Object.values(components).reduce((acc: number, score) => acc + (score || 0), 0);
  const total = Math.round((weightedSum / totalWeight) * 100);
  
  return { total, components };
}

/**
 * Calculate a score based on the ratio between two values
 */
function calculateScoreFromRatio(
  ratio: number,
  minThreshold: number,
  maxThreshold: number,
  maxScore: number
): number {
  // If ratio is within thresholds, assign full score
  if (ratio >= minThreshold && ratio <= maxThreshold) {
    return maxScore;
  }
  
  // Calculate how far outside thresholds the ratio is
  let distanceFromThreshold;
  if (ratio < minThreshold) {
    distanceFromThreshold = (minThreshold - ratio) / minThreshold;
  } else {
    distanceFromThreshold = (ratio - maxThreshold) / maxThreshold;
  }
  
  // Convert to a score that decreases as distance from threshold increases
  // Use a sigmoid-like curve to taper off gradually
  const scoreReduction = Math.min(distanceFromThreshold * 2, 1);
  return Math.round(maxScore * (1 - scoreReduction));
}

/**
 * Calculate score based on absolute difference between values
 */
function calculateScoreFromDifference(
  difference: number,
  minThreshold: number,
  maxThreshold: number,
  maxScore: number
): number {
  // If difference is within thresholds, assign full score
  if (difference >= minThreshold && difference <= maxThreshold) {
    return maxScore;
  }
  
  // Calculate how far outside thresholds the difference is
  let distanceFromThreshold;
  if (difference < minThreshold) {
    distanceFromThreshold = (minThreshold - difference) / Math.abs(minThreshold);
  } else {
    distanceFromThreshold = (difference - maxThreshold) / Math.abs(maxThreshold);
  }
  
  // Convert to a score that decreases as distance from threshold increases
  const scoreReduction = Math.min(distanceFromThreshold, 1);
  return Math.round(maxScore * (1 - scoreReduction));
}

/**
 * Calculate a score based on distance between properties
 */
function calculateScoreFromDistance(
  distanceMiles: number,
  thresholdMiles: number,
  maxScore: number
): number {
  // If within threshold, assign full points
  if (distanceMiles <= thresholdMiles) {
    return maxScore;
  }
  
  // Calculate score reduction based on how far outside threshold
  const distanceRatio = distanceMiles / thresholdMiles;
  const scoreReduction = Math.min((distanceRatio - 1) / 2, 1);
  return Math.round(maxScore * (1 - scoreReduction));
}

/**
 * Calculate the distance between two coordinates in miles
 * Uses Haversine formula for great-circle distance on a sphere
 */
function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  
  // Convert to radians
  const lat1Rad = toRadians(lat1);
  const lon1Rad = toRadians(lon1);
  const lat2Rad = toRadians(lat2);
  const lon2Rad = toRadians(lon2);
  
  // Differences
  const dLat = lat2Rad - lat1Rad;
  const dLon = lon2Rad - lon1Rad;
  
  // Haversine formula
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1Rad) * Math.cos(lat2Rad) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

/**
 * Convert degrees to radians
 */
function toRadians(degrees: number): number {
  return degrees * (Math.PI / 180);
}

/**
 * Parse a numeric value from a string, handling currency formatting
 */
function parseNumericValue(value: string): number {
  if (!value) return NaN;
  return parseFloat(value.replace(/[$,]/g, ''));
}