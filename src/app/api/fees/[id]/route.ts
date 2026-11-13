import { NextResponse, type NextRequest } from 'next/server';
import {
  API_MESSAGES,
  apiError,
  handleValidationError,
  HttpStatusCode,
} from '@lib/api';
import { getSession } from '@lib/auth';
import { updateFee } from '@lib/validators';
import {
  deleteFee,
  FeeHasFeePaymentsError,
  getFeeById,
  updateFee as updateFeeRecord,
} from '@lib/services/fees/fee.service';
import { Prisma } from '../../../../../generated/prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/fees/:id
 * Retrieves one annual fee.
 */
export const GET = async (request: NextRequest, { params }: RouteContext) => {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }

    const { id } = await params;
    if (!id) {
      return apiError(API_MESSAGES.invalidId, HttpStatusCode.BAD_REQUEST);
    }

    const fee = await getFeeById(id);
    if (!fee) {
      return apiError('Quota não encontrada', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(fee);
  } catch {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

/**
 * PUT /api/fees/:id
 * Updates one annual fee.
 */
export const PUT = async (request: NextRequest, { params }: RouteContext) => {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }

    const { id } = await params;
    if (!id) {
      return apiError(API_MESSAGES.invalidId, HttpStatusCode.BAD_REQUEST);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('Corpo do pedido inválido', HttpStatusCode.BAD_REQUEST);
    }

    const parsed = updateFee.safeParse(body);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const fee = await updateFeeRecord(id, parsed.data);
    return NextResponse.json(fee);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return apiError(
          'Já existe uma quota para esse ano',
          HttpStatusCode.BAD_REQUEST,
        );
      }
      if (error.code === 'P2025') {
        return apiError('Quota não encontrada', HttpStatusCode.NOT_FOUND);
      }
    }

    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

/**
 * DELETE /api/fees/:id
 * Deletes one fee year without payments. A year with payments must be
 * deactivated instead; the foreign key restriction is the last defence.
 */
export const DELETE = async (request: NextRequest, { params }: RouteContext) => {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }

    const { id } = await params;
    if (!id) {
      return apiError(API_MESSAGES.invalidId, HttpStatusCode.BAD_REQUEST);
    }

    const fee = await deleteFee(id);
    return NextResponse.json(fee);
  } catch (error) {
    if (error instanceof FeeHasFeePaymentsError) {
      return apiError(error.message, HttpStatusCode.BAD_REQUEST);
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2003') {
        return apiError(
          'Quota com pagamentos registados; desativar em vez de eliminar',
          HttpStatusCode.BAD_REQUEST,
        );
      }
      if (error.code === 'P2025') {
        return apiError('Quota não encontrada', HttpStatusCode.NOT_FOUND);
      }
    }

    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
