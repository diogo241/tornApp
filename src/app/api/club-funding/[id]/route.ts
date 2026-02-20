import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@lib/prisma';
import { apiError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { insertClubFunding } from '@lib/validators';

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

    const clubFunding = await prisma.clubFunding.findFirst({
      where: { id },
      include: {
        clubBalances: true,
      },
    });

    if (!clubFunding) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(clubFunding);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * PUT /api/clubs/:id
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
