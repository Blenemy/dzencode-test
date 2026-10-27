import { Icon } from '@/components/icons/Icon';
import { cx } from '@/lib/cx';
import './add-button.scss';

interface AddButtonProps {
  label: string;
  onClick: () => void;
  withText?: boolean;
  className?: string;
}

export function AddButton({ label, onClick, withText = false, className }: AddButtonProps) {
  return (
    <button
      type="button"
      className={cx('add-button', withText && 'add-button--text', className)}
      onClick={onClick}
      aria-label={withText ? undefined : label}
      title={withText ? undefined : label}
    >
      <span className="add-button__icon" aria-hidden="true">
        <Icon name="plus" size={withText ? 10 : 14} />
      </span>
      {withText && <span className="add-button__label">{label}</span>}
    </button>
  );
}
