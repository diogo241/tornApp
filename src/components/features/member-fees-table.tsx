'use client';

import { FeePaymentDialog } from '@/components/features/fee-payment-dialog';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import type { FeePayment, MemberWithPayments } from '@lib/types';
import { formatCurrency, formatDateTime } from '@lib/utils';
import { useState } from 'react';

export type MemberFee = {
  id: string;
  year: number;
  amount: number;
  label?: string | null;
  active?: boolean;
};

type FeeRow = {
  feeId: string;
  year: number;
  amount: number | null;
  active: boolean;
  fee?: MemberFee;
  payment?: FeePayment;
};

type MemberFeesTableProps = {
  member: MemberWithPayments;
  fees: MemberFee[];
};

const methodLabels: Record<FeePayment['method'], string> = {
  cash: 'Numerário',
  mbway: 'MBWay',
  other: 'Outros',
};

const buildRows = (fees: MemberFee[], payments: FeePayment[]): FeeRow[] => {
  const paymentByFee = new Map(
    payments.map((payment) => [payment.feeId, payment]),
  );
  const activeIds = new Set(fees.map((fee) => fee.id));

  const activeRows: FeeRow[] = fees.map((fee) => ({
    feeId: fee.id,
    year: fee.year,
    amount: fee.amount,
    active: fee.active ?? true,
    fee,
    payment: paymentByFee.get(fee.id),
  }));

  const paidInactiveRows: FeeRow[] = payments.flatMap((payment) => {
    if (!payment.fee || activeIds.has(payment.feeId)) {
      return [];
    }

    return [
      {
        feeId: payment.feeId,
        year: payment.fee.year,
        amount: null,
        active: payment.fee.active,
        payment,
      },
    ];
  });

  return [...activeRows, ...paidInactiveRows].sort((a, b) => a.year - b.year);
};

function MethodCell({ payment }: { payment: FeePayment }) {
  const label = methodLabels[payment.method];

  if (payment.method === 'other' && payment.methodDetail) {
    return (
      <span title={payment.methodDetail}>
        {label}
        <span className="sr-only"> · {payment.methodDetail}</span>
      </span>
    );
  }

  return <span>{label}</span>;
}

export function MemberFeesTable({ member, fees }: MemberFeesTableProps) {
  const [open, setOpen] = useState(false);
  const [selectedFeeId, setSelectedFeeId] = useState<string | undefined>();
  const rows = buildRows(fees, member.feePayments);

  return (
    <Card id="cotas">
      <CardHeader>
        {/* MESQUITA - #19f: terminologia quota */}
        <CardTitle>Quotas</CardTitle>
      </CardHeader>
      <CardContent>
        {rows.length === 0 ? (
          <p className="text-muted-foreground text-sm">
            Sem quotas configuradas.
          </p>
        ) : (
          <Table>
            <TableCaption className="sr-only">Quotas por ano</TableCaption>
            <TableHeader>
              <TableRow>
                <TableHead>Ano</TableHead>
                <TableHead>Valor</TableHead>
                <TableHead>Estado</TableHead>
                <TableHead>Data</TableHead>
                <TableHead>Tipologia</TableHead>
                <TableHead>Meia quota</TableHead>
                <TableHead>Ações</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((row) => {
                const { fee } = row;
                return (
                  <TableRow key={row.feeId}>
                    <TableCell>
                      <span className="flex items-center gap-2">
                        {row.year}
                        {!row.active && (
                          <Badge
                            variant="outline"
                            className="text-muted-foreground"
                          >
                            Inativa
                          </Badge>
                        )}
                      </span>
                    </TableCell>
                    <TableCell>
                      {row.amount !== null ? formatCurrency(row.amount) : '—'}
                    </TableCell>
                    <TableCell>{row.payment ? 'Paga' : 'Não paga'}</TableCell>
                    <TableCell>
                      {row.payment
                        ? row.payment.paidAt
                          ? formatDateTime(row.payment.paidAt).dateOnly
                          : '✓'
                        : '—'}
                    </TableCell>
                    <TableCell>
                      {row.payment ? <MethodCell payment={row.payment} /> : '—'}
                    </TableCell>
                    <TableCell>
                      {row.payment?.halfFee ? (
                        <>
                          ½<span className="sr-only"> meia quota</span>
                        </>
                      ) : (
                        '—'
                      )}
                    </TableCell>
                    <TableCell>
                      {row.active && fee ? (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          aria-label={`${row.payment ? 'Editar' : 'Registar'} quota ${row.year}`}
                          onClick={() => {
                            setSelectedFeeId(fee.id);
                            setOpen(true);
                          }}
                        >
                          {row.payment ? 'Editar' : 'Registar'}
                        </Button>
                      ) : null}
                    </TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        )}
      </CardContent>
      {open && (
        <FeePaymentDialog
          member={{
            id: member.id,
            number: member.number,
            name: member.name,
          }}
          fees={fees}
          initialFeeId={selectedFeeId}
          payments={member.feePayments}
          onClose={() => setOpen(false)}
        />
      )}
    </Card>
  );
}

export default MemberFeesTable;
