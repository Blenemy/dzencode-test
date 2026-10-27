import { Icon } from '@/components/icons/Icon';
import { cx } from '@/lib/cx';
import './trash-button.scss';

interface TrashButtonProps {
  label: string;
  onClick: () => void;
  className?: string;
}

export function TrashButton({ label, onClick, className }: TrashButtonProps) {
  return (
    <button
      type="button"
      className={cx('trash-button', className)}
      aria-label={label}
      title={label}
      onClick={onClick}
    >
      <Icon name="trash" size={14} />
    </button>
  );
}
