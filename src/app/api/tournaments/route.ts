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
import { getTournamentCost } from '@lib/services/tournaments/tournament.cost';
import {
  createClubBalance,
  getClubBalanceByClubId,
  updateClubBalance,
} from '@lib/services/club-balance/club-balance';
import { ClubBalance } from '@lib/types';

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
    if (
      searchParams.get('name') ||
      searchParams.get('clubName') ||
      searchParams.get('clubId')
    ) {
      validationFilters = validateQueryParams(searchParams, filtersQuerySchema);

      if (validationFilters instanceof Response) {
        return validationFilters;
      }
    }

    let skip: number | undefined = (page - 1) * pageSize;
    let take: number | undefined = pageSize;

    // Build where clause
    const where: Prisma.TournamentWhereInput = {};
    if (validationFilters?.name) {
      where.name = {
        contains: validationFilters.name,
        mode: 'insensitive',
      };

      skip = undefined;
      take = undefined;
    }
    if (validationFilters?.club) {
      where.club = {
        name: {
          contains: validationFilters.club,
          mode: 'insensitive',
        },
      };

      skip = undefined;
      take = undefined;
    }
    if (validationFilters?.clubId) {
      where.clubId = {
        equals: validationFilters.clubId,
        mode: 'insensitive',
      };

      skip = undefined;
      take = undefined;
    }

    // Fetch data with pagination
    const [total, tournaments] = await prisma.$transaction([
      prisma.tournament.count(),
      prisma.tournament.findMany({
        skip,
        take,
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
    const tournamentCost = await getTournamentCost(validatedData);

    if (!tournamentCost.success) {
      return apiError(
        tournamentCost.message ?? 'Error calculating total cost',
        HttpStatusCode.INTERNAL_SERVER_ERROR,
      );
    }

    const tournament = await prisma.tournament.create({
      data: {
        ...validatedData,
        totalCost: tournamentCost.totalCost,
      },
    });

    const result = await getClubBalanceByClubId(validatedData.clubId);
    if (!result?.success) {
      // Create Club Balance
      await createClubBalance(
        validatedData.clubId,
        validatedData.year,
        tournamentCost.totalCost ?? 0,
      );
    } else {
      // Update Club Balance
      await updateClubBalance(
        result.clubBalance as ClubBalance,
        tournamentCost.totalCost as number,
        'increment',
      );
    }

    if (!tournament) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(tournament);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
