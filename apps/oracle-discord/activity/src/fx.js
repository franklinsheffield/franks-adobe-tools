// Animated layers for the Essence store: a moving background for every vibe, extra detail and motion on the
// table cloths, and glass effects inside the crystal balls. Pure SVG strings; chamber.css runs the animations
// (vx-* for vibes, cx-* for cloths, ox-* for balls). Nothing here uses class names containing "k-" or starting
// with "t-", which the table's casting rules reserve.

const r = (n) => Number(n.toFixed(1));
const rand = (seed) => () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
const st = (o) => `style="${Object.entries(o).map(([k, v]) => `--${k}:${v}`).join(";")}"`;
const many = (n, f) => Array.from({ length: n }, (_, i) => f(i)).join("");

// ---------------------------------------------------------------- vibes: animated backgrounds
// Each returns an SVG drawn in a 400 x 300 box that is scaled to cover its pane. `p` keeps ids unique per pane.
const wrapV = (p, defs, body) => `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
  <filter id="${p}-b" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter>
  <filter id="${p}-g" x="-100%" y="-100%" width="300%" height="300%"><feGaussianBlur stdDeviation="1.6"/></filter>${defs}</defs>${body}</svg>`;

const rising = (R, n, col, { size = [1, 2.6], t = [8, 16], o = 0.8, glow = "" } = {}) => many(n, () =>
  `<circle class="vx-rise" cx="${r(R() * 400)}" cy="${r(300 + R() * 20)}" r="${r(size[0] + R() * (size[1] - size[0]))}" fill="${col}" ${glow} ${st({ t: r(t[0] + R() * (t[1] - t[0])) + "s", d: -r(R() * t[1]) + "s", o, x: r(R() * 60 - 30) + "px" })}/>`);
const falling = (R, n, col, { size = [0.8, 2.2], t = [7, 14], o = 0.8 } = {}) => many(n, () =>
  `<circle class="vx-fall" cx="${r(R() * 400)}" cy="-10" r="${r(size[0] + R() * (size[1] - size[0]))}" fill="${col}" ${st({ t: r(t[0] + R() * (t[1] - t[0])) + "s", d: -r(R() * t[1]) + "s", o, x: r(R() * 50 - 25) + "px" })}/>`);
const twinkles = (R, n, cols, yMax = 300) => many(n, (i) =>
  `<circle class="vx-tw" cx="${r(R() * 400)}" cy="${r(R() * yMax)}" r="${r(0.6 + R() * 1.6)}" fill="${cols[i % cols.length]}" ${st({ t: r(2 + R() * 4) + "s", d: -r(R() * 5) + "s" })}/>`);
const fireflies = (R, n, col, p) => many(n, () =>
  `<circle class="vx-fly" cx="${r(20 + R() * 360)}" cy="${r(60 + R() * 220)}" r="${r(1.4 + R() * 1.4)}" fill="${col}" filter="url(#${p}-g)" ${st({ t: r(5 + R() * 6) + "s", d: -r(R() * 8) + "s" })}/>`);

