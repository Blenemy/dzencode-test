import { readFile } from 'node:fs/promises';
import { expect, test, type Page } from '@playwright/test';

async function waitForServiceWorker(page: Page) {
  await page.evaluate('navigator.serviceWorker.ready.then(() => true)');
  await page.reload();
  await expect.poll(() => page.evaluate('Boolean(navigator.serviceWorker.controller)')).toBe(true);
}

test('поиск и экспорт CSV работают в одной вкладке под service worker', async ({ page }) => {
  await page.goto('/products');
  await waitForServiceWorker(page);

  await page
    .getByRole('combobox', { name: 'Поиск по приходам и продуктам' })
    .fill('dell ultrasharp');
  await expect(page.getByRole('option', { name: /Dell UltraSharp/ }).first()).toBeVisible();

  const download = page.waitForEvent('download');
  await page.getByRole('button', { name: 'Экспорт CSV' }).click();
  const csv = await readFile(await (await download).path(), 'utf8');
  expect(csv).toContain('Серийный номер');
  expect(csv.trim().split('\n').length).toBeGreaterThan(1);
});
