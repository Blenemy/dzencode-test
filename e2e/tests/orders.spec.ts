import { expect, test } from '@playwright/test';

test('панель прихода открывается рядом со списком и закрывается', async ({ page }) => {
  await page.goto('/orders');
  const link = page.getByRole('link', { name: /^Открыть приход/ }).first();
  const title = ((await link.getAttribute('aria-label')) ?? '').match(/«(.+)»/)?.[1] ?? '';

  await link.click();
  await expect(page).toHaveURL(/\/orders\/\d+$/);
  const panel = page.getByRole('region', { name: title });
  await expect(panel).toBeVisible();
  await expect(page.getByRole('link', { name: `Открыть приход «${title}»` })).toHaveAttribute(
    'aria-current',
    'page',
  );

  await panel.getByRole('button', { name: 'Закрыть приход' }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await expect(panel).toBeHidden();
});

test('форма прихода показывает ошибки валидации', async ({ page }) => {
  await page.goto('/orders');
  await page.getByRole('button', { name: 'Создать приход' }).click();

  const dialog = page.getByRole('dialog', { name: 'Новый приход' });
  const name = dialog.getByRole('textbox', { name: 'Название' });
  await dialog.getByRole('button', { name: 'Создать', exact: true }).click();
  await expect(name).toHaveAttribute('aria-invalid', 'true');
  await expect(dialog.getByText('Обязательное поле')).toBeVisible();

  await name.fill('x'.repeat(300));
  await expect(dialog.getByText('Слишком длинное значение')).toBeVisible();

  await name.fill('Черновик');
  await expect(name).not.toHaveAttribute('aria-invalid', 'true');

  await dialog.getByRole('button', { name: 'Отменить' }).click();
  await expect(dialog).toBeHidden();
});

test('новый приход появляется в соседней вкладке и удаляется через попап', async ({
  page,
  context,
}) => {
  const title = `E2E приход ${Date.now()}`;
  const neighbour = await context.newPage();
  await neighbour.goto('/orders');
  await page.goto('/orders');

  await page.getByRole('button', { name: 'Создать приход' }).click();
  const form = page.getByRole('dialog', { name: 'Новый приход' });
  await form.getByRole('textbox', { name: 'Название' }).fill(title);
  await form.getByRole('button', { name: 'Создать', exact: true }).click();

  await expect(page).toHaveURL(/\/orders\/\d+$/);
  await expect(page.getByRole('region', { name: title })).toBeVisible();
  await expect(neighbour.getByRole('link', { name: `Открыть приход «${title}»` })).toBeVisible();

  await page.getByRole('button', { name: 'Закрыть приход' }).click();
  await expect(page).toHaveURL(/\/orders$/);
  await page.getByRole('button', { name: `Удалить приход «${title}»` }).click();

  const confirm = page.getByRole('dialog', {
    name: 'Вы уверены, что хотите удалить этот приход?',
  });
  await expect(confirm).toContainText(title);
  await expect(confirm).toContainText('В приходе нет продуктов');
  await confirm.getByRole('button', { name: 'Удалить', exact: true }).click();

  await expect(confirm).toBeHidden();
  await expect(page.getByRole('link', { name: `Открыть приход «${title}»` })).toHaveCount(0);
  await expect(neighbour.getByRole('link', { name: `Открыть приход «${title}»` })).toHaveCount(0);
});
