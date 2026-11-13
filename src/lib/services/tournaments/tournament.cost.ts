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
      return {
        success: false,
        message:
          'O torneio tem de ter pelo menos um jogo com duração principal',
      };
    }

    // If no rate is provided, get the rate from the tournament
    let activeRate = rate;
    if (!activeRate) {
      if (!rateId) {
        return {
          success: false,
          message: 'O torneio não tem um valor por jogo associado',
        };
      }

      activeRate =
        (await prisma.rate.findFirst({
          where: { id: rateId },
        })) ?? undefined;

      if (!activeRate) {
        return {
          success: false,
          message: 'O valor por jogo associado ao torneio não existe',
        };
      }
    }

    // Calculate cost per minute
    let costPerMinute;

    // Use  aRate if players is 11
    activeRate?.players === 11
      ? (costPerMinute = (activeRate.aRate! * 2) + activeRate.refRate)
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
      return {
        success: false,
        message: 'Não foi possível calcular o custo do torneio',
      };
    }

    return { success: true, totalCost };
  } catch (error) {
    console.error('Failed to calculate tournament cost', error);
    return {
      success: false,
      message: 'Não foi possível calcular o custo do torneio',
    };
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
    console.error('Failed to update tournament cost', error);
    return {
      success: false,
      message: 'Não foi possível guardar o custo do torneio',
    };
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
        message: 'Não foi possível calcular o custo do jogo',
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
        message: 'Não foi possível atualizar o custo do jogo',
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
        message: 'Não foi possível atualizar o custo do árbitro',
      };
    }

    return { success: true };
  } catch (error) {
    console.error('Failed to update assignment and referee total cost', error);
    return {
      success: false,
      message: 'Não foi possível atualizar o custo do jogo',
    };
  }
};
