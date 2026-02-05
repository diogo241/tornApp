import { prisma } from '@lib/prisma';
import {
  apiError,
  apiListSuccess,
  HttpStatusCode,
  validateQueryParams,
} from '@lib/api';
import {
  filtersQuerySchema,
  insertRefereeAssignment,
  paginationQuerySchema,
} from '@lib/validators';
import { getSession } from '@lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '../../../../generated/prisma/client';
import {
  checkNumberOfGames,
  getAssignmentTotalCost,
  isRefereeUnassigned,
  validateAssignedGames,
} from '@lib/services/assignemt';
import { getRemainingGames } from '@lib/services/tournaments/tournament.games';
import type { Tournament } from '@lib/types';
import { getTournamentById } from '@lib/services/tournaments/tournament.helpers';
import { updateRefereeCost } from '@lib/services/referee';

/**
 * GET /api/assignemts
 * Retrieves a paginated list of assignemts
 *
 * Query parameters:
 * - page: Page number (default: 1, must be positive integer)
 * - pageSize: Items per page (default: 10, max: 100)
 */
export const GET = async (request: NextRequest) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }

    // Validate query parameters
    const { searchParams } = new URL(request.url);

    const validationPages = validateQueryParams(
      searchParams,
      paginationQuerySchema,
    );

    if (validationPages instanceof Response) {
      return validationPages;
    }
    const { page = 1, pageSize = 10 } = validationPages;

    // Validate filters
    let validationFilters;
    // Validate query parameters
    if (searchParams.get('tournamentId') || searchParams.get('refereeId')) {
      validationFilters = validateQueryParams(searchParams, filtersQuerySchema);

      if (validationFilters instanceof Response) {
        return validationFilters;
      }
    }

    // Build where clause
    let where: Prisma.RefereeAssignmentWhereInput = {};
    if (validationFilters?.refereeId) {
      where.refereeId = {
        equals: validationFilters.refereeId,
        mode: 'insensitive',
      };
    }
    if (validationFilters?.tournamentId) {
      where.tournamentId = {
        equals: validationFilters.tournamentId,
        mode: 'insensitive',
      };
    }

    // Fetch data with pagination
    const [total, assignemts] = await prisma.$transaction([
      prisma.refereeAssignment.count(),
      prisma.refereeAssignment.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        include: {
          tournament: true,
          referee: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // Build response
    const response = apiListSuccess(assignemts, total);

    return response;
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * POST /api/assignemts
 * Creates a new refereeAssignment
 */
export const POST = async (request: NextRequest) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }

    const data = await request.json();

    // Validate request body
    const assignemt = insertRefereeAssignment.parse(data);

    // Get the tournament
    const tournament = await getTournamentById(assignemt.tournamentId);
    if (!tournament) {
      return apiError('Tournament not found', HttpStatusCode.NOT_FOUND);
    }

    // Check if referee is already assigned to the tournament
    const isNotAssigned = await isRefereeUnassigned(
      assignemt,
      tournament.assignments,
    );
    if (!isNotAssigned.success) {
      return apiError(
        isNotAssigned.message ?? 'Referee is already assigned',
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // Validate if games are valid for the tournament
    const validGames = await checkNumberOfGames(assignemt, tournament);
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
    const canBeAssigned = validateAssignedGames(
      assignemt,
      remainingGames.games,
    );
    if (canBeAssigned.success === false) {
      return apiError(
        canBeAssigned.message ?? 'Invalid games',
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // Calculate total cost
    const assigmentTotalCost = await getAssignmentTotalCost(
      assignemt,
      tournament.rate,
    );

    if (!assigmentTotalCost.success) {
      return apiError(
        assigmentTotalCost.message ?? 'Error calculating total cost',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    // Create refereeAssignment
    const refereeAssignment = await prisma.refereeAssignment.create({
      data: {
        ...assignemt,
        totalCost: assigmentTotalCost.totalCost,
      },
    });

    // Increment referee total cost
    await updateRefereeCost(
      refereeAssignment.refereeId,
      assigmentTotalCost.totalCost!,
    );

    return NextResponse.json(refereeAssignment);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
