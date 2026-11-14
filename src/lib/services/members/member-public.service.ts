import { verifyMemberViewToken } from '@lib/members/view-token';
import { prisma } from '@lib/prisma';
import type {
  FeePaymentMethod,
  PublicMemberPayment,
  PublicMemberView,
} from '@lib/types';
import { round2 } from '@lib/utils';
import type { Prisma } from '../../../../generated/prisma/client';

const publicMemberSelect = {
  name: true,
  number: true,
  memberSince: true,
  active: true,
  feePayments: {
    orderBy: { fee: { year: 'desc' } },
    select: {
      paidAt: true,
      method: true,
      methodDetail: true,
      halfFee: true,
      fee: {
        select: {
          year: true,
          amount: true,
        },
      },
    },
  },
} satisfies Prisma.MemberSelect;

/**
 * Returns the minimal read-only public DTO for a member, or null when not found.
 * Includes paid rows across all fee years (including inactive years) ordered by
 * year descending.
 */
export const getMemberPublicView = async (
  memberId: string,
): Promise<PublicMemberView | null> => {
  const member = await prisma.member.findUnique({
    where: { id: memberId },
    select: publicMemberSelect,
  });

  if (!member) {
    return null;
  }

  const payments: PublicMemberPayment[] = member.feePayments.map((payment) => ({
    year: payment.fee.year,
    paidAt: payment.paidAt ? payment.paidAt.toISOString() : null,
    method: payment.method as FeePaymentMethod,
    methodDetail: payment.methodDetail,
    halfFee: payment.halfFee,
    amountPaid: round2(Number(payment.fee.amount) * (payment.halfFee ? 0.5 : 1)),
  }));

  const lastPaidYear =
    payments.length > 0
      ? Math.max(...payments.map((payment) => payment.year))
      : null;

  return {
    member: {
      name: member.name,
      number: member.number,
      memberSince: member.memberSince,
      active: member.active,
    },
    lastPaidYear,
    payments,
  };
};

/**
 * Verifies a signed view token and returns the public member DTO, or null when
 * the token is missing, malformed, tampered, or points to an unknown member.
 * Throws MemberViewSecretError when MEMBER_VIEW_SECRET is missing or short.
 */
export const getPublicMemberViewByToken = async (
  token: string | null | undefined,
): Promise<PublicMemberView | null> => {
  const memberId = verifyMemberViewToken(token ?? '');
  if (!memberId) {
    return null;
  }

  return getMemberPublicView(memberId);
};
