import type { Rate, RefereeAssignment, Tournament } from '@lib/types';
import { prisma } from '@lib/prisma';
import { getAssignmentTotalCost } from '../assignemt';
import { updateRefereeCost } from '../referee';

// Update tournaments total cost on rate update
export const updateTournamentAfterRateUpdate = async (
  tournaments: Tournament[],
  rate: Rate,
) => {
  try {
    await prisma.$transaction(
      async (tx) => {
        for (const tournament of tournaments) {
          // Update tournament cost
          const tournamentCost = await updateTournamentCost(tournament, rate);

          if (!tournamentCost.success) {
            throw new Error(
              `Error updating cost for tournament ${tournament.id}`,
            );
          }

          await tx.tournament.update({
            where: { id: tournament.id },
            data: { totalCost: tournamentCost.totalCost },
          });

          // Get the assignments
          const assignments = await tx.refereeAssignment.findMany({
            where: { tournamentId: tournament.id },
          });

          for (const assignment of assignments) {
            const newAssignmentCost = await getAssignmentTotalCost(
              assignment,
              rate,
              tournament,
            );

            if (
              !newAssignmentCost.success ||
              newAssignmentCost.totalCost === undefined
            ) {
              throw new Error(
                `Error updating cost for assignment ${assignment.id}`,
              );
            }

            // Calculate Delta
            const costDelta =
              newAssignmentCost.totalCost - assignment.totalCost;

            // Update the assignment
            await tx.refereeAssignment.update({
              where: { id: assignment.id },
              data: { totalCost: newAssignmentCost.totalCost },
            });

            // Update the referee total cost by the DIFFERENCE
            await tx.referee.update({
              where: { id: assignment.refereeId },
              data: {
                totalCost: {
                  increment: costDelta,
                },
              },
            });
          }
        }
      },
      {
        timeout: 10000,
      },
    );

    return { success: true };
  } catch (error) {
    console.error('Transaction failed:', error);
    return { success: false, message: (error as Error).message };
  }
};

// Update tournament total cost
export const updateTournamentCost = async (
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
