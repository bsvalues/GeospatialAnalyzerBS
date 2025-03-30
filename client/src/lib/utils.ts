import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Formats a string or number as currency
 * @param value The value to format (e.g. "250000" or 250000)
 * @param locale The locale to use for formatting (default: 'en-US')
 * @param currency The currency to use (default: 'USD')
 * @returns Formatted currency string (e.g. "$250,000")
 */
export function formatCurrency(
  value: string | number | undefined,
  locale = 'en-US',
  currency = 'USD'
): string {
  if (value === undefined) return '';
  
  // Convert string to number if needed
  const numericValue = typeof value === 'string' ? 
    parseFloat(value.replace(/[^0-9.-]+/g, '')) : 
    value;
  
  if (isNaN(numericValue)) return '';
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
    maximumFractionDigits: 0
  }).format(numericValue);
}
