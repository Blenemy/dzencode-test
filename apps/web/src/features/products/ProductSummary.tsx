import Image from 'next/image';
import { useTranslations } from 'next-intl';
import type { ProductDto } from '@dzen/shared';
import { useProductTypeName } from '@/features/catalog/use-type-name';
import { cx } from '@/lib/cx';
import './products.scss';

type ProductSummaryData = Pick<ProductDto, 'title' | 'serialNumber' | 'photo' | 'status' | 'type'>;

const TYPE_PHOTOS = new Set(['monitors', 'laptops', 'phones', 'printers', 'keyboards', 'mice']);

function fallbackPhoto(typeName: string): string | null {
  const slug = typeName.toLowerCase();
  return TYPE_PHOTOS.has(slug) ? `/products/${slug}.svg` : null;
}

export function ProductSummary({ product }: { product: ProductSummaryData }) {
  const t = useTranslations('products');
  const typeName = useProductTypeName();
  const status = t(`status.${product.status}`);
  const photo = product.photo ?? fallbackPhoto(product.type.name);

  return (
    <div
      className={cx('product-summary', product.status === 'IN_REPAIR' && 'product-summary--repair')}
    >
      <span className="product-summary__dot" title={status} />
      {photo ? (
        <Image
          className="product-summary__thumb"
          src={photo}
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
        <span className="product-summary__meta">
          <span className="product-summary__serial">{product.serialNumber}</span>
          <span className="product-summary__type">{typeName(product.type.name)}</span>
        </span>
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
