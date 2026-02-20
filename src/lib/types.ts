import { z } from 'zod';
import {
  insertClub,
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
};

export type User = z.infer<typeof insertUser> & {
  role?: string;
  sessions?: Session[];
};

export type Referee = z.infer<typeof insertReferee> & {
  totalCost?: number;
};

export type Rate = z.infer<typeof insertRate>;

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
  createdAt?: Date;
  updatedAt?: Date;
};

export type ClubBalance = {
  id: string;
  clubId?: string;
  club?: Club;
  clubFunding?: ClubFunding;
  netBalance?: number;
  totalCost?: number;
  createdAt?: Date;
  updatedAt?: Date;
};
