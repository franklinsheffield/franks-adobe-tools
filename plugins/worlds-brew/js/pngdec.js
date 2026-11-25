"use strict";
// Frank's Worlds Brew: small PNG decoder (zlib inflate included), used to read the colour textures
// inside .glb / .gltf models. UXP has no image decoder for raw bytes, so this is plain JS.
// Supports 8-bit greyscale, grey+alpha, RGB, RGBA and palette PNGs (not interlaced). Returns { w, h, rgba }.

// ---- inflate (RFC 1951), after the classic "tinf" design
function Tree() { this.table = new Uint16Array(16); this.trans = new Uint16Array(288); }
const LEN_BITS = new Uint8Array(30), LEN_BASE = new Uint16Array(30), DIST_BITS = new Uint8Array(30), DIST_BASE = new Uint16Array(30);
function bitsBase(bits, base, delta, first) {
  for (let i = 0; i < delta; i++) bits[i] = 0;
  for (let i = 0; i < 30 - delta; i++) bits[i + delta] = (i / delta) | 0;
  for (let i = 0, sum = first; i < 30; i++) { base[i] = sum; sum += 1 << bits[i]; }
}
bitsBase(LEN_BITS, LEN_BASE, 4, 3); bitsBase(DIST_BITS, DIST_BASE, 2, 1);
LEN_BITS[28] = 0; LEN_BASE[28] = 258;
function buildTree(t, lengths, off, num) {
  for (let i = 0; i < 16; i++) t.table[i] = 0;
  for (let i = 0; i < num; i++) t.table[lengths[off + i]]++;
  t.table[0] = 0;
  const offs = new Uint16Array(16);
  for (let i = 0, sum = 0; i < 16; i++) { offs[i] = sum; sum += t.table[i]; }
  for (let i = 0; i < num; i++) if (lengths[off + i]) t.trans[offs[lengths[off + i]]++] = i;
}
const FIXED_L = new Tree(), FIXED_D = new Tree();
(() => { const l = new Uint8Array(288); for (let i = 0; i < 144; i++) l[i] = 8; for (let i = 144; i < 256; i++) l[i] = 9; for (let i = 256; i < 280; i++) l[i] = 7; for (let i = 280; i < 288; i++) l[i] = 8; buildTree(FIXED_L, l, 0, 288);
  const d = new Uint8Array(30).fill(5); buildTree(FIXED_D, d, 0, 30); })();
const CL_ORDER = [16, 17, 18, 0, 8, 7, 9, 6, 10, 5, 11, 4, 12, 3, 13, 2, 14, 1, 15];

function inflate(src) {
  let pos = 0, tag = 0, cnt = 0, out = new Uint8Array(Math.max(1024, src.length * 4)), n = 0;
  const grow = (k) => { if (n + k <= out.length) return; let L = out.length * 2; while (L < n + k) L *= 2; const o2 = new Uint8Array(L); o2.set(out.subarray(0, n)); out = o2; };
  const bit = () => { if (!cnt--) { if (pos >= src.length) throw new Error("PNG data ends early"); tag = src[pos++]; cnt = 7; } const b = tag & 1; tag >>>= 1; return b; };
  const bits = (num, base) => { let v = 0; for (let i = 0; i < num; i++) v |= bit() << i; return v + base; };
  const sym = (t) => { let sum = 0, cur = 0, len = 0; do { cur = 2 * cur + bit(); len++; sum += t.table[len]; cur -= t.table[len]; } while (cur >= 0); return t.trans[sum + cur]; };
  const block = (lt, dt) => {
    for (;;) {
      let s = sym(lt);
      if (s === 256) return;
      if (s < 256) { grow(1); out[n++] = s; continue; }
      s -= 257;
      const len = bits(LEN_BITS[s], LEN_BASE[s]), ds = sym(dt), dist = bits(DIST_BITS[ds], DIST_BASE[ds]);
      grow(len);
      for (let i = 0; i < len; i++) { out[n] = out[n - dist]; n++; }
    }
  };
  const dyn = () => {
    const hlit = bits(5, 257), hdist = bits(5, 1), hclen = bits(4, 4), lengths = new Uint8Array(320), cl = new Tree();
    for (let i = 0; i < hclen; i++) lengths[CL_ORDER[i]] = bits(3, 0);
    buildTree(cl, lengths, 0, 19);
    for (let k = 0; k < hlit + hdist;) {
      const s = sym(cl);
      if (s < 16) { lengths[k++] = s; continue; }
      let rep = 0, v = 0;
      if (s === 16) { v = lengths[k - 1]; rep = bits(2, 3); } else if (s === 17) rep = bits(3, 3); else rep = bits(7, 11);
      while (rep--) lengths[k++] = v;
    }
    const lt = new Tree(), dt = new Tree();
    buildTree(lt, lengths, 0, hlit); buildTree(dt, lengths, hlit, hdist);
    block(lt, dt);
  };
  let last;
  do {
    last = bit();
    const type = bits(2, 0);
    if (type === 0) {
      cnt = 0;   // stored block: byte aligned
      const len = src[pos] | (src[pos + 1] << 8); pos += 4;
      grow(len); out.set(src.subarray(pos, pos + len), n); n += len; pos += len;
    } else if (type === 1) block(FIXED_L, FIXED_D);
    else if (type === 2) dyn();
    else throw new Error("bad PNG data");
  } while (!last);
  return out.subarray(0, n);
}

