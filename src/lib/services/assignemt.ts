import { NextResponse, type NextRequest } from 'next/server';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { RefereeAssignment, Tournament } from '@lib/types';
import { apiError, HttpStatusCode } from '@lib/api';
import { prisma } from '@lib/prisma';
import { insertRefereeAssignment, insertTournament } from '@lib/validators';
import type { Prisma } from '../../../generated/prisma/browser';

const createAssignment = async (
  prisma: PrismaClient,
  request: NextRequest,
) => {
  try {
    // Validate request body
    const data = await request.json();
    const assignments = insertRefereeAssignment.parse(data);

    if (!assignments) {
      return apiError('Assignments not found', HttpStatusCode.NOT_FOUND);
    }

    // Calculate total cost
    const totalCost = await tournamentTotalCost(tournamentData);

    if (!totalCost) {
      return apiError('Total cost error', HttpStatusCode.BAD_REQUEST);
    }

    console.log(assignments);

    // Create tournament and assignment
    const result = await prisma.$transaction(async (tx) => {
      const tournament = await tx.tournament.create({
        data: {
          ...tournamentData,
          totalCost,
        },
      });

      if (!tournament) {
        throw new Error('Error creating tournament');
      }

      // Create referee assignments
      await Promise.all(
        assignments.map(async (assignment: RefereeAssignment) => {
          if (!assignment.refereeId) {
            throw new Error('Referee ID is not valid');
          }
          if (!assignment.countA && !assignment.countB && !assignment.countC) {
            throw new Error('Count is not valid');
          }
          const validateGames =
            assignment.countA +
              (assignment.countB ?? 0) +
              (assignment.countC ?? 0) ===
            0;
          if (validateGames) {
            throw new Error('Number of games is not valid');
          }

          return tx.refereeAssignment.create({
            data: {
              countA: assignment.countA ?? 0,
              countB: assignment.countB ?? 0,
              countC: assignment.countC ?? 0,
              tournamentId: tournament.id,
              refereeId: assignment.refereeId,
            },
          });
        }),
      );

      return tournament;
    });

    return NextResponse.json(result);
  } catch (error) {
    console.error(error);
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

const createRefereeAssignment = async (
  tx: Prisma.TransactionClient,
  tournamentId: string,
  assignments: RefereeAssignment,
) => {
  if (!assignments.refereeId) {
    throw new Error('Referee ID is not valid');
  }

  const totalGames =
    assignments.countA + (assignments.countB ?? 0) + (assignments.countC ?? 0);
  if (totalGames === 0) {
    throw new Error('Number of games is not valid');
  }
};

const calculateRefereeAssignmentCost = async (assigment: RefereeAssignment) => {
  const { countA, countB, countC, refereeId } = assigment;

  const costA = countA * 0.42;
  const costB = countB * 0.4;
  const costC = countC * 0.4;

  return costA + costB + costC;
};
