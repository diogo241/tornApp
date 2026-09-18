import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@lib/prisma';
import { apiError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { convertToPlainObject } from '@lib/utils';
import {
  getTournamentCost,
  updateAssignmentTotalCost,
} from '@lib/services/tournaments/tournament.cost';
import { insertTournament } from '@lib/validators';
import { getTournamentById } from '@lib/services/tournaments/tournament.helpers';
import {
  getClubBalanceByClubId,
  updateClubBalance,
} from '@lib/services/club-balance/club-balance';
import type { ClubBalance } from '@lib/types';
import { getAssignmentTotalCost } from '@lib/services/assignments/assignemt.helpers';
import { updateRefereeCost } from '@lib/services/referee';
import { getAssignmentsByTournamentId } from '@lib/services/assignments/assignemt';

/**
 * GET /api/tournaments/:id
 * Retrieves a single club by ID
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }
    const { id } = await params;
    if (!id) {
      return apiError('Invalid ID', HttpStatusCode.BAD_REQUEST);
    }

    const tournament = await prisma.tournament.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        startDate: true,
        endDate: true,
        totalGames: true,
        totalCost: true,
        durationA: true,
        countA: true,
        countB: true,
        durationB: true,
        countC: true,
        durationC: true,
        club: true,
        rate: true,
        clubId: true,
        rateId: true,
        createdAt: true,
        updatedAt: true,
        assignments: {
          select: {
            countA: true,
            countB: true,
            countC: true,
            countARef: true,
            countBRef: true,
            countCRef: true,
          },
        },
      },
    });

    if (!tournament) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(convertToPlainObject(tournament));
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * PUT /api/tournaments/:id
 * Updates a single club by ID
 */
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }
    const { id } = await params;
    if (!id) {
      return apiError('Invalid ID', HttpStatusCode.BAD_REQUEST);
    }

    // Validate request body
    const data = await request.json();
    const validatedData = insertTournament.parse(data);

    const oldTournament = await getTournamentById(id);
    if (!oldTournament) {
      return apiError('Tournament not found', HttpStatusCode.NOT_FOUND);
    }

    // Update tournament value
    const tournamentCost = await getTournamentCost(
      validatedData,
      oldTournament.rate,
    );

    if (!tournamentCost.success) {
      return apiError(
        tournamentCost.message ?? 'Error calculating total cost',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    // Update tournament
    await prisma.tournament.update({
      where: { id },
      data: {
        ...validatedData,
        totalCost: tournamentCost.totalCost,
      },
    });

    const updatedTournament = await getTournamentById(id);
    if (!updatedTournament) {
      return apiError('Updated Tournament not found', HttpStatusCode.NOT_FOUND);
    }

    // Update Club Balance
    // Get tournament delta total cost / increase or decrease
    const tournamentDeltaCost =
      updatedTournament.totalCost - oldTournament.totalCost;
    const clubBalance = await getClubBalanceByClubId(oldTournament.clubId);

    if (!clubBalance?.success) {
      return apiError(
        'Error getting club balance',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    await updateClubBalance(
      clubBalance.clubBalance as ClubBalance,
      tournamentDeltaCost,
      tournamentDeltaCost > 0 ? 'increment' : 'decrement',
    );

    // Update tournament assignemnts
    if (updatedTournament.assignments) {
      for (const assignemt of updatedTournament.assignments) {
        await updateAssignmentTotalCost(assignemt, updatedTournament);
      }
    }

    return NextResponse.json(updatedTournament);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * DELETE /api/tournaments/:id
 * Deletes a single club by ID
 */
export const DELETE = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }
    const { id } = await params;
    if (!id) {
      return apiError('Invalid ID', HttpStatusCode.BAD_REQUEST);
    }

    // Update referee total cost, reducing assignments cost
    const assignments = await getAssignmentsByTournamentId(id);
    if (assignments) {
      assignments.forEach(async (assig) => {
        const referee = await updateRefereeCost(assig?.referee?.id as string, -assig.totalCost!);
        if (!referee) {
          return apiError(
            'Error updating referee total cost',
            HttpStatusCode.INTERNAL_SERVER_ERROR,
          );
        }
      });
    }

    // Delete tournament
    const tournament = await prisma.tournament.delete({
      where: { id },
    });

    // Update Club Balance
    const clubBalance = await getClubBalanceByClubId(tournament.clubId);

    if (!clubBalance?.success) {
      return apiError(
        'Error getting club balance',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    await updateClubBalance(
      clubBalance.clubBalance as ClubBalance,
      -tournament.totalCost,
      'decrement',
    );

    if (!tournament) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(tournament);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
