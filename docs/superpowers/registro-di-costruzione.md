# SDD ledger — plan: docs/superpowers/plans/2026-08-10-sito-nutrizionista-sportivo.md

Branch: feat/sito-statico (creato da main, commit 156d9c9/f5fc79f = spec + piano)
Workspace: .superpowers/sdd/2026-08-10-sito-nutrizionista-sportivo/
Task totali: 12

Task 1: implementer DONE_WITH_CONCERNS (commit 1515a03) — 2/2 test verdi su mobile+desktop
Task 1: concerns accolte, piano corretto (webkit oltre a chromium, package-lock tracciato, sharp ^0.35.0 per CVE libvips)
Task 1: fix round 1/5 in corso (resume implementer a00c0cbb8ba6fe99f)
Task 1: fix round 1/5 (3 concerns risolte; commit 58d2859) — npm audit 0 vulnerabilita
Task 1: task review = spec OK, quality Approved, 1 finding Important (title senza data-placeholder)
Task 1: fix round 2/5 in corso (data-placeholder su <title>)
Task 1: minor (deferred): comando python3 -m http.server duplicato in package.json e playwright.config.js (ereditato dal piano)
Piano aggiornato: vincolo data-placeholder esteso agli elementi non renderizzati; censimento Task 9 usa textContent + tagName
Task 1: fix round 2/5 (1 addressed, 0 open; commit cbd45d4)
Task 1: complete (commits 5579741..7e37002, review clean)

Task 2: implementer DONE (commit b8853e2) — 18/18 test verdi, html-validate pulito
Task 2: task review = spec NO (2 meta description senza data-placeholder), duplicazione header/footer verificata identica sulle 4 pagine
Task 2: fix round 1/5 in corso
Task 2: minor (deferred): nessun test automatico verifica la copertura di data-placeholder ne aria-current (parziale copertura dal censimento Task 9)
Task 2: minor (deferred): .btn-ink definito ma inerte finche un task successivo non lo usa
Task 2: fix round 1/5 (1 addressed, 0 open; commit aecd90e)
Task 2: complete (commits 7e37002..aecd90e, review clean)

Task 3: implementer DONE (commit f0926b1) — 20/20 verdi; Inter variabile 48256 byte, same-origin
Task 3: task review = spec OK, 1 finding Important (test font solo su '/', non su PAGES)
Task 3: fix round 1/5 in corso
Task 3: minor (deferred): copy-fonts.mjs senza try/catch; @font-face prima di :root
Task 3: fix round 1/5 (1 addressed, 0 open; commit 69d9003) — 26/26 verdi
Task 3: complete (commits aecd90e..69d9003, review clean)

Task 4: implementer DONE_WITH_CONCERNS (commit e575707) — 30/30 verdi
Task 4: ruling 1 — id="contatti" tolto dalla hero (difetto del piano: l'ancora e' della sezione contatti del Task 5, altrimenti id duplicato)
Task 4: ruling 2 — parola in accento nell'h1 mantenuta: era nel mockup approvato dal cliente; vincolo Global Constraints allargato di conseguenza
Task 4: fix round 1/5 in corso
Task 4: fix round 1/5 (2 rulings applicati; commit 40c8b9a)
Task 4: task review = spec OK, Approved, 0 finding bloccanti; dimensioni hero.jpg verificate 900x1100
Task 4: complete (commits 69d9003..40c8b9a, review clean)
Task 4: minor (deferred): bottone WhatsApp dell'header senza target=_blank/rel=noopener, incoerente con quello della hero

Task 5: implementer DONE (commit 84f96ae) — 34/34 verdi, ancore uniche, immagini 900x1100 e 1200x600 verificate
Task 5: task review = 1 finding Important (test parole vietate cieco sui <details> chiusi, verificato sperimentalmente)
Task 5: fix round 1/5 in corso (innerText -> textContent, con prova che il test sa fallire)
Task 5: fix round 1/5 (1 addressed, 0 open; commit ee309fa) — prova RED/GREEN su parola dentro <details> chiuso
Task 5: complete (commits 40c8b9a..ee309fa, review clean)

Task 6: implementer DONE_WITH_CONCERNS (commit 50279c6) — 42/42 verdi, motion.js 668 byte
Task 6: deviazione verificata dal reviewer eseguendo entrambe le forme: test.use({reducedMotion}) e' inerte in Playwright 1.62.1, serve contextOptions. Deviazione corretta e necessaria.
Task 6: task review = spec OK, Approved, 0 finding bloccanti
Task 6: complete (commits ee309fa..50279c6, review clean)
Task 6: minor accolto e girato al Task 7 — guardia 'IntersectionObserver in window' prima di aggiungere la classe js (senza observer la pagina resterebbe nascosta)
Task 6: minor (deferred): il test "no re-trigger" non isola unobserve, verifica solo l'esito utente

