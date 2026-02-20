'use client';

import { LoadingOverlay } from '@components/refine-ui/layout/loading-overlay';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import { useCustom, useList, type HttpError } from '@refinedev/core';
import { formatCurrency } from '../../../lib/utils';
import type { ClubFunding } from '@lib/types';

interface DashboardStats {
  tournaments: number;
  referees: number;
  assignemnts: number;
  totalCost: number | null;
  totalMunicipalFunding: number | null;
}

export default function DashboardPage() {
  const { result } = useList<ClubFunding, HttpError>({
    resource: 'club-funding',
  });

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
  const data = {
    ...query?.data?.data,
    totalMunicipalFunding: result?.data[0]?.totalFundingCost ?? 0,
  } as DashboardStats;

  return (
    <LoadingOverlay loading={query?.isPending}>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Tournaments</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {data?.tournaments ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Referees</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {data?.referees ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Referees Assigned</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {data?.assignemnts ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Tournament Cost</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {query?.isPending ? 0 : formatCurrency(data?.totalCost as number)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Total Municipal Funding</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {query?.isPending ? 0 : formatCurrency(data?.totalMunicipalFunding as number)}
            </p>
          </CardContent>
        </Card>
      </div>
    </LoadingOverlay>
  );
}
