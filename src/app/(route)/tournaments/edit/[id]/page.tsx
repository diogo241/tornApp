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
      year: 0,
      startDate: undefined,
      endDate: undefined,
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
      redirect: false,
      onMutationSuccess: () => {
        router.back() ?? router.push(`/tournaments/show/${id}`);
      },
      id: id as string,
    },
  });

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

  const isLoading = formLoading || query?.isPending;

  // Fecth rates
  const { options: rateOptions } = useSelect({
    resource: 'rates',
    optionLabel: 'name',
    optionValue: 'id',
    debounce: 500,
    pagination: {
      pageSize: 100,
    },
  });

  // Fecth clubs
  const { options: clubOptions } = useSelect({
    resource: 'clubs',
    optionLabel: 'name',
    optionValue: 'id',
    debounce: 500,
    pagination: {
      pageSize: 100,
    },
  });

  if (query?.isError || query?.isLoading) return null;

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
                    <FormLabel>Nome</FormLabel>
                    <FormControl>
                      <Input {...field} placeholder="Introduza um nome" />
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
                    <FormLabel>Data</FormLabel>
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
                                  formatDateTime(form.getValues('endDate') ?? tournament?.endDate)
                                    .dateOnly
                                }`
                              : 'Selecione uma data'}
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
                                form.setValue('startDate', range.from, {
                                  shouldValidate: true,
                                  shouldDirty: true,
                                });
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
                label="Escalão"
                options={rateOptions}
              />
              {/* Rate Field */}
              <FormRelationSelect
                name="clubId"
                label="Clube"
                options={clubOptions}
              />
              {/* Total Games Field */}
              <FormField
                control={form.control}
                name="totalGames"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Total de jogos</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        required
                        placeholder="Introduza um total de jogos"
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
                    <FormLabel>Duração (min)</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        required
                        placeholder="Duração dos jogos"
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
                    <FormLabel>Jogos com duração principal</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        required
                        min={1}
                        max={isNaN(remainGamesA) ? 0 : remainGamesA}
                        placeholder="Nº de jogos com duração principal"
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
                    Preencha estes campos se tiver vários jogos com durações
                    diferentes.
                    <br />
                    <span>
                      Exemplo: 10 jogos no total - 4 com duração de 20 min e 6
                      jogos com duração de 30 min.
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
                        <FormLabel>Duração (min) B</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            required
                            min={0}
                            max={90}
                            placeholder="Duração dos jogos"
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
                        <FormLabel>Jogos com duração B</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            required
                            max={isNaN(remainGamesB) ? 0 : remainGamesB}
                            placeholder="Nº de jogos com duração B"
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
                            <FormLabel>Duração (min) C</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                required
                                min={0}
                                max={90}
                                placeholder="Duração dos jogos"
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
                            <FormLabel>Jogos com duração C</FormLabel>
                            <FormControl>
                              <Input
                                type="number"
                                required
                                min={0}
                                max={isNaN(remainGamesC) ? 0 : remainGamesC}
                                placeholder="Nº de jogos com duração C"
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
                {formLoading ? 'A guardar...' : 'Guardar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back() ?? router.push(`/tournaments/show/${id}`)}
              >
                Cancelar
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
