import { expect, test } from '@playwright/test';
import { readSessions, sessionsBadge } from '../support/app';

test('счётчик вкладок растёт со второй вкладкой и падает после её закрытия', async ({
  page,
  context,
}) => {
  await page.goto('/orders');
  const before = await readSessions(page);

  const second = await context.newPage();
  await second.goto('/products');
  await expect(sessionsBadge(second, before + 1)).toBeVisible();
  await expect(sessionsBadge(page, before + 1)).toBeVisible();

  await second.close();
  await expect(sessionsBadge(page, before)).toBeVisible();
});
