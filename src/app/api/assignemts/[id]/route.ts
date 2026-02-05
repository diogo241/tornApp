import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@lib/prisma';
import { apiError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { convertToPlainObject } from '@lib/utils';
import { insertRefereeAssignment } from '@lib/validators';
import { updateRefereeCost } from '@lib/services/referee';
import { getTournamentById } from '@lib/services/tournaments/tournament.helpers';
import {
  checkNumberOfGames,
  getAssignmentTotalCost,
  validateAssignedGames,
  validateChangedGameCount,
} from '@lib/services/assignemt';
import { getRemainingGames } from '@lib/services/tournaments/tournament.games';
import type { Tournament } from '@lib/types';

/**
 * GET /api/assignemts/:id
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

    const assignment = await prisma.refereeAssignment.findFirst({
      where: { id },
      include: {
        tournament: {
          include: {
            rate: true,
          },
        },
        referee: true,
      },
    });

    if (!assignment) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(convertToPlainObject(assignment));
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * PUT /api/assignments/:id
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

    // Get old assignment Data
    const oldAssignment = await prisma.refereeAssignment.findFirst({
      where: { id },
    });
    if (!oldAssignment) {
      return apiError('Assignment not found', HttpStatusCode.NOT_FOUND);
    }

    // Validate request body
    const data = await request.json();
    const newAssignemtData = insertRefereeAssignment.parse(data);

    // Get the tournament
    const tournament = await getTournamentById(newAssignemtData.tournamentId);
    if (!tournament) {
      return apiError('Tournament not found', HttpStatusCode.NOT_FOUND);
    }

    // Validate if games are valid for the tournament
    const validGames = await checkNumberOfGames(newAssignemtData, tournament);
    if (validGames.success === false) {
      return apiError(
        validGames.message ?? 'Invalid games',
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // Validate the remaining games for the tournament
    const remainingGames = await getRemainingGames(
      tournament.assignments,
      tournament as Tournament,
    );
    if (!remainingGames.games) {
      return apiError(
        'Error getting remaining games',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }
    if (remainingGames.success === false) {
      return apiError(
        remainingGames.message ?? 'Invalid games',
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // Compare the remaining games with the new assignment, check if the games can be assigned
    // Get the delta to pass the number of games
    const delta = validateChangedGameCount(newAssignemtData, oldAssignment);
    console.log(delta);

    const canBeAssigned = validateAssignedGames(
      {
        ...newAssignemtData,
        countA: delta.changes.countA,
        countB: delta.changes.countB,
        countC: delta.changes.countC,
        countARef: delta.changes.countARef,
        countBRef: delta.changes.countBRef,
        countCRef: delta.changes.countCRef,
      },
      remainingGames.games,
    );
    console.log('canBe', canBeAssigned);
    if (canBeAssigned.success === false) {
      return apiError(
        canBeAssigned.message ?? 'Invalid games',
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // Calculate total cost
    const assigmentTotalCost = await getAssignmentTotalCost(
      newAssignemtData,
      tournament.rate,
      tournament,
    );

    if (!assigmentTotalCost.success) {
      return apiError(
        assigmentTotalCost.message ?? 'Error calculating total cost',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    const newTotalCost = assigmentTotalCost.totalCost!;
    const costDelta = newTotalCost - oldAssignment.totalCost!;

    // Update assignment
    const assignment = await prisma.refereeAssignment.update({
      where: { id },
      data: {
        ...newAssignemtData,
        totalCost: assigmentTotalCost.totalCost,
      },
    });

    if (!assignment) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    // Update referee total cost
    await updateRefereeCost(assignment.refereeId, costDelta);

    return NextResponse.json(assignment);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * DELETE /api/assignments/:id
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

    // Delete assignment
    const assignment = await prisma.refereeAssignment.delete({
      where: { id },
    });

    // Update referee total cost
    await updateRefereeCost(assignment.refereeId, -assignment.totalCost!);

    if (!assignment) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(assignment);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
