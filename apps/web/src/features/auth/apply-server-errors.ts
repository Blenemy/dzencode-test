import type { FieldValues, Path, UseFormSetError } from 'react-hook-form';
import { CommonErrorCode } from '@dzen/shared';
import { errorCode, validationIssues, type QueryError } from '@/lib/api-error';

export function applyServerErrors<T extends FieldValues>(
  error: QueryError,
  setError: UseFormSetError<T>,
): boolean {
  if (errorCode(error) !== CommonErrorCode.ValidationFailed) return false;

  const issues = validationIssues(error);
  for (const issue of issues) {
    setError(issue.field as Path<T>, { type: 'server', message: issue.message });
  }
  return issues.length > 0;
}
