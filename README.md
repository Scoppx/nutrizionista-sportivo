# Sito — Dott. Marco Rossi, nutrizionista sportivo

## Stato del progetto

Il sito è **completo e testato**, ma gira interamente su **dati segnaposto e
immagini generate localmente**: nome, partita IVA, numero d'albo, WhatsApp,
email, indirizzo dello studio e tutte le foto sono placeholder, non dati
reali. **Non va pubblicato così com'è.**

`PUBLISH=1 npm test` è il cancello che lo impedisce: fallisce finché resta
anche un solo elemento `data-placeholder` nel sito (vedi la checklist e la
tabella più sotto). L'unico ingrediente che nessun codice può fornire da
solo sono le **fotografie reali del professionista**: tutto il resto della
checklist è testo o configurazione, ma le foto richiedono uno shooting o
comunque materiale fornito dal cliente.

Sito statico a cinque pagine (`site/index.html`, `percorsi.html`, `chi-sono.html`,
`privacy.html`, `404.html`) per uno studio di biologia nutrizionale e personal
training. Presenta lo studio, i percorsi disponibili con relativi prezzi e i
contatti (WhatsApp ed email).

Il sito **non fa** e non deve fare:

- **Prenotazioni**: nessun calendario, nessun form di booking. Il contatto
  avviene solo via WhatsApp o email, fuori dal sito.
- **Area clienti**: nessun login, nessun dato personale raccolto o conservato
  dal sito stesso.

È deliberatamente HTML/CSS/JS statico, senza framework né build step
applicativo: solo un piccolo script di reveal-allo-scroll
(`site/assets/js/motion.js`) e due utility Node per font e immagini.

## Comandi

```bash
npm install
npx playwright install chromium webkit
npm run dev         # serve site/ su http://localhost:4173
npm test            # Playwright: due progetti (mobile iPhone 13/webkit, desktop Chrome)
npm run validate    # html-validate su tutte le pagine
npm run images      # rigenera le varianti webp/@2x da tools/optimize.mjs
npm run fonts       # copia il font Inter self-hosted da node_modules
```

## Nessuna risorsa esterna

Ogni asset (font, immagini, CSS, JS) è servito dallo stesso dominio del sito.
Non ci sono script, font, tracker o embed di terze parti — e non deve mai
essercene: **nessuna risorsa esterna, altrimenti servono informativa e banner cookie**.
La `Content-Security-Policy` in `site/_headers` (`default-src 'self'`) è
l'applicazione tecnica di questa regola: se in futuro qualcuno incolla uno
script di terze parti (Google, un widget, un font CDN), il browser lo blocca
subito, invece di scoprirlo dopo la pubblicazione con un problema legale.

Se questa regola cambia (es. si aggiunge un servizio esterno), cambiano
anche gli obblighi legali del sito: informativa privacy da aggiornare e
banner cookie da introdurre. Non è una scelta stilistica.

## Checklist prima della pubblicazione

1. Sostituire tutti gli elementi con `data-placeholder` e rimuovere
   l'attributo. Il gate è `PUBLISH=1 npm test`: fallisce finché ne resta
   anche uno e ne elenca il percorso pagina, il tag e il testo.
2. Verificare con il cliente partita IVA, numero di iscrizione all'albo e
   qualifica esatta.
3. Sostituire le immagini temporanee con le foto reali e rigenerare con
   `npm run images`.
4. Rileggere i testi cercando promesse di risultato: sono vietate dalla
   Legge 145/2018.
5. Aggiornare `url` nel JSON-LD (`site/index.html`) con il dominio reale.
6. `npm test && npm run validate` tutto verde.

## Dati segnaposto da sostituire

| Campo | Valore segnaposto attuale |
| --- | --- |
| Nome | Dott. Marco Rossi |
| Qualifica | Biologo nutrizionista · Personal trainer |
| Partita IVA | 01234567890 |
| Iscrizione albo | ONB n. AA_1234 |
| WhatsApp | +39 333 000 0000 → https://wa.me/393330000000 |
| Email | info@example.invalid |
| Studio | Via Esempio 1, Milano |
| Città (SEO) | Milano |

Tutti questi valori compaiono su elementi marcati `data-placeholder`; il
punto 1 della checklist sopra è il modo per non dimenticarne nessuno.

## Deploy

### Cloudflare Pages (scelta di riferimento)

Da dash.cloudflare.com → Workers & Pages → Create → Pages → Connect to Git,
collegando il repository:

- Framework preset: **None**
- Build command: **vuoto**
- Build output directory: **`site`**

Non c'è nessuno step di build: il sito è già HTML/CSS/JS statico pronto per
essere servito così com'è. Cloudflare Pages pubblica **solo la cartella
`site/`** — `docs/` (le note interne sul cliente), `tests/` e la
strumentazione (`tools/`, `playwright.config.js`, ecc.) restano
deliberatamente fuori dal deploy: non hanno nulla a che fare col sito
pubblico e non devono finire online. Ogni push sul branch principale
ripubblica automaticamente; le anteprime dei branch sono automatiche.

### Alternative

Se non si usa Cloudflare Pages, altre opzioni compatibili con "nessun
build step, pubblica solo `site/`":

- **Netlify**: stessa logica — build command vuoto, publish directory
  `site`.
- **Render**, ma solo il prodotto **Static Site** (non i loro Web Service,
  che vanno "a dormire" se inattivi — inaccettabile per un sito vetrina che
  deve rispondere sempre).
- **GitHub Pages**: funziona, ma con meno controllo sugli header HTTP —
  `site/_headers` (che imposta la `Content-Security-Policy` e gli altri
  header di sicurezza) **non verrebbe applicato**. Da evitare se si vuole
  mantenere la protezione via CSP descritta sopra.

### Checklist di verifica post-deploy

Da controllare a mano sull'URL pubblicato (`*.pages.dev` o dominio finale):

- La sezione del metodo resta ancorata (sticky) e le immagini cambiano
  (cross-fade) mentre si scorre.
- Il bottone WhatsApp apre la chat corretta.
- In DevTools → Network, nessuna richiesta verso un dominio diverso dal
  proprio.
- In DevTools → Network → Response Headers di una risposta, la
  `Content-Security-Policy` è presente.
- Lighthouse su mobile: Performance e Accessibility sopra 90, LCP sotto 2
  secondi.
- Una prova su un telefono vero, in 4G — non solo nell'emulatore: è lì che
  si vede se la sezione sticky regge davvero o si rompe.

### Dominio

1. Registrare il dominio scelto (es. `nomecognome-nutrizionista.it`).
2. Aggiungerlo in Pages → Custom domains.
3. Seguire le istruzioni DNS mostrate da Cloudflare. Il certificato HTTPS è
   automatico.
4. Aggiornare il campo `url` nel blocco JSON-LD di `site/index.html` con il
   dominio reale (oggi punta a un placeholder, vedi tabella sopra).
5. Se in futuro si aggiunge una sitemap, aggiungere una riga `Sitemap:` a
   `site/robots.txt` (oggi non c'è, ed è corretto che non ci sia finché non
   esiste una sitemap da referenziare).

### SEO locale

Per questo tipo di attività la leva più forte non è il sito ma un profilo
**Google Business Profile** curato, con recensioni reali. I dati di
contatto sul sito (nome, indirizzo, telefono/WhatsApp) devono corrispondere
**esattamente** a quelli del profilo Google: incoerenze tra le due fonti
peggiorano il posizionamento locale invece di aiutarlo.
