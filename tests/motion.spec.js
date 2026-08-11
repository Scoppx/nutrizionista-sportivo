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

  test('lo stagger riparte da zero per ogni gruppo di fratelli .rv, non prosegue globale', async ({ page }) => {
    await page.goto('/');
    const ritardo = (loc) => loc.evaluate((el) => getComputedStyle(el).getPropertyValue('--rv-delay').trim());

    // "Per chi è": tre card, tutte fratelli diretti dentro .cards. Con un indice
    // globale (bug) la prima card erediterebbe l'indice successivo all'h2.rv che
    // la precede in pagina e non partirebbe da 0ms.
    const card = page.locator('#per-chi .card.rv');
    await expect(card).toHaveCount(3);
    expect(await ritardo(card.nth(0))).toBe('0ms');
    expect(await ritardo(card.nth(1))).toBe('80ms');
    expect(await ritardo(card.nth(2))).toBe('160ms');

    // FAQ: cinque righe, stesso genitore .faq. Il quinto elemento (indice 4) deve
    // ripartire da 0ms nel proprio gruppo (4 % 4 == 0), non continuare la sequenza
    // globale di pagina.
    const faq = page.locator('#faq .faq .rv');
    await expect(faq).toHaveCount(5);
    expect(await ritardo(faq.nth(0))).toBe('0ms');
    expect(await ritardo(faq.nth(4))).toBe('0ms');
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

  test('i sottotitoli sticky combaciano parola per parola con l\'elenco di fallback', async ({ page }) => {
    await page.goto('/');
    const sezione = page.locator('#metodo');

    const vaiA = async (frazione) => {
      await sezione.evaluate((el, f) => {
        const inizio = el.offsetTop;
        const percorso = el.offsetHeight - window.innerHeight;
        window.scrollTo(0, inizio + percorso * f);
      }, frazione);
      await page.waitForTimeout(250);
    };

    // testContent, non innerText: .metodo-fallback è display:none quando .js è attiva,
    // e innerText di un elemento nascosto torna vuoto — il confronto passerebbe a vuoto.
    const normalizza = (s) => s.replace(/\s+/g, ' ').trim();
    const voci = page.locator('#metodo .metodo-fallback li');
    const frazioni = [0.05, 0.5, 0.95];

    for (let i = 0; i < frazioni.length; i++) {
      await vaiA(frazioni[i]);
      const titoloSticky = normalizza(await page.locator('#metodo .metodo-titolo').textContent());
      const testoSticky = normalizza(await page.locator('#metodo .metodo-testo').textContent());
      const titoloFallback = normalizza(await voci.nth(i).locator('h3').textContent());
      const testoFallback = normalizza(await voci.nth(i).locator('p').textContent());
      expect(titoloSticky, `passo ${i}: titolo`).toBe(titoloFallback);
      expect(testoSticky, `passo ${i}: testo`).toBe(testoFallback);
    }
  });
});
