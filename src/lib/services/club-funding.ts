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
  const clubFundingAmount = clubFunding.amount;
  if (!clubFundingAmount) {
    return totalFunding;
  }
  const clubBalances = clubFunding.clubBalances;
  if (!clubBalances) {
    return totalFunding;
  }

  clubBalances.forEach((clubBalance) => {
    // If club net balance is positive, only some the difference between the clubFunding amount ant the net balance
    if (clubBalance.netBalance! > 0) {
      totalFunding += clubFundingAmount - clubBalance.netBalance!;
    } else {
      // Else some the clubFunding amount
      totalFunding += clubFundingAmount;
    }
  });

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
