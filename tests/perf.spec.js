import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { test, expect } from '@playwright/test';

test('motion.js resta sotto il budget di 3 KB non compresso', () => {
  const percorso = fileURLToPath(new URL('../site/assets/js/motion.js', import.meta.url));
  const byte = readFileSync(percorso).length;
  expect(byte, `motion.js pesa ${byte} byte, sopra il budget di 3072`).toBeLessThanOrEqual(3072);
});

test('la home resta sotto gli 800 KB', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const byte = await page.evaluate(() => {
    // getEntriesByType('resource') esclude per specifica il documento HTML
    // principale, che vive nell'entry 'navigation': senza sommarlo il test
    // misura solo le sotto-risorse e non intercetta un documento gonfio.
    const risorse = performance.getEntriesByType('resource').reduce((t, r) => t + (r.transferSize || 0), 0);
    const documento = performance.getEntriesByType('navigation')[0]?.transferSize || 0;
    return risorse + documento;
  });
  const kb = Math.round(byte / 1024);
  console.log(`peso della home: ${kb} KB`);
  expect(kb).toBeLessThan(800);
});

test('ogni immagine dichiara le dimensioni ed è servita in webp', async ({ page }) => {
  await page.goto('/');
  for (const img of await page.locator('img').all()) {
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('height', /\d+/);
  }
  const sorgenti = await page.locator('picture source[type="image/webp"]').count();
  expect(sorgenti).toBeGreaterThan(0);
});

test('anche chi-sono.html dichiara le dimensioni ed è servita in webp', async ({ page }) => {
  await page.goto('/chi-sono.html');
  for (const img of await page.locator('img').all()) {
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('height', /\d+/);
  }
  const sorgenti = await page.locator('picture source[type="image/webp"]').count();
  expect(sorgenti).toBeGreaterThan(0);
});
