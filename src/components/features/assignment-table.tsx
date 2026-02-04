import { DeleteButton } from '@components/refine-ui/buttons/delete';
import { EditButton } from '@components/refine-ui/buttons/edit';
import { ShowButton } from '@components/refine-ui/buttons/show';
import { DataTable } from '@components/refine-ui/data-table/data-table';
import type { RefereeAssignment } from '@lib/types';
import { formatCurrency } from '@lib/utils';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';
import { CreateButton } from '@components/refine-ui/buttons/create';
import { useRouter } from 'next/navigation';
import { Button } from '@components/ui/button';
import Link from 'next/link';
import { Plus } from 'lucide-react';

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

    return [
      columnHelper.accessor('referee.name', {
        id: 'referee.name',
        header: 'Name',
        size: 150,
      }),
      columnHelper.accessor('countA', {
        id: 'countA',
        header: 'Games Main',
        size: 100,
      }),
      columnHelper.accessor('countB', {
        id: 'countB',
        header: 'Games B',
        size: 100,
      }),
      columnHelper.accessor('countC', {
        id: 'countC',
        header: 'Games C',
        size: 100,
      }),
      columnHelper.accessor('totalCost', {
        id: 'totalCost',
        header: 'Total Cost',
        cell: ({ row }) => {
          return formatCurrency(row.original.totalCost as number);
        },
        size: 120,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Actions',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <EditButton recordItemId={row.original.id} size="sm" />
            <ShowButton recordItemId={row.original.id} size="sm" />
            <DeleteButton recordItemId={row.original.id} size="sm" />
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
    <div className="flex flex-col gap-4 mt-4">
      <div className="flex flex-col md:flex-row md:justify-between gap-4">
        <h2 className="font-bold text-lg">Referee Assignments</h2>
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
      </div>
      <DataTable table={table} />
    </div>
  );
}
