import type { DETAIL_TABLE_COLUMNS, SUMMARY_TABLE_COLUMNS } from './templates';

/**
 * Complete data structure for PDF generation
 */
export interface CompleteClubFundingData {
  clubs: Array<{
    name: string;
    totalCost: number;
    netBalance: number;
    totalFunding: number;
  }>;
  totalCost: number;
  totalClubsCost: number;
  totalFundingCost: number;
  generatedAt: Date;
}

/**
 * Statistics for the summary section
 */
export interface ClubFundingStats {
  totalClubs: number;
  totalCost: number;
  totalNetBalance: number;
  totalFunding: number;
}

/**
 * Header Configuration
 */
export interface HeaderConfig {
  title: string;
  subtitle?: string;
  showLogo?: boolean;
  logoPath?: string;
  generatedDate: Date;
}

/**
 * Footer Configuration
 */
export interface FooterConfig {
  showSignature: boolean;
  signatureLabel?: string;
  dateLabel?: string;
  pageNumber: boolean;
  totalPages: number;
}

/**
 * Complete PDF Template Configuration
 */
export interface PDFTemplate {
  header: HeaderConfig;
  footer: FooterConfig;
  tables: {
    summary: {
      columns: typeof SUMMARY_TABLE_COLUMNS;
      showTotals: boolean;
    };
    details: {
      columns: typeof DETAIL_TABLE_COLUMNS;
      showPerClub: boolean;
    };
  };
}

/**
 * Single club's funding data for PDF table
 */
export interface ClubFundingTableRow {
  clubName: string;
  totalFunding: number | null;
  totalCost: number | null;
  netBalance: number | null;
}

/**
 * PDF Template configuration type
 */
export interface PDFTemplate {
  header: HeaderConfig;
  footer: FooterConfig;
}
