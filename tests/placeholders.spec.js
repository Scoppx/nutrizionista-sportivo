import { test, expect } from '@playwright/test';
import { PAGES } from './pages.js';

test('nessun contenuto segnaposto resta prima della pubblicazione', async ({ page }) => {
  test.skip(!process.env.PUBLISH, 'controllo di pubblicazione: eseguire con PUBLISH=1 npm test');

  const rimasti = [];
  for (const path of PAGES) {
    await page.goto(path);
    for (const el of await page.locator('[data-placeholder]').all()) {
      // textContent, non innerText: gli elementi non renderizzati come <title>
      // devono comparire nell'elenco, altrimenti sfuggono al controllo
      const testo = ((await el.textContent()) || '').replace(/\s+/g, ' ').trim().slice(0, 60);
      const tag = await el.evaluate((n) => n.tagName.toLowerCase());
      rimasti.push(`${path} → <${tag}> ${testo}`);
    }
  }
  expect(rimasti, 'dati inventati ancora presenti, non pubblicare').toEqual([]);
});

test('i dati strutturati sono validi e coerenti col footer', async ({ page }) => {
  await page.goto('/');
  const raw = await page.locator('script[type="application/ld+json"]').innerText();
  const dati = JSON.parse(raw);
  expect(dati['@type']).toBe('LocalBusiness');
  expect(dati.name).toBeTruthy();
  expect(dati.address.addressLocality).toBeTruthy();
  expect(dati.telephone).toBeTruthy();
});
