'use client';

import {
  EditView,
  EditViewHeader,
} from '@/components/refine-ui/views/edit-view';
import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
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
import { zodResolver } from '@hookform/resolvers/zod';
import { insertMember } from '@lib/validators';
import type { BaseRecord, HttpError } from '@refinedev/core';
import { useForm } from '@refinedev/react-hook-form';
import { useParams, useRouter } from 'next/navigation';
import type { z } from 'zod';

const maxMemberSince = new Date().getFullYear() + 1;

type MemberFormValues = z.infer<typeof insertMember>;

export default function MemberEditPage() {
  const router = useRouter();
  const { id } = useParams();

  const {
    refineCore: { onFinish, formLoading },
    ...form
  } = useForm<BaseRecord, HttpError, MemberFormValues>({
    resolver: zodResolver(insertMember),
    refineCoreProps: {
      resource: 'members',
      action: 'edit',
      id: id as string,
    },
  });

  function onSubmit(data: MemberFormValues) {
    onFinish(data);
  }

  return (
    <EditView>
      <LoadingOverlay loading={formLoading}>
        <EditViewHeader title="Editar sócio" />
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-8">
            <FormField
              control={form.control}
              name="number"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nº de sócio</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1}
                      step={1}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ''
                            ? undefined
                            : Number(event.target.value),
                        )
                      }
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="name"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Nome</FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value ?? ''} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="memberSince"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Sócio desde</FormLabel>
                  <FormControl>
                    <Input
                      type="number"
                      min={1950}
                      max={maxMemberSince}
                      step={1}
                      value={field.value ?? ''}
                      onChange={(event) =>
                        field.onChange(
                          event.target.value === ''
                            ? null
                            : Number(event.target.value),
                        )
                      }
                      placeholder={`1950-${maxMemberSince}`}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="active"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center gap-2">
                  <FormControl>
                    <Checkbox
                      checked={field.value}
                      onCheckedChange={(checked) =>
                        field.onChange(checked === true)
                      }
                    />
                  </FormControl>
                  <FormLabel>Ativo</FormLabel>
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
      </LoadingOverlay>
    </EditView>
  );
}
