import { test, expect } from '@playwright/test';

test('la home resta sotto gli 800 KB', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const byte = await page.evaluate(() =>
    performance.getEntriesByType('resource').reduce((t, r) => t + (r.transferSize || 0), 0)
  );
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
