import { prisma } from '@lib/prisma';
import type { RefereeAssignment } from '@lib/types';

// Update referee total cost
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


// Get assignments by referee id
export const getAssignmentsByRefereeId = async (refereeId: string): Promise<RefereeAssignment[] | null> => {
  try {
    const assignments = await prisma.refereeAssignment.findMany({
      where: { refereeId },
      include: { referee: true },
    });

    if (!assignments) {
      return null;
    }

    return assignments;
  } catch (error) {
    return null;
  }
};
