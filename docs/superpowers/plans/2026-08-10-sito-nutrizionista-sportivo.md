# Sito nutrizionista sportivo — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Costruire un sito vetrina statico per un biologo nutrizionista e personal trainer, con animazioni allo scroll, contatto via WhatsApp ed email, senza alcuna richiesta di rete verso domini terzi.

**Architecture:** Quattro pagine HTML scritte a mano dentro `site/`, un foglio di stile unico basato su custom properties, un file JavaScript di ~60 righe per reveal e sezione sticky. Nessuna dipendenza a runtime e nessun build step: quello che sta in `site/` è esattamente quello che viene pubblicato. La toolchain (Playwright, html-validate, sharp) è solo di sviluppo, vive fuori da `site/` e non viene mai pubblicata.

**Tech Stack:** HTML5, CSS3 (custom properties, `position: sticky`, `IntersectionObserver`), JavaScript vanilla. Sviluppo: Node 24, Playwright, html-validate, axe-core, sharp. Server locale per i test: `python3 -m http.server`.

## Deviazioni dallo spec (due, da confermare)

**1. Il sito sta in `site/`, non nella radice.** Lo spec §3 mette `index.html` nella radice del
repository. Il piano lo sposta in `site/`, e il servizio di hosting pubblicherà quella cartella.
Motivo: pubblicando la radice finirebbero online anche `docs/` (che contiene note interne sui rischi
legali del cliente e sulla strategia dei prezzi), `tests/` e `package.json`. La struttura interna
resta identica a quella dello spec, solo annidata di un livello. Se preferisci la radice, si cambia
`--directory site` nei test e la cartella di output dell'hosting.

**2. `tools/optimize.mjs` invece di `optimize.sh`.** Uno script shell dovrebbe appoggiarsi a `sips`
(solo macOS) o a `cwebp` installato con Homebrew. Con `sharp` come dipendenza di sviluppo il
risultato è identico su qualsiasi macchina e le impostazioni di qualità restano scritte nel
repository. Il sito pubblicato non ne è toccato: lo script gira a mano, quando arrivano le foto.

## Global Constraints

Valgono per ogni task. Ogni task li eredita implicitamente.

- **Zero dipendenze a runtime.** Nessuna libreria JavaScript inclusa nelle pagine. Budget: `motion.js` sotto 3 KB non compresso.
- **Zero richieste a domini terzi.** Nessun Google Fonts remoto, nessun iframe di Google Maps, nessun analytics, nessun pixel, nessun iframe di prenotazione. Ogni risorsa arriva dallo stesso dominio. Questo è ciò che tiene il sito senza banner cookie: è un vincolo legale, non un'ottimizzazione.
- **Colori** (custom properties, valori esatti): `--bg: #fbfbfa`, `--bg-alt: #f2f2f0`, `--ink: #16181a`, `--ink-soft: #6a6f73`, `--accent: #e2542a`, `--line: #e7e7e4`.
- **L'arancio `--accent` compare solo su bottoni di contatto, numerazione del metodo, sulla singola parola in evidenza nell'`h1` della hero** (era così nel mockup approvato) **e sull'anello di focus da tastiera**. Il focus è interfaccia funzionale, non decorazione: deve essere il colore più visibile che abbiamo. Mai su testo corrente, bordi decorativi o sfondi ampi.
- **Tipografia:** una sola famiglia (Inter), self-hosted da `site/assets/fonts/`, pesi 400 e 700. Testo corrente 17px, `line-height` 1.6. Titoli con `letter-spacing` negativo.
- **Breakpoint unico a 900px**, mobile first.
- **Motion:** reveal con soglia `IntersectionObserver` 0.2, transizione 600ms, `translateY(24px)`, stagger 80ms, attivazione una sola volta. Sotto `prefers-reduced-motion: reduce` tutto è visibile subito, senza transform né transizioni.
- **Fallback senza JavaScript:** lo stato nascosto è applicato dalla regola `.js .rv`; la classe `js` viene messa su `<html>` dallo script stesso. Senza JavaScript nulla è nascosto.
- **Footer di ogni pagina:** partita IVA, numero di iscrizione all'albo, link a `privacy.html`. Obbligo di legge, non elemento di design.
- **Nessuna testimonianza, nessuna promessa di risultato, nessuna foto prima/dopo, nessuno sconto a tempo.** Legge 145/2018 sulla pubblicità sanitaria.
- **Budget prestazioni:** home sotto 800 KB trasferiti in totale.
- **Contenuti segnaposto:** ogni testo o dato non fornito dal cliente porta l'attributo `data-placeholder` sull'elemento che lo contiene. È il meccanismo che impedisce di andare online con la partita IVA inventata. Vale anche per gli elementi non visibili: `<title data-placeholder>` è HTML valido e il censimento lo trova, mentre un titolo di pagina con il nome inventato passerebbe altrimenti inosservato.

### Dati segnaposto standard (usare sempre questi, mai inventarne altri)

| Campo | Valore segnaposto |
|---|---|
| Nome | Dott. Marco Rossi |
| Qualifica | Biologo nutrizionista · Personal trainer |
| Partita IVA | 01234567890 |
| Iscrizione albo | ONB n. AA_1234 |
| WhatsApp | +39 333 000 0000 → `https://wa.me/393330000000` |
| Email | info@example.invalid |
| Studio | Via Esempio 1, Milano |
| Città (SEO) | Milano |

## File Structure

```
nutrizionista-sportivo/
  site/                        ← pubblicato online, nient'altro
    index.html                 home lunga
    percorsi.html              servizi e prezzi
    chi-sono.html              biografia, credenziali, agonismo
    privacy.html               informativa
    404.html
    _headers                   header HTTP per Cloudflare Pages
    robots.txt
    assets/
      css/style.css            reset, token, layout, componenti
      js/motion.js             reveal + sticky
      fonts/                   Inter woff2, copiati da node_modules
      img/                     .webp + fallback .jpg
  tests/
    pages.js                   elenco delle pagine, condiviso fra i test
    smoke.spec.js              struttura, lingua, titoli
    privacy.spec.js            nessuna richiesta esterna, footer legale
    contatti.spec.js           link WhatsApp ed email
    motion.spec.js             reveal, reduced-motion, no-JS, sticky
    a11y.spec.js               axe, navigazione da tastiera
    perf.spec.js               budget di peso
    placeholders.spec.js       censimento dei data-placeholder
  tools/
    optimize.mjs               ridimensiona ed esporta webp/jpg
    copy-fonts.mjs             copia Inter da node_modules a site/assets/fonts
  playwright.config.js
  package.json                 solo devDependencies
  .html-validate.json
  README.md
```

Ogni file di test copre una preoccupazione sola. `motion.spec.js` è l'unico che tocca il
comportamento dinamico; se in futuro si cambia libreria o tecnica, si riscrive quel file soltanto.

---

### Task 1: Impianto del progetto e primo test verde

**Files:**
- Create: `package.json`, `playwright.config.js`, `.html-validate.json`, `site/index.html`, `site/assets/css/style.css`, `tests/smoke.spec.js`
- Modify: `.gitignore`

