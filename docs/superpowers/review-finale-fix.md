# Report — ondata finale di fix, revisione whole-branch

Branch `feat/sito-statico`, partito da HEAD `3fa09e0` (98 passed / 2 skipped, working tree clean).
Finito a HEAD `1d5075d` (128 passed / 2 skipped, working tree clean), 6 commit.

## 1. (Critical) JSON-LD fuori dal cancello placeholder

`site/index.html:10` — aggiunto `data-placeholder` allo `<script type="application/ld+json">`.
Corretto anche `README.md:86`, che affermava (falsamente) che tutti i valori inventati
fossero già su elementi marcati; ora rimanda esplicitamente al nuovo test di copertura
invece di ripetere l'affermazione come fatto.

Evidenza: vedi fix 2 sotto — lo stesso test di copertura, eseguito PRIMA di questo fix,
segnalava lo `<script>` come fuga; eseguito DOPO, passa.

Verificato anche che il gate `PUBLISH=1` stesso ora lo intercetta (prima non lo vedeva
affatto): con `PUBLISH=1 npx playwright test tests/placeholders.spec.js` la riga
`"/ → <script> { "@context": "https://schema.org", "@type": "LocalBusiness"` compare
nell'elenco dei segnaposto rimasti.

## 2. Test di copertura del cancello

Aggiunto `tests/placeholders.spec.js` → `ogni occorrenza dei dati inventati noti sta
dentro un elemento [data-placeholder]`. Per ogni pagina in `PAGES`, cerca ogni
occorrenza di `Marco Rossi`, `01234567890`, `AA_1234`, `393330000000`,
`example.invalid`, `Via Esempio` (in testo diretto o in un attributo) e verifica che
l'elemento che la porta abbia `[data-placeholder]` su di sé o su un antenato. Gira
sempre (non condizionato a `PUBLISH`).

**RED** (prima del fix 1, JSON-LD senza `data-placeholder`):
```
- Array []
+ Array [
+   "/ → "Marco Rossi" fuori da [data-placeholder] su <script>",
+   "/ → "393330000000" fuori da [data-placeholder] su <script>",
+   "/ → "example.invalid" fuori da [data-placeholder] su <script>",
+   "/ → "Via Esempio" fuori da [data-placeholder] su <script>",
+ ]
1 failed
```

**GREEN** (dopo il fix 1):
```
✓ 1 [desktop] › ogni occorrenza dei dati inventati noti sta dentro un elemento [data-placeholder] (175ms)
1 passed
```

## 3. Stagger del reveal scombinato

`site/assets/js/motion.js:29` usava un indice globale di pagina per `(i % 4) * 80`.
Ora il ritardo si calcola dalla posizione dell'elemento tra i propri fratelli `.rv`
dentro lo stesso genitore (`[...el.parentElement.children].filter(n =>
n.classList.contains('rv')).indexOf(el)`), mantenendo lo step di 80ms e il cap del
modulo 4. `motion.js`: 2850 → 2961 byte (budget 3072).

Aggiunto un test in `tests/motion.spec.js` (`lo stagger riparte da zero per ogni
gruppo di fratelli .rv...`) che verifica: la prima card di "Per chi è" ha `--rv-delay:
0ms` (non 240ms), la seconda 80ms, la terza 160ms; e che il quinto elemento della FAQ
(indice 4) riparte da 0ms nel proprio gruppo.

**RED** (indice globale, motion.js originale):
```
Expected: "0ms"
Received: "240ms"
1 failed
```
(240ms = ultimo slot del ciclo modulo-4: hero-text.rv=0, hero-media.rv=1,
"Per chi è" h2.rv=2, prima card=indice globale 3 → 3%4=3 → 240ms — è esattamente il
"la prima card si anima per ultima" descritto nel task.)

**GREEN** (dopo il fix):
```
✓ lo stagger riparte da zero per ogni gruppo di fratelli .rv, non prosegue globale (115ms)
7 passed (tutto tests/motion.spec.js)
```

## 4. Titolo "Il metodo" perso nei percorsi degradati

`.metodo-track` (che porta sia l'eyebrow "Il metodo" sia l'h2 dinamico del passo) è
`display:none` sia senza JS sia con `prefers-reduced-motion: reduce`, lasciando tre
`<h3>` orfani in `.metodo-fallback` senza alcuna intestazione di sezione.

Fix:
- `.metodo-fallback` avvolto in un nuovo `<div class="metodo-fallback-blocco wrap">`
  con un proprio `<h2 class="metodo-label">Il metodo</h2>` prima dell'`<ol>` (un `<h2>`
  non può stare direttamente dentro un `<ol>`, da cui il wrapper).
