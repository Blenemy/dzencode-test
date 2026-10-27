'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm, useWatch } from 'react-hook-form';
import {
  CommonErrorCode,
  createProductSchema,
  InventoryErrorCode,
  type Currency,
  type ProductDto,
  type ProductStatus,
} from '@dzen/shared';
import { AppDialog, DialogActions } from '@/components/dialog/AppDialog';
import { controlProps, Field } from '@/components/form/Field';
import { FormField } from '@/components/form/FormField';
import { SegmentedField } from '@/components/form/SegmentedField';
import { applyServerErrors } from '@/features/auth/apply-server-errors';
import {
  useGroupsQuery,
  useProductTypesQuery,
  useSpecificationsQuery,
  useUsersQuery,
} from '@/features/catalog/catalog.api';
import { useProductTypeName } from '@/features/catalog/use-type-name';
import { PhotoUpload } from '@/features/uploads/PhotoUpload';
import { useOrdersQuery } from '@/features/orders/orders.api';
import { errorCode } from '@/lib/api-error';
import { toDateInputValue } from '@/lib/format-date';
import { useErrorMessage } from '@/lib/use-messages';
import { useCreateProductMutation } from './products.api';

interface CreateProductDialogProps {
  show: boolean;
  onHide: () => void;
  onExited: () => void;
  onCreated: (product: ProductDto) => void;
  order?: { id: number; title: string };
}

const FIELD_ERROR_CODES: string[] = [
  CommonErrorCode.ValidationFailed,
  InventoryErrorCode.SerialTaken,
];

function initialDates() {
  const today = new Date();
  const inYear = new Date(today);
  inYear.setFullYear(today.getFullYear() + 1);
  return { start: toDateInputValue(today), end: toDateInputValue(inYear) };
}

