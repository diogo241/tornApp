import { NextResponse, type NextRequest } from 'next/server';
import { ZodError } from 'zod';
import { prisma } from '@lib/prisma';
import {
  API_MESSAGES,
  apiError,
  handleValidationError,
  HttpStatusCode,
} from '@lib/api';
import { getSession } from '@lib/auth';
import { updateReferee } from '@lib/validators';
import { getAssignmentsByRefereeId } from '@lib/services/referee';

/**
 * GET /api/referees/:id
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
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }
    const { id } = await params;
    if (!id) {
      return apiError(API_MESSAGES.invalidId, HttpStatusCode.BAD_REQUEST);
    }

    const referee = await prisma.referee.findFirst({
      where: { id },
      select: {
        id: true,
        name: true,
        totalCost: true,
        paid: true,
        createdAt: true,
        updatedAt: true,
      },
    });

    if (!referee) {
      return apiError(API_MESSAGES.notFound, HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(referee);
  } catch (error) {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

/**
 * PUT /api/referees/:id
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
      validatedData = updateReferee.parse(data);
    } catch (error) {
      if (error instanceof ZodError) {
        return handleValidationError(error);
      }
      throw error;
    }

    // Update referee
    const referee = await prisma.referee.update({
      where: { id },
      data: validatedData,
    });

    if (!referee) {
      return apiError(API_MESSAGES.notFound, HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(referee);
  } catch (error) {
    if ((error as { code?: string }).code === 'P2025') {
      return apiError(API_MESSAGES.notFound, HttpStatusCode.NOT_FOUND);
    }

    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

/**
 * DELETE /api/referees/:id
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
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }
    const { id } = await params;
    if (!id) {
      return apiError(API_MESSAGES.invalidId, HttpStatusCode.BAD_REQUEST);
    }

    const refereeAssignments = await getAssignmentsByRefereeId(id);
    if (refereeAssignments && refereeAssignments?.length > 0) {
      return apiError(
        'Não é possível eliminar um árbitro com jogos associados',
        HttpStatusCode.BAD_REQUEST,
      );
    }

    // Delete referee
    const referee = await prisma.referee.delete({
      where: { id },
    });

    if (!referee) {
      return apiError(API_MESSAGES.notFound, HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(referee);
  } catch (error) {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
