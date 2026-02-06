'use client';

import { DeleteButton } from '@/components/refine-ui/buttons/delete';
import { EditButton } from '@/components/refine-ui/buttons/edit';
import { ShowButton } from '@/components/refine-ui/buttons/show';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view';
import { LoadingOverlay } from '@components/refine-ui/layout/loading-overlay';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import { Input } from '@components/ui/input';
import type { User } from '@lib/types';
import { formatDateTime } from '@lib/utils';
import { useCustom } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Referee } from '../../../lib/types';
import { formatCurrency } from '../../../lib/utils';

interface DashboardStats {
  tournaments: number;
  referees: number;
  assignemnts: number;
  tournamentCost: number | null;
}

export default function DashboardPage() {
  // I want to get the number of tournaments

  // Value of all the tournaments

  // Number of referees
  // Number of referee with at list one assigned tournament

  // In each card create a button to list view page

  const { query } = useCustom({
    url: '/api/dashboard',
    method: 'get',
    errorNotification: (data, values) => {
      return {
        message: `Error fetching data`,
        description: 'Error',
        type: 'error',
      };
    },
  });
  const data = query?.data?.data as DashboardStats | undefined;
  console.log(data);

  return (
    <LoadingOverlay loading={query?.isPending}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Tournaments</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {data?.tournaments}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Referees</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {data?.referees}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Referees Assigned</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {data?.assignemnts}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Tournament Cost</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {formatCurrency(data?.totalCost as number)}
            </p>
          </CardContent>
        </Card>
      </div>
    </LoadingOverlay>
  );
}
