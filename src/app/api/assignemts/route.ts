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
        select: {
          countA: true,
          countB: true,
          countC: true,
          countARef: true,
          countBRef: true,
          countCRef: true,
          createdAt: true,
          updatedAt: true,
          referee: {
            select: {
              name: true,
            },
          },
          tournament: {
            select: {
              name: true,
            },
          },
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

    // Validate request body
    const data = await request.json();

    // Create refereeAssignment
    const refereeAssignment = await prisma.refereeAssignment.create({
      data,
    });
    if (!refereeAssignment) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(refereeAssignment);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
