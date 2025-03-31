import { Property } from '@shared/schema';
import { parsePropertyValue } from './PropertyScoring';

/**
 * Historical property value data point
 */
export interface HistoricalValue {
  date: Date;
  value: number;
}

/**
 * Predicted property value data point
 */
export interface PredictedValue {
  date: Date;
  value: number;
  upperBound?: number;
  lowerBound?: number;
}

/**
 * Complete value trend data
 */
export interface ValuationTrendData {
  historical: HistoricalValue[];
  predicted: PredictedValue[];
  property: Property;
}

/**
 * Parameters for trend prediction
 */
export interface TrendPredictionParams {
  growthRate?: number;  // Annual growth rate (default: calculated from historical data)
  timeframe?: number;   // Prediction timeframe in years (default: 2)
  confidenceInterval?: number; // Confidence interval percentage (default: 90)
  volatility?: number;  // Market volatility factor (default: 0.15)
}

/**
 * Default parameters for trend prediction
 */
export const DEFAULT_PREDICTION_PARAMS: TrendPredictionParams = {
  growthRate: 0.035,    // 3.5% default annual growth
  timeframe: 2,         // 2 years prediction horizon
  confidenceInterval: 90, // 90% confidence interval
  volatility: 0.15      // 15% volatility factor
};

/**
 * Generates mock historical data for a property
 * (In a real application, this would be replaced with actual historical data from the database)
 * 
 * @param property The property to generate historical data for
 * @param years Number of years of historical data to generate
 * @returns Array of historical value data points
 */
export function generateHistoricalData(property: Property, years: number = 5): HistoricalValue[] {
  // Parse the current property value
  const currentValue = parsePropertyValue(property.value);
  if (!currentValue) return [];
  
  // Calculate a reasonable starting value based on the current value
  // Assuming average historical growth rate of 3.5% per year
  const avgAnnualGrowth = 0.035;
  const startValue = currentValue / Math.pow(1 + avgAnnualGrowth, years);
  
  // Generate monthly data points for the specified number of years
  const today = new Date();
  const historicalData: HistoricalValue[] = [];
  
  // Start date is X years ago from today
  const startDate = new Date(today);
  startDate.setFullYear(today.getFullYear() - years);
  
  // Create data points for each quarter
  for (let i = 0; i <= years * 4; i++) {
    const pointDate = new Date(startDate);
    pointDate.setMonth(startDate.getMonth() + (i * 3)); // Quarterly data
    
    // Calculate value with some random fluctuation to simulate market changes
    const timeProgress = i / (years * 4);
    const trend = startValue * Math.pow(1 + avgAnnualGrowth, timeProgress * years);
    
    // Add random market fluctuations (more realistic)
    const fluctuation = 1 + (Math.random() * 0.04 - 0.02); // +/- 2% random fluctuation
    const seasonalFactor = 1 + 0.01 * Math.sin(i * Math.PI / 2); // Slight seasonal pattern
    
    const value = Math.round(trend * fluctuation * seasonalFactor);
    
    historicalData.push({
      date: pointDate,
      value
    });
  }
  
  return historicalData;
}

/**
 * Calculates the annual growth rate from historical data
 * 
 * @param historicalData Array of historical value data points
 * @returns Calculated annual growth rate
 */
export function calculateGrowthRate(historicalData: HistoricalValue[]): number {
  if (historicalData.length < 2) return DEFAULT_PREDICTION_PARAMS.growthRate!;
  
  // Sort data by date
  const sortedData = [...historicalData].sort((a, b) => a.date.getTime() - b.date.getTime());
  
  // Get first and last data points
  const firstPoint = sortedData[0];
  const lastPoint = sortedData[sortedData.length - 1];
  
  // Calculate time difference in years
  const yearsDiff = (lastPoint.date.getTime() - firstPoint.date.getTime()) / (1000 * 60 * 60 * 24 * 365.25);
  
  // Calculate compound annual growth rate (CAGR)
  const cagr = Math.pow(lastPoint.value / firstPoint.value, 1 / yearsDiff) - 1;
  
  return cagr;
}

/**
 * Generates predicted future values based on historical data and parameters
 * 
 * @param historicalData Array of historical value data points
 * @param params Prediction parameters
 * @returns Array of predicted value data points
 */
