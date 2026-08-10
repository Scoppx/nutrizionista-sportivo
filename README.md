# Sito — Dott. Marco Rossi, nutrizionista sportivo

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
