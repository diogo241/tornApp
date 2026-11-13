import type { MemberFee } from '@/components/features/member-fees-table';
import { listActiveFees } from '@lib/services/fees/fee.service';
import { MemberShow } from './member-show';

export default async function MemberShowPage() {
  const fees = await listActiveFees();

  const memberFees: MemberFee[] = fees.map((fee) => ({
    id: fee.id,
    year: fee.year,
    amount: Number(fee.amount),
    label: fee.label,
    active: fee.active,
  }));

  return <MemberShow fees={memberFees} />;
}
