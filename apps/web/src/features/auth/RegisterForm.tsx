'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { registerSchema } from '@dzen/shared';
import { FormField } from '@/components/form/FormField';
import { Link, useRouter } from '@/i18n/navigation';
import { useErrorMessage } from '@/lib/use-messages';
import { applyServerErrors } from './apply-server-errors';
import { useRegisterMutation } from './auth.api';
import { AuthCard } from './AuthCard';

export function RegisterForm({ next }: { next: string }) {
  const t = useTranslations('auth');
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const [register, { isLoading, error, reset }] = useRegisterMutation();

  const form = useForm({
    resolver: zodResolver(registerSchema),
    defaultValues: { name: '', email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isLoading || isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    reset();
    const result = await register(values);
    if ('data' in result) {
      router.replace(next);
      return;
    }
    applyServerErrors(result.error, form.setError);
  });

  return (
    <AuthCard
      title={t('registerTitle')}
      subtitle={t('subtitle')}
      footer={
        <>
          {t('haveAccount')}
          <Link href={{ pathname: '/login', query: next === '/orders' ? {} : { next } }}>
            {t('toLogin')}
          </Link>
        </>
      }
    >
      <form onSubmit={submit} noValidate>
        {error && (
          <div className="alert alert-danger auth-card__alert" role="alert">
            {errorMessage(error)}
          </div>
        )}
        <FormField
          className="mb-2"
          reserveMessage
          label={t('name')}
          autoComplete="name"
          registration={form.register('name')}
          error={errors.name}
        />
        <FormField
          className="mb-2"
          reserveMessage
          label={t('email')}
          type="email"
          autoComplete="email"
          registration={form.register('email')}
          error={errors.email}
        />
        <FormField
          className="mb-2"
          reserveMessage
          label={t('password')}
          type="password"
          autoComplete="new-password"
          registration={form.register('password')}
          error={errors.password}
        />
        <button className="btn btn-primary auth-card__submit" type="submit" disabled={busy}>
          {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {t('submitRegister')}
        </button>
      </form>
    </AuthCard>
  );
}
