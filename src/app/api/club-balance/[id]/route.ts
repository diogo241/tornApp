import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import {
  API_MESSAGES,
  apiError,
  handleValidationError,
  HttpStatusCode,
} from '@lib/api';
import { getSession } from '@lib/auth';
import { updateClubBalancePaid as updateClubBalancePaidSchema } from '@lib/validators';
import { updateClubBalancePaid } from '@lib/services/club-balance/club-balance';

/**
 * PUT /api/club-balance/:id
 * Updates the paid status of a club balance
 */
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }

    const { id } = await params;
    if (!id) {
      return apiError(API_MESSAGES.invalidId, HttpStatusCode.BAD_REQUEST);
    }

    // Validate request body
    const data = await request.json();
    let validatedData;
    try {
      validatedData = updateClubBalancePaidSchema.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error);
      }
      throw error;
    }

    const result = await updateClubBalancePaid(id, validatedData.paid);

    if (!result.success || !result.clubBalance) {
      return result.notFound
        ? apiError(API_MESSAGES.notFound, HttpStatusCode.NOT_FOUND)
        : apiError(
            API_MESSAGES.serverError,
            HttpStatusCode.INTERNAL_SERVER_ERROR,
          );
    }

    return NextResponse.json(result.clubBalance);
  } catch (error) {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
