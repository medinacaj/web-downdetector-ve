// Genera favicon.ico (16 y 32 px) y apple-icon.png (180 px) a partir de
// src/app/icon.svg, el trazo de pulso del encabezado. Se ejecuta a mano solo
// si cambia el icono:  node scripts/generate-icons.mjs
import { readFile, writeFile } from 'node:fs/promises';
import sharp from 'sharp';

const svg = await readFile(new URL('../src/app/icon.svg', import.meta.url));
const png = (size, source = svg) => sharp(source, { density: 384 }).resize(size, size).png().toBuffer();
// iOS recorta sus propias esquinas: el icono de Apple va a sangre, sin esquinas transparentes.
const fullBleed = Buffer.from(svg.toString().replace('rx="5"', 'rx="0"'));

// ICO con PNG embebidos (válido en todos los navegadores actuales).
function ico(images) {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const entries = [];
  let offset = 6 + 16 * images.length;
  for (const { size, data } of images) {
    const e = Buffer.alloc(16);
    e.writeUInt8(size >= 256 ? 0 : size, 0);
    e.writeUInt8(size >= 256 ? 0 : size, 1);
    e.writeUInt16LE(1, 4); // planos
    e.writeUInt16LE(32, 6); // bits por píxel
    e.writeUInt32LE(data.length, 8);
    e.writeUInt32LE(offset, 12);
    offset += data.length;
    entries.push(e);
  }
  return Buffer.concat([header, ...entries, ...images.map((i) => i.data)]);
}

const sizes = [16, 32];
const images = await Promise.all(sizes.map(async (size) => ({ size, data: await png(size) })));
await writeFile(new URL('../src/app/favicon.ico', import.meta.url), ico(images));
await writeFile(new URL('../src/app/apple-icon.png', import.meta.url), await png(180, fullBleed));
console.log('✓ src/app/favicon.ico (16, 32) y src/app/apple-icon.png (180)');
