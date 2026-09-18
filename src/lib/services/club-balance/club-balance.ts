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
  deltaCost: number,
  increment: 'increment' | 'decrement',
) => {
  try {
    // Calculate net balance
    let netBalance;
    increment === 'increment'
      ? (netBalance = calculateNetBalance(clubBalance, deltaCost, true))
      : (netBalance = calculateNetBalance(clubBalance, deltaCost, false));

    if (!netBalance && netBalance !== 0) {
      return { success: false, message: 'Error calculating net balance' };
    }

    // Update total cost
    await prisma.clubBalance.update({
      where: { id: clubBalance.id },
      data: {
        totalCost: {
          increment: deltaCost,
        },
        netBalance,
      },
    });

    return { success: true, clubBalance };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Update Club Balance Net Value
export const updateClubBalanceNetValue = async (
  clubBalance: ClubBalance,
  deltaCost: number,
  increment: 'increment' | 'decrement',
) => {
  try {
    // Calculate net balance
    let netBalance;
    increment === 'increment'
      ? (netBalance = calculateNetBalance(clubBalance, deltaCost, true))
      : (netBalance = calculateNetBalance(clubBalance, deltaCost, false));

    if (!netBalance && netBalance !== 0) {
      return { success: false, message: 'Error calculating net balance' };
    }

    // Update net balance
    await prisma.clubBalance.update({
      where: { id: clubBalance.id },
      data: {
        netBalance,
      },
    });

    return { success: true, clubBalance };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Update Club Balance Paid status
export const updateClubBalancePaid = async (id: string, paid: boolean) => {
  try {
    const clubBalance = await prisma.clubBalance.update({
      where: { id },
      data: { paid },
    });

    return { success: true, clubBalance };
  } catch (error) {
    const notFound = (error as { code?: string }).code === 'P2025';

    return {
      success: false,
      notFound,
      message: (error as Error).message,
    };
  }
};
