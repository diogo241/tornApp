'use client';

import { DataTable } from '@/components/refine-ui/data-table/data-table';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';
import type {
  FeePaymentMethod,
  PaidFeeRow,
  PaidFeesResponse,
} from '@lib/types';
import { formatCurrency, formatDateTime, formatNumber } from '@lib/utils';
import { useCustom, type CrudFilters } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { ChevronDownIcon } from 'lucide-react';
import type { DateRange } from 'react-day-picker';
import { useMemo, useState, type Dispatch, type SetStateAction } from 'react';

const pageSize = 50;

const methodLabels: Record<FeePaymentMethod, string> = {
  cash: 'Numerário',
  mbway: 'MBWay',
  other: 'Outros',
};

const toDay = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');

  return `${year}-${month}-${day}`;
};

function MethodCell({ row }: { row: PaidFeeRow }) {
  if (row.method === 'other') {
    return (
      <span title="Outros">
        <span className="sr-only">Outros: </span>
        {row.methodDetail?.trim()
          ? row.methodDetail
          : 'Outros (sem descrição)'}
      </span>
    );
  }

  return <span>{methodLabels[row.method]}</span>;
}

function PaymentCount({ value }: { value: number }) {
  return (
    <span>
      {formatNumber(value)} {value === 1 ? 'pagamento' : 'pagamentos'}
    </span>
  );
}

export function CotasPagasPage() {
  const [range, setRange] = useState<DateRange>();
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [visiblePageSize, setVisiblePageSize] = useState(pageSize);

  const from = range?.from ? toDay(range.from) : '';
  const to = range?.to ? toDay(range.to) : '';
  const invertedRange = from !== '' && to !== '' && from > to;

  const filters = useMemo<CrudFilters>(
    () => [
      { field: 'from', operator: 'eq', value: from || undefined },
      { field: 'to', operator: 'eq', value: to || undefined },
      // The data provider sends `size`; this endpoint reads `pageSize`.
      { field: 'pageSize', operator: 'eq', value: visiblePageSize },
    ],
    [from, to, visiblePageSize],
  );

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<PaidFeeRow>();

    return [
      columnHelper.accessor('member.name', {
        id: 'name',
        header: 'Nome',
        enableSorting: false,
      }),
      columnHelper.accessor('paidAt', {
        id: 'paidAt',
        header: 'Data',
        size: 120,
        enableSorting: false,
        cell: ({ getValue }) =>
          getValue() ? formatDateTime(getValue()).dateOnly : '—',
      }),
      columnHelper.accessor('method', {
        id: 'method',
        header: 'Tipologia',
        size: 160,
        enableSorting: false,
        cell: ({ row }) => <MethodCell row={row.original} />,
      }),
      columnHelper.accessor('value', {
        id: 'value',
        header: 'Valor',
        size: 120,
        enableSorting: false,
        cell: ({ getValue }) => formatCurrency(getValue()),
      }),
      columnHelper.accessor('fee.year', {
        id: 'year',
        header: 'Ano',
        size: 80,
        enableSorting: false,
      }),
    ];
  }, []);

  const table = useTable<PaidFeeRow>({
    columns,
    refineCoreProps: {
      resource: 'quotas',
      pagination: { pageSize, mode: 'server' },
      syncWithLocation: false,
      filters: { permanent: filters },
      errorNotification: false,
      queryOptions: { enabled: !invertedRange },
    },
  });

  const { tableQuery, setCurrentPage } = table.refineCore;
  const total = tableQuery.data?.total ?? 0;
  const pageCount = Math.max(1, Math.ceil(total / visiblePageSize));

  const changePageSize: Dispatch<SetStateAction<number>> = (value) => {
    setVisiblePageSize(value);
    setCurrentPage(1);
  };

  // The list only exposes data/total; totals are a second read of the same
  // range, so one row is enough.
  const totalsQuery = useCustom<PaidFeesResponse>({
    url: '/api/quotas',
    method: 'get',
    errorNotification: false,
    config: {
      query: {
        ...(from ? { from } : {}),
        ...(to ? { to } : {}),
        page: 1,
        pageSize: 1,
      },
    },
    queryOptions: { enabled: !invertedRange },
  });

  const totals =
    invertedRange || totalsQuery.query.isError
      ? undefined
      : totalsQuery.query.data?.data.totals;
  const hasError = tableQuery.isError || totalsQuery.query.isError;

  const clearFilters = () => {
    setRange(undefined);
    setIsCalendarOpen(false);
    setCurrentPage(1);
  };

  const rangeLabel = range?.from
    ? `${formatDateTime(range.from).dateOnly} - ${
        range.to ? formatDateTime(range.to).dateOnly : '...'
      }`
    : 'Selecionar datas';

  const dataTable = {
    ...table,
    refineCore: {
      ...table.refineCore,
      pageSize: visiblePageSize,
      pageCount,
      setPageSize: changePageSize,
    },
  };

  return (
    <>
      {!hasError && !invertedRange && (
        <div aria-live="polite">
          <Card>
            <CardHeader>
              <CardTitle>Total de quotas pagas</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-3xl font-bold">
                {formatCurrency(totals?.amount ?? 0)}
              </p>
              <p className="text-muted-foreground text-sm">
                <PaymentCount value={totals?.count ?? 0} />
              </p>
              <div className="mt-4 flex flex-col gap-1 text-sm">
                <div className="flex justify-between gap-4">
                  <span>Numerário</span>
                  <span>{formatCurrency(totals?.byMethod.cash ?? 0)}</span>
                </div>
                {(totals?.byMethod.other ?? []).map((line, index) => (
                  <div
                    key={`${line.label}-${index}`}
                    className="flex justify-between gap-4"
                  >
                    <span>{line.label}</span>
                    <span>
                      {formatCurrency(line.amount)}{' '}
                      <span className="text-muted-foreground">
                        ({formatNumber(line.count)})
                      </span>
                    </span>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>
      )}

      <div className="flex flex-wrap items-end gap-4">
        <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
          <PopoverTrigger asChild>
            <Button
              type="button"
              variant="outline"
              className="w-64 justify-between font-normal"
            >
              {rangeLabel}
              <ChevronDownIcon />
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-auto overflow-hidden p-0" align="start">
            <Calendar
              mode="range"
              numberOfMonths={2}
              selected={range}
              onSelect={(nextRange) => {
                setRange(nextRange);
                setCurrentPage(1);

                if (nextRange?.from && nextRange.to) {
                  setIsCalendarOpen(false);
                }
              }}
            />
          </PopoverContent>
        </Popover>
        <Button type="button" variant="outline" onClick={clearFilters}>
          Limpar
        </Button>
      </div>

      {invertedRange && (
        <p className="text-destructive text-sm" role="alert">
          Intervalo de datas inválido.
        </p>
      )}

      {hasError && (
        <Alert variant="destructive">
          <AlertTitle>Não foi possível carregar as quotas pagas.</AlertTitle>
          <AlertDescription>Tente novamente.</AlertDescription>
        </Alert>
      )}

      {!invertedRange && (
        <div
          className="flex flex-1 flex-col"
          role="region"
          aria-label="Quotas pagas"
        >
          <DataTable
            table={dataTable}
            emptyState={
              <span className="text-sm text-muted-foreground">
                Sem quotas pagas.
              </span>
            }
          />
        </div>
      )}
    </>
  );
}
