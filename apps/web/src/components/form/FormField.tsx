import type { InputHTMLAttributes } from 'react';
import type { UseFormRegisterReturn } from 'react-hook-form';
import { controlProps, Field, type FieldMessage } from './Field';

interface FormFieldProps extends Omit<
  InputHTMLAttributes<HTMLInputElement>,
  'name' | 'className' | 'id'
> {
  label: string;
  registration: UseFormRegisterReturn;
  error?: FieldMessage;
  className?: string;
}

export function FormField({
  label,
  registration,
  error,
  className = 'mb-3',
  ...inputProps
}: FormFieldProps) {
  return (
    <Field label={label} error={error} className={className}>
      {(control) => <input {...controlProps(control)} {...inputProps} {...registration} />}
    </Field>
  );
}
