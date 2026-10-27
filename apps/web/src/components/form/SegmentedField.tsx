'use client';

import { useId } from 'react';
import { cx } from '@/lib/cx';
import './form.scss';

interface SegmentedOption<T> {
  value: T;
  label: string;
}

interface SegmentedFieldProps<T extends string | boolean> {
  label: string;
  value: T;
  options: SegmentedOption<T>[];
  onChange: (value: T) => void;
  className?: string;
}

export function SegmentedField<T extends string | boolean>({
  label,
  value,
  options,
  onChange,
  className,
}: SegmentedFieldProps<T>) {
  const name = useId();

  return (
    <fieldset className={cx('segmented', className)}>
      <legend className="form-label text-uppercase segmented__legend">{label}</legend>
      <div className="segmented__options">
        {options.map((option) => (
          <label
            key={String(option.value)}
            className={cx(
              'segmented__option',
              option.value === value && 'segmented__option--active',
            )}
          >
            <input
              type="radio"
              className="segmented__input"
              name={name}
              checked={option.value === value}
              onChange={() => onChange(option.value)}
            />
            {option.label}
          </label>
        ))}
      </div>
    </fieldset>
  );
}
