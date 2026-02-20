/**
 * PDF Templates Configuration
 *
 */

import type { PDFTemplate } from './types';

/**
 * PDF Page Configuration
 * A4 size with standard margins for printing
 */
export const PDF_CONFIG = {
  orientation: 'landscape' as const,
  unit: 'mm' as const,
  format: 'a4' as const,
  margins: {
    top: 20,
    right: 15,
    bottom: 30,
    left: 15,
  },
  fontFamily: 'helvetica',
  fontSize: 10,
} as const;

/**
 * PDF Dimensions (A4 in mm)
 */
export const PAGE_DIMENSIONS = {
  width: 297,
  height: 210,
  contentWidth: 297 - 15 - 15, // Width minus margins
  contentHeight: 210 - 20 - 30, // Height minus margins
} as const;

/**
 * Color Palette
 * Matches the project's design system
 */
export const PDF_COLORS = {
  primary: [1, 183, 98],      // Green  
  neutral: [241, 245, 249],    
  border: [226, 232, 240],    
  text: [10, 10, 10],        
  muted: [100, 116, 139],     
  white: [255, 255, 255],
} as const;

/**
 * Typography Configuration
 */
export const PDFTypography = {
  header: {
    fontSize: 18,
    fontStyle: 'bold' as const,
    color: PDF_COLORS.primary,
  },
  subheader: {
    fontSize: 14,
    fontStyle: 'bold' as const,
    color: PDF_COLORS.primary,
  },
  body: {
    fontSize: 10,
    fontStyle: 'normal' as const,
    color: PDF_COLORS.text,
  },
  small: {
    fontSize: 8,
    fontStyle: 'normal' as const,
    color: PDF_COLORS.muted,
  },
  footer: {
    fontSize: 8,
    fontStyle: 'italic' as const,
    color: PDF_COLORS.muted,
  },
} as const;

/**
 * Table Styles Configuration
 * Matches shadcn/ui table component styling
 */
export const TableStyles = {
  header: {
    fillColor: PDF_COLORS.primary,
    textColor: [255, 255, 255] as [number, number, number],
    fontStyle: 'bold' as const,
    fontSize: 9,
    halign: 'left' as const,
    valign: 'middle' as const,
    cellPadding: 3,
  },
  body: {
    fillColor: false,
    textColor: PDF_COLORS.text,
    fontStyle: 'normal' as const,
    fontSize: 9,
    halign: 'left' as const,
    valign: 'middle' as const,
    cellPadding: 2.5,
  },
  alternateRow: {
    fillColor: PDF_COLORS.neutral,
    textColor: PDF_COLORS.text,
  },
  borders: {
    lineWidth: 0.1,
    lineColor: PDF_COLORS.border,
  },
} as const;

/**
 * Summary Table Column Definitions
 * Defines the structure for the club funding summary table
 */
export const SUMMARY_TABLE_COLUMNS = [
  {
    header: 'Clube',
    dataKey: 'clubName',
    width: 50,
    styles: { halign: 'left' as const, cellWidth: 50 },
  },
  {
    header: 'Financiamento',
    dataKey: 'funding',
    width: 40,
    styles: { halign: 'right' as const, cellWidth: 40 },
  },
  {
    header: 'Custo Total',
    dataKey: 'totalCost',
    width: 40,
    styles: { halign: 'right' as const, cellWidth: 40 },
  },
  {
    header: 'Saldo Líquido',
    dataKey: 'netBalance',
    width: 45,
    styles: { halign: 'right' as const, cellWidth: 45 },
  },
] as const;

/**
 * Detail Table Column Definitions
 * Defines the structure for detailed club information
 */
export const DETAIL_TABLE_COLUMNS = [
  {
    header: 'Descrição',
    dataKey: 'description',
    width: 'auto',
  },
  {
    header: 'Valor',
    dataKey: 'value',
    width: 40,
    styles: { halign: 'right' as const, cellWidth: 40 },
  },
] as const;


/**
 * Default PDF Template for Club Funding Report
 */
export const DEFAULT_CLUB_FUNDING_TEMPLATE: PDFTemplate = {
  header: {
    title: 'Relatório dos Torneios',
    subtitle: 'Resumo Financeiro Anual',
    showLogo: true,
    generatedDate: new Date(),
  },
  footer: {
    showSignature: true,
    signatureLabel: 'Assinatura:',
    dateLabel: 'Data:',
    pageNumber: true,
    totalPages: 0, // Will be calculated during generation
  },
  tables: {
    summary: {
      columns: SUMMARY_TABLE_COLUMNS,
      showTotals: true,
    },
    details: {
      columns: DETAIL_TABLE_COLUMNS,
      showPerClub: false, // Set to true if you want individual club details
    },
  },
} as const;

/**
 * Calculate Y positions for layout
 * Helps with consistent spacing
 */
export function calculateYPositions() {
  const { margins } = PDF_CONFIG;
  
  return {
    headerEnd: margins.top + 25,
    tableStart: margins.top + 30,
    tableEnd: PAGE_DIMENSIONS.contentHeight - margins.bottom - 20,
    footerStart: PAGE_DIMENSIONS.contentHeight - margins.bottom + 5,
  };
}



