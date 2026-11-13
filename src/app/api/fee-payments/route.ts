import { NextResponse, type NextRequest } from 'next/server';
import { apiError, handleValidationError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { createFeePayment } from '@lib/validators';
import { createFeePayment as createFeePaymentRecord } from '@lib/services/fee-payments/fee-payment.service';
import { Prisma } from '../../../../generated/prisma/client';

// MESQUITA: segundo pagamento para a mesma cota passa a ser rejeitado
/**
 * POST /api/fee-payments
 * Creates a member's payment for a fee year; a second payment for the same
 * fee is rejected.
 */
export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('Corpo do pedido inválido', HttpStatusCode.BAD_REQUEST);
    }

    const parsed = createFeePayment.safeParse(body);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const result = await createFeePaymentRecord({
      ...parsed.data,
      paidAt: parsed.data.paidAt
        ? new Date(`${parsed.data.paidAt}T00:00:00.000Z`)
        : null,
    });

    if (!result.ok) {
      if (result.error === 'member-not-found') {
        return apiError('Sócio não encontrado', HttpStatusCode.NOT_FOUND);
      }

      if (result.error === 'fee-not-found') {
        return apiError('Cota não encontrada', HttpStatusCode.NOT_FOUND);
      }

      return apiError(
        'Cota inativa; não é possível registar pagamentos',
        HttpStatusCode.BAD_REQUEST,
      );
    }

    return NextResponse.json(result.payment);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return apiError(
        'Já existe um pagamento para este sócio e esta cota',
        HttpStatusCode.CONFLICT,
      );
    }

    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
