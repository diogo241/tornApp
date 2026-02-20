/**
 * PDF Generators
 */
import fs from 'fs';
import path from 'path';
import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';
import type { UserOptions } from 'jspdf-autotable';
import {
  PDF_CONFIG,
  PAGE_DIMENSIONS,
  PDF_COLORS,
  PDFTypography,
  TableStyles,
  calculateYPositions,
  DEFAULT_CLUB_FUNDING_TEMPLATE,
} from './templates';
import {
  formatDateForPDF,
  formatCurrencyForPDF,
  sanitizeTextForPDF,
} from './formatters';
import type {
  ClubFundingStats,
  ClubFundingTableRow,
  CompleteClubFundingData,
  FooterConfig,
  HeaderConfig,
  PDFTemplate,
} from './types';

/**
 * Add PDF Header with Logo and Title
 *
 * Purpose: Creates consistent header across all pages
 *
 * @param doc - jsPDF instance
 * @param config - Header configuration options
 */
export async function addPDFHeader(
  doc: jsPDF,
  config: HeaderConfig,
): Promise<void> {
  const { margins } = PDF_CONFIG;
  const { header } = PDFTypography;

  let currentY = margins.top;

  // Add Logo
  if (config.showLogo) {
    try {
      const logoPath = path.resolve('./public/logo.png');
      const logoData = fs.readFileSync(logoPath, {
        encoding: 'base64',
      });

      doc.addImage(
        logoData,
        'PNG',
        margins.left,
        currentY,
        20,
        21,
        'logo',
        'MEDIUM',
        0,
      );
    } catch (error) {
      doc.setFillColor(...PDF_COLORS.primary);
      doc.roundedRect(margins.left, currentY, 20, 20, 2, 2, 'F');
    }
  }

  // Add title (top right or center depending on logo)
  doc.setTextColor(...header.color);
  doc.setFontSize(header.fontSize);
  doc.setFont('helvetica', header.fontStyle);

  const titleX = config.showLogo ? margins.left + 30 : margins.left;
  doc.text(config.title, titleX, currentY + 7);

  // Add subtitle if provided
  if (config.subtitle) {
    doc.setFontSize(11);
    doc.setFont('helvetica', 'normal');
    doc.setTextColor(...PDF_COLORS.muted);
    doc.text(config.subtitle, titleX, currentY + 14);
  }

  // Add generation date (right aligned)
  doc.setFontSize(8);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(...PDF_COLORS.muted);
  const generatedDate = formatDateForPDF(config.generatedDate);
  doc.text(
    generatedDate,
    PAGE_DIMENSIONS.width - margins.right,
    currentY + 7,
    { align: 'right' },
  );
}
/**
 * Generate Club Funding Summary Table
 *
 *
 * @param doc - jsPDF instance
 * @param clubsData - Array of club funding data
 * @returns Final Y position after table
 */
export function addClubFundingTable(
  doc: jsPDF,
  clubsData: ClubFundingTableRow[],
): number {
  const { margins } = PDF_CONFIG;
  const yPositions = calculateYPositions();

  // Prepare table data with proper formatting
  const tableData = clubsData.map((club) => [
    sanitizeTextForPDF(club.clubName),
    formatCurrencyForPDF(club.totalFunding),
    formatCurrencyForPDF(club.totalCost),
    formatCurrencyForPDF(club.netBalance),
  ]);

  // Configure table styles
  const tableOptions: UserOptions = {
    startY: yPositions.tableStart,
    margin: { left: margins.left, right: margins.right },
    head: [['Clube', 'Apoio Câmara Municipal', 'Custo Total', 'Suportado pelo Clube']],
    body: tableData,
    theme: 'grid',
    styles: {
      fontSize: TableStyles.body.fontSize,
      cellPadding: TableStyles.body.cellPadding,
      font: 'helvetica',
      textColor: TableStyles.body.textColor as [number, number, number],
      lineColor: TableStyles.borders.lineColor as [number, number, number],
      lineWidth: TableStyles.borders.lineWidth,
    },
    headStyles: {
      fillColor: TableStyles.header.fillColor as [number, number, number],
      textColor: TableStyles.header.textColor,
      fontStyle: TableStyles.header.fontStyle,
      fontSize: TableStyles.header.fontSize,
      halign: TableStyles.header.halign,
      cellPadding: TableStyles.header.cellPadding,
    },
    columnStyles: {
      0: { cellWidth: 'auto' },
      1: { cellWidth: 50, halign: 'left' },
      2: { cellWidth: 50, halign: 'left' },
      3: { cellWidth: 50, halign: 'left' },
    },
    didParseCell: function (data: any) {
      if (data.row.index === tableData.length - 1) {
        data.cell.styles.fillColor = TableStyles.alternateRow.fillColor;
        data.cell.styles.textColor = TableStyles.alternateRow.textColor;
      }
    },
    tableWidth: 'auto',
    rowPageBreak: 'auto',
    pageBreak: 'auto',
  };

  // Generate the table
  autoTable(doc, tableOptions);

  // Return the final Y position after the table
  const finalY =
    (doc as any).lastAutoTable.finalY || yPositions.tableStart + 10;

  return finalY;
}

