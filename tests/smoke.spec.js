import { test, expect } from '@playwright/test';
import { PAGES } from './pages.js';

test('la home si carica ed è dichiarata in italiano', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page).toHaveTitle(/nutrizionista/i);
  await expect(page.locator('h1')).toHaveCount(1);
});

for (const path of PAGES) {
  test(`favicon dichiarato e raggiungibile su ${path}`, async ({ page, request }) => {
    await page.goto(path);
    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg');
    const risposta = await request.get('/favicon.svg');
    expect(risposta.status()).toBe(200);
  });
}

test('la home contiene tutte le sezioni previste', async ({ page }) => {
  await page.goto('/');
  for (const id of ['per-chi', 'chi-sono', 'percorsi', 'chi-seguo', 'faq', 'contatti']) {
    await expect(page.locator(`#${id}`), `manca la sezione #${id}`).toHaveCount(1);
  }
});

test('sotto i 900px i link del nav restano raggiungibili (vanno a capo, non spariscono)', async ({ page }) => {
  await page.setViewportSize({ width: 375, height: 667 });
  await page.goto('/percorsi.html');
  for (const testo of ['Chi sono', 'Percorsi', 'Contatti']) {
    await expect(page.locator('.site-header .nav-links a', { hasText: testo })).toBeVisible();
  }
  await expect(page.locator('.site-header .btn')).toBeVisible();
  // l'header sticky non deve mangiarsi una quota irragionevole di un viewport piccolo
  const altezza = await page.locator('header.site-header').evaluate((el) => el.getBoundingClientRect().height);
  expect(altezza, `header alto ${altezza}px su un viewport di 667px`).toBeLessThan(667 * 0.25);
});

test('/#contatti atterra sotto l\'header sticky, non nascosto dietro', async ({ page }) => {
  await page.goto('/#contatti');
  const headerBottom = await page.locator('header.site-header').evaluate((el) => el.getBoundingClientRect().bottom);
  const titoloTop = await page.locator('#contatti h2').evaluate((el) => el.getBoundingClientRect().top);
  expect(titoloTop, 'il titolo "Parliamone" finisce sotto l\'header sticky').toBeGreaterThanOrEqual(headerBottom);
});

// "risultati garantiti" non compare come voce a sé: è già intercettata da "garantit".
const PAROLE_VIETATE = [
  'testimonianz', 'garantit', 'prima e dopo', 'in soli',
  'sconto', 'offerta', 'promozione', 'gratis', 'omaggio', 'il miglior',
];

for (const path of PAGES) {
  test(`nessuna testimonianza e nessuna promessa di risultato su ${path}`, async ({ page }) => {
    await page.goto(path);
    // <title> e <meta name="description"> non fanno parte di body.textContent():
    // un claim vietato lì dentro (frequente in title/meta pensati per il click,
    // non per il corpo del testo) passerebbe inosservato senza includerli qui.
    const titolo = (await page.title()).toLowerCase();
    const descrizione = ((await page.locator('meta[name="description"]').getAttribute('content')) || '').toLowerCase();
    const corpo = (await page.locator('body').textContent()).toLowerCase();
    const testo = `${titolo}\n${descrizione}\n${corpo}`;
    for (const vietato of PAROLE_VIETATE) {
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
