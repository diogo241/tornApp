'use client';

import { Refine } from '@refinedev/core';
import { RefineKbar, RefineKbarProvider } from '@refinedev/kbar';
import React from 'react';

import routerProvider from '@refinedev/nextjs-router';

import '@/app/globals.css';
import { Toaster } from '@/components/refine-ui/notification/toaster';
import { useNotificationProvider } from '@/components/refine-ui/notification/use-notification-provider';
import { ThemeProvider } from '@/components/refine-ui/theme/theme-provider';
import { authProviderClient } from '@providers/auth-provider/auth-provider.client';
import { dataProvider } from '@providers/data-provider';
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools';

type RefineContextProps = {
  children: React.ReactNode;
};

export const RefineContext = ({ children }: RefineContextProps) => {
  const notificationProvider = useNotificationProvider();

  return (
    <DevtoolsProvider>
      <RefineKbarProvider>
        <ThemeProvider>
          <Refine
            dataProvider={dataProvider}
            notificationProvider={notificationProvider}
            authProvider={authProviderClient}
            routerProvider={routerProvider}
            resources={[
              {
                name: 'clubs',
                list: '/clubs',
                create: '/clubs/create',
                edit: '/clubs/edit/:id',
                show: '/clubs/show/:id',
                meta: {
                  canDelete: true,
                },
              },
              {
                name: 'users',
                list: '/users',
                create: '/users/create',
                edit: '/users/edit/:id',
                show: '/users/show/:id',
                meta: {
                  canDelete: true,
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              warnWhenUnsavedChanges: true,
            }}
          >
            {children}
            <Toaster />
            <RefineKbar />
          </Refine>
          <DevtoolsPanel />
        </ThemeProvider>
      </RefineKbarProvider>
    </DevtoolsProvider>
  );
};
