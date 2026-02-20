import type { Rate, Tournament } from '@lib/types';
import { prisma } from '@lib/prisma';

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