/**
 * Add Summary Statistics Section
 *
 * Purpose: Displays key statistics before the detailed table
 * Design: Clean, readable summary of important metrics
 *
 * @param doc - jsPDF instance
 * @param stats - Statistics object
 * @param startY - Y position to start rendering
 */
export function addSummarySection(
  doc: jsPDF,
  stats: ClubFundingStats,
  startY: number,
): number {
  const { margins } = PDF_CONFIG;
  let currentY = startY + 10;
  const pageWidth = doc.internal.pageSize.getWidth();
  const usableWidth = pageWidth - margins.left - margins.right;
  const columnWidth = usableWidth / 2;

  // Section title
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(...PDF_COLORS.text);
  doc.text('Resumo', margins.left, currentY);

  currentY += 8;

  // Statistics grid (2 columns)
  const statsData = [
    { label: 'Clubes:', value: stats.totalClubs.toString() },
    { label: 'Custo Total:', value: formatCurrencyForPDF(stats.totalCost) },
    {
      label: 'Suportado pelo Município:',
      value: formatCurrencyForPDF(stats.totalFunding),
    },
    {
      label: 'Suportado pelos Clubes:',
      value: formatCurrencyForPDF(stats.totalNetBalance),
    },
  ];

  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');

  statsData.forEach((stat, index) => {
    const isSecondCol = index % 2 !== 0;
    const xPos = isSecondCol ? margins.left + columnWidth : margins.left;
    const yPos = currentY + Math.floor(index / 2) * 8;

    // Label
    doc.setTextColor(...PDF_COLORS.text);
    doc.setFont('helvetica', 'normal');
    doc.text(stat.label, xPos, yPos);

    // Value
    const valueX = xPos + columnWidth - 10;
    doc.setTextColor(...PDF_COLORS.muted);
    doc.setFont('helvetica', 'bold');
    doc.text(stat.value, valueX, yPos, { align: 'right' });
  });

  return currentY + Math.ceil(statsData.length / 2) * 8 + 5;
}

/**
 * Generate Complete Club Funding PDF
 *
 * @param data - Complete club funding data
 * @param template - PDF template configuration
 * @returns PDF buffer as Uint8Array
 * @throws Error if PDF generation fails
 */
export async function generateClubFundingPDF(
  data: CompleteClubFundingData,
  template: PDFTemplate = DEFAULT_CLUB_FUNDING_TEMPLATE,
): Promise<Uint8Array> {
  try {
    // Validate input data
    if (!data.clubs || data.clubs.length === 0) {
      throw new Error('No club data provided for PDF generation');
    }

    const doc = new jsPDF(PDF_CONFIG);

    // 1. Add Header
    await addPDFHeader(doc, template.header);

    // 2. Add Main Funding Table
    const tableData: ClubFundingTableRow[] = data.clubs.map((club) => ({
      clubName: club.name,
      totalFunding: club.totalFunding,
      totalCost: club.totalCost,
      netBalance: club.netBalance,
    }));

    const finalY = addClubFundingTable(doc, tableData);

    // 3. Add Summary Section below the table
    const stats: ClubFundingStats = {
      totalClubs: data.clubs.length,
      totalCost: data.totalCost,
      totalNetBalance: data.totalClubsCost,
      totalFunding: data.totalFundingCost,
    };

    addSummarySection(doc, stats, finalY + 10);

    // 4. Add Signature to Last Page
    const totalPages = doc.internal.pages.length;
    doc.setPage(totalPages);

    addSignatureFooter(doc);


    // Generate PDF buffer
    const pdfBuffer = doc.output('arraybuffer');

    return new Uint8Array(pdfBuffer);
  } catch (error) {
    throw new Error('Failed to generate PDF report');
  }
}

/**
 * Adds a signature field to the last page of the document
 * @param doc - jsPDF instance
 */
export function addSignatureFooter(doc: jsPDF): void {
  const { margins } = PDF_CONFIG;
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();

  // Position near the bottom, but above the margin
  const signatureY = pageHeight - margins.bottom + 10;
  const lineWidth = 60;
  const centerX = pageWidth / 2;
  const lineStartX = centerX - lineWidth / 2;

  // Draw the Signature Line
  doc.setDrawColor(...PDF_COLORS.text);
  doc.setLineWidth(0.2);
  doc.line(lineStartX, signatureY, lineStartX + lineWidth, signatureY);

  // Signature Text
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(...PDF_COLORS.text);
  doc.text('O Presidente', centerX, signatureY + 5, {
    align: 'center',
  });
}
