"use strict";
// Frank's Worlds Brew: deterministic value noise shared by terrains, clouds, water and textures.
const clamp = (v, a, b) => v < a ? a : v > b ? b : v;
function hash2(i, j) { let n = Math.imul(i, 374761393) + Math.imul(j, 668265263) | 0; n = Math.imul(n ^ (n >>> 13), 1274126177); return ((n ^ (n >>> 16)) >>> 0) / 4294967295; }
function vnoise(x, y) {
  const xi = Math.floor(x), yi = Math.floor(y), xf = x - xi, yf = y - yi;
  const u = xf * xf * (3 - 2 * xf), v = yf * yf * (3 - 2 * yf);
  const a = hash2(xi, yi), b = hash2(xi + 1, yi), c = hash2(xi, yi + 1), d = hash2(xi + 1, yi + 1);
  return a + (b - a) * u + (c - a) * v + (a - b - c + d) * u * v;
}
function fbm(x, y, oct, pers) { let a = 1, f = 1, s = 0, n = 0; for (let o = 0; o < oct; o++) { s += a * vnoise(x * f, y * f); n += a; a *= pers; f *= 2.03; } return s / n; }

module.exports = { clamp, hash2, vnoise, fbm };
