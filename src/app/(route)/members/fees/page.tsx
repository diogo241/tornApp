'use client';

import { DeleteButton } from '@/components/refine-ui/buttons/delete';
import { EditButton } from '@/components/refine-ui/buttons/edit';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view';
import { Badge } from '@/components/ui/badge';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import type { Fee } from '@lib/types';
import { formatCurrency } from '@lib/utils';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { useMemo, useState } from 'react';

export default function FeeListPage() {
  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<Fee>();

    return [
      columnHelper.accessor('year', {
        id: 'year',
        header: 'Ano',
        size: 90,
        enableSorting: false,
      }),
      columnHelper.accessor('amount', {
        id: 'amount',
        header: 'Valor',
        size: 110,
        enableSorting: false,
        cell: ({ row }) => formatCurrency(row.original.amount),
      }),
      columnHelper.accessor('label', {
        id: 'label',
        header: 'Descrição',
        enableSorting: false,
        cell: ({ row }) => row.original.label ?? '-',
      }),
      columnHelper.display({
        id: 'active',
        header: 'Estado',
        size: 90,
        cell: ({ row }) => (
          <Badge variant={row.original.active ? 'secondary' : 'outline'}>
            {row.original.active ? 'Ativo' : 'Inativo'}
          </Badge>
        ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Ações',
        size: 150,
        cell: ({ row }) => (
          <div className="flex gap-2">
            <EditButton
              resource="fees"
              recordItemId={row.original.id}
              size="sm"
            />
            <DeleteButton
              resource="fees"
              recordItemId={row.original.id}
              size="sm"
            />
          </div>
        ),
      }),
    ];
  }, []);

  const [showInactive, setShowInactive] = useState(false);

  const permanentFilters = useMemo(
    () => [
      {
        field: 'active',
        operator: 'eq' as const,
        value: showInactive ? undefined : true,
      },
    ],
    [showInactive],
  );

  const table = useTable<Fee>({
    columns,
    refineCoreProps: {
      resource: 'fees',
      pagination: {
        pageSize: 10,
        mode: 'server',
      },
      syncWithLocation: true,
      filters: {
        permanent: permanentFilters,
      },
    },
  });

  return (
    <ListView>
      <ListViewHeader title="Quotas" />
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex items-center gap-2">
          <Checkbox
            id="show-inactive"
            checked={showInactive}
            onCheckedChange={(checked) => setShowInactive(checked === true)}
          />
          <Label htmlFor="show-inactive">Mostrar inativas</Label>
        </div>
      </div>
      <DataTable
        table={table}
        emptyState={
          <span className="text-sm text-muted-foreground">Sem quotas.</span>
        }
      />
    </ListView>
  );
}
