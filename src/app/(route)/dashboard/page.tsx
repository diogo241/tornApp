'use client';

import { LoadingOverlay } from '@components/refine-ui/layout/loading-overlay';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import { useCustom } from '@refinedev/core';
import { formatCurrency } from '../../../lib/utils';

interface DashboardStats {
  tournaments: number;
  referees: number;
  assignemnts: number;
  totalCost: number | null;
}

export default function DashboardPage() {
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
      </div>
    </LoadingOverlay>
  );
}
