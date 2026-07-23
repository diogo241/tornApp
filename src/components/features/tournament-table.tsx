import { DeleteButton } from '@components/refine-ui/buttons/delete';
import { EditButton } from '@components/refine-ui/buttons/edit';
import { DataTable } from '@components/refine-ui/data-table/data-table';
import type { RefereeAssignment, Tournament } from '@lib/types';
import { formatCurrency, formatDateTime } from '@lib/utils';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';
import { Card, CardContent } from '@components/ui/card';
import { ShowButton } from '@components/refine-ui/buttons/show';
import { CreateButton } from '@components/refine-ui/buttons/create';

export default function TournamentTable({ clubId }: { clubId: string }) {
  const filters = [
    {
      field: 'clubId',
      operator: 'eq' as const,
      value: clubId,
    },
  ];

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Tournament>();

    return [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        size: 260,
      }),
      columnHelper.accessor('rate.name', {
        id: 'rate.name',
        header: 'Type',
        size: 100,
      }),
      columnHelper.accessor('totalGames', {
        id: 'totalGames',
        header: 'Total games',
        size: 100,
      }),
      columnHelper.accessor('startDate', {
        id: 'startDate',
        header: 'Started at',
        cell: ({ row }) => {
          return formatDateTime(row.original.startDate as Date).dateOnly;
        },
        size: 120,
      }),
      columnHelper.accessor('endDate', {
        id: 'endDate',
        header: 'Ended at',
        cell: ({ row }) => {
          return formatDateTime(row.original.endDate as Date).dateOnly;
        },
        size: 120,
      }),
      columnHelper.accessor('totalCost', {
        id: 'totalCost',
        header: 'Total Cost',
        cell: ({ row }) => {
          return formatCurrency(row.original.totalCost as number);
        },
        size: 150,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <EditButton resource='tournaments' recordItemId={row.original.id} size="sm" />
            <ShowButton resource='tournaments' recordItemId={row.original.id} size="sm" />
            <DeleteButton resource='tournaments' recordItemId={row.original.id} size="sm" />
          </div>
        ),
        enableSorting: false,
      }),
    ];
  }, []);

  const table = useTable({
    columns,
    refineCoreProps: {
      resource: 'tournaments',
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
            <h2 className="text-2xl font-bold">Tournaments</h2>
            <Button asChild>
              <Link
                className="flex items-center gap-2 font-semibold"
                href={`/tournaments/create?clubId=${clubId}`}
              >
                <Plus className="w-4 h-4" />
                <span>Create</span>
              </Link>
            </Button>
          </div>
          <DataTable table={table} />
        </div>
      </CardContent>
    </Card>
  );
}
