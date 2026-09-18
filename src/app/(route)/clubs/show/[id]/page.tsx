'use client';

import {
  ShowView,
  ShowViewHeader,
} from '@/components/refine-ui/views/show-view';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useShow } from '@refinedev/core';
import type { Club } from '@lib/types';
import { formatDateTime } from '@lib/utils';
import { LoadingOverlay } from '@components/refine-ui/layout/loading-overlay';
import TournamentTable from '@components/features/tournament-table';
import { ClubDebtPaidToggle } from '@components/features/club-debt-paid-toggle';
import { formatCurrency } from '../../../../../lib/utils';

export default function ClubShowPage() {
  const { result: record, query } = useShow({});
  const { isLoading, error } = query;

  if (error) {
    return (
      <ShowView>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message || 'Failed to load club'}
          </AlertDescription>
        </Alert>
      </ShowView>
    );
  }

  const club = record as Club;

  return (
    <ShowView>
      <ShowViewHeader title={club?.name} />
      <LoadingOverlay loading={isLoading}>
        <Card>
          <CardContent className="flex flex-col justify-start gap-4 md:flex-row md:gap-8">
            <div>
              <h4 className="text-sm font-medium mb-2">Net Balance:</h4>
              <p
                className={
                  club?.clubBalance
                    ? club.clubBalance.netBalance! > 0
                      ? `text-sm text-green-500 opacity-70`
                      : `text-sm text-red-500 opacity-70`
                    : `text-sm text-muted-foreground`
                }
              >
                {club?.clubBalance
                  ? formatCurrency(club.clubBalance.netBalance as number)
                  : 0}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Paid:</h4>
              {club?.clubBalance && (club.clubBalance.netBalance ?? 0) < 0 ? (
                <div className="flex items-center gap-2">
                  <span className="text-sm text-muted-foreground">
                    {club.clubBalance.paid ? 'Yes' : 'No'}
                  </span>
                  <ClubDebtPaidToggle
                    id={club.clubBalance.id}
                    paid={club.clubBalance.paid}
                    clubId={club?.id}
                  />
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">-</p>
              )}
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Total Cost:</h4>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(club?.totalCost as number) || 0}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Created at:</h4>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(club?.createdAt as Date).dateTime}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Updated at:</h4>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(club?.updatedAt as Date).dateTime ?? '-'}
              </p>
            </div>
          </CardContent>
        </Card>
        <TournamentTable clubId={club?.id as string} />
      </LoadingOverlay>
    </ShowView>
  );
}
