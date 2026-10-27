import { useId, type InputHTMLAttributes } from 'react';
import type { FieldError, UseFormRegisterReturn } from 'react-hook-form';
import { useValidationMessage } from '@/lib/use-messages';

interface FormFieldProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'name'> {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldError;
}

export function FormField({ label, registration, error, ...inputProps }: FormFieldProps) {
  const id = useId();
  const message = useValidationMessage();
  const errorId = `${id}-error`;

  return (
    <div className="mb-3">
      <label className="form-label text-uppercase" htmlFor={id}>
        {label}
      </label>
      <input
        id={id}
        className={`form-control${error ? ' is-invalid' : ''}`}
        aria-invalid={Boolean(error)}
        aria-describedby={error ? errorId : undefined}
        {...inputProps}
        {...registration}
      />
      {error && (
        <div id={errorId} className="invalid-feedback">
          {message(error.message)}
        </div>
      )}
    </div>
  );
}
