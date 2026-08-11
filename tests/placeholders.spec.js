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

// Copertura del cancello stesso: il censimento sopra può segnalare solo gli elementi
// che già portano [data-placeholder]. Se un valore inventato compare fuori da un
// elemento marcato (come è successo al blocco JSON-LD), PUBLISH=1 non lo vede mai
// e il sito può essere pubblicato con dati falsi ancora dentro. Questo test non è
// condizionato a PUBLISH: deve girare sempre, per intercettare la prossima fuga.
const VALORI_INVENTATI = [
  'Marco Rossi',
  '01234567890',
  'AA_1234',
  '393330000000',
  'example.invalid',
  'Via Esempio',
];

test('ogni occorrenza dei dati inventati noti sta dentro un elemento [data-placeholder]', async ({ page }) => {
  const fughe = [];
  for (const path of PAGES) {
    await page.goto(path);
    for (const valore of VALORI_INVENTATI) {
      const nonCoperti = await page.evaluate((v) => {
        const risultati = [];
        for (const el of document.querySelectorAll('*')) {
          let trovato = false;
          for (const attr of el.attributes || []) {
            if (attr.value.includes(v)) { trovato = true; break; }
          }
          if (!trovato) {
            for (const nodo of el.childNodes) {
              if (nodo.nodeType === Node.TEXT_NODE && nodo.textContent.includes(v)) { trovato = true; break; }
            }
          }
          if (trovato && !el.closest('[data-placeholder]')) {
            risultati.push(el.tagName.toLowerCase());
          }
        }
        return risultati;
      }, valore);
      for (const tag of nonCoperti) {
        fughe.push(`${path} → "${valore}" fuori da [data-placeholder] su <${tag}>`);
      }
    }
  }
  expect(fughe, 'dati inventati presenti fuori dagli elementi marcati: il cancello PUBLISH=1 non li vede').toEqual([]);
});
