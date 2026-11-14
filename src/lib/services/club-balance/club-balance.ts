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
    console.error('Failed to get club balance by club id', error);
    return {
      success: false,
      message: 'Não foi possível obter o saldo do clube',
    };
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
      return {
        success: false,
        message: 'Não foi encontrado financiamento municipal para este ano',
      };
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
    console.error('Failed to save club balance', error);
    return {
      success: false,
      message: 'Não foi possível guardar o saldo do clube',
    };
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
      return {
        success: false,
        message: 'Não foi possível calcular o saldo líquido',
      };
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
    console.error('Failed to save club balance', error);
    return {
      success: false,
      message: 'Não foi possível guardar o saldo do clube',
    };
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
      return {
        success: false,
        message: 'Não foi possível calcular o saldo líquido',
      };
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
    console.error('Failed to save club balance', error);
    return {
      success: false,
      message: 'Não foi possível guardar o saldo do clube',
    };
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
    console.error('Failed to update club balance paid status', error);
    const notFound = (error as { code?: string }).code === 'P2025';

    return {
      success: false,
      notFound,
      message: 'Não foi possível atualizar o estado de pagamento do clube',
    };
  }
};
