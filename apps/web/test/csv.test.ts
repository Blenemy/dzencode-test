import { describe, expect, it } from 'vitest';
import { buildCsv, type CsvLabels } from '@/features/products/csv';
import { product } from './fixtures';

const labels: CsvLabels = {
  headers: ['ID', 'Название'],
  status: { FREE: 'Свободен', IN_REPAIR: 'В ремонте' },
  condition: { new: 'новый', used: 'Б / У' },
  types: { Monitors: 'Мониторы' },
};

const lines = (csv: string) => csv.slice(1).split('\r\n');

describe('buildCsv', () => {
  it('writes an Excel-friendly Russian file', () => {
    const csv = buildCsv({
      products: [product({ title: 'Монитор; 27"' })],
      labels,
      delimiter: ';',
      decimal: ',',
    });

    expect(csv.startsWith('﻿')).toBe(true);
    expect(lines(csv)).toEqual([
      'ID;Название',
      '1;"Монитор; 27""";SN-0001;Мониторы;27 inch;Свободен;новый;2026-01-01;2027-01-01;100,00;4150,50;;;Order;2026-01-15',
    ]);
  });

  it('uses comma and dot for English and neutralizes formulas', () => {
    const csv = buildCsv({
      products: [
        product({
          title: '=HYPERLINK("http://x")',
          status: 'IN_REPAIR',
          isNew: false,
          group: { id: 1, title: 'Office, 2nd floor' },
          user: { id: 1, name: '@admin' },
        }),
      ],
      labels,
      delimiter: ',',
      decimal: '.',
    });

    expect(lines(csv)[1]).toBe(
      `1,"'=HYPERLINK(""http://x"")",SN-0001,Мониторы,27 inch,В ремонте,Б / У,2026-01-01,2027-01-01,100.00,4150.50,"Office, 2nd floor",'@admin,Order,2026-01-15`,
    );
  });
});
