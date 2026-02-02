import { z } from 'zod';
import { insertClub, type insertUser } from './validators';

export type Club = z.infer<typeof insertClub>;

export type User = z.infer<typeof insertUser> & {
  role?: string;
  sessions?: Session[];
};

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
