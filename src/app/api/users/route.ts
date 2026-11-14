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
  insertUser,
  paginationQuerySchema,
} from '@lib/validators';
import { createUser, getSession } from '@lib/auth';
import { NextResponse, type NextRequest } from 'next/server';

/**
 * GET /api/users
 * Retrieves a paginated list of users
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
    const [total, users] = await prisma.$transaction([
      prisma.user.count(),
      prisma.user.findMany({
        skip,
        take,
        select: {
          id: true,
          name: true,
          email: true,
          createdAt: true,
          updatedAt: true,
          sessions: true,
        },
        orderBy: {
          createdAt: 'desc',
        },
      }),
    ]);

    const filteredUsers = validationFilters?.name
      ? users.filter((user) =>
          matchesSearch(user.name, validationFilters.name),
        )
      : users;

    // Build response
    const response = apiListSuccess(filteredUsers, total);

    return response;
  } catch (error) {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
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
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }

    // Validate request body
    const data = await request.json();
    const { email, name, password } = insertUser.parse(data);

    const user = await createUser({
      email,
      name,
      password,
    });

    return NextResponse.json(user);
  } catch (error) {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
