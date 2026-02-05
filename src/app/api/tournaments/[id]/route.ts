import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@lib/prisma';
import { apiError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { convertToPlainObject } from '@lib/utils';
import { updateTournamentCost } from '@lib/services/tournaments/tournament.cost';
import { insertTournament } from '@lib/validators';
import { getTournamentById } from '@lib/services/tournaments/tournament.helpers';

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

    const tournament = await getTournamentById(id);
    if (!tournament) {
      return apiError('Tournament not found', HttpStatusCode.NOT_FOUND);
    }

    // Update tournament value
    const tournamentCost = await updateTournamentCost(validatedData, tournament.rate);

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

    if (!tournament) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(tournament);
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

    // Delete tournament
    const tournament = await prisma.tournament.delete({
      where: { id },
    });

    if (!tournament) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(tournament);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
