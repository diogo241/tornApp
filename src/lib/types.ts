import { z } from 'zod';
import {
  insertClub,
  insertFee,
  insertMember,
  insertReferee,
  insertUser,
  insertRate,
  type insertTournament,
  type insertRefereeAssignment,
  type insertClubFunding,
} from './validators';

type Session = {
  id: string;
  expiresAt: Date;
  token: string;
  createdAt: Date;
  updatedAt: Date;
  ipAddress: string;
  userAgent: string;
  userId: string;
  user: User;
};

export type RefereeAssignment = z.infer<typeof insertRefereeAssignment> & {
  id?: string;
  tournament?: Tournament;
  referee?: Referee;
  totalCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Club = z.infer<typeof insertClub> & {
  totalCost?: number;
  clubBalance?: ClubBalance;
  refereeCost?: number;
};

export type User = z.infer<typeof insertUser> & {
  role?: string;
  sessions?: Session[];
};

export type Referee = z.infer<typeof insertReferee> & {
  totalCost?: number;
  paid?: boolean;
};

export type Rate = z.infer<typeof insertRate> & {
  id?: string;
  createdAt?: Date;
};

export type Tournament = z.infer<typeof insertTournament> & {
  club?: Club;
  rate?: Rate;
  totalCost?: number;
  assignments?: RefereeAssignment[];
  createdAt?: Date;
  updatedAt?: Date;
  id?: string;
};

export type ClubFunding = z.infer<typeof insertClubFunding> & {
  id?: string;
  totalFundingCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
  clubBalances?: ClubBalance[];
};

export type Member = z.infer<typeof insertMember> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type Fee = z.infer<typeof insertFee> & {
  id?: string;
  createdAt?: Date;
  updatedAt?: Date;
};

export type FeePaymentMethod = 'cash' | 'mbway' | 'other';

export type FeePayment = {
  id: string;
  memberId: string;
  feeId: string;
  paidAt: string | null;
  method: FeePaymentMethod;
  methodDetail: string | null;
  halfFee: boolean;
  createdAt?: string;
  updatedAt?: string;
  fee?: {
    year: number;
    active: boolean;
  };
};

export type MemberWithPayments = Omit<Member, 'id'> & {
  id: string;
  feePayments: FeePayment[];
  lastPaidYear: number | null;
};

export type ClubBalance = {
  id: string;
  clubId?: string;
  club?: Club;
  clubFunding?: ClubFunding;
  netBalance?: number;
  totalCost?: number;
  paid?: boolean;
  createdAt?: Date;
  updatedAt?: Date;
};

export type PaidFeeRow = {
  id: string;
  paidAt: string | null;
  method: FeePaymentMethod;
  methodDetail: string | null;
  halfFee: boolean;
  value: number;
  member: { number: number; name: string };
  fee: { year: number; amount: number };
};

export type PaidFeesTotals = {
  count: number;
  amount: number;
  byMethod: {
    cash: number;
    other: Array<{ label: string; amount: number; count: number }>;
  };
};

export type PaidFeesResponse = {
  data: PaidFeeRow[];
  total: number;
  totals: PaidFeesTotals;
};
