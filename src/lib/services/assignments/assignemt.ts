import { prisma } from '@lib/prisma';
import type { RefereeAssignment } from '@lib/types';

// Get assignment by tournament id
export const getAssignmentsByTournamentId = async (
  tournamentId: string,
): Promise<RefereeAssignment[] | null> => {
  try {
    const assignments = await prisma.refereeAssignment.findMany({
      where: { tournamentId },
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

// Update assignment total cost
export const updateAssignmentTotalCost = async (
  assignment: RefereeAssignment,
  totalCost: number,
) => {
  try {
    await prisma.refereeAssignment.update({
      where: { id: assignment.id },
      data: { totalCost },
    });

    return { success: true, totalCost };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};
