import { prisma } from '@lib/prisma';
import {
  apiError,
  apiListSuccess,
  HttpStatusCode,
  validateQueryParams,
} from '@lib/api';
import {
  filtersQuerySchema,
  insertTournament,
  paginationQuerySchema,
} from '@lib/validators';
import { getSession } from '@lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '../../../../generated/prisma/client';
import { updateTournamentCost } from '@lib/services/tournament';

/**
 * GET /api/tournaments
 * Retrieves a paginated list of tournaments
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

    // Validate query parameters
    let validationFilters;
    if (searchParams.get('name') || searchParams.get('clubName')) {
      validationFilters = validateQueryParams(searchParams, filtersQuerySchema);

      if (validationFilters instanceof Response) {
        return validationFilters;
      }
    }

    // Build where clause
    const where: Prisma.TournamentWhereInput = {};
    if (validationFilters?.name) {
      where.name = {
        contains: validationFilters.name,
        mode: 'insensitive',
      };
    }
    if (validationFilters?.club) {
      where.club = {
        name: {
          contains: validationFilters.club,
          mode: 'insensitive',
        },
      };
    }

    // Fetch data with pagination
    const [total, tournaments] = await prisma.$transaction([
      prisma.tournament.count(),
      prisma.tournament.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        where,
        select: {
          id: true,
          name: true,
          startDate: true,
          endDate: true,
          totalGames: true,
          totalCost: true,
          club: true,
          rate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // Build response
    const response = apiListSuccess(tournaments, total);

    return response;
  } catch (error) {
    console.log(error);
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * POST /api/tournaments
 * Creates a new rate
 */
export const POST = async (request: NextRequest) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }

    // Validate request body
    const data = await request.json();
    const validatedData = insertTournament.parse(data);

    // Calculate total cost
    const totalCost = await updateTournamentCost(validatedData);

    if (!totalCost) {
      return apiError('Total cost error', HttpStatusCode.BAD_REQUEST);
    }

    const tournament = await prisma.tournament.create({
      data: {
        ...validatedData,
        totalCost,
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
