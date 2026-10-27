import type { z } from 'zod';
import { CommonErrorCode, type ValidationIssue } from '@dzen/shared';
import { AppError } from '../middleware/error.js';

export function parseOrThrow<TSchema extends z.ZodType>(
  schema: TSchema,
  data: unknown,
  message = 'Request validation failed',
): z.infer<TSchema> {
  const parsed = schema.safeParse(data);

  if (!parsed.success) {
    const issues: ValidationIssue[] = parsed.error.issues.map((issue) => ({
      field: issue.path.join('.'),
      message: issue.message,
    }));
    throw new AppError(400, CommonErrorCode.ValidationFailed, message, { issues });
  }

  return parsed.data;
}
