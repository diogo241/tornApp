import type { FeePaymentOption } from '@/components/features/fee-payment-dialog';
import { listActiveFees } from '@lib/services/fees/fee.service';
import { MemberList } from './member-list';

export default async function MemberListPage() {
  const fees = await listActiveFees();

  const feeOptions: FeePaymentOption[] = fees.map((fee) => ({
    id: fee.id,
    year: fee.year,
    amount: Number(fee.amount),
  }));

  return <MemberList fees={feeOptions} />;
}
