import Image from 'next/image';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  areFeesUpToDate,
  getRequiredFeeYear,
} from '@lib/services/members/member.helpers';
import type { FeePaymentMethod, PublicMemberView as PublicMemberViewData } from '@lib/types';
import { formatCurrency, formatDateTime } from '@lib/utils';
import { TriangleAlert } from 'lucide-react';

type PublicMemberViewProps = {
  data: PublicMemberViewData | null;
};

const METHOD_LABELS: Record<FeePaymentMethod, string> = {
  cash: 'Numerário',
  mbway: 'MBWay',
  other: 'Outros',
};

function PublicHeader() {
  return (
    <header className="flex items-center gap-3 border-b pb-4">
      <Image
        src="/logo.png"
        alt="NAF"
        width={40}
        height={40}
        className="h-10 w-10 object-contain"
        priority
      />
      <div>
        <p className="text-sm font-semibold leading-none">NAF</p>
        <p className="mt-1 text-xs text-muted-foreground">Área do sócio</p>
      </div>
    </header>
  );
}

function PublicFooter() {
  return (
    <footer className="border-t pt-4 text-center text-xs text-muted-foreground">
      Este link é pessoal. Não o partilhe.
    </footer>
  );
}

function InvalidLinkCard() {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Link inválido</CardTitle>
        <CardDescription>
          Este link não é válido ou já não se encontra disponível.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <p className="text-sm text-muted-foreground">
          Se precisar de consultar as suas quotas, peça um novo link ao NAF.
        </p>
      </CardContent>
    </Card>
  );
}

// MESQUITA: nota com a data-limite das quotas e o ano efetivamente em atraso.
function DuesNote({ lastPaidYear }: { lastPaidYear: number | null }) {
  const now = new Date();
  const currentYear = now.getFullYear();
  const requiredFeeYear = getRequiredFeeYear(now);
  const isUpToDate = areFeesUpToDate(lastPaidYear, now);

  return (
    <Alert>
      <TriangleAlert />
      <AlertTitle>
        Quotas de {isUpToDate ? currentYear : requiredFeeYear}
      </AlertTitle>
      <AlertDescription>
        {isUpToDate
          ? `As quotas de ${currentYear} devem estar pagas até 1 de fevereiro de ${currentYear}.`
          : `As quotas de ${requiredFeeYear} devem estar pagas até 1 de fevereiro de ${requiredFeeYear}.`}
      </AlertDescription>
    </Alert>
  );
}

export function PublicMemberView({ data }: PublicMemberViewProps) {
  return (
    <div className="min-h-svh bg-background text-foreground">
      <div className="mx-auto flex min-h-svh w-full max-w-3xl flex-col gap-6 px-4 py-8 sm:px-6">
        <PublicHeader />

        <main className="flex flex-1 flex-col gap-6">
          {!data ? (
            <InvalidLinkCard />
          ) : (
            <>
              <Card>
                <CardHeader>
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <h1 className="text-2xl font-semibold tracking-tight">
                      {data.member.name}
                    </h1>
                    {!data.member.active && (
                      <Badge variant="outline">Inativo</Badge>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Nº de sócio
                      </dt>
                      <dd className="mt-1 text-base font-medium">
                        {data.member.number}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Sócio desde
                      </dt>
                      <dd className="mt-1 text-base font-medium">
                        {data.member.memberSince ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Última quota paga
                      </dt>
                      <dd className="mt-1 text-base font-medium">
                        {data.lastPaidYear ?? '—'}
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-muted-foreground">
                        Quotas em dia
                      </dt>
                      <dd className="mt-1">
                        {areFeesUpToDate(data.lastPaidYear) ? (
                          <Badge variant="default">Sim</Badge>
                        ) : (
                          <Badge variant="destructive">Não</Badge>
                        )}
                      </dd>
                    </div>
                  </dl>
                </CardContent>
              </Card>

              <DuesNote lastPaidYear={data.lastPaidYear} />

              <Card>
                <CardHeader>
                  <CardTitle>Quotas pagas</CardTitle>
                </CardHeader>
                <CardContent>
                  {data.payments.length === 0 ? (
                    <div className="space-y-1 py-2">
                      <p className="text-sm font-medium">Sem quotas pagas</p>
                      <p className="text-sm text-muted-foreground">
                        Ainda não existem quotas pagas registadas.
                      </p>
                    </div>
                  ) : (
                    <Table>
                      <TableCaption className="sr-only">
                        Quotas pagas
                      </TableCaption>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Ano</TableHead>
                          <TableHead>Data</TableHead>
                          <TableHead>Forma de pagamento</TableHead>
                          <TableHead className="text-right">
                            Valor pago
                          </TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {data.payments.map((payment) => {
                          const detail = payment.methodDetail?.trim();

                          return (
                            <TableRow key={payment.year}>
                              <TableCell className="font-medium">
                                {payment.year}
                              </TableCell>
                              <TableCell>
                                {payment.paidAt
                                  ? formatDateTime(payment.paidAt).dateOnly
                                  : 'Data não registada'}
                              </TableCell>
                              <TableCell>
                                <div>
                                  <span>{METHOD_LABELS[payment.method]}</span>
                                  {payment.method === 'other' && detail ? (
                                    <span className="block text-xs text-muted-foreground">
                                      {detail}
                                    </span>
                                  ) : null}
                                </div>
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="inline-flex flex-wrap items-center justify-end gap-2">
                                  <span>
                                    {formatCurrency(payment.amountPaid)}
                                  </span>
                                  {payment.halfFee ? (
                                    <Badge variant="secondary">
                                      Meia quota
                                    </Badge>
                                  ) : null}
                                </div>
                              </TableCell>
                            </TableRow>
                          );
                        })}
                      </TableBody>
                    </Table>
                  )}
                </CardContent>
              </Card>
            </>
          )}
        </main>

        <PublicFooter />
      </div>
    </div>
  );
}