export function predictFutureValues(
  historicalData: HistoricalValue[], 
  params: TrendPredictionParams = DEFAULT_PREDICTION_PARAMS
): PredictedValue[] {
  if (historicalData.length === 0) return [];
  
  // Use provided growth rate or calculate from historical data
  const growthRate = params.growthRate ?? calculateGrowthRate(historicalData);
  const timeframe = params.timeframe ?? DEFAULT_PREDICTION_PARAMS.timeframe!;
  const volatility = params.volatility ?? DEFAULT_PREDICTION_PARAMS.volatility!;
  
  // Calculate confidence interval factor based on confidence percentage
  const confidencePercentage = params.confidenceInterval ?? DEFAULT_PREDICTION_PARAMS.confidenceInterval!;
  const zScore = confidencePercentage === 90 ? 1.645 : 
                confidencePercentage === 95 ? 1.96 : 
                confidencePercentage === 99 ? 2.576 : 1.645;
  
  // Sort historical data by date and get the last value
  const sortedData = [...historicalData].sort((a, b) => a.date.getTime() - b.date.getTime());
  const lastDataPoint = sortedData[sortedData.length - 1];
  
  // Generate quarterly predictions for the specified timeframe
  const predictedData: PredictedValue[] = [];
  const quarterlyGrowthRate = Math.pow(1 + growthRate, 0.25) - 1; // Convert annual to quarterly
  
  for (let i = 1; i <= timeframe * 4; i++) {
    const predictionDate = new Date(lastDataPoint.date);
    predictionDate.setMonth(lastDataPoint.date.getMonth() + (i * 3)); // Quarterly data
    
    // Calculate predicted value with compound growth
    const predictedValue = lastDataPoint.value * Math.pow(1 + quarterlyGrowthRate, i);
    
    // Calculate confidence bounds based on time and volatility
    // Uncertainty increases with prediction distance
    const timeFactor = Math.sqrt(i / 4); // Square root of years from now
    const uncertaintySpread = predictedValue * volatility * timeFactor * zScore;
    
    predictedData.push({
      date: predictionDate,
      value: Math.round(predictedValue),
      upperBound: Math.round(predictedValue + uncertaintySpread),
      lowerBound: Math.round(predictedValue - uncertaintySpread)
    });
  }
  
  return predictedData;
}

/**
 * Generates a complete value trend dataset for a property
 * 
 * @param property The property to generate trend data for
 * @param params Prediction parameters
 * @returns Complete valuation trend data
 */
export function generatePropertyValueTrend(
  property: Property,
  params: TrendPredictionParams = DEFAULT_PREDICTION_PARAMS
): ValuationTrendData {
  // Generate historical data
  const historicalData = generateHistoricalData(property);
  
  // Generate predictions
  const predictedData = predictFutureValues(historicalData, params);
  
  return {
    historical: historicalData,
    predicted: predictedData,
    property
  };
}

/**
 * Formats a date for display on the chart
 * 
 * @param date Date to format
 * @param format Format option: 'short', 'month-year', 'quarter-year', 'full'
 * @returns Formatted date string
 */
export function formatChartDate(date: Date, format: 'short' | 'month-year' | 'quarter-year' | 'full' = 'month-year'): string {
  const month = date.getMonth() + 1;
  const year = date.getFullYear();
  
  switch (format) {
    case 'short':
      return `${month}/${year.toString().slice(2)}`;
    case 'month-year':
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[month - 1]} ${year}`;
    case 'quarter-year':
      const quarter = Math.ceil(month / 3);
      return `Q${quarter} ${year}`;
    case 'full':
      return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long' });
    default:
      return `${month}/${year}`;
  }
}

/**
 * Formats a currency value for display on the chart
 * 
 * @param value Value to format
 * @param abbreviated Whether to abbreviate large numbers (e.g., $1.2M)
 * @returns Formatted currency string
 */
export function formatChartCurrency(value: number, abbreviated: boolean = false): string {
  if (abbreviated) {
    if (value >= 1000000) {
      return `$${(value / 1000000).toFixed(1)}M`;
    } else if (value >= 1000) {
      return `$${(value / 1000).toFixed(0)}K`;
    }
  }
  
  return new Intl.NumberFormat('en-US', { 
    style: 'currency', 
    currency: 'USD',
    maximumFractionDigits: 0
  }).format(value);
}