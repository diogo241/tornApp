import { prisma } from '@lib/prisma';
import {
  apiError,
  apiListSuccess,
  HttpStatusCode,
  validateQueryParams,
} from '@lib/api';
import {
  filtersQuerySchema,
  insertClub,
  paginationQuerySchema,
} from '@lib/validators';
import { getSession } from '@lib/auth';
import { aggregateRefereeCostByClub } from '@lib/services/clubs/club-referee-cost';
import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '../../../../generated/prisma/client';

/**
 * GET /api/clubs
 * Retrieves a paginated list of clubs
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
    let { page = 1, pageSize = 10 } = validationPages;

    let validationFilters;
    // Validate query parameters
    if (searchParams.get('name')) {
      validationFilters = validateQueryParams(searchParams, filtersQuerySchema);

      if (validationFilters instanceof Response) {
        return validationFilters;
      }
    }

    let skip: number | undefined = (page - 1) * pageSize;
    let take: number | undefined = pageSize;

    // Build where clause
    const where: Prisma.ClubWhereInput = {};
    if (validationFilters?.name) {
      where.name = {
        contains: validationFilters.name,
        mode: 'insensitive',
      };
      skip = undefined;
      take = undefined;
    }

    // Fetch data with pagination
    const [total, clubs] = await prisma.$transaction([
      prisma.club.count(),
      prisma.club.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          name: true,
          createdAt: true,
          updatedAt: true,
          clubBalance: true,
          tournaments: { select: { id: true } },
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // Sum referee assignment costs for every tournament owned by the listed clubs
    const tournamentIds = clubs.flatMap((club) =>
      club.tournaments.map((tournament) => tournament.id),
    );

    const groupedCosts = tournamentIds.length
      ? await prisma.refereeAssignment.groupBy({
          by: ['tournamentId'],
          where: { tournamentId: { in: tournamentIds } },
          _sum: { totalCost: true },
        })
      : [];

    const refereeCostByClub = aggregateRefereeCostByClub(clubs, groupedCosts);

    const data = clubs.map(({ tournaments, ...club }) => ({
      ...club,
      refereeCost: refereeCostByClub[club.id] ?? 0,
    }));

    // Build response
    const response = apiListSuccess(data, total);

    return response;
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * POST /api/clubs
 * Creates a new club
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
    const validatedData = insertClub.parse(data);

    // Create club
    const club = await prisma.club.create({
      data: validatedData,
    });
    if (!club) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(club);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
