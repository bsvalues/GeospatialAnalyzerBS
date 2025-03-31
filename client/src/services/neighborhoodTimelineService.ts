import { apiRequest } from '@/lib/queryClient';

// Define the data structure for neighborhood valuation timeline data
export interface NeighborhoodTimelineDataPoint {
  year: string;
  value: number;
  percentChange?: number;
  transactionCount?: number;
}

export interface NeighborhoodTimeline {
  id: string;
  name: string;
  data: NeighborhoodTimelineDataPoint[];
  avgValue?: number;
  growthRate?: number;
}

/**
 * Fetch neighborhood timelines with valuation trend data
 * @param years Number of years to include in the timeline
 * @returns Promise with an array of neighborhood timelines
 */
export async function getNeighborhoodTimelines(years: number = 10): Promise<NeighborhoodTimeline[]> {
  try {
    // In a live implementation, this would call an API endpoint
    // For now, we'll generate sample data for demo purposes
    return generateSampleNeighborhoodTimelines(years);
  } catch (error) {
    console.error('Error fetching neighborhood timelines:', error);
    throw error;
  }
}

/**
 * Fetch timeline data for a specific neighborhood
 * @param neighborhoodId Neighborhood ID
 * @param years Number of years to include
 * @returns Promise with neighborhood timeline data
 */
export async function getNeighborhoodTimeline(neighborhoodId: string, years: number = 10): Promise<NeighborhoodTimeline> {
  try {
    // In a live implementation, this would call an API endpoint
    const timelines = await generateSampleNeighborhoodTimelines(years);
    const timeline = timelines.find(t => t.id === neighborhoodId);
    
    if (!timeline) {
      throw new Error(`Neighborhood with ID ${neighborhoodId} not found`);
    }
    
    return timeline;
  } catch (error) {
    console.error(`Error fetching timeline for neighborhood ${neighborhoodId}:`, error);
    throw error;
  }
}

/**
 * Calculate average annual growth rate for a timeline
 * @param data Array of timeline data points
 * @returns Average annual growth rate as a decimal
 */
export function calculateAverageGrowthRate(data: NeighborhoodTimelineDataPoint[]): number {
  if (data.length < 2) return 0;
  
  // Calculate total growth over the entire period
  const firstValue = data[0].value;
  const lastValue = data[data.length - 1].value;
  
  if (firstValue === 0) return 0;
  
  const totalGrowth = (lastValue / firstValue) - 1;
  
  // Calculate average annual growth rate (CAGR)
  const years = data.length - 1;
  const averageAnnualGrowthRate = Math.pow(1 + totalGrowth, 1 / years) - 1;
  
  return averageAnnualGrowthRate;
}

// This function generates sample data for development/demo purposes
// In a production environment, this would be replaced with actual API calls
function generateSampleNeighborhoodTimelines(years: number): NeighborhoodTimeline[] {
  const currentYear = new Date().getFullYear();
  const startYear = currentYear - years + 1;
  
  const neighborhoods = [
    { id: 'downtown', name: 'Downtown' },
    { id: 'south_ridge', name: 'South Ridge' },
    { id: 'west_park', name: 'West Park' },
    { id: 'north_hills', name: 'North Hills' },
    { id: 'east_valley', name: 'East Valley' },
    { id: 'riverview', name: 'Riverview' },
    { id: 'central', name: 'Central' },
  ];
  
  // Generate timeline data for each neighborhood
  return neighborhoods.map(neighborhood => {
    // Different neighborhoods have different base values and growth patterns
    let baseValue: number;
    let annualGrowthBase: number;
    let volatility: number;
    
    switch (neighborhood.id) {
      case 'downtown':
        baseValue = 450000;
        annualGrowthBase = 0.08;
        volatility = 0.04;
        break;
      case 'south_ridge':
        baseValue = 380000;
        annualGrowthBase = 0.06;
        volatility = 0.03;
        break;
      case 'west_park':
        baseValue = 320000;
        annualGrowthBase = 0.05;
        volatility = 0.02;
        break;
      case 'north_hills':
        baseValue = 550000;
        annualGrowthBase = 0.07;
        volatility = 0.02;
        break;
      case 'east_valley':
        baseValue = 280000;
        annualGrowthBase = 0.04;
        volatility = 0.03;
        break;
      case 'riverview':
        baseValue = 420000;
        annualGrowthBase = 0.075;
        volatility = 0.035;
        break;
      default:
        baseValue = 350000;
        annualGrowthBase = 0.055;
        volatility = 0.025;
    }
    
    // Generate data points for each year
    const data: NeighborhoodTimelineDataPoint[] = [];
    let previousValue = baseValue;
    
    for (let yearOffset = 0; yearOffset < years; yearOffset++) {
      const year = (startYear + yearOffset).toString();
      
      // Make growth rate vary a bit each year
      const yearGrowthRate = annualGrowthBase + 
        (Math.random() * volatility * 2 - volatility);
      
      // Calculate value for this year
      let value = previousValue * (1 + yearGrowthRate);
      
      // Apply market crash around 2008
      if (parseInt(year) === 2008) {
        value = value * 0.9; // 10% drop
      }
      
      // Apply COVID impact in 2020
      if (parseInt(year) === 2020) {
        value = value * 0.95; // 5% drop
      }
      
      // Apply recent sharp growth in 2021-2022
      if (parseInt(year) >= 2021 && parseInt(year) <= 2022) {
        value = value * 1.12; // 12% extra growth
      }
      
      // Calculate percent change from previous year
      const percentChange = yearOffset > 0 
        ? (value - previousValue) / previousValue 
        : 0;
      
      // Generate random transaction count
      const transactionCount = Math.floor(Math.random() * 120) + 50;
      
      // Add data point
      data.push({
        year,
        value: Math.round(value),
        percentChange,
        transactionCount
      });
      
      previousValue = value;
    }
    
    // Calculate average value and growth rate
    const avgValue = data.reduce((sum, point) => sum + point.value, 0) / data.length;
    const growthRate = calculateAverageGrowthRate(data);
    
    return {
      id: neighborhood.id,
      name: neighborhood.name,
      data,
      avgValue,
      growthRate
    };
  });
}