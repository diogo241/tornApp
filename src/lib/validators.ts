import { z } from 'zod';

// Pagination validators
export const paginationQuerySchema = z.object({
  page: z.coerce
    .number({
      invalid_type_error: 'A página tem de ser um número',
      required_error: 'A página é obrigatória',
    })
    .int('A página tem de ser um número inteiro')
    .positive('A página tem de ser positiva')
    .default(1)
    .optional(),
  pageSize: z.coerce
    .number({
      invalid_type_error: 'O número de linhas por página tem de ser um número',
      required_error: 'O número de linhas por página é obrigatório',
    })
    .int('O número de linhas por página tem de ser um número inteiro')
    .positive('O número de linhas por página tem de ser positivo')
    .max(100, 'O número de linhas por página não pode exceder 100')
    .default(10)
    .optional(),
});

// Filters validators
export const filtersQuerySchema = z.object({
  name: z.string().optional(),
  club: z.string().optional(),
  refereeId: z.string().optional(),
  tournamentId: z.string().optional(),
  clubId: z.string().optional(),
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
    id: z.string().optional(),
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
    message: 'As palavras-passe não coincidem',
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

// Referee update validators
export const updateReferee = z.object({
  name: z.string().min(3).max(250).trim().optional(),
  paid: z.boolean().optional(),
});

// Rate validators
export const insertRate = z
  .object({
    id: z.string().uuid().optional(),
    name: z.string().min(3).max(100).trim(),
    players: z.coerce.number().min(1).max(11),
    refRate: z.coerce.number().min(0).max(100),
    aRate: z.coerce.number().min(0).max(100).optional(),
  })
  .transform((data) => {
    if (data.players !== 11) {
      data.aRate = 0;
    }
    return data;
  });

// Referee Assignment validators
export const insertRefereeAssignment = z
  .object({
    countA: z.coerce.number().min(0).optional(),
    countB: z.coerce.number().min(0).optional(),
    countC: z.coerce.number().min(0).optional(),
    countARef: z.coerce.number().min(0).optional(),
    countBRef: z.coerce.number().min(0).optional(),
    countCRef: z.coerce.number().min(0).optional(),
    refereeId: z.string().min(1, { message: 'O árbitro é obrigatório' }),
    tournamentId: z.string().min(1, { message: 'O torneio é obrigatório' }),
  })
  .superRefine((data, ctx) => {
    // Check if sum of games is greater then zero
    if (
      (data.countA ?? 0) +
        (data.countB ?? 0) +
        (data.countC ?? 0) +
        (data.countARef ?? 0) +
        (data.countBRef ?? 0) +
        (data.countCRef ?? 0) ===
      0
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Tem de indicar pelo menos um jogo',
        path: [
          'countA',
          'countB',
          'countC',
          'countARef',
          'countBRef',
          'countCRef',
        ],
      });
    }
  });

// Tournament validators
export const insertTournament = z
  .object({
    name: z.string().min(3).max(100).trim(),
    startDate: z.coerce.date(),
    endDate: z.coerce.date(),
    year: z.coerce.number().min(0),
    totalGames: z.coerce.number().min(0),
    countA: z.coerce.number().min(1),
    durationA: z.coerce.number().min(1),
    countB: z.coerce.number().min(0).optional(),
    durationB: z.coerce.number().min(0).optional(),
    countC: z.coerce.number().min(0).optional(),
    durationC: z.coerce.number().min(0).optional(),
    clubId: z.string().min(1, { message: 'O clube é obrigatório' }),
    rateId: z.string().min(1, { message: 'O escalão é obrigatório' }),
  })
  .superRefine((data, ctx) => {
    // Check if countA + countB + countC is equal to totalGames
    if (
      data.countA + (data.countB ?? 0) + (data.countC ?? 0) !==
      data.totalGames
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message:
          'O total de jogos tem de ser igual à soma dos jogos com duração principal, B e C',
        path: ['totalGames'],
      });
    }

    // Check B Batch
    if (data.countB !== undefined && data.countB > 0 && !data.durationB) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A duração B é obrigatória quando existem jogos com duração B',
        path: ['durationB'],
      });
    }

    // Check C Batch
    if (data.countC !== undefined && data.countC > 0 && !data.durationC) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'A duração C é obrigatória quando existem jogos com duração C',
        path: ['durationC'],
      });
    }

    // Set countC to 0 if countB is 0
    if (data.countB === 0 && data.countC !== undefined && data?.countC > 0) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Não pode indicar jogos com duração C sem jogos com duração B',
        path: ['countB'],
      });
    }

    // Set durationC to 0 if countC is 0
    if (data.countC === 0) data.durationC = 0;
  });

