import { NextResponse, type NextRequest } from 'next/server';
import { API_MESSAGES, HttpStatusCode } from '@lib/api';
import { getPublicMemberViewByToken } from '@lib/services/members/member-public.service';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';

const NO_STORE_HEADERS = {
  'Cache-Control': 'no-store',
};

/**
 * GET /api/public/members/view?token=...
 * Public read-only endpoint that returns a minimal member DTO for a valid
 * signed view token. Never exposes internal details or echoes the token.
 */
export const GET = async (request: NextRequest) => {
  try {
    const token = request.nextUrl.searchParams.get('token');
    const view = await getPublicMemberViewByToken(token);

    if (!view) {
      return NextResponse.json(
        { error: 'Link inválido' },
        { status: HttpStatusCode.NOT_FOUND, headers: NO_STORE_HEADERS },
      );
    }

    return NextResponse.json(view, {
      status: HttpStatusCode.OK,
      headers: NO_STORE_HEADERS,
    });
  } catch {
    return NextResponse.json(
      { error: API_MESSAGES.serverError },
      {
        status: HttpStatusCode.INTERNAL_SERVER_ERROR,
        headers: NO_STORE_HEADERS,
      },
    );
  }
};
