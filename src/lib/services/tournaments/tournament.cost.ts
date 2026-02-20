import type { Rate, RefereeAssignment, Tournament } from '@lib/types';
import { prisma } from '@lib/prisma';
import { getAssignmentTotalCost } from '../assignments/assignemt.helpers';
import { updateRefereeCost } from '../referee';
import { Referee } from '../../types';

// Get tournament total cost
export const getTournamentCost = async (
  tournament: Tournament,
  rate?: Rate,
) => {
  try {
    const { countA, durationA, countB, durationB, countC, durationC, rateId } =
      tournament;

    if (!countA || countA <= 0) {
      throw new Error('Count A is not valid');
    }

    // If no rate is provided, get the rate from the tournament
    let activeRate = rate;
    if (!activeRate) {
      if (!rateId) throw new Error('No Rate ID associated with tournament');

      activeRate =
        (await prisma.rate.findFirst({
          where: { id: rateId },
        })) ?? undefined;

      if (!activeRate) throw new Error('Rate not found');
    }

    // Calculate cost per minute
    let costPerMinute;

    // Use  aRate if players is 11
    activeRate?.players === 11
      ? (costPerMinute = (activeRate.aRate ?? 0) + activeRate.refRate)
      : (costPerMinute = activeRate.refRate);

    // Calculate total cost, validate if B and C are not null
    let totalCost = durationA * costPerMinute * countA;

    if (durationB && countB) {
      totalCost += durationB * costPerMinute * countB;
    }
    if (durationC && countC) {
      totalCost += durationC * costPerMinute * countC;
    }
    if (!totalCost || totalCost <= 0) {
      throw new Error('Error calculating total cost');
    }

    return { success: true, totalCost };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Update tournament total cost
export const updateTournamentCost = async (
  tournament: Tournament,
  totalCost: number,
) => {
  try {
    await prisma.tournament.update({
      where: { id: tournament.id },
      data: { totalCost },
    });

    return { success: true, totalCost };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Update Assignemnt total cost and referee total cost
export const updateAssignmentTotalCost = async (
  assignment: RefereeAssignment,
  tournament: Tournament,
) => {
  try {
    const { totalCost } = await getAssignmentTotalCost(
      assignment,
      tournament.rate!,
      tournament,
    );

    if (!totalCost || totalCost === 0) {
      return {
        success: false,
        message: 'Error getting total cost for assignment',
      };
    }

    const updatedAssignment = await prisma.refereeAssignment.update({
      where: { id: assignment.id },
      data: {
        totalCost,
      },
      include: {
        referee: true,
      },
    });

    if (!updatedAssignment) {
      return {
        success: false,
        message: 'Error updating assignment total cost',
      };
    }

    const costDelta = updatedAssignment.totalCost! - assignment.totalCost!;

    // Update referee total cost
    const referee = await updateRefereeCost(
      updatedAssignment.refereeId,
      costDelta,
    );
    if (!referee) {
      return {
        success: false,
        message: 'Error updating referee total cost',
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};