export const VIBE_FX = {
  chamber: (p, R) => wrapV(p, "", `<ellipse class="vx-drift" cx="110" cy="90" rx="120" ry="60" fill="#6a2ad0" opacity=".22" filter="url(#${p}-b)" ${st({ t: "18s" })}/>
    <ellipse class="vx-drift" cx="300" cy="210" rx="130" ry="70" fill="#ff4fb3" opacity=".12" filter="url(#${p}-b)" ${st({ t: "23s", d: "-9s" })}/>
    ${rising(R, 22, "#FADE8C", { o: 0.6 })}${twinkles(R, 18, ["#FADE8C", "#66E0C8"])}`),

  "v-iching": (p, R) => wrapV(p, "", `<circle class="vx-pulse" cx="300" cy="70" r="26" fill="#b8322a" opacity=".85" ${st({ t: "6s" })}/>
    <path d="M0 220 L50 150 L90 190 L140 110 L200 200 L250 140 L300 190 L350 120 L400 180 V300 H0Z" fill="#3a403b" opacity=".55"/>
    <path d="M0 250 L70 190 L120 230 L180 170 L240 240 L310 180 L400 230 V300 H0Z" fill="#1c1f1c" opacity=".75"/>
    ${many(4, (i) => `<ellipse class="vx-pan" cx="${100 + i * 70}" cy="${160 + i * 30}" rx="160" ry="10" fill="#f4efe2" opacity=".28" filter="url(#${p}-b)" ${st({ t: 14 + i * 5 + "s", d: -i * 4 + "s" })}/>`)}
    ${many(5, (i) => `<path class="vx-bird" d="M0 0 q5 -5 10 0 q5 -5 10 0" fill="none" stroke="#1c1f1c" stroke-width="1.6" transform="translate(${-40 - i * 26} ${60 + (i % 3) * 14})" ${st({ t: "22s", d: -i * 1.2 + "s" })}/>`)}`),

  "v-runes": (p, R) => wrapV(p, `<linearGradient id="${p}-au" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#50ffbe" stop-opacity="0"/><stop offset=".5" stop-color="#50ffbe" stop-opacity=".55"/><stop offset="1" stop-color="#8c78ff" stop-opacity="0"/></linearGradient>`,
    `${[0, 1, 2].map((i) => `<path class="vx-wave" d="M-40 ${70 + i * 22} C60 ${30 + i * 20} 140 ${120 + i * 10} 220 ${70 + i * 18} S360 ${40 + i * 12} 440 ${80 + i * 16} L440 ${150 + i * 22} C340 ${120 + i * 14} 220 ${170 + i * 10} 120 ${140 + i * 12} S20 ${150 + i * 10} -40 ${160 + i * 14}Z" fill="url(#${p}-au)" filter="url(#${p}-b)" opacity=".8" ${st({ t: 9 + i * 3 + "s", d: -i * 2 + "s" })}/>`).join("")}
    <path d="M0 250 L60 210 L110 240 L170 200 L230 245 L300 205 L360 235 L400 215 V300 H0Z" fill="#dfe9f2" opacity=".18"/>
    ${twinkles(R, 16, ["#e8fbff"], 150)}${falling(R, 34, "#ffffff", { o: 0.7 })}`),

  "v-oraclebones": (p, R) => wrapV(p, `<radialGradient id="${p}-fire" cx="50%" cy="100%" r="80%"><stop offset="0" stop-color="#ff8a3d" stop-opacity=".55"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>`,
    `<rect class="vx-flicker" width="400" height="300" fill="url(#${p}-fire)" ${st({ t: "1.6s" })}/>
    ${many(6, (i) => `<path d="M${30 + i * 66} 300 l12 -26 l9 14 l10 -30" fill="none" stroke="#2a1406" stroke-width="2" opacity=".5"/>`)}
    ${rising(R, 30, "#ffb066", { size: [0.8, 2], t: [4, 9], o: 0.95, glow: `filter="url(#${p}-g)"` })}`),

  "v-ifa": (p, R) => wrapV(p, "", `<g transform="translate(200 150)"><g class="vx-spin" ${st({ t: "80s" })}>${many(36, (i) => { const a = (i / 36) * Math.PI * 2; return `<ellipse cx="${r(Math.cos(a) * 170)}" cy="${r(Math.sin(a) * 170)}" rx="7" ry="4.5" transform="rotate(${r((a * 180) / Math.PI)} ${r(Math.cos(a) * 170)} ${r(Math.sin(a) * 170)})" fill="#fff6e0" opacity=".45"/>`; })}</g>
      <g class="vx-spin rev" ${st({ t: "60s" })}>${many(24, (i) => { const a = (i / 24) * Math.PI * 2; return `<circle cx="${r(Math.cos(a) * 120)}" cy="${r(Math.sin(a) * 120)}" r="3" fill="#E2B04A" opacity=".5"/>`; })}</g>
      <circle r="90" fill="none" stroke="#E2B04A" stroke-dasharray="2 8" opacity=".35"/></g>
    ${rising(R, 14, "#fff6e0", { o: 0.5, t: [10, 18] })}`),

  "v-astrology": (p, R) => wrapV(p, "", `${twinkles(R, 60, ["#ffffff", "#FADE8C", "#9fb8ff"])}
    <g transform="translate(200 150)"><g class="vx-spin" ${st({ t: "120s" })}><circle r="160" fill="none" stroke="#E2B04A" stroke-width=".8" opacity=".35"/>${many(12, (i) => { const a = (i / 12) * Math.PI * 2; return `<text x="${r(Math.cos(a) * 160)}" y="${r(Math.sin(a) * 160 + 5)}" font-size="14" text-anchor="middle" fill="#FADE8C" opacity=".5">${"♈♉♊♋♌♍♎♏♐♑♒♓"[i]}</text>`; })}</g></g>
    ${many(3, (i) => `<line class="vx-shoot" x1="${300 + i * 40}" y1="${20 + i * 30}" x2="${330 + i * 40}" y2="${4 + i * 30}" stroke="#fff" stroke-width="1.6" stroke-linecap="round" ${st({ t: "7s", d: -i * 2.3 + "s" })}/>`)}`),

  "v-humandesign": (p, R) => wrapV(p, "", `${many(9, (i) => `<path class="vx-flow" d="M${r(R() * 400)} -10 L${r(R() * 400)} 310" stroke="${i % 2 ? "#66E0C8" : "#FF4FB3"}" stroke-width="1.4" fill="none" stroke-dasharray="12 60" opacity=".55" ${st({ t: r(3 + R() * 4) + "s", d: -r(R() * 4) + "s" })}/>`)}
    ${many(7, (i) => `<path class="vx-flow" d="M-10 ${r(R() * 300)} L410 ${r(R() * 300)}" stroke="#E2B04A" stroke-width="1" fill="none" stroke-dasharray="8 70" opacity=".45" ${st({ t: r(4 + R() * 4) + "s", d: -r(R() * 4) + "s" })}/>`)}
    ${many(10, () => `<rect class="vx-pulse" x="${r(R() * 380)}" y="${r(R() * 280)}" width="10" height="10" transform="rotate(45)" transform-origin="center" fill="none" stroke="#66E0C8" opacity=".5" ${st({ t: r(2 + R() * 3) + "s", d: -r(R() * 3) + "s" })}/>`)}`),

  "v-numerology": (p, R) => wrapV(p, "", many(26, (i) => { const x = r(i * 15.6 + 6), sz = r(12 + R() * 8);
    return `<text class="vx-fallt" font-family="VT323, monospace" font-size="${sz}" fill="#2aff6a" text-anchor="middle" ${st({ t: r(5 + R() * 7) + "s", d: -r(R() * 10) + "s", o: r(0.3 + R() * 0.6) })}>${many(8, (k) => `<tspan x="${x}" y="${r(-120 + k * sz)}" opacity="${r(0.25 + (k / 8) * 0.75)}">${Math.floor(R() * 10)}</tspan>`)}</text>`; }) + twinkles(R, 10, ["#2aff6a"])),

  "v-chinesezodiac": (p, R) => wrapV(p, `<radialGradient id="${p}-lan" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#ffe08a"/><stop offset=".5" stop-color="#ff4a3d"/><stop offset="1" stop-color="#a01818"/></radialGradient>`,
    `${many(9, (i) => { const x = r(20 + R() * 360), s = r(0.6 + R() * 0.7); return `<g class="vx-rise" ${st({ t: r(12 + R() * 10) + "s", d: -r(R() * 20) + "s", o: 1, x: r(R() * 40 - 20) + "px" })}><g transform="translate(${x} 330) scale(${s})"><g class="vx-sway" ${st({ t: r(3 + R() * 2) + "s" })}>
      <ellipse cx="0" cy="0" rx="26" ry="38" fill="#ffb066" opacity=".45" filter="url(#${p}-b)"/><rect x="-14" y="-18" width="28" height="36" rx="12" fill="url(#${p}-lan)"/><rect x="-8" y="-22" width="16" height="5" fill="#E2B04A"/><rect x="-8" y="17" width="16" height="5" fill="#E2B04A"/><path d="M0 22 V34" stroke="#E2B04A" stroke-width="1.5"/></g></g></g>`; })}
    ${twinkles(R, 20, ["#ffe08a"])}`),

  "v-mayan": (p, R) => wrapV(p, "", `<g transform="translate(320 70)"><g class="vx-spin" ${st({ t: "90s" })}>${many(20, (i) => { const a = (i / 20) * Math.PI * 2; return `<rect x="${r(Math.cos(a) * 110 - 7)}" y="${r(Math.sin(a) * 110 - 7)}" width="14" height="14" rx="3" fill="none" stroke="#4ad6b8" opacity=".45"/>`; })}<circle r="120" fill="none" stroke="#4ad6b8" stroke-width="2" opacity=".3"/><circle r="96" fill="none" stroke="#4ad6b8" opacity=".25"/></g></g>
    ${many(8, (i) => `<path class="vx-sway" d="M${i * 55} 300 C${i * 55 + 10} 240 ${i * 55 - 20} 210 ${i * 55 + 6} 170" stroke="#1f5a4e" stroke-width="6" fill="none" opacity=".55" ${st({ t: 4 + (i % 3) + "s" })}/>`)}
    ${fireflies(R, 18, "#d6ff7a", p)}`),

  "v-egyptian": (p, R) => wrapV(p, "", `<g transform="translate(200 60)"><g class="vx-spin" ${st({ t: "50s" })}>${many(24, (i) => { const a = (i / 24) * Math.PI * 2; return `<path d="M${r(Math.cos(a) * 46)} ${r(Math.sin(a) * 46)} L${r(Math.cos(a + 0.06) * 260)} ${r(Math.sin(a + 0.06) * 260)} L${r(Math.cos(a - 0.06) * 260)} ${r(Math.sin(a - 0.06) * 260)}Z" fill="#FADE8C" opacity=".08"/>`; })}</g><circle r="60" fill="#ffd27a" opacity=".35" filter="url(#${p}-b)"/><circle class="vx-pulse" r="34" fill="#ffdf8a" ${st({ t: "5s" })}/><circle r="24" fill="#fff3c4" opacity=".8"/></g>
    <path d="M0 250 Q100 220 200 245 T400 235 V300 H0Z" fill="#c99a48" opacity=".5"/><path d="M0 270 Q120 245 240 268 T400 260 V300 H0Z" fill="#8a6428" opacity=".6"/>
    ${many(26, () => `<circle class="vx-sand" cx="${r(R() * 400)}" cy="${r(200 + R() * 90)}" r="${r(0.6 + R())}" fill="#f2d79a" ${st({ t: r(4 + R() * 5) + "s", d: -r(R() * 6) + "s" })}/>`)}`),

  "v-celtic": (p, R) => wrapV(p, "", `${many(16, () => { const x = r(R() * 400); return `<g class="vx-leaf" ${st({ t: r(9 + R() * 8) + "s", d: -r(R() * 16) + "s", x: r(R() * 120 - 60) + "px", rot: r(300 + R() * 500) + "deg" })}><path transform="translate(${x} -16)" d="M0 -7 C6 -4 6 4 0 7 C-6 4 -6 -4 0 -7Z M0 -7 V7" fill="${R() < 0.5 ? "#7bbf4a" : "#c9a640"}" stroke="#2f5a1e" stroke-width=".6"/></g>`; })}
    ${fireflies(R, 16, "#e6ff9a", p)}`),

  "v-tarot": (p, R) => wrapV(p, "", `${many(9, (i) => { const x = r(30 + R() * 340), y = r(30 + R() * 240), rot = r(R() * 50 - 25); return `<g transform="translate(${x} ${y}) rotate(${rot})"><g class="vx-card" ${st({ t: r(7 + R() * 6) + "s", d: -r(R() * 8) + "s", x: r(R() * 30 - 15) + "px", y: r(-10 - R() * 20) + "px", rot: r(R() * 30 - 15) + "deg" })}>
      <rect x="-14" y="-23" width="28" height="46" rx="3" fill="#2a0f4a" stroke="#f0c565" stroke-width="1.2" opacity=".6"/><circle r="6" fill="none" stroke="#f0c565" opacity=".6"/><circle r="2" fill="#e7a0ff" opacity=".8"/></g></g>`; })}
    ${twinkles(R, 34, ["#f0c565", "#e7a0ff", "#fff1c9"])}`),
};

export function vibeFx(id, pane) {
  const f = VIBE_FX[id] || VIBE_FX.chamber;
  return f(`vx${pane}`, rand(pane === "o" ? 11 : 29));
}

// ---------------------------------------------------------------- cloths: detail and motion
// Drawn flat in the design's 400 x 400 box around (200, 200); the table squashes it into perspective.
const ringAt = (rad, n, f) => many(n, (i) => { const a = (i / n) * Math.PI * 2 - Math.PI / 2; return f(200 + rad * Math.cos(a), 200 + rad * Math.sin(a), i, a); });
const spinRing = (rad, ink, { dash = "3 9", w = 1.4, t = 40, rev = false } = {}) =>
  `<g transform="translate(200 200)"><g class="cx-spin${rev ? " rev" : ""}" ${st({ t: t + "s" })}><circle r="${rad}" fill="none" stroke="${ink}" stroke-width="${w}" stroke-dasharray="${dash}"/></g></g>`;
const travel = (rad, ink, t = 6, len = 70) => `<circle class="cx-flow" cx="200" cy="200" r="${rad}" fill="none" stroke="#fff" stroke-width="3" stroke-dasharray="${len} ${r(2 * Math.PI * rad - len)}" opacity=".75" ${st({ t: t + "s", c: r(2 * Math.PI * rad) })} filter="url(#tb-glow)"/>`;
const seq = (els, t = 4) => els.map((e, i) => `<g class="cx-seq" ${st({ t: t + "s", d: r((i / els.length) * t) + "s" })}>${e}</g>`).join("");

export const CLOTH_FX = {
  "": (ink) => spinRing(150, ink, { t: 60 }) + travel(132, ink, 8),
  pentacle: (ink) => spinRing(156, ink, { dash: "2 6", t: 50 }) + travel(140, ink, 7) +
    ringAt(131, 5, (x, y, i) => `<g transform="translate(${r(x)} ${r(y - 16)})"><ellipse class="cx-flick" rx="4" ry="8" fill="#ffb347" ${st({ t: r(0.9 + i * 0.17) + "s" })}/><ellipse rx="9" ry="12" fill="#ffb347" opacity=".25" filter="url(#tb-glow)"/></g>`),
  zodiac: (ink) => `<g transform="translate(200 200)"><g class="cx-spin" ${st({ t: "45s" })}>${many(12, (i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M${r(Math.cos(a) * 112)} ${r(Math.sin(a) * 112)} L${r(Math.cos(a) * 146)} ${r(Math.sin(a) * 146)}" stroke="${ink}" stroke-width="1"/>`; })}</g>
    <circle class="cx-pulse" r="30" fill="#FADE8C" opacity=".55" ${st({ t: "3s" })}/><g class="cx-spin rev" ${st({ t: "20s" })}>${many(8, (i) => { const a = (i / 8) * Math.PI * 2; return `<path d="M${r(Math.cos(a) * 34)} ${r(Math.sin(a) * 34)} L${r(Math.cos(a) * 44)} ${r(Math.sin(a) * 44)}" stroke="#FADE8C" stroke-width="3" stroke-linecap="round"/>`; })}</g></g>`,
  spirit: (ink) => `<g class="cx-planchette"><path d="M0 -30 C22 -30 30 0 0 30 C-30 0 -22 -30 0 -30Z" fill="${ink}" fill-opacity=".18" stroke="${ink}" stroke-width="2.5"/><circle cy="-6" r="9" fill="none" stroke="${ink}" stroke-width="2"/><circle cy="-6" r="9" fill="#fff" opacity=".25" class="cx-pulse" ${st({ t: "1.4s" })}/></g>`,
  alchemy: (ink) => spinRing(152, ink, { dash: "1 7", t: 70, rev: true }) +
    seq(["▲", "▼", "△", "▽"].map((g, i) => { const [x, y] = [[200, 60], [340, 200], [200, 340], [60, 200]][i]; return `<circle cx="${x}" cy="${y}" r="16" fill="${ink}" opacity=".25" filter="url(#tb-glow)"/><text x="${x}" y="${y + 6}" font-size="18" text-anchor="middle" fill="${ink}">${g}</text>`; }), 4),
  metatron: (ink) => travel(100, ink, 5, 90) + travel(50, ink, 3.5, 50) + ringAt(100, 6, (x, y, i) => `<circle class="cx-pulse" cx="${r(x)}" cy="${r(y)}" r="6" fill="${ink}" ${st({ t: "3s", d: r(i * 0.5) + "s" })}/>`),
  tarot: (ink) => seq([[160, 200], [160, 268], [92, 200], [160, 132], [228, 200], [310, 284], [310, 228], [310, 172], [310, 116]].map(([x, y]) => `<rect x="${x - 22}" y="${y - 28}" width="44" height="56" rx="5" fill="${ink}" fill-opacity=".22" stroke="#fff" stroke-width="2" filter="url(#tb-glow)"/>`), 6),
  solomon: (ink) => `<g transform="translate(200 200)"><g class="cx-spin" ${st({ t: "35s" })}>${many(24, (i) => { const a = (i / 24) * Math.PI * 2; return `<text x="${r(Math.cos(a) * 160)}" y="${r(Math.sin(a) * 160 + 5)}" font-size="13" text-anchor="middle" fill="${ink}" transform="rotate(${r((a * 180) / Math.PI + 90)} ${r(Math.cos(a) * 160)} ${r(Math.sin(a) * 160)})">${"ᚠᚢᚦᚨᚱᚲᚷᚹᚺᚾᛁᛃᛇᛈᛉᛊᛏᛒᛖᛗᛚᛜᛞᛟ"[i]}</text>`; })}</g>
    <circle class="cx-pulse" r="22" fill="${ink}" opacity=".35" filter="url(#tb-glow)" ${st({ t: "2.6s" })}/></g>`,
  constellations: (ink) => { const R = rand(5); return many(26, () => `<circle class="cx-tw" cx="${r(50 + R() * 300)}" cy="${r(70 + R() * 260)}" r="${r(2 + R() * 2.5)}" fill="#fff" ${st({ t: r(1.5 + R() * 3) + "s", d: -r(R() * 3) + "s" })}/>`) +
    `<line class="cx-shoot" x1="320" y1="90" x2="350" y2="76" stroke="#fff" stroke-width="2" stroke-linecap="round" ${st({ t: "6s" })}/>`; },
  filigree: (ink) => travel(140, ink, 4, 120) + travel(116, ink, 6, 60) + spinRing(152, ink, { dash: "6 4 1 4", t: 90 }),
  moonphases: (ink) => seq(Array.from({ length: 8 }, (_, i) => { const a = (i / 8) * Math.PI * 2 - Math.PI / 2, x = r(200 + 112 * Math.cos(a)), y = r(200 + 112 * Math.sin(a)); return `<circle cx="${x}" cy="${y}" r="17" fill="#fff" opacity=".55" filter="url(#tb-glow)"/>`; }), 8) +
    `<circle class="cx-pulse" cx="200" cy="200" r="40" fill="#e9f0ff" opacity=".35" filter="url(#tb-glow)" ${st({ t: "5s" })}/>`,
  obsidian: (ink) => travel(140, ink, 3, 100) + travel(122, ink, 5, 40) + `<ellipse class="cx-glint" cx="200" cy="200" rx="160" ry="30" fill="#fff" opacity=".1" filter="url(#tb-glow)"/>`,
};

/** Embroidered border, corner medallions and lace along the far edge, in the table's own 400 x 300 box. */
export function clothTrim(ink) {
  const lace = many(19, (i) => { const t = (i + 0.5) / 19, x = r(64 + t * 272), y = r(104 - 4 * 16 * t * (1 - t) + 1); return `<path d="M${r(x - 7)} ${y} a7 6 0 0 0 14 0" fill="none" stroke="${ink}" stroke-width="1"/>`; });
  const medal = (x, y, s) => `<g transform="translate(${x} ${y}) scale(${s} ${s * 0.5})"><circle r="10" fill="none" stroke="${ink}" stroke-width="1.4"/><path d="M0 -10 L3 -3 L10 0 L3 3 L0 10 L-3 3 L-10 0 L-3 -3Z" fill="${ink}" opacity=".6"/></g>`;
  return `<g class="t-trim" opacity=".75">
    <path d="M38 300 L76 116 Q200 101 324 116 L362 300" fill="none" stroke="${ink}" stroke-width="1.3" stroke-dasharray="5 3"/>
    <path d="M46 300 L82 122 Q200 108 318 122 L354 300" fill="none" stroke="${ink}" stroke-width=".7"/>
    ${lace}${medal(84, 124, 1)}${medal(316, 124, 1)}${medal(56, 276, 1.4)}${medal(344, 276, 1.4)}
    <g clip-path="url(#tb-clothclip)"><rect class="cx-sheen" x="-60" y="80" width="90" height="240" fill="url(#tb-sheen)" transform="skewX(-20)"/></g></g>`;
}

// ---------------------------------------------------------------- crystal balls: glass and inner effects
// Drawn in the Oracle's box, clipped to the ball (centre 200, 304; radius 47).
const B = { x: 200, y: 304, r: 47 };
export const ORB_LOOK = {
  amethyst: { glass: 0.72, fx: () => `<g transform="translate(200 304)"><g class="ox-spin" ${st({ t: "18s" })}>${many(6, (i) => { const a = (i / 6) * Math.PI * 2; return `<path d="M0 0 L${r(Math.cos(a) * 30)} ${r(Math.sin(a) * 30)} L${r(Math.cos(a + 0.6) * 22)} ${r(Math.sin(a + 0.6) * 22)}Z" fill="#e6c8ff" opacity=".22" stroke="#fff" stroke-opacity=".35" stroke-width=".6"/>`; })}</g></g>` },
  teal: { glass: 0.5, swirl: false, fx: (R) => `<path class="ox-wave" d="M140 312 Q170 302 200 312 T260 312 V360 H140Z" fill="#2fd6c0" opacity=".55"/><path class="ox-wave rev" d="M140 320 Q170 312 200 320 T260 320 V360 H140Z" fill="#0f8a8a" opacity=".6"/>
    ${many(9, () => `<circle class="ox-bubble" cx="${r(170 + R() * 60)}" cy="340" r="${r(1.2 + R() * 2.4)}" fill="none" stroke="#e8fffb" stroke-width=".8" ${st({ t: r(2 + R() * 2.5) + "s", d: -r(R() * 3) + "s" })}/>`)}` },
  rose: { glass: 0.55, fx: (R) => many(10, () => `<g transform="translate(${r(165 + R() * 70)} ${r(270 + R() * 60)})"><path class="ox-petal" d="M0 -4 C4 -4 5 2 0 5 C-5 2 -4 -4 0 -4Z" fill="#ffc2dc" ${st({ t: r(4 + R() * 4) + "s", d: -r(R() * 5) + "s" })}/></g>`) + `<path class="ox-pulse" d="M200 312 C188 300 190 290 200 296 C210 290 212 300 200 312Z" fill="#ff7ab8" opacity=".8" ${st({ t: "1.2s" })}/>` },
  sunfire: { glass: 0.6, swirl: false, fx: (R) => `<g transform="translate(200 322)"><path class="ox-flame" d="M0 -40 C14 -20 18 -4 0 10 C-18 -4 -14 -20 0 -40Z" fill="#ffb347"/><path class="ox-flame f2" d="M0 -24 C8 -12 10 -2 0 6 C-10 -2 -8 -12 0 -24Z" fill="#fff3b0"/></g>
    ${many(8, () => `<circle class="ox-bubble" cx="${r(185 + R() * 30)}" cy="330" r="1.4" fill="#ffe08a" ${st({ t: r(1.2 + R() * 1.4) + "s", d: -r(R() * 2) + "s" })}/>`)}` },
  void: { glass: 0.9, swirl: false, fx: (R) => many(22, () => `<circle class="ox-tw" cx="${r(155 + R() * 90)}" cy="${r(260 + R() * 90)}" r="${r(0.4 + R() * 1.1)}" fill="#fff" ${st({ t: r(1.5 + R() * 3) + "s", d: -r(R() * 3) + "s" })}/>`) +
    `<g transform="translate(200 304)"><g class="ox-spin" ${st({ t: "14s" })}><ellipse rx="30" ry="6" fill="none" stroke="#b06cff" stroke-width="1" opacity=".6"/></g></g>` },
  opal: { glass: 0.45, fx: () => `<g class="ox-hue"><ellipse cx="190" cy="296" rx="44" ry="20" fill="#ff9ad5" opacity=".35"/><ellipse cx="214" cy="314" rx="40" ry="16" fill="#9af5ff" opacity=".35"/><ellipse cx="196" cy="326" rx="38" ry="12" fill="#d8ff9a" opacity=".3"/></g>` },
  storm: { glass: 0.35, swirl: false, fx: () => `<g transform="translate(200 300)"><g class="ox-spin" ${st({ t: "9s" })}><ellipse cx="-10" cy="-14" rx="30" ry="10" fill="#9aa8c8" opacity=".55"/><ellipse cx="14" cy="-6" rx="26" ry="9" fill="#6a7898" opacity=".55"/></g></g>
    <path class="ox-bolt" d="M204 286 L194 306 L204 306 L196 330" fill="none" stroke="#e8f0ff" stroke-width="2.4" stroke-linejoin="round" ${st({ t: "2.6s" })}/><path class="ox-bolt" d="M214 292 L208 304 L216 306 L210 320" fill="none" stroke="#b8d4ff" stroke-width="1.6" ${st({ t: "3.4s", d: "-1.2s" })}/>` },
  galaxy: { glass: 0.55, swirl: false, fx: (R) => `<g transform="translate(200 304) scale(1 .55)"><g class="ox-spin" ${st({ t: "12s" })}>${many(2, (k) => many(16, (i) => { const a = k * Math.PI + i * 0.32, d = 5 + i * 3.1; return `<circle cx="${r(Math.cos(a) * d)}" cy="${r(Math.sin(a) * d)}" r="${r(2.6 - i * 0.12)}" fill="${i % 3 ? "#cfe0ff" : "#ff9ad5"}" opacity="${r(0.9 - i * 0.04)}"/>`; }))}<circle r="5" fill="#fff6d0"/></g></g>` },
  ghost: { glass: 0.15, swirl: false, fx: (R) => many(4, (i) => `<path class="ox-wisp" d="M${170 + i * 14} 340 C${160 + i * 14} 320 ${186 + i * 14} 300 ${172 + i * 14} 280" fill="none" stroke="#e8f6ff" stroke-width="5" stroke-linecap="round" opacity=".5" filter="url(#t-glow)" ${st({ t: r(3 + i * 0.7) + "s", d: -i + "s" })}/>`) +
    `<g class="ox-pulse" ${st({ t: "4s" })}><circle cx="192" cy="300" r="2.6" fill="#e8f6ff"/><circle cx="208" cy="300" r="2.6" fill="#e8f6ff"/><path d="M194 312 Q200 316 206 312" stroke="#e8f6ff" fill="none"/></g>` },
};

export function orbFx(id) {
  const L = ORB_LOOK[id] || ORB_LOOK.amethyst;
  return { glass: L.glass, swirl: L.swirl !== false, fx: L.fx(rand(13)) };
}
