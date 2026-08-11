// Prepara una copia di site/ da mostrare al cliente prima che i dati siano reali.
// Non tocca site/: la trasformazione vive solo in .preview/, che non e' versionata.
//
// Tre cose che il sito pubblicato non deve mai fare finche' i dati sono inventati:
//  - farsi indicizzare (una P.IVA finta a nome del cliente finisce su Google)
//  - dichiarare credenziali sanitarie false
//  - esporre l'identita' inventata nei dati strutturati, che i motori leggono verbatim
//
// Uso: node tools/anteprima.mjs   ->   .preview/

import { readdir, readFile, writeFile, mkdir, copyFile, rm, stat } from 'node:fs/promises';
import path from 'node:path';

const SRC = 'site';
const OUT = '.preview';

const NOINDEX = '<meta name="robots" content="noindex, nofollow">';

// Coppie [cosa cercare, con cosa sostituirlo] applicate a ogni pagina HTML.
// Dalla forma piu' lunga alla piu' corta: l'ultima riga e' la rete di sicurezza
// che prende qualunque occorrenza sfuggita alle precedenti.
const SOSTITUZIONI = [
  ['P. IVA 01234567890 · Iscrizione ONB n. AA_1234', 'P. IVA e numero di albo da inserire'],
  ["Iscrizione all'Ordine Nazionale dei Biologi n. AA_1234", "Iscrizione all'Ordine Nazionale dei Biologi: numero da inserire"],
  ['Iscrizione ONB n. AA_1234', 'Iscrizione albo: numero da inserire'],
  ['01234567890', 'da inserire'],
  ['AA_1234', 'da inserire'],
];

async function copiaRicorsiva(da, a) {
  await mkdir(a, { recursive: true });
  for (const voce of await readdir(da)) {
    const origine = path.join(da, voce);
    const destinazione = path.join(a, voce);
    if ((await stat(origine)).isDirectory()) await copiaRicorsiva(origine, destinazione);
    else await copyFile(origine, destinazione);
  }
}

async function paginheHtml(dir) {
  const trovate = [];
  for (const voce of await readdir(dir)) {
    const p = path.join(dir, voce);
    if ((await stat(p)).isDirectory()) trovate.push(...(await paginheHtml(p)));
    else if (p.endsWith('.html')) trovate.push(p);
  }
  return trovate;
}

await rm(OUT, { recursive: true, force: true });
await copiaRicorsiva(SRC, OUT);

for (const pagina of await paginheHtml(OUT)) {
  let html = await readFile(pagina, 'utf8');

  html = html.replace('<meta charset="utf-8">', `<meta charset="utf-8">\n  ${NOINDEX}`);
  html = html.replace(/\s*<script type="application\/ld\+json"[\s\S]*?<\/script>/g, '');
  for (const [cerca, metti] of SOSTITUZIONI) html = html.split(cerca).join(metti);

  await writeFile(pagina, html);
}

await writeFile(path.join(OUT, 'robots.txt'), 'User-agent: *\nDisallow: /\n');

const pagine = (await paginheHtml(OUT)).length;
console.log(`${OUT}/ pronta: ${pagine} pagine, noindex attivo, robots chiuso, JSON-LD rimosso, credenziali svuotate.`);
console.log('Non e\' il deploy definitivo: serve solo a far vedere il sito al cliente.');
