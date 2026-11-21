"use strict";
// Tiny dependency-free PNG encoder (stored/uncompressed deflate) + base64.
// Used to show the live preview as <img src="data:image/png;base64,...">.

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = (c & 1) ? (0xEDB88320 ^ (c >>> 1)) : (c >>> 1);
    t[n] = c >>> 0;
  }
  return t;
})();

function crc32(buf, start, end) {
  let c = 0xFFFFFFFF;
  for (let i = start; i < end; i++) c = CRC_TABLE[(c ^ buf[i]) & 255] ^ (c >>> 8);
  return (c ^ 0xFFFFFFFF) >>> 0;
}
function adler32(buf) {
  let a = 1, b = 0;
  const n = buf.length;
  let i = 0;
  while (i < n) {
    const end = Math.min(n, i + 3800);
    for (; i < end; i++) { a += buf[i]; b += a; }
    a %= 65521; b %= 65521;
  }
  return ((b << 16) | a) >>> 0;
}
function put32(buf, off, v) {
  buf[off] = (v >>> 24) & 255; buf[off + 1] = (v >>> 16) & 255; buf[off + 2] = (v >>> 8) & 255; buf[off + 3] = v & 255;
}

// data: Uint8Array of w*h*channels (channels = 3 or 4)
function encodePNG(data, w, h, channels) {
  channels = channels || 3;
  const rowBytes = w * channels;
  const raw = new Uint8Array(h * (rowBytes + 1));
  for (let y = 0; y < h; y++) {
    raw[y * (rowBytes + 1)] = 0;
    raw.set(data.subarray(y * rowBytes, (y + 1) * rowBytes), y * (rowBytes + 1) + 1);
  }
  const blocks = Math.max(1, Math.ceil(raw.length / 65535));
  const zlen = 2 + raw.length + blocks * 5 + 4;
  const total = 8 + (12 + 13) + (12 + zlen) + 12;
  const out = new Uint8Array(total);
  out.set([137, 80, 78, 71, 13, 10, 26, 10], 0);
  let p = 8;
  // IHDR
  put32(out, p, 13); out.set([73, 72, 68, 82], p + 4);
  put32(out, p + 8, w); put32(out, p + 12, h);
  out[p + 16] = 8; out[p + 17] = channels === 4 ? 6 : 2; out[p + 18] = 0; out[p + 19] = 0; out[p + 20] = 0;
  put32(out, p + 21, crc32(out, p + 4, p + 21));
  p += 25;
  // IDAT
  put32(out, p, zlen); out.set([73, 68, 65, 84], p + 4);
  let q = p + 8;
  out[q++] = 0x78; out[q++] = 0x01;
  let pos = 0;
  while (pos < raw.length || pos === 0) {
    const len = Math.min(65535, raw.length - pos);
    const final = pos + len >= raw.length ? 1 : 0;
    out[q++] = final;
    out[q++] = len & 255; out[q++] = (len >>> 8) & 255;
    out[q++] = (~len) & 255; out[q++] = ((~len) >>> 8) & 255;
    out.set(raw.subarray(pos, pos + len), q);
    q += len; pos += len;
    if (final) break;
  }
  put32(out, q, adler32(raw)); q += 4;
  put32(out, q, crc32(out, p + 4, q)); q += 4;
  p = q;
  // IEND
  put32(out, p, 0); out.set([73, 69, 78, 68], p + 4);
  put32(out, p + 8, crc32(out, p + 4, p + 8));
  return out;
}

const B64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
function toBase64(u8) {
  const parts = [];
  const CH = 3 * 12000;
  for (let s = 0; s < u8.length; s += CH) {
    const end = Math.min(u8.length, s + CH);
    let str = "";
    let i = s;
    for (; i + 2 < end; i += 3) {
      const n = (u8[i] << 16) | (u8[i + 1] << 8) | u8[i + 2];
      str += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + B64[(n >> 6) & 63] + B64[n & 63];
    }
    if (i < end) {
      const rem = end - i;
      const n = (u8[i] << 16) | ((rem > 1 ? u8[i + 1] : 0) << 8);
      str += B64[(n >> 18) & 63] + B64[(n >> 12) & 63] + (rem > 1 ? B64[(n >> 6) & 63] : "=") + "=";
    }
    parts.push(str);
  }
  return parts.join("");
}

function dataURL(data, w, h, channels) {
  return "data:image/png;base64," + toBase64(encodePNG(data, w, h, channels));
}

module.exports = { encodePNG, toBase64, dataURL, crc32, adler32 };
