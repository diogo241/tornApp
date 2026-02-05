import { NextResponse } from 'next/server';
import { ZodError, z } from 'zod';

// Standard API response types

export interface ApiErrorResponse {
  error: string;
  message?: string;
  details?: unknown;
}

export interface ApiSuccessResponse<T> {
  data: T[];
  total: number;
}

// HTTP status codes enum
export enum HttpStatusCode {
  OK = 200,
  CREATED = 201,
  BAD_REQUEST = 400,
  UNAUTHORIZED = 401,
  FORBIDDEN = 403,
  NOT_FOUND = 404,
  UNPROCESSABLE_ENTITY = 422,
  INTERNAL_SERVER_ERROR = 500,
}

/**
 * Creates a standardized success response
 */

export function apiListSuccess<T>(
  data: T[],
  total: number,
  status: number = HttpStatusCode.OK,
): NextResponse<ApiSuccessResponse<T>> {
  return NextResponse.json({ data, total }, { status });
}

/**
 * Creates a standardized error response
 */
export function apiError(
  error: string,
  status: number = HttpStatusCode.INTERNAL_SERVER_ERROR,
  message?: string,
  details?: unknown,
): NextResponse<ApiErrorResponse> {
  const response: ApiErrorResponse = { error };
  if (message) response.message = message;
  if (details) response.details = details;

  return NextResponse.json(response, { status });
}

/**
 * Handles Zod validation errors
 */
export function handleValidationError(
  error: ZodError,
): NextResponse<ApiErrorResponse> {
  const details = error.errors.map((e) => ({
    path: e.path.join('.'),
    message: e.message,
  }));

  return apiError(
    'Validation failed',
    HttpStatusCode.BAD_REQUEST,
    'The request contains invalid data',
    details,
  );
}

/**
 * Validates query parameters against a Zod schema
 */
export function validateQueryParams<T extends z.ZodTypeAny>(
  searchParams: URLSearchParams,
  schema: T,
): z.infer<T> | NextResponse {
  try {
    const params = Object.fromEntries(searchParams.entries());
    const pageValues = {
      page: params.page,
      pageSize: params.size,
      name: params.name,
      club: params.clubName,
      refereeId: params.refereeId,
      tournamentId: params.tournamentId,
    };
    return schema.parse(pageValues);
  } catch (error) {
    if (error instanceof ZodError) {
      return handleValidationError(error);
    }
    throw error;
  }
}
