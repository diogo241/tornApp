import { z } from 'zod';

// Pagination validators
export const paginationQuerySchema = z.object({
  page: z.coerce
    .number({
      invalid_type_error: 'Page must be a number',
      required_error: 'Page is required',
    })
    .int('Page must be an integer')
    .positive('Page must be positive')
    .default(1)
    .optional(),
  pageSize: z.coerce
    .number({
      invalid_type_error: 'PageSize must be a number',
      required_error: 'PageSize is required',
    })
    .int('PageSize must be an integer')
    .positive('PageSize must be positive')
    .max(100, 'PageSize cannot exceed 100')
    .default(10)
    .optional(),
});

// Filters validators
export const filtersQuerySchema = z.object({
  name: z.string().optional(),
});

// Club validators
export const insertClub = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(50).trim(),
  createdAt: z.coerce
    .date()
    .default(() => new Date())
    .optional(),
  updatedAt: z.coerce
    .date()
    .default(() => new Date())
    .optional(),
});

// User validators
export const insertUser = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(3).max(50).trim(),
    email: z.string().email().min(3).max(50).trim(),
    createdAt: z.coerce
      .date()
      .default(() => new Date())
      .optional(),
    updatedAt: z.coerce
      .date()
      .default(() => new Date())
      .optional(),
    password: z.string().min(3).max(50).trim().optional(),
    confirmPassword: z.string().min(3).max(50).trim().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "Passwords don't match",
    path: ['confirmPassword'],
  });

// Referee validators
export const insertReferee = z.object({
  id: z.string().uuid().optional(),
  name: z.string().min(3).max(250).trim(),
  createdAt: z.coerce
    .date()
    .default(() => new Date())
    .optional(),
  updatedAt: z.coerce
    .date()
    .default(() => new Date())
    .optional(),
});

// Rate validators
export const insertRate = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(3).max(100).trim(),
    players: z.coerce.number().min(1).max(11),
    refRate: z.coerce.number().min(0).max(100),
    aRate: z.coerce.number().min(0).max(100).optional(),
    createdAt: z.coerce
      .date()
      .default(() => new Date())
      .optional(),
    updatedAt: z.coerce
      .date()
      .default(() => new Date())
      .optional(),
  })
  .transform((data) => {
    if (data.players !== 11) {
      data.aRate = 0;
    }
    return data;
  });

// Referee Assignment validators
export const insertRefereeAssignment = z.object({
  id: z.string().uuid().optional(),
  countA: z.coerce.number().min(0),
  countB: z.coerce.number().min(0).optional(),
  countC: z.coerce.number().min(0).optional(),
  refereeId: z.string().uuid(),
  createdAt: z.coerce
    .date()
    .default(() => new Date())
    .optional(),
  updatedAt: z.coerce
    .date()
    .default(() => new Date())
    .optional(),
});

// Tournament validators
export const insertTournament = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(3).max(100).trim(),
    startDate: z.coerce.date().default(() => new Date()),
    endDate: z.coerce.date().default(() => new Date()),
    year: z.coerce.number().min(0),
    totalGames: z.coerce.number().min(0),
    countA: z.coerce.number().min(1),
    durationA: z.coerce.number().min(1),
    countB: z.coerce.number().min(1).optional(),
    durationB: z.coerce.number().min(1).optional(),
    countC: z.coerce.number().min(1).optional(),
    durationC: z.coerce.number().min(1).optional(),
    clubId: z.string(),
    rateId: z.string(),
    createdAt: z.coerce
      .date()
      .default(() => new Date())
      .optional(),
    updatedAt: z.coerce
      .date()
      .default(() => new Date())
      .optional(),
  })
  .superRefine((data, ctx) => {
    // Check B Batch
    if (data.countB !== undefined && data.countB > 0 && !data.durationB) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duration B is required when Count B is provided',
        path: ['durationB'],
      });
    }

    // Check C Batch
    if (data.countC !== undefined && data.countC > 0 && !data.durationC) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Duration C is required when Count C is provided',
        path: ['durationC'],
      });
    }
  });
