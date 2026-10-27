'use client';

import { useState } from 'react';
import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { Controller, useForm } from 'react-hook-form';
import { CommonErrorCode, updateProfileSchema, type AuthUser } from '@dzen/shared';
import { FormField } from '@/components/form/FormField';
import { Icon } from '@/components/icons/Icon';
import { useUpdateProfileMutation } from '@/features/auth/auth.api';
import { applyServerErrors } from '@/features/auth/apply-server-errors';
import { PhotoUpload } from '@/features/uploads/PhotoUpload';
import { errorCode } from '@/lib/api-error';
import { useErrorMessage } from '@/lib/use-messages';

export function ProfileForm({ user }: { user: AuthUser }) {
  const t = useTranslations('settings');
  const errorMessage = useErrorMessage();
  const [updateProfile, { isLoading, error }] = useUpdateProfileMutation();
  const [uploading, setUploading] = useState(false);
  const [saved, setSaved] = useState(false);

  const form = useForm({
    resolver: zodResolver(updateProfileSchema),
    defaultValues: { name: user.name, avatar: user.avatar },
  });
  const { errors, isDirty, isSubmitting } = form.formState;
  const busy = isLoading || isSubmitting || uploading;

  const submit = form.handleSubmit(async (values) => {
    setSaved(false);
    const result = await updateProfile(values);
    if (result.data) {
      form.reset({ name: result.data.user.name, avatar: result.data.user.avatar });
      setSaved(true);
      return;
    }
    applyServerErrors(result.error, form.setError);
  });

  return (
    <form className="profile-form" onSubmit={submit} onChange={() => setSaved(false)} noValidate>
      {error && errorCode(error) !== CommonErrorCode.ValidationFailed && (
        <div className="alert alert-danger" role="alert">
          {errorMessage(error)}
        </div>
      )}

      <Controller
        control={form.control}
        name="avatar"
        render={({ field, fieldState }) => (
          <PhotoUpload
            label={t('avatar')}
            round
            value={field.value ?? undefined}
            error={fieldState.error?.message}
            onChange={(url) => {
              setSaved(false);
              field.onChange(url ?? null);
            }}
            onUploadingChange={setUploading}
          />
        )}
      />

      <div className="form-grid profile-form__fields">
        <FormField
          className=""
          label={t('name')}
          registration={form.register('name')}
          error={errors.name}
          autoComplete="name"
        />
        <div>
          <span className="form-label text-uppercase d-block">{t('role')}</span>
          <span className="profile-form__role">{t(`roles.${user.role}`)}</span>
        </div>
        <div className="form-grid__wide">
          <span className="form-label text-uppercase d-block">{t('email')}</span>
          <span className="profile-form__email">{user.email}</span>
        </div>
      </div>

      <div className="profile-form__actions">
        <button type="submit" className="btn btn-primary" disabled={busy || !isDirty}>
          {isLoading && (
            <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />
          )}
          {t('save')}
        </button>
        <span className="profile-form__saved" role="status">
          {saved && (
            <>
              <Icon name="check" size={14} /> {t('saved')}
            </>
          )}
        </span>
      </div>
    </form>
  );
}
