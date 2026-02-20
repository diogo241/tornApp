import type { ClubBalance } from '@lib/types';

// Calculate net balance
export const calculateNetBalance = (
  clubBalance: ClubBalance,
  newCost: number,
  increment: true | false,
) => {
  const { clubFunding, club, totalCost } = clubBalance;

  if (!clubFunding || !club) return null;

  const { amount } = clubFunding;

  let totalCostAmount = -(totalCost ?? 0);
  
  if (increment) {
    totalCostAmount -= -newCost;
  } else {
    totalCostAmount += newCost;
  }
  // console.log(totalCostAmount);
  // console.log(amount);
  // console.log(totalCost);
  // console.log(Math.round((totalCostAmount - amount) * 100) / 100);

  return Math.round((totalCostAmount - amount) * 100) / 100;
};
