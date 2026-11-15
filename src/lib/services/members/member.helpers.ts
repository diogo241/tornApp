// MESQUITA: quota do ano N so fica em atraso a partir de 1 de fevereiro, 00:01.
export const getFeeDueDate = (referenceYear: number): Date =>
  new Date(referenceYear, 1, 1, 0, 1);

export const getRequiredFeeYear = (now = new Date()): number => {
  const currentYear = now.getFullYear();

  return now >= getFeeDueDate(currentYear) ? currentYear : currentYear - 1;
};

export const areFeesUpToDate = (
  lastPaidYear: number | null,
  now = new Date(),
): boolean => lastPaidYear !== null && lastPaidYear >= getRequiredFeeYear(now);
