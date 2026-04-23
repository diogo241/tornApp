export const validateGamesCount = (
  validators: { label: string; value: number; max: number }[],
): { success: boolean; message?: string } => {
  for (const validator of validators) {
    if (validator.value > validator.max)
      return {
        success: false,
        message: `Invalid ${validator.label}: is greater then tournament ${validator.label} or ARef ${validator.label}`,
      };
  }

  return { success: true };
};

export const difGamesCount = (
  validators: { key: string; new: number; old: number }[],
) => {
  let changes: Record<string, number> = {};
  for (const validator of validators) {
    changes[validator.key] = validator.new - validator.old;
    if (changes[validator.key] < 0) changes[validator.key] = 0;
  }

  return changes;
};
