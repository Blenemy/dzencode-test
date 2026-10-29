import { expect, test } from '@playwright/test';

const SECTIONS = [
  { link: 'Группы', path: '/groups', heading: 'Группы' },
  { link: 'Продукты', path: '/products', heading: /Продукты/ },
  { link: 'Пользователи', path: '/users', heading: 'Пользователи' },
  { link: 'Настройки', path: '/settings', heading: 'Настройки' },
  { link: 'Приход', path: '/orders', heading: /Приходы/ },
];

test('разделы открываются из бокового меню', async ({ page }) => {
  await page.goto('/orders');
  const menu = page.getByRole('navigation', { name: 'Разделы' });

  for (const section of SECTIONS) {
    await menu.getByRole('link', { name: section.link, exact: true }).click();
    await expect(page).toHaveURL(new RegExp(`${section.path}$`));
    await expect(page.getByRole('heading', { level: 1, name: section.heading })).toBeVisible();
    await expect(menu.getByRole('link', { name: section.link, exact: true })).toHaveAttribute(
      'aria-current',
      'page',
    );
  }
});

test('язык переключается без потери страницы', async ({ page }) => {
  await page.goto('/groups');
  const switcher = page.getByRole('group', { name: 'Язык интерфейса' });

  await switcher.getByRole('button', { name: 'en' }).click();
  await expect(page).toHaveURL(/\/en\/groups$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Groups' })).toBeVisible();
  await expect(page.locator('html')).toHaveAttribute('lang', 'en');

  await page
    .getByRole('group', { name: 'Interface language' })
    .getByRole('button', { name: 'ru' })
    .click();
  await expect(page).toHaveURL(/\/groups$/);
  await expect(page.getByRole('heading', { level: 1, name: 'Группы' })).toBeVisible();
});
