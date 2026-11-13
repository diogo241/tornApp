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
    console.error('Failed to update referee cost', error);
    return {
      success: false,
      message: 'Não foi possível atualizar o custo do árbitro',
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
