import { prisma } from '@lib/prisma';
import { matchesSearch } from '@lib/search';
import {
  API_MESSAGES,
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
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
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

    // The name filter runs in memory so accents and word order do not matter
    if (validationFilters?.name) {
      skip = undefined;
      take = undefined;
    }

    // Fetch data with pagination
    const [total, rates] = await prisma.$transaction([
      prisma.rate.count(),
      prisma.rate.findMany({
        skip,
        take,
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

    const filteredRates = validationFilters?.name
      ? rates.filter((rate) =>
          matchesSearch(rate.name, validationFilters.name),
        )
      : rates;

    // Build response
    const response = apiListSuccess(filteredRates, total);

    return response;
  } catch (error) {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
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
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
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
      return apiError(API_MESSAGES.notFound, HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(rate);
  } catch (error) {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
