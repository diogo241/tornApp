import type { Tournament } from '@lib/types';
import { formatCurrency } from '@lib/utils';

// Check if the Tournament has Assistent Referee
export const hasAssistentReferee = (tournament: Tournament) => {
  return tournament?.rate?.players === 11 ? true : false;
};

// Check the Tournament durations
export const hasDurationB = (tournament: Tournament) => {
  if (!tournament) return false;

  if (!tournament.countB) return false;
  if (tournament.countB >= 1) return true;
  return false;
};

export const hasDurationC = (tournament: Tournament) => {
  if (!tournament) return false;
  if (!tournament.countC || tournament.countC === undefined) return false;
  if (tournament.countC >= 1) return true;
  return false;
};

// Calculate cost per game
export const getCostPerGame = (
  refRate: number,
  aRate: number,
  minutes: number,
) => {
  const refValue = refRate + (aRate * 2);
  return formatCurrency(refValue * minutes);
};