// Club Funding validators
export const insertClubFunding = z.object({
  year: z.coerce.number().min(0),
  amount: z.coerce.number().min(0),
});

// Club Balance validators
export const updateClubBalancePaid = z.object({
  paid: z.boolean(),
});

const currentYear = new Date().getFullYear();

const memberSinceSchema = z
  .number({ invalid_type_error: 'Sócio desde tem de ser um ano' })
  .int('Sócio desde tem de ser um ano inteiro')
  .min(1950, 'Sócio desde não pode ser anterior a 1950')
  .max(
    currentYear + 1,
    `Sócio desde não pode ser superior a ${currentYear + 1}`,
  )
  .nullable();

export const insertMember = z.object({
  number: z.coerce
    .number({
      invalid_type_error: 'Nº de sócio tem de ser um número',
      required_error: 'Nº de sócio é obrigatório',
    })
    .int('Nº de sócio tem de ser inteiro')
    .positive('Nº de sócio tem de ser positivo'),
  name: z
    .string({ required_error: 'Nome é obrigatório' })
    .min(3, 'Nome tem de ter pelo menos 3 caracteres')
    .max(250, 'Nome não pode ter mais de 250 caracteres')
    .trim(),
  memberSince: memberSinceSchema,
  active: z.boolean().optional(),
});

export const updateMember = z
  .object({
    number: z.coerce.number().int().positive().optional(),
    name: z
      .string()
      .min(3, 'Nome tem de ter pelo menos 3 caracteres')
      .max(250, 'Nome não pode ter mais de 250 caracteres')
      .trim()
      .optional(),
    memberSince: memberSinceSchema.optional(),
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum campo para atualizar',
  });

export const memberFilter = z.object({
  name: z.string().trim().min(1).max(250).optional(),
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  payments: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  halfFee: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
  lastPaidBefore: z.coerce
    .number({ invalid_type_error: 'Ano de última paga inválido' })
    .int('Ano de última paga inválido')
    .min(2000, 'Ano de última paga inválido')
    .max(2100, 'Ano de última paga inválido')
    .optional(),
});

// Fee validators
const feeYearSchema = z.coerce
  .number({
    invalid_type_error: 'Ano tem de ser um número',
    required_error: 'Ano é obrigatório',
  })
  .int('Ano tem de ser inteiro')
  .min(2000, 'Ano não pode ser anterior a 2000')
  .max(2100, 'Ano não pode ser superior a 2100');

const feeAmountSchema = z.coerce
  .number({
    invalid_type_error: 'Valor tem de ser um número',
    required_error: 'Valor é obrigatório',
  })
  .min(0, 'Valor não pode ser negativo')
  .max(10000, 'Valor não pode exceder 10000')
  .refine(
    (value) => Math.abs(value * 100 - Math.round(value * 100)) < 1e-9,
    'Valor só pode ter 2 casas decimais',
  );

const feeLabelSchema = z
  .string({ invalid_type_error: 'Descrição tem de ser texto' })
  .trim()
  .max(100, 'Descrição não pode ter mais de 100 caracteres')
  .nullable()
  .transform((value) => (value === '' ? null : value))
  .optional();

export const insertFee = z.object({
  year: feeYearSchema,
  amount: feeAmountSchema,
  label: feeLabelSchema,
  active: z.boolean().optional(),
});

