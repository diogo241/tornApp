import { betterAuth } from 'better-auth';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { prisma } from './prisma';
import { headers } from 'next/headers';
import { admin } from 'better-auth/plugins';
import type { User } from './types';

export const auth = betterAuth({
  database: prismaAdapter(prisma, {
    provider: 'postgresql',
  }),
  plugins: [
    admin({
      defaultRole: 'admin',
      adminRoles: ['admin'],
    }),
  ],
  emailAndPassword: {
    enabled: true,
    autoSignIn: false,
  },
  user: {
    changeEmail: {
      enabled: true,
      updateEmailWithoutVerification: true,
    },
  },
  session: {
    cookieCache: {
      enabled: true,
      maxAge: 60 * 60,
    },
  },
});

export async function getSession() {
  const result = await auth.api.getSession({
    headers: await headers(),
  });

  return result;
}

export async function updateUser(id: string, data: User) {
  const result = await auth.api.adminUpdateUser({
    body: {
      userId: id,
      data,
    },
    headers: await headers(),
  });

  return result;
}

export async function updateUserPassword(id: string, newPassword: string) {
  const result = await auth.api.setUserPassword({
    body: {
      userId: id,
      newPassword,
    },
    headers: await headers(),
  });

  return result;
}

export async function createUser(data: User) {
  const result = await auth.api.createUser({
    body: {
      email: data.email,
      password: data.password,
      name: data.name,
    },
    headers: await headers(),
  });

  return result;
}

export async function deleteUser(id: string) {
  const result = await auth.api.removeUser({
    body: {
      userId: id,
    },
    headers: await headers(),
  });

  return result;
}