- Nella resa sticky, `.metodo-label` promosso da `<p>` a `<h2>` e `.metodo-titolo`
  demosso da `<h2>` a `<h3>` (con `font-size` esplicito per non cambiare nulla a
  video), così entrambe le rese espongono lo stesso "Il metodo" come h2 e i passi
  come h3 — nessuna duplicazione visibile perché le due rese restano mutuamente
  esclusive via CSS.
- Aggiunta una passata axe con `contextOptions: { reducedMotion: 'reduce' }` a
  `tests/a11y.spec.js`.

**Nota importante**: la regola `heading-order` di axe-core è taggata
`cat.semantics, best-practice`, **non** `wcag2a`/`wcag2aa` — il filtro esistente
(`withTags(['wcag2a','wcag2aa'])`) non la include mai. Ho verificato empiricamente
(scansione axe completa, senza filtro tag, sul markup rotto) che **zero violazioni**
venivano segnalate anche prima del fix: la sequenza H3→H3 (stesso livello, nessun
salto) non viola `heading-order` così come axe la implementa. La passata axe aggiunta
resta utile (controlla per la prima volta il markup di fallback per contrasto, alt
mancante, ecc.) ma **non** è la prova RED/GREEN di questo difetto specifico.

La prova reale è l'albero di intestazioni visibili sotto reduced-motion, letto
direttamente dal DOM:

**PRIMA:**
```
H3 Hai esigenze sportive precise (visible:true)
H2 01 · Valutazione (visible:false)   ← dentro .metodo-track, nascosto
H3 01 · Valutazione (visible:true)
H3 02 · Piano (visible:true)
H3 03 · Controlli (visible:true)
H2 Chi sono (visible:true)
```
Un utente che naviga per intestazioni sente H3→H3→H3→H3 senza alcun H2 in mezzo: i
tre passi sembrano sotto-voci di "Per chi è".

**DOPO:**
```
H3 Hai esigenze sportive precise (visible:true)
H2 Il metodo (visible:false)          ← dentro .metodo-track, nascosto (corretto)
H3 01 · Valutazione (visible:false)
H2 Il metodo (visible:true)           ← dal fallback
H3 01 · Valutazione (visible:true)
H3 02 · Piano (visible:true)
H3 03 · Controlli (visible:true)
H2 Chi sono (visible:true)
```

## 5. Il test del peso pagina misurava prima del lazy-load

`tests/perf.spec.js:12` leggeva `performance.getEntriesByType('resource')` a
`networkidle`, prima che le immagini `loading=lazy` sotto la finestra di prefetch
venissero richieste. Aggiunto uno scroll programmato fino in fondo alla pagina
(via `requestAnimationFrame`) prima di leggere le entries, seguito da un secondo
`waitForLoadState('networkidle')`.

Misure (desktop, sui placeholder attuali):
- **Prima** (solo networkidle, senza scroll): **87 KB**
- **Dopo** (scroll completo): **90 KB**
- Mobile (iPhone 13, dopo scroll): 76 KB

Divario di 3 KB come descritto nel task — oggi innocuo, ma il test ora misura
onestamente anche quando le foto placeholder verranno sostituite con scatti reali da
1800px.

## 6. Nav mobile invisibile

Sotto i 900px ogni link di testo dell'header (`Chi sono`, `Percorsi`, `Contatti`) era
`display:none`, senza alcun sostituto: un visitatore da telefono su una pagina interna
poteva navigare solo dal footer.

Fix (nessun JS, nessun hamburger):
- I tre link sono ora avvolti in `<div class="nav-links">` in tutte e cinque le
  pagine.
- `.nav-links { display: contents; }` di default (sopra i 900px non altera nulla: il
  layout desktop resta pixel-identico a prima).
- Sotto i 900px, `.site-header nav { display: contents; }` promuove `.nav-links` e il
  bottone `.btn` a figli diretti flessibili di `.site-header .wrap`; `.btn { order: 1;
  }` resta accanto al logo, `.nav-links { order: 2; flex: 1 0 100%; }` forza i tre
  link su una seconda riga a piena larghezza.
- Header verificato: **114px di altezza su un viewport di 667px (17%)** — compatto,
  non "mangia" una quota irragionevole dello schermo. Test di regressione aggiunto
  (`< 25%` del viewport) e verificato visivamente con uno screenshot.

Test aggiunto in `tests/smoke.spec.js`: verifica che i tre link e il bottone siano
`toBeVisible()` a 375×667 e che l'header rispetti il tetto d'altezza.

## 7. Batch di piccoli difetti

