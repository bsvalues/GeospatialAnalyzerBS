import { calculateSimilarityScore, normalizePropertyValue } from '../PropertyScoring';
import { Property } from '../../../shared/schema';

describe('Property Scoring System', () => {
  // Mock property data
  const baseProperty: Partial<Property> = {
    id: 1,
    value: '$300,000',
    yearBuilt: 2000,
    squareFeet: 2000,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'Residential',
    neighborhood: 'Central Benton'
  };

  const similarProperty: Partial<Property> = {
    id: 2,
    value: '$320,000',
    yearBuilt: 2002,
    squareFeet: 1900,
    bedrooms: 3,
    bathrooms: 2,
    propertyType: 'Residential',
    neighborhood: 'Central Benton'
  };

  const differentProperty: Partial<Property> = {
    id: 3,
    value: '$500,000',
    yearBuilt: 2020,
    squareFeet: 3500,
    bedrooms: 5,
    bathrooms: 3,
    propertyType: 'Residential',
    neighborhood: 'North Richland'
  };

  test('normalizePropertyValue extracts numeric values correctly', () => {
    expect(normalizePropertyValue('$300,000')).toBe(300000);
    expect(normalizePropertyValue('$1,234,567')).toBe(1234567);
    expect(normalizePropertyValue('$0')).toBe(0);
    expect(normalizePropertyValue(undefined)).toBe(0);
    expect(normalizePropertyValue(null)).toBe(0);
  });

  test('calculateSimilarityScore returns a value between 0 and 1', () => {
    const weights = {
      value: 0.3,
      yearBuilt: 0.2,
      squareFeet: 0.2,
      bedrooms: 0.1,
      bathrooms: 0.1,
      propertyType: 0.05,
      neighborhood: 0.05
    };

    const score1 = calculateSimilarityScore(baseProperty as Property, similarProperty as Property, weights);
    const score2 = calculateSimilarityScore(baseProperty as Property, differentProperty as Property, weights);

    expect(score1).toBeGreaterThanOrEqual(0);
    expect(score1).toBeLessThanOrEqual(1);
    expect(score2).toBeGreaterThanOrEqual(0);
    expect(score2).toBeLessThanOrEqual(1);
  });

  test('calculateSimilarityScore gives higher score to more similar properties', () => {
    const weights = {
      value: 0.3,
      yearBuilt: 0.2,
      squareFeet: 0.2,
      bedrooms: 0.1,
      bathrooms: 0.1,
      propertyType: 0.05,
      neighborhood: 0.05
    };

    const score1 = calculateSimilarityScore(baseProperty as Property, similarProperty as Property, weights);
    const score2 = calculateSimilarityScore(baseProperty as Property, differentProperty as Property, weights);

    expect(score1).toBeGreaterThan(score2);
    expect(score1).toBeGreaterThan(0.8); // High similarity
    expect(score2).toBeLessThan(0.6); // Lower similarity
  });

  test('calculateSimilarityScore weighs factors according to provided weights', () => {
    // Weights emphasizing value
    const valueWeights = {
      value: 0.6,
      yearBuilt: 0.1,
      squareFeet: 0.1,
      bedrooms: 0.1,
      bathrooms: 0.05,
      propertyType: 0.025,
      neighborhood: 0.025
    };

    // Weights emphasizing physical characteristics
    const physicalWeights = {
      value: 0.1,
      yearBuilt: 0.2,
      squareFeet: 0.3,
      bedrooms: 0.2,
      bathrooms: 0.1,
      propertyType: 0.05,
      neighborhood: 0.05
    };

    const scoreWithValueEmphasis = calculateSimilarityScore(
      baseProperty as Property, 
      differentProperty as Property, 
      valueWeights
    );

    const scoreWithPhysicalEmphasis = calculateSimilarityScore(
      baseProperty as Property, 
      differentProperty as Property, 
      physicalWeights
    );

    // Scores should be different based on the weighting
    expect(scoreWithValueEmphasis).not.toEqual(scoreWithPhysicalEmphasis);
  });

  test('calculateSimilarityScore handles missing properties', () => {
    const weights = {
      value: 0.3,
      yearBuilt: 0.2,
      squareFeet: 0.2,
      bedrooms: 0.1,
      bathrooms: 0.1,
      propertyType: 0.05,
      neighborhood: 0.05
    };

    const incompleteProperty: Partial<Property> = {
      id: 4,
      value: '$310,000',
      // Missing yearBuilt
      squareFeet: 2100,
      // Missing bedrooms
      bathrooms: 2,
      propertyType: 'Residential',
      // Missing neighborhood
    };

    const score = calculateSimilarityScore(
      baseProperty as Property, 
      incompleteProperty as Property, 
      weights
    );

    // Should still calculate a score even with missing properties
    expect(score).toBeGreaterThanOrEqual(0);
    expect(score).toBeLessThanOrEqual(1);
    // Score should be reasonable despite missing data
    expect(score).toBeGreaterThan(0.4);
  });

  test('calculateSimilarityScore returns perfect score for identical properties', () => {
    const weights = {
      value: 0.3,
      yearBuilt: 0.2,
      squareFeet: 0.2,
      bedrooms: 0.1,
      bathrooms: 0.1,
      propertyType: 0.05,
      neighborhood: 0.05
    };

    const score = calculateSimilarityScore(
      baseProperty as Property, 
      baseProperty as Property, 
      weights
    );

    expect(score).toEqual(1);
  });
});