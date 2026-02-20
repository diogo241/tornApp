/**
 * PDF Formatters
 *
 * Purpose: Format data specifically for PDF output using pt-PT locale
 * Security: All values are sanitized for PDF output (no HTML injection risk)
 * Performance: Optimized string operations, no unnecessary computations
 */

import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils';

/**
 * Format a date string for PDF display
 * Uses existing formatDateTime utility for consistency
 */
export function formatDateForPDF(dateString: Date | string | null | undefined): string {
  if (!dateString) return '-';
  
  const { dateOnly } = formatDateTime(dateString);
  return dateOnly || '-';
}

/**
 * Format a currency value for PDF display
 * Ensures consistent EUR formatting with proper symbols
 */
export function formatCurrencyForPDF(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  
  return formatCurrency(value);
}

/**
 * Format a number value for PDF display
 * Uses pt-PT number formatting
 */
export function formatNumberForPDF(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  
  return formatNumber(value);
}

/**
 * Format a percentage for PDF display
 * Adds % symbol and handles edge cases
 */
export function formatPercentForPDF(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  
  return `${value.toFixed(2)} %`;
}

/**
 * Generate a timestamp string for the report filename
 * Format: YYYY-MM-DD_HH-mm-ss
 */
export function generatePDFTimestamp(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  const hours = String(now.getHours()).padStart(2, '0');
  const minutes = String(now.getMinutes()).padStart(2, '0');
  const seconds = String(now.getSeconds()).padStart(2, '0');
  
  return `${year}-${month}-${day}_${hours}-${minutes}-${seconds}`;
}

/**
 * Sanitize text for PDF output
 * Prevents any potential issues with special characters
 * While jsPDF handles most cases, this adds an extra safety layer
 */
export function sanitizeTextForPDF(text: string): string {
  if (!text) return '';
  
  // Remove or replace problematic characters
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
    .replace(/[\u2028\u2029]/g, ' ') // Line/paragraph separators
    .trim();
}

/**
 * Truncate text to fit in a PDF cell
 * Prevents overflow issues in table cells
 */
export function truncateTextForPDF(text: string, maxLength: number = 50): string {
  const sanitized = sanitizeTextForPDF(text);
  
  if (sanitized.length <= maxLength) return sanitized;
  
  return `${sanitized.substring(0, maxLength - 3)}...`;
}

/**
 * Format a club name for PDF display
 * Combines sanitization and truncation
 */
export function formatClubNameForPDF(name: string): string {
  return truncateTextForPDF(name, 40);
}

/**
 * Format the net balance with color indicator text
 * Returns formatted value with status indicator
 */
export function formatNetBalanceForPDF(balance: number | null): {
  value: string;
  status: 'positive' | 'negative' | 'neutral';
} {
  if (balance === null || balance === undefined) {
    return { value: '-', status: 'neutral' };
  }
  
  const value = formatCurrency(balance);
  
  if (balance > 0) {
    return { value: `+${value}`, status: 'positive' };
  } else if (balance < 0) {
    return { value, status: 'negative' };
  }
  
  return { value, status: 'neutral' };
}
