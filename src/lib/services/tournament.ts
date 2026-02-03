import { NextResponse, type NextRequest } from 'next/server';
import type { PrismaClient } from '../../../generated/prisma/client';
import type { RefereeAssignment, Tournament } from '@lib/types';
import { apiError, HttpStatusCode } from '@lib/api';
import { prisma } from '@lib/prisma';
import { insertTournament } from '@lib/validators';
import type { Prisma } from '../../../generated/prisma/browser';

export const createTournament = async (
  prisma: PrismaClient,
  request: NextRequest,
) => {
  try {
    // Validate request body
    const data = await request.json();
    const validatedData = insertTournament.parse(data);

    // Calculate total cost
    const totalCost = await tournamentTotalCost(validatedData);

    if (!totalCost) {
      return apiError('Total cost error', HttpStatusCode.BAD_REQUEST);
    }

    const tournament = await prisma.tournament.create({
      data: {
        ...validatedData,
        totalCost,
      },
    });

    if (!tournament) {
      throw new Error('Error creating tournament');
    }

    return NextResponse.json(tournament);
  } catch (error) {
    console.error(error);
    return apiError('API error', HttpStatusCode.INTERNAL_SERVER_ERROR);
  }
};

const tournamentTotalCost = async (tournament: Tournament) => {
  const { rateId, countA, durationA, countB, durationB, countC, durationC } =
    tournament;

  if (!countA || countA <= 0) {
    throw new Error('Count A is not valid');
  }

  // Get rate
  const rate = await prisma.rate.findFirst({
    where: {
      id: rateId,
    },
    select: {
      refRate: true,
      aRate: true,
      players: true,
    },
  });

  if (!rate) {
    throw new Error('Rate not found');
  }

  // Calculate cost per minute
  let costPerMinute;

  // Use  aRate if players is 11
  rate?.players === 11
    ? (costPerMinute = rate.aRate + rate.refRate)
    : (costPerMinute = rate.refRate);

  // Calculate total cost, validate if B and C are not null
  let totalCost = durationA * costPerMinute * countA;

  if (durationB && countB) {
    totalCost += durationB * costPerMinute * countB;
  }
  if (durationC && countC) {
    totalCost += durationC * costPerMinute * countC;
  }
  if (!totalCost || totalCost <= 0) {
    throw new Error('Error calculating total cost');
  }

  return totalCost;
};
