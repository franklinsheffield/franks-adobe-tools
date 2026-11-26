// Branded natal wheel (Science is Magic): SVG string. Asc on the left (0 Aries on the left when the birth time is unknown).
const esc = (t) => String(t).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const SIGN_GLYPH = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓'];
const ELEM = ['fire','earth','air','water'];
const ELEM_COL = { fire: '#f2a65a', earth: '#c9b26b', air: '#8fd3e8', water: '#7d8cf0' };
export const GLYPH = { sun: '☉', moon: '☽', mercury: '☿', venus: '♀', mars: '♂', jupiter: '♃', saturn: '♄', uranus: '♅', neptune: '♆', pluto: '♇', node: '☊' };
const ASP_COL = { conjunction: '#f5c542', opposition: '#e0607e', square: '#e0607e', trine: '#3fe0c5', sextile: '#3fe0c5', quincunx: '#a98cf0' };

export function wheelSvg(c, { size = 1200, title = 'Natal Chart', subtitle = '' } = {}) {
  const W = size, H = size + 140, cx = W / 2, cy = 140 + size / 2;
  const R = size * 0.42, rSign = R * 0.85, rHouse = R * 0.56, rPl = R * 0.71, rAsp = R * 0.44;
  const asc = c.cusps ? c.get('asc').lon : 0;
  const ang = (L) => Math.PI - (L - asc) * Math.PI / 180; // Asc at 9 o'clock, counter-clockwise
  const P = (L, r) => [cx + r * Math.cos(ang(L)), cy + r * Math.sin(ang(L))];
  const f = (n) => n.toFixed(1);
  let s = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}" viewBox="0 0 ${W} ${H}" font-family="DejaVu Sans">`;
  s += `<defs><radialGradient id="bg" cx="50%" cy="55%" r="70%"><stop offset="0" stop-color="#2a1458"/><stop offset="1" stop-color="#0b0618"/></radialGradient>
  <radialGradient id="core" r="60%"><stop offset="0" stop-color="#1c0f3c"/><stop offset="1" stop-color="#120a28"/></radialGradient></defs>`;
  s += `<rect width="${W}" height="${H}" fill="url(#bg)"/>`;
  // stars
  let seed = 7; const rnd = () => (seed = (seed * 16807) % 2147483647) / 2147483647;
  for (let i = 0; i < 140; i++) s += `<circle cx="${f(rnd() * W)}" cy="${f(rnd() * H)}" r="${f(0.6 + rnd() * 1.6)}" fill="#fff" opacity="${f(0.25 + rnd() * 0.6)}"/>`;
  s += `<text x="${cx}" y="66" fill="#f5c542" font-size="44" font-weight="bold" text-anchor="middle" letter-spacing="3">${esc(title)}</text>`;
  s += `<text x="${cx}" y="108" fill="#cdbdf5" font-size="24" text-anchor="middle">${esc(subtitle)}</text>`;
  // rings
  s += `<circle cx="${cx}" cy="${cy}" r="${R}" fill="#170c33" stroke="#f5c542" stroke-width="4"/>`;
  // sign band with element tint
  for (let i = 0; i < 12; i++) {
    const a0 = i * 30, a1 = a0 + 30, col = ELEM_COL[ELEM[i % 4]];
    const [x0, y0] = P(a0, R), [x1, y1] = P(a1, R), [x2, y2] = P(a1, rSign), [x3, y3] = P(a0, rSign);
    s += `<path d="M${f(x0)} ${f(y0)} A${R} ${R} 0 0 1 ${f(x1)} ${f(y1)} L${f(x2)} ${f(y2)} A${rSign} ${rSign} 0 0 0 ${f(x3)} ${f(y3)} Z" fill="${col}" fill-opacity="0.13" stroke="#f5c542" stroke-opacity="0.7" stroke-width="1.5"/>`;
    const [gx, gy] = P(a0 + 15, (R + rSign) / 2);
    s += `<text x="${f(gx)}" y="${f(gy + 13)}" fill="${col}" font-size="38" text-anchor="middle">${SIGN_GLYPH[i]}</text>`;
    for (let d = 1; d < 30; d++) { const [a, b] = P(a0 + d, rSign), [c2, d2] = P(a0 + d, rSign - (d % 5 ? 6 : 12)); s += `<line x1="${f(a)}" y1="${f(b)}" x2="${f(c2)}" y2="${f(d2)}" stroke="#f5c542" stroke-opacity="0.45" stroke-width="1"/>`; }
  }
  s += `<circle cx="${cx}" cy="${cy}" r="${rHouse}" fill="url(#core)" stroke="#f5c542" stroke-opacity="0.8" stroke-width="2"/>`;
  s += `<circle cx="${cx}" cy="${cy}" r="${rAsp}" fill="#0e0722" stroke="#a98cf0" stroke-opacity="0.6" stroke-width="1.5"/>`;
  // houses
  if (c.cusps) c.cusps.forEach((L, i) => {
    const angular = c.system === 'placidus' && i % 3 === 0;
    const [x0, y0] = P(L, angular ? R + 18 : rSign), [x1, y1] = P(L, rAsp);
    s += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${angular ? '#f5c542' : '#a98cf0'}" stroke-width="${angular ? 3 : 1.4}" stroke-opacity="${angular ? 1 : 0.7}"/>`;
    const next = c.cusps[(i + 1) % 12]; const mid = L + (((next - L) % 360) + 360) % 360 / 2;
    const [tx, ty] = P(mid, (rHouse + rAsp) / 2);
    s += `<text x="${f(tx)}" y="${f(ty + 8)}" fill="#a98cf0" font-size="22" text-anchor="middle" opacity="0.85">${i + 1}</text>`;
  });
  const lbl = c.cusps ? [['ASC', c.get('asc').lon], ['MC', c.get('mc').lon]] : [];
  if (c.cusps && c.system !== 'placidus') for (const [, L] of lbl) for (const L2 of [L, L + 180]) {
    const [x0, y0] = P(L2, R + 18), [x1, y1] = P(L2, rHouse);
    s += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="#f5c542" stroke-width="3"/>`;
  }
  for (const [t, L] of lbl) { const [x, y] = P(L, R + 44); s += `<text x="${f(x)}" y="${f(y + 9)}" fill="#f5c542" font-size="24" font-weight="bold" text-anchor="middle">${t}</text>`; }
  // aspects
  const pts = c.points.filter((p) => GLYPH[p.key]);
  for (const a of c.aspects) {
    if (a.type === 'conjunction') continue;
    const A1 = c.get(a.a), B1 = c.get(a.b);
    if (!GLYPH[A1.key] || !GLYPH[B1.key]) continue;
    const [x0, y0] = P(A1.lon, rAsp), [x1, y1] = P(B1.lon, rAsp);
    s += `<line x1="${f(x0)}" y1="${f(y0)}" x2="${f(x1)}" y2="${f(y1)}" stroke="${ASP_COL[a.type]}" stroke-width="${f(3 - a.orb * 0.3)}" stroke-opacity="0.8"/>`;
  }
  // planets: spread overlapping glyphs
  const sorted = [...pts].sort((a, b) => a.lon - b.lon); const disp = sorted.map((p) => p.lon);
  for (let it = 0; it < 30; it++) for (let i = 0; i < disp.length; i++) {
    const j = (i + 1) % disp.length; let d = ((disp[j] - disp[i]) % 360 + 360) % 360;
    if (d < 7.5) { const push = (7.5 - d) / 2; disp[i] -= push; disp[j] += push; }
  }
  sorted.forEach((p, i) => {
    const [mx, my] = P(p.lon, rSign), [m2x, m2y] = P(p.lon, rSign - 16), [gx, gy] = P(disp[i], rPl);
    const col = p.key === 'sun' || p.key === 'moon' ? '#f5c542' : '#ffffff';
    s += `<line x1="${f(mx)}" y1="${f(my)}" x2="${f(m2x)}" y2="${f(m2y)}" stroke="#3fe0c5" stroke-width="3"/>`;
    s += `<line x1="${f(m2x)}" y1="${f(m2y)}" x2="${f(gx)}" y2="${f(gy)}" stroke="#3fe0c5" stroke-opacity="0.35" stroke-width="1"/>`;
    s += `<circle cx="${f(gx)}" cy="${f(gy)}" r="24" fill="#0b0618" stroke="${col}" stroke-opacity="0.6" stroke-width="1.5"/>`;
    s += `<text x="${f(gx)}" y="${f(gy + 11)}" fill="${col}" font-size="32" text-anchor="middle">${GLYPH[p.key]}</text>`;
    const [dx, dy] = P(disp[i], rPl - 42);
    s += `<text x="${f(dx)}" y="${f(dy + 6)}" fill="#cdbdf5" font-size="16" text-anchor="middle">${Math.floor(p.deg)}°${p.retro ? 'r' : ''}</text>`;
  });
  // atom sigil at centre
  s += `<g transform="translate(${cx} ${cy})" fill="none" stroke-width="2.5">`;
  for (const [rot, col] of [[0, '#f5c542'], [60, '#a98cf0'], [120, '#3fe0c5']]) s += `<ellipse rx="44" ry="15" transform="rotate(${rot})" stroke="${col}" opacity="0.9"/>`;
  s += `<circle r="7" fill="#f5c542" stroke="none"/></g>`;
  s += `<text x="${cx}" y="${H - 18}" fill="#a98cf0" font-size="18" text-anchor="middle" opacity="0.8">SCIENCE IS MAGIC · tropical · ${!c.timeKnown ? 'birth time unknown, no houses' : !c.cusps ? 'no houses' : c.system === 'placidus' ? 'Placidus houses' : 'Whole Sign houses'}</text>`;
  return s + '</svg>';
}
