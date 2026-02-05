import type { Rate } from '@lib/types';

// Check if the rate values are the same
export const compareRateValues = (newRate: Rate, oldRate: Rate) => {
  try {
    if (
      newRate.refRate === oldRate.refRate &&
      newRate.aRate === oldRate.aRate
    ) {
      return {
        success: true,
      };
    }

    return {
      success: false,
      message: 'Rate values are not the same',
    };
  } catch (error) {
    return {
      success: false,
      message: (error as Error).message,
    };
  }
};
