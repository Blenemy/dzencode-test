export interface ValidationIssue {
  field: string;
  message: string;
}

export interface ApiErrorBody {
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export const CommonErrorCode = {
  ValidationFailed: 'VALIDATION_FAILED',
  NotFound: 'NOT_FOUND',
  BadOrigin: 'BAD_ORIGIN',
  RateLimited: 'RATE_LIMITED',
  Internal: 'INTERNAL_ERROR',
} as const;