**Interfaces:**
- Consumes: niente (primo task).
- Produces: comando `npm test` funzionante; server di test su `http://localhost:4173` che serve `site/`; `site/assets/css/style.css` caricato da ogni pagina.

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/smoke.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('la home si carica ed è dichiarata in italiano', async ({ page }) => {
  await page.goto('/');
  await expect(page.locator('html')).toHaveAttribute('lang', 'it');
  await expect(page).toHaveTitle(/nutrizionista/i);
  await expect(page.locator('h1')).toHaveCount(1);
});
```

- [ ] **Step 2: Creare la configurazione minima per poterlo eseguire**

`package.json`:

```json
{
  "name": "nutrizionista-sportivo",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "python3 -m http.server 4173 --directory site",
    "test": "playwright test",
    "validate": "html-validate \"site/**/*.html\"",
    "fonts": "node tools/copy-fonts.mjs",
    "images": "node tools/optimize.mjs"
  },
  "devDependencies": {
    "@axe-core/playwright": "^4.10.1",
    "@fontsource-variable/inter": "^5.1.0",
    "@playwright/test": "^1.50.0",
    "html-validate": "^9.0.0",
    "sharp": "^0.35.0"
  }
}
```

`playwright.config.js`:

```js
import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
  testDir: './tests',
  use: { baseURL: 'http://localhost:4173' },
  projects: [
    { name: 'mobile', use: { ...devices['iPhone 13'] } },
    { name: 'desktop', use: { ...devices['Desktop Chrome'] } },
  ],
  webServer: {
    command: 'python3 -m http.server 4173 --directory site',
    url: 'http://localhost:4173',
    reuseExistingServer: true,
  },
});
```

`.html-validate.json`:

```json
{ "extends": ["html-validate:recommended"] }
```

Aggiungere a `.gitignore`:

```
node_modules/
test-results/
playwright-report/
```

- [ ] **Step 3: Installare e verificare che il test fallisca**

Run: `npm install && npx playwright install chromium webkit && npm test`
Expected: FAIL — il server risponde con l'elenco della cartella, `site/index.html` non esiste.

- [ ] **Step 4: Scrivere il minimo che fa passare il test**

`site/index.html`:

```html
<!DOCTYPE html>
<html lang="it">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <title>Dott. Marco Rossi — Biologo nutrizionista a Milano</title>
  <meta name="description" content="Nutrizione sportiva e alimentazione per la salute a Milano. Percorsi su misura per chi si allena e per chi vuole stare bene.">
  <link rel="stylesheet" href="/assets/css/style.css">
</head>
<body>
  <main>
    <h1 data-placeholder>Nutrizionista. E atleta.</h1>
  </main>
</body>
</html>
```

`site/assets/css/style.css`:

```css
*, *::before, *::after { box-sizing: border-box; }
* { margin: 0; }
html { -webkit-text-size-adjust: 100%; }
img, picture, video { display: block; max-width: 100%; }

:root {
  --bg: #fbfbfa;
  --bg-alt: #f2f2f0;
  --ink: #16181a;
  --ink-soft: #6a6f73;
  --accent: #e2542a;
  --line: #e7e7e4;
  --wrap: 1080px;
  --gap: clamp(1.25rem, 4vw, 2.5rem);
}

body {
  background: var(--bg);
  color: var(--ink);
  font: 400 17px/1.6 system-ui, -apple-system, sans-serif;
}
```

Il font di sistema è temporaneo: Inter arriva nel Task 3.

- [ ] **Step 5: Eseguire il test e verificare che passi**

Run: `npm test -- tests/smoke.spec.js`
Expected: PASS su entrambi i progetti (mobile, desktop).

- [ ] **Step 6: Commit**

```bash
git add package.json package-lock.json playwright.config.js .html-validate.json .gitignore site tests
git commit -m "chore: impianto progetto, server di test e smoke test"
```

---

### Task 2: Header, footer legale e le quattro pagine

**Files:**
- Create: `site/percorsi.html`, `site/chi-sono.html`, `site/privacy.html`, `tests/pages.js`, `tests/privacy.spec.js`
- Modify: `site/index.html`, `site/assets/css/style.css`

**Interfaces:**
- Consumes: `style.css` e i token colore del Task 1.
- Produces: markup di header e footer identico su tutte e quattro le pagine; classi `.site-header`, `.site-footer`, `.wrap`; modulo `tests/pages.js` che esporta `PAGES`.

- [ ] **Step 1: Scrivere i test che falliscono**

`tests/pages.js` — modulo semplice, non un file di test. L'elenco non può stare dentro uno `.spec.js`:
importarlo da un altro file di test registrerebbe due volte gli stessi test e Playwright darebbe errore.

```js
export const PAGES = ['/', '/percorsi.html', '/chi-sono.html', '/privacy.html', '/404.html'];
```

`tests/privacy.spec.js`:

```js
import { test, expect } from '@playwright/test';
import { PAGES } from './pages.js';

test.describe('conformità di base', () => {
  for (const path of PAGES) {
    test(`nessuna richiesta esterna su ${path}`, async ({ page }) => {
      const esterne = [];
      page.on('request', (req) => {
        const url = new URL(req.url());
        if (url.hostname !== 'localhost' && url.protocol !== 'data:') esterne.push(req.url());
      });
      await page.goto(path, { waitUntil: 'networkidle' });
      expect(esterne, `richieste verso domini terzi: ${esterne.join(', ')}`).toEqual([]);
    });

    test(`footer legale presente su ${path}`, async ({ page }) => {
      await page.goto(path);
      const footer = page.locator('footer.site-footer');
      await expect(footer).toContainText(/P\.?\s?IVA/i);
      await expect(footer).toContainText(/ONB n\./i);
      await expect(footer.locator('a[href$="privacy.html"]')).toHaveCount(1);
    });
  }
});
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/privacy.spec.js`
Expected: FAIL — le pagine `/percorsi.html`, `/chi-sono.html`, `/privacy.html` danno 404 e non esiste nessun `footer.site-footer`.

- [ ] **Step 3: Scrivere header e footer, e replicarli su tutte le pagine**

Blocco header, subito dopo `<body>` in ogni pagina (`aria-current="page"` va spostato sulla voce corrispondente alla pagina):

```html
<a class="skip" href="#contenuto">Vai al contenuto</a>
<header class="site-header">
  <div class="wrap">
    <a class="logo" href="/" data-placeholder>Dott. Marco Rossi</a>
    <nav aria-label="Principale">
      <a href="/chi-sono.html">Chi sono</a>
      <a href="/percorsi.html">Percorsi</a>
      <a href="/#contatti">Contatti</a>
      <a class="btn btn-accent" href="https://wa.me/393330000000" data-placeholder>Scrivimi</a>
    </nav>
  </div>
</header>
```

Blocco footer, prima di `</body>` in ogni pagina:

```html
<footer class="site-footer">
  <div class="wrap">
    <p data-placeholder><strong>Dott. Marco Rossi</strong> — Biologo nutrizionista · Personal trainer</p>
    <p data-placeholder>P. IVA 01234567890 · Iscrizione ONB n. AA_1234</p>
    <p data-placeholder>Via Esempio 1, Milano</p>
  </div>
</footer>
```

Le tre nuove pagine ripetono la struttura di `index.html` (stessa `<head>`, con `<title>` e
`description` propri) e contengono per ora solo `<main id="contenuto"><h1>…</h1></main>`:
"Percorsi", "Chi sono", "Privacy".

- [ ] **Step 4: Aggiungere il CSS di header, footer e contenitore**

```css
.wrap { width: min(100% - 2.5rem, var(--wrap)); margin-inline: auto; }

