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
import { i18nProvider } from '@lib/i18n';
import { DevtoolsPanel, DevtoolsProvider } from '@refinedev/devtools';
import Image from 'next/image';
import {
  BanknoteIcon,
  BrickWallIcon,
  Dice4,
  HandCoinsIcon,
  LayoutDashboardIcon,
  ReceiptIcon,
  ShieldBan,
  ShieldBanIcon,
  UniversityIcon,
  UserIcon,
  UsersIcon,
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
            i18nProvider={i18nProvider}
            resources={[
              {
                name: 'dashboard',
                list: '/dashboard',
                meta: {
                  label: 'Painel',
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
                  label: 'Torneios',
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
                  label: 'Árbitros',
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
                  label: 'Valor por jogo',
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
                  label: 'Clubes',
                  icon: <ShieldBanIcon />,
                },
              },
              {
                name: 'members',
                list: '/members',
                create: '/members/create',
                edit: '/members/edit/:id',
                show: '/members/show/:id',
                meta: {
                  canDelete: true,
                  canShow: true,
                  label: 'Sócios',
                  icon: <UsersIcon />,
                },
              },
              {
                name: 'fees',
                list: '/members/fees',
                create: '/members/fees/create',
                edit: '/members/fees/edit/:id',
                meta: {
                  canDelete: true,
                  canShow: false,
                  hide: true,
                  label: 'Valores das quotas',
                  parent: 'members',
                  icon: <ReceiptIcon />,
                },
              },
              {
                name: 'quotas',
                list: '/members/quotas',
                meta: {
                  hide: true,
                  label: 'Quotas',
                  parent: 'members',
                  icon: <BanknoteIcon />,
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
                  label: 'Financiamento Municipal',
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
                  label: 'Utilizadores',
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
                  label: 'Jogos',
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
                    alt="NAF"
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