- `site/percorsi.html:7` — `data-placeholder` aggiunto alla meta description (nominava
  i tre percorsi inventati senza essere marcata, diversamente dalle altre pagine).
- `style.css:43` — `.metodo :focus-visible { outline-color: #fff }` rimossa: verificato
  che `#metodo` non ha alcun discendente focusabile (`<a>`, `<button>`, `tabindex`) su
  nessuna pagina.
- `style.css:62` — breakpoint cambiato da `max-width: 900px` a `max-width: 899.98px`,
  per non sovrapporsi ai `min-width: 900px` sotto (hero-grid, cards, due-colonne).
  Verificato con misure dirette: a 899px l'header è 114.25px (layout mobile), a 900px
  è 72.9375px (layout desktop) — nessuna zona grigia a 900px esatti.
- `scroll-margin-top` aggiunto a `section[id]`: 8rem sotto i 900px (header a doppia
  riga), 5.5rem sopra. Verificato che `/#contatti` atterra con l'h2 "Parliamone"
  interamente sotto il bordo inferiore dell'header sticky, sia su iPhone 13 sia su
  desktop 1280px. Test di regressione aggiunto in `tests/smoke.spec.js`.
- Favicon SVG same-origin aggiunto: `site/favicon.svg` (monogramma "N" nella palette
  del sito, `--ink` di sfondo, `--accent` per la lettera) + `<link rel="icon"
  type="image/svg+xml" href="/favicon.svg">` su tutte e cinque le pagine. Test
  aggiunto: link dichiarato e risposta 200 su ogni pagina.
- Coerenza accenti nel metodo: la numerazione del passo (`.metodo-titolo` nella resa
  sticky, `.metodo-fallback h3` nel fallback) è ora l'elemento accentato in entrambe
  le rese; l'eyebrow "Il metodo" resta bianca/neutra in entrambe (prima era il
  contrario nella resa sticky).
- Bottone WhatsApp dell'header: aggiunto `target="_blank" rel="noopener"` su tutte e
  cinque le pagine (hero e CTA li avevano già). Aggiunto un test dedicato in
  `tests/contatti.spec.js` che parte da "ogni link verso `wa.me`" invece che da "link
  che ha già `target=_blank`" — il test preesistente non poteva strutturalmente
  accorgersi di un link a cui l'attributo manca del tutto.
  - **RED** (target/rel rimossi temporaneamente dal bottone header):
    `Expected: "_blank" / Received: ""` — 1 failed.
  - **GREEN** (ripristinato): 22 passed (tutto `tests/contatti.spec.js`, 2 progetti).

## 8. Guardie di test che potevano passare rotte

- `tests/smoke.spec.js` — il controllo Legge 145/2018 leggeva solo `body.textContent()`;
  `<title>` e `<meta name="description">` restavano fuori. Ora include anche titolo e
  meta description. Lista estesa con `sconto`, `offerta`, `promozione`, `gratis`,
  `omaggio`, `il miglior`; tolta `risultati garantiti` (ridondante con `garantit`).
  **Verificato che il testo attuale del sito passa già la lista estesa** (nessuna
  riscrittura necessaria — `grep -ionE` su tutte e 5 le pagine, zero corrispondenze).
  - **RED** dimostrato iniettando "Offerta speciale" nel `<title>` di
    `percorsi.html`: il test **vecchio** restava verde (1 passed); il test **nuovo**
    lo intercetta (1 failed, `il testo contiene "offerta"`).