function decodePNG(bytes) {
  const u = bytes instanceof Uint8Array ? bytes : new Uint8Array(bytes);
  const SIG = [137, 80, 78, 71, 13, 10, 26, 10];
  for (let i = 0; i < 8; i++) if (u[i] !== SIG[i]) throw new Error("not a PNG");
  let p = 8, w = 0, h = 0, depth = 0, ctype = 0, inter = 0, pal = null, trns = null; const idat = [];
  const be = (i) => ((u[i] << 24) | (u[i + 1] << 16) | (u[i + 2] << 8) | u[i + 3]) >>> 0;
  while (p + 8 <= u.length) {
    const len = be(p), type = String.fromCharCode(u[p + 4], u[p + 5], u[p + 6], u[p + 7]), d = u.subarray(p + 8, p + 8 + len);
    if (type === "IHDR") { w = be(p + 8); h = be(p + 12); depth = d[8]; ctype = d[9]; inter = d[12]; }
    else if (type === "PLTE") pal = d;
    else if (type === "tRNS") trns = d;
    else if (type === "IDAT") idat.push(d);
    else if (type === "IEND") break;
    p += 12 + len;
  }
  if ((depth !== 8 && depth !== 16) || inter || (depth === 16 && ctype === 3)) throw new Error("only 8-bit or 16-bit, non-interlaced PNG images are read");
  const ch = { 0: 1, 2: 3, 3: 1, 4: 2, 6: 4 }[ctype]; if (!ch) throw new Error("unsupported PNG colour type");
  let total = 0; idat.forEach((d) => { total += d.length; });
  const z = new Uint8Array(total); let o = 0; idat.forEach((d) => { z.set(d, o); o += d.length; });
  const B = depth >> 3, bpp = ch * B;   // 16-bit (heightmaps): two bytes per channel, big-endian
  const raw = inflate(z.subarray(2)), stride = w * bpp, px = new Uint8Array(h * stride);
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], row = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), cur = px.subarray(y * stride, (y + 1) * stride), prev = y ? px.subarray((y - 1) * stride, y * stride) : null;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? cur[x - bpp] : 0, b = prev ? prev[x] : 0, c = prev && x >= bpp ? prev[x - bpp] : 0;
      let v = row[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      cur[x] = v & 255;
    }
  }
  if (B === 2) {   // keep the full 16-bit grey (luma) for heightmaps; rgba gets the high bytes
    const gray16 = new Uint16Array(w * h);
    for (let i = 0; i < w * h; i++) { const s = i * bpp, v = (k) => (px[s + k * 2] << 8) | px[s + k * 2 + 1];
      gray16[i] = ch >= 3 ? Math.round(0.2126 * v(0) + 0.7152 * v(1) + 0.0722 * v(2)) : v(0); }
    const p8 = new Uint8Array(w * h * ch); for (let i = 0; i < w * h * ch; i++) p8[i] = px[i * 2];
    return { w, h, depth, gray16, rgba: toRGBA(p8, w, h, ch, ctype, pal, trns) };
  }
  return { w, h, depth, rgba: toRGBA(px, w, h, ch, ctype, pal, trns) };
}
function toRGBA(px, w, h, ch, ctype, pal, trns) {
  const rgba = new Uint8Array(w * h * 4);
  for (let i = 0; i < w * h; i++) {
    const q = i * 4, s = i * ch;
    if (ctype === 3) { const k = px[s]; rgba[q] = pal[k * 3]; rgba[q + 1] = pal[k * 3 + 1]; rgba[q + 2] = pal[k * 3 + 2]; rgba[q + 3] = trns && k < trns.length ? trns[k] : 255; }
    else if (ch <= 2) { rgba[q] = rgba[q + 1] = rgba[q + 2] = px[s]; rgba[q + 3] = ch === 2 ? px[s + 1] : 255; }
    else { rgba[q] = px[s]; rgba[q + 1] = px[s + 1]; rgba[q + 2] = px[s + 2]; rgba[q + 3] = ch === 4 ? px[s + 3] : 255; }
  }
  return rgba;
}

module.exports = { inflate, decodePNG };
