import { prisma } from '@lib/prisma';

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
