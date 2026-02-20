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
        return {
          name: club.name,
          netBalance: club.clubBalance?.netBalance,
          totalCost: club.clubBalance?.totalCost ?? 0,
        };
      })
      // Get only clubs with totalCost > 0, with tournaments
      .filter((club): club is ProcessedClubFundingData => club.totalCost > 0);

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
