import { NextResponse, type NextRequest } from 'next/server';
import {
  API_MESSAGES,
  apiError,
  apiListSuccess,
  handleValidationError,
  HttpStatusCode,
  validateQueryParams,
} from '@lib/api';
import {
  insertMember,
  memberFilter,
  paginationQuerySchema,
} from '@lib/validators';
import { getSession } from '@lib/auth';
import {
  createMember,
  listMembers,
} from '@lib/services/members/member.service';
import { Prisma } from '../../../../generated/prisma/client';

/**
 * GET /api/members
 * Retrieves a paginated list of members.
 *
 * Query parameters:
 * - page: Page number (default: 1)
 * - size: Items per page (default: 10, max: 100)
 * - name: Case-insensitive name filter
 * - active: "true"/"false"; omitted means every status
 * - payments: "true" adds each member's payments for active fee years and
 *   the latest paid year; omitted keeps the plain member payload
 * - halfFee: "true" narrows to members with a half fee in an active year
 * - lastPaidBefore: 2000-2100; keeps members whose latest paid fee year is
 *   earlier than it, including members with no payments
 */
export const GET = async (request: NextRequest) => {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }

    const { searchParams } = new URL(request.url);

    const pagination = validateQueryParams(searchParams, paginationQuerySchema);
    if (pagination instanceof Response) {
      return pagination;
    }

    const filters = memberFilter.safeParse({
      name: searchParams.get('name') || undefined,
      active: searchParams.get('active') || undefined,
      payments: searchParams.get('payments') || undefined,
      halfFee: searchParams.get('halfFee') || undefined,
      lastPaidBefore: searchParams.get('lastPaidBefore') || undefined,
    });
    if (!filters.success) {
      return handleValidationError(filters.error);
    }

    const { page = 1, pageSize = 10 } = pagination;
    const { data, total } = await listMembers({
      page,
      pageSize,
      name: filters.data.name,
      active: filters.data.active,
      withPayments: filters.data.payments ?? false,
      halfFeeOnly: filters.data.halfFee ?? false,
      lastPaidBefore: filters.data.lastPaidBefore,
    });

    return apiListSuccess(data, total);
  } catch {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

/**
 * POST /api/members
 * Creates a member.
 */
export const POST = async (request: NextRequest) => {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }

    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return apiError('Corpo do pedido inválido', HttpStatusCode.BAD_REQUEST);
    }

    const parsed = insertMember.safeParse(body);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const member = await createMember({
      ...parsed.data,
      active: parsed.data.active ?? true,
    });
    return NextResponse.json(member);
  } catch (error) {
    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2002'
    ) {
      return apiError('Nº de sócio já existe', HttpStatusCode.BAD_REQUEST);
    }

    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
