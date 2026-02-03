import { prisma } from '@lib/prisma';
import {
  apiError,
  apiListSuccess,
  HttpStatusCode,
  validateQueryParams,
} from '@lib/api';
import { filtersQuerySchema, paginationQuerySchema } from '@lib/validators';
import { getSession } from '@lib/auth';
import { type NextRequest } from 'next/server';
import type { Prisma } from '../../../../generated/prisma/client';
import { createTournament } from '@lib/services/tournament';

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

    let validationFilters;
    // Validate query parameters
    if (searchParams.get('name')) {
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
    // const session = await getSession();
    // if (!session) {
    //   return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    // }

    // Create service
    const result = await createTournament(prisma, request);

    return result;
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
