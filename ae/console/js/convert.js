"use strict";
// Lab Console: Photoshop look <-> AE/Premiere effect values. Shared by the After Effects
// console (CEP), the Premiere console (UXP) and the node generator ae/tools/gen-ppro-map.js.
// A tool entry comes from brewmap.js (keys, defaults); values are keyed by the effect's param id.
// Colours are [r, g, b, a] in 0..1 (After Effects scripting and Premiere ppro.Color both use that).
(function (root, factory) {
  const api = factory();
  if (typeof module === "object" && module.exports) module.exports = api;
  else root.LabConvert = api;
})(typeof self !== "undefined" ? self : this, function () {
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  function merge(base, patch) {
    const out = JSON.parse(JSON.stringify(base));
    (function rec(d, s) { for (const k of Object.keys(s || {})) { if (isObj(s[k]) && isObj(d[k])) rec(d[k], s[k]); else d[k] = JSON.parse(JSON.stringify(s[k])); } })(out, patch);
    return out;
  }
  const getPath = (o, k) => k.split(".").reduce((a, s) => (a == null ? a : a[s]), o);
  function setPath(o, k, v) {         // numeric parts make arrays ("glow.modules.0.on")
    const s = k.split("."); let a = o;
    for (let i = 0; i < s.length - 1; i++) { const nx = /^\d+$/.test(s[i + 1]); if (!(a[s[i]] && typeof a[s[i]] === "object")) a[s[i]] = nx ? [] : {}; a = a[s[i]]; }
    a[s[s.length - 1]] = v;
  }
  function hexToAE(h) { const n = parseInt(String(h || "#000000").replace("#", ""), 16) || 0; return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1]; }
  function aeToHex(c) { return "#" + c.slice(0, 3).map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, "0")).join("").toUpperCase(); }
  function psToAE(t, p) {
    const full = merge(t.defaults, p), out = {};
    for (const [k, e] of Object.entries(t.keys)) {
      const v = getPath(full, k); if (v === undefined) continue;
      if (e.kind === "num") out[e.id] = Number(v);
      else if (e.kind === "bool") out[e.id] = v === true || v === "true" ? 1 : 0;
      else if (e.kind === "color") out[e.id] = hexToAE(v);
      else if (e.kind === "popup") out[e.id] = e.values ? Math.max(1, e.values.indexOf(String(v)) + 1) : (e.map[String(v)] || e.other);
      else if (e.kind === "stops" && Array.isArray(v)) {
        const n = Math.max(e.min, Math.min(e.max, v.length)), st = e.stride || 2;
        if (e.stops != null) out[e.stops] = n - 1;
        for (let s = 0; s < n && s < v.length; s++) { out[e.c + st * s] = hexToAE(v[s].c); if (e.p != null) out[e.p + st * s] = Number(v[s].p); }
      } else if (e.kind === "list" && Array.isArray(v)) {         // colour list + count popup
        const n = Math.max(e.min, Math.min(e.max, v.length));
        out[e.count] = n - e.countOff;
        for (let s = 0; s < n && s < v.length; s++) out[e.c + e.stride * s] = hexToAE(v[s]);
      } else if (e.kind === "optcolor") {                            // "" = none
        out[e.on] = v ? 1 : 0; if (v) out[e.id] = hexToAE(v);
      }
    }
    return out;
  }
  function aeToPS(t, vals) {
    const p = {};
    for (const [k, e] of Object.entries(t.keys)) {
      const id = e.kind === "stops" ? (e.stops != null ? e.stops : e.c) : e.kind === "list" ? e.count : e.kind === "optcolor" ? e.on : e.id, v = vals[id]; if (v === undefined) continue;
      let o;
      if (e.kind === "num") o = Math.round(v * 1000) / 1000;
      else if (e.kind === "bool") o = !!v;
      else if (e.kind === "color") o = aeToHex(v);
      else if (e.kind === "popup") {
        if (e.values) o = e.values[v - 1] || e.values[0];
        else { o = Object.keys(e.map).find((x) => e.map[x] === v); if (o === undefined) o = getPath(t.defaults, k); if (/^\d+$/.test(o) && typeof getPath(t.defaults, k) === "number") o = Number(o); }
      } else if (e.kind === "stops") {
        const st = e.stride || 2, n = e.stops != null ? v + 1 : e.max;
        o = []; for (let s = 0; s < n; s++) if (vals[e.c + st * s]) o.push({ p: e.p != null ? Math.round(vals[e.p + st * s]) : Math.round(100 * s / Math.max(1, n - 1)), c: aeToHex(vals[e.c + st * s]) });
      } else if (e.kind === "list") {
        o = []; for (let s = 0; s < v + e.countOff; s++) if (vals[e.c + e.stride * s]) o.push(aeToHex(vals[e.c + e.stride * s]));
      } else if (e.kind === "optcolor") {
        o = v && vals[e.id] ? aeToHex(vals[e.id]) : "";
      } else continue;
      setPath(p, k, o);
    }
    return p;
  }
  return { isObj, merge, getPath, setPath, hexToAE, aeToHex, psToAE, aeToPS };
});
