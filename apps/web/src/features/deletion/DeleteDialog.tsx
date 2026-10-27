'use client';

import Modal from 'react-bootstrap/Modal';
import { useTranslations } from 'next-intl';
import { Icon } from '@/components/icons/Icon';
import { useDeleteOrderMutation, useOrderQuery } from '@/features/orders/orders.api';
import { useDeleteProductMutation } from '@/features/products/products.api';
import { ProductSummary } from '@/features/products/ProductSummary';
import { usePathname, useRouter } from '@/i18n/navigation';
import { errorCode } from '@/lib/api-error';
import { useErrorMessage } from '@/lib/use-messages';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  deleteDialogExited,
  deleteDismissed,
  selectDeleteOpen,
  type DeleteTarget,
} from './deletion.slice';
import './delete-dialog.scss';

const SKELETON_ROWS = 2;

export function DeleteDialog({ target }: { target: DeleteTarget }) {
  const t = useTranslations('deleteDialog');
  const errorMessage = useErrorMessage();
  const dispatch = useAppDispatch();
  const open = useAppSelector(selectDeleteOpen);
  const router = useRouter();
  const pathname = usePathname();
  const [deleteOrder, orderDeletion] = useDeleteOrderMutation();
  const [deleteProduct, productDeletion] = useDeleteProductMutation();
  const order = useOrderQuery(target.kind === 'order' ? target.order.id : 0, {
    skip: target.kind !== 'order',
  });

  const products = target.kind === 'order' ? order.data?.products : [target.product];
  const pending = orderDeletion.isLoading || productDeletion.isLoading;
  const error = target.kind === 'order' ? orderDeletion.error : productDeletion.error;

  const close = () => dispatch(deleteDismissed());

  const confirm = async () => {
    const result =
      target.kind === 'order'
        ? await deleteOrder(target.order.id)
        : await deleteProduct({ id: target.product.id, orderId: target.product.order.id });
    if (result.error && errorCode(result.error) !== 'NOT_FOUND') return;

    close();
    if (target.kind === 'order' && pathname === `/orders/${target.order.id}`) {
      router.replace('/orders', { scroll: false });
    }
  };

  return (
    <Modal
      show={open}
      onHide={close}
      onExited={() => dispatch(deleteDialogExited())}
      centered
      size="lg"
      backdrop={pending ? 'static' : true}
      keyboard={!pending}
      dialogClassName="delete-dialog"
      contentClassName="delete-dialog__content"
      aria-labelledby="delete-dialog-title"
    >
      <button
        type="button"
        className="delete-dialog__close"
        aria-label={t('close')}
        title={t('close')}
        onClick={close}
        disabled={pending}
      >
        <Icon name="close" size={14} />
      </button>

      <div className="delete-dialog__header">
        <h2 id="delete-dialog-title" className="delete-dialog__title">
          {t(target.kind)}
        </h2>
        {target.kind === 'order' && <p className="delete-dialog__subject">{target.order.title}</p>}
      </div>

      {products ? (
        products.length > 0 ? (
          <ul className="delete-dialog__products">
            {products.map((product) => (
              <li key={product.id} className="delete-dialog__product">
                <ProductSummary product={product} />
              </li>
            ))}
          </ul>
        ) : (
          <p className="delete-dialog__empty">{t('noProducts')}</p>
        )
      ) : (
        <div className="delete-dialog__products placeholder-glow" aria-hidden="true">
          {Array.from({ length: SKELETON_ROWS }, (_, index) => (
            <div key={index} className="delete-dialog__product">
              <span className="placeholder col-8" />
            </div>
          ))}
        </div>
      )}

      {error && (
        <div className="alert alert-danger delete-dialog__error" role="alert">
          {errorMessage(error)}
        </div>
      )}

      <div className="delete-dialog__footer">
        <button type="button" className="delete-dialog__cancel" onClick={close} disabled={pending}>
          {t('cancel')}
        </button>
        <button
          type="button"
          className="delete-dialog__confirm"
          onClick={confirm}
          disabled={pending}
          aria-busy={pending}
        >
          {pending ? (
            <span className="spinner-border spinner-border-sm" aria-hidden="true" />
          ) : (
            <Icon name="trash" size={14} />
          )}
          {t('confirm')}
        </button>
      </div>
    </Modal>
  );
}
