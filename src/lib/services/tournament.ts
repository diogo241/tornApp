import type { Tournament } from '@lib/types';
import { prisma } from '@lib/prisma';

// Update tournaments total cost on rate update
export const updateTournamentAfterRateUpdate = async (rateId: string) => {
  return await prisma.$transaction(async (tx) => {
    const tournaments = await tx.tournament.findMany({
      where: { rateId },
    });

    if (tournaments.length === 0) return [];

    const updatePromises = tournaments.map(async (tournament) => {
      const totalCost = await updateTournamentCost(tournament);

      if (totalCost === undefined || totalCost === null) {
        throw new Error(`Error updating cost for tournament ${tournament.id}`);
      }

      return tx.tournament.update({
        where: { id: tournament.id },
        data: { totalCost },
      });
    });

    return Promise.all(updatePromises);
  });
};

// Update tournament total cost
export const updateTournamentCost = async (tournament: Tournament) => {
  const { rateId, countA, durationA, countB, durationB, countC, durationC } =
    tournament;

  if (!countA || countA <= 0) {
    throw new Error('Count A is not valid');
  }

  // Get rate
  const rate = await prisma.rate.findFirst({
    where: {
      id: rateId,
    },
    select: {
      refRate: true,
      aRate: true,
      players: true,
    },
  });

  if (!rate) {
    throw new Error('Rate not found');
  }

  // Calculate cost per minute
  let costPerMinute;

  // Use  aRate if players is 11
  rate?.players === 11
    ? (costPerMinute = rate.aRate + rate.refRate)
    : (costPerMinute = rate.refRate);

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

  return totalCost;
};
