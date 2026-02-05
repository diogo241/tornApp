import { prisma } from '@lib/prisma';
import type { Referee } from '@lib/types';

// Increment referee total cost
export const updateRefereeCost = async (refereeId: string, amount: number) => {
  try {
    const updatedReferee = await prisma.referee.update({
      where: { id: refereeId },
      data: {
        totalCost: {
          increment: amount,
        },
      },
    });

    return {
      success: true,
      totalCost: updatedReferee.totalCost,
    };
  } catch (error) {
    return {
      success: false,
      message: error instanceof Error ? error.message : 'Failed to update cost',
    };
  }
};

