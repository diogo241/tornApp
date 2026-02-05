import { DeleteButton } from '@components/refine-ui/buttons/delete';
import { EditButton } from '@components/refine-ui/buttons/edit';
import { DataTable } from '@components/refine-ui/data-table/data-table';
import type { RefereeAssignment } from '@lib/types';
import { formatCurrency } from '@lib/utils';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@components/ui/card';

interface TournamentView {
  tournamentId: string;
  refereeId?: never;
}

interface RefereeView {
  refereeId: string;
  tournamentId?: never;
}

export type AssignmentTableProps = TournamentView | RefereeView;

export default function AssignmentTable({
  tournamentId,
  refereeId,
}: AssignmentTableProps) {
  const filters = [
    {
      field: tournamentId ? 'tournamentId' : 'refereeId',
      operator: 'eq' as const,
      value: tournamentId ?? refereeId,
    },
  ];

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<RefereeAssignment>();

    let defColumns = !tournamentId
      ? [
          columnHelper.accessor('tournament.name', {
            id: 'tournament.name',
            header: 'Tournament',
            size: 150,
          }),
        ]
      : [
          columnHelper.accessor('referee.name', {
            id: 'referee.name',
            header: 'Name',
            size: 150,
          }),
        ];

    return [
      ...defColumns,
      columnHelper.accessor('countA', {
        id: 'countA',
        header: 'Ref',
        size: 100,
      }),
      columnHelper.accessor('countB', {
        id: 'countB',
        header: 'Ref B',
        size: 100,
      }),
      columnHelper.accessor('countC', {
        id: 'countC',
        header: 'Ref C',
        size: 100,
      }),
      columnHelper.accessor('countARef', {
        id: 'countARef',
        header: 'ARef',
        size: 100,
      }),
      columnHelper.accessor('countBRef', {
        id: 'countBRef',
        header: 'ARef B',
        size: 100,
      }),
      columnHelper.accessor('countCRef', {
        id: 'countCRef',
        header: 'ARef C',
        size: 100,
      }),
      columnHelper.accessor('totalCost', {
        id: 'totalCost',
        header: 'Total Cost',
        cell: ({ row, getValue }) => {
          return formatCurrency(getValue() as number);
        },
        size: 120,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <EditButton
              resource="assignemts"
              recordItemId={row.original.id}
              size="sm"
            />
            <DeleteButton
              resource="assignemts"
              recordItemId={row.original.id}
              size="sm"
            />
          </div>
        ),
        enableSorting: false,
      }),
    ];
  }, []);

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: 'assignemts',
      pagination: {
        pageSize: 10,
        mode: 'server',
      },
      filters: {
        permanent: filters,
      },
    },
  });

  return (
    <Card>
      <CardContent>
        <div className="flex flex-col gap-4 mt-4">
          <div className="flex flex-col md:flex-row md:justify-between gap-4">
            <h2 className="font-bold text-lg">Referee Assignments</h2>
            {tournamentId && (
              <Button asChild>
                <Link
                  className="flex items-center gap-2 font-semibold"
                  href={
                    tournamentId
                      ? `/assignemts/create?tournamentId=${tournamentId}`
                      : `/assignemts/create?refereeId=${refereeId}`
                  }
                >
                  <Plus className="w-4 h-4" />
                  <span>Create</span>
                </Link>
              </Button>
            )}
          </div>
          <DataTable table={table} />
        </div>
      </CardContent>
    </Card>
  );
}
