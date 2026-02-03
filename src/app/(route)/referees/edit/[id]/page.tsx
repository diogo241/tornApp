'use client';

import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view';
import { Button } from '@/components/ui/button';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { type Referee } from '@lib/types';
import { useForm } from '@refinedev/react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import { BaseRecord, HttpError } from '@refinedev/core';
import { zodResolver } from '@hookform/resolvers/zod';
import { insertReferee } from '@lib/validators';
import { LoadingOverlay } from '@components/refine-ui/layout/loading-overlay';

export default function RefereeEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<BaseRecord, HttpError, Referee>({
    resolver: zodResolver(insertReferee),
    refineCoreProps: {
      resource: 'referees',
      action: 'edit',
      id: id as string,
    },
  });

  function onSubmit(data: Referee) {
    onFinish(data);
  }

  return (
    <EditView>
      <LoadingOverlay loading={formLoading}>
        <EditViewHeader title="Edit Referee" />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="name"
              rules={{ required: 'Title is required' }}
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Name</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex gap-2">
              <Button
                type="submit"
                {...form.saveButtonProps}
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'Updating...' : 'Update'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
          </form>
        </Form>
      </LoadingOverlay>
    </EditView>
  );
}
