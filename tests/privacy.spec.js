import { test, expect } from '@playwright/test';
import { PAGES } from './pages.js';

test.describe('conformità di base', () => {
  for (const path of PAGES) {
    test(`nessuna richiesta esterna su ${path}`, async ({ page }) => {
      const esterne = [];
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (url.hostname !== 'localhost' && url.protocol !== 'data:') esterne.push(req.url());
      });
      await page.goto(path, { waitUntil: 'networkidle' });
      expect(esterne, `richieste verso domini terzi: ${esterne.join(', ')}`).toEqual([]);
    });

    test(`footer legale presente su ${path}`, async ({ page }) => {
      await page.goto(path);
      const footer = page.locator('footer.site-footer');
      await expect(footer).toContainText(/P\.?\s?IVA/i);
      await expect(footer).toContainText(/ONB n\./i);
      await expect(footer.locator('a[href$="privacy.html"]')).toHaveCount(1);
    });
  }
});
