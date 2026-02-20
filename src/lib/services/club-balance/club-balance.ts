import { prisma } from '@lib/prisma';
import type { ClubBalance } from '@lib/types';
import { calculateNetBalance } from './club-balance.helpers';

// Get Club Balance by Club Id
export const getClubBalanceByClubId = async (clubId: string) => {
  try {
    const clubBalance = await prisma.clubBalance.findFirst({
      where: { clubId },
      include: {
        clubFunding: true,
        club: true,
      },
    });

    if (!clubBalance) {
      return null;
    }

    return { success: true, clubBalance };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Create Club Balance
export const createClubBalance = async (
  clubId: string,
  year: number,
  totalCost: number,
) => {
  try {
    // Get Club Funding for this year
    const clubFunding = await prisma.clubFunding.findFirst({
      where: { year },
    });

    if (!clubFunding) {
      return { success: false, message: 'Club Funding not found' };
    }

    const clubBalance = await prisma.clubBalance.create({
      data: {
        clubId,
        year,
        totalCost,
        clubFundingId: clubFunding?.id,
        netBalance: clubFunding?.amount - totalCost,
      },
    });

    return { success: true, clubBalance };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Update Club Balance
export const updateClubBalance = async (
  clubBalance: ClubBalance,
  tournamentCost: number,
  increment: 'increment' | 'decrement',
) => {
  try {
    // Calculate net balance
    let netBalance;
    increment === 'increment'
      ? (netBalance = calculateNetBalance(clubBalance, tournamentCost, true))
      : (netBalance = calculateNetBalance(clubBalance, tournamentCost, false));
    
  console.log("tournamentCost", tournamentCost);
  console.log("clubBalance", clubBalance);
  console.log("netBalance", netBalance);

    if (!netBalance) {
      return { success: false, message: 'Error calculating net balance' };
    }

    // Update total cost
    await prisma.clubBalance.update({
      where: { id: clubBalance.id },
      data: {
        totalCost: {
          increment: tournamentCost,
        },
        netBalance,
      },
    });

    return { success: true, clubBalance };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};
