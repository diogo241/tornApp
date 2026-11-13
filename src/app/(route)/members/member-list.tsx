'use client';

import { FeePaymentDialog } from '@/components/features/fee-payment-dialog';
import { ShowButton } from '@/components/refine-ui/buttons/show';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import type { FeePaymentOption } from '@/components/features/fee-payment-dialog';
import { areFeesUpToDate } from '@lib/services/members/member.helpers';
import type { MemberWithPayments } from '@lib/types';
import type { CrudFilters } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import Link from 'next/link';
import { useMemo, useState } from 'react';

export type MemberListProps = {
  fees: FeePaymentOption[];
};

export function MemberList({ fees }: MemberListProps) {
  const overdueBeforeYear = new Date().getFullYear() + 1;
  const years = fees.map((fee) => fee.year);
  const [paymentMember, setPaymentMember] =
    useState<MemberWithPayments | null>(null);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<MemberWithPayments>();

    return [
      columnHelper.accessor('number', {
        id: 'number',
        header: 'Nº',
        size: 70,
        enableSorting: false,
      }),
      columnHelper.accessor('name', {
        id: 'name',
        header: 'Nome',
        enableSorting: false,
      }),
      columnHelper.accessor('memberSince', {
        id: 'memberSince',
        header: 'Desde',
        size: 90,
        enableSorting: false,
        cell: ({ row }) => row.original.memberSince ?? '—',
      }),
      columnHelper.accessor('active', {
        id: 'active',
        header: 'Estado',
        size: 90,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.active ? (
            <Badge variant="default">Ativo</Badge>
          ) : (
            <Badge variant="destructive">Inativo</Badge>
          ),
      }),
      columnHelper.display({
        id: 'lastPaidYear',
        header: 'Última paga',
        size: 100,
        cell: ({ row }) => row.original.lastPaidYear ?? '—',
      }),
      columnHelper.display({
        id: 'overdue',
        header: 'Cotas em dia',
        size: 100,
        cell: ({ row }) =>
          areFeesUpToDate(row.original.lastPaidYear) ? (
            <Badge variant="default">Sim</Badge>
          ) : (
            <Badge variant="destructive">Não</Badge>
          ),
      }),
      columnHelper.display({
        id: 'actions',
        header: 'Ações',
        size: 150,
        cell: ({ row }) => {
          const paidFeeIds = new Set(
            row.original.feePayments.map((payment) => payment.feeId),
          );
          const hasUnpaidFee = fees.some((fee) => !paidFeeIds.has(fee.id));

          return (
            <div className="flex gap-2">
              {!areFeesUpToDate(row.original.lastPaidYear) && hasUnpaidFee && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  aria-label={`Pagar quotas de ${row.original.name}`}
                  onClick={() => setPaymentMember(row.original)}
                >
                  Pagar quotas
                </Button>
              )}
              <ShowButton
                resource="members"
                recordItemId={row.original.id}
                size="sm"
                aria-label="Ver"
              />
            </div>
          );
        },
      }),
    ];
  }, [fees]);

  const [searchName, setSearchName] = useState('');
  const [onlyActive, setOnlyActive] = useState(true);
  const [onlyHalfFee, setOnlyHalfFee] = useState(false);
  const [lastPaidBefore, setLastPaidBefore] = useState<number | undefined>(
    undefined,
  );
  const [onlyOverdue, setOnlyOverdue] = useState(false);

  const permanentFilters = useMemo<CrudFilters>(() => {
    const name = searchName.trim();

    return [
      { field: 'payments', operator: 'eq', value: true },
      { field: 'active', operator: 'eq', value: onlyActive ? true : undefined },
      {
        field: 'halfFee',
        operator: 'eq',
        value: onlyHalfFee ? true : undefined,
      },
      {
        field: 'name',
        operator: 'contains',
        value: name === '' ? undefined : name,
      },
      {
        field: 'lastPaidBefore',
        operator: 'eq',
        value: onlyOverdue ? overdueBeforeYear : lastPaidBefore,
      },
    ];
  }, [
    lastPaidBefore,
    onlyActive,
    onlyHalfFee,
    onlyOverdue,
    overdueBeforeYear,
    searchName,
  ]);

  const table = useTable<MemberWithPayments>({
    columns,
    refineCoreProps: {
      resource: 'members',
      pagination: {
        pageSize: 50,
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
      <ListViewHeader title="Sócios" />
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-4">
          <Input
            type="text"
            placeholder="Pesquisar sócio..."
            aria-label="Pesquisar sócio por nome"
            value={searchName}
            onChange={(event) => setSearchName(event.target.value)}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-active"
              checked={onlyActive}
              onCheckedChange={(checked) => setOnlyActive(checked === true)}
            />
            <Label htmlFor="only-active">Só ativos</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-half-fee"
              checked={onlyHalfFee}
              onCheckedChange={(checked) => setOnlyHalfFee(checked === true)}
            />
            <Label htmlFor="only-half-fee">Só meias cotas</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-overdue"
              checked={onlyOverdue}
              onCheckedChange={(checked) => setOnlyOverdue(checked === true)}
            />
            <Label htmlFor="only-overdue">Só em atraso</Label>
          </div>
          <div className="flex items-center gap-2">
            <Label htmlFor="last-paid-before">Última paga inferior a</Label>
            <Select
              disabled={onlyOverdue}
              value={
                lastPaidBefore === undefined ? 'all' : String(lastPaidBefore)
              }
              onValueChange={(value) =>
                setLastPaidBefore(value === 'all' ? undefined : Number(value))
              }
            >
              <SelectTrigger id="last-paid-before" className="w-28">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todas</SelectItem>
                {years.map((year) => (
                  <SelectItem key={year} value={String(year)}>
                    {year}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
        <Button asChild variant="outline" size="sm">
          <Link href="/fees">Gerir cotas</Link>
        </Button>
      </div>
      <DataTable
        table={table}
        emptyState={
          <span className="text-sm text-muted-foreground">Sem sócios.</span>
        }
      />
      {paymentMember && (
        <FeePaymentDialog
          key={paymentMember.id}
          member={{
            id: paymentMember.id,
            number: paymentMember.number,
            name: paymentMember.name,
          }}
          fees={fees}
          payments={paymentMember.feePayments}
          onClose={() => setPaymentMember(null)}
        />
      )}
    </ListView>
  );
}
