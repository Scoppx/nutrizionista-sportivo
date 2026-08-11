import { test, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';
import { PAGES } from './pages.js';

// Il markup fa due promesse al browser su ogni immagine: le dimensioni dichiarate
// in width/height (con cui riserva lo spazio prima di scaricarla) e i descrittori
// del srcset (con cui sceglie quale variante scaricare). Se una delle due mente,
// il danno non e' visibile in un test funzionale: la pagina "funziona" mentre
// salta il layout o il retina scarica un file morbido convinto che sia grande.
// Questi controlli confrontano le promesse con i pixel veri sul disco.

const SITE = path.join(path.dirname(fileURLToPath(import.meta.url)), '..', 'site');

const pixelVeri = async (url) => {
  const file = path.join(SITE, url.replace(/^\//, ''));
  const { width, height } = await sharp(file).metadata();
  return { file, width, height };
};

const immaginiDi = (page) =>
  page.$$eval('img', (nodi) =>
    nodi.map((n) => ({
      src: n.getAttribute('src'),
      width: n.getAttribute('width'),
      height: n.getAttribute('height'),
      srcset: n.getAttribute('srcset'),
      sorgenti: [...(n.closest('picture')?.querySelectorAll('source') ?? [])].map((s) =>
        s.getAttribute('srcset')
      ),
    }))
  );

// "/a.webp 900w, /b.webp 1800w" -> [{url: '/a.webp', larghezza: 900}, ...]
const candidate = (srcset) =>
  (srcset ?? '')
    .split(',')
    .map((v) => v.trim())
    .filter(Boolean)
    .map((v) => {
      const [url, descrittore] = v.split(/\s+/);
      return { url, larghezza: descrittore?.endsWith('w') ? Number.parseInt(descrittore, 10) : null };
    });

for (const percorso of PAGES) {
  test(`le dimensioni dichiarate su ${percorso} corrispondono ai file veri`, async ({ page }) => {
    await page.goto(percorso);

    for (const img of await immaginiDi(page)) {
      const { file, width, height } = await pixelVeri(img.src);

      expect(Number(img.width), `${file}: width dichiarata ${img.width}, reale ${width}`).toBe(width);
      expect(Number(img.height), `${file}: height dichiarata ${img.height}, reale ${height}`).toBe(height);
    }
  });

  test(`i descrittori srcset su ${percorso} corrispondono ai file veri`, async ({ page }) => {
    await page.goto(percorso);

    for (const img of await immaginiDi(page)) {
      for (const srcset of [img.srcset, ...img.sorgenti]) {
        const voci = candidate(srcset);

        // Una candidata sola non ha bisogno del descrittore: il browser non deve scegliere.
        if (voci.length === 1 && voci[0].larghezza === null) continue;

        for (const { url, larghezza } of voci) {
          const { file, width } = await pixelVeri(url);
          expect(larghezza, `${file}: candidata senza descrittore in un srcset con piu' voci`).not.toBeNull();
          expect(larghezza, `${file}: srcset dichiara ${larghezza}w, il file e' largo ${width}px`).toBe(width);
        }
      }
    }
  });
}
