import { type ClassValue, clsx } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Combine class names using clsx and tailwind-merge
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/**
 * Format a number as currency
 */
export function formatCurrency(value: number, options?: {
  notation?: Intl.NumberFormatOptions['notation'],
  minimumFractionDigits?: number,
  maximumFractionDigits?: number
}): string {
  const {
    notation,
    minimumFractionDigits = 0,
    maximumFractionDigits = 0
  } = options || {};
  
  return new Intl.NumberFormat('en-US', {
    style: 'currency',
    currency: 'USD',
    notation,
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value);
}

/**
 * Format a number as percentage
 */
export function formatPercentage(value: number, options?: {
  minimumFractionDigits?: number,
  maximumFractionDigits?: number
}): string {
  const {
    minimumFractionDigits = 1,
    maximumFractionDigits = 1
  } = options || {};
  
  return new Intl.NumberFormat('en-US', {
    style: 'percent',
    minimumFractionDigits,
    maximumFractionDigits
  }).format(value / 100);
}

/**
 * Alias for formatPercentage for backward compatibility
 */
export const formatPercent = formatPercentage;

/**
 * Format a date
 */
export function formatDate(date: Date, options?: Intl.DateTimeFormatOptions): string {
  return new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
    ...options
  }).format(date);
}

/**
 * Return a human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(2))} ${sizes[i]}`;
}

/**
 * Truncate a string to a specified length and add ellipsis if needed
 */
export function truncateString(str: string, maxLength: number): string {
  if (str.length <= maxLength) return str;
  return `${str.slice(0, maxLength)}...`;
}

/**
 * Get initials from a name
 */
export function getInitials(name: string): string {
  const parts = name.split(' ');
  if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
}

/**
 * Convert snake_case to Title Case
 */
export function snakeToTitleCase(str: string): string {
  return str
    .split('_')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
    .join(' ');
}

/**
 * Parse a numeric value from a string, handling currency symbols and commas
 */
export function parseNumericValue(value: string | null | undefined): number {
  if (!value) return 0;
  return parseFloat(value.replace(/[^0-9.-]+/g, ''));
}

/**
 * Check if a value is numeric
 */
export function isNumeric(value: any): boolean {
  return !isNaN(parseFloat(value)) && isFinite(value);
}

/**
 * Get color based on trend (up, down, stable)
 */
export function getTrendColor(trend: string): string {
  switch (trend) {
    case 'up':
      return 'text-green-500';
    case 'down':
      return 'text-red-500';
    default:
      return 'text-amber-500';
  }
}

/**
 * Get icon based on trend (up, down, stable)
 */
export function getTrendIcon(trend: string): string {
  switch (trend) {
    case 'up':
      return '↑';
    case 'down':
      return '↓';
    default:
      return '→';
  }
}

/**
 * Calculate percentage change between two values
 */
export function calculatePercentChange(oldValue: number, newValue: number): number {
  if (oldValue === 0) return 0;
  return ((newValue - oldValue) / Math.abs(oldValue)) * 100;
}

/**
 * Calculate haversine distance between two lat/lng coordinates in kilometers
 */
export function haversineDistance(
  lat1: number, 
  lng1: number, 
  lat2: number, 
  lng2: number
): number {
  // Earth's radius in kilometers
  const R = 6371;
  
  // Convert latitude and longitude to radians
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLng = (lng2 - lng1) * Math.PI / 180;
  
  // Haversine formula
  const a = 
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  
  // Distance in kilometers
  return R * c;
}