import { Property } from '@/shared/schema';

/**
 * Interface for outlier detection options
 */
export interface OutlierDetectionOptions {
  attributes: string[];             // Property attributes to analyze for outliers
  threshold: number;                // Standard deviations threshold for outlier detection
  neighborhoodContext: boolean;     // Whether to detect outliers within neighborhood context
  minPropertiesForStats?: number;   // Minimum number of properties required for statistical analysis
}

/**
 * Interface for an identified outlier
 */
export interface PropertyOutlier {
  propertyId: number;
  deviationScores: Record<string, number>;  // Z-scores for each attribute
  primaryAttribute: string;                 // Attribute with highest deviation
  neighborhood?: string;                    // Property's neighborhood
}

/**
 * Interface for neighborhood-level statistics
 */
export interface NeighborhoodStatistics {
  count: number;
  mean: number;
  standardDeviation: number;
  outlierCount: number;
  skippedDueToInsufficientData?: boolean;
}

/**
 * Interface for outlier detection results
 */
export interface OutlierDetectionResult {
  outliers: PropertyOutlier[];
  metadata: {
    totalProperties: number;
    outlierPercentage: number;
    excludedProperties: number;
  };
  neighborhoodStatistics: Record<string, NeighborhoodStatistics>;
}

/**
 * Interface for outlier explanation
 */
export interface OutlierExplanation {
  summary: string;
  factors: string[];
  primaryFactor: string;
  secondaryFactors: string[];
  zScore: number;
  neighborhoodComparison: string;
  anomalyDirection: 'above' | 'below';
}

/**
 * Get numeric value for a property attribute
 * @param property Property object
 * @param attribute Attribute name
 * @returns Numeric value or undefined if not available
 */
function getAttributeValue(property: Property, attribute: string): number | undefined {
  if (attribute === 'value') {
    if (!property.value) return undefined;
    
    if (typeof property.value === 'string') {
      return parseFloat(property.value.replace(/[^0-9.-]+/g, ''));
    }
    return property.value as number;
  }
  
  if (attribute === 'squareFeet') {
    return property.squareFeet;
  }
  
  if (attribute === 'yearBuilt') {
    return property.yearBuilt;
  }
  
  if (attribute === 'bedrooms') {
    return property.bedrooms;
  }
  
  if (attribute === 'bathrooms') {
    return property.bathrooms;
  }
  
  if (attribute === 'lotSize') {
    return property.lotSize;
  }
  
  return undefined;
}

/**
 * Calculate basic statistics for an array of numbers
 * @param values Array of numeric values
 * @returns Object with mean and standard deviation
 */
function calculateStatistics(values: number[]): { mean: number; stdDev: number } {
  if (values.length === 0) {
    return { mean: 0, stdDev: 0 };
  }
  
  // Calculate mean
  const sum = values.reduce((acc, val) => acc + val, 0);
  const mean = sum / values.length;
  
  // Calculate standard deviation
  const squareDiffs = values.map(value => Math.pow(value - mean, 2));
  const variance = squareDiffs.reduce((acc, val) => acc + val, 0) / values.length;
  const stdDev = Math.sqrt(variance);
  
  return { mean, stdDev };
}

/**
 * Detect statistical outliers in property data
 * @param properties Array of properties to analyze
 * @param options Outlier detection options
 * @returns Outlier detection results
 */
