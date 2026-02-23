import { prisma } from '@lib/prisma';
import {
  apiError,
  apiListSuccess,
  HttpStatusCode,
  validateQueryParams,
} from '@lib/api';
import { paginationQuerySchema } from '@lib/validators';
import { getSession } from '@lib/auth';
import { type NextRequest } from 'next/server';
import { getClubFunding, getTotalFunding } from '@lib/services/club-funding';

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

    // Fetch data
    const total = await prisma.clubFunding.count();
    const { success, clubFunding } = await getClubFunding();
    if (!success && !clubFunding) {
      return apiError('No club funding found', HttpStatusCode.NOT_FOUND);
    }

    const totalFundingCost = getTotalFunding(clubFunding!);
    const enrichedFunding = [
      {
        ...clubFunding,
        totalFundingCost,
      },
    ];

    // Build response
    const response = apiListSuccess(enrichedFunding, total);

    return response;
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