- `tests/privacy.spec.js` — `/P\.?\s?IVA/i` passava su un footer con l'etichetta
  "P. IVA" senza alcuna cifra dietro. Ora richiede `\d{11}` (formato P.IVA italiana).
  - **RED** dimostrato svuotando il numero nel footer della home ("P. IVA · Iscrizione
    ONB..."): il test vecchio restava verde; il nuovo va in rosso
    (`Expected substring: /P\.?\s?IVA\s*\d{11}/i`).

## 9. Sorgenti immagini spostate fuori da site/

`site/assets/img/sorgenti/` era in `.gitignore` (invisibile a un deploy Git), ma
dentro `site/`: un deploy per rsync o upload diretto della cartella avrebbe pubblicato
anche le sorgenti in alta risoluzione. Spostata a `assets-sorgenti/` nella radice del
repo. Aggiornati `tools/optimize.mjs` (`IN`) e `.gitignore`. Nessuna menzione del
vecchio percorso trovata in `README.md` (0 corrispondenze grep) — nulla da correggere
lì. Verificato:
- `npm run images` con la nuova cartella: rigenera tutte le 28 varianti
  (7 sorgenti × 2 dimensioni × 2 formati), **shasum identico** a prima dello
  spostamento per tutti i 28 file.
- Percorso d'errore (`assets-sorgenti/` mancante): messaggio corretto, `exit code 1`,
  invariato nel comportamento.

## Stato finale

- Test: **128 passed, 2 skipped** (era 98/2 all'inizio; +30 dovuti ai nuovi test di
  copertura/regressione aggiunti in questa ondata, su 2 progetti Playwright).
- `npm run validate`: pulito, nessun errore html-validate.
- `motion.js`: **2961 byte**, sotto il budget di 3072.
- Peso pagina home misurato dopo scroll completo: **90 KB desktop / 76 KB mobile**
  (sotto la soglia di 800 KB).
- `PUBLISH=1 npx playwright test tests/placeholders.spec.js`: **fallisce ancora**,
  come richiesto (il sito resta su dati segnaposto).
- `git status`: working tree pulito.

## Commit creati

1. `44a6973` — fix(critical): il blocco JSON-LD sfuggiva al cancello PUBLISH=1
   (fix 1 + 2 + correzione README)
2. `eada4d0` — fix: lo stagger del reveal riparte per gruppo di fratelli .rv (fix 3)
3. `a74158c` — fix: il test del peso pagina misura dopo lo scroll completo (fix 5)
4. `4397b6f` — fix(ui+a11y): titolo del metodo esposto, nav mobile non più nascosto,
   piccoli difetti verificati (fix 4 + fix 6 + resto del batch 7)
5. `2358c6e` — test: le guardie sui claim Legge 145 e sulla P.IVA potevano passare
   rotte (fix 8)
6. `1d5075d` — chore: sorgenti immagini spostate fuori da site/ (fix 9)

## File toccati (percorsi assoluti)

- `/Users/alessioscoppa/nutrizionista-sportivo/site/index.html`
- `/Users/alessioscoppa/nutrizionista-sportivo/site/percorsi.html`
- `/Users/alessioscoppa/nutrizionista-sportivo/site/chi-sono.html`
- `/Users/alessioscoppa/nutrizionista-sportivo/site/privacy.html`
- `/Users/alessioscoppa/nutrizionista-sportivo/site/404.html`
- `/Users/alessioscoppa/nutrizionista-sportivo/site/favicon.svg` (nuovo)
- `/Users/alessioscoppa/nutrizionista-sportivo/site/assets/css/style.css`
- `/Users/alessioscoppa/nutrizionista-sportivo/site/assets/js/motion.js`
- `/Users/alessioscoppa/nutrizionista-sportivo/tests/placeholders.spec.js`
- `/Users/alessioscoppa/nutrizionista-sportivo/tests/motion.spec.js`
- `/Users/alessioscoppa/nutrizionista-sportivo/tests/a11y.spec.js`
- `/Users/alessioscoppa/nutrizionista-sportivo/tests/perf.spec.js`
- `/Users/alessioscoppa/nutrizionista-sportivo/tests/smoke.spec.js`
- `/Users/alessioscoppa/nutrizionista-sportivo/tests/privacy.spec.js`
- `/Users/alessioscoppa/nutrizionista-sportivo/tests/contatti.spec.js`
- `/Users/alessioscoppa/nutrizionista-sportivo/tools/optimize.mjs`
- `/Users/alessioscoppa/nutrizionista-sportivo/.gitignore`
- `/Users/alessioscoppa/nutrizionista-sportivo/README.md`
- `/Users/alessioscoppa/nutrizionista-sportivo/assets-sorgenti/` (nuova posizione,
  gitignored, non tracciata — 7 file spostati da `site/assets/img/sorgenti/`)

## Cose non fatte, e perché

Nessuna. Tutti e 9 i punti della lista sono stati applicati così come specificati,
nessuno è risultato in conflitto con i vincoli vincolanti (nessuna richiesta di terze
parti, Legge 145/2018, token colore fissi, breakpoint singolo a 900px, budget
`motion.js`, italiano, mobile-first). Non toccato `site/_headers`, non aggiunto lo
step immagini 1400w, non toccato `docs/`, nessun push/remote/repo GitHub creato.

Unica nota di trasparenza (non un'omissione, ma una correzione rispetto
all'aspettativa implicita del fix 4): la passata axe con `reducedMotion: 'reduce'`
richiesta esplicitamente dal task **non** fornisce di per sé la prova RED/GREEN del
difetto (perché `heading-order` non è nel tag-set `wcag2a`/`wcag2aa` che il progetto
usa ovunque). L'ho aggiunta comunque come richiesto — resta utile come prima
copertura axe reale del markup di fallback — ma la prova RED/GREEN riportata sopra
per il fix 4 viene invece dalla lettura diretta dell'albero di intestazioni.
