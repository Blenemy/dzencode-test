'use client';

import { useId, type ReactNode } from 'react';
import { useValidationMessage } from '@/lib/use-messages';
import './form.scss';

export interface FieldControl {
  id: string;
  invalid: boolean;
  describedBy?: string;
}

export interface FieldMessage {
  message?: string;
}

interface FieldProps {
  label: string;
  error?: FieldMessage;
  className?: string;
  children: (control: FieldControl) => ReactNode;
}

export function Field({ label, error, className, children }: FieldProps) {
  const id = useId();
  const message = useValidationMessage();
  const errorId = `${id}-error`;

  return (
    <div className={className}>
      <label className="form-label text-uppercase" htmlFor={id}>
        {label}
      </label>
      {children({ id, invalid: Boolean(error), describedBy: error ? errorId : undefined })}
      {error && (
        <div id={errorId} className="invalid-feedback d-block">
          {message(error.message)}
        </div>
      )}
    </div>
  );
}

export function controlProps(control: FieldControl, base = 'form-control') {
  return {
    id: control.id,
    className: control.invalid ? `${base} is-invalid` : base,
    'aria-invalid': control.invalid,
    'aria-describedby': control.describedBy,
  };
}
