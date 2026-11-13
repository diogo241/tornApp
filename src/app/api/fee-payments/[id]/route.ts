import { NextResponse, type NextRequest } from 'next/server';
import {
  API_MESSAGES,
  apiError,
  handleValidationError,
  HttpStatusCode,
} from '@lib/api';
import { getSession } from '@lib/auth';
import { updateFeePayment } from '@lib/validators';
import {
  deleteFeePayment,
  updateFeePayment as updateFeePaymentRecord,
} from '@lib/services/fee-payments/fee-payment.service';
import { Prisma } from '../../../../../generated/prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * PUT /api/fee-payments/:id
 * Replaces the date, method and half-fee state of one payment.
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

    const parsed = updateFeePayment.safeParse(body);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const payment = await updateFeePaymentRecord(id, {
      paidAt: parsed.data.paidAt
        ? new Date(`${parsed.data.paidAt}T00:00:00.000Z`)
        : null,
      method: parsed.data.method,
      methodDetail:
        parsed.data.method === 'other'
          ? (parsed.data.methodDetail ?? null)
          : null,
      halfFee: parsed.data.halfFee,
    });
    return NextResponse.json(payment);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return apiError(
          'Já existe um pagamento para este sócio e esta quota',
          HttpStatusCode.CONFLICT,
        );
      }
      if (error.code === 'P2025') {
        return apiError(
          'Pagamento não encontrado',
          HttpStatusCode.NOT_FOUND,
        );
      }
    }

    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

/**
 * DELETE /api/fee-payments/:id
 * Removes one payment, so the cell returns to "não paga".
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

    const payment = await deleteFeePayment(id);
    return NextResponse.json(payment);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return apiError('Pagamento não encontrado', HttpStatusCode.NOT_FOUND);
    }

    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
