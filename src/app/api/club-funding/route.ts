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
import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '../../../../generated/prisma/client';
import { getTotalFunding } from '@lib/services/club-funding';

/**
 * GET /api/club-funding
 * Retrieves a paginated list of club-funding
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

    // Fetch data with pagination
    const [total, clubFunding] = await prisma.$transaction([
      prisma.clubFunding.count(),
      prisma.clubFunding.findMany({
        skip: (page - 1) * pageSize,
        take: pageSize,
        select: {
          id: true,
          amount: true,
          year: true,
          createdAt: true,
          updatedAt: true,
          clubBalances: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const totalFundingCost = getTotalFunding(clubFunding);
    const enrichedFunding = clubFunding.map((item) => ({
      ...item,
      totalFundingCost,
    }));

    // Build response
    const response = apiListSuccess(enrichedFunding, total);

    return response;
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
