import { readdir, mkdir } from 'node:fs/promises';
import path from 'node:path';
import sharp from 'sharp';

// Fuori da site/: qualunque deploy che non passi da Git (rsync, upload diretto)
// pubblica tutto cio' che sta sotto site/, .gitignore o no. Le sorgenti in alta
// risoluzione vivono qui apposta, un livello sopra, cosi' un deploy del genere
// non puo' pubblicarle per errore.
const IN = 'assets-sorgenti';
const OUT = 'site/assets/img';
const LARGHEZZE = { '': 900, '@2x': 1800 };

await mkdir(OUT, { recursive: true });

let elenco;
try {
  elenco = await readdir(IN);
} catch (err) {
  if (err.code === 'ENOENT') {
    console.error(
      `${IN}/ non esiste: le sorgenti in alta risoluzione non sono nel repository ` +
      '(la cartella è in .gitignore, pesano troppo per essere versionate). ' +
      'Rigenerale localmente o copiacele prima di eseguire "npm run images".'
    );
    process.exit(1);
  }
  throw err;
}

const file = elenco.filter((f) => /\.(jpe?g|png)$/i.test(f));
if (file.length === 0) console.warn(`nessuna immagine in ${IN}`);

const BASE = LARGHEZZE[''];

for (const f of file) {
  const nome = path.parse(f).name;
  const sorgente = path.join(IN, f);
  const { width: larghezzaSorgente } = await sharp(sorgente).metadata();

  for (const [suffisso, larghezza] of Object.entries(LARGHEZZE)) {
    // sharp non ingrandisce mai: da una sorgente piu' stretta del target uscirebbe
    // un file identico alla variante base, e il markup direbbe al browser che vale
    // il doppio dei pixel. Meglio non produrla e dirlo forte.
    if (larghezza !== BASE && larghezzaSorgente < larghezza) {
      console.warn(
        `${nome}${suffisso}: SALTATA — la sorgente e' larga ${larghezzaSorgente}px, ` +
        `servono ${larghezza}px. Togli la candidata ${larghezza}w dal srcset di ${nome}, ` +
        'oppure fornisci una foto piu' + "'" + ' grande.'
      );
      continue;
    }

    const base = sharp(sorgente).resize({ width: larghezza, withoutEnlargement: true });
    await base.clone().webp({ quality: 78 }).toFile(path.join(OUT, `${nome}${suffisso}.webp`));
    await base.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${nome}${suffisso}.jpg`));
    console.log(`${nome}${suffisso}: ${larghezza}px`);
  }
}
