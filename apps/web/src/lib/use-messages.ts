'use client';

import { useCallback } from 'react';
import { useTranslations } from 'next-intl';
import { EMAIL_MAX, NAME_MAX, PASSWORD_MAX, PASSWORD_MIN } from '@dzen/shared';
import { errorCode, type QueryError } from './api-error';

type DynamicTranslate = (key: string, values?: Record<string, string | number>) => string;

const VALIDATION_PREFIX = 'validation.';
const limits = {
  emailMax: EMAIL_MAX,
  nameMax: NAME_MAX,
  passwordMin: PASSWORD_MIN,
  passwordMax: PASSWORD_MAX,
};

export function useValidationMessage() {
  const t = useTranslations('validation');

  return useCallback(
    (message: string | undefined): string | undefined => {
      if (!message) return undefined;
      const key = message.startsWith(VALIDATION_PREFIX)
        ? message.slice(VALIDATION_PREFIX.length)
        : message;
      if (!t.has(key as never)) return message;
      return (t as unknown as DynamicTranslate)(key, limits);
    },
    [t],
  );
}

export function useErrorMessage() {
  const t = useTranslations('errors');

  return useCallback(
    (error: QueryError): string => {
      const code = errorCode(error);
      return t.has(code as never) ? (t as unknown as DynamicTranslate)(code) : t('UNKNOWN');
    },
    [t],
  );
}
