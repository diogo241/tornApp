'use client';

import {
  ShowView,
  ShowViewHeader,
} from '@/components/refine-ui/views/show-view';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { useShow } from '@refinedev/core';
import type { Tournament } from '@lib/types';
import { formatDateTime } from '@lib/utils';
import { LoadingOverlay } from '@components/refine-ui/layout/loading-overlay';
import { formatCurrency } from '../../../../../lib/utils';
import { getCostPerGame } from '@lib/services/tournaments/tournament.utils';
import { Separator } from '@components/ui/separator';

export default function TournamentShow() {
  const { result: record, query } = useShow({});
  const { isLoading, error } = query;

  if (error) {
    return (
      <ShowView>
        <Alert variant="destructive">
          <AlertTitle>Error</AlertTitle>
          <AlertDescription>
            {error.message || 'Failed to load tournament'}
          </AlertDescription>
        </Alert>
      </ShowView>
    );
  }

  const tournament = record as Tournament;

  return (
    <ShowView>
      <ShowViewHeader title={tournament?.name} />
      <LoadingOverlay loading={isLoading}>
        <Card>
          <CardContent className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <h4 className="text-sm font-medium mb-2">Club:</h4>
              <p className="text-sm text-muted-foreground">
                {tournament?.club?.name}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Type:</h4>
              <p className="text-sm text-muted-foreground">
                {tournament?.rate?.name}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Total Games:</h4>
              <p className="text-sm text-muted-foreground">
                {tournament?.totalGames}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Total Cost:</h4>
              <p className="text-sm text-muted-foreground">
                {formatCurrency(tournament?.totalCost as number)}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Start date:</h4>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(tournament?.startDate as Date).dateOnly}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Ended at:</h4>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(tournament?.endDate as Date).dateOnly}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Created at:</h4>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(tournament?.createdAt as Date).dateTime}
              </p>
            </div>
            <div>
              <h4 className="text-sm font-medium mb-2">Updated at:</h4>
              <p className="text-sm text-muted-foreground">
                {formatDateTime(tournament?.updatedAt as Date).dateTime ?? '-'}
              </p>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <h2 className="font-bold text-lg text-foreground">Game Details</h2>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* Main duration block */}
              <div>
                <h4 className="text-sm font-medium mb-2">Duration (min):</h4>
                <p className="text-sm text-muted-foreground">
                  {tournament?.durationA}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Games:</h4>
                <p className="text-sm text-muted-foreground">
                  {tournament?.countA}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Value per game:</h4>
                <p className="text-sm text-muted-foreground">
                  {getCostPerGame(
                    tournament?.rate?.refRate as number,
                    tournament?.rate?.aRate as number,
                    tournament?.durationA as number,
                  )}
                </p>
              </div>
            </div>
            <Separator className="md:my-4 my-8" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {/* B duration block */}
              <div>
                <h4 className="text-sm font-medium mb-2">Duration B (min):</h4>
                <p className="text-sm text-muted-foreground">
                  {tournament?.durationB ?? '-'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Games B:</h4>
                <p className="text-sm text-muted-foreground">
                  {tournament?.countB ?? '-'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Value per game:</h4>
                <p className="text-sm text-muted-foreground">
                  {tournament?.countB &&
                    tournament?.durationB &&
                    getCostPerGame(
                      tournament?.rate?.refRate as number,
                      tournament?.rate?.aRate as number,
                      tournament?.durationB as number,
                    )}
                </p>
              </div>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 md:mt-4 mt-8">
              {/* C duration block */}
              <div>
                <h4 className="text-sm font-medium mb-2">Duration C (min):</h4>
                <p className="text-sm text-muted-foreground">
                  {tournament?.durationC ?? '-'}
                </p>
              </div>

              <div>
                <h4 className="text-sm font-medium mb-2">Games C:</h4>
                <p className="text-sm text-muted-foreground">
                  {tournament?.countC ?? '-'}
                </p>
              </div>
              <div>
                <h4 className="text-sm font-medium mb-2">Value per game:</h4>
                <p className="text-sm text-muted-foreground">
                  {tournament?.countC &&
                    tournament?.durationC &&
                    getCostPerGame(
                      tournament?.rate?.refRate as number,
                      tournament?.rate?.aRate as number,
                      tournament?.durationC as number,
                    )}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </LoadingOverlay>
    </ShowView>
  );
}