.skip { position: absolute; left: -9999px; }
.skip:focus { left: 1rem; top: 1rem; background: var(--ink); color: #fff; padding: .6rem 1rem; z-index: 99; }

.site-header { border-bottom: 1px solid var(--line); position: sticky; top: 0; background: var(--bg); z-index: 50; }
.site-header .wrap { display: flex; align-items: center; justify-content: space-between; gap: 1rem; padding: .9rem 0; }
.logo { font-weight: 700; letter-spacing: .04em; text-decoration: none; color: var(--ink); }
.site-header nav { display: flex; align-items: center; gap: 1.25rem; }
.site-header nav a { color: var(--ink-soft); text-decoration: none; font-size: .95rem; }
.site-header nav a:hover, .site-header nav a[aria-current="page"] { color: var(--ink); }

.btn { display: inline-block; padding: .7rem 1.2rem; border-radius: 99px; font-weight: 700; text-decoration: none; }
.btn-accent { background: var(--accent); color: #fff; }
.btn-ink { background: var(--ink); color: #fff; }

.site-footer { border-top: 1px solid var(--line); margin-top: 4rem; padding: 2.5rem 0; color: var(--ink-soft); font-size: .9rem; }
.site-footer p + p { margin-top: .35rem; }
.site-footer a { color: var(--ink); }

@media (max-width: 900px) {
  .site-header nav a:not(.btn) { display: none; }
}
```

Sotto i 900px il menu testuale sparisce e resta il bottone di contatto: su un sito di quattro pagine
un menu a panino aggiungerebbe JavaScript senza dare nulla in cambio. La navigazione completa resta
raggiungibile dai link nel footer, che vengono aggiunti nel Task 9.

- [ ] **Step 5: Eseguire i test e verificare che passino**

Run: `npm test -- tests/privacy.spec.js && npm run validate`
Expected: PASS su tutte le combinazioni pagina/progetto; html-validate senza errori.

- [ ] **Step 6: Commit**

```bash
git add site tests/pages.js tests/privacy.spec.js
git commit -m "feat: header, footer legale e scheletro delle quattro pagine"
```

---

### Task 3: Tipografia self-hosted

**Files:**
- Create: `tools/copy-fonts.mjs`
- Modify: `site/assets/css/style.css`, `.gitignore`
- Test: `tests/privacy.spec.js` (già scritto: il test "nessuna richiesta esterna" copre anche i font)

**Interfaces:**
- Consumes: `PAGES` da `tests/privacy.spec.js`.
- Produces: `site/assets/fonts/inter-variable.woff2` (un solo file variabile, pesi 100-900); famiglia CSS `Inter` disponibile ovunque.

- [ ] **Step 1: Scrivere il test che fallisce**

Aggiungere in coda a `tests/privacy.spec.js`:

```js
for (const path of PAGES) {
  test(`i font di ${path} sono serviti dal nostro dominio`, async ({ page }) => {
    const font = [];
    page.on('request', (req) => { if (req.resourceType() === 'font') font.push(req.url()); });
    await page.goto(path, { waitUntil: 'networkidle' });
    expect(font.length, 'nessun font caricato: Inter non è agganciato').toBeGreaterThan(0);
    for (const u of font) expect(new URL(u).hostname).toBe('localhost');
  });
}
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/privacy.spec.js -g "font"`
Expected: FAIL — "nessun font caricato: Inter non è agganciato".

- [ ] **Step 3: Scrivere lo script di copia**

`tools/copy-fonts.mjs`:

```js
import { copyFile, mkdir } from 'node:fs/promises';

const dest = 'site/assets/fonts';
await mkdir(dest, { recursive: true });

const src = 'node_modules/@fontsource-variable/inter/files';
await copyFile(`${src}/inter-latin-wght-normal.woff2`, `${dest}/inter-variable.woff2`);

console.log('font copiati in', dest);
```

Run: `npm run fonts`

- [ ] **Step 4: Agganciare il font nel CSS e precaricarlo**

In testa a `style.css`:

```css
@font-face {
  font-family: 'Inter';
  font-style: normal;
  font-weight: 100 900;
  font-display: swap;
  src: url('/assets/fonts/inter-variable.woff2') format('woff2-variations');
}
```

Aggiornare `body`:

```css
body { font: 400 17px/1.6 'Inter', system-ui, -apple-system, sans-serif; }
h1, h2, h3 { font-weight: 700; letter-spacing: -.03em; line-height: 1.1; }
h1 { font-size: clamp(2.4rem, 7vw, 4rem); }
h2 { font-size: clamp(1.8rem, 4vw, 2.6rem); }
h3 { font-size: 1.15rem; }
p { max-width: 62ch; }
```

In `<head>` di ogni pagina, prima del foglio di stile:

```html
<link rel="preload" href="/assets/fonts/inter-variable.woff2" as="font" type="font/woff2" crossorigin>
```

Il file woff2 va committato: è il sito, non una dipendenza. `node_modules/` resta ignorato.

- [ ] **Step 5: Eseguire i test**

Run: `npm test -- tests/privacy.spec.js`
Expected: PASS, incluso il test sul font.

- [ ] **Step 6: Commit**

```bash
git add site tools/copy-fonts.mjs tests/privacy.spec.js
git commit -m "feat: Inter self-hosted e scala tipografica"
```

---

### Task 4: Hero e call to action di contatto

**Files:**
- Create: `tests/contatti.spec.js`
- Modify: `site/index.html`, `site/assets/css/style.css`

**Interfaces:**
- Consumes: `.btn`, `.btn-accent`, `.btn-ink`, `.wrap` dal Task 2.
- Produces: `section.hero` con `.hero-grid`, `.hero-text`, `.hero-media`, `.eyebrow`, `.lead`, `.hero-cta`; convenzione dei link di contatto (`https://wa.me/<numero>` e `mailto:`). L'ancora `#contatti` NON sta qui: è della sezione contatti in fondo alla home, creata nel Task 5.

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/contatti.spec.js`:

```js
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

for (const path of PAGES) {
 test(`i link esterni di ${path} non aprono falle di sicurezza`, async ({ page }) => {
  await page.goto(path);
  for (const a of await page.locator('a[target="_blank"]').all()) {
    await expect(a).toHaveAttribute('rel', /noopener/);
  }
});
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/contatti.spec.js`
Expected: FAIL — `section.hero` non esiste.

- [ ] **Step 3: Scrivere la hero**

Dentro `<main id="contenuto">` di `index.html`, sostituendo l'`h1` provvisorio:

```html
<section class="hero">
  <div class="wrap hero-grid">
    <div class="hero-text">
      <p class="eyebrow" data-placeholder>Biologo nutrizionista · Personal trainer · Milano</p>
      <h1>Nutrizionista.<br>E <em>atleta</em>.</h1>
      <p class="lead" data-placeholder>
        Ho gareggiato nel bodybuilding e seguo chi si allena e chi vuole semplicemente stare meglio.
        Piani costruiti sulle tue giornate, non su una tabella standard.
      </p>
      <div class="hero-cta">
        <a class="btn btn-accent" href="https://wa.me/393330000000" target="_blank" rel="noopener" data-placeholder>Scrivimi su WhatsApp</a>
        <a class="btn btn-ink" href="mailto:info@example.invalid" data-placeholder>Mandami una email</a>
      </div>
    </div>
    <div class="hero-media">
      <img src="/assets/img/hero.jpg" alt="Ritratto del nutrizionista nel suo studio" width="900" height="1100" fetchpriority="high" data-placeholder>
    </div>
  </div>
</section>
```

Fino al Task 10 va bene un file `site/assets/img/hero.jpg` qualunque, purché locale: scaricarne uno
una volta sola, mai referenziare un dominio esterno.

- [ ] **Step 4: Scrivere il CSS della hero**

```css
.hero { padding: clamp(2.5rem, 8vw, 5.5rem) 0; }
.hero-grid { display: grid; gap: var(--gap); align-items: center; }
.eyebrow { font-size: .82rem; letter-spacing: .12em; text-transform: uppercase; color: var(--ink-soft); margin-bottom: 1rem; }
.hero h1 em { font-style: normal; color: var(--accent); }
.lead { font-size: 1.15rem; color: var(--ink-soft); margin-top: 1.25rem; }
.hero-cta { display: flex; flex-wrap: wrap; gap: .75rem; margin-top: 2rem; }
.hero-media img { width: 100%; height: auto; border-radius: 16px; object-fit: cover; }

@media (min-width: 900px) {
  .hero-grid { grid-template-columns: 1.1fr .9fr; }
}
```

- [ ] **Step 5: Eseguire i test**

Run: `npm test -- tests/contatti.spec.js && npm run validate`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add site tests/contatti.spec.js
git commit -m "feat: hero con contatto WhatsApp ed email"
```

---

### Task 5: Sezioni statiche della home

**Files:**
- Modify: `site/index.html`, `site/assets/css/style.css`
- Test: `tests/smoke.spec.js`

**Interfaces:**
- Consumes: `.wrap`, `.btn`, `.hero-cta` dai Task 2 e 4.
- Produces: ancore `#per-chi`, `#chi-sono`, `#percorsi`, `#faq`, `#contatti`; classi `.cards`, `.card`, `.faq`.

Le classi `.rv` si scrivono già qui, sugli elementi che dovranno comparire allo scroll, ma restano
inerti: il CSS e lo script che le attivano arrivano nel Task 6. Scriverle ora evita di ripassare su
tutto il markup dopo.

- [ ] **Step 1: Scrivere il test che fallisce**

Aggiungere a `tests/smoke.spec.js`:

```js
test('la home contiene tutte le sezioni previste', async ({ page }) => {
  await page.goto('/');
  for (const id of ['per-chi', 'chi-sono', 'percorsi', 'chi-seguo', 'faq', 'contatti']) {
    await expect(page.locator(`#${id}`), `manca la sezione #${id}`).toHaveCount(1);
  }
});

for (const path of PAGES) {
 test(`nessuna testimonianza ne promessa di risultato su ${path}`, async ({ page }) => {
  await page.goto(path);
  // textContent, non innerText: le risposte delle FAQ stanno dentro <details>
  // chiusi e innerText non le vede, quindi una frase vietata passerebbe
  const testo = ((await page.locator('body').textContent()) || '').toLowerCase();
  for (const vietato of ['testimonianz', 'garantit', 'prima e dopo', 'in soli', 'risultati garantiti']) {
    expect(testo, `il testo contiene "${vietato}": vietato dalla Legge 145/2018`).not.toContain(vietato);
  }
});
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/smoke.spec.js`
Expected: FAIL — mancano `#per-chi`, `#chi-sono`, `#percorsi`, `#chi-seguo`, `#faq`, `#contatti`.

- [ ] **Step 3: Scrivere le sezioni**

Aggiungere, nell'ordine, dentro `main`, dopo la hero:

```html
<section id="per-chi" class="sezione wrap">
  <h2 class="rv">Per chi è</h2>
  <div class="cards">
    <article class="card rv" data-placeholder>
      <h3>Ti alleni in palestra</h3>
      <p>Massa, definizione, ricomposizione. L'alimentazione costruita intorno alla scheda, non contro.</p>
    </article>
    <article class="card rv" data-placeholder>
      <h3>Vuoi dimagrire e stare bene</h3>
      <p>Percorsi sostenibili, senza alimenti proibiti e senza bilancia in mano a ogni pasto.</p>
    </article>
    <article class="card rv" data-placeholder>
      <h3>Hai esigenze sportive precise</h3>
      <p>Gare, preparazioni, gestione del peso di categoria, integrazione ragionata.</p>
    </article>
  </div>
</section>

<section id="chi-sono" class="sezione wrap due-colonne">
  <div class="rv">
    <img src="/assets/img/ritratto.jpg" alt="Il nutrizionista nel suo studio" width="900" height="1100" loading="lazy" data-placeholder>
  </div>
  <div class="rv" data-placeholder>
    <h2>Chi sono</h2>
    <p>Biologo nutrizionista iscritto all'Ordine Nazionale dei Biologi e personal trainer. Ho gareggiato nel bodybuilding: so cosa chiede una preparazione e cosa costa mantenerla.</p>
    <ul class="credenziali">
      <li>Laurea magistrale in Scienze della Nutrizione Umana</li>
      <li>Iscrizione ONB n. AA_1234</li>
      <li>Personal trainer certificato</li>
      <li>Atleta agonista di bodybuilding</li>
    </ul>
    <a class="btn btn-ink" href="/chi-sono.html">Il percorso completo</a>
  </div>
</section>

<section id="percorsi" class="sezione wrap">
  <h2 class="rv">Percorsi</h2>
  <div class="cards">
    <article class="card rv" data-placeholder><h3>Prima visita</h3><p>Valutazione completa e piano iniziale.</p><p class="prezzo">da 90 €</p></article>
    <article class="card rv" data-placeholder><h3>Percorso sportivo</h3><p>Tre mesi, controlli ogni tre settimane.</p><p class="prezzo">da 240 €</p></article>
    <article class="card rv" data-placeholder><h3>Percorso benessere</h3><p>Tre mesi, controlli mensili.</p><p class="prezzo">da 200 €</p></article>
  </div>
  <p class="rv"><a class="btn btn-ink" href="/percorsi.html">Cosa include ogni percorso</a></p>
</section>

<section id="chi-seguo" class="sezione wrap rv" data-placeholder>
  <h2>Chi seguo di solito</h2>
  <p>Persone che si allenano tre o quattro volte a settimana e non riescono a far quadrare gli orari dei pasti. Chi arriva dopo diete troppo rigide e ha paura di rimettere peso. Chi si prepara per una gara e deve arrivarci senza svuotarsi.</p>
</section>

<section id="faq" class="sezione wrap">
  <h2 class="rv">Domande frequenti</h2>
  <div class="faq" data-placeholder>
    <details class="rv"><summary>Quanto costa?</summary><p>La prima visita parte da 90 €. I percorsi completi sono indicati nella pagina Percorsi.</p></details>
    <details class="rv"><summary>Quanto dura un percorso?</summary><p>In genere tre mesi, con controlli ogni tre o quattro settimane.</p></details>
    <details class="rv"><summary>Si lavora anche online?</summary><p>Sì, con videochiamata e misurazioni concordate insieme.</p></details>
    <details class="rv"><summary>Devo pesare tutti gli alimenti?</summary><p>All'inizio è utile per prendere le misure. Poi si passa a riferimenti pratici.</p></details>
    <details class="rv"><summary>Serve la ricetta del medico?</summary><p>No. In presenza di patologie in corso resta però utile il confronto con il medico curante.</p></details>
  </div>
</section>

<section id="contatti" class="sezione wrap contatti rv">
  <h2>Parliamone</h2>
  <p data-placeholder>Scrivimi: rispondo di persona, di solito in giornata.</p>
  <div class="hero-cta">
    <a class="btn btn-accent" href="https://wa.me/393330000000" target="_blank" rel="noopener" data-placeholder>Scrivimi su WhatsApp</a>
    <a class="btn btn-ink" href="mailto:info@example.invalid" data-placeholder>Mandami una email</a>
  </div>
  <address data-placeholder>
    Studio: Via Esempio 1, Milano<br>
    Lunedì-venerdì, 9:00-19:00
  </address>
  <a href="https://www.openstreetmap.org/" target="_blank" rel="noopener" data-placeholder>
    <img src="/assets/img/mappa.jpg" alt="Mappa della zona dello studio" width="1200" height="600" loading="lazy">
  </a>
</section>
```

La mappa è un'immagine statica dentro un link: un `iframe` di Google Maps trasferirebbe l'IP di ogni
visitatore e farebbe scattare informativa e banner. L'immagine va esportata a mano da OpenStreetMap.

- [ ] **Step 4: Scrivere il CSS**

```css
.sezione { padding: clamp(3rem, 9vw, 6rem) 0; }
.sezione > h2 { margin-bottom: 2rem; }

.cards { display: grid; gap: 1.25rem; }
.card { background: var(--bg-alt); border: 1px solid var(--line); border-radius: 14px; padding: 1.5rem; }
.card h3 { margin-bottom: .5rem; }
.card p { color: var(--ink-soft); }
.prezzo { margin-top: 1rem; font-weight: 700; color: var(--ink); }

.due-colonne { display: grid; gap: var(--gap); align-items: center; }
.due-colonne img { border-radius: 16px; }
.credenziali { margin: 1.25rem 0; padding-left: 1.1rem; color: var(--ink-soft); }

.faq details { border-bottom: 1px solid var(--line); padding: 1rem 0; }
.faq summary { cursor: pointer; font-weight: 700; }
.faq p { margin-top: .6rem; color: var(--ink-soft); }

.contatti address { font-style: normal; color: var(--ink-soft); margin: 1.5rem 0; }
.contatti img { border-radius: 14px; }

@media (min-width: 900px) {
  .cards { grid-template-columns: repeat(3, 1fr); }
  .due-colonne { grid-template-columns: .9fr 1.1fr; }
}
```

- [ ] **Step 5: Eseguire i test**

Run: `npm test && npm run validate`
Expected: PASS. Se il test sulle parole vietate fallisce, è il testo a dover cambiare, non il test.

- [ ] **Step 6: Commit**

```bash
git add site tests/smoke.spec.js
git commit -m "feat: sezioni statiche della home"
```

---

### Task 6: Reveal allo scroll

**Files:**
- Create: `site/assets/js/motion.js`, `tests/motion.spec.js`
- Modify: `site/index.html` (e le altre tre pagine), `site/assets/css/style.css`

**Interfaces:**
- Consumes: la hero del Task 4 e le sezioni della home del Task 5 — servono elementi `.rv` reali sotto la piega su cui i test possano lavorare.
- Produces: comportamento della classe `.rv` (elemento da rivelare), `.rv.in` (rivelato), classe `js` su `<html>`, variabile CSS `--rv-delay` per lo stagger. Le sezioni dei task successivi useranno `.rv` senza dover toccare `motion.js`.

- [ ] **Step 1: Scrivere i test che falliscono**

`tests/motion.spec.js`:

```js
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
  test.use({ reducedMotion: 'reduce' });
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
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/motion.spec.js`
Expected: FAIL — nessun elemento `.rv` nel documento.

- [ ] **Step 3: Scrivere `motion.js`**

`site/assets/js/motion.js`:

```js
(() => {
  const root = document.documentElement;
  const ridotto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  if (ridotto) return;              // niente classe js: il CSS non nasconde nulla
  if (!('IntersectionObserver' in window)) return;  // senza observer non riveleremmo piu nulla

  root.classList.add('js');

  const osservatore = new IntersectionObserver((voci) => {
    for (const voce of voci) {
      if (!voce.isIntersecting) continue;
      voce.target.classList.add('in');
      osservatore.unobserve(voce.target);   // una volta sola
    }
  }, { threshold: 0.2 });

  document.querySelectorAll('.rv').forEach((el, i) => {
    el.style.setProperty('--rv-delay', `${(i % 4) * 80}ms`);
    osservatore.observe(el);
  });
})();
```

Lo stagger riparte ogni quattro elementi: in un gruppo lungo un ritardo crescente all'infinito
lascerebbe l'ultima card ferma per secondi.

- [ ] **Step 4: Agganciare CSS e script**

```css
.js .rv { opacity: 0; transform: translateY(24px); }
.js .rv.in {
  opacity: 1;
  transform: none;
  transition: opacity .6s ease var(--rv-delay, 0ms),
              transform .6s cubic-bezier(.2,.7,.2,1) var(--rv-delay, 0ms);
}

@media (prefers-reduced-motion: reduce) {
  .js .rv, .js .rv.in { opacity: 1; transform: none; transition: none; }
}
```

Prima di `</body>` in tutte e quattro le pagine:

```html
<script src="/assets/js/motion.js" defer></script>
```

Aggiungere `class="rv"` a `.hero-text` e `.hero-media`. Le sezioni della home hanno già le loro
classi `.rv` dal Task 5: da questo momento smettono di essere inerti.

- [ ] **Step 5: Eseguire i test**

Run: `npm test -- tests/motion.spec.js`
Expected: PASS su tutti e tre i gruppi (reveal, reduced motion, senza JavaScript).

- [ ] **Step 6: Commit**

```bash
git add site tests/motion.spec.js
git commit -m "feat: reveal allo scroll con fallback reduced-motion e no-JS"
```

---

### Task 7: Sezione sticky del metodo

**Files:**
- Modify: `site/index.html`, `site/assets/css/style.css`, `site/assets/js/motion.js`, `tests/motion.spec.js`

**Interfaces:**
- Consumes: la struttura di `motion.js` dal Task 6.
- Produces: `section#metodo` con `.metodo-track`, `.metodo-stage`, tre `.metodo-img` di cui una con classe `on`, `.metodo-cap`, `.metodo-dots`.

- [ ] **Step 1: Scrivere il test che fallisce**

Aggiungere a `tests/motion.spec.js`:

```js
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
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/motion.spec.js -g "metodo"`
Expected: FAIL — `#metodo` non esiste.

- [ ] **Step 3: Scrivere il markup**

In `index.html`, fra la sezione `#per-chi` e la sezione `#chi-sono` (l'ordine della home è quello
dello spec §4: hero, per chi è, metodo, chi sono, percorsi, chi seguo, FAQ, contatti):

```html
<section id="metodo" class="metodo">
  <div class="metodo-track">
    <div class="metodo-stage">
      <img class="metodo-img on" src="/assets/img/metodo-1.jpg" alt="Valutazione della composizione corporea" width="1200" height="900" loading="lazy" data-placeholder>
      <img class="metodo-img" src="/assets/img/metodo-2.jpg" alt="Costruzione del piano alimentare" width="1200" height="900" loading="lazy" data-placeholder>
      <img class="metodo-img" src="/assets/img/metodo-3.jpg" alt="Controllo dei progressi" width="1200" height="900" loading="lazy" data-placeholder>
      <ol class="metodo-dots" aria-hidden="true"><li class="on"></li><li></li><li></li></ol>
      <div class="metodo-cap">
        <p class="metodo-label">Il metodo</p>
        <h2 class="metodo-titolo">01 · Valutazione</h2>
        <p class="metodo-testo">Composizione corporea, allenamento, orari, abitudini. Prima di scrivere qualsiasi cosa.</p>
      </div>
    </div>
  </div>
  <ol class="metodo-fallback wrap">
    <li><h3>01 · Valutazione</h3><p>Composizione corporea, allenamento, orari, abitudini. Prima di scrivere qualsiasi cosa.</p></li>
    <li><h3>02 · Piano</h3><p>Calorie e distribuzione costruite intorno ai tuoi allenamenti.</p></li>
    <li><h3>03 · Controlli</h3><p>Aggiustamenti ogni tre o quattro settimane, con i numeri alla mano.</p></li>
  </ol>
</section>
```

`.metodo-fallback` è la stessa informazione in forma di elenco: è ciò che vede chi non ha
JavaScript e ciò che legge un motore di ricerca. Con JavaScript attivo viene nascosto.

I tre testi esistono due volte: nell'array `passi` di `motion.js` e qui. Un test di parità confronta
le due copie parola per parola — senza, la prima modifica al testo le fa divergere in silenzio e chi
non ha JavaScript legge meno di chi ce l'ha.

- [ ] **Step 4: Scrivere il CSS**

```css
.metodo { background: var(--ink); color: #fff; }
.metodo-track { display: none; }
.js .metodo-track { display: block; height: 300vh; position: relative; }
.js .metodo-fallback { display: none; }

.metodo-fallback { list-style: none; padding: 3rem 0; display: grid; gap: 2rem; }
.metodo-fallback h3 { color: var(--accent); }

.metodo-stage { position: sticky; top: 0; height: 100vh; overflow: hidden; }
.metodo-img { position: absolute; inset: 0; width: 100%; height: 100%; object-fit: cover; opacity: 0; transition: opacity .4s linear; }
.metodo-img.on { opacity: 1; }

.metodo-cap { position: absolute; inset: auto 0 0 0; padding: clamp(1.5rem, 5vw, 3.5rem); background: linear-gradient(transparent, rgba(0,0,0,.85)); }
.metodo-label { font-size: .8rem; letter-spacing: .14em; text-transform: uppercase; color: var(--accent); }
.metodo-titolo { margin: .5rem 0; }
.metodo-testo { color: rgba(255,255,255,.85); }

.metodo-dots { position: absolute; right: 1.25rem; top: 50%; translate: 0 -50%; list-style: none; padding: 0; display: grid; gap: .5rem; }
.metodo-dots li { width: 6px; height: 6px; border-radius: 99px; background: rgba(255,255,255,.35); transition: height .3s; }
.metodo-dots li.on { background: #fff; height: 20px; }

@media (prefers-reduced-motion: reduce) {
  .js .metodo-track { display: none; }
  .js .metodo-fallback { display: grid; }
}
```

Con `prefers-reduced-motion` la sezione sticky sparisce del tutto e resta l'elenco: è la soluzione
onesta, un'animazione "attenuata" alta tre schermate resta comunque disorientante.

- [ ] **Step 5: Aggiungere lo scrub a `motion.js`**

Prima della chiusura della funzione anonima:

```js
  const sezione = document.querySelector('#metodo');
  if (sezione) {
    const track = sezione.querySelector('.metodo-track');
    const immagini = [...sezione.querySelectorAll('.metodo-img')];
    const punti = [...sezione.querySelectorAll('.metodo-dots li')];
    const titolo = sezione.querySelector('.metodo-titolo');
    const testo = sezione.querySelector('.metodo-testo');
    const passi = [
      ['01 · Valutazione', 'Composizione corporea, allenamento, orari, abitudini. Prima di scrivere qualsiasi cosa.'],
      ['02 · Piano', 'Calorie e distribuzione costruite intorno ai tuoi allenamenti.'],
      ['03 · Controlli', 'Aggiustamenti ogni tre o quattro settimane, con i numeri alla mano.'],
    ];

    let attivo = -1;
    let inCoda = false;

    const aggiorna = () => {
      inCoda = false;
      const percorso = track.offsetHeight - window.innerHeight;
      const fatto = (window.scrollY - track.offsetTop) / percorso;
      const i = fatto < 0.34 ? 0 : fatto < 0.68 ? 1 : 2;
      if (i === attivo) return;
      attivo = i;
      immagini.forEach((im, k) => im.classList.toggle('on', k === i));
      punti.forEach((p, k) => p.classList.toggle('on', k === i));
      titolo.textContent = passi[i][0];
      testo.textContent = passi[i][1];
    };

    window.addEventListener('scroll', () => {
      if (inCoda) return;
      inCoda = true;
      requestAnimationFrame(aggiorna);
    }, { passive: true });
    aggiorna();
  }
```

`inCoda` accorpa gli eventi di scroll: senza, su un trackpad si eseguono decine di aggiornamenti per
fotogramma.

- [ ] **Step 6: Eseguire tutti i test di motion**

Run: `npm test -- tests/motion.spec.js`
Expected: PASS, compresi i test del reveal scritti nel Task 6 (nessuna regressione).

- [ ] **Step 7: Commit**

```bash
git add site tests/motion.spec.js
git commit -m "feat: sezione sticky del metodo con fallback a elenco"
```

---

### Task 8: Pagine Percorsi e Chi sono

**Files:**
- Modify: `site/percorsi.html`, `site/chi-sono.html`, `site/assets/css/style.css`, `tests/smoke.spec.js`

**Interfaces:**
- Consumes: header, footer, `.card`, `.rv`, `.sezione`.
- Produces: pagine con `<h1>` proprio, `title` e `description` propri, `aria-current="page"` sulla voce di menu corrispondente.

- [ ] **Step 1: Scrivere il test che fallisce**

Aggiungere a `tests/smoke.spec.js`:

```js
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
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/smoke.spec.js -g "meta propri"`
Expected: FAIL — manca la `description` e manca `aria-current`.

- [ ] **Step 3: Scrivere `percorsi.html`**

```html
<main id="contenuto">
  <section class="sezione wrap">
    <h1>Percorsi</h1>
    <p class="lead" data-placeholder>Tre modi di lavorare insieme. Quello che segue è cosa è incluso, cosa non lo è e quanto costa.</p>

    <article class="percorso rv" data-placeholder>
      <h2>Prima visita</h2>
      <p><strong>Per chi:</strong> chi vuole capire da dove partire.</p>
      <p><strong>Include:</strong> anamnesi, misurazioni, analisi delle abitudini, piano iniziale scritto.</p>
      <p><strong>Non include:</strong> controlli successivi, che si concordano a parte.</p>
      <p><strong>Durata:</strong> circa 60 minuti.</p>
      <p class="prezzo">da 90 €</p>
    </article>

    <article class="percorso rv" data-placeholder>
      <h2>Percorso sportivo</h2>
      <p><strong>Per chi:</strong> chi si allena con continuità e ha un obiettivo definito.</p>
      <p><strong>Include:</strong> prima visita, piano costruito sui giorni di allenamento, tre controlli, contatto scritto tra un controllo e l'altro.</p>
      <p><strong>Non include:</strong> schede di allenamento, che si valutano separatamente.</p>
      <p><strong>Durata:</strong> tre mesi.</p>
      <p class="prezzo">da 240 €</p>
    </article>

    <article class="percorso rv" data-placeholder>
      <h2>Percorso benessere</h2>
      <p><strong>Per chi:</strong> chi vuole perdere peso o rimettere ordine nell'alimentazione.</p>
      <p><strong>Include:</strong> prima visita, piano, controlli mensili.</p>
      <p><strong>Non include:</strong> integratori, che non vengono venduti in studio.</p>
      <p><strong>Durata:</strong> tre mesi.</p>
      <p class="prezzo">da 200 €</p>
    </article>

    <p class="rv"><a class="btn btn-accent" href="https://wa.me/393330000000" target="_blank" rel="noopener" data-placeholder>Chiedimi quale ha senso per te</a></p>
  </section>
</main>
```

`title`: "Percorsi e prezzi — Dott. Marco Rossi, nutrizionista a Milano".
`description`: "Prima visita, percorso sportivo e percorso benessere: cosa include ogni percorso, quanto dura e quanto costa."

- [ ] **Step 4: Scrivere `chi-sono.html`**

```html
<main id="contenuto">
  <section class="sezione wrap due-colonne">
    <div class="rv"><img src="/assets/img/ritratto-2.jpg" alt="Ritratto del nutrizionista" width="900" height="1100" data-placeholder></div>
    <div class="rv" data-placeholder>
      <h1>Chi sono</h1>
      <p>Biologo nutrizionista e personal trainer. Ho iniziato allenandomi, poi ho studiato quello che stavo già facendo con il corpo.</p>
      <p>Ho gareggiato nel bodybuilding: le preparazioni le ho fatte su di me prima che sugli altri. È il motivo per cui non propongo protocolli che non reggerebbero la vita di tutti i giorni.</p>
      <h2>Formazione</h2>
      <ul class="credenziali">
        <li>Laurea magistrale in Scienze della Nutrizione Umana</li>
        <li>Iscrizione all'Ordine Nazionale dei Biologi n. AA_1234</li>
        <li>Certificazione da personal trainer</li>
        <li>Aggiornamento continuo in nutrizione sportiva</li>
      </ul>
      <h2>In gara</h2>
      <p>Categoria e risultati da inserire con i dati reali.</p>
      <a class="btn btn-accent" href="https://wa.me/393330000000" target="_blank" rel="noopener" data-placeholder>Scrivimi su WhatsApp</a>
    </div>
  </section>
</main>
```

CSS da aggiungere:

```css
.percorso { border-top: 1px solid var(--line); padding: 2rem 0; }
.percorso p { color: var(--ink-soft); margin-top: .5rem; }
.percorso strong { color: var(--ink); }
```

- [ ] **Step 5: Eseguire i test**

Run: `npm test && npm run validate`
Expected: PASS.

- [ ] **Step 6: Commit**

```bash
git add site tests/smoke.spec.js
git commit -m "feat: pagine percorsi e chi sono"
```

---

### Task 9: Privacy, dati strutturati e censimento dei segnaposto

**Files:**
- Create: `tests/placeholders.spec.js`, `site/robots.txt`, `site/404.html`
- Modify: `site/privacy.html`, tutte le pagine (JSON-LD, link nel footer), `README.md`

**Interfaces:**
- Consumes: footer del Task 2.
- Produces: blocco JSON-LD `LocalBusiness` su `index.html`; elenco dei segnaposto stampato da `npm test`.

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/placeholders.spec.js`:

```js
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
```

Con `npm test` normale il controllo si salta: durante lo sviluppo i segnaposto ci devono essere. Con
`PUBLISH=1 npm test` diventa rosso ed elenca esattamente cosa resta da sostituire, pagina per pagina.
È il freno che impedisce di pubblicare con la partita IVA inventata.

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/placeholders.spec.js`
Expected: FAIL sul secondo test — nessun `script[type="application/ld+json"]`.

- [ ] **Step 3: Aggiungere i dati strutturati**

In `<head>` di `index.html`:

```html
<script type="application/ld+json">
{
  "@context": "https://schema.org",
  "@type": "LocalBusiness",
  "name": "Dott. Marco Rossi — Biologo nutrizionista",
  "description": "Nutrizione sportiva e alimentazione per la salute a Milano.",
  "address": { "@type": "PostalAddress", "streetAddress": "Via Esempio 1", "addressLocality": "Milano", "addressCountry": "IT" },
  "telephone": "+393330000000",
  "email": "info@example.invalid",
  "url": "https://example.invalid/",
  "openingHours": "Mo-Fr 09:00-19:00"
}
</script>
```

- [ ] **Step 4: Scrivere la pagina privacy**

Contenuto di `site/privacy.html` dentro `main`:

```html
<section class="sezione wrap testo">
  <h1>Privacy</h1>
  <p>Ultimo aggiornamento: 10 agosto 2026.</p>

  <h2>Cosa raccoglie questo sito</h2>
  <p>Niente. Questo sito è composto da pagine statiche. Non contiene moduli di contatto, non usa strumenti di statistica, non installa cookie di profilazione e non incorpora contenuti di terze parti. Per questo motivo non viene mostrato alcun banner sui cookie.</p>

  <h2>Dati tecnici del server</h2>
  <p>Il fornitore di hosting registra, per ragioni di sicurezza e funzionamento, dati tecnici come l'indirizzo IP e il tipo di browser. Sono trattati dal fornitore in qualità di responsabile del trattamento e non vengono utilizzati per profilare i visitatori.</p>

  <h2>Se mi scrivi</h2>
  <p>Se usi il pulsante WhatsApp o l'indirizzo email, la conversazione avviene sui rispettivi servizi, secondo le loro condizioni. I dati che mi invii vengono usati solo per risponderti e per l'eventuale percorso professionale, e non vengono comunicati a terzi.</p>

  <h2>Titolare del trattamento</h2>
  <p data-placeholder>Dott. Marco Rossi — Via Esempio 1, Milano — P. IVA 01234567890 — info@example.invalid</p>

  <h2>I tuoi diritti</h2>
  <p>Puoi chiedere in qualsiasi momento accesso, rettifica o cancellazione dei dati che mi hai fornito, scrivendo all'indirizzo email indicato sopra. Puoi inoltre proporre reclamo al Garante per la protezione dei dati personali.</p>
</section>
```

Nota per chi implementa: questo testo descrive fedelmente un sito senza raccolta dati. Se un giorno
si aggiunge un form, un analytics o un iframe, questa pagina diventa falsa e va riscritta insieme
al banner cookie.

- [ ] **Step 5: Completare footer, robots e 404**

Nel footer di tutte le pagine, aggiungere la navigazione (è quella che sopperisce al menu nascosto su mobile):

```html
<nav class="footer-nav" aria-label="Footer">
  <a href="/">Home</a>
  <a href="/chi-sono.html">Chi sono</a>
  <a href="/percorsi.html">Percorsi</a>
  <a href="/privacy.html">Privacy</a>
</nav>
```

```css
.footer-nav { display: flex; flex-wrap: wrap; gap: 1rem; margin-bottom: 1.25rem; }
.testo p { margin-top: 1rem; }
.testo h2 { margin-top: 2rem; font-size: 1.3rem; }
```

`site/robots.txt`:

```
User-agent: *
Allow: /
```

`site/404.html`: stessa struttura delle altre pagine, `<h1>Pagina non trovata</h1>` e un link alla home.

- [ ] **Step 6: Eseguire tutti i test**

Run: `npm test && npm run validate`
Expected: PASS. Il log mostra il conteggio dei segnaposto per pagina.

- [ ] **Step 7: Commit**

```bash
git add site tests/placeholders.spec.js
git commit -m "feat: privacy, dati strutturati, robots e 404"
```

---

### Task 10: Immagini ottimizzate e budget di peso

**Files:**
- Create: `tools/optimize.mjs`, `tests/perf.spec.js`
- Modify: tutte le pagine (elementi `<picture>`)

**Interfaces:**
- Consumes: i tag `<img>` scritti nei task 4, 6, 7, 8.
- Produces: per ogni immagine `nome.jpg` in `site/assets/img/sorgenti/`, i file `nome.webp`, `nome.jpg`, `nome@2x.webp`, `nome@2x.jpg` in `site/assets/img/`.

- [ ] **Step 1: Scrivere il test che fallisce**

`tests/perf.spec.js`:

```js
import { test, expect } from '@playwright/test';

test('la home resta sotto gli 800 KB', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' });
  const byte = await page.evaluate(() => {
    // il documento HTML sta nella entry 'navigation', non in 'resource':
    // sommando solo le risorse il budget non vedrebbe mai una pagina gonfia
    const doc = performance.getEntriesByType('navigation')[0]?.transferSize || 0;
    return performance.getEntriesByType('resource')
      .reduce((t, r) => t + (r.transferSize || 0), doc);
  });
  const kb = Math.round(byte / 1024);
  console.log(`peso della home: ${kb} KB`);
  expect(kb).toBeLessThan(800);
});

test('ogni immagine dichiara le dimensioni ed è servita in webp', async ({ page }) => {
  await page.goto('/');
  for (const img of await page.locator('img').all()) {
    await expect(img).toHaveAttribute('width', /\d+/);
    await expect(img).toHaveAttribute('height', /\d+/);
  }
  const sorgenti = await page.locator('picture source[type="image/webp"]').count();
  expect(sorgenti).toBeGreaterThan(0);
});
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/perf.spec.js`
Expected: FAIL — nessun elemento `picture source[type="image/webp"]`.

- [ ] **Step 3: Scrivere lo script di ottimizzazione**

`tools/optimize.mjs`:

```js
import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

const IN = 'site/assets/img/sorgenti';
const OUT = 'site/assets/img';
const LARGHEZZE = { '': 900, '@2x': 1800 };

await mkdir(OUT, { recursive: true });
const file = (await readdir(IN)).filter((f) => /\.(jpe?g|png)$/i.test(f));
if (file.length === 0) console.warn(`nessuna immagine in ${IN}`);

for (const f of file) {
  const nome = path.parse(f).name;
  for (const [suffisso, larghezza] of Object.entries(LARGHEZZE)) {
    const base = sharp(path.join(IN, f)).resize({ width: larghezza, withoutEnlargement: true });
    await base.clone().webp({ quality: 78 }).toFile(path.join(OUT, `${nome}${suffisso}.webp`));
    await base.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${nome}${suffisso}.jpg`));
    console.log(`${nome}${suffisso}: ${larghezza}px`);
  }
}
```

Le sorgenti in alta risoluzione vanno in `site/assets/img/sorgenti/`, che va aggiunta a `.gitignore`:
sono file pesanti e rigenerabili, non devono finire nel repository né online.

- [ ] **Step 4: Convertire i tag immagine**

Ogni `<img>` diventa un `<picture>`. Esempio per la hero:

```html
<picture>
  <source type="image/webp" srcset="/assets/img/hero.webp 900w, /assets/img/hero@2x.webp 1800w" sizes="(min-width: 900px) 45vw, 100vw">
  <img src="/assets/img/hero.jpg" srcset="/assets/img/hero.jpg 900w, /assets/img/hero@2x.jpg 1800w" sizes="(min-width: 900px) 45vw, 100vw"
       alt="Ritratto del nutrizionista nel suo studio" width="900" height="1100" fetchpriority="high" data-placeholder>
