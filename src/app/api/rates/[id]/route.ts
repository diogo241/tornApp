import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@lib/prisma';
import { apiError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { updateAfterRateUpdate } from '@lib/services/rates';
import { compareRateValues } from '@lib/services/rates';
import { insertRate } from '@lib/validators';

/**
 * GET /api/rates/:id
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

    const rate = await prisma.rate.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        players: true,
        refRate: true,
        aRate: true,
        createdAt: true,
        updatedAt: true,
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

/**
 * PUT /api/rates/:id
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

    // Get old rate
    const oldRate = await prisma.rate.findFirst({
      where: { id },
    });
    if (!oldRate) {
      return apiError('Rate not found', HttpStatusCode.NOT_FOUND);
    }

    // Validate request body
    const data = await request.json();
    const validatedData = insertRate.parse(data);

    // Update rate
    const rate = await prisma.rate.update({
      where: { id },
      data: validatedData,
      include: {
        tournaments: true,
      },
    });

    if (!rate) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    const { tournaments } = rate;

    // Check if the rate values are the same
    const equalRateValues = await compareRateValues(data, oldRate);
    if (!equalRateValues.success) {
      // Update tournaments that use this rate (update total cost)
      const updateTournaments = await updateAfterRateUpdate(tournaments, rate);
      if (!updateTournaments.success) {
        return apiError(
          updateTournaments.message ?? 'Error updating tournaments',
          HttpStatusCode.INTERNAL_SERVER_ERROR,
        );
      }
    }

    return NextResponse.json(rate);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * DELETE /api/rates/:id
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

    // Delete rate
    const rate = await prisma.rate.delete({
      where: { id },
    });

    if (!rate) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(rate);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
