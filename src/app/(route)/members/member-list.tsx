'use client';

import { FeePaymentDialog } from '@/components/features/fee-payment-dialog';
// MESQUITA - #20: import share link button for member list actions
import { MemberShareLinkButton } from '@/components/features/member-share-link-button';
import { ShowButton } from '@/components/refine-ui/buttons/show';
import { DataTable } from '@/components/refine-ui/data-table/data-table';
import {
  ListView,
  ListViewHeader,
} from '@/components/refine-ui/views/list-view';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
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
import {
  areFeesUpToDate,
  getFeeDueDate,
  getRequiredFeeYear,
} from '@lib/services/members/member.helpers';
import type { MemberWithPayments } from '@lib/types';
// MESQUITA: reutiliza o helper de clipboard existente
import { copyToClipboard } from '@lib/utils';
import type { CrudFilters, HttpError } from '@refinedev/core';
import { useInvalidate, useUpdate } from '@refinedev/core';
import { useTable } from '@refinedev/react-table';
import { createColumnHelper } from '@tanstack/react-table';
import { Coins, Loader2, TriangleAlert, UserCheck, UserX } from 'lucide-react';
import Link from 'next/link';
import { useCallback, useMemo, useRef, useState } from 'react';
import { toast } from 'sonner';

export type MemberListProps = {
  fees: FeePaymentOption[];
};

const SELECT_ALL_PAGE_SIZE = 50;
const MAX_SELECT_ALL_PAGES = 100;

type MembersPageDto = {
  data: Array<{ id: string; email: string | null }>;
  total: number;
};

async function fetchMembersPage(
  page: number,
  filters: string,
): Promise<MembersPageDto> {
  const query = filters === '' ? '' : `&${filters}`;
  const response = await fetch(
    `/api/members?page=${page}&size=${SELECT_ALL_PAGE_SIZE}${query}`,
    { credentials: 'include' },
  );

  if (!response.ok) {
    throw new Error(`Members page request failed: ${response.status}`);
  }

  const payload = (await response.json()) as {
    data?: unknown;
    total?: unknown;
  };

  if (!Array.isArray(payload.data) || typeof payload.total !== 'number') {
    throw new Error('Invalid members page payload');
  }

  return payload as MembersPageDto;
}

