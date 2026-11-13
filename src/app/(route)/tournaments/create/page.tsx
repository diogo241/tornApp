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
import {
  useParsed,
  useSelect,
  type BaseRecord,
  type HttpError,
} from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { ChevronDownIcon } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function TournamentCreatePage() {
  const router = useRouter();
  const { params } = useParsed();
  const clubId = params?.clubId as string;

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<BaseRecord, HttpError, Tournament>({
    resolver: zodResolver(insertTournament),
    refineCoreProps: {
      action: 'create',
      redirect: false,
      onMutationSuccess: () => {
        router.back() ?? router.push(`/tournaments/list`);
      },
    },
    defaultValues: {
      name: '',
      totalGames: 0,
      countA: 0,
      durationA: 0,
      countB: 0,
      durationB: 0,
      countC: 0,
      durationC: 0,
      clubId: clubId || '',
      rateId: '',
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
                            {field.value && form.getValues('endDate')
                              ? `${formatDateTime(field.value).dateOnly} - ${
                                  formatDateTime(form.getValues('endDate'))
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
                        max={remainGamesA}
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
                            max={remainGamesB}
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
                  {countB !== undefined && countB > 0 && remainGamesC > 0 && (
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
                                max={remainGamesC}
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
                disabled={form.formState.isSubmitting}
              >
                {form.formState.isSubmitting ? 'A criar...' : 'Criar'}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => router.back()}
              >
                Cancelar
              </Button>
            </div>
          </form>
        </Form>
      </CreateView>
    </LoadingOverlay>
  );
}
