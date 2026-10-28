import { expect, type Page } from '@playwright/test';

export async function readTotal(page: Page): Promise<number> {
  const heading = page.getByRole('heading', { level: 1 });
  await expect(heading).toHaveText(/\/\s*\d+$/);
  const text = (await heading.textContent()) ?? '';
  return Number(text.match(/(\d+)$/)?.[1]);
}

export async function readSessions(page: Page): Promise<number> {
  const badge = page.getByRole('status', { name: /вкладк/ });
  await expect(badge).toBeVisible();
  const label = (await badge.getAttribute('aria-label')) ?? '';
  return Number(label.match(/(\d+)/)?.[1]);
}

export function sessionsBadge(page: Page, count: number) {
  return page.getByRole('status', { name: new RegExp(` ${count} вкладк`) });
}
