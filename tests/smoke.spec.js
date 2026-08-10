import { test, expect } from '@playwright/test';

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

test('nessuna testimonianza e nessuna promessa di risultato', async ({ page }) => {
  await page.goto('/');
  const testo = (await page.locator('body').textContent()).toLowerCase();
  for (const vietato of ['testimonianz', 'garantit', 'prima e dopo', 'in soli', 'risultati garantiti']) {
    expect(testo, `il testo contiene "${vietato}": vietato dalla Legge 145/2018`).not.toContain(vietato);
  }
});
