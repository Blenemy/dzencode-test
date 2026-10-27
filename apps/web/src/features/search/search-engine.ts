import type { OrderSummaryDto, ProductDto } from '@dzen/shared';

export type SearchKind = 'order' | 'product';

export interface SearchDocument {
  kind: SearchKind;
  id: number;
  title: string;
  subtitle: string;
  href: string;
  fields: string[];
}

export interface SearchResult {
  kind: SearchKind;
  id: number;
  title: string;
  subtitle: string;
  href: string;
}

export interface SearchResults {
  orders: SearchResult[];
  products: SearchResult[];
}

export type SearchRequest =
  { type: 'index'; documents: SearchDocument[] } | { type: 'query'; id: number; query: string };

export interface SearchResponse {
  id: number;
  results: SearchResults;
}

interface IndexedDocument {
  document: SearchDocument;
  title: string;
  words: string[];
  rest: string;
}

const LIMITS: Record<SearchKind, number> = { order: 5, product: 7 };
const MIN_FUZZY_LENGTH = 3;

export function normalize(text: string): string {
  return text
    .toLocaleLowerCase('ru')
    .replace(/ё/g, 'е')
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^\p{L}\p{N}]+/gu, ' ')
    .trim();
}

export function orderDocument(order: OrderSummaryDto): SearchDocument {
  return {
    kind: 'order',
    id: order.id,
    title: order.title,
    subtitle: order.warehouse ? `${order.warehouse.city} · ${order.warehouse.name}` : '',
    href: `/orders/${order.id}`,
    fields: [order.description ?? '', order.warehouse?.name ?? '', order.warehouse?.city ?? ''],
  };
}

export function productDocument(product: ProductDto): SearchDocument {
  return {
    kind: 'product',
    id: product.id,
    title: product.title,
    subtitle: `${product.serialNumber} · ${product.order.title}`,
    href: `/orders/${product.order.id}`,
    fields: [
      product.serialNumber,
      product.specification,
      product.type.name,
      product.group?.title ?? '',
      product.user?.name ?? '',
      product.order.title,
    ],
  };
}

export function buildIndex(documents: SearchDocument[]): IndexedDocument[] {
  return documents.map((document) => {
    const title = normalize(document.title);
    return {
      document,
      title,
      words: title.split(' '),
      rest: normalize(document.fields.join(' ')),
    };
  });
}

function subsequenceScore(token: string, text: string): number {
  let position = -1;
  let first = -1;
  for (const char of token) {
    position = text.indexOf(char, position + 1);
    if (position === -1) return 0;
    if (first === -1) first = position;
  }
  const span = position - first + 1;
  return token.length / span;
}

function tokenScore(token: string, entry: IndexedDocument): number {
  if (entry.words.some((word) => word.startsWith(token))) return 10;
  if (entry.title.includes(token)) return 6;
  if (entry.rest.split(' ').some((word) => word.startsWith(token))) return 4;
  if (entry.rest.includes(token)) return 3;
  if (token.length < MIN_FUZZY_LENGTH) return 0;
  const fuzzy = subsequenceScore(token, entry.title);
  return fuzzy >= 0.5 ? 1 + fuzzy : 0;
}

export function searchIndex(index: IndexedDocument[], query: string): SearchResults {
  const tokens = normalize(query).split(' ').filter(Boolean);
  const results: SearchResults = { orders: [], products: [] };
  if (tokens.length === 0) return results;

  const scored: { entry: IndexedDocument; score: number }[] = [];
  for (const entry of index) {
    let score = 0;
    for (const token of tokens) {
      const value = tokenScore(token, entry);
      if (value === 0) {
        score = 0;
        break;
      }
      score += value;
    }
    if (score > 0) scored.push({ entry, score });
  }

  scored.sort((a, b) => b.score - a.score || a.entry.title.length - b.entry.title.length);

  for (const { entry } of scored) {
    const { kind, id, title, subtitle, href } = entry.document;
    const bucket = kind === 'order' ? results.orders : results.products;
    if (bucket.length < LIMITS[kind]) bucket.push({ kind, id, title, subtitle, href });
  }
  return results;
}
