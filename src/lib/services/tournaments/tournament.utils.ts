import { formatCurrency } from '../../utils';

// Calculate cost per game
export const getCostPerGame = (
  refRate: number,
  aRate: number,
  minutes: number,
) => {
  const refValue = refRate + aRate;
  return formatCurrency(refValue * minutes);
};
