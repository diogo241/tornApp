import { NextResponse, type NextRequest } from 'next/server';
import { apiError, handleValidationError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { listPaidFees } from '@lib/services/fee-payments/fee-payment.service';
import { cotasPagasFilter, paginationQuerySchema } from '@lib/validators';

/**
 * GET /api/quotas
 * Lists every paid fee and the totals of the filtered set.
 *
 * Query parameters:
 * - from / to: YYYY-MM-DD inclusive bounds on the payment date
 * - page: Page number (default: 1)
 * - pageSize: Items per page (default: 10, max: 100)
 */
export const GET = async (request: NextRequest) => {
  try {
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);

    const pagination = paginationQuerySchema.safeParse({
      page: searchParams.get('page') || undefined,
      pageSize: searchParams.get('pageSize') || undefined,
    });
    if (!pagination.success) {
      return handleValidationError(pagination.error);
    }

    const filter = cotasPagasFilter.safeParse({
      from: searchParams.get('from') || undefined,
      to: searchParams.get('to') || undefined,
    });
    if (!filter.success) {
      const invertedRange = filter.error.issues.some(
        (issue) => issue.message === 'Intervalo de datas inválido',
      );

      if (invertedRange) {
        return apiError(
          'Intervalo de datas inválido',
          HttpStatusCode.BAD_REQUEST,
        );
      }

      return handleValidationError(filter.error);
    }

    const { page = 1, pageSize = 10 } = pagination.data;
    const { data, total, totals } = await listPaidFees({
      page,
      pageSize,
      from: filter.data.from,
      to: filter.data.to,
    });

    return NextResponse.json({ data, total, totals });
  } catch {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