</picture>
```

Stessa conversione per `ritratto`, `metodo-1/2/3`, `mappa`, `ritratto-2`. Solo la hero tiene
`fetchpriority="high"`; tutte le altre tengono `loading="lazy"`.

Run: `npm run images`

- [ ] **Step 5: Eseguire i test**

Run: `npm test -- tests/perf.spec.js`
Expected: PASS, con il peso stampato nel log. Se supera 800 KB, abbassare `quality` a 70 e
rigenerare, non alzare la soglia del test.

- [ ] **Step 6: Commit**

```bash
git add site tools/optimize.mjs tests/perf.spec.js .gitignore
git commit -m "feat: pipeline immagini webp e budget di peso"
```

---

### Task 11: Accessibilità, header di sicurezza e README

**Files:**
- Create: `tests/a11y.spec.js`, `site/_headers`, `README.md`
- Modify: `site/assets/css/style.css` (stili di focus)

**Interfaces:**
- Consumes: tutte le pagine.
- Produces: `README.md` con la checklist di pubblicazione; `site/_headers` letto da Cloudflare Pages.

- [ ] **Step 1: Scrivere i test che falliscono**

`tests/a11y.spec.js`:

```js
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import { PAGES } from './pages.js';

for (const path of PAGES) {
  test(`nessuna violazione di accessibilità su ${path}`, async ({ page }) => {
    await page.goto(path);
    const esito = await new AxeBuilder({ page }).withTags(['wcag2a', 'wcag2aa']).analyze();
    const gravi = esito.violations.filter((v) => ['serious', 'critical'].includes(v.impact));
    expect(gravi.map((v) => `${v.id}: ${v.help}`)).toEqual([]);
  });
}

