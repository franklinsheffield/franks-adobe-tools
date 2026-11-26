// Pixel Scape web build: the parts of Node's zlib the geo code uses, on fflate.
"use strict";
const { Buffer } = require("buffer");
const F = require("fflate");
const B = (u) => Buffer.from(u.buffer, u.byteOffset, u.byteLength);
module.exports = {
  inflateSync: (b) => B(F.unzlibSync(new Uint8Array(b))),
  deflateSync: (b, o) => B(F.zlibSync(new Uint8Array(b), { level: (o && o.level) != null ? o.level : 6 })),
  gunzipSync: (b) => B(F.gunzipSync(new Uint8Array(b))),
  brotliDecompressSync: () => { throw new Error("brotli is not supported in the web build"); }
};
