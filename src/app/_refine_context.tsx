'use client';

import { Refine, useRefineOptions } from '@refinedev/core';
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
import Image from 'next/image';
import {
  BrickWallIcon,
  Dice4,
  HandCoinsIcon,
  LayoutDashboardIcon,
  ShieldBan,
  ShieldBanIcon,
  UniversityIcon,
  UserIcon,
  WarehouseIcon,
} from 'lucide-react';

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
                name: 'dashboard',
                list: '/dashboard',
                meta: {
                  label: 'Dashboard',
                  icon: <LayoutDashboardIcon />,
                },
              },
              {
                name: 'tournaments',
                list: '/tournaments',
                create: '/tournaments/create',
                edit: '/tournaments/edit/:id',
                show: '/tournaments/show/:id',
                meta: {
                  canDelete: true,
                  icon: <Dice4 />,
                },
              },
              {
                name: 'referees',
                list: '/referees',
                create: '/referees/create',
                edit: '/referees/edit/:id',
                show: '/referees/show/:id',

                meta: {
                  canDelete: true,
                  icon: <UserIcon />,
                },
              },
              {
                name: 'rates',
                list: '/rates',
                create: '/rates/create',
                edit: '/rates/edit/:id',
                show: '/rates/show/:id',
                meta: {
                  canDelete: true,
                  canShow: false,
                  icon: <HandCoinsIcon />,
                },
              },
              {
                name: 'clubs',
                list: '/clubs',
                create: '/clubs/create',
                edit: '/clubs/edit/:id',
                show: '/clubs/show/:id',
                meta: {
                  canDelete: true,
                  icon: <ShieldBanIcon />,
                },
              },
              {
                name: 'club-funding',
                list: '/club-funding',
                edit: '/club-funding/edit/:id',
                meta: {
                  canDelete: false,
                  canShow: false,
                  canCreate: false,
                  icon: <UniversityIcon />,
                  label: 'Municipal Funding',
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
                  icon: <BrickWallIcon />,
                },
              },
              {
                name: 'assignemts',
                list: '/assignemts',
                create: '/assignemts/create',
                edit: '/assignemts/edit/:id',
                meta: {
                  canDelete: true,
                  canShow: false,
                  hide: true,
                  label: 'Referee Assignements',
                },
              },
            ]}
            options={{
              syncWithLocation: true,
              disableTelemetry: true,
              title: {
                icon: (
                  <Image
                    src="/logo.png"
                    alt="Refine"
                    width={100}
                    height={100}
                  />
                ),
                text: 'NAF',
              },
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
