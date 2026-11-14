import { API_MESSAGES, apiError, HttpStatusCode } from '@lib/api';
import { getSession } from '@lib/auth';
import { prisma } from '@lib/prisma';
import { NextResponse } from 'next/server';

/**
 * GET /api/dashboard/referee-games
 * Retrieves the total number of games refereed
 *
 * Sums the allocation and referee counts of every referee assignment.
 */
export const GET = async () => {
  try {
    const session = await getSession();
    if (!session) {
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }

    const result = await prisma.refereeAssignment.aggregate({
      _sum: {
        countA: true,
        countB: true,
        countC: true,
        countARef: true,
        countBRef: true,
        countCRef: true,
      },
    });

    const sum = result?._sum;
    const countA = sum?.countA ?? 0;
    const countB = sum?.countB ?? 0;
    const countC = sum?.countC ?? 0;
    const countARef = sum?.countARef ?? 0;
    const countBRef = sum?.countBRef ?? 0;
    const countCRef = sum?.countCRef ?? 0;

    const asAssistant = countA + countB + countC;
    const asReferee = countARef + countBRef + countCRef;

    return NextResponse.json({
      totalGames: asAssistant + asReferee,
      byClass: {
        A: countA + countARef,
        B: countB + countBRef,
        C: countC + countCRef,
      },
      asAssistant,
      asReferee,
    });
  } catch (error) {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
