'use client';

import { Switch } from '@/components/ui/switch';
import type { Referee } from '@lib/types';
import { useInvalidate, useUpdate, type HttpError } from '@refinedev/core';
import { toast } from 'sonner';

type RefereePaidToggleProps = {
  id: string;
  paid?: boolean;
  refereeId?: string;
};

export function RefereePaidToggle({
  id,
  paid = false,
  refereeId,
}: RefereePaidToggleProps) {
  const invalidate = useInvalidate();
  const { mutate, mutation } = useUpdate<Referee, HttpError>();

  const handleCheckedChange = (checked: boolean) => {
    mutate(
      {
        resource: 'referees',
        id,
        values: { paid: checked },
      },
      {
        onSuccess: async () => {
          await invalidate({ resource: 'referees', invalidates: ['list'] });
          if (refereeId) {
            await invalidate({
              resource: 'referees',
              invalidates: ['detail'],
              id: refereeId,
            });
          }
          toast.success(
            checked ? 'Referee marked as paid' : 'Referee marked as unpaid',
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

export default RefereePaidToggle;
