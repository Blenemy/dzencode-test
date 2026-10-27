import type { FetchBaseQueryError } from '@reduxjs/toolkit/query';
import type { SerializedError } from '@reduxjs/toolkit';
import type { ApiErrorBody, ValidationIssue } from '@dzen/shared';

export type QueryError = FetchBaseQueryError | SerializedError | undefined;

function apiBody(error: QueryError): ApiErrorBody['error'] | null {
  if (!error || !('status' in error)) return null;
  const data = error.data as Partial<ApiErrorBody> | undefined;
  return data?.error && typeof data.error.code === 'string' ? data.error : null;
}

export function errorCode(error: QueryError): string {
  if (!error) return 'UNKNOWN';
  if ('status' in error && error.status === 'FETCH_ERROR') return 'NETWORK';
  return apiBody(error)?.code ?? 'UNKNOWN';
}

export function errorStatus(error: QueryError): number | null {
  return error && 'status' in error && typeof error.status === 'number' ? error.status : null;
}

export function validationIssues(error: QueryError): ValidationIssue[] {
  const details = apiBody(error)?.details as { issues?: ValidationIssue[] } | undefined;
  return Array.isArray(details?.issues) ? details.issues : [];
}