export function detectOutliers(
  properties: Property[],
  options: OutlierDetectionOptions
): OutlierDetectionResult {
  const { attributes, threshold, neighborhoodContext, minPropertiesForStats = 5 } = options;
  
  // Filter out properties with missing values for the specified attributes
  const validProperties = properties.filter(property => {
    return attributes.every(attr => {
      const value = getAttributeValue(property, attr);
      return value !== undefined && !isNaN(value);
    });
  });
  
  // Track outliers and neighborhood statistics
  const outliers: PropertyOutlier[] = [];
  const neighborhoodStatistics: Record<string, NeighborhoodStatistics> = {};
  
  if (neighborhoodContext) {
    // Group properties by neighborhood
    const neighborhoodGroups = new Map<string, Property[]>();
    
    validProperties.forEach(property => {
      if (!property.neighborhood) return;
      
      const group = neighborhoodGroups.get(property.neighborhood) || [];
      group.push(property);
      neighborhoodGroups.set(property.neighborhood, group);
    });
    
    // Analyze each neighborhood separately
    neighborhoodGroups.forEach((neighborhoodProperties, neighborhood) => {
      // Initialize statistics for this neighborhood
      neighborhoodStatistics[neighborhood] = {
        count: neighborhoodProperties.length,
        mean: 0,
        standardDeviation: 0,
        outlierCount: 0
      };
      
      // Skip neighborhoods with too few properties
      if (neighborhoodProperties.length < minPropertiesForStats) {
        neighborhoodStatistics[neighborhood].skippedDueToInsufficientData = true;
        return;
      }
      
      // Analyze each attribute
      attributes.forEach(attribute => {
        // Get valid values for this attribute in this neighborhood
        const values = neighborhoodProperties
          .map(p => getAttributeValue(p, attribute))
          .filter((v): v is number => v !== undefined && !isNaN(v));
        
        if (values.length < minPropertiesForStats) return;
        
        // Calculate statistics
        const { mean, stdDev } = calculateStatistics(values);
        
        // Update neighborhood statistics for the primary attribute (first in the list)
        if (attribute === attributes[0]) {
          neighborhoodStatistics[neighborhood].mean = mean;
          neighborhoodStatistics[neighborhood].standardDeviation = stdDev;
        }
        
        // Skip if standard deviation is too small (avoid division by zero or near-zero)
        if (stdDev < 0.0001) return;
        
        // Check each property for outliers
        neighborhoodProperties.forEach(property => {
          const value = getAttributeValue(property, attribute);
          if (value === undefined) return;
          
          // Calculate z-score (standard deviations from mean)
          const zScore = (value - mean) / stdDev;
          
          // Check if it's an outlier based on threshold
          if (Math.abs(zScore) > threshold) {
            // Check if this property is already flagged as an outlier
            let outlier = outliers.find(o => o.propertyId === property.id);
            
            if (!outlier) {
              // Create new outlier
              outlier = {
                propertyId: property.id as number,
                deviationScores: {},
                primaryAttribute: attribute,
                neighborhood: property.neighborhood
              };
              outliers.push(outlier);
              neighborhoodStatistics[neighborhood].outlierCount++;
            }
            
            // Update deviation score for this attribute
            outlier.deviationScores[attribute] = zScore;
            
            // Update primary attribute if this deviation is higher
            if (Math.abs(zScore) > Math.abs(outlier.deviationScores[outlier.primaryAttribute] || 0)) {
              outlier.primaryAttribute = attribute;
            }
          }
        });
      });
    });
  } else {
    // Global analysis (not segmented by neighborhood)
    attributes.forEach(attribute => {
      // Get valid values for this attribute
      const values = validProperties
        .map(p => getAttributeValue(p, attribute))
        .filter((v): v is number => v !== undefined && !isNaN(v));
      
      if (values.length < minPropertiesForStats) return;
      
      // Calculate statistics
      const { mean, stdDev } = calculateStatistics(values);
      
      // Skip if standard deviation is too small
      if (stdDev < 0.0001) return;
      
      // Check each property for outliers
      validProperties.forEach(property => {
        const value = getAttributeValue(property, attribute);
        if (value === undefined) return;
        
        // Calculate z-score
        const zScore = (value - mean) / stdDev;
        
        // Check if it's an outlier
        if (Math.abs(zScore) > threshold) {
          // Check if this property is already flagged as an outlier
          let outlier = outliers.find(o => o.propertyId === property.id);
          
          if (!outlier) {
            // Create new outlier
            outlier = {
              propertyId: property.id as number,
              deviationScores: {},
              primaryAttribute: attribute,
              neighborhood: property.neighborhood
            };
            outliers.push(outlier);
          }
          
          // Update deviation score
          outlier.deviationScores[attribute] = zScore;
          
          // Update primary attribute if this deviation is higher
          if (Math.abs(zScore) > Math.abs(outlier.deviationScores[outlier.primaryAttribute] || 0)) {
            outlier.primaryAttribute = attribute;
          }
        }
      });
      
      // If not using neighborhood context, still populate neighborhood statistics
      // for summary purposes
      if (attribute === attributes[0]) {
        const neighborhoods = new Set(validProperties.map(p => p.neighborhood).filter(Boolean));
        
        neighborhoods.forEach(neighborhood => {
          if (!neighborhood) return;
          
          const propertiesInNeighborhood = validProperties.filter(p => p.neighborhood === neighborhood);
          const valuesInNeighborhood = propertiesInNeighborhood
            .map(p => getAttributeValue(p, attribute))
            .filter((v): v is number => v !== undefined && !isNaN(v));
          
          if (valuesInNeighborhood.length < minPropertiesForStats) {
            neighborhoodStatistics[neighborhood] = {
              count: propertiesInNeighborhood.length,
              mean: 0,
              standardDeviation: 0,
              outlierCount: 0,
              skippedDueToInsufficientData: true
            };
            return;
          }
          
          const stats = calculateStatistics(valuesInNeighborhood);
          const outliersInNeighborhood = outliers.filter(o => o.neighborhood === neighborhood).length;
          
          neighborhoodStatistics[neighborhood] = {
            count: propertiesInNeighborhood.length,
            mean: stats.mean,
            standardDeviation: stats.stdDev,
            outlierCount: outliersInNeighborhood
          };
        });
      }
    });
  }
  
  return {
    outliers,
    metadata: {
      totalProperties: validProperties.length,
      outlierPercentage: validProperties.length > 0 
        ? (outliers.length / validProperties.length) * 100 
        : 0,
      excludedProperties: properties.length - validProperties.length
    },
    neighborhoodStatistics
  };
}

