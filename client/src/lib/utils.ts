import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/**
 * Creates a debounced function that delays invoking the provided function
 * until after the specified wait time has elapsed since the last time it was invoked.
 * 
 * @param fn The function to debounce
 * @param ms The number of milliseconds to delay
 * @returns Debounced function
 */
export function debounce<T extends (...args: any[]) => any>(
  fn: T,
  ms = 300
): (...args: Parameters<T>) => void {
  let timeoutId: ReturnType<typeof setTimeout>;
  
  return function(this: any, ...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn.apply(this, args), ms);
  };
}

/**
 * Formats a string or number as currency
 * @param value The value to format (e.g. "250000" or 250000)
 * @param locale The locale to use for formatting (default: 'en-US')
 * @param currency The currency to use (default: 'USD')
 * @param decimals The number of decimal places to include (default: 0)
 * @returns Formatted currency string (e.g. "$250,000")
 */
export function formatCurrency(
  value: string | number | undefined,
  locale = 'en-US',
  currency = 'USD',
  decimals = 0
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
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals
  }).format(numericValue);
}