Task 7: implementer DONE (commit 8dee58f) — 44/44 verdi, motion.js 2219 byte su budget 3 KB
Task 7: task review = 1 finding Important (testo step 01 divergente fra passi[] e .metodo-fallback, difetto ereditato dal piano)
Task 7: fix round 1/5 in corso (parita copy + test di parita che la blocca)
Task 7: fix round 1/5 (1 addressed, 0 open; commit 85e1f6c) — 46/46 verdi, test di parita provato RED/GREEN
Task 7: complete (commits 736fc11..85e1f6c, review clean)

Task 8: implementer DONE_WITH_CONCERNS (commit c333136) — 50/50 verdi; RED atteso non avvenuto, deliverable senza copertura
Task 8: task review = 1 finding Important (guardie Legge 145/2018 e link esterni solo sulla home; contenuto nuovo non testato)
Task 8: fix round 1/5 in corso (estensione test a PAGES + asserzioni sul contenuto + data-placeholder CTA chi-sono)
Task 8: fix round 1/5 (4 parti addressed, 0 open; commit 0820e18) — 66/66 verdi, RED provati sulle pagine nuove
Task 8: complete (commits 85e1f6c..0820e18, review clean)

Task 9: implementer DONE (commit e0b6f5f) — 68 passati/2 skip; PUBLISH=1 fallisce elencando 60 segnaposto
Task 9: task review = 2 finding Important (meta description home senza data-placeholder; 404.html fuori da PAGES quindi fuori da ogni guardia)
Task 9: ruling controller — link privacy duplicato nel footer: si toglie quello del blocco legale, resta quello del footer-nav, asserzione riportata a 1
Task 9: fix round 1/5 in corso
Task 9: fix round 1/5 (3 addressed, 0 open; commit 5e1ab3e) — 78 passati/2 skip, gate PUBLISH=1 ora vede 67 segnaposto
Task 9: complete (commits 0820e18..5e1ab3e, review clean)

Task 10: implementer DONE (commit ae19868) — 82 passati/2 skip, home 74 KB dichiarati
Task 10: task review = 1 finding Important (budget peso escludeva il documento HTML: misurava solo le sotto-risorse) + 3 minori accolti
Task 10: fix round 1/5 in corso (navigation transferSize, sizes mappa, errore chiaro in optimize.mjs, perf test anche su chi-sono)
Task 10: fix round 1/5 (4 addressed, 0 open; commit fb2738a) — 84 passati/2 skip, home 85 KB desktop / 75 KB mobile su budget 800
Task 10: complete (commits 5e1ab3e..fb2738a, review clean)

Task 11: implementer DONE_WITH_CONCERNS (commit 9b276ac) — 96 passati/2 skip, axe 0 violazioni serious/critical su 5 pagine x 2 progetti
Task 11: reviewer ha ricalcolato i tre rapporti di contrasto e confermato i numeri; axe non ristretto; ragionamento CSP corretto; diagnosi race in motion.js reale, non aggiramento del test
Task 11: task review = 2 finding Important (motion.js 3383 byte fuori budget 3 KB; budget mai verificato da un test) + 1 questione plan-mandated
Task 11: ruling controller — :focus-visible con --accent accettato, vincolo allargato: il focus e' interfaccia funzionale, non decorazione
Task 11: ruling controller — modifica a motion.js fuori dalla file list del brief firmata: diagnosi verificata, guardie intatte, causa reale corretta in JS invece che mascherata nel CSS
Task 11: fix round 1/5 in corso (rientro nel budget + test che lo blocca)
Task 11: fix round 1/5 (2 addressed, 0 open; commit 5c66052) — motion.js 2850 byte, test di budget provato RED/GREEN, 98 passati/2 skip
Task 11: complete (commits fb2738a..5c66052, review clean)

Task 12: implementer DONE (commit 3fa09e0) — 98 passati/2 skip, validate pulito, tree pulito, gate PUBLISH=1 armato (fallisce come deve)
Task 12: ambito ridotto dal controller: push GitHub, Cloudflare Pages e dominio fuori portata (credenziali del proprietario, gh non autenticato)
Task 12: task review = Approved, 0 finding
Task 12: complete (commits 5c66052..3fa09e0, review clean)
Tutti i 12 task completati. Prossimo: review complessiva del branch.

REVIEW FINALE DEL BRANCH (opus): 1 Critical + 5 Important + 11 Minor
- Critical: blocco JSON-LD con tutta l'identita' inventata fuori dal cancello PUBLISH=1
- Important: nessun test provava la copertura del cancello; stagger reveal sfasato; sezione metodo senza titolo nei percorsi degradati; budget peso cieco alle immagini lazy; nav mobile nascosta senza sostituto
Fix wave unica (6 commit 44a6973..1d5075d), re-review scoped: tutti i finding ADDRESSED, nessuna regressione
Stato finale: 128 passati / 2 skip, html-validate pulito, axe 0 serious/critical su 5 pagine x 2 progetti, motion.js 2961 byte, home 92 KB
Triage dei minor differiti: chiusi o accettati esplicitamente nella review finale
Residuo noto: il test di copertura controlla i sei valori inventati noti, non un valore nuovo mai censito
