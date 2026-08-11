import { test, expect } from '@playwright/test';
import { PAGES } from './pages.js';

test('la hero offre WhatsApp ed email', async ({ page }) => {
  await page.goto('/');
  const hero = page.locator('section.hero');
  await expect(hero.locator('h1')).toBeVisible();

  const wa = hero.locator('a[href^="https://wa.me/"]');
  await expect(wa).toHaveCount(1);
  await expect(wa).toHaveAttribute('href', /^https:\/\/wa\.me\/\d{11,}$/);

  const mail = hero.locator('a[href^="mailto:"]');
  await expect(mail).toHaveCount(1);
});

for (const path of PAGES) {
  test(`i link esterni non aprono falle di sicurezza su ${path}`, async ({ page }) => {
    await page.goto(path);
    for (const a of await page.locator('a[target="_blank"]').all()) {
      await expect(a).toHaveAttribute('rel', /noopener/);
    }
  });
}

// Il controllo sopra parte da a[target="_blank"]: un link che non ha affatto
// target="_blank" (come il bottone WhatsApp nell'header, prima di questo fix)
// non entra mai in quel ciclo e la sua mancanza passa inosservata. Qui il
// punto di partenza è invece "ogni link verso WhatsApp", indipendentemente
// da cosa ha già impostato.
for (const path of PAGES) {
  test(`ogni link WhatsApp si apre in una nuova scheda senza aprire falle su ${path}`, async ({ page }) => {
    await page.goto(path);
    const link = page.locator('a[href^="https://wa.me/"]');
    expect(await link.count(), `nessun link WhatsApp su ${path}`).toBeGreaterThan(0);
    for (const a of await link.all()) {
      await expect(a).toHaveAttribute('target', '_blank');
      await expect(a).toHaveAttribute('rel', /noopener/);
    }
  });
}
