'use client';

import { EditButton } from '@/components/refine-ui/buttons/edit';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view';
import ClubFundingExportButton from '@components/features/club-funding-export-button';
import type { ClubFunding } from '@lib/types';
import { formatCurrency, formatDateTime } from '@lib/utils';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo } from 'react';

export default function ClubFundingListPage() {
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<ClubFunding>();

    return [
      columnHelper.accessor('year', {
        id: 'year',
        header: 'Ano',
        enableSorting: true,
      }),
      columnHelper.accessor('amount', {
        id: 'amount',
        header: 'Valor',
        enableSorting: true,
        cell: ({ row }) => {
          return formatCurrency(row.original.amount as number);
        },
      }),
      columnHelper.accessor('totalFundingCost', {
        id: 'totalFundingCost',
        header: 'Total de financiamento',
        enableSorting: true,
        cell: ({ row }) => {
          return formatCurrency(row.original.totalFundingCost as number);
        },
      }),
      columnHelper.accessor('createdAt', {
        id: 'createdAt',
        header: 'Criado em',
        enableSorting: true,
        cell: ({ row }) => {
          return formatDateTime(row.original.createdAt as Date).dateTime;
        },
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Ações',
        cell: ({ row }) => (
          <div className="flex gap-2">
            <EditButton recordItemId={row.original.id} size="sm" />
          </div>
        ),
        enableSorting: false,
        size: 100,
      }),
    ];
  }, []);

  const table = useTable({
    columns,
    refineCoreProps: {
      pagination: {
        pageSize: 10,
        mode: 'server',
      },
      syncWithLocation: true,
    },
  });

  return (
    <ListView>
      <ListViewHeader title="Financiamento Municipal" />
      <DataTable table={table} />
      <div className='flex'>
        <ClubFundingExportButton />
      </div>
    </ListView>
  );
}
