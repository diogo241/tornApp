import type { ClubBalance } from '@lib/types';

// Calculate net balance
export const calculateNetBalance = (
  clubBalance: ClubBalance,
  newCost: number,
  increment: true | false,
) => {
  const { clubId, netBalance } = clubBalance;

  if (!clubId) return null;

  let totalNetBalance = netBalance ?? 0;

  if (increment) {
    totalNetBalance += -newCost || 0;
  } else {
    totalNetBalance -= newCost || 0;
  }

  return totalNetBalance;
};
