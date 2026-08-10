# Sito vetrina — nutrizionista sportivo

Data: 2026-08-10
Stato: design approvato, da implementare

## 1. Obiettivo

Sito vetrina per un professionista che è insieme **biologo nutrizionista e personal trainer**, con
un passato agonistico nel bodybuilding. Il sito deve costruire credibilità e portare al contatto
diretto (WhatsApp o email). Non gestisce prenotazioni, non ha area riservata, non ha blog.

**Metrica di successo**: un visitatore capisce in meno di dieci secondi chi è, per chi lavora e come
si fa contattare.

### Pubblico

- Amatori di palestra: ricomposizione corporea, massa, definizione.
- Persone non sportive: dimagrimento, alimentazione per la salute.

Le due anime convivono. Il sito non deve escludere il secondo gruppo per compiacere il primo.

### Fuori scope

Prenotazione online, area clienti, e-commerce, blog, newsletter, form di contatto, multilingua.

## 2. Decisioni prese

| Ambito | Decisione | Motivo |
|---|---|---|
| Tipo di sito | Vetrina statica | Nessuna prenotazione online richiesta |
| Aggiornamenti | Quasi mai, via codice | Niente CMS da mantenere e aggiornare |
| Stack | HTML + CSS + JS scritti a mano | Zero dipendenze, nessun build step da far marcire |
| Struttura | Ibrida: home lunga + pagine di dettaglio | Racconto sulla home, contenuto indicizzabile sulle pagine |
| Motion | Reveal allo scroll + una sezione sticky | Effetto richiesto dal cliente, peso minimo |
| Estetica | Base chiara + fasce scure con accento arancio | Credibilità sanitaria e grinta sportiva insieme |
| Contatto | WhatsApp (primario) + email (secondario) | Nessun dato raccolto dal sito, GDPR semplice |
| Hosting | Git + deploy statico continuo | Gratuito, aggiornamento a ogni commit |

## 3. Architettura

```
nutrizionista-sportivo/
  index.html            home lunga
  percorsi.html         servizi e prezzi
  chi-sono.html         biografia, credenziali, percorso agonistico
  privacy.html          informativa privacy
  assets/
    css/style.css       foglio unico, custom properties per colori e spaziature
    js/motion.js        reveal + sticky, nessuna libreria
    img/                .webp con fallback .jpg, due dimensioni per immagine
    fonts/              font self-hosted (mai caricati da Google)
  tools/optimize.sh     script una-tantum di ottimizzazione immagini
  README.md             istruzioni deploy e manutenzione
```

Header e footer sono duplicati nei quattro file HTML. È una scelta consapevole: il sito viene toccato
raramente e la duplicazione costa meno di una toolchain da mantenere. Se un giorno servisse un blog,
si migra ad Astro riusando CSS e markup così come sono.

### Design system (in `style.css`)

```css
:root {
  --bg:        #fbfbfa;   /* base chiara */
  --bg-alt:    #f2f2f0;   /* sezioni alternate */
  --ink:       #16181a;   /* testo e fasce scure */
  --ink-soft:  #6a6f73;   /* testo secondario */
  --accent:    #e2542a;   /* arancio: solo CTA e numeri del metodo */
  --line:      #e7e7e4;
}
```

Regola sull'accento: l'arancio compare solo su bottoni di contatto e numerazione del metodo. Se
finisce ovunque, smette di indicare l'azione.

Tipografia: una sola famiglia sans, self-hosted, due pesi (400 e 700). Titoli con `letter-spacing`
negativo, testo corrente a 17px con `line-height` 1.6.

Breakpoint: mobile first, unico salto a 900px. Il traffico di un nutrizionista è in maggioranza da
telefono.

## 4. Contenuto della home

1. **Hero** — claim "Nutrizionista. E atleta.", qualifica per esteso, foto reale, due CTA (WhatsApp
   primario, email secondario).
2. **Per chi è** — tre card: palestra e ricomposizione · dimagrimento e salute · esigenze sportive
   specifiche.
3. **Il metodo** — fascia scura a piena larghezza, sezione sticky con tre step: 01 Valutazione,
   02 Piano, 03 Controlli.
