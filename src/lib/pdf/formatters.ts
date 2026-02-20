/**
 * PDF Formatters
 *
 */

import { formatCurrency, formatNumber, formatDateTime } from '@/lib/utils';

/**
 * Format a date string for PDF display
 */
export function formatDateForPDF(dateString: Date | string | null | undefined): string {
  if (!dateString) return '-';
  
  const { dateOnly } = formatDateTime(dateString);
  return dateOnly || '-';
}

/**
 * Format a currency value for PDF display
 */
export function formatCurrencyForPDF(value: number | null | undefined): string {
  if (value === null || value === undefined) return '-';
  
  return formatCurrency(value);
}

/**
 * Format a number value for PDF display
 */
export function formatNumberForPDF(value: number | null | undefined): string {
  if (value === null || value === undefined) return '0';
  
  return formatNumber(value);
}


/**
 * Generate a timestamp string for the report filename
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
 */
export function sanitizeTextForPDF(text: string): string {
  if (!text) return '';
  
  // Remove or replace problematic characters
  return text
    .replace(/[\u0000-\u001F\u007F-\u009F]/g, '') // Control characters
    .replace(/[\u2028\u2029]/g, ' ') // Line/paragraph separators
    .trim();
}

