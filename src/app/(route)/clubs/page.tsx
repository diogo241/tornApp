'use client';

import { DeleteButton } from '@/components/refine-ui/buttons/delete';
import { EditButton } from '@/components/refine-ui/buttons/edit';
import { ShowButton } from '@/components/refine-ui/buttons/show';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view';
import type { Club } from '@lib/types';
import { formatDateTime } from '@lib/utils';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';

export default function ClubListPage() {
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Club>();

    return [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Name',
        enableSorting: true,
      }),
      columnHelper.accessor('createdAt', {
        id: 'createdAt',
        header: 'Created at',
        enableSorting: true,
        cell: ({ row }) => {
          return formatDateTime(row.original.createdAt as Date).dateTime;
        },
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
        ],
      },
    },
  });

  const handleSearchChange = (value: string) => {
    setSearchName(value);
  };

  return (
    <ListView>
      <ListViewHeader />
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Filter by name..."
          value={searchName}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <DataTable table={table} />
    </ListView>
  );
}
