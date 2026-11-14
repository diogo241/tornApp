import { prisma } from '@lib/prisma';
import { matchesSearch } from '@lib/search';
import type {
  insertMember as MemberInput,
  updateMember as MemberUpdateInput,
} from '@lib/validators';
import type { Prisma } from '../../../../generated/prisma/client';
import type { z } from 'zod';

export type MemberListParams = {
  page: number;
  pageSize: number;
  name?: string;
  active?: boolean;
  withPayments?: boolean;
  halfFeeOnly?: boolean;
  lastPaidBefore?: number;
};

const memberSelect = {
  id: true,
  number: true,
  name: true,
  memberSince: true,
  active: true,
  createdAt: true,
  updatedAt: true,
} satisfies Prisma.MemberSelect;

const gridFeePaymentSelect = {
  id: true,
  memberId: true,
  feeId: true,
  paidAt: true,
  method: true,
  methodDetail: true,
  halfFee: true,
  fee: {
    select: {
      year: true,
      active: true,
    },
  },
} satisfies Prisma.FeePaymentSelect;

/**
 * Lists members with server-side pagination, name, status, half-fee and
 * last-paid-year filters. The name search ignores accents and word order.
 * With `withPayments`, each row also carries the payments of active fee years
 * and the latest paid year. Plain calls keep the original payload.
 */
export const listMembers = async ({
  page,
  pageSize,
  name,
  active,
  withPayments,
  halfFeeOnly,
  lastPaidBefore,
}: MemberListParams) => {
  const where: Prisma.MemberWhereInput = {};

  if (typeof active === 'boolean') {
    where.active = active;
  }

  if (halfFeeOnly) {
    where.feePayments = {
      some: {
        halfFee: true,
        fee: { active: true },
      },
    };
  }

  if (typeof lastPaidBefore === 'number') {
    where.NOT = {
      feePayments: { some: { fee: { year: { gte: lastPaidBefore } } } },
    };
  }

  if (name) {
    // Postgres has no accent-insensitive collation configured here, so the
    // terms are matched against the name of the rows that already passed the
    // other filters, and only their ids reach the page query.
    const candidates = await prisma.member.findMany({
      where,
      select: { id: true, name: true },
    });

    where.id = {
      in: candidates
        .filter((candidate) => matchesSearch(candidate.name, name))
        .map((candidate) => candidate.id),
    };
  }

  const skip = (page - 1) * pageSize;

  if (withPayments) {
    const [total, rows] = await prisma.$transaction([
      prisma.member.count({ where }),
      prisma.member.findMany({
        where,
        skip,
        take: pageSize,
        orderBy: { number: 'asc' },
        select: {
          ...memberSelect,
          feePayments: { select: gridFeePaymentSelect },
        },
      }),
    ]);

    const data = rows.map(({ feePayments, ...member }) => {
      const years = feePayments.map((payment) => payment.fee.year);

      return {
        ...member,
        feePayments: feePayments
          .filter((payment) => payment.fee.active)
          .map((payment) => ({
            id: payment.id,
            memberId: payment.memberId,
            feeId: payment.feeId,
            paidAt: payment.paidAt,
            method: payment.method,
            methodDetail: payment.methodDetail,
            halfFee: payment.halfFee,
          })),
        lastPaidYear: years.length > 0 ? Math.max(...years) : null,
      };
    });

    return { data, total };
  }

  const [total, data] = await prisma.$transaction([
    prisma.member.count({ where }),
    prisma.member.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { number: 'asc' },
      select: memberSelect,
    }),
  ]);

  return { data, total };
};

const memberDetailSelect = {
  ...memberSelect,
  feePayments: {
    select: gridFeePaymentSelect,
    orderBy: { fee: { year: 'asc' } },
  },
} satisfies Prisma.MemberSelect;

/**
 * Returns one member with every fee payment (inactive years included) and the
 * latest paid year, or null when the id does not exist.
 */
export const getMemberById = async (id: string) => {
  const member = await prisma.member.findUnique({
    where: { id },
    select: memberDetailSelect,
  });

  if (!member) {
    return null;
  }

  const years = member.feePayments.map((payment) => payment.fee.year);

  return {
    ...member,
    lastPaidYear: years.length > 0 ? Math.max(...years) : null,
  };
};

/**
 * Creates a member from validated input.
 */
export const createMember = async (data: z.infer<typeof MemberInput>) => {
  return prisma.member.create({ data, select: memberSelect });
};

/**
 * Updates a member from validated partial input.
 */
export const updateMember = async (
  id: string,
  data: z.infer<typeof MemberUpdateInput>,
) => {
  return prisma.member.update({ where: { id }, data, select: memberSelect });
};

export class MemberHasFeePaymentsError extends Error {
  constructor() {
    super('Sócio com quotas registadas; desativar em vez de eliminar');
    this.name = 'MemberHasFeePaymentsError';
  }
}

/**
 * Deletes a member without fee payments. A member with payments must be
 * deactivated instead, so its financial history is preserved.
 */
export const deleteMember = async (id: string) => {
  return prisma.$transaction(async (tx) => {
    const payments = await tx.feePayment.count({ where: { memberId: id } });

    if (payments > 0) {
      throw new MemberHasFeePaymentsError();
    }

    return tx.member.delete({ where: { id }, select: memberSelect });
  });
};
