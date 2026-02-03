'use client';

import { CreateView } from '@/components/refine-ui/views/create-view';
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
import { zodResolver } from '@hookform/resolvers/zod';
import type { Referee } from '@lib/types';
import { insertReferee } from '@lib/validators';
import type { BaseRecord, HttpError } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { useRouter } from 'next/navigation';

export default function RefereeCreatePage() {
  const router = useRouter();

  const {
    refineCore: { onFinish },
    ...form
  } = useForm<BaseRecord, HttpError, Referee>({
    resolver: zodResolver(insertReferee),
    refineCoreProps: {
      action: 'create',
    },
    defaultValues: {
      name: '',
    },
  });

  function onSubmit(data: Referee) {
    onFinish(data);
  }

  return (
    <CreateView>
      <Form {...form}>
        <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Name</FormLabel>
                <FormControl>
                  <Input {...field} placeholder="Enter a name" />
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
              {form.formState.isSubmitting ? 'Creating...' : 'Create'}
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
    </CreateView>
  );
}
