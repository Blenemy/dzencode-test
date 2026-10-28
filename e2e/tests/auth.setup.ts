import { expect, test as setup } from '@playwright/test';
import { DEMO_STATE } from '../support/auth-state';

setup('демо-вход сохраняет сессию', async ({ page }) => {
  await page.goto('/orders');
  await expect(page).toHaveURL(/\/login/);

  await page.getByRole('button', { name: 'Войти как демо-пользователь' }).click();

  await expect(page).toHaveURL(/\/orders$/);
  await expect(page.getByRole('heading', { level: 1, name: /Приходы/ })).toBeVisible();
  await page.context().storageState({ path: DEMO_STATE });
});
