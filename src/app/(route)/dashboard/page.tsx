'use client';

import { LoadingOverlay } from '@components/refine-ui/layout/loading-overlay';
import { Alert, AlertDescription, AlertTitle } from '@components/ui/alert';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import { useCustom, useList, type HttpError } from '@refinedev/core';
import { TriangleAlert } from 'lucide-react';
import { formatCurrency } from '../../../lib/utils';
import type { ClubFunding } from '@lib/types';

interface DashboardStats {
  tournaments: number;
  referees: number;
  assignemnts: number;
  totalCost: number | null;
  totalMunicipalFunding: number | null;
}

interface RefereeGamesStats {
  totalGames: number;
  byClass: { A: number; B: number; C: number };
  asAssistant: number;
  asReferee: number;
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
        message: 'Não foi possível obter os dados',
        description: 'Erro',
        type: 'error',
      };
    },
  });
  const data = {
    ...query?.data?.data,
    totalMunicipalFunding: result?.data[0]?.totalFundingCost ?? 0,
  } as DashboardStats;

  const { query: refereeGamesQuery } = useCustom({
    url: '/api/dashboard/referee-games',
    method: 'get',
    errorNotification: false,
  });
  const refereeGames = refereeGamesQuery?.isPending
    ? null
    : (refereeGamesQuery?.data?.data as RefereeGamesStats | undefined);

  return (
    <LoadingOverlay loading={query?.isPending}>
      <Alert className="mb-8">
        <TriangleAlert />
        <AlertTitle>Temporada de torneios</AlertTitle>
        <AlertDescription>
          Para começar uma temporada de torneios de novo, todos os torneios devem ser apagados.
        </AlertDescription>
      </Alert>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Torneios</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {data?.tournaments ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Árbitros</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {data?.referees ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Jogos arbitrados</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {data?.assignemnts ?? 0}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Custo dos torneios</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {query?.isPending ? 0 : formatCurrency(data?.totalCost as number)}
            </p>
          </CardContent>
        </Card>

        <Card className="gap-4">
          <CardHeader className="">
            <h2 className="text-2xl font-bold">Total de financiamento municipal</h2>
          </CardHeader>
          <CardContent className="">
            <p className="text-6xl font-bold text-muted-foreground">
              {query?.isPending ? 0 : formatCurrency(data?.totalMunicipalFunding as number)}
            </p>
          </CardContent>
        </Card>
      </div>
      <Card className="gap-4 mt-8">
        <CardHeader className="">
          <h2 className="text-2xl font-bold">Total de jogos arbitrados</h2>
        </CardHeader>
        <CardContent className="">
          <p className="text-6xl font-bold text-muted-foreground">
            {refereeGames?.totalGames ?? 0}
          </p>
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-1 text-sm text-muted-foreground">
            <p>Como AA: {refereeGames?.asAssistant ?? 0}</p>
            <p>Como árbitro: {refereeGames?.asReferee ?? 0}</p>
            <p>Escalão A: {refereeGames?.byClass?.A ?? 0}</p>
            <p>Escalão B: {refereeGames?.byClass?.B ?? 0}</p>
            <p>Escalão C: {refereeGames?.byClass?.C ?? 0}</p>
          </div>
        </CardContent>
      </Card>
    </LoadingOverlay>
  );
}
