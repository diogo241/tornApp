'use client';

import type { AuthProvider } from '@refinedev/core';
import { signIn, signOut, getSession } from '@/lib/auth-client';

export const authProviderClient: AuthProvider = {
  login: async ({ email, password, remember }) => {
    const result = await signIn.email({
      email,
      password,
      rememberMe: remember || false,
    });

    if (!result.error) {
      return {
        success: true,
        redirectTo: '/',
      };
    }

    return {
      success: false,
      error: {
        name: 'LoginError',
        message: 'Invalid username or password',
      },
    };
  },
  logout: async () => {
    await signOut();
    return {
      success: true,
      redirectTo: '/login',
    };
  },
  getIdentity: async () => {
    const { data } = await getSession();
    const user = data?.user;
    if (user) {
      return user;
    }
    return null;
  },
  check: async () => {
    const { data } = await getSession();
    if (data) {
      return {
        authenticated: true,
      };
    }

    return {
      authenticated: false,
      logout: true,
      redirectTo: '/login',
    };
  },
  onError: async (error) => {
    if (error.response?.status === 401) {
      return {
        logout: true,
      };
    }

    return { error };
  },
};