export function CreateProductDialog({
  show,
  onHide,
  onExited,
  onCreated,
  order,
}: CreateProductDialogProps) {
  const t = useTranslations('productForm');
  const tProducts = useTranslations('products');
  const errorMessage = useErrorMessage();
  const typeName = useProductTypeName();
  const [dates] = useState(initialDates);
  const [uploading, setUploading] = useState(false);
  const [createProduct, { isLoading, error }] = useCreateProductMutation();

  const form = useForm({
    resolver: zodResolver(createProductSchema),
    defaultValues: {
      title: '',
      serialNumber: '',
      typeId: '',
      specification: '',
      isNew: true,
      status: 'FREE' as ProductStatus,
      guaranteeStart: dates.start,
      guaranteeEnd: dates.end,
      priceUsd: '',
      priceUah: '',
      defaultCurrency: 'UAH' as Currency,
      orderId: order ? String(order.id) : '',
      groupId: '',
      userId: '',
      photo: '',
    },
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isLoading || isSubmitting;

  const typeId = Number(useWatch({ control: form.control, name: 'typeId' })) || null;
  const { data: types } = useProductTypesQuery();
  const { data: specifications } = useSpecificationsQuery(typeId, { skip: !typeId });
  const { data: groups } = useGroupsQuery();
  const { data: users } = useUsersQuery();
  const { data: orders } = useOrdersQuery(undefined, { skip: Boolean(order) });
  const specListId = `specifications-${typeId ?? 'all'}`;

  const submit = form.handleSubmit(async (values) => {
    const result = await createProduct(values);
    if (result.data) {
      onCreated(result.data);
      return;
    }
    if (errorCode(result.error) === InventoryErrorCode.SerialTaken) {
      form.setError('serialNumber', { type: 'server', message: 'validation.serialTaken' });
      return;
    }
    applyServerErrors(result.error, form.setError);
  });

  const generalError = error && !FIELD_ERROR_CODES.includes(errorCode(error));

  return (
    <AppDialog
      show={show}
      onHide={onHide}
      onExited={onExited}
      title={t('title')}
      subtitle={order ? t('subtitle', { order: order.title }) : undefined}
      closeLabel={t('close')}
      busy={busy}
      wide
    >
      <form onSubmit={submit} noValidate>
        <div className="app-dialog__body">
          {generalError && (
            <div className="alert alert-danger" role="alert">
              {errorMessage(error)}
            </div>
          )}

          <div className="form-grid">
            <Controller
              control={form.control}
              name="photo"
              render={({ field, fieldState }) => (
                <div className="form-grid__wide">
                  <PhotoUpload
                    label={t('photo')}
                    value={typeof field.value === 'string' && field.value ? field.value : undefined}
                    error={fieldState.error?.message}
                    onChange={(url) => field.onChange(url ?? '')}
                    onUploadingChange={setUploading}
                  />
                </div>
              )}
            />

            <FormField
              className="form-grid__wide"
              label={t('name')}
              registration={form.register('title')}
              error={errors.title}
              autoFocus
            />
            <FormField
              className=""
              label={t('serial')}
              registration={form.register('serialNumber')}
              error={errors.serialNumber}
              autoComplete="off"
            />
            <Field label={t('type')} error={errors.typeId}>
              {(control) => (
                <select {...controlProps(control, 'form-select')} {...form.register('typeId')}>
                  <option value="">{t('chooseType')}</option>
                  {types?.map((type) => (
                    <option key={type.id} value={type.id}>
                      {typeName(type.name)}
                    </option>
                  ))}
                </select>
              )}
            </Field>

            <Field label={t('specification')} error={errors.specification}>
              {(control) => (
                <>
                  <input
                    {...controlProps(control)}
                    list={specListId}
                    autoComplete="off"
                    {...form.register('specification')}
                  />
                  <datalist id={specListId}>
                    {specifications?.map((specification) => (
                      <option key={specification} value={specification} />
                    ))}
                  </datalist>
                </>
              )}
            </Field>
            <Controller
              control={form.control}
              name="isNew"
              render={({ field }) => (
                <SegmentedField
                  label={t('condition')}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: true, label: t('isNew') },
                    { value: false, label: t('used') },
                  ]}
                />
              )}
            />

            <Controller
              control={form.control}
              name="status"
              render={({ field }) => (
                <SegmentedField
                  label={t('status')}
                  value={field.value}
                  onChange={field.onChange}
                  options={[
                    { value: 'FREE', label: tProducts('status.FREE') },
                    { value: 'IN_REPAIR', label: tProducts('status.IN_REPAIR') },
                  ]}
                />
              )}
            />
            <Controller
              control={form.control}
              name="defaultCurrency"
              render={({ field }) => (
                <SegmentedField
                  label={t('defaultCurrency')}
                  value={field.value ?? 'UAH'}
                  onChange={field.onChange}
                  options={[
                    { value: 'UAH', label: 'UAH' },
                    { value: 'USD', label: 'USD' },
                  ]}
                />
              )}
            />

            <FormField
              className=""
              label={t('priceUsd')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              registration={form.register('priceUsd')}
              error={errors.priceUsd}
            />
            <FormField
              className=""
              label={t('priceUah')}
              type="number"
              inputMode="decimal"
              step="0.01"
              min="0"
              registration={form.register('priceUah')}
              error={errors.priceUah}
            />

            <FormField
              className=""
              label={t('guaranteeStart')}
              type="date"
              registration={form.register('guaranteeStart')}
              error={errors.guaranteeStart}
            />
            <FormField
              className=""
              label={t('guaranteeEnd')}
              type="date"
              registration={form.register('guaranteeEnd')}
              error={errors.guaranteeEnd}
            />

            {!order && (
              <Field className="form-grid__wide" label={t('order')} error={errors.orderId}>
                {(control) => (
                  <select {...controlProps(control, 'form-select')} {...form.register('orderId')}>
                    <option value="">{t('chooseOrder')}</option>
                    {orders?.items.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.title}
                      </option>
                    ))}
                  </select>
                )}
              </Field>
            )}

            <Field label={t('group')} error={errors.groupId}>
              {(control) => (
                <select {...controlProps(control, 'form-select')} {...form.register('groupId')}>
                  <option value="">{t('noGroup')}</option>
                  {groups?.map((group) => (
                    <option key={group.id} value={group.id}>
                      {group.title}
                    </option>
                  ))}
                </select>
              )}
            </Field>
            <Field label={t('user')} error={errors.userId}>
              {(control) => (
                <select {...controlProps(control, 'form-select')} {...form.register('userId')}>
                  <option value="">{t('noUser')}</option>
                  {users?.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name}
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
          busy={busy || uploading}
        />
      </form>
    </AppDialog>
  );
}
