import { prisma } from '@lib/prisma';
import type { FeePaymentMethod, PaidFeesResponse } from '@lib/types';
import { round2 } from '@lib/utils';
import type { Prisma } from '../../../../generated/prisma/client';

export type FeePaymentWriteData = {
  paidAt: Date | null;
  method: FeePaymentMethod;
  methodDetail: string | null;
  halfFee: boolean;
};

// MESQUITA: registo de pagamento passa a ser apenas criacao
export type FeePaymentCreateInput = FeePaymentWriteData & {
  memberId: string;
  feeId: string;
};

export type FeePaymentCreateResult =
  | { ok: true; payment: FeePaymentRecord }
  | {
      ok: false;
      error: 'member-not-found' | 'fee-not-found' | 'fee-inactive';
    };

const feePaymentSelect = {
  id: true,
  memberId: true,
  feeId: true,
  paidAt: true,
  method: true,
  methodDetail: true,
  halfFee: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.FeePaymentSelect;

export type FeePaymentRecord = Prisma.FeePaymentGetPayload<{
  select: typeof feePaymentSelect;
}>;

// MESQUITA: criacao deixa de substituir um pagamento existente
/**
 * Creates the single payment of a member for a fee year.
 * Also checks that the member and an active fee exist.
 */
export const createFeePayment = async ({
  memberId,
  feeId,
  ...paymentData
}: FeePaymentCreateInput): Promise<FeePaymentCreateResult> => {
  const [member, fee] = await prisma.$transaction([
    prisma.member.findUnique({
      where: { id: memberId },
      select: { id: true },
    }),
    prisma.fee.findUnique({
      where: { id: feeId },
      select: { id: true, active: true },
    }),
  ]);

  if (!member) {
    return { ok: false, error: 'member-not-found' };
  }

  if (!fee) {
    return { ok: false, error: 'fee-not-found' };
  }

  if (!fee.active) {
    return { ok: false, error: 'fee-inactive' };
  }

  const payment = await prisma.feePayment.create({
    data: { memberId, feeId, ...paymentData },
    select: feePaymentSelect,
  });

  return { ok: true, payment };
};

/**
 * Replaces the payment fields of an existing payment row.
 */
export const updateFeePayment = async (
  id: string,
  data: FeePaymentWriteData,
) => {
  return prisma.feePayment.update({
    where: { id },
    data,
    select: feePaymentSelect,
  });
};

/**
 * Removes a payment row, restoring the "não paga" state.
 */
export const deleteFeePayment = async (id: string) => {
  return prisma.feePayment.delete({
    where: { id },
    select: feePaymentSelect,
  });
};

export type PaidFeesListParams = {
  page: number;
  pageSize: number;
  from?: string;
  to?: string;
};

const paidFeeRowSelect = {
  id: true,
  paidAt: true,
  method: true,
  methodDetail: true,
  halfFee: true,
  member: { select: { number: true, name: true } },
  fee: { select: { year: true, amount: true } },
} satisfies Prisma.FeePaymentSelect;

const nextUtcDay = (value: string) => {
  const date = new Date(`${value}T00:00:00.000Z`);
  date.setUTCDate(date.getUTCDate() + 1);
  return date;
};

const halfFeeValue = (amount: number, halfFee: boolean) =>
  round2(amount * (halfFee ? 0.5 : 1));

type OtherMethodLine = {
  label: string;
  amount: number;
  count: number;
};

const isBetterOtherLabel = (
  candidate: { label: string; date: Date | null },
  current: { label: string; date: Date | null },
) => {
  const candidateTime = candidate.date?.getTime() ?? null;
  const currentTime = current.date?.getTime() ?? null;

  if (candidateTime !== currentTime) {
    if (candidateTime === null) return false;
    if (currentTime === null) return true;
    return candidateTime > currentTime;
  }

  const candidateHasLabel = candidate.label !== '';
  const currentHasLabel = current.label !== '';

  if (candidateHasLabel !== currentHasLabel) {
    return candidateHasLabel;
  }

  return candidate.label < current.label;
};

const listPaidFeeGroups = (where: Prisma.FeePaymentWhereInput) =>
  prisma.feePayment.groupBy({
    by: ['feeId', 'method', 'methodDetail', 'halfFee'],
    where,
    orderBy: { feeId: 'asc' },
    _count: { _all: true },
    _max: { paidAt: true },
  });

/**
 * Lists paid fees with the totals of the whole filtered set. The aggregate
 * reads one row per distinct fee, method, description and half-fee
 * combination, so no payment is loaded per row.
 */
export const listPaidFees = async ({
  page,
  pageSize,
  from,
  to,
}: PaidFeesListParams): Promise<PaidFeesResponse> => {
  const where: Prisma.FeePaymentWhereInput = {};

  if (from || to) {
    where.paidAt = {
      ...(from ? { gte: new Date(`${from}T00:00:00.000Z`) } : {}),
      ...(to ? { lt: nextUtcDay(to) } : {}),
    };
  }

  const [total, rows, groups, feeCatalog] = await prisma.$transaction([
    prisma.feePayment.count({ where }),
    prisma.feePayment.findMany({
      where,
      skip: (page - 1) * pageSize,
      take: pageSize,
      orderBy: [
        { paidAt: { sort: 'desc', nulls: 'last' } },
        { createdAt: 'desc' },
      ],
      select: paidFeeRowSelect,
    }),
    listPaidFeeGroups(where),
    prisma.fee.findMany({ select: { id: true, amount: true } }),
  ]);

  const feeAmounts = new Map(
    feeCatalog.map((fee) => [fee.id, Number(fee.amount)]),
  );

  let amount = 0;
  let cash = 0;
  const other = new Map<
    string,
    OtherMethodLine & { labelDate: Date | null }
  >();

  for (const group of groups) {
    const unitValue = halfFeeValue(
      feeAmounts.get(group.feeId) ?? 0,
      group.halfFee,
    );
    const count = group._count._all;
    const cellValue = round2(unitValue * count);

    amount += cellValue;

    if (group.method === 'cash') {
      cash += cellValue;
      continue;
    }

    if (group.method !== 'other') {
      continue;
    }

    const label = (group.methodDetail ?? '').trim();
    const key = label.toLowerCase();
    const current = other.get(key);
    const candidate = { label, date: group._max.paidAt };

    if (!current) {
      other.set(key, {
        label,
        labelDate: candidate.date,
        amount: cellValue,
        count,
      });
      continue;
    }

    current.amount += cellValue;
    current.count += count;

    if (
      isBetterOtherLabel(candidate, {
        label: current.label,
        date: current.labelDate,
      })
    ) {
      current.label = label;
      current.labelDate = candidate.date;
    }
  }

  const otherLines = [...other.values()]
    .map((entry) => ({
      label: entry.label === '' ? 'Outros (sem descrição)' : entry.label,
      amount: round2(entry.amount),
      count: entry.count,
    }))
    .sort((a, b) =>
      a.label.localeCompare(b.label, 'pt-PT', { sensitivity: 'base' }),
    );

  return {
    data: rows.map((row) => ({
      id: row.id,
      paidAt: row.paidAt?.toISOString() ?? null,
      method: row.method as FeePaymentMethod,
      methodDetail: row.methodDetail,
      halfFee: row.halfFee,
      value: halfFeeValue(Number(row.fee.amount), row.halfFee),
      member: row.member,
      fee: { year: row.fee.year, amount: Number(row.fee.amount) },
    })),
    total,
    totals: {
      count: total,
      amount: round2(amount),
      byMethod: {
        cash: round2(cash),
        other: otherLines,
      },
    },
  };
};
