'use client';

// MESQUITA - #20: support optional custom actions in ShowViewHeader
import type { PropsWithChildren, ReactNode } from 'react';

import { RefreshButton } from '@/components/refine-ui/buttons/refresh';
import { Breadcrumb } from '@/components/refine-ui/layout/breadcrumb';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useBack,
  useResourceParams,
  useUserFriendlyName,
} from '@refinedev/core';
import { ArrowLeftIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';
import { EditButton } from '../buttons/edit';
import { DeleteButton } from '../buttons/delete';

type ShowViewProps = PropsWithChildren<{
  className?: string;
}>;

export function ShowView({ children, className }: ShowViewProps) {
  return (
    <div className={cn('flex flex-col', 'gap-4', className)}>{children}</div>
  );
}

type ShowViewHeaderProps = PropsWithChildren<{
  resource?: string;
  title?: string;
  backTo?: string;
  actions?: ReactNode;
  wrapperClassName?: string;
  headerClassName?: string;
}>;

export const ShowViewHeader = ({
  resource: resourceFromProps,
  title: titleFromProps,
  backTo,
  actions,
  wrapperClassName,
  headerClassName,
}: ShowViewHeaderProps) => {
  const back = useBack();
  const router = useRouter();

  const onBack = () => {
    if (backTo && window.history.length <= 1) {
      router.replace(backTo);
      return;
    }

    back();
  };

  const getUserFriendlyName = useUserFriendlyName();

  const { resource, identifier } = useResourceParams({
    resource: resourceFromProps,
  });
  const { id: recordItemId } = useResourceParams();

  const resourceName = resource?.name ?? identifier;

  const title =
    titleFromProps ??
    getUserFriendlyName(
      resource?.meta?.label ?? identifier ?? resource?.name,
      'singular',
    );

  return (
    <div className={cn('flex flex-col', 'gap-4', wrapperClassName)}>
      <div className="flex items-center relative gap-2">
        <div className="bg-background z-[2] pr-4">
          <Breadcrumb />
        </div>
        <Separator className={cn('absolute', 'left-0', 'right-0', 'z-[1]')} />
      </div>
      <div
        className={cn(
          'flex',
          'flex-col',
          'gap-2',
          'sm:flex-row',
          'sm:items-center',
          'sm:justify-between',
          '-ml-2.5',
          headerClassName,
        )}
      >
        <div className="flex items-center gap-1">
          <Button variant="ghost" size="icon" onClick={onBack}>
            <ArrowLeftIcon className="h-4 w-4" />
          </Button>
          <h2 className="text-2xl font-bold">{title}</h2>
        </div>

        {/* MESQUITA - #20: render optional custom actions in ShowViewHeader */}
        <div className="flex flex-wrap items-center gap-2 justify-start px-4 sm:px-0">
          {actions}
          <RefreshButton
            variant="outline"
            recordItemId={recordItemId}
            resource={resourceName}
          />
          <EditButton
            variant="outline"
            recordItemId={recordItemId}
            resource={resourceName}
          />
        </div>
      </div>
    </div>
  );
};

ShowView.displayName = 'ShowView';
