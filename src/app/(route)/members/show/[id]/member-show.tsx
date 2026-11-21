'use client';

import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent } from '@/components/ui/card';
import {
  ShowView,
  ShowViewHeader,
} from '@/components/refine-ui/views/show-view';
import {
  MemberFeesTable,
  type MemberFee,
} from '@/components/features/member-fees-table';
// MESQUITA - #20: import share link button for member detail header
import { MemberShareLinkButton } from '@/components/features/member-share-link-button';
// MESQUITA: alternar estado do socio na ficha
import { MemberActiveToggle } from '@/app/(route)/members/member-list';
import { LoadingOverlay } from '@components/refine-ui/layout/loading-overlay';
import { areFeesUpToDate } from '@lib/services/members/member.helpers';
import type { MemberWithPayments } from '@lib/types';
import { formatDateTime } from '@lib/utils';
import { useShow } from '@refinedev/core';
import { useParams } from 'next/navigation';

type MemberShowProps = {
  fees: MemberFee[];
};

export function MemberShow({ fees }: MemberShowProps) {
  const { id } = useParams<{ id: string }>();
  const { result, query } = useShow<MemberWithPayments>({
    resource: 'members',
    id,
  });
  const { isLoading, error } = query;

  const member = result?.id ? result : undefined;
  const apiMessage = (result as unknown as { error?: string } | undefined)
    ?.error ?? 'Não foi possível carregar o sócio.';

  if (error) {
    return (
      <ShowView>
        <Alert variant="destructive">
          <AlertTitle>Erro</AlertTitle>
          <AlertDescription>{apiMessage}</AlertDescription>
        </Alert>
      </ShowView>
    );
  }

  return (
    <ShowView>
      {/* MESQUITA - #20: pass share link action when member is loaded */}
      <ShowViewHeader
        title={member?.name ?? 'Sócio'}
        backTo="/members"
        actions={
          member ? (
            <>
              {member.active && (
                <MemberShareLinkButton
                  viewToken={member.viewToken}
                  memberName={member.name}
                  variant="button"
                />
              )}
              {/* MESQUITA: alternar estado do socio na ficha */}
              <MemberActiveToggle
                id={member.id}
                active={member.active}
                memberName={member.name}
                withLabel
              />
            </>
          ) : undefined
        }
      />
      <LoadingOverlay loading={isLoading}>
        {member ? (
          <>
            <Card>
              <CardContent className="flex flex-col justify-start gap-4 md:flex-row md:gap-8">
                <div>
                  <h4 className="text-sm font-medium mb-2">Nº</h4>
                  <p className="text-sm text-muted-foreground">
                    {member.number}
                  </p>
                </div>
                {/* MESQUITA: email do sócio no cartão de detalhe */}
                <div>
                  <h4 className="text-sm font-medium mb-2">Email</h4>
                  <p className="text-sm text-muted-foreground">
                    {member.email ?? '—'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Sócio desde</h4>
                  <p className="text-sm text-muted-foreground">
                    {member.memberSince ?? '—'}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Anos de associado</h4>
                  <p className="text-sm text-muted-foreground">
                    {member.memberSince === null
                      ? '—'
                      : `${new Date().getFullYear() - member.memberSince} ${
                          new Date().getFullYear() - member.memberSince === 1
                            ? 'ano'
                            : 'anos'
                        }`}
                  </p>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Estado</h4>
                  <Badge variant={member.active ? 'secondary' : 'outline'}>
                    {member.active ? 'Ativo' : 'Inativo'}
                  </Badge>
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Quotas em dia</h4>
                  {areFeesUpToDate(member.lastPaidYear) ? (
                    <Badge variant="default">Sim</Badge>
                  ) : (
                    <Badge variant="destructive">Não</Badge>
                  )}
                </div>
                <div>
                  <h4 className="text-sm font-medium mb-2">Criado em</h4>
                  <p className="text-sm text-muted-foreground">
                    {formatDateTime(member.createdAt).dateTime || '—'}
                  </p>
                </div>
              </CardContent>
            </Card>

            <MemberFeesTable member={member} fees={fees} />
          </>
        ) : null}
      </LoadingOverlay>
    </ShowView>
  );
}

export default MemberShow;
