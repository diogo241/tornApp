import { z } from 'zod';
import {
  insertClub,
  insertReferee,
  insertUser,
  insertRate,
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

export type Club = z.infer<typeof insertClub>;

export type User = z.infer<typeof insertUser> & {
  role?: string;
  sessions?: Session[];
};

export type Referee = z.infer<typeof insertReferee>;

export type Rate = z.infer<typeof insertRate>;
