'use client';

import { DeleteButton } from '@/components/refine-ui/buttons/delete';
import { EditButton } from '@/components/refine-ui/buttons/edit';
import { ShowButton } from '@/components/refine-ui/buttons/show';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view';
import { Input } from '@components/ui/input';
import type { Tournament } from '@lib/types';
import { formatCurrency, formatDateTime } from '@lib/utils';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

export default function TournamentList() {
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Tournament>();

    return [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        size: 220,
      }),
      columnHelper.accessor('club.name', {
        id: 'club.name',
        header: 'Club',
        size: 100,
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
        size: 150,
      }),
      columnHelper.accessor('endDate', {
        id: 'endDate',
        header: 'Ended at',
        cell: ({ row }) => {
          return formatDateTime(row.original.endDate as Date).dateOnly;
        },
        size: 150,
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
            <EditButton recordItemId={row.original.id} size="sm" />
            <ShowButton recordItemId={row.original.id} size="sm" />
            <DeleteButton recordItemId={row.original.id} size="sm" />
          </div>
        ),
        enableSorting: false,
      }),
    ];
  }, []);

  const [searchName, setSearchName] = useState('');
  const [searchClub, setSearchClub] = useState('');

  const table = useTable({
    columns,
    refineCoreProps: {
      pagination: {
        pageSize: 10,
        mode: 'server',
      },
      syncWithLocation: true,
      filters: {
        permanent: [
          {
            field: 'name',
            operator: 'contains',
            value: searchName,
          },
          {
            field: 'clubName',
            operator: 'contains',
            value: searchClub,
          },
        ],
      },
    },
  });

  const handleSearchNameChange = (value: string) => {
    setSearchName(value);
  };
  const handleSearchClubChange = (value: string) => {
    setSearchClub(value);
  };

  return (
    <ListView>
      <ListViewHeader />
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Filter by name..."
          value={searchName}
          onChange={(e) => handleSearchNameChange(e.target.value)}
          className="max-w-sm"
        />
        <Input
          type="text"
          placeholder="Filter by club..."
          value={searchClub}
          onChange={(e) => handleSearchClubChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <DataTable table={table} />
    </ListView>
  );
}
