import { test, expect } from '@playwright/test';

test('la home si carica ed è dichiarata in italiano', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page).toHaveTitle(/nutrizionista/i);
  await expect(page.locator('h1')).toHaveCount(1);
});