4. **Chi sono, in breve** — credenziali: laurea, iscrizione all'albo, qualifica di personal trainer,
   percorso agonistico nel bodybuilding. Link alla pagina completa. È l'elemento differenziante:
   pochi nutrizionisti hanno gareggiato.
5. **Percorsi** — tre box con prezzo di partenza e link a `percorsi.html`.
6. **Chi seguo di solito** — descrizione narrativa dei casi tipici, senza nomi e senza promesse di
   risultato. Sostituisce le testimonianze (vedi §6). Da non confondere con la sezione 2, che è un
   elenco di destinatari: questa racconta il lavoro concreto.
7. **FAQ** — cinque o sei domande: quanto costa, quanto dura il percorso, se si lavora anche online,
   se bisogna pesare tutti gli alimenti, ogni quanto sono i controlli.
8. **Contatti** — bottone WhatsApp grande, email, indirizzo dello studio, mappa come immagine
   statica cliccabile, orari.

Footer: partita IVA, numero di iscrizione all'albo, link alla privacy.

### Pagine di dettaglio

- `percorsi.html` — ogni percorso: a chi serve, cosa include, durata, prezzo, cosa non include.
- `chi-sono.html` — biografia estesa, formazione, aggiornamenti professionali, percorso sportivo.
- `privacy.html` — informativa (vedi §6).

## 5. Motion

Due meccanismi soltanto, entrambi in `motion.js`, senza librerie esterne (obiettivo: sotto i 3 KB).

**Reveal.** `IntersectionObserver` con soglia 0.2. Lo stato iniziale nascosto
(`opacity: 0; transform: translateY(24px)`) è applicato dalla regola `.js .rv`, dove la classe `js`
viene messa su `<html>` dallo script stesso: senza JavaScript la regola non si attiva mai e il
contenuto resta visibile. Gli elementi ricevono la classe `.in` quando entrano nel viewport.
Transizione di 600ms. All'interno di uno stesso gruppo, ritardo progressivo di 80ms per elemento.
Dopo l'attivazione l'elemento viene rimosso dall'observer: l'animazione non si ripete.

**Sticky.** Una sola sezione, quella del metodo. Contenitore alto tre viewport, `position: sticky`
sul palco interno. Un listener di scroll — accorpato con `requestAnimationFrame` — calcola la
percentuale di avanzamento e attiva una delle tre immagini in crossfade, aggiornando didascalia e
indicatori.

**Accessibilità e prestazioni**

- Con `@media (prefers-reduced-motion: reduce)` tutti gli elementi sono visibili da subito, senza
  transform né transizioni. Nessun contenuto deve dipendere dall'animazione per essere leggibile.
- Fallback senza JavaScript: garantito dal meccanismo della classe `js` descritto sopra. Se lo script
  non parte, tutto il contenuto è visibile e il sito resta leggibile.
- Immagini con `width` e `height` espliciti per evitare spostamenti di layout, `loading="lazy"`
  ovunque tranne l'hero, elemento `<picture>` con `.webp` e fallback `.jpg`.
- Obiettivo: home sotto 800 KB totali, LCP sotto 2 secondi su rete 4G.

## 6. Vincoli legali

Il sito di un professionista sanitario in Italia è soggetto a regole specifiche. Vanno rispettate in
fase di scrittura dei testi, non aggiunte dopo.

**Identificazione.** Partita IVA e numero di iscrizione all'albo devono comparire nel sito. Vanno nel
footer di tutte le pagine. Va verificata la qualifica esatta (biologo nutrizionista, dietista o
medico): determina cosa il professionista può dichiarare e prescrivere.

**Pubblicità sanitaria (Legge 145/2018).** Le informazioni devono essere veritiere, trasparenti e non
promozionali. Sono da escludere: promesse di risultato ("perdi 10 kg in un mese"), fotografie
prima/dopo, sconti a tempo, superlativi sul professionista. I prezzi si possono pubblicare, purché
presentati come informazione e non come richiamo commerciale.

