"use strict";
// Pixel Scape Terrain Lab: fast PNG read / write with Node's zlib (plain Node).
//   decode: 8-bit grey / RGB / RGBA, not interlaced (the elevation tiles) -> { w, h, ch, d }
//   encodeGray16: 16-bit grey heightmap;  encodeRGBA: 8-bit RGBA (previews, normal maps)
const zlib = require("zlib");

function decode(buf) {
  if (buf.readUInt32BE(0) !== 0x89504e47) throw new Error("not a PNG");
  let off = 8, w = 0, h = 0, depth = 8, ctype = 2, inter = 0; const idat = [];
  while (off < buf.length) {
    const len = buf.readUInt32BE(off), type = buf.toString("latin1", off + 4, off + 8), data = buf.subarray(off + 8, off + 8 + len);
    if (type === "IHDR") { w = data.readUInt32BE(0); h = data.readUInt32BE(4); depth = data[8]; ctype = data[9]; inter = data[12]; }
    else if (type === "IDAT") idat.push(data); else if (type === "IEND") break;
    off += 12 + len;
  }
  if (depth !== 8 || inter || ![0, 2, 6].includes(ctype)) throw new Error("PNG type not supported here");
  const ch = { 0: 1, 2: 3, 6: 4 }[ctype], raw = zlib.inflateSync(Buffer.concat(idat)), row = w * ch, d = new Uint8Array(w * h * ch);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (row + 1)], s = y * (row + 1) + 1, o = y * row;
    for (let x = 0; x < row; x++) {
      const a = x >= ch ? d[o + x - ch] : 0, b = y ? d[o - row + x] : 0, c = x >= ch && y ? d[o - row + x - ch] : 0, v = raw[s + x];
      let p = 0;
      if (f === 1) p = a; else if (f === 2) p = b; else if (f === 3) p = (a + b) >> 1;
      else if (f === 4) { const pa = Math.abs(b - c), pb = Math.abs(a - c), pc = Math.abs(a + b - 2 * c); p = pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      d[o + x] = (v + p) & 255;
    }
  }
  return { w, h, ch, d };
}

const CRC = new Int32Array(256).map((_, n) => { let c = n; for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1; return c; });
function crc(b) { let c = -1; for (let i = 0; i < b.length; i++) c = CRC[(c ^ b[i]) & 255] ^ (c >>> 8); return (c ^ -1) >>> 0; }
function chunk(type, data) { const l = Buffer.alloc(4); l.writeUInt32BE(data.length); const td = Buffer.concat([Buffer.from(type, "latin1"), data]), c = Buffer.alloc(4); c.writeUInt32BE(crc(td)); return Buffer.concat([l, td, c]); }
function png(w, h, depth, ctype, rows) {
  const ih = Buffer.alloc(13); ih.writeUInt32BE(w, 0); ih.writeUInt32BE(h, 4); ih[8] = depth; ih[9] = ctype;
  return Buffer.concat([Buffer.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]), chunk("IHDR", ih), chunk("IDAT", zlib.deflateSync(rows, { level: 6 })), chunk("IEND", Buffer.alloc(0))]);
}
// v: values 0..65535 (row 0 = top)
function encodeGray16(w, h, v) {
  const rows = Buffer.alloc(h * (w * 2 + 1));
  for (let y = 0; y < h; y++) { const o = y * (w * 2 + 1); rows[o] = 0; for (let x = 0; x < w; x++) rows.writeUInt16BE(Math.max(0, Math.min(65535, Math.round(v[y * w + x]))), o + 1 + x * 2); }
  return png(w, h, 16, 0, rows);
}
function encodeRGBA(w, h, d) {
  const rows = Buffer.alloc(h * (w * 4 + 1));
  for (let y = 0; y < h; y++) { rows[y * (w * 4 + 1)] = 0; Buffer.from(d.buffer, d.byteOffset + y * w * 4, w * 4).copy(rows, y * (w * 4 + 1) + 1); }
  return png(w, h, 8, 6, rows);
}
module.exports = { decode, encodeGray16, encodeRGBA };