test('il focus da tastiera è sempre visibile', async ({ page }) => {
  await page.goto('/');
  await page.keyboard.press('Tab');
  const attivo = page.locator(':focus');
  await expect(attivo).toBeVisible();
  const outline = await attivo.evaluate((el) => getComputedStyle(el).outlineStyle);
  expect(outline).not.toBe('none');
});
```

- [ ] **Step 2: Eseguire e verificare il fallimento**

Run: `npm test -- tests/a11y.spec.js`
Expected: FAIL — con ogni probabilità su contrasto del testo secondario e su stile di focus assente.

- [ ] **Step 3: Correggere accessibilità e focus**

```css
:focus-visible { outline: 3px solid var(--accent); outline-offset: 3px; border-radius: 4px; }
.metodo :focus-visible { outline-color: #fff; }
```

Se axe segnala il contrasto di `--ink-soft` su `--bg-alt`, scurire `--ink-soft` a `#5c6165` — è
l'unica modifica ammessa ai token colore, e va fatta nel `:root`, non nel punto d'uso.

- [ ] **Step 4: Scrivere gli header di sicurezza**

`site/_headers`:

```
/*
  X-Content-Type-Options: nosniff
  Referrer-Policy: strict-origin-when-cross-origin
  X-Frame-Options: DENY
  Content-Security-Policy: default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; font-src 'self'; frame-ancestors 'none'; base-uri 'self'; form-action 'none'

/assets/fonts/*
  Cache-Control: public, max-age=31536000, immutable

/assets/img/*
  Cache-Control: public, max-age=2592000
```

La CSP `default-src 'self'` è la garanzia tecnica del vincolo sui domini terzi: se qualcuno un
giorno incolla uno script di Google, il browser lo blocca e il problema si vede subito.

- [ ] **Step 5: Scrivere il README**

`README.md` deve contenere:

- Cosa è il sito e cosa non fa (niente prenotazioni, niente area clienti).
- Comandi: `npm install`, `npx playwright install chromium webkit`, `npm run dev`, `npm test`, `npm run validate`, `npm run images`, `npm run fonts`.
- La regola dei domini terzi, con la frase: *nessuna risorsa esterna, altrimenti servono informativa e banner cookie*.
- **Checklist prima della pubblicazione:**
  1. Sostituire tutti gli elementi con `data-placeholder` e rimuovere l'attributo. `PUBLISH=1 npm test` fallisce finché ne resta anche uno, ed elenca quali.
  2. Verificare partita IVA, numero di iscrizione all'albo e qualifica esatta con il cliente.
  3. Sostituire le immagini temporanee con le foto reali e rigenerare con `npm run images`.
  4. Rileggere i testi cercando promesse di risultato: sono vietate dalla Legge 145/2018.
  5. Aggiornare `url` nel JSON-LD con il dominio reale.
  6. `npm test && npm run validate` tutto verde.
- La tabella dei dati segnaposto (copiarla dalle Global Constraints di questo piano).

- [ ] **Step 6: Eseguire tutti i test**

Run: `npm test && npm run validate`
Expected: PASS su tutti i file di test, entrambi i progetti.

- [ ] **Step 7: Commit**

```bash
git add site tests/a11y.spec.js README.md
git commit -m "feat: accessibilità, header di sicurezza e istruzioni di pubblicazione"
```

---

### Task 12: Pubblicazione

**Files:**
- Modify: `README.md`

**Interfaces:**
- Consumes: `site/_headers`, l'intero contenuto di `site/`.
- Produces: sito raggiungibile su un URL pubblico.

- [ ] **Step 1: Verificare che tutto sia verde prima di pubblicare**

Run: `npm test && npm run validate && git status --porcelain`
Expected: test verdi, nessun errore di validazione, working tree pulito.

- [ ] **Step 2: Pubblicare il repository su GitHub**

```bash
gh auth status || gh auth login
gh repo create nutrizionista-sportivo --private --source=. --push
```

Il repository nasce privato: contiene `docs/` con note interne sul cliente. Si può rendere pubblico
più avanti, dopo aver deciso cosa lasciarci dentro.

- [ ] **Step 3: Collegare Cloudflare Pages**

Da dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git:

- Framework preset: **None**
- Build command: **vuoto**
- Build output directory: **`site`**

Ogni push sul branch principale ripubblica. Le anteprime dei branch sono automatiche.

- [ ] **Step 4: Verificare la pubblicazione**

Sull'URL `*.pages.dev` assegnato, controllare a mano:

- La sezione del metodo scorre e cambia immagine.
- Il bottone WhatsApp apre la chat corretta.
- In DevTools → Network, nessuna richiesta verso un dominio diverso dal proprio.
- In DevTools → Network → Response Headers, la `Content-Security-Policy` è presente.
- Lighthouse su mobile: Performance e Accessibility sopra 90, LCP sotto 2 secondi.
- Prova su un telefono vero, in 4G, non solo nell'emulatore: è lì che si vede se lo sticky regge.

- [ ] **Step 5: Collegare il dominio**

Registrare `nomecognome-nutrizionista.it`, aggiungerlo in Pages → Custom domains, seguire le
istruzioni DNS. Il certificato HTTPS è automatico. Poi aggiornare `url` nel JSON-LD e in
`robots.txt` l'eventuale riga `Sitemap:`.

- [ ] **Step 6: Commit finale**

```bash
git add README.md
git commit -m "docs: istruzioni di deploy e dominio"
git push
```

---

## Note sulla verifica

`npm test` esegue ogni file su due profili (iPhone 13 e Desktop Chrome). Un test che passa solo su
desktop non è passato.

Tre test sono vincoli, non preferenze, e non vanno rilassati per far passare la suite:

1. **nessuna richiesta esterna** — è ciò che tiene il sito senza banner cookie;
2. **nessuna testimonianza né promessa di risultato** — Legge 145/2018;
3. **footer legale su tutte le pagine** — partita IVA e numero di albo.

Se uno di questi diventa rosso, si corregge il sito.
