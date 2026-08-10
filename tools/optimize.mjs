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
