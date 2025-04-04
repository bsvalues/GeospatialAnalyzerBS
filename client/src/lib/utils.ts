import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as a currency (USD)
 * @param value Number to format
 * @returns Formatted currency string
 */
export function formatCurrency(value: number | string): string {
  // Convert to number if it's a string
  const numValue = typeof value === 'string' ? parseFloat(value) : value;
  
  // Check if it's a valid number
  if (isNaN(numValue)) {
    return '$0.00';
  }
  
  // Format with standard US currency format
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(numValue);
}

/**
 * Format a number as a percentage
 * @param value Number to format (0.1 = 10%)
 * @param decimalPlaces Number of decimal places to include
 * @returns Formatted percentage string
 */
export function formatPercent(value: number, decimalPlaces: number = 1): string {
  if (isNaN(value)) return '0%';
  
  return `${(value * 100).toFixed(decimalPlaces)}%`;
}

// Alias for formatPercent for compatibility
export const formatPercentage = formatPercent;

/**
 * Format a number with thousands separators
 * @param value Number to format
 * @param decimalPlaces Number of decimal places to include
 * @returns Formatted number string
 */
export function formatNumber(value: number, decimalPlaces: number = 0): string {
  if (isNaN(value)) return '0';
  
  return new Intl.NumberFormat('en-US', {
    minimumFractionDigits: decimalPlaces,
    maximumFractionDigits: decimalPlaces
  }).format(value);
}

/**
 * Calculate the distance between two geographical coordinates using the haversine formula
 * @param coord1 First coordinate [lat, lng]
 * @param coord2 Second coordinate [lat, lng]
 * @returns Distance in kilometers
 */
export function haversineDistance(
  coord1: [number, number],
  coord2: [number, number]
): number {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert latitude and longitude from degrees to radians
  const lat1 = (coord1[0] * Math.PI) / 180;
  const lon1 = (coord1[1] * Math.PI) / 180;
  const lat2 = (coord2[0] * Math.PI) / 180;
  const lon2 = (coord2[1] * Math.PI) / 180;
  
  // Differences in coordinates
  const dLat = lat2 - lat1;
  const dLon = lon2 - lon1;
  
  // Haversine formula
  const a =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLon / 2) * Math.sin(dLon / 2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  const distance = R * c;
  
  return distance;
}

/**
 * Format a date object to a human-readable string
 * @param date Date object to format
 * @param options Intl.DateTimeFormatOptions object to customize formatting
 * @returns Formatted date string
 */
export function formatDate(date: Date, options: Intl.DateTimeFormatOptions = {}): string {
  if (!date || !(date instanceof Date) || isNaN(date.getTime())) {
    return 'Invalid date';
  }
  
  const defaultOptions: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  };
  
  return new Intl.DateTimeFormat('en-US', defaultOptions).format(date);
}

/**
 * Parse a string or number value to a numeric value
 * @param value The value to parse
 * @param defaultValue The default value to return if parsing fails
 * @returns The parsed numeric value
 */
export function parseNumericValue(value: string | number | undefined | null, defaultValue: number = 0): number {
  if (value === undefined || value === null) {
    return defaultValue;
  }
  
  if (typeof value === 'number') {
    return isNaN(value) ? defaultValue : value;
  }
  
  // Handle string values
  if (typeof value === 'string') {
    // Remove currency symbols, commas, and other non-numeric characters
    const cleaned = value.replace(/[$,\s]/g, '');
    
    // Convert to number
    const parsed = parseFloat(cleaned);
    
    // Return defaultValue if parsing failed
    return isNaN(parsed) ? defaultValue : parsed;
  }
  
  return defaultValue;
}