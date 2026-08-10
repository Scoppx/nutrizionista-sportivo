import { test, expect } from '@playwright/test';

const opacita = (loc) => loc.evaluate((el) => Number(getComputedStyle(el).opacity));

test.describe('reveal', () => {
  test('un elemento sotto la piega è nascosto e compare scrollando', async ({ page }) => {
    await page.goto('/');
    const target = page.locator('.rv').last();
    expect(await opacita(target)).toBeLessThan(0.1);

    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveClass(/\bin\b/);
    await expect.poll(() => opacita(target)).toBeGreaterThan(0.95);
  });

  test('il reveal non si ripete tornando indietro', async ({ page }) => {
    await page.goto('/');
    const target = page.locator('.rv').last();
    await target.scrollIntoViewIfNeeded();
    await expect(target).toHaveClass(/\bin\b/);
    await page.evaluate(() => window.scrollTo(0, 0));
    await page.waitForTimeout(300);
    await expect(target).toHaveClass(/\bin\b/);
  });
});

test.describe('accessibilità del movimento', () => {
  // reducedMotion va nidificato in contextOptions: in questa versione di Playwright
  // (verificato contro il pacchetto npm pubblicato) non è più una option flat come
  // colorScheme — la sintassi piatta viene accettata senza errori ma non ha alcun effetto.
  test.use({ contextOptions: { reducedMotion: 'reduce' } });
  test('con reduced motion tutto è visibile subito', async ({ page }) => {
    await page.goto('/');
    for (const el of await page.locator('.rv').all()) {
      expect(await opacita(el)).toBe(1);
      expect(await el.evaluate((n) => getComputedStyle(n).transform)).toBe('none');
    }
  });
});

test.describe('senza JavaScript', () => {
  test.use({ javaScriptEnabled: false });
  test('il contenuto resta leggibile', async ({ page }) => {
    await page.goto('/');
    for (const el of await page.locator('.rv').all()) {
      expect(await opacita(el)).toBe(1);
    }
  });
});

test.describe('sezione sticky del metodo', () => {
  test('l\'immagine cambia in base allo scroll', async ({ page }) => {
    await page.goto('/');
    const sezione = page.locator('#metodo');
    const immagini = page.locator('#metodo .metodo-img');
    await expect(immagini).toHaveCount(3);

    const vaiA = async (frazione) => {
      await sezione.evaluate((el, f) => {
        const inizio = el.offsetTop;
        const percorso = el.offsetHeight - window.innerHeight;
        window.scrollTo(0, inizio + percorso * f);
      }, frazione);
      await page.waitForTimeout(250);
    };

    await vaiA(0.05);
    await expect(immagini.nth(0)).toHaveClass(/\bon\b/);
    await vaiA(0.5);
    await expect(immagini.nth(1)).toHaveClass(/\bon\b/);
    await expect(page.locator('#metodo .metodo-cap')).toContainText('02');
    await vaiA(0.95);
    await expect(immagini.nth(2)).toHaveClass(/\bon\b/);
  });
});
