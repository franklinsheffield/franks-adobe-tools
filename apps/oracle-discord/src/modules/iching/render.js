// Renders a cast as a PNG card: 6 sun/moon coins (bottom line at the bottom), line bars,
// primary hexagram and, when lines change, the hexagram it is heading to.
import { readFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { isYang, isChanging, TRIGRAMS } from './engine.js';

const asset = f => 'data:image/png;base64,' + readFileSync(new URL(`./assets/${f}`, import.meta.url)).toString('base64');
const SUN = asset('sun.png'), MOON = asset('moon.png');
const C = { navy: '#161030', purp: '#2E1E68', gold: '#E2B04A', goldL: '#FADE8C', teal: '#66E0C8', text: '#DCD4FF', dim: '#9C92C8' };
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const fit = (t, max, w) => Math.min(max, Math.floor(w / (String(t).length * 0.62)));
const LABEL = { 6: 'old yin · changing', 7: 'young yang', 8: 'young yin', 9: 'old yang · changing' };

function bars(x, y, bits, w, h, gap, colOf) { // small hexagram glyph, bits bottom->top
  let s = '';
  for (let i = 0; i < 6; i++) {
    const yy = y - i * (h + gap), col = colOf ? colOf(i) : C.gold;
    if (bits[i] === '1') s += `<rect x="${x}" y="${yy}" width="${w}" height="${h}" rx="${h / 3}" fill="${col}"/>`;
    else { const p = w * 0.42; s += `<rect x="${x}" y="${yy}" width="${p}" height="${h}" rx="${h / 3}" fill="${col}"/><rect x="${x + w - p}" y="${yy}" width="${p}" height="${h}" rx="${h / 3}" fill="${col}"/>`; }
  }
  return s;
}

function stars(W, H) {
  let s = '', seed = 11; const r = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 90; i++) s += `<circle cx="${(r() * W).toFixed(1)}" cy="${(r() * H).toFixed(1)}" r="${r() < 0.8 ? 1 : 1.8}" fill="#E6DCFF" opacity="${(0.35 + r() * 0.6).toFixed(2)}"/>`;
  return s;
}

export function renderSvg(reading) {
  const W = 1200, H = 720, rowH = 96, baseY = 610;
  const { values, primary, relating, question } = reading;
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="DejaVu Sans, sans-serif">
  <defs><radialGradient id="bg" cx="0.45" cy="0.3" r="0.9"><stop offset="0" stop-color="#34227A"/><stop offset="1" stop-color="#0E0A1E"/></radialGradient>
  <filter id="glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="9"/></filter></defs>
  <rect width="${W}" height="${H}" fill="url(#bg)"/>${stars(W, H)}
  <rect x="14" y="14" width="${W - 28}" height="${H - 28}" rx="18" fill="none" stroke="${C.gold}" stroke-opacity="0.55" stroke-width="2"/>`;
  if (question) s += `<text x="60" y="66" font-size="24" fill="${C.dim}" font-style="italic">“${esc(question.length > 70 ? question.slice(0, 68) + '…' : question)}”</text>`;
  for (let i = 0; i < 6; i++) {
    const v = values[i], y = baseY - i * rowH, ch = isChanging(v), col = ch ? C.teal : C.gold;
    if (ch) s += `<circle cx="104" cy="${y}" r="44" fill="${C.teal}" opacity="0.7" filter="url(#glow)"/>`;
    s += `<image href="${isYang(v) ? SUN : MOON}" x="64" y="${y - 40}" width="80" height="80"/>`;
    if (isYang(v)) s += `<rect x="176" y="${y - 13}" width="300" height="26" rx="7" fill="${col}"/>`;
    else s += `<rect x="176" y="${y - 13}" width="128" height="26" rx="7" fill="${col}"/><rect x="348" y="${y - 13}" width="128" height="26" rx="7" fill="${col}"/>`;
    s += `<text x="500" y="${y + 7}" font-size="19" fill="${ch ? C.teal : C.dim}">${i + 1} · ${LABEL[v]}</text>`;
  }
  // right panel: primary (+ relating)
  const px = 760, p = primary.text;
  s += `<text x="${px}" y="140" font-size="20" fill="${C.dim}" letter-spacing="3">HEXAGRAM</text>
  <text x="${px}" y="214" font-size="78" font-weight="bold" fill="${C.goldL}">${primary.number}</text>
  <text x="${px}" y="262" font-size="${fit(p.en, 34, 400)}" font-weight="bold" fill="${C.text}">${esc(p.en)}</text>
  <text x="${px}" y="298" font-size="22" fill="${C.dim}">${esc(p.py)} · ${TRIGRAMS[primary.upper].hz} ${TRIGRAMS[primary.upper].name} over ${TRIGRAMS[primary.lower].hz} ${TRIGRAMS[primary.lower].name}</text>`;
  if (relating) {
    const r = relating.text;
    s += `<text x="${px}" y="388" font-size="20" fill="${C.teal}" letter-spacing="3">BECOMING</text>
    ${bars(px, 560, relating.bits, 92, 13, 9, i => (values[i] === 6 || values[i] === 9 ? C.teal : C.gold))}
    <text x="${px + 120}" y="470" font-size="54" font-weight="bold" fill="${C.teal}">${relating.number}</text>
    <text x="${px + 120}" y="510" font-size="${fit(r.en, 26, 290)}" font-weight="bold" fill="${C.text}">${esc(r.en)}</text>
    <text x="${px + 120}" y="542" font-size="20" fill="${C.dim}">${esc(r.py)}</text>`;
  } else {
    s += `<text x="${px}" y="400" font-size="22" fill="${C.dim}">No changing lines:</text><text x="${px}" y="430" font-size="22" fill="${C.dim}">the situation is stable.</text>`;
  }
  s += `<text x="${W - 40}" y="${H - 36}" font-size="17" fill="${C.gold}" fill-opacity="0.8" text-anchor="end">Science is Magic · I Ching</text></svg>`;
  return s;
}

export function renderPng(reading) {
  return new Resvg(renderSvg(reading), { font: { loadSystemFonts: true, defaultFontFamily: 'DejaVu Sans' } }).render().asPng();
}
