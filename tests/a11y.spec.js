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

test.describe('con reduced motion', () => {
  // .metodo-track è display:none e .metodo-fallback-blocco è quello visibile in questa
  // modalità: senza questo context, axe non lo controlla mai (è display:none in ogni
  // altra run) e un markup rotto lì dentro (es. intestazioni orfane) può restare invisibile
  // ai test per sempre.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });

  test('nessuna violazione di accessibilità sulla resa di fallback del metodo', async ({ page }) => {
    await page.goto('/');
    const esito = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const gravi = esito.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(gravi.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
});
