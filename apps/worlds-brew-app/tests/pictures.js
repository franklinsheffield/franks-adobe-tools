"use strict";
// Tiny picture writers for the My photo tests (tests/app-tests.js, web/smoke.js): no binary fixtures in the repo.
const zlibT = require("zlib");
function lzwLiterals(d) {   // a valid TIFF LZW stream that only uses literal codes (Clear every 200 so codes stay 9 bits)
  const out = []; let acc = 0, nb = 0; const put = (c) => { acc = (acc << 9) | c; nb += 9; while (nb >= 8) { out.push((acc >> (nb - 8)) & 255); nb -= 8; } acc &= (1 << nb) - 1; };
  for (let i = 0; i < d.length; i++) { if (i % 200 === 0) put(256); put(d[i]); } put(257); if (nb) out.push((acc << (8 - nb)) & 255); return Buffer.from(out);
}
// RGB TIFF: comp 1 / 5 (LZW) / 8 (deflate), predictor 2, strips or tiles, GeoTIFF tags (pixel scale + tiepoint + EPSG)
function writeTIFF({ w, h, rgb, comp = 1, pred = 1, tile = 0, geo = null }) {
  const cw = tile || w, ch = tile || 16, chunks = [];
  for (let ty = 0; ty < h; ty += ch) for (let tx = 0; tx < (tile ? w : 1); tx += cw) {
    const rows = tile ? ch : Math.min(ch, h - ty), b = Buffer.alloc(cw * rows * 3);
    for (let y = 0; y < rows; y++) for (let x = 0; x < cw; x++) { const gx = tx + x, gy = ty + y; if (gx < w && gy < h) for (let c = 0; c < 3; c++) b[(y * cw + x) * 3 + c] = rgb[(gy * w + gx) * 3 + c]; }
    if (pred === 2) for (let y = 0; y < rows; y++) for (let x = cw * 3 - 1; x >= 3; x--) b[y * cw * 3 + x] = (b[y * cw * 3 + x] - b[y * cw * 3 + x - 3]) & 255;
    chunks.push(comp === 5 ? lzwLiterals(b) : comp === 8 ? zlibT.deflateSync(b) : b);
  }
  const blobs = [], at = { n: 8 }, put = (buf) => { const o = at.n; blobs.push(buf); at.n += buf.length + (buf.length & 1); if (buf.length & 1) blobs.push(Buffer.alloc(1)); return o; };
  const offs = chunks.map(put), u32s = (a) => { const b = Buffer.alloc(a.length * 4); a.forEach((v, i) => b.writeUInt32LE(v, i * 4)); return b; }, f64s = (a) => { const b = Buffer.alloc(a.length * 8); a.forEach((v, i) => b.writeDoubleLE(v, i * 8)); return b; }, u16s = (a) => { const b = Buffer.alloc(a.length * 2); a.forEach((v, i) => b.writeUInt16LE(v, i * 2)); return b; };
  const E = [[256, 4, [w]], [257, 4, [h]], [258, 3, [8, 8, 8]], [259, 3, [comp]], [262, 3, [2]], [277, 3, [3]], [284, 3, [1]], [317, 3, [pred]]];
  if (tile) E.push([322, 4, [tile]], [323, 4, [tile]], [324, 4, offs], [325, 4, chunks.map((c) => c.length)]); else E.push([273, 4, offs], [278, 4, [ch]], [279, 4, chunks.map((c) => c.length)]);
  if (geo) E.push([33550, 12, [geo.sx, geo.sy, 0]], [33922, 12, [0, 0, 0, geo.x0, geo.y0, 0]], [34735, 3, [1, 1, 0, 2, 1024, 0, 1, 1, 3072, 0, 1, geo.epsg]]);
  E.sort((a, b) => a[0] - b[0]);
  const ent = E.map(([tag, type, v]) => { const sz = { 3: 2, 4: 4, 12: 8 }[type], raw = type === 3 ? u16s(v) : type === 4 ? u32s(v) : f64s(v); return { tag, type, n: v.length, raw, off: raw.length > 4 ? put(raw) : null }; });
  const ifd = Buffer.alloc(2 + ent.length * 12 + 4); ifd.writeUInt16LE(ent.length, 0);
  ent.forEach((e, i) => { const o = 2 + i * 12; ifd.writeUInt16LE(e.tag, o); ifd.writeUInt16LE(e.type, o + 2); ifd.writeUInt32LE(e.n, o + 4); if (e.off != null) ifd.writeUInt32LE(e.off, o + 8); else e.raw.copy(ifd, o + 8); });
  const ifdOff = at.n, head = Buffer.from([0x49, 0x49, 42, 0, 0, 0, 0, 0]); head.writeUInt32LE(ifdOff, 4);
  return Buffer.concat([head, ...blobs, ifd]);
}
function writePNG(w, h, rgb) {   // 8-bit RGB PNG
  const crcT = []; for (let n = 0; n < 256; n++) { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; crcT[n] = c >>> 0; }
  const crc = (b) => { let c = 0xffffffff; for (const x of b) c = crcT[(c ^ x) & 255] ^ (c >>> 8); return (c ^ 0xffffffff) >>> 0; };
  const chunk = (type, data) => { const len = Buffer.alloc(4), td = Buffer.concat([Buffer.from(type, "latin1"), data]), c = Buffer.alloc(4); len.writeUInt32BE(data.length); c.writeUInt32BE(crc(td)); return Buffer.concat([len, td, c]); };
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = 8; ih[9] = 2;
  const raw = Buffer.alloc(h * (w * 3 + 1)); for (let y = 0; y < h; y++) Buffer.from(rgb.buffer, rgb.byteOffset + y * w * 3, w * 3).copy(raw, y * (w * 3 + 1) + 1);
  return Buffer.concat([Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]), chunk("IHDR", ih), chunk("IDAT", zlibT.deflateSync(raw)), chunk("IEND", Buffer.alloc(0))]);
}
const checker = (w, h, s) => { const d = new Uint8Array(w * h * 3); for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) { const o = (y * w + x) * 3, on = ((x / s | 0) + (y / s | 0)) & 1; d[o] = on ? 250 : 40; d[o + 1] = on ? 210 : 50; d[o + 2] = on ? 60 : 200; } return d; };
module.exports = { writeTIFF, writePNG, checker, lzwLiterals };
