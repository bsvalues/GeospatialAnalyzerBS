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