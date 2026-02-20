import { prisma } from '@lib/prisma';
import {
  apiError,
  apiListSuccess,
  HttpStatusCode,
  validateQueryParams,
} from '@lib/api';
import {
  filtersQuerySchema,
  insertRate,
  paginationQuerySchema,
} from '@lib/validators';
import { getSession } from '@lib/auth';
import { NextResponse, type NextRequest } from 'next/server';
import type { Prisma } from '../../../../generated/prisma/client';
import { z } from 'better-auth';

/**
 * GET /api/rates
 * Retrieves a paginated list of rates
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
    const where: Prisma.RateWhereInput = {};
    if (validationFilters?.name) {
      where.name = {
        contains: validationFilters.name,
        mode: 'insensitive',
      };

      skip = undefined;
      take = undefined;
    }

    // Fetch data with pagination
    const [total, rates] = await prisma.$transaction([
      prisma.rate.count(),
      prisma.rate.findMany({
        skip,
        take,
        where,
        select: {
          id: true,
          name: true,
          players: true,
          refRate: true,
          aRate: true,
          createdAt: true,
          updatedAt: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    // Build response
    const response = apiListSuccess(rates, total);

    return response;
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * POST /api/rates
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
    const validatedData = insertRate.parse(data);

    // Create rate
    const rate = await prisma.rate.create({
      data: {
        ...validatedData,
        aRate: validatedData.aRate ?? 0,
      },
    });
    if (!rate) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(rate);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
