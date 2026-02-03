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