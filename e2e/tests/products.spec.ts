import { expect, test } from '@playwright/test';
import { readTotal } from '../support/app';

test('фильтр по типу хранится в адресе и переживает перезагрузку', async ({ page }) => {
  await page.goto('/products');
  const all = await readTotal(page);
  const type = page.getByLabel('Тип');

  await type.selectOption({ label: 'Мониторы' });
  await expect(page).toHaveURL(/[?&]type=\d+/);
  await expect.poll(() => readTotal(page)).toBeLessThan(all);
  const monitors = await readTotal(page);
  expect(monitors).toBeGreaterThan(0);

  const specification = page.getByLabel('Спецификация');
  const option = specification.locator('option').nth(1);
  const spec = (await option.textContent()) ?? '';
  await specification.selectOption({ label: spec });
  await expect(page).toHaveURL(/[?&]spec=/);
  await expect.poll(() => readTotal(page)).toBeLessThanOrEqual(monitors);

  await page.reload();
  await expect(type.locator('option:checked')).toHaveText('Мониторы');
  await expect(specification.locator('option:checked')).toHaveText(spec);

  await page.getByRole('button', { name: 'Сбросить фильтры' }).click();
  await expect(page).toHaveURL(/\/products$/);
  await expect.poll(() => readTotal(page)).toBe(all);
});
