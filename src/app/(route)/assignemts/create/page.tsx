'use client';

import { useEffect } from 'react';
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
import { zodResolver } from '@hookform/resolvers/zod';
import {
  hasAssistentReferee,
  hasDurationB,
  hasDurationC,
} from '@lib/services/tournaments/tournament.utils';
import type { RefereeAssignment, Tournament } from '@lib/types';
import { insertRefereeAssignment } from '@lib/validators';
import {
  useOne,
  useParsed,
  useSelect,
  type BaseRecord,
  type HttpError,
} from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { useRouter } from 'next/navigation';
import { Separator } from '@components/ui/separator';

export default function AssigmentCreatePage() {
  const router = useRouter();
  const { params } = useParsed();
  const tournamentId = params?.tournamentId as string;

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<BaseRecord, HttpError, RefereeAssignment>({
    resolver: zodResolver(insertRefereeAssignment),
    refineCoreProps: {
      action: 'create',
      redirect: false,
      onMutationSuccess: () => {
        router.back() ?? router.push(`/tournaments/show/${tournamentId}`);
      },
    },
    defaultValues: {
      tournamentId: tournamentId || '',
    },
  });

  useEffect(() => {
    if (tournamentId) {
      form.setValue('tournamentId', tournamentId);
    }
  }, [tournamentId, form]);

  function onSubmit(data: RefereeAssignment) {
    onFinish(data);
  }

  // Get the Tournament
  const {
    result: tournament,
    query: { isLoading: isTournamentLoading },
  } = useOne<Tournament>({
    resource: 'tournaments',
    id: tournamentId,
  });

  if (!isTournamentLoading && !tournament) {
    router.push('/404');
  }

  // Validations
  // Check the Tournament durations
  const durationB = hasDurationB(tournament as Tournament);
  const durationC = hasDurationC(tournament as Tournament);
  // Check if the Tournament has Assistent Referee
  const isElevenPlayers = hasAssistentReferee(tournament as Tournament);

  // Fecth referees
  const { options: refereeOptions } = useSelect({
    resource: 'referees',
    optionLabel: 'name',
    optionValue: 'id',
  });

  return (
    <LoadingOverlay loading={formLoading || isTournamentLoading}>
      <CreateView>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Referee Name Field */}
              <FormRelationSelect
                name="refereeId"
                label="Referee"
                options={refereeOptions}
              />

              {/* Tournament Field */}
              <FormField
                control={form.control}
                name="tournamentId"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Tournament</FormLabel>
                    <FormControl>
                      <Input
                        type="text"
                        readOnly
                        disabled
                        className="bg-muted"
                        value={tournament?.name ?? ''}
                      />
                    </FormControl>
                    <input
                      type="hidden"
                      {...field}
                      value={field.value || ''}
                    />
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>
            <Separator className="md:my-4 my-8" />
            <h3 className="text-md">Games as Referee</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Count A Field */}
              <FormField
                control={form.control}
                name="countA"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Main duration</FormLabel>
                    <FormControl>
                      <Input
                        type="number"
                        required
                        min={1}
                        placeholder="Number of games with main duration"
                        {...field}
                        value={field.value ?? ''}
                      />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Count B Field */}
              {durationB && (
                <FormField
                  control={form.control}
                  name="countB"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>B Duration</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          required
                          min={1}
                          placeholder="Number of games with B duration"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}

              {/* Count C Field */}
              {durationC && (
                <FormField
                  control={form.control}
                  name="countC"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>C Duration</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          required
                          min={1}
                          placeholder="Number of games with C duration"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
            </div>
            {isElevenPlayers && (
              <>
                <Separator className="md:my-4 my-8" />
                <h3 className="text-md text-bold">
                  Games as Assistant Referee
                </h3>
              </>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {/* Assistent Referee Count A Field */}
              {isElevenPlayers && (
                <FormField
                  control={form.control}
                  name="countARef"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistent Referee main duration</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          required
                          min={1}
                          placeholder="Number of games has Assistent Referee"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {/* Assistent Referee Count B Field */}
              {isElevenPlayers && durationB && (
                <FormField
                  control={form.control}
                  name="countBRef"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistent Referee B duration</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          required
                          min={1}
                          placeholder="Number of games has Assistent Referee B duration"
                          {...field}
                          value={field.value ?? ''}
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              )}
              {/* Assistent Referee Count C Field */}
              {isElevenPlayers && durationC && (
                <FormField
                  control={form.control}
                  name="countCRef"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Assistent Referee C duration</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          required
                          min={1}
                          placeholder="Number of games has Assistent Referee C duration"
                          {...field}
                          value={field.value ?? ''}
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
