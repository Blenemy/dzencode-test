import { describe, expect, it } from 'vitest';
import {
  buildIndex,
  normalize,
  orderDocument,
  productDocument,
  searchIndex,
} from '@/features/search/search-engine';
import { order, product } from './fixtures';

const index = buildIndex([
  orderDocument(
    order({ id: 1, title: 'Поставка техники', warehouse: { id: 1, name: 'Центр', city: 'Киев' } }),
  ),
  orderDocument(order({ id: 2, title: 'Ёлочные игрушки' })),
  productDocument(
    product({ id: 10, title: 'Dell UltraSharp U2723QE', serialNumber: 'SN-DELL-001' }),
  ),
  productDocument(product({ id: 11, title: 'Logitech MX Master 3S', serialNumber: 'SN-LOGI-002' })),
]);

const ids = (query: string) => {
  const { orders, products } = searchIndex(index, query);
  return [...orders, ...products].map((result) => result.id);
};

describe('search engine', () => {
  it('normalizes case, ё and punctuation', () => {
    expect(normalize('  Ёлка, ПРИВЕТ!  ')).toBe('елка привет');
  });

  it('matches by title, secondary fields and fuzzy subsequence', () => {
    expect(ids('ultra')).toEqual([10]);
    expect(ids('sn-logi')).toEqual([11]);
    expect(ids('елочные')).toEqual([2]);
    expect(ids('киев')).toEqual([1]);
    expect(ids('dll ultrshrp')).toEqual([10]);
  });

  it('requires every word to match and ignores blank queries', () => {
    expect(ids('dell logitech')).toEqual([]);
    expect(ids('   ')).toEqual([]);
  });

  it('ranks prefix matches first and caps each group', () => {
    const ranked = buildIndex([
      productDocument(product({ id: 1, title: 'Desktop ammonia sensor' })),
      productDocument(product({ id: 2, title: 'Monitor arm' })),
    ]);
    expect(searchIndex(ranked, 'mon').products.map((result) => result.id)).toEqual([2, 1]);

    const many = buildIndex(
      Array.from({ length: 10 }, (_, i) =>
        productDocument(product({ id: i + 1, title: `Cable ${i}` })),
      ),
    );
    expect(searchIndex(many, 'cable').products).toHaveLength(7);
  });
});
