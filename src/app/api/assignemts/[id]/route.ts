import { NextResponse, type NextRequest } from 'next/server';
import { prisma } from '@lib/prisma';
import { apiError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { convertToPlainObject } from '@lib/utils';
import { updateTournamentCost } from '@lib/services/tournaments/tournament.cost';
import { insertRefereeAssignment, insertTournament } from '@lib/validators';
import { decrementRefereeCost } from '@lib/services/referee';

/**
 * GET /api/assignemts/:id
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

    const assignment = await prisma.refereeAssignment.findFirst({
      where: { id },
      select: {
        id: true,
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
    });

    if (!assignment) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(convertToPlainObject(assignment));
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * PUT /api/assignments/:id
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
    const validatedData = insertRefereeAssignment.parse(data);

    // Update assignment
    const assignment = await prisma.refereeAssignment.update({
      where: { id },
      data: {
        ...validatedData,
      },
    });

    if (!assignment) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(assignment);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * DELETE /api/assignments/:id
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

    // Delete assignment
    const assignment = await prisma.refereeAssignment.delete({
      where: { id },
    });

    // Update referee total cost
    await decrementRefereeCost(assignment.refereeId, assignment.totalCost!);

    if (!assignment) {
      return apiError('Not found', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(assignment);
  } catch (error) {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
