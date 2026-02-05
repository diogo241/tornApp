'use client';

import { EditView } from '@/components/refine-ui/views/edit-view';
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
import { FormRelationSelect } from '@components/shared/form-relation-select';
import { Calendar } from '@components/ui/calendar';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@components/ui/popover';
import { zodResolver } from '@hookform/resolvers/zod';
import type { Tournament } from '@lib/types';
import { formatDateTime } from '@lib/utils';
import { insertTournament } from '@lib/validators';
import { useSelect, type BaseRecord, type HttpError } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { ChevronDownIcon } from 'lucide-react';
import { useParams, useRouter } from 'next/navigation';
import { useEffect } from 'react';

export default function TournamentEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const {
    refineCore: { onFinish, formLoading, query },

    ...form
  } = useForm<BaseRecord, HttpError, Tournament>({
    resolver: zodResolver(insertTournament),
    defaultValues: {
      name: '',
      totalGames: 0,
      countA: 0,
      durationA: 0,
      countB: 0,
      durationB: 0,
      countC: 0,
      durationC: 0,
      clubId: '',
      rateId: '',
    },
    refineCoreProps: {
      resource: 'tournaments',
      action: 'edit',
      redirect: 'show',
      id: id as string,
    },
  });

  console.log(form.formState.errors);

  // Use watch to set max values for number of games
  const totalGames = form.watch('totalGames');
  const countA = form.watch('countA');
  const countB = form.watch('countB');
  const countC = form.watch('countC');

  const remainGamesA = totalGames - (countB ?? 0) - (countC ?? 0);
  const remainGamesB = totalGames - countA - (countC ?? 0);
  const remainGamesC = totalGames - countA - countB!;

  function onSubmit(data: Tournament) {
    onFinish(data);
  }

  // Fix to get correct endDate
  const tournament = query?.data?.data as Tournament | undefined;
  const endDate = new Date(tournament?.endDate ?? '');
  useEffect(() => {
    if (endDate) {
      form.setValue('endDate', endDate, { shouldDirty: false });
      form.setValue('year', endDate.getFullYear(), { shouldDirty: false });
    }
  }, [query]);

  const isLoading = formLoading || query?.isPending;

  // Fecth rates
  const { options: rateOptions } = useSelect({
    resource: 'rates',
    optionLabel: 'name',
    optionValue: 'id',
  });

  // Fecth clubs
  const { options: clubOptions } = useSelect({
    resource: 'clubs',
    optionLabel: 'name',
    optionValue: 'id',
  });

  return (
    <EditView>
      <LoadingOverlay loading={isLoading}>
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
              {/* Start and End Date */}
              <FormField
                control={form.control}
                name="startDate"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Date</FormLabel>
                    <FormControl>
                      <Popover>
                        <PopoverTrigger asChild>
                          <Button
                            variant="outline"
                            id="dates"
                            className="w-full justify-between font-normal"
                          >
                            {field.value
                              ? `${formatDateTime(field.value).dateOnly} - ${
                                  formatDateTime(form.getValues('endDate'))
                                    .dateOnly
                                }`
                              : 'Pick a date'}
                            <ChevronDownIcon />
                          </Button>
                        </PopoverTrigger>
                        <PopoverContent
                          className="w-auto overflow-hidden p-0"
                          align="start"
                        >
                          <Calendar
                            mode="range"
                            selected={{
                              from: field.value,
                              to: form.getValues('endDate'),
                            }}
                            onSelect={(range) => {
                              field.onChange(range?.from);

                              form.setValue('endDate', range?.to as Date, {
                                shouldValidate: true,
                                shouldDirty: true,
                              });

                              if (range?.from) {
                                const fromDate = new Date(range.from);
                                const selectedYear = fromDate.getFullYear();
                                form.setValue('year', selectedYear, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
                              }
                            }}
                          />
                        </PopoverContent>
                      </Popover>
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Rate Field */}
              <FormRelationSelect
                name="rateId"
                label="Rate"
                options={rateOptions}
              />
              {/* Rate Field */}
              <FormRelationSelect
                name="clubId"
                label="Club"
                options={clubOptions}
              />
              {/* Total Games Field */}
              <FormField
                control={form.control}
                name="totalGames"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total Games</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        required
                        placeholder="Enter a total games"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Duration A Field */}
              <FormField
                control={form.control}
                name="durationA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Duration (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        required
                        placeholder="Duration of games"
                        min={0}
                        max={90}
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              {/* Count A Field */}
              <FormField
                control={form.control}
                name="countA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Games with main duration</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        required
                        min={1}
                        max={isNaN(remainGamesA) ? 0 : remainGamesA}
                        placeholder="Number of games with main duration"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Card>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <p className="text-muted-foreground text-sm">
                    Fill this fields if you have multiple games with different
                    durations.
                    <br />
                    <span>
                      Example: 10 games in total - 4 with duration of 20 min and
                      6 games with duration of 30 min.
                    </span>
                  </p>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {/* Duration B Field */}
                  <FormField
                    control={form.control}
                    name="durationB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Duration (min) B</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            required
                            min={0}
                            max={90}
                            placeholder="Duration of games"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Count B Field */}
                  <FormField
                    control={form.control}
                    name="countB"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Games with B duration</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            required
                            max={isNaN(remainGamesB) ? 0 : remainGamesB}
                            placeholder="Number of games with B duration"
                            {...field}
                            value={field.value ?? ''}
                          />
                        </FormControl>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                  {/* Duration C Field */}
                  {/* Count C Field */}
                  {countB !== undefined && remainGamesC > 0 && (
                    <>
                      <FormField
                        control={form.control}
                        name="durationC"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Duration (min) C</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                required
                                min={0}
                                max={90}
                                placeholder="Duration of games"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                      <FormField
                        control={form.control}
                        name="countC"
                        render={({ field }) => (
                          <FormItem>
                            <FormLabel>Games with C duration</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                required
                                min={0}
                                max={isNaN(remainGamesC) ? 0 : remainGamesC}
                                placeholder="Number of games with C duration"
                                {...field}
                                value={field.value ?? ''}
                              />
                            </FormControl>
                            <FormMessage />
                          </FormItem>
                        )}
                      />
                    </>
                  )}
                </div>
              </CardContent>
            </Card>

            <div className="flex gap-2">
              <Button
                type="submit"
                {...form.saveButtonProps}
                disabled={formLoading}
              >
                {formLoading ? 'Updating...' : 'Update'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancel
              </Button>
            </div>
            {form.formState.errors.root && (
              <div className="p-3 mb-4 text-sm text-red-500 bg-red-50 rounded-md">
                {form.formState.errors.root.message}
              </div>
            )}

            {/* Or if the error is on a specific path but you want to highlight it specifically */}
            {form.formState.errors.countA && (
              <p className="text-red-500">
                {form.formState.errors.countA.message}
              </p>
            )}
          </form>
        </Form>
      </LoadingOverlay>
    </EditView>
  );
}
