import { prisma } from '@lib/prisma';
import type { FeePaymentMethod } from '@lib/types';
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
