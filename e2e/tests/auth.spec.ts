import { expect, test } from '@playwright/test';

test.use({ storageState: { cookies: [], origins: [] } });

test('гость попадает на вход, а после входа возвращается на запрошенную страницу', async ({
  page,
}) => {
  await page.goto('/products?page=2');
  await expect(page).toHaveURL(/\/login\?next=/);

  await page.getByRole('button', { name: 'Войти как демо-пользователь' }).click();
  await expect(page).toHaveURL(/\/products\?page=2$/);
  await expect(page.getByRole('heading', { level: 1, name: /Продукты/ })).toBeVisible();

  await page.getByRole('button', { name: 'Выйти' }).click();
  await expect(page).toHaveURL(/\/login/);
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login/);
});
