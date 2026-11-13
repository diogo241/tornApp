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
      action: 'edit',
      redirect: 'list',
    },
  });

  const playersValue = form.watch('players');

  function onSubmit(data: Rate) {
    onFinish(data);
  }

  return (
    <LoadingOverlay loading={formLoading}>
      <EditView>
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
              {/* Players Field */}
              <FormField
                control={form.control}
                name="players"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Jogadores</FormLabel>
                    <Select
                      onValueChange={field.onChange}
                      required
                      value={field.value ? String(field.value) : undefined}
                    >
                      <SelectTrigger className="dark:bg-input/30 text-muted-foreground border-input flex h-9 w-full min-w-0 rounded-md border bg-transparent px-3 py-1 text-base shadow-xs md:text-sm">
                        <SelectValue placeholder="Selecione o número de jogadores" />
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
                    <FormLabel>Valor do árbitro</FormLabel>
                    <FormControl>
                      <Input
                        {...field}
                        type="number"
                        required
                        placeholder="Introduza um valor"
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
                      <FormLabel>Valor do árbitro assistente</FormLabel>
                      <FormControl>
                        <Input
                          {...field}
                          type="number"
                          placeholder="Introduza um valor"
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
                {form.formState.isSubmitting ? 'A guardar...' : 'Guardar'}
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
      </EditView>
    </LoadingOverlay>
  );
}
