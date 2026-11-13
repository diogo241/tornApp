'use client';

import { Button } from '@/components/ui/button';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { API_MESSAGES } from '@lib/api-errors';
import type { FeePayment } from '@lib/types';
import { formatCurrency } from '@lib/utils';
import { updateFeePayment } from '@lib/validators';
import { zodResolver } from '@hookform/resolvers/zod';
import {
  useCreate,
  useDelete,
  useInvalidate,
  useUpdate,
  type HttpError,
} from '@refinedev/core';
import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { toast } from 'sonner';
import type { z } from 'zod';

type PaymentFormValues = z.infer<typeof updateFeePayment>;

export type FeePaymentOption = {
  id: string;
  year: number;
  amount: number;
};

type MemberSummary = { id: string; number: number; name: string };

type FeePaymentDialogProps = {
  member: MemberSummary;
  fees: FeePaymentOption[];
  initialFeeId?: string;
  payments?: FeePayment[];
  onClose: () => void;
};

const firstUnpaidFee = (
  fees: FeePaymentOption[],
  payments: FeePayment[],
): FeePaymentOption | undefined => {
  const paidFeeIds = new Set(payments.map((payment) => payment.feeId));

  return fees.find((fee) => !paidFeeIds.has(fee.id));
};

type PaymentFormProps = {
  member: MemberSummary;
  fee: FeePaymentOption;
  fees: FeePaymentOption[];
  payments: FeePayment[];
  payment?: FeePayment;
  onSelectFee: (feeId: string) => void;
  onClose: () => void;
};

const todayAsDateInput = () => {
  const now = new Date();
  const localTime = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return localTime.toISOString().slice(0, 10);
};

const errorMessage = (error: HttpError | null, fallback: string) => {
  const message = error?.message;

  return message && message !== API_MESSAGES.validationFailed
    ? message
    : fallback;
};

