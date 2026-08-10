import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGES } from './pages.js';

for (const path of PAGES) {
  test(`nessuna violazione di accessibilità su ${path}`, async ({ page }) => {
    await page.goto(path);
    const esito = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const gravi = esito.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(gravi.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test('il focus da tastiera è sempre visibile', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const attivo = page.locator(':focus');
  await expect(attivo).toBeVisible();
  const outline = await attivo.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});
