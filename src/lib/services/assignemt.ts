import type { Rate, RefereeAssignment, Tournament } from '@lib/types';

// Validate if games are valid for the tournament
export const checkNumberOfGames = async (
  assignment: RefereeAssignment,
  tournament: Tournament,
) => {
  // Extract data from the assignment
  const { countA, countB, countC, countARef, countBRef, countCRef } =
    assignment;

  // Check if total games is less than tournament.totalGames
  const sumAssignedGames =
    (countA ?? 0) +
    (countB ?? 0) +
    (countC ?? 0) +
    (countARef ?? 0) +
    (countBRef ?? 0) +
    (countCRef ?? 0);

  if (sumAssignedGames > tournament.totalGames)
    return {
      success: false,
      message: 'Total Games is greater then tournament total games',
    };

  const validators = [
    {
      label: 'countA',
      value: (countA ?? 0) + (countARef ?? 0),
      max: tournament.countA ?? 0,
    },
    {
      label: 'countB',
      value: (countB ?? 0) + (countBRef ?? 0),
      max: tournament.countB ?? 0,
    },
    {
      label: 'countC',
      value: (countC ?? 0) + (countCRef ?? 0),
      max: tournament.countC ?? 0,
    },
  ];

  const validation = validateGamesCount(validators);
  if (validation.success === false) {
    return validation;
  }

  return { success: true };
};

// Validate if games assigned are less or equal to the remaining games
export const validateAssignedGames = (
  assignment: RefereeAssignment,
  remainingGames: { [key: string]: number },
) => {
  // Extract data from the assignment
  const { countA, countB, countC, countARef, countBRef, countCRef } =
    assignment;

  const validator = [
    {
      label: 'countA',
      value: countA ?? 0,
      max: remainingGames.countA ?? 0,
    },
    {
      label: 'countB',
      value: countB ?? 0,
      max: remainingGames.countB ?? 0,
    },
    {
      label: 'countC',
      value: countC ?? 0,
      max: remainingGames.countC ?? 0,
    },
    {
      label: 'countARef',
      value: countARef ?? 0,
      max: remainingGames.countARef ?? 0,
    },
    {
      label: 'countBRef',
      value: countBRef ?? 0,
      max: remainingGames.countBRef ?? 0,
    },
    {
      label: 'countCRef',
      value: countCRef ?? 0,
      max: remainingGames.countCRef ?? 0,
    },
  ];

  const validation = validateGamesCount(validator);

  if (validation.success === false) {
    return validation;
  }

  return { success: true };
};

// Calculate total cost of the assignment
export const getAssignmentTotalCost = async (
  assignment: RefereeAssignment,
  rate: Rate,
  tournament: Tournament,
) => {
  try {
    const { refRate, aRate = 0 } = rate;
    if (!refRate) return { success: false, message: 'Ref Rate is required' };

    const hasAssistantGames =
      (assignment.countARef ?? 0) +
        (assignment.countBRef ?? 0) +
        (assignment.countCRef ?? 0) >
      0;

    if (hasAssistantGames && !aRate && aRate === 0) {
      return { success: false, message: 'Assistant Rate (aRate) is required' };
    }

    const categories = [
      {
        count: assignment.countA,
        aCount: assignment.countARef,
        duration: tournament.durationA,
      },
      {
        count: assignment.countB,
        aCount: assignment.countBRef,
        duration: tournament.durationB,
      },
      {
        count: assignment.countC,
        aCount: assignment.countCRef,
        duration: tournament.durationC,
      },
    ];

    const totalCost = categories.reduce((acc, cat) => {
      const duration = cat.duration ?? 0;
      const mainCost = (cat.count ?? 0) * duration * refRate;
      const assistantCost = (cat.aCount ?? 0) * duration * aRate;

      return acc + mainCost + assistantCost;
    }, 0);

    return { success: true, totalCost };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

// Check if the referee is already assigned to the tournament
export const isRefereeUnassigned = async (
  assignment: RefereeAssignment,
  tournamentAssignments: RefereeAssignment[],
) => {
  try {
    const { refereeId, tournamentId } = assignment;

    // Check if the referee is already assigned
    const assigned = tournamentAssignments.filter(
      (ass) => ass.refereeId === refereeId && ass.tournamentId === tournamentId,
    );

    if (assigned.length > 0) {
      return {
        success: false,
        message: 'Referee is already assigned to this tournament',
      };
    }

    return { success: true };
  } catch (error) {
    return { success: false, message: (error as Error).message };
  }
};

const validateGamesCount = (
  validators: { label: string; value: number; max: number }[],
) => {
  for (const validator of validators) {
    if (validator.value > validator.max)
      return {
        success: false,
        message: `Invalid ${validator.label}: is greater then tournament ${validator.label} or ARef ${validator.label}`,
      };
  }

  return { success: true };
};