/**
 * Generate a detailed explanation for why a property is flagged as an outlier
 * @param outlier The outlier to explain
 * @param properties All properties (for context)
 * @returns Detailed explanation
 */
export function generateOutlierExplanation(
  outlier: PropertyOutlier,
  properties: Property[]
): OutlierExplanation {
  // Find the property in the dataset
  const property = properties.find(p => p.id === outlier.propertyId);
  if (!property) {
    throw new Error(`Property with ID ${outlier.propertyId} not found`);
  }
  
  // Get primary attribute value and score
  const primaryAttribute = outlier.primaryAttribute;
  const primaryScore = outlier.deviationScores[primaryAttribute];
  const attributeValue = getAttributeValue(property, primaryAttribute);
  
  if (attributeValue === undefined) {
    throw new Error(`Value for ${primaryAttribute} is undefined for property ${outlier.propertyId}`);
  }
  
  // Determine the direction of the anomaly
  const anomalyDirection: 'above' | 'below' = primaryScore > 0 ? 'above' : 'below';
  
  // Format value for display
  let formattedValue = attributeValue.toString();
  if (primaryAttribute === 'value') {
    formattedValue = `$${attributeValue.toLocaleString()}`;
  } else if (primaryAttribute === 'squareFeet') {
    formattedValue = `${attributeValue.toLocaleString()} sq ft`;
  } else if (primaryAttribute === 'yearBuilt') {
    formattedValue = attributeValue.toString();
  }
  
  // Generate a list of factors contributing to the outlier status
  const factors: string[] = [];
  const secondaryFactors: string[] = [];
  
  // Add primary factor
  factors.push(`${primaryAttribute} (${formattedValue}) is ${Math.abs(primaryScore).toFixed(1)} standard deviations ${anomalyDirection} the ${property.neighborhood || 'area'} average`);
  
  // Add secondary factors
  Object.entries(outlier.deviationScores)
    .filter(([attr]) => attr !== primaryAttribute)
    .sort((a, b) => Math.abs(b[1]) - Math.abs(a[1]))
    .forEach(([attr, score]) => {
      if (Math.abs(score) > 1.0) {
        const attrValue = getAttributeValue(property, attr);
        if (attrValue === undefined) return;
        
        let formattedAttrValue = attrValue.toString();
        if (attr === 'value') {
          formattedAttrValue = `$${attrValue.toLocaleString()}`;
        } else if (attr === 'squareFeet') {
          formattedAttrValue = `${attrValue.toLocaleString()} sq ft`;
        }
        
        const direction = score > 0 ? 'high' : 'low';
        factors.push(`${attr} (${formattedAttrValue}) is unusually ${direction} for the ${property.neighborhood || 'area'}`);
        secondaryFactors.push(attr);
      }
    });
  
  // Add unique property characteristics
  if (property.propertyType) {
    factors.push(`Property type is ${property.propertyType}`);
  }
  
  // Generate neighborhood comparison
  const neighborhood = property.neighborhood;
  let neighborhoodComparison = '';
  
  if (neighborhood && anomalyDirection === 'above') {
    neighborhoodComparison = `${Math.abs(primaryScore * 25).toFixed(0)}% above the average for ${neighborhood}`;
  } else if (neighborhood && anomalyDirection === 'below') {
    neighborhoodComparison = `${Math.abs(primaryScore * 25).toFixed(0)}% below the average for ${neighborhood}`;
  } else {
    neighborhoodComparison = `significantly different from similar properties`;
  }
  
  // Generate summary
  let summary = '';
  if (primaryAttribute === 'value') {
    summary = `This property has a significantly ${anomalyDirection === 'above' ? 'higher' : 'lower'} value than similar properties in the ${property.neighborhood || 'area'}`;
  } else {
    summary = `This property has a significantly ${anomalyDirection === 'above' ? 'higher' : 'lower'} ${primaryAttribute} than similar properties in the ${property.neighborhood || 'area'}`;
  }
  
  return {
    summary,
    factors,
    primaryFactor: primaryAttribute,
    secondaryFactors,
    zScore: primaryScore,
    neighborhoodComparison,
    anomalyDirection
  };
}