**Testimonianze: escluse.** Per le professioni sanitarie i pareri dei pazienti usati come richiamo
commerciale sono considerati contenuto promozionale e sono contestabili dall'Ordine. La sezione è
sostituita da "Per chi lavoro", che descrive le tipologie di persone seguite senza nomi e senza
promesse. Se il cliente vorrà comunque le testimonianze, la decisione e il rischio sono suoi e vanno
messi per iscritto.

**Privacy e cookie.** Il sito non ha form, non usa analytics, carica i font dal proprio dominio e
mostra la mappa come immagine statica. Di conseguenza non raccoglie dati personali, non installa
cookie e **non serve il banner cookie**. Serve comunque una pagina privacy che dichiari esattamente
questo, con titolare del trattamento e contatti.

Da evitare in modo tassativo, perché reintrodurrebbero obblighi oggi assenti: Google Fonts caricati
dai server di Google, iframe di Google Maps, pixel di Facebook, Google Analytics, iframe di
Calendly. Ognuno di questi trasferisce l'indirizzo IP dell'utente a terzi e fa scattare informativa,
banner e base giuridica.

## 7. Materiale da richiedere al cliente

**Fotografie** (blocco principale: senza queste il sito non può essere finito)

- 1 ritratto su sfondo neutro
- 2-3 in studio, durante una visita
- 2-3 in palestra, allenamento reale
- 1 orizzontale ad alta risoluzione per l'hero

Serve mezza giornata di fotografo. Le foto stock di piatti e insalate si riconoscono e fanno
sembrare finto il sito: non sono un'alternativa accettabile per le immagini che ritraggono lui.

**Testi**: biografia, descrizione dei percorsi con prezzi, risposte alle FAQ.

**Dati**: partita IVA, numero di iscrizione all'albo, qualifica esatta, indirizzo dello studio,
orari, numero WhatsApp, indirizzo email, eventuale logo.

Fino alla consegna del materiale si lavora con testi segnaposto realistici, chiaramente marcati, e
immagini temporanee da `picsum.photos`.

## 8. Deploy

Repository Git pubblicato su GitHub, collegato a un servizio di hosting statico che ridistribuisce a
ogni commit sul branch principale.

**Scelta consigliata: Cloudflare Pages.** Gratuito, dominio personalizzato, HTTPS automatico, CDN
veloce dall'Italia, controllo completo sugli header HTTP. Alternative equivalenti: Netlify, Render
(prodotto *static site*, che non va in sospensione come i web service), GitHub Pages (più limitato
sugli header).

Header consigliati alla pubblicazione: `Content-Security-Policy` restrittiva (il sito non carica
nulla da domini terzi), `X-Content-Type-Options: nosniff`, `Referrer-Policy: strict-origin-when-cross-origin`.

**Dominio**: `nomecognome-nutrizionista.it`, circa 12 €/anno.

**SEO locale.** La leva più efficace per un nutrizionista non è il sito ma la scheda Google Business
Profile, curata e con recensioni. Sul sito: `title` e `description` scritti a mano per ogni pagina,
dati strutturati `schema.org` di tipo `LocalBusiness`, città presente nel titolo della home, dati
di contatto identici a quelli della scheda Google.

**Costo complessivo**: dominio circa 12 €/anno, più il fotografo. Hosting a zero.

## 9. Ordine di lavoro

1. Impostazione del progetto: struttura cartelle, reset CSS, custom properties, font self-hosted.
2. Header, footer e navigazione, replicati sulle quattro pagine.
3. Home: sezioni statiche, senza animazioni, con testi segnaposto.
4. `motion.js`: reveal, con verifica del comportamento a `prefers-reduced-motion` attivo.
5. Sezione sticky del metodo.
6. Pagine `percorsi.html` e `chi-sono.html`.
7. `privacy.html` e dati identificativi nel footer.
8. Ottimizzazione immagini, dati strutturati, meta tag.
9. Verifica: Lighthouse, navigazione da tastiera, contrasto colori, prova su telefono reale.
10. Deploy e collegamento del dominio.

Il sito è considerato completo, con contenuti segnaposto, al passo 10. La sostituzione con i
contenuti reali avviene alla consegna del materiale da parte del cliente.