function PaymentForm({
  member,
  fee,
  fees,
  payments,
  payment,
  onSelectFee,
  onClose,
}: PaymentFormProps) {
  const invalidate = useInvalidate();
  const [confirmingRemove, setConfirmingRemove] = useState(false);

  const { mutate: createPayment, mutation: createMutation } = useCreate<
    FeePayment,
    HttpError,
    PaymentFormValues & { memberId: string; feeId: string }
  >();
  const { mutate: updatePayment, mutation: updateMutation } = useUpdate<
    FeePayment,
    HttpError,
    PaymentFormValues
  >();
  const { mutate: removePayment, mutation: removeMutation } =
    useDelete<FeePayment, HttpError>();

  const form = useForm<PaymentFormValues>({
    resolver: zodResolver(updateFeePayment),
    defaultValues: {
      paidAt: payment?.paidAt?.slice(0, 10) ?? todayAsDateInput(),
      method: payment && payment.method !== 'cash' ? 'other' : 'cash',
      methodDetail: payment?.methodDetail ?? null,
      halfFee: payment?.halfFee ?? false,
    },
  });

  const paidFeeIds = new Set(payments.map((item) => item.feeId));
  const selectableFees = fees.filter(
    (option) => !paidFeeIds.has(option.id) || option.id === payment?.feeId,
  );

  const method = form.watch('method');
  const isSaving = createMutation.isPending || updateMutation.isPending;
  const isRemoving = removeMutation.isPending;

  const afterChange = async (message: string) => {
    await invalidate({
      resource: 'members',
      invalidates: ['list', 'detail'],
      id: member.id,
    });
    toast.success(message);
    onClose();
  };

  const onError = (error: HttpError | null) => {
    toast.error(
      errorMessage(
        error,
        'Não foi possível guardar o pagamento. Tente novamente.',
      ),
    );
  };

  const onValid = (values: PaymentFormValues) => {
    if (confirmingRemove) {
      return;
    }

    if (payment) {
      updatePayment(
        { resource: 'fee-payments', id: payment.id, values },
        {
          onSuccess: () => afterChange('Pagamento atualizado'),
          onError,
        },
      );
      return;
    }

    createPayment(
      {
        resource: 'fee-payments',
        values: { memberId: member.id, feeId: fee.id, ...values },
      },
      {
        onSuccess: () => afterChange('Pagamento registado'),
        onError,
      },
    );
  };

  const onRemove = () => {
    if (!payment) {
      return;
    }

    removePayment(
      { resource: 'fee-payments', id: payment.id },
      {
        onSuccess: () => afterChange('Pagamento removido'),
        onError: (error) =>
          toast.error(
            errorMessage(
              error,
              'Não foi possível remover o pagamento. Tente novamente.',
            ),
          ),
      },
    );
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onValid)} className="space-y-5">
        {selectableFees.length > 1 && (
          <div className="space-y-2">
            {/* MESQUITA - #19f: terminologia quota */}
            <Label htmlFor="payment-fee">Quota</Label>
            <Select
              value={fee.id}
              onValueChange={onSelectFee}
              disabled={isSaving}
            >
              <SelectTrigger id="payment-fee" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {selectableFees.map((option) => (
                  <SelectItem key={option.id} value={option.id}>
                    {option.year} · {formatCurrency(option.amount)}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="bg-muted flex items-center justify-between rounded-md border px-3 py-2">
          <span className="text-sm font-medium">Valor da quota</span>
          <span className="text-lg font-semibold">
            {formatCurrency(fee.amount)}
          </span>
        </div>

        <FormField
          control={form.control}
          name="paidAt"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Data do pagamento</FormLabel>
              <FormControl>
                <Input
                  type="date"
                  max={todayAsDateInput()}
                  value={field.value}
                  onChange={(event) => field.onChange(event.target.value)}
                  disabled={isSaving}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="method"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Tipologia</FormLabel>
              <FormControl>
                <RadioGroup
                  value={field.value}
                  onValueChange={field.onChange}
                  className="grid grid-cols-2 gap-3"
                  disabled={isSaving}
                >
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="cash" id="payment-method-cash" />
                    <Label htmlFor="payment-method-cash">Numerário</Label>
                  </div>
                  <div className="flex items-center gap-2">
                    <RadioGroupItem value="other" id="payment-method-other" />
                    <Label htmlFor="payment-method-other">Outros</Label>
                  </div>
                </RadioGroup>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {method === 'other' && (
          <FormField
            control={form.control}
            name="methodDetail"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Descrição (só Outros)</FormLabel>
                <FormControl>
                  <Textarea
                    value={field.value ?? ''}
                    onChange={(event) => field.onChange(event.target.value)}
                    placeholder="Ex.: transferência bancária"
                    maxLength={250}
                    disabled={isSaving}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        )}

        <FormField
          control={form.control}
          name="halfFee"
          render={({ field }) => (
            <FormItem className="bg-muted/40 flex flex-row items-start gap-3 rounded-md border p-3">
              <FormControl>
                <Checkbox
                  checked={field.value}
                  onCheckedChange={(checked) => field.onChange(checked === true)}
                  disabled={isSaving}
                />
              </FormControl>
              <div className="space-y-1">
                <FormLabel>Pagou meia quota (50%)</FormLabel>
                <p className="text-muted-foreground text-xs">
                  {formatCurrency(Number(fee.amount) / 2)} em vez de{' '}
                  {formatCurrency(fee.amount)} — conta como paga.
                </p>
                <FormMessage />
              </div>
            </FormItem>
          )}
        />

        <div className="flex flex-wrap items-center justify-between gap-2">
          {payment ? (
            confirmingRemove ? (
              <div className="flex flex-wrap items-center gap-2">
                <span role="alert" className="text-sm">
                  Remover o pagamento de {fee.year}?
                </span>
                <Button
                  type="button"
                  variant="destructive"
                  size="sm"
                  onClick={onRemove}
                  disabled={isRemoving}
                >
                  {isRemoving ? 'A remover...' : 'Sim, remover'}
                </Button>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={() => setConfirmingRemove(false)}
                  disabled={isRemoving}
                >
                  Voltar
                </Button>
              </div>
            ) : (
              <Button
                type="button"
                variant="outline"
                className="text-destructive"
                onClick={() => setConfirmingRemove(true)}
                disabled={isSaving}
              >
                Remover pagamento
              </Button>
            )
          ) : (
            <span />
          )}

          {!confirmingRemove && (
            <div className="flex items-center gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={onClose}
                disabled={isSaving}
              >
                Cancelar
              </Button>
              <Button type="submit" disabled={isSaving} aria-busy={isSaving}>
                {isSaving ? 'A guardar...' : 'Guardar'}
              </Button>
            </div>
          )}
        </div>
      </form>
    </Form>
  );
}

export function FeePaymentDialog({
  member,
  fees,
  initialFeeId,
  payments = [],
  onClose,
}: FeePaymentDialogProps) {
  const [feeId, setFeeId] = useState(
    () => initialFeeId ?? firstUnpaidFee(fees, payments)?.id ?? '',
  );
  const fee = fees.find((option) => option.id === feeId);

  if (!fee) {
    return null;
  }

  const payment = payments.find((item) => item.feeId === fee.id);

  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) {
          onClose();
        }
      }}
    >
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {payment ? 'Pagamento' : 'Registar pagamento'}
          </DialogTitle>
          <DialogDescription>
            Quota {fee.year} · Nº {member.number} · {member.name}
          </DialogDescription>
        </DialogHeader>

        <PaymentForm
          key={`${member.id}-${fee.id}-${payment?.id ?? 'new'}`}
          member={member}
          fee={fee}
          fees={fees}
          payments={payments}
          payment={payment}
          onSelectFee={setFeeId}
          onClose={onClose}
        />
      </DialogContent>
    </Dialog>
  );
}

export default FeePaymentDialog;
