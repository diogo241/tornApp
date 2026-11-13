export const areFeesUpToDate = (
  lastPaidYear: number | null,
  referenceYear = new Date().getFullYear(),
): boolean => lastPaidYear !== null && lastPaidYear >= referenceYear + 1;
