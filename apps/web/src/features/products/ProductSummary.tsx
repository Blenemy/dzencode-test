import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ProductDto } from '@dzen/shared';
import { cx } from '@/lib/cx';
import './products.scss';

type ProductSummaryData = Pick<ProductDto, 'title' | 'serialNumber' | 'photo' | 'status'>;

export function ProductSummary({ product }: { product: ProductSummaryData }) {
  const t = useTranslations('products');
  const status = t(`status.${product.status}`);

  return (
    <div
      className={cx('product-summary', product.status === 'IN_REPAIR' && 'product-summary--repair')}
    >
      <span className="product-summary__dot" title={status} />
      {product.photo ? (
        <Image
          className="product-summary__thumb"
          src={product.photo}
          alt=""
          width={56}
          height={40}
          unoptimized
        />
      ) : (
        <span className="product-summary__thumb product-summary__thumb--empty" />
      )}
      <span className="product-summary__info">
        <span className="product-summary__title">{product.title}</span>
        <span className="product-summary__serial">{product.serialNumber}</span>
      </span>
    </div>
  );
}

export function ProductStatus({ status }: { status: ProductDto['status'] }) {
  const t = useTranslations('products');

  return (
    <span className={cx('product-status', status === 'IN_REPAIR' && 'product-status--repair')}>
      {t(`status.${status}`)}
    </span>
  );
}
