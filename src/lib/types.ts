import { z } from 'zod';
import { insertClub, type insertReferee, type insertUser } from './validators';

export type Club = z.infer<typeof insertClub>;

export type User = z.infer<typeof insertUser> & {
  role?: string;
  sessions?: Session[];
};

export type Referee = z.infer<typeof insertReferee>;

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
