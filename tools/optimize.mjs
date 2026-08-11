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

for (const f of file) {
  const nome = path.parse(f).name;
  for (const [suffisso, larghezza] of Object.entries(LARGHEZZE)) {
    const base = sharp(path.join(IN, f)).resize({ width: larghezza, withoutEnlargement: true });
    await base.clone().webp({ quality: 78 }).toFile(path.join(OUT, `${nome}${suffisso}.webp`));
    await base.clone().jpeg({ quality: 82, mozjpeg: true }).toFile(path.join(OUT, `${nome}${suffisso}.jpg`));
    console.log(`${nome}${suffisso}: ${larghezza}px`);
  }
}
