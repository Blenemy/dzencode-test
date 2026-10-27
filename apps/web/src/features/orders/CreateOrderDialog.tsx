'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { CommonErrorCode, createOrderSchema, type OrderSummaryDto } from '@dzen/shared';
import { AppDialog, DialogActions } from '@/components/dialog/AppDialog';
import { controlProps, Field } from '@/components/form/Field';
import { FormField } from '@/components/form/FormField';
import { useWarehousesQuery } from '@/features/catalog/catalog.api';
import { applyServerErrors } from '@/features/auth/apply-server-errors';
import { errorCode } from '@/lib/api-error';
import { toDateInputValue } from '@/lib/format-date';
import { useErrorMessage } from '@/lib/use-messages';
import { useCreateOrderMutation } from './orders.api';

interface CreateOrderDialogProps {
  show: boolean;
  onHide: () => void;
  onExited: () => void;
  onCreated: (order: OrderSummaryDto) => void;
}

export function CreateOrderDialog({ show, onHide, onExited, onCreated }: CreateOrderDialogProps) {
  const t = useTranslations('orderForm');
  const errorMessage = useErrorMessage();
  const { data: warehouses } = useWarehousesQuery();
  const [createOrder, { isLoading, error }] = useCreateOrderMutation();
  const [today] = useState(() => toDateInputValue(new Date()));

  const form = useForm({
    resolver: zodResolver(createOrderSchema),
    defaultValues: { title: '', description: '', date: today, warehouseId: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isLoading || isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    const result = await createOrder(values);
    if (result.data) {
      onCreated(result.data);
      return;
    }
    applyServerErrors(result.error, form.setError);
  });

  return (
    <AppDialog
      show={show}
      onHide={onHide}
      onExited={onExited}
      title={t('title')}
      closeLabel={t('close')}
      busy={busy}
    >
      <form onSubmit={submit} noValidate>
        <div className="app-dialog__body">
          {error && errorCode(error) !== CommonErrorCode.ValidationFailed && (
            <div className="alert alert-danger" role="alert">
              {errorMessage(error)}
            </div>
          )}

          <div className="form-grid">
            <FormField
              className="form-grid__wide"
              label={t('name')}
              registration={form.register('title')}
              error={errors.title}
              autoFocus
            />
            <Field className="form-grid__wide" label={t('description')} error={errors.description}>
              {(control) => (
                <textarea {...controlProps(control)} rows={3} {...form.register('description')} />
              )}
            </Field>
            <FormField
              className=""
              label={t('date')}
              type="date"
              registration={form.register('date')}
              error={errors.date}
            />
            <Field label={t('warehouse')} error={errors.warehouseId}>
              {(control) => (
                <select {...controlProps(control, 'form-select')} {...form.register('warehouseId')}>
                  <option value="">{t('noWarehouse')}</option>
                  {warehouses?.map((warehouse) => (
                    <option key={warehouse.id} value={warehouse.id}>
                      {warehouse.name} · {warehouse.city}
                    </option>
                  ))}
                </select>
              )}
            </Field>
          </div>
        </div>

        <DialogActions
          cancelLabel={t('cancel')}
          confirmLabel={t('submit')}
          icon="plus"
          onCancel={onHide}
          busy={busy}
        />
      </form>
    </AppDialog>
  );
}
