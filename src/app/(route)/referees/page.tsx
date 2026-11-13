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
import { RefereePaidToggle } from '@/components/features/referee-paid-toggle';
import type { Referee } from '@lib/types';
import { formatCurrency, formatDateTime } from '@lib/utils';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import  { useMemo, useState } from 'react';

export default function RefereeList() {
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Referee>();

    // MESQUITA - #19: cabecalhos em pt-PT
    return [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Nome',
        enableSorting: true,
        size: 300,
      }),
      columnHelper.accessor('totalCost', {
        id: 'totalCost',
        header: 'Custo total',
        enableSorting: true,
        cell: ({ row }) => {
          return formatCurrency(row.original.totalCost as number);
        },
        size: 80,
      }),
      columnHelper.display({
        id: 'paid',
        header: 'Pago',
        cell: ({ row }) => {
          const referee = row.original;
          if ((referee.totalCost ?? 0) <= 0) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <RefereePaidToggle
              id={referee.id as string}
              paid={referee.paid}
            />
          );
        },
        size: 60,
        enableSorting: false,
      }),
      columnHelper.accessor('createdAt', {
        id: 'createdAt',
        header: 'Criado em',
        enableSorting: true,
        cell: ({ row }) => {
          return formatDateTime(row.original.createdAt as Date).dateTime;
        },
        size: 80,
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Ações',
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
      <ListViewHeader title="Árbitros" />
      {/* MESQUITA - #19: placeholder de filtro em pt-PT */}
      <div className="flex items-center gap-4">
        <Input
          type="text"
          placeholder="Filtrar por nome..."
          value={searchName}
          onChange={(e) => handleSearchChange(e.target.value)}
          className="max-w-sm"
        />
      </div>
      <DataTable table={table} />
    </ListView>
  );
}
