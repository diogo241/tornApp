import { prisma } from '@lib/prisma';

// Get the tournament by id
export const getTournamentById = async (id: string) => {
  try {
    const tournament = await prisma.tournament.findFirst({
      where: {
        id: id,
      },
      include: {
        rate: true,
        club: true,
        assignments: true,
      },
    });

    if (!tournament) throw new Error('Tournament not found');

    return tournament;
  } catch (error) {
    throw new Error((error as Error).message);
  }
};


