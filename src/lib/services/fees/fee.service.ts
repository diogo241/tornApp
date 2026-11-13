import { prisma } from '@lib/prisma';
import type {
  insertFee as FeeInput,
  updateFee as FeeUpdateInput,
} from '@lib/validators';
import type { Prisma } from '../../../../generated/prisma/client';
import type { z } from 'zod';

export type FeeListParams = {
  page: number;
  pageSize: number;
  active?: boolean;
};

const feeSelect = {
  id: true,
  year: true,
  amount: true,
  label: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FeeSelect;

/**
 * Lists the annual fee catalog with server-side pagination.
 */
export const listFees = async ({ page, pageSize, active }: FeeListParams) => {
  const where: Prisma.FeeWhereInput = {};

  if (typeof active === 'boolean') {
    where.active = active;
  }

  const [total, data] = await prisma.$transaction([
    prisma.fee.count({ where }),
    prisma.fee.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: { year: 'asc' },
      select: feeSelect,
    }),
  ]);

  return { data, total };
};

/**
 * Returns one fee or null when the id does not exist.
 */
export const getFeeById = async (id: string) => {
  return prisma.fee.findUnique({
    where: { id },
    select: feeSelect,
  });
};

/**
 * Returns every active fee year in ascending order. One query, shared by the
 * cotas grid columns, so the grid never paginates the catalog.
 */
export const listActiveFees = async () => {
  return prisma.fee.findMany({
    where: { active: true },
    orderBy: { year: 'asc' },
    select: feeSelect,
  });
};

/**
 * Creates a fee year from validated input.
 */
export const createFee = async (data: z.infer<typeof FeeInput>) => {
  return prisma.fee.create({ data, select: feeSelect });
};

/**
 * Updates a fee year from validated partial input.
 */
export const updateFee = async (
  id: string,
  data: z.infer<typeof FeeUpdateInput>,
) => {
  return prisma.fee.update({ where: { id }, data, select: feeSelect });
};

export class FeeHasFeePaymentsError extends Error {
  constructor() {
    super('Cota com pagamentos registados; desativar em vez de eliminar');
    this.name = 'FeeHasFeePaymentsError';
  }
}

/**
 * Deletes a fee year without payments. A year with payments must be
 * deactivated instead, so the history is preserved.
 */
export const deleteFee = async (id: string) => {
  return prisma.$transaction(async (tx) => {
    const payments = await tx.feePayment.count({ where: { feeId: id } });

    if (payments > 0) {
      throw new FeeHasFeePaymentsError();
    }

    return tx.fee.delete({ where: { id }, select: feeSelect });
  });
};
