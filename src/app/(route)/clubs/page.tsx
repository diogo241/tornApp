'use client';

import { DeleteButton } from '@/components/refine-ui/buttons/delete';
import { EditButton } from '@/components/refine-ui/buttons/edit';
import { ShowButton } from '@/components/refine-ui/buttons/show';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view';
import { ClubDebtPaidToggle } from '@/components/features/club-debt-paid-toggle';
import type { Club, ClubBalance } from '@lib/types';
import { formatCurrency, formatDateTime, round2 } from '@lib/utils';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';

export default function ClubListPage() {
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Club>();

    return [
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Nome',
        enableSorting: true,
      }),
      columnHelper.accessor('clubBalance.totalCost', {
        id: 'clubBalance.totalCost',
        header: 'Custo total',
        enableSorting: true,
        cell: ({ row }) => {
          const value = (row.original.clubBalance?.totalCost as number) ?? 0;
          return formatCurrency(value);
        },
        size: 80,
      }),
      columnHelper.accessor('clubBalance.netBalance', {
        id: 'clubBalance.netBalance',
        header: 'Saldo líquido',
        enableSorting: true,
        cell: ({ row }) => {
          const value = (row.original.clubBalance?.netBalance as number) ?? 0;
          const colorClass = value >= 0 ? 'text-green-500' : 'text-red-500';
          return (
            <p className={`text-sm font-bold ${colorClass} opacity-70`}>
              {formatCurrency(value)}
            </p>
          );
        },
        size: 80,
      }),
      columnHelper.accessor('refereeCost', {
        id: 'refereeCost',
        header: 'Custo de arbitragem',
        enableSorting: false,
        cell: ({ row }) => {
          return formatCurrency((row.original.refereeCost as number) ?? 0);
        },
        size: 80,
      }),
      columnHelper.display({
        id: 'costMismatch',
        header: 'Diferença',
        cell: ({ row }) => {
          const totalCost = (row.original.clubBalance?.totalCost as number) ?? 0;
          const refereeCost = (row.original.refereeCost as number) ?? 0;
          if (round2(totalCost) === round2(refereeCost)) {
            return <span className="text-muted-foreground">-</span>;
          }
          return <Badge variant="destructive">Diferença</Badge>;
        },
        size: 90,
        enableSorting: false,
      }),
      columnHelper.display({
        id: 'clubBalance.paid',
        header: 'Pago',
        cell: ({ row }) => {
          const clubBalance = row.original.clubBalance;
          if (!clubBalance || (clubBalance.netBalance ?? 0) >= 0) {
            return <span className="text-muted-foreground">-</span>;
          }
          return (
            <ClubDebtPaidToggle
              id={clubBalance.id}
              paid={clubBalance.paid}
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
        size: 180,
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
      <ListViewHeader title="Clubes" />
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
