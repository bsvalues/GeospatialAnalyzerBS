import { calculatePropertySimilarity, PropertySimilarityConfig } from '../PropertyScoring';
import { Property } from '@/shared/types';

describe('Property Scoring Algorithm', () => {
  // Test properties
  const referenceProperty: Property = {
    id: 'ref-prop',
    parcelId: 'APN12345',
    address: '123 Main St',
    squareFeet: 2000,
    yearBuilt: 2010,
    value: '$300,000',
    salePrice: '$290,000',
    landValue: '$100,000',
    coordinates: [46.2, -119.1]
  };

  const identicalProperty: Property = {
    ...referenceProperty,
    id: 'identical-prop',
    parcelId: 'APN12346'
  };

  const similarProperty: Property = {
    id: 'similar-prop',
    parcelId: 'APN12347',
    address: '125 Main St',
    squareFeet: 2100, // 5% different
    yearBuilt: 2012, // 2 years different
    value: '$315,000', // 5% different
    salePrice: '$305,000', // ~5% different
    landValue: '$105,000', // 5% different
    coordinates: [46.201, -119.101] // very close distance
  };

  const differentProperty: Property = {
    id: 'different-prop',
    parcelId: 'APN12348',
    address: '500 Oak St',
    squareFeet: 3000, // 50% different
    yearBuilt: 2000, // 10 years different
    value: '$450,000', // 50% different
    salePrice: '$430,000', // ~48% different
    landValue: '$200,000', // 100% different
    coordinates: [46.3, -119.2] // further away
  };

  // Default scoring configuration
  const defaultConfig: PropertySimilarityConfig = {
    weights: {
      squareFeet: 25,
      yearBuilt: 20,
      value: 20,
      landValue: 15,
      location: 20
    },
    thresholds: {
      squareFeet: { min: 0.8, max: 1.2 }, // ±20%
      yearBuilt: { min: -10, max: 10 }, // ±10 years
      value: { min: 0.8, max: 1.2 }, // ±20%
      landValue: { min: 0.7, max: 1.3 }, // ±30%
      location: 5 // 5 miles
    }
  };

  test('scores exact matches at 100%', () => {
    const score = calculatePropertySimilarity(referenceProperty, identicalProperty, defaultConfig);
    expect(score.total).toEqual(100);
    expect(score.components.squareFeet).toEqual(25); // Max weight for exact match
    expect(score.components.yearBuilt).toEqual(20);
    expect(score.components.value).toEqual(20);
    expect(score.components.landValue).toEqual(15);
    expect(score.components.location).toEqual(20);
  });

  test('scores similar properties correctly', () => {
    const score = calculatePropertySimilarity(referenceProperty, similarProperty, defaultConfig);
    
    // Total should be high but less than 100
    expect(score.total).toBeGreaterThan(80);
    expect(score.total).toBeLessThan(100);
    
    // Individual components should be high but might not be maximum
    expect(score.components.squareFeet).toBeGreaterThan(20); // High but not max
    expect(score.components.yearBuilt).toBeGreaterThan(15);
    expect(score.components.value).toBeGreaterThan(15);
    expect(score.components.landValue).toBeGreaterThan(10);
    expect(score.components.location).toBeGreaterThan(15);
  });

  test('scores different properties lower', () => {
    const score = calculatePropertySimilarity(referenceProperty, differentProperty, defaultConfig);
    
    // Total should be much lower
    expect(score.total).toBeLessThan(60);
    
    // Individual components should reflect larger differences
    expect(score.components.squareFeet).toBeLessThan(15);
    expect(score.components.yearBuilt).toBeLessThan(15);
    expect(score.components.value).toBeLessThan(15);
    expect(score.components.landValue).toBeLessThan(10);
    expect(score.components.location).toBeLessThan(10);
  });

  test('weights different metrics according to configuration', () => {
    // Configuration that heavily weights square footage
    const squareFootageConfig: PropertySimilarityConfig = {
      ...defaultConfig,
      weights: {
        ...defaultConfig.weights,
        squareFeet: 60, // 60% weight
        yearBuilt: 10,
        value: 10,
        landValue: 10,
        location: 10
      }
    };
    
    const score1 = calculatePropertySimilarity(referenceProperty, similarProperty, defaultConfig);
    const score2 = calculatePropertySimilarity(referenceProperty, similarProperty, squareFootageConfig);
    
    // The relative contribution of square footage should be higher in the second config
    const sqFtContribution1 = score1.components.squareFeet / score1.total;
    const sqFtContribution2 = score2.components.squareFeet / score2.total;
    
    expect(sqFtContribution2).toBeGreaterThan(sqFtContribution1);
  });

  test('handles missing property data gracefully', () => {
    const incompleteProperty: Property = {
      id: 'incomplete-prop',
      parcelId: 'APN12349',
      address: '130 Main St',
      squareFeet: 2200,
      yearBuilt: undefined, // Missing year built
      value: undefined, // Missing value
      salePrice: '$300,000',
      landValue: '$110,000',
      coordinates: [46.205, -119.105]
    };
    
    const score = calculatePropertySimilarity(referenceProperty, incompleteProperty, defaultConfig);
    
    // Should still calculate a score but with reduced total possible points
    expect(score.total).toBeGreaterThan(0);
    expect(score.components.yearBuilt).toEqual(0); // Zero for missing data
    expect(score.components.value).toEqual(0); // Zero for missing data
    
    // Other components should still be scored
    expect(score.components.squareFeet).toBeGreaterThan(0);
    expect(score.components.landValue).toBeGreaterThan(0);
    expect(score.components.location).toBeGreaterThan(0);
  });

  test('handles properties without coordinates', () => {
    const noLocationProperty: Property = {
      ...similarProperty,
      coordinates: undefined
    };
    
    const score = calculatePropertySimilarity(referenceProperty, noLocationProperty, defaultConfig);
    
    // Location component should be zero
    expect(score.components.location).toEqual(0);
    
    // Total should still be calculated from other components
    expect(score.total).toBeGreaterThan(0);
  });

  test('properly ranks properties by similarity score', () => {
    const properties = [differentProperty, similarProperty, identicalProperty];
    
    const scores = properties.map(p => ({
      property: p,
      score: calculatePropertySimilarity(referenceProperty, p, defaultConfig)
    }));
    
    // Sort by score descending
    scores.sort((a, b) => b.score.total - a.score.total);
    
    // Check ranking order
    expect(scores[0].property.id).toEqual('identical-prop');
    expect(scores[1].property.id).toEqual('similar-prop');
    expect(scores[2].property.id).toEqual('different-prop');
  });
});