'use client';

import { useRef, useState, type DragEvent } from 'react';
import Image from 'next/image';
import { useTranslations } from 'next-intl';
import { UPLOAD_IMAGE_TYPES, UPLOAD_MAX_BYTES } from '@dzen/shared';
import { Icon } from '@/components/icons/Icon';
import { cx } from '@/lib/cx';
import { useErrorMessage, useValidationMessage } from '@/lib/use-messages';
import { useUploadImageMutation } from './uploads.api';
import './photo-upload.scss';

const ACCEPTED: readonly string[] = UPLOAD_IMAGE_TYPES;

interface PhotoUploadProps {
  label: string;
  round?: boolean;
  value?: string;
  error?: string;
  onChange: (url: string | undefined) => void;
  onUploadingChange: (uploading: boolean) => void;
}

export function PhotoUpload({
  label,
  round = false,
  value,
  error,
  onChange,
  onUploadingChange,
}: PhotoUploadProps) {
  const t = useTranslations('upload');
  const validationMessage = useValidationMessage();
  const errorMessage = useErrorMessage();
  const inputRef = useRef<HTMLInputElement>(null);
  const [upload, { isLoading, error: uploadError, reset }] = useUploadImageMutation();
  const [localError, setLocalError] = useState<string | null>(null);
  const [dragging, setDragging] = useState(false);

  const shownError = localError
    ? validationMessage(localError)
    : uploadError
      ? errorMessage(uploadError)
      : validationMessage(error);

  const accept = async (file: File | undefined) => {
    if (!file) return;
    reset();
    setLocalError(null);
    if (!ACCEPTED.includes(file.type)) {
      setLocalError('validation.fileType');
      return;
    }
    if (file.size > UPLOAD_MAX_BYTES) {
      setLocalError('validation.fileSize');
      return;
    }

    onUploadingChange(true);
    const result = await upload(file);
    onUploadingChange(false);
    if (result.data) onChange(result.data.url);
  };

  const drop = (event: DragEvent<HTMLDivElement>) => {
    event.preventDefault();
    setDragging(false);
    void accept(event.dataTransfer.files[0]);
  };

  return (
    <div
      className={cx(
        'photo-upload',
        round && 'photo-upload--round',
        dragging && 'photo-upload--dragging',
        shownError && 'photo-upload--invalid',
      )}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={() => setDragging(false)}
      onDrop={drop}
    >
      <div className="photo-upload__preview">
        {isLoading ? (
          <span className="spinner-border text-primary" aria-hidden="true" />
        ) : value ? (
          <Image
            className="photo-upload__image"
            src={value}
            alt=""
            width={120}
            height={90}
            unoptimized
          />
        ) : (
          <Icon name="image" size={30} />
        )}
      </div>

      <div className="photo-upload__body">
        <span className="form-label text-uppercase">{label}</span>
        <div className="photo-upload__actions">
          <button
            type="button"
            className="btn btn-sm btn-outline-primary photo-upload__choose"
            onClick={() => inputRef.current?.click()}
            disabled={isLoading}
          >
            <Icon name="upload" size={14} />
            {value ? t('replace') : t('choose')}
          </button>
          {value && !isLoading && (
            <button
              type="button"
              className="btn btn-sm btn-link photo-upload__remove"
              onClick={() => onChange(undefined)}
            >
              {t('remove')}
            </button>
          )}
        </div>
        <p className="photo-upload__hint" aria-live="polite">
          {isLoading ? t('uploading') : `${t('hint')}, ${t('dropHint')}`}
        </p>
        {shownError && <div className="invalid-feedback d-block">{shownError}</div>}
        <input
          ref={inputRef}
          type="file"
          accept={UPLOAD_IMAGE_TYPES.join(',')}
          className="d-none"
          tabIndex={-1}
          onChange={(event) => {
            void accept(event.target.files?.[0]);
            event.target.value = '';
          }}
        />
      </div>
    </div>
  );
}
