'use client';

import { useId, type ReactNode } from 'react';
import Modal from 'react-bootstrap/Modal';
import { Icon, type IconName } from '@/components/icons/Icon';
import { cx } from '@/lib/cx';
import './app-dialog.scss';

interface AppDialogProps {
  show: boolean;
  onHide: () => void;
  onExited?: () => void;
  title: string;
  subtitle?: ReactNode;
  closeLabel: string;
  busy?: boolean;
  wide?: boolean;
  children: ReactNode;
}

export function AppDialog({
  show,
  onHide,
  onExited,
  title,
  subtitle,
  closeLabel,
  busy = false,
  wide = false,
  children,
}: AppDialogProps) {
  const titleId = useId();

  return (
    <Modal
      show={show}
      onHide={onHide}
      onExited={onExited}
      centered
      size={wide ? 'xl' : 'lg'}
      backdrop={busy ? 'static' : true}
      keyboard={!busy}
      dialogClassName={cx('app-dialog', wide && 'app-dialog--wide')}
      contentClassName="app-dialog__content"
      aria-labelledby={titleId}
    >
      <button
        type="button"
        className="app-dialog__close"
        aria-label={closeLabel}
        title={closeLabel}
        onClick={onHide}
        disabled={busy}
      >
        <Icon name="close" size={14} />
      </button>

      <div className="app-dialog__header">
        <h2 id={titleId} className="app-dialog__title">
          {title}
        </h2>
        {subtitle && <p className="app-dialog__subtitle">{subtitle}</p>}
      </div>

      {children}
    </Modal>
  );
}

interface DialogActionsProps {
  cancelLabel: string;
  confirmLabel: string;
  icon: IconName;
  onCancel: () => void;
  onConfirm?: () => void;
  busy?: boolean;
  danger?: boolean;
}

export function DialogActions({
  cancelLabel,
  confirmLabel,
  icon,
  onCancel,
  onConfirm,
  busy = false,
  danger = false,
}: DialogActionsProps) {
  return (
    <div className="app-dialog__footer">
      <button type="button" className="app-dialog__cancel" onClick={onCancel} disabled={busy}>
        {cancelLabel}
      </button>
      <button
        type={onConfirm ? 'button' : 'submit'}
        className={cx('app-dialog__confirm', danger && 'app-dialog__confirm--danger')}
        onClick={onConfirm}
        disabled={busy}
        aria-busy={busy}
      >
        {busy ? (
          <span className="spinner-border spinner-border-sm" aria-hidden="true" />
        ) : (
          <Icon name={icon} size={14} />
        )}
        {confirmLabel}
      </button>
    </div>
  );
}
