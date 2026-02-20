import { prisma } from '@lib/prisma';

/**
 * Club funding data structure from database
 * Includes all necessary relationships for PDF generation
 */
export interface ClubFundingData {
  id: string;
  name: string;
  fundingAmount: number | null;
  fundingYear: number | null;
  balanceTotalCost: number | null;
  balanceNetBalance: number | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * Complete club funding data with calculated fields
 * Ready for PDF generation after processing
 */
export interface ProcessedClubFundingData {
  name: string;
  netBalance: number;
  totalCost: number;
}

/**
 * Fetch all clubs with their funding and balance data
 */
export async function getAllClubsWithBalances() {
  try {
    const clubs = await prisma.club.findMany({
      include: {
        clubBalance: true,
      },
    });

    if (!clubs || clubs.length === 0) {
      return {
        success: false,
        message: 'No clubs found in the database',
      };
    }

    // Process and validate each club's data
    const processedData: ProcessedClubFundingData[] = clubs
      .map((club) => {
        const clubNetBalance = club.clubBalance?.netBalance ?? 0;
        const clubSuportedValue =
          clubNetBalance > 0 ? 0 : Math.abs(clubNetBalance);

        return {
          name: club.name,
          netBalance: clubSuportedValue,
          totalCost: club.clubBalance?.totalCost ?? 0,
        };
      })
      // Get only clubs with totalCost > 0, with tournaments
      .filter((club): club is ProcessedClubFundingData => club.totalCost !== 0);

    // Check if we have any valid data after processing
    if (processedData.length === 0) {
      return {
        success: false,
        message: 'No valid clubs with club balance.',
      };
    }

    return {
      success: true,
      data: processedData,
    };
  } catch (error) {
    return {
      success: false,
      message: 'Failed to retrieve club funding data',
    };
  }
}

/**
 * Get summary statistics for club funding
 *
 * Purpose: Calculate high-level statistics for dashboard/summary views
 * Performance: Lightweight query, aggregates only
 *
 * @returns Summary statistics or error
 */
export async function getClubFundingSummary(): Promise<{
  success: boolean;
  summary?: {
    totalClubs: number;
    totalFunding: number;
    totalCost: number;
    totalNetBalance: number;
    averageFunding: number;
    positiveBalanceCount: number;
    negativeBalanceCount: number;
  };
  error?: string;
}> {
  try {
    const result = await getAllClubsWithFunding();

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || 'Failed to fetch data',
      };
    }

    const clubs = result.data;
    const totalFunding = clubs.reduce((sum, club) => sum + club.funding, 0);
    const totalCost = clubs.reduce((sum, club) => sum + club.totalCost, 0);
    const totalNetBalance = clubs.reduce(
      (sum, club) => sum + club.netBalance,
      0,
    );

    return {
      success: true,
      summary: {
        totalClubs: clubs.length,
        totalFunding,
        totalCost,
        totalNetBalance,
        averageFunding: clubs.length > 0 ? totalFunding / clubs.length : 0,
        positiveBalanceCount: clubs.filter((c) => c.netBalance > 0).length,
        negativeBalanceCount: clubs.filter((c) => c.netBalance < 0).length,
      },
    };
  } catch (error) {
    console.error('Error calculating club funding summary:', error);

    return {
      success: false,
      error: error instanceof Error ? error.message : 'UNKNOWN_ERROR',
    };
  }
}
