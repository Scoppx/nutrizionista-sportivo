import { test, expect } from '@playwright/test';

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

test('i link esterni non aprono falle di sicurezza', async ({ page }) => {
  await page.goto('/');
  for (const a of await page.locator('a[target="_blank"]').all()) {
    await expect(a).toHaveAttribute('rel', /noopener/);
  }
});
