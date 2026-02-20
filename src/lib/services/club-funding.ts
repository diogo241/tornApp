import { prisma } from '@lib/prisma';
import type { ClubFunding } from '@lib/types';

// Get club funding by club id
export const getClubFundingById = async (id: string) => {
  try {
    const clubFunding = await prisma.clubFunding.findFirst({
      where: { id },
      include: {
        clubBalances: true,
      },
    });

    if (!clubFunding) {
      return null;
    }

    return { success: true, clubFunding };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Calculate total funding to club
export const getTotalFunding = (clubFunding: ClubFunding) => {
  let totalFunding = 0;

  const totalBalances = clubFunding.clubBalances?.length ?? 0;
  totalFunding += clubFunding.amount * totalBalances;

  return totalFunding;
};

// Get club funding
export const getClubFunding = async () => {
  try {
    const clubFunding = await prisma.clubFunding.findFirst({
      where: {
        amount: {
          gt: 0,
        },
      },
      include: {
        clubBalances: true,
      },
    });

    if (!clubFunding) {
      return {
        success: false,
        message: 'No club funding found',
      };
    }

    return { success: true, clubFunding };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};
