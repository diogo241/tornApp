import { NextResponse, type NextRequest } from 'next/server';
import {
  API_MESSAGES,
  apiError,
  handleValidationError,
  HttpStatusCode,
} from '@lib/api';
import { getSession } from '@lib/auth';
import { updateMember } from '@lib/validators';
import {
  deleteMember,
  getMemberById,
  MemberHasFeePaymentsError,
  updateMember as updateMemberRecord,
} from '@lib/services/members/member.service';
import { Prisma } from '../../../../../generated/prisma/client';

type RouteContext = { params: Promise<{ id: string }> };

/**
 * GET /api/members/:id
 * Retrieves one member.
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

    const member = await getMemberById(id);
    if (!member) {
      return apiError('Sócio não encontrado', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json(member);
  } catch {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

/**
 * PUT /api/members/:id
 * Updates one member.
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

    const parsed = updateMember.safeParse(body);
    if (!parsed.success) {
      return handleValidationError(parsed.error);
    }

    const member = await updateMemberRecord(id, parsed.data);
    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof Prisma.PrismaClientKnownRequestError) {
      if (error.code === 'P2002') {
        return apiError('Nº de sócio já existe', HttpStatusCode.BAD_REQUEST);
      }
      if (error.code === 'P2025') {
        return apiError('Sócio não encontrado', HttpStatusCode.NOT_FOUND);
      }
    }

    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};

/**
 * DELETE /api/members/:id
 * Deletes one member without fee payments; a member with payments must be
 * deactivated instead, so its financial history is preserved.
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

    const member = await deleteMember(id);
    return NextResponse.json(member);
  } catch (error) {
    if (error instanceof MemberHasFeePaymentsError) {
      return apiError(error.message, HttpStatusCode.BAD_REQUEST);
    }

    if (
      error instanceof Prisma.PrismaClientKnownRequestError &&
      error.code === 'P2025'
    ) {
      return apiError('Sócio não encontrado', HttpStatusCode.NOT_FOUND);
    }

    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
