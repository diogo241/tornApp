'use client';

import { Switch } from '@/components/ui/switch';
import type { ClubBalance } from '@lib/types';
import { useInvalidate, useUpdate, type HttpError } from '@refinedev/core';
import { toast } from 'sonner';

type ClubDebtPaidToggleProps = {
  id: string;
  paid?: boolean;
  clubId?: string;
};

export function ClubDebtPaidToggle({
  id,
  paid = false,
  clubId,
}: ClubDebtPaidToggleProps) {
  const invalidate = useInvalidate();
  const { mutate, mutation } = useUpdate<ClubBalance, HttpError>();

  const handleCheckedChange = (checked: boolean) => {
    mutate(
      {
        resource: 'club-balance',
        id,
        values: { paid: checked },
      },
      {
        onSuccess: async () => {
          await invalidate({ resource: 'clubs', invalidates: ['list'] });
          if (clubId) {
            await invalidate({
              resource: 'clubs',
              invalidates: ['detail'],
              id: clubId,
            });
          }
          toast.success(
            checked ? 'Debt marked as paid' : 'Debt marked as unpaid',
          );
        },
        onError: () => {
          toast.error('Could not update the payment status');
        },
      },
    );
  };

  return (
    <Switch
      checked={paid}
      onCheckedChange={handleCheckedChange}
      disabled={mutation.isPending}
      aria-label="Paid"
    />
  );
}

export default ClubDebtPaidToggle;
