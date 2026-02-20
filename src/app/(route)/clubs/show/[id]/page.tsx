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
