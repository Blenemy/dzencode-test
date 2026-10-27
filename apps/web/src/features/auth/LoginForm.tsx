'use client';

import { zodResolver } from '@hookform/resolvers/zod';
import { useTranslations } from 'next-intl';
import { useForm } from 'react-hook-form';
import { loginSchema } from '@dzen/shared';
import { FormField } from '@/components/form/FormField';
import { Link, useRouter } from '@/i18n/navigation';
import { useErrorMessage } from '@/lib/use-messages';
import { applyServerErrors } from './apply-server-errors';
import { useLoginMutation } from './auth.api';
import { AuthCard } from './AuthCard';

interface LoginFormProps {
  next: string;
  demo: { email: string; password: string };
}

export function LoginForm({ next, demo }: LoginFormProps) {
  const t = useTranslations('auth');
  const router = useRouter();
  const errorMessage = useErrorMessage();
  const [login, { isLoading, error, reset }] = useLoginMutation();

  const form = useForm({
    resolver: zodResolver(loginSchema),
    defaultValues: { email: '', password: '' },
  });
  const { errors, isSubmitting } = form.formState;
  const busy = isLoading || isSubmitting;

  const submit = form.handleSubmit(async (values) => {
    reset();
    const result = await login(values);
    if ('data' in result) {
      router.replace(next);
      return;
    }
    applyServerErrors(result.error, form.setError);
  });

  const signInAsDemo = () => {
    form.setValue('email', demo.email);
    form.setValue('password', demo.password);
    void submit();
  };

  return (
    <AuthCard
      title={t('loginTitle')}
      subtitle={t('subtitle')}
      footer={
        <>
          {t('noAccount')}
          <Link href={{ pathname: '/register', query: next === '/orders' ? {} : { next } }}>
            {t('toRegister')}
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
          label={t('email')}
          type="email"
          autoComplete="email"
          registration={form.register('email')}
          error={errors.email}
        />
        <FormField
          label={t('password')}
          type="password"
          autoComplete="current-password"
          registration={form.register('password')}
          error={errors.password}
        />
        <button className="btn btn-primary auth-card__submit" type="submit" disabled={busy}>
          {busy && <span className="spinner-border spinner-border-sm me-2" aria-hidden="true" />}
          {t('submitLogin')}
        </button>
      </form>

      <div className="auth-card__divider">{t('or')}</div>

      <button
        className="btn btn-outline-secondary auth-card__demo"
        type="button"
        onClick={signInAsDemo}
        disabled={busy}
      >
        {t('demo')}
      </button>
      <p className="auth-card__hint">{t('demoHint', demo)}</p>
    </AuthCard>
  );
}
