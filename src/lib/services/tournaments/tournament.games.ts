import type { RefereeAssignment, Tournament } from '@lib/types';

// Get the remaining games with no referee
export const getRemainingGames = async (
  assignments: RefereeAssignment[],
  tournament: Tournament,
) => {
  try {
    // Skip if there are no assignments
    if (assignments.length === 0)
      return {
        success: true,
        games: {
          countA: tournament.countA,
          countB: tournament.countB ?? 0,
          countC: tournament.countC ?? 0,
          countARef: (tournament.countA ?? 0) * 2,
          countBRef: (tournament.countB ?? 0) * 2,
          countCRef: (tournament.countC ?? 0) * 2,
        },
      };

    // Some all the assignmet games
    const assignedGames = getAssignedTotalGames(
      assignments as RefereeAssignment[],
    );

    // Calculate the remaining games
    let totalGames = {
      countA: tournament.countA ?? 0,
      countB: tournament.countB ?? 0,
      countC: tournament.countC ?? 0,
      countARef: (tournament.countA ?? 0) * 2,
      countBRef: (tournament.countB ?? 0) * 2,
      countCRef: (tournament.countC ?? 0) * 2,
    };

    const remainingGames = calculateRemainingGames(assignedGames, totalGames);

    return {
      success: true,
      games: remainingGames,
    };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Some all the assignmet games
const getAssignedTotalGames = (assignments: RefereeAssignment[]) => {
  const games = assignments.reduce(
    (acc, assignment) => {
      acc.countA += assignment.countA ?? 0;
      acc.countB += assignment.countB ?? 0;
      acc.countC += assignment.countC ?? 0;
      acc.countARef += assignment.countARef ?? 0;
      acc.countBRef += assignment.countBRef ?? 0;
      acc.countCRef += assignment.countCRef ?? 0;
      return acc;
    },
    {
      countA: 0,
      countB: 0,
      countC: 0,
      countARef: 0,
      countBRef: 0,
      countCRef: 0,
    },
  );

  return games;
};

// Calculcate the remaining games
const calculateRemainingGames = (
  assignedGames: { [key: string]: number },
  totalGames: { [key: string]: number },
) => {
  const remainingGames = {
    countA: Math.max(0, (totalGames.countA || 0) - (assignedGames.countA || 0)),
    countB: Math.max(0, (totalGames.countB || 0) - (assignedGames.countB || 0)),
    countC: Math.max(0, (totalGames.countC || 0) - (assignedGames.countC || 0)),
    countARef: Math.max(
      0,
      (totalGames.countARef || 0) - (assignedGames.countARef || 0),
    ),
    countBRef: Math.max(
      0,
      (totalGames.countBRef || 0) - (assignedGames.countBRef || 0),
    ),
    countCRef: Math.max(
      0,
      (totalGames.countCRef || 0) - (assignedGames.countCRef || 0),
    ),
  };

  return remainingGames;
};
