import type { Metadata } from 'next';
import { getTranslations, setRequestLocale } from 'next-intl/server';
import type { PageResponse, ProductDto, ProductTypeDto } from '@dzen/shared';
import { ProductsView } from '@/features/products/ProductsView';
import {
  parseProductsArgs,
  productsApiPath,
  specificationsApiPath,
  toSearchParams,
} from '@/features/products/products-query';
import { toAppLocale } from '@/i18n/routing';
import { dataOrNull, serverGet } from '@/lib/server-api';

export async function generateMetadata(): Promise<Metadata> {
  const t = await getTranslations('pages');
  return { title: t('products') };
}

export default async function Page({ params, searchParams }: PageProps<'/[locale]/products'>) {
  setRequestLocale(toAppLocale((await params).locale));

  const args = parseProductsArgs(toSearchParams(await searchParams));
  const [products, types, specifications] = await Promise.all([
    serverGet<PageResponse<ProductDto>>(productsApiPath(args)),
    serverGet<ProductTypeDto[]>('/product-types'),
    serverGet<string[]>(specificationsApiPath(args.typeId ?? null)),
  ]);

  return (
    <ProductsView
      initial={{
        products: dataOrNull(products),
        types: dataOrNull(types),
        specifications: dataOrNull(specifications),
      }}
    />
  );
}
