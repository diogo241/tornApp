import type { AuthProvider } from '@refinedev/core';
import {  getSession } from '../../lib/auth';

export const authProviderServer: Pick<AuthProvider, 'check'> = {
  check: async () => {
    const session = await getSession();

    if (session) {
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
};
