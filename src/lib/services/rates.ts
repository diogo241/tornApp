import { prisma } from '@lib/prisma';
import type { ClubBalance, Rate, Tournament } from '@lib/types';
import {
  getTournamentCost,
  updateTournamentCost,
} from './tournaments/tournament.cost';
import { getAssignmentTotalCost } from './assignments/assignemt.helpers';
import {
  getAssignmentsByTournamentId,
  updateAssignmentTotalCost,
} from './assignments/assignemt';
import { updateRefereeCost } from './referee';
import {
  getClubBalanceByClubId,
  updateClubBalance,
} from './club-balance/club-balance';

// Check if the rate values are the same
export const compareRateValues = (newRate: Rate, oldRate: Rate) => {
  try {
    if (
      newRate.refRate === oldRate.refRate &&
      newRate.aRate === oldRate.aRate
    ) {
      return {
        success: true,
      };
    }

    return {
      success: false,
      message: 'Rate values are not the same',
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};

// Updates on rate update
export const updateAfterRateUpdate = async (
  tournaments: Tournament[],
  rate: Rate,
) => {
  try {
    await prisma.$transaction(
      async (tx) => {
        for (const tournament of tournaments) {
          // Update tournament cost
          const tournamentCost = await getTournamentCost(tournament, rate);

          if (!tournamentCost.success) {
            throw new Error(
              `Error getting cost for tournament ${tournament.id}`,
            );
          }

          const updatedTournament = await updateTournamentCost(
            tournament,
            tournamentCost.totalCost as number,
          );

          // Update Club Balance
          // Get tournament delta total cost / increase or decrease
          const tournamentDeltaCost =
            updatedTournament.totalCost! - tournament.totalCost!;
          const clubBalance = await getClubBalanceByClubId(tournament.clubId);
          if (!clubBalance?.success) {
            throw new Error('Error getting club balance');
          }

          await updateClubBalance(
            clubBalance.clubBalance as ClubBalance,
            tournamentDeltaCost as number,
            tournamentDeltaCost > 0 ? 'increment' : 'decrement',
          );

          // Get the assignments
          const assignments = await getAssignmentsByTournamentId(
            tournament.id as string,
          );
          if (!assignments) return;

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
              newAssignmentCost.totalCost - assignment.totalCost!;

            // Update assignment total cost
            await updateAssignmentTotalCost(
              assignment,
              newAssignmentCost.totalCost,
            );

            // Update the referee total cost by the DIFFERENCE
            await updateRefereeCost(assignment.refereeId, costDelta);
          }
        }
      },
      {
        timeout: 10000,
      },
    );

    return { success: true };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Get tournaments by rate id
export const getTournamentsByRateId = async (rateId: string) => {
  try {
    const tournaments = await prisma.tournament.findMany({
      where: {
        rateId: rateId,
      },
    });

    if (!tournaments) {
      return null;
    }

    return tournaments;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};
