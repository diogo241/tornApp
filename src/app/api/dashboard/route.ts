import {
  API_MESSAGES,
  apiError,
  apiListSuccess,
  HttpStatusCode,
} from '@lib/api';
import { getSession } from '@lib/auth';
import { prisma } from '@lib/prisma';
import { NextResponse, type NextRequest } from 'next/server';

type DashboardStats = {
  tournaments: number;
  referees: number;
  assignemnts: number;
  tournamentCost: number | null;
};

/**
 * GET /api/dashboard
 * Retrieves a paginated list of dashboard
 *
 * Get all the tournaments, all the referee, all the assignemts and all the tournaments cost
 */
export const GET = async (request: NextRequest) => {
  try {
    // Validate session
    const session = await getSession();
    if (!session) {
      return apiError(API_MESSAGES.unauthorized, HttpStatusCode.UNAUTHORIZED);
    }

    // Fetch data with pagination
    const [totalTournaments, totalReferees, totalAssignments, costResult] =
      await prisma.$transaction([
        prisma.tournament.count(),
        prisma.referee.count(),
        prisma.referee.count({
          where: {
            assignments: {
              some: {},
            },
          },
        }),
        prisma.tournament.aggregate({
          _sum: {
            totalCost: true,
          },
        }),
      ]);

    const totalTournamentCost = costResult?._sum?.totalCost ?? 0;

    if (
      (!totalTournaments && totalTournaments !== 0) ||
      (!totalReferees && totalReferees !== 0) ||
      (!totalAssignments && totalAssignments !== 0) ||
      (!totalTournamentCost && totalTournamentCost !== 0)
    ) {
      return apiError('Não foi possível obter os dados', HttpStatusCode.NOT_FOUND);
    }

    return NextResponse.json({
      tournaments: totalTournaments,
      referees: totalReferees,
      assignemnts: totalAssignments,
      totalCost: totalTournamentCost,
    });
  } catch (error) {
    return apiError(
      API_MESSAGES.serverError,
      HttpStatusCode.INTERNAL_SERVER_ERROR,
    );
  }
};
