import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@lib/prisma';
import { apiError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { insertClub } from '@lib/validators';

/**
 * GET /api/clubs/:id
 * Retrieves a single club by ID
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

    const club = await prisma.club.findFirst({
      where: { id },
      include: {
        clubBalance: true,
      },
    });

    if (!club) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }


    return NextResponse.json({
      id: club.id,
      name: club.name,
      totalCost: club.clubBalance?.totalCost ?? 0,
      createdAt: club.createdAt,
      updatedAt: club.updatedAt,
      clubBalance: club.clubBalance,
    });
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
    const validatedData = insertClub.parse(data);

    // Update club
    const club = await prisma.club.update({
      where: { id },
      data: validatedData,
    });

    if (!club) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(club);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * DELETE /api/clubs/:id
 * Deletes a single club by ID
 */
export const DELETE = async (
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

    // Get tournaments that use this club
    const tournaments = await prisma.tournament.findMany({
      where: {
        clubId: id,
      },
    });
  
    if (tournaments && tournaments?.length > 0) {
      return apiError(
        'Cannot delete club with tournaments assigned',
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // Delete club
    const club = await prisma.club.delete({
      where: { id },
    });

    if (!club) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(club);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
