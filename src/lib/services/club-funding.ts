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
export const getTotalFunding = (clubFundings: ClubFunding[]) => {
  try {
    let totalFunding = 0;

    for (const clubFunding of clubFundings) {
      const totalBalances = clubFunding.clubBalances?.length ?? 0;
      totalFunding += clubFunding.amount * totalBalances;
    }

    return totalFunding;
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};
