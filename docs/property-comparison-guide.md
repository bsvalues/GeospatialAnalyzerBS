# SpatialEst Property Comparison Tools Documentation

## Overview

The Property Comparison module in SpatialEst provides advanced algorithms and user interfaces for comparing properties based on multiple weighted factors. This enables users to find similar properties, generate comparable property sets for valuation, and assess property values based on market comparables.

## Table of Contents

1. [Core Components](#core-components)
2. [Similarity Scoring Algorithm](#similarity-scoring-algorithm)
3. [Usage Guide](#usage-guide)
4. [Customizing Comparison Weights](#customizing-comparison-weights)
5. [Integration With Other Modules](#integration-with-other-modules)
6. [Technical Implementation Details](#technical-implementation-details)

## Core Components

The Property Comparison system consists of the following key components:

### PropertyScoring Module

The heart of the comparison system, containing:
- Similarity scoring algorithm
- Property value normalization utilities
- Distance calculation for geographic comparison
- Default weight configurations

### PropertyComparisonTool Component

The main user interface for property comparison featuring:
- Selected property display
- Weight adjustment controls
- Similar properties results display
- Sorting and filtering options

### PropertySearchDialog Component

An interface for searching and selecting properties to compare, with:
- Text-based property search
- Results filtering
- Selection mechanism

### PropertyComparisonContext

A React context that manages the state of property comparisons:
- Stores selected properties
- Caches comparison results
- Maintains weight configurations
- Handles loading and error states

## Similarity Scoring Algorithm

### How Property Similarity Is Calculated

The similarity algorithm calculates a score from 0 to 1 (where 1 represents identical properties) based on the following factors:

1. **Property Value**
   - Uses a ratio-based comparison
   - Higher similarity when values are closer (e.g., $300k vs $320k scores higher than $300k vs $500k)

2. **Year Built**
   - Compares the age of properties
   - Properties built within 5 years of each other score high
   - Score decreases as the gap increases, with a 30-year difference marking a very low similarity

3. **Square Footage**
   - Ratio-based comparison of living area
   - Rewards similar-sized properties

4. **Bedrooms/Bathrooms**
   - Exact matches score highest
   - Score decreases as the difference increases
   - Different weighting for bedrooms vs bathrooms

5. **Property Type**
   - Binary comparison (match/no match)
   - Residential properties only match with other residential properties

6. **Neighborhood**
   - Binary comparison (match/no match)
   - Properties in the same neighborhood score higher

7. **Geographic Location** (optional)
   - Uses Haversine formula to calculate distance between properties
   - Properties within closer proximity score higher

### The Mathematical Formula

For numerical attributes like value and square footage:
```
similarity = min(value1, value2) / max(value1, value2)
```

For year built:
```
similarity = max(0, 1 - abs(year1 - year2) / 30)
```

For bedrooms and bathrooms:
```
similarity = 1 - min(abs(count1 - count2) / maxDifference, 1)
```

For categorical attributes (property type, neighborhood):
```
similarity = (attribute1 === attribute2) ? 1 : 0
```

The final score is a weighted average of all individual similarity scores:
```
totalScore = ∑(attributeSimilarity × attributeWeight) / ∑(attributeWeight)
```

## Usage Guide

### Finding Similar Properties

1. **Select a Reference Property**
   - Use the property search dialog or select from the map
   - The property details will display in the comparison panel

2. **Adjust Comparison Weights** (Optional)
   - Use the sliders to emphasize different property attributes
   - The default weights are optimized for general comparability

3. **Find Similar Properties**
   - Click "Find Similar Properties" to run the comparison
   - Results are displayed in ranked order by similarity score

### Comparing Multiple Properties

1. **Select Multiple Properties**
   - Add properties one by one to the comparison view
   - Up to 5 properties can be compared simultaneously

2. **Review Side-by-Side Comparison**
   - Property attributes are displayed in columns
   - Differences are highlighted for quick identification

3. **Adjust View Options**
   - Toggle different attributes to focus on specific comparisons
   - Sort properties by different attributes

## Customizing Comparison Weights

The default weights are:
- Property Value: 30%
- Year Built: 20%
- Square Footage: 20%
- Bedrooms: 10%
- Bathrooms: 10%
- Property Type: 5%
- Neighborhood: 5%

These weights can be adjusted using:
1. **The Weight Sliders** - Interactive sliders in the UI
2. **Reset Weights** - Button to return to default settings
3. **Weight Presets** - Select common weighting configurations:
   - Value Focused: Emphasizes property value
   - Physical Focused: Emphasizes square footage and rooms
   - Location Focused: Emphasizes neighborhood and property type

The weights always sum to 100% (or 1.0), and adjusting one weight automatically normalizes all weights.

## Integration With Other Modules

The Property Comparison system integrates with:

### 1. Map View
- Properties can be selected directly from the map
- Similar properties can be highlighted on the map

### 2. Valuation Tools
- Comparable properties can be used as inputs for valuation models
- Analyze value differences between similar properties

### 3. Export and Reporting
- Export comparison results to CSV or PDF
- Generate professional reports for property valuation justification

### 4. Data Analytics
- Feed comparison results into regression analysis
- Identify market trends based on similar property groups

## Technical Implementation Details

### Technologies Used

- **React** - For component-based UI
- **Context API** - For state management 
- **TanStack Query** - For data fetching and caching
- **Zod** - For schema validation
- **Tailwind CSS** - For styling

### Performance Considerations

The similarity algorithm is optimized for performance:
- Memoization of comparison results
- Lazy calculation of scores
- Efficient filtering before detailed comparison

### Extending the Algorithm

To add new comparison factors:
1. Update the `PropertyWeights` interface in `PropertyScoring.ts`
2. Add the new factor to `DEFAULT_WEIGHTS`
3. Implement the comparison logic in `calculateSimilarityScore()`
4. Add UI controls in `PropertyComparisonTool.tsx`

Example of adding a "School District" factor:
```typescript
// In PropertyScoring.ts
export interface PropertyWeights {
  // existing weights
  schoolDistrict: number;
}

export const DEFAULT_WEIGHTS: PropertyWeights = {
  // existing defaults
  schoolDistrict: 0.05
};

// In calculateSimilarityScore()
if (weights.schoolDistrict > 0) {
  if (property1.schoolDistrict && property2.schoolDistrict) {
    const districtSimilarity = property1.schoolDistrict === property2.schoolDistrict ? 1 : 0;
    totalScore += districtSimilarity * weights.schoolDistrict;
    totalWeight += weights.schoolDistrict;
  }
}
```

---

## Appendix: Code Examples

### Example 1: Finding the 3 most similar properties

```typescript
import { Property } from '@/shared/schema';
import { calculateSimilarityScore } from '@/components/comparison/PropertyScoring';

function findSimilarProperties(
  referenceProperty: Property,
  allProperties: Property[],
  count: number = 3
): Property[] {
  return allProperties
    .filter(property => property.id !== referenceProperty.id)
    .map(property => ({
      ...property,
      similarityScore: calculateSimilarityScore(referenceProperty, property)
    }))
    .sort((a, b) => b.similarityScore - a.similarityScore)
    .slice(0, count);
}
```

### Example 2: Custom weight configuration

```typescript
import { PropertyWeights } from '@/components/comparison/PropertyScoring';

// Configuration emphasizing physical characteristics
const physicalCharacteristicsWeights: PropertyWeights = {
  value: 0.10,
  yearBuilt: 0.15,
  squareFeet: 0.35,
  bedrooms: 0.20,
  bathrooms: 0.10,
  propertyType: 0.05,
  neighborhood: 0.05
};

// Configuration emphasizing location/neighborhood
const locationWeights: PropertyWeights = {
  value: 0.15,
  yearBuilt: 0.10,
  squareFeet: 0.15,
  bedrooms: 0.05,
  bathrooms: 0.05,
  propertyType: 0.20,
  neighborhood: 0.30
};
```