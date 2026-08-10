import { copyFile, mkdir } from 'node:fs/promises';

const dest = 'site/assets/fonts';
await mkdir(dest, { recursive: true });

const src = 'node_modules/@fontsource-variable/inter/files';
await copyFile(`${src}/inter-latin-wght-normal.woff2`, `${dest}/inter-variable.woff2`);

console.log('font copiati in', dest);