export const updateFee = z
  .object({
    year: feeYearSchema.optional(),
    amount: feeAmountSchema.optional(),
    label: feeLabelSchema,
    active: z.boolean().optional(),
  })
  .refine((data) => Object.keys(data).length > 0, {
    message: 'Nenhum campo para atualizar',
  });

export const feeFilter = z.object({
  active: z
    .enum(['true', 'false'])
    .transform((value) => value === 'true')
    .optional(),
});

// Fee payment validators
const feePaymentDateSchema = z
  .string({
    required_error: 'Data do pagamento é obrigatória',
    invalid_type_error: 'Data do pagamento inválida',
  })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data do pagamento inválida')
  .superRefine((value, ctx) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data do pagamento inválida',
      });
      return;
    }

    if (date.getTime() > Date.now()) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data do pagamento não pode ser futura',
      });
    }
  });

const feePaymentMethodSchema = z.enum(['cash', 'other'], {
  errorMap: () => ({ message: 'Tipologia inválida' }),
});

const feePaymentDetailSchema = z
  .string({ invalid_type_error: 'Descrição tem de ser texto' })
  .trim()
  .max(250, 'Descrição não pode ter mais de 250 caracteres')
  .nullable()
  .optional();

type FeePaymentRulesInput = {
  method?: 'cash' | 'other';
  methodDetail?: string | null;
};

const requirePaymentMethodDetail = (
  data: FeePaymentRulesInput,
  ctx: z.RefinementCtx,
) => {
  if (data.method === 'other' && !data.methodDetail) {
    ctx.addIssue({
      code: z.ZodIssueCode.custom,
      message: 'Descrição é obrigatória quando a tipologia é Outros',
      path: ['methodDetail'],
    });
  }
};

const emptyPaymentMethodDetail = (data: FeePaymentRulesInput) =>
  data.method === 'other' ? (data.methodDetail ?? null) : null;

// MESQUITA: schema passa a refletir a criacao de um pagamento
export const createFeePayment = z
  .object({
    memberId: z
      .string({
        required_error: 'Sócio é obrigatório',
        invalid_type_error: 'Sócio inválido',
      })
      .min(1, 'Sócio é obrigatório')
      .max(64, 'Sócio inválido'),
    feeId: z
      .string({
        required_error: 'Quota é obrigatória',
        invalid_type_error: 'Quota inválida',
      })
      .min(1, 'Quota é obrigatória')
      .max(64, 'Quota inválida'),
    paidAt: feePaymentDateSchema,
    method: feePaymentMethodSchema.optional(),
    methodDetail: feePaymentDetailSchema,
    halfFee: z.boolean().optional(),
  })
  .superRefine(requirePaymentMethodDetail)
  .transform((data) => ({
    memberId: data.memberId,
    feeId: data.feeId,
    paidAt: data.paidAt,
    method: data.method ?? 'cash',
    methodDetail: emptyPaymentMethodDetail(data),
    halfFee: data.halfFee ?? false,
  }));

export const updateFeePayment = z
  .object({
    paidAt: feePaymentDateSchema,
    method: feePaymentMethodSchema,
    methodDetail: feePaymentDetailSchema,
    halfFee: z.boolean(),
  })
  .superRefine(requirePaymentMethodDetail);

// Paid fees dashboard filter
const cotasPagasDateSchema = z
  .string({ invalid_type_error: 'Data inválida' })
  .trim()
  .regex(/^\d{4}-\d{2}-\d{2}$/, 'Data inválida')
  .superRefine((value, ctx) => {
    const date = new Date(`${value}T00:00:00.000Z`);

    if (
      Number.isNaN(date.getTime()) ||
      date.toISOString().slice(0, 10) !== value
    ) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Data inválida',
      });
    }
  });

export const cotasPagasFilter = z
  .object({
    from: cotasPagasDateSchema.optional(),
    to: cotasPagasDateSchema.optional(),
  })
  .superRefine((data, ctx) => {
    if (data.from && data.to && data.from > data.to) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: 'Intervalo de datas inválido',
        path: ['to'],
      });
    }
  });
