export const PRODUCTS_PAGE_SIZE = 20;

export interface ProductsArgs {
  typeId?: number;
  specification?: string;
  page: number;
}

type SearchSource = Pick<URLSearchParams, 'get'>;
type RawSearchParams = Record<string, string | string[] | undefined>;

function positiveInt(value: string | null): number | undefined {
  const parsed = Number(value);
  return Number.isInteger(parsed) && parsed > 0 ? parsed : undefined;
}

export function toSearchParams(raw: RawSearchParams): URLSearchParams {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(raw)) {
    const first = Array.isArray(value) ? value[0] : value;
    if (first !== undefined) search.set(key, first);
  }
  return search;
}

export function parseProductsArgs(search: SearchSource): ProductsArgs {
  return {
    typeId: positiveInt(search.get('type')),
    specification: search.get('spec')?.trim() || undefined,
    page: positiveInt(search.get('page')) ?? 1,
  };
}

export function toProductsSearch(args: ProductsArgs): string {
  const search = new URLSearchParams();
  if (args.typeId) search.set('type', String(args.typeId));
  if (args.specification) search.set('spec', args.specification);
  if (args.page > 1) search.set('page', String(args.page));
  return search.toString();
}

export function productsApiPath(args: ProductsArgs): string {
  const search = new URLSearchParams({
    page: String(args.page),
    limit: String(PRODUCTS_PAGE_SIZE),
  });
  if (args.typeId) search.set('typeId', String(args.typeId));
  if (args.specification) search.set('specification', args.specification);
  return `/products?${search}`;
}

export function specificationsApiPath(typeId: number | null): string {
  return typeId ? `/specifications?typeId=${typeId}` : '/specifications';
}
