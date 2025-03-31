import { Property } from '../../shared/schema';

/**
 * Weights configuration for property comparison
 * Values should add up to 1
 */
export interface PropertyWeights {
  value: number;
  yearBuilt: number;
  squareFeet: number;
  bedrooms: number;
  bathrooms: number;
  propertyType: number;
  neighborhood: number;
  [key: string]: number;
}

/**
 * Default weights for property comparison
 */
export const DEFAULT_WEIGHTS: PropertyWeights = {
  value: 0.3,
  yearBuilt: 0.2,
  squareFeet: 0.2,
  bedrooms: 0.1,
  bathrooms: 0.1,
  propertyType: 0.05,
  neighborhood: 0.05
};

/**
 * Normalize property value from string to number
 * Handles currency formatting and returns 0 for missing values
 */
export function normalizePropertyValue(value?: string | null): number {
  if (!value) return 0;
  // Remove currency symbols and commas
  return parseFloat(value.replace(/[$,]/g, '')) || 0;
}

/**
 * Calculate similarity score between two properties
 * 
 * @param property1 First property to compare
 * @param property2 Second property to compare
 * @param weights Weights for different property attributes
 * @returns Similarity score from 0 to 1
 */
export function calculateSimilarityScore(
  property1: Property,
  property2: Property,
  weights: PropertyWeights = DEFAULT_WEIGHTS
): number {
  // If comparing the same property, return perfect score
  if (property1.id === property2.id) return 1;
  
  let totalScore = 0;
  let totalWeight = 0;
  
  // Property value comparison
  if (weights.value > 0) {
    const value1 = normalizePropertyValue(property1.value);
    const value2 = normalizePropertyValue(property2.value);
    
    if (value1 > 0 && value2 > 0) {
      const maxValue = Math.max(value1, value2);
      const minValue = Math.min(value1, value2);
      const valueSimilarity = minValue / maxValue; // 0 to 1
      
      totalScore += valueSimilarity * weights.value;
      totalWeight += weights.value;
    }
  }
  
  // Year built comparison
  if (weights.yearBuilt > 0) {
    if (property1.yearBuilt !== null && property2.yearBuilt !== null) {
      // Normalize differences in years 
      // Within 5 years is very similar, beyond 30 years is very different
      const yearDiff = Math.abs(property1.yearBuilt - property2.yearBuilt);
      const yearSimilarity = Math.max(0, 1 - yearDiff / 30);
      
      totalScore += yearSimilarity * weights.yearBuilt;
      totalWeight += weights.yearBuilt;
    }
  }
  
  // Square footage comparison
  if (weights.squareFeet > 0) {
    if (property1.squareFeet !== null && property2.squareFeet !== null) {
      const maxSqFt = Math.max(property1.squareFeet, property2.squareFeet);
      const minSqFt = Math.min(property1.squareFeet, property2.squareFeet);
      const sqFtSimilarity = minSqFt / maxSqFt; // 0 to 1
      
      totalScore += sqFtSimilarity * weights.squareFeet;
      totalWeight += weights.squareFeet;
    }
  }
  
  // Bedrooms comparison
  if (weights.bedrooms > 0) {
    if (property1.bedrooms !== null && property2.bedrooms !== null && 
        property1.bedrooms !== undefined && property2.bedrooms !== undefined) {
      const bedroomDiff = Math.abs((property1.bedrooms || 0) - (property2.bedrooms || 0));
      const bedroomSimilarity = bedroomDiff === 0 ? 1 : 1 - Math.min(bedroomDiff / 3, 1);
      
      totalScore += bedroomSimilarity * weights.bedrooms;
      totalWeight += weights.bedrooms;
    }
  }
  
  // Bathrooms comparison
  if (weights.bathrooms > 0) {
    if (property1.bathrooms !== null && property2.bathrooms !== null && 
        property1.bathrooms !== undefined && property2.bathrooms !== undefined) {
      const bathroomDiff = Math.abs((property1.bathrooms || 0) - (property2.bathrooms || 0));
      const bathroomSimilarity = bathroomDiff === 0 ? 1 : 1 - Math.min(bathroomDiff / 2, 1);
      
      totalScore += bathroomSimilarity * weights.bathrooms;
      totalWeight += weights.bathrooms;
    }
  }
  
  // Property type comparison - exact match only
  if (weights.propertyType > 0) {
    if (property1.propertyType && property2.propertyType) {
      const typeSimilarity = property1.propertyType === property2.propertyType ? 1 : 0;
      
      totalScore += typeSimilarity * weights.propertyType;
      totalWeight += weights.propertyType;
    }
  }
  
  // Neighborhood comparison - exact match only
  if (weights.neighborhood > 0) {
    if (property1.neighborhood && property2.neighborhood) {
      const neighborhoodSimilarity = property1.neighborhood === property2.neighborhood ? 1 : 0;
      
      totalScore += neighborhoodSimilarity * weights.neighborhood;
      totalWeight += weights.neighborhood;
    }
  }
  
  // If no attributes were compared, return 0
  if (totalWeight === 0) return 0;
  
  // Normalize the score based on weights used
  return totalScore / totalWeight;
}

/**
 * Calculate the distance between two coordinates in miles
 * Uses Haversine formula for great-circle distance on a sphere
 */
export function calculateDistance(
  lat1: number,
  lon1: number,
  lat2: number,
  lon2: number
): number {
  const R = 3958.8; // Earth's radius in miles
  
  // Convert to radians
  const lat1Rad = (lat1 * Math.PI) / 180;
  const lon1Rad = (lon1 * Math.PI) / 180;
  const lat2Rad = (lat2 * Math.PI) / 180;
  const lon2Rad = (lon2 * Math.PI) / 180;
  
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