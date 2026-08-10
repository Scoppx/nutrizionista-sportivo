import { test, expect } from '@playwright/test';
import { PAGES } from './pages.js';

test('la home si carica ed è dichiarata in italiano', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page).toHaveTitle(/nutrizionista/i);
  await expect(page.locator('h1')).toHaveCount(1);
});

test('la home contiene tutte le sezioni previste', async ({ page }) => {
  await page.goto('/');
  for (const id of ['per-chi', 'chi-sono', 'percorsi', 'chi-seguo', 'faq', 'contatti']) {
    await expect(page.locator(`#${id}`), `manca la sezione #${id}`).toHaveCount(1);
  }
});

for (const path of PAGES) {
  test(`nessuna testimonianza e nessuna promessa di risultato su ${path}`, async ({ page }) => {
    await page.goto(path);
    const testo = (await page.locator('body').textContent()).toLowerCase();
    for (const vietato of ['testimonianz', 'garantit', 'prima e dopo', 'in soli', 'risultati garantiti']) {
      expect(testo, `il testo contiene "${vietato}": vietato dalla Legge 145/2018`).not.toContain(vietato);
    }
  });
}

const META = [
  { path: '/percorsi.html', h1: /percorsi/i, titolo: /percorsi/i },
  { path: '/chi-sono.html', h1: /chi sono/i, titolo: /chi sono/i },
];

for (const p of META) {
  test(`${p.path} ha intestazioni e meta propri`, async ({ page }) => {
    await page.goto(p.path);
    await expect(page.locator('h1')).toHaveText(p.h1);
    await expect(page).toHaveTitle(p.titolo);
    const desc = await page.locator('meta[name="description"]').getAttribute('content');
    expect(desc && desc.length).toBeGreaterThan(50);
    await expect(page.locator('nav a[aria-current="page"]')).toHaveCount(1);
  });
}

test('percorsi.html elenca tre percorsi, ciascuno con un prezzo', async ({ page }) => {
  await page.goto('/percorsi.html');
  const percorsi = page.locator('article.percorso');
  await expect(percorsi).toHaveCount(3);
  for (const articolo of await percorsi.all()) {
    await expect(articolo.locator('.prezzo')).toHaveText(/\d+\s?€/);
  }
});

test('chi-sono.html elenca le credenziali', async ({ page }) => {
  await page.goto('/chi-sono.html');
  const voci = page.locator('.credenziali li');
  await expect(voci).toHaveCount(4);
  for (const voce of await voci.all()) {
    const testo = await voce.textContent();
    expect(testo.trim().length, 'una voce di credenziali è vuota').toBeGreaterThan(0);
  }
  await expect(page.locator('.credenziali')).toContainText('Ordine Nazionale dei Biologi');
});
