import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@lib/prisma';
import { apiError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { insertClubFunding } from '@lib/validators';
import { getClubFundingById } from '@lib/services/club-funding';
import { updateClubBalanceNetValue } from '@lib/services/club-balance/club-balance';

/**
 * GET /api/club-funding/:id
 * Retrieves a single club funding by ID
 */
export const GET = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }
    const { id } = await params;
    if (!id) {
      return apiError('Invalid ID', HttpStatusCode.BAD_REQUEST);
    }

    const clubFunding = await getClubFundingById(id);

    if (!clubFunding?.success) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(clubFunding.clubFunding);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * PUT /api/club-funding/:id
 * Updates a single club by ID
 */
export const PUT = async (
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }
    const { id } = await params;
    if (!id) {
      return apiError('Invalid ID', HttpStatusCode.BAD_REQUEST);
    }

    // Validate request body
    const data = await request.json();
    const validatedData = insertClubFunding.parse(data);

    // Get clubFunding latest value
    const oldClubFunding = await getClubFundingById(id);
    if (!oldClubFunding?.success) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }
    // Get clubFunding delta
    const deltaClubFunding =
      oldClubFunding.clubFunding!.amount - validatedData.amount;

    // Update Club Balances with delta
    if (oldClubFunding.clubFunding!.clubBalances.length !== 0) {
      for (const clubBalance of oldClubFunding.clubFunding!.clubBalances) {
        await updateClubBalanceNetValue(
          clubBalance,
          deltaClubFunding,
          deltaClubFunding > 0 ? 'increment' : 'decrement',
        );
      }
    }

    // Update clubFunding
    const clubFunding = await prisma.clubFunding.update({
      where: { id },
      data: validatedData,
    });

    if (!clubFunding) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(clubFunding);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
