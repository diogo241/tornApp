import { prisma } from '@lib/prisma';
import {
  apiError,
  apiListSuccess,
  HttpStatusCode,
  validateQueryParams,
} from '@lib/api';
import { filtersQuerySchema, paginationQuerySchema } from '@lib/validators';
import { getSession } from '@lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '../../../../generated/prisma/client';

/**
 * GET /api/referees
 * Retrieves a paginated list of referees
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

    let skip: number | undefined = (page - 1) * pageSize;
    let take: number | undefined = pageSize;

    // Build where clause
    const where: Prisma.RefereeWhereInput = {};
    if (validationFilters?.name) {
      where.name = {
        contains: validationFilters.name,
        mode: 'insensitive',
      };

      skip = undefined;
      take = undefined;
    }

    // Fetch data with pagination
    const [total, referees] = await prisma.$transaction([
      prisma.referee.count(),
      prisma.referee.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          name: true,
          totalCost: true,
          paid: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          name: 'asc',
        },
      }),
    ]);

    // Build response
    const response = apiListSuccess(referees, total);

    return response;
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * POST /api/referees
 * Creates a new referee
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

    // Create referee
    const referee = await prisma.referee.create({
      data,
    });
    if (!referee) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(referee);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
