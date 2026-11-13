import { NextResponse, type NextRequest } from 'next/server';
import {
  apiError,
  apiListSuccess,
  handleValidationError,
  HttpStatusCode,
  validateQueryParams,
} from '@lib/api';
import {
  feeFilter,
  insertFee,
  paginationQuerySchema,
} from '@lib/validators';
import { getSession } from '@lib/auth';
import { createFee, listFees } from '@lib/services/fees/fee.service';
import { Prisma } from '../../../../generated/prisma/client';

/**
 * GET /api/fees
 * Retrieves the paginated annual fee catalog.
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - size: Items per page (default: 10, max: 100)
 * - active: "true"/"false"; omitted means every status
 */
export const GET = async (request: NextRequest) => {
  try {
    const session = await getSession();
    if (!session) {
      return apiError('Unauthorized', HttpStatusCode.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);

    const pagination = validateQueryParams(searchParams, paginationQuerySchema);
    if (pagination instanceof Response) {
      return pagination;
    }

    const filters = feeFilter.safeParse({
      active: searchParams.get('active') || undefined,
    });
    if (!filters.success) {
      return handleValidationError(filters.error);
    }

    const { page = 1, pageSize = 10 } = pagination;
    const { data, total } = await listFees({
      page,
      pageSize,
      ...filters.data,
    });

    return apiListSuccess(data, total);
  } catch {
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

/**
 * POST /api/fees
 * Creates an annual fee.
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

    const parsed = insertFee.safeParse(body);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const fee = await createFee({
      ...parsed.data,
      active: parsed.data.active ?? true,
    });
    return NextResponse.json(fee);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return apiError(
        'Já existe uma cota para esse ano',
        HttpStatusCode.BAD_REQUEST,
      );
    }

    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};
