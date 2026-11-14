import type { Metadata } from 'next';
import { getPublicMemberViewByToken } from '@lib/services/members/member-public.service';
import { PublicMemberView } from './public-member-view';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = {
  title: 'Área do sócio | NAF',
  robots: {
    index: false,
    follow: false,
  },
};

type PublicMemberPageProps = {
  searchParams: Promise<{ token?: string | string[] }>;
};

export default async function PublicMemberPage({
  searchParams,
}: PublicMemberPageProps) {
  const resolvedParams = await searchParams;
  const token =
    typeof resolvedParams.token === 'string' ? resolvedParams.token : undefined;

  const data = await getPublicMemberViewByToken(token);

  return <PublicMemberView data={data} />;
}
