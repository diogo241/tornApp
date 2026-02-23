/**
 * PDF Export API Route - Club Funding Report
 *
 */

import { NextRequest, NextResponse } from 'next/server';
import { getSession } from '@lib/auth';
import { apiError, HttpStatusCode } from '@lib/api';
import { generateClubFundingPDF } from '@lib/pdf/generators';
import { getAllClubsWithBalances } from '@lib/services/club-funding-export';
import { getClubFunding, getTotalFunding } from '@lib/services/club-funding';

/**
 * GET /api/export/club-funding-pdf
 */
export const GET = async (request: NextRequest) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }

    // Get clubs data
    const clubsData = await getAllClubsWithBalances();

    // Check if data retrieval was successful
    if (!clubsData.success || !clubsData.data) {
      return apiError('Failed to retrieve data', HttpStatusCode.NOT_FOUND);
    }

    // Get total funding for municipality costs
    const { success, clubFunding } = await getClubFunding();
    if (!success && !clubFunding) {
      return apiError('No club funding found', HttpStatusCode.NOT_FOUND);
    }

    const totalFundingCost = getTotalFunding(clubFunding!);

    const totalCost = clubsData.data.reduce(
      (sum, club) => sum + club.totalCost,
      0,
    );
    const totalClubsCost = clubsData.data.reduce(
      (sum, club) => sum + Math.abs(club.netBalance),
      0,
    );

    // Create PDF from retrieved data
    const pdfData = {
      clubs: clubsData.data.map((club) => ({
        name: club.name,
        totalCost: club.totalCost,
        netBalance: Math.abs(club.netBalance),
        //TODO: FIX THE CLUB FUNDING AMOUNT, NETBALANCE POSITIVE
        totalFunding: club.netBalance > 0 ? clubFunding?.amount! - club.netBalance : clubFunding?.amount!,
      })),
      totalFundingCost,
      totalCost,
      totalClubsCost,
      generatedAt: new Date(),
    };

    // Generate PDF buffer
    const pdfBuffer = await generateClubFundingPDF(pdfData);

    // Generate filename with timestamp
    const year = new Date().getFullYear();
    const yearSuffix = year ? `_${year}` : '';
    const filename = `club_municipal_report${yearSuffix}.pdf`;

    // Create response with proper headers for PDF download
    const response = new NextResponse(Buffer.from(pdfBuffer), {
      status: HttpStatusCode.OK,
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `attachment; filename="${filename}"`,
        'Content-Length': pdfBuffer.length.toString(),
        'Cache-Control': 'no-cache, no-store, must-revalidate',
        'X-Content-Type-Options': 'nosniff',
      },
    });

    return response;
  } catch (error) {
    return apiError(
      'Failed to generate PDF report',
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