export function MemberList({ fees }: MemberListProps) {
  // MESQUITA: atraso e nota de quotas contados a partir de 1 de fevereiro.
  const now = new Date();
  const currentYear = now.getFullYear();
  const requiredFeeYear = getRequiredFeeYear(now);
  const isFeeDeadlineReached = now >= getFeeDueDate(currentYear);
  const years = fees.map((fee) => fee.year);
  const [paymentMember, setPaymentMember] =
    useState<MemberWithPayments | null>(null);

  const feesKey = fees
    .map((fee) => `${fee.id}:${fee.year}:${fee.amount}`)
    .join('|');
  const feesRef = useRef(fees);
  const feesKeyRef = useRef(feesKey);

  if (feesKeyRef.current !== feesKey) {
    feesKeyRef.current = feesKey;
    feesRef.current = fees;
  }

  const feeOptions = feesRef.current;

  // MESQUITA: selecao em memoria (id -> email) independente da pagina
  const [selected, setSelected] = useState<Map<string, string | null>>(
    () => new Map(),
  );
  const [isSelectingAll, setIsSelectingAll] = useState(false);

  const resetSelection = useCallback(() => {
    setSelected(new Map());
  }, []);

  const toggleSelected = useCallback((id: string, email: string | null) => {
    setSelected((current) => {
      const next = new Map(current);

      if (next.has(id)) {
        next.delete(id);
      } else {
        next.set(id, email);
      }

      return next;
    });
  }, []);

  const columns = useMemo(() => {
    const columnHelper = createColumnHelper<MemberWithPayments>();

    return [
      // MESQUITA: coluna de selecao com checkbox por linha e no cabecalho
      columnHelper.display({
        id: 'select',
        size: 44,
        enableSorting: false,
        header: ({ table: reactTable }) => {
          const rows = reactTable.getRowModel().rows;
          const selectedVisible = rows.filter((row) =>
            selected.has(row.original.id),
          ).length;
          const allVisibleSelected =
            rows.length > 0 && selectedVisible === rows.length;
          const someVisibleSelected =
            selectedVisible > 0 && !allVisibleSelected;

          return (
            <Checkbox
              aria-label="Selecionar página"
              checked={
                allVisibleSelected
                  ? true
                  : someVisibleSelected
                    ? 'indeterminate'
                    : false
              }
              disabled={rows.length === 0}
              onCheckedChange={() => {
                setSelected((current) => {
                  const next = new Map(current);

                  for (const row of rows) {
                    if (allVisibleSelected) {
                      next.delete(row.original.id);
                    } else {
                      next.set(row.original.id, row.original.email ?? null);
                    }
                  }

                  return next;
                });
              }}
            />
          );
        },
        cell: ({ row }) => (
          <Checkbox
            aria-label={`Selecionar ${row.original.name}`}
            checked={selected.has(row.original.id)}
            onCheckedChange={() =>
              toggleSelected(row.original.id, row.original.email ?? null)
            }
          />
        ),
      }),
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
      // MESQUITA: coluna email do sócio com vazio legível
      columnHelper.accessor('email', {
        id: 'email',
        header: 'Email',
        enableSorting: false,
        cell: ({ row }) => row.original.email ?? '—',
      }),
      columnHelper.accessor('memberSince', {
        id: 'memberSince',
        header: 'Desde',
        size: 90,
        enableSorting: false,
        cell: ({ row }) => row.original.memberSince ?? '—',
      }),
      columnHelper.accessor('memberSince', {
        id: 'membershipYears',
        header: 'Anos',
        size: 70,
        enableSorting: false,
        cell: ({ row }) =>
          row.original.memberSince === null
            ? '—'
            : String(currentYear - row.original.memberSince),
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
        header: 'Quotas em dia',
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
        size: 240,
        cell: ({ row }) => {
          const paidFeeIds = new Set(
            row.original.feePayments.map((payment) => payment.feeId),
          );
          const hasUnpaidFee = feeOptions.some(
            (fee) => !paidFeeIds.has(fee.id),
          );

          // MESQUITA: acoes alinhadas a direita, com o Ver em ultimo
          return (
            <div className="flex items-center justify-end gap-2">
              {/* MESQUITA: pagamento de quotas como botao de icone */}
              {!areFeesUpToDate(row.original.lastPaidYear) && hasUnpaidFee && (
                <Button
                  type="button"
                  variant="outline"
                  size="icon"
                  aria-label={`Pagar quotas de ${row.original.name}`}
                  title={`Pagar quotas de ${row.original.name}`}
                  onClick={() => setPaymentMember(row.original)}
                >
                  <Coins className="h-4 w-4" aria-hidden="true" />
                </Button>
              )}
              {/* MESQUITA - #20: copy public member view link */}
              {row.original.active ? (
                <MemberShareLinkButton
                  viewToken={row.original.viewToken}
                  memberName={row.original.name}
                  variant="icon"
                />
              ) : null}
              <MemberActiveToggle
                id={row.original.id}
                active={row.original.active}
                memberName={row.original.name}
              />
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
  }, [currentYear, feeOptions, selected, toggleSelected]);

  const [searchName, setSearchName] = useState('');
  // MESQUITA: lista abre sem filtro de ativos por padrao, a mostrar todos
  const [onlyActive, setOnlyActive] = useState(false);
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
        value: onlyOverdue ? requiredFeeYear : lastPaidBefore,
      },
    ];
  }, [
    lastPaidBefore,
    onlyActive,
    onlyHalfFee,
    onlyOverdue,
    requiredFeeYear,
    searchName,
  ]);

  // MESQUITA: filtros de pesquisa derivados do filtro permanente da tabela
  const selectAllFilters = useMemo(() => {
    const params = new URLSearchParams();

    for (const filter of permanentFilters) {
      if (!('field' in filter)) {
        continue;
      }

      const value = filter.value;

      if (value === undefined || value === null) {
        continue;
      }

      params.set(filter.field, String(value));
    }

    return params.toString();
  }, [permanentFilters]);

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
  const { setCurrentPage } = table.refineCore;

  // MESQUITA: copia os emails selecionados e avisa os que nao tem email
  const handleCopyEmails = async () => {
    const emails = [...selected.values()]
      .map((email) => email?.trim() ?? '')
      .filter((email) => email !== '');
    const skipped = selected.size - emails.length;

    if (emails.length === 0) {
      toast.error('Nenhum dos sócios selecionados tem email');
      return;
    }

    const copied = await copyToClipboard(emails.join(', '));

    if (!copied) {
      toast.error('Não foi possível copiar os emails');
      return;
    }

    toast.success('Emails copiados');

    if (skipped > 0) {
      toast.warning(`${skipped} sem email`);
    }
  };

  // MESQUITA: seleciona todos os socios do filtro atual em todas as paginas
  const handleSelectAll = async () => {
    setIsSelectingAll(true);

    try {
      const firstPage = await fetchMembersPage(1, selectAllFilters);

      if (firstPage.total === 0) {
        return;
      }

      if (firstPage.total > MAX_SELECT_ALL_PAGES * SELECT_ALL_PAGE_SIZE) {
        throw new Error('Members selection exceeds the page cap');
      }

      const selection = new Map<string, string | null>();

      for (const member of firstPage.data) {
        selection.set(member.id, member.email ?? null);
      }

      const lastPage = Math.min(
        Math.ceil(firstPage.total / SELECT_ALL_PAGE_SIZE),
        MAX_SELECT_ALL_PAGES,
      );

      for (let page = 2; page <= lastPage; page += 1) {
        const result = await fetchMembersPage(page, selectAllFilters);

        for (const member of result.data) {
          selection.set(member.id, member.email ?? null);
        }
      }

      setSelected(selection);
    } catch {
      toast.error('Não foi possível selecionar todos os sócios');
    } finally {
      setIsSelectingAll(false);
    }
  };

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
            onChange={(event) => {
              setSearchName(event.target.value);
              resetSelection();
              setCurrentPage(1);
            }}
            className="max-w-sm"
          />
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-active"
              checked={onlyActive}
              onCheckedChange={(checked) => {
                setOnlyActive(checked === true);
                resetSelection();
                setCurrentPage(1);
              }}
            />
            <Label htmlFor="only-active">Só ativos</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-half-fee"
              checked={onlyHalfFee}
              onCheckedChange={(checked) => {
                setOnlyHalfFee(checked === true);
                resetSelection();
                setCurrentPage(1);
              }}
            />
            <Label htmlFor="only-half-fee">Só meias quotas</Label>
          </div>
          <div className="flex items-center gap-2">
            <Checkbox
              id="only-overdue"
              checked={onlyOverdue}
              onCheckedChange={(checked) => {
                setOnlyOverdue(checked === true);
                resetSelection();
                setCurrentPage(1);
              }}
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
              onValueChange={(value) => {
                setLastPaidBefore(
                  value === 'all' ? undefined : Number(value),
                );
                resetSelection();
                setCurrentPage(1);
              }}
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
        {/* MESQUITA - #18: botao de acesso as cotas pagas */}
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/members/quotas">Ver quotas pagas</Link>
          </Button>
          <Button asChild variant="outline" size="sm">
            <Link href="/members/fees">Gerir quotas</Link>
          </Button>
        </div>
      </div>
      {/* MESQUITA: nota global de quotas em atraso a partir de 1 de fevereiro */}
      {isFeeDeadlineReached && (
        <Alert>
          <TriangleAlert />
          <AlertTitle>Quotas de {currentYear} em atraso</AlertTitle>
          <AlertDescription>
            As quotas de {currentYear} devem estar pagas até 31 de janeiro de{' '}
            {currentYear}. Os sócios sem a quota paga estão assinalados em
            «Quotas em dia».
          </AlertDescription>
        </Alert>
      )}
      {/* MESQUITA: barra de ferramentas da selecao, contagem e copia de emails */}
      <div className="flex flex-wrap items-center gap-3">
        <span aria-live="polite" className="text-sm text-muted-foreground">
          {selected.size === 1
            ? '1 selecionado'
            : `${selected.size} selecionados`}
        </span>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleSelectAll}
          disabled={isSelectingAll}
        >
          {isSelectingAll && (
            <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
          )}
          Selecionar tudo
        </Button>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={handleCopyEmails}
          disabled={selected.size === 0}
        >
          Copiar emails
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

type MemberActiveToggleProps = {
  id: string;
  active?: boolean;
  memberName: string;
  // MESQUITA: modo com etiqueta de texto para a ficha do socio
  withLabel?: boolean;
};

export function MemberActiveToggle({
  id,
  active = false,
  memberName,
  withLabel = false,
}: MemberActiveToggleProps) {
  const invalidate = useInvalidate();
  const { mutate, mutation } = useUpdate<MemberWithPayments, HttpError>();

  const handleToggle = () => {
    const nextActive = !active;
    mutate(
      {
        resource: 'members',
        id,
        values: { active: nextActive },
        // MESQUITA: mostra apenas o toast customizado, sem o de sucesso do Refine
        successNotification: false,
      },
      {
        onSuccess: async () => {
          await invalidate({ resource: 'members', invalidates: ['list'] });
          await invalidate({
            resource: 'members',
            invalidates: ['detail'],
            id,
          });
          toast.success(
            nextActive
              ? `Sócio ${memberName} ativado`
              : `Sócio ${memberName} desativado`,
          );
        },
        onError: () => {
          toast.error('Não foi possível atualizar o estado do sócio');
        },
      },
    );
  };

  const label = nextLabel(active, memberName);
  const Icon = active ? UserX : UserCheck;

  return (
    <Button
      type="button"
      variant="outline"
      size={withLabel ? 'sm' : 'icon'}
      aria-label={label}
      title={label}
      onClick={handleToggle}
      disabled={mutation.isPending}
    >
      <Icon className="h-4 w-4" aria-hidden="true" />
      {withLabel && (active ? 'Desativar' : 'Ativar')}
    </Button>
  );
}

function nextLabel(active: boolean, memberName: string) {
  return active
    ? `Desativar sócio ${memberName}`
    : `Ativar sócio ${memberName}`;
}
