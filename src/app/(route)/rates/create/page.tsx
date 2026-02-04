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
import { LoadingOverlay } from '@components/refine-ui/layout/loading-overlay';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectValue,
  SelectTrigger,
} from '@components/ui/select';
import { zodResolver } from '@hookform/resolvers/zod';
import { NUMBER_PLAYERS } from '@lib/constants';
import type { Rate } from '@lib/types';
import { insertRate } from '@lib/validators';
import type { BaseRecord, HttpError } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { useRouter } from 'next/navigation';

export default function RateCreatePage() {
  const router = useRouter();

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<BaseRecord, HttpError, Rate>({
    resolver: zodResolver(insertRate),
    refineCoreProps: {
      action: 'create',
      redirect: 'list',
    },
    defaultValues: {
      name: '',
      players: 7,
      refRate: 0.42,
      aRate: 0.4,
    },
  });

  const playersValue = form.watch('players');

  function onSubmit(data: Rate) {
    onFinish(data);
  }

  return (
    <LoadingOverlay loading={formLoading}>
      <CreateView>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            {/* Name */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
              {/* Players Field */}
              <FormField
                control={form.control}
                name="players"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Players</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      required
                      defaultValue={
                        String(field.value) !== ''
                          ? String(field.value)
                          : 'Select number of players'
                      }
                    >
                      <SelectTrigger className="dark:bg-input/30 text-muted-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm">
                        <SelectValue placeholder="Select number of players" />
                      </SelectTrigger>
                      <SelectContent>
                        {NUMBER_PLAYERS.map((item) => (
                          <SelectItem
                            key={item.value}
                            value={item.value.toString()}
                          >
                            {item.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Referee Rate */}
              <FormField
                control={form.control}
                name="refRate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Referee Rate</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        required
                        placeholder="Enter a rate"
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Assistant Referee Rate */}
              {Number(playersValue) === 11 && (
                <FormField
                  control={form.control}
                  name="aRate"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistant Referee Rate</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Enter a rate"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>

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
    </LoadingOverlay>
  );
}
