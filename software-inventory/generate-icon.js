const { PNG } = require('pngjs');
const fs = require('fs');
const path = require('path');

const SIZES = [256, 128, 64, 48, 32, 16];
const outDir = path.join(__dirname, 'build');

function lerp(a, b, t) { return a + (b - a) * t; }
function gradColor(t) {
  // top-left #3b82f6 -> bottom-right #1d4ed8
  return [Math.round(lerp(0x3b, 0x1d, t)), Math.round(lerp(0x82, 0x4e, t)), Math.round(lerp(0xf6, 0xd8, t))];
}

function distToSeg(px, py, x1, y1, x2, y2) {
  const dx = x2 - x1, dy = y2 - y1;
  const len2 = dx * dx + dy * dy;
  let t = len2 === 0 ? 0 : ((px - x1) * dx + (py - y1) * dy) / len2;
  t = Math.max(0, Math.min(1, t));
  const cx = x1 + t * dx, cy = y1 + t * dy;
  return Math.hypot(px - cx, py - cy);
}

function draw(size) {
  const png = new PNG({ width: size, height: size });
  const R = 0.22 * size; // corner radius
  const pad = 0.04 * size;

  for (let y = 0; y < size; y++) {
    for (let x = 0; x < size; x++) {
      const nx = x / size, ny = y / size;
      const t = (nx + ny) / 2;

      // rounded rect coverage
      const cx = Math.min(Math.max(x, R), size - R);
      const cy = Math.min(Math.max(y, R), size - R);
      let inside = true;
      if (x < R && y < R) inside = Math.hypot(x - R, y - R) <= R;
      else if (x > size - R && y < R) inside = Math.hypot(x - (size - R), y - R) <= R;
      else if (x < R && y > size - R) inside = Math.hypot(x - R, y - (size - R)) <= R;
      else if (x > size - R && y > size - R) inside = Math.hypot(x - (size - R), y - (size - R)) <= R;

      let r = 0, g = 0, b = 0, a = 0;
      if (inside) {
        const [cr, cg, cb] = gradColor(t);
        // subtle darker border for depth
        const borderW = 0.03 * size;
        const nearEdge = Math.min(
          Math.hypot(x - cx, y - cy),
          Math.min(Math.abs(x - pad), Math.abs(size - x - pad))
        );
        if (nearEdge < borderW) {
          r = cr * 0.7; g = cg * 0.7; b = cb * 0.7;
        } else { r = cr; g = cg; b = cb; }
        a = 255;

        // white N letter
        const thick = 0.10 * size;
        const x1 = 0.30 * size, x2 = 0.42 * size;   // left bar
        const x3 = 0.58 * size, x4 = 0.70 * size;   // right bar
        const yTop = 0.22 * size, yBot = 0.78 * size;
        let white = false;
        // left vertical bar
        if (x >= x1 - thick / 2 && x <= x1 + thick / 2 && y >= yTop && y <= yBot) white = true;
        // right vertical bar
        if (x >= x3 - thick / 2 && x <= x3 + thick / 2 && y >= yTop && y <= yBot) white = true;
        // diagonal from top-right of left bar to bottom-left of right bar
        if (distToSeg(x, y, x2, yTop, x3, yBot) <= thick / 2) white = true;
        if (white) { r = 255; g = 255; b = 255; }
      }
      const idx = (size * y + x) << 2;
      png.data[idx] = r;
      png.data[idx + 1] = g;
      png.data[idx + 2] = b;
      png.data[idx + 3] = a;
    }
  }
  return png;
}

if (!fs.existsSync(outDir)) fs.mkdirSync(outDir, { recursive: true });

// save individual pngs (temporary)
const pngFiles = [];
for (const s of SIZES) {
  const png = draw(s);
  const file = path.join(outDir, `icon_${s}.png`);
  fs.writeFileSync(file, PNG.sync.write(png));
  pngFiles.push({ size: s, data: fs.readFileSync(file) });
}

// Build ICO
const icoPath = path.join(outDir, 'icon.ico');
const HEADER_SIZE = 6;
const DIR_ENTRY_SIZE = 16;
const bufSize = HEADER_SIZE + DIR_ENTRY_SIZE * pngFiles.length + pngFiles.reduce((a, f) => a + f.data.length, 0);
const ico = Buffer.alloc(bufSize);

ico.writeUInt16LE(0, 0);                 // reserved
ico.writeUInt16LE(1, 2);                 // type = icon
ico.writeUInt16LE(pngFiles.length, 4);   // image count

let offset = HEADER_SIZE + DIR_ENTRY_SIZE * pngFiles.length;
pngFiles.forEach((f, i) => {
  const base = HEADER_SIZE + i * DIR_ENTRY_SIZE;
  const sizeByte = f.size >= 256 ? 0 : f.size;
  ico.writeUInt8(sizeByte, base);         // width
  ico.writeUInt8(sizeByte, base + 1);     // height
  ico.writeUInt8(0, base + 2);            // colors
  ico.writeUInt8(0, base + 3);            // reserved
  ico.writeUInt16LE(1, base + 4);         // planes
  ico.writeUInt16LE(32, base + 6);        // bpp
  ico.writeUInt32LE(f.data.length, base + 8);  // size
  ico.writeUInt32LE(offset, base + 12);   // offset
  f.data.copy(ico, offset);
  offset += f.data.length;
});

fs.writeFileSync(icoPath, ico);
console.log('Ikon dibuat:', icoPath);

// cleanup temp pngs
pngFiles.forEach((f) => {
  fs.unlinkSync(path.join(outDir, `icon_${f.size}.png`));
});