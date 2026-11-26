// Pixel Scape web build: createHash for cache keys (the web build keeps no download cache, so a simple hash is enough).
"use strict";
function fnv(s) { let h1 = 0x811c9dc5, h2 = 0x01000193; for (let i = 0; i < s.length; i++) { const c = s.charCodeAt(i); h1 = Math.imul(h1 ^ c, 16777619) >>> 0; h2 = Math.imul(h2 ^ c, 2246822519) >>> 0; } return h1.toString(16).padStart(8, "0") + h2.toString(16).padStart(8, "0"); }
module.exports = { createHash: () => { let s = ""; const h = { update: (x) => { s += String(x); return h; }, digest: () => (fnv(s) + fnv(s + "#")).padEnd(40, "0") }; return h; } };
