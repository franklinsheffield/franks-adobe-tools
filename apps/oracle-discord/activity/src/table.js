// The reading table (top right of the Chamber): a velvet table where each system's tools rest, are cast with an
// animation, and then the real reading art is laid down. Drawn in a 400 x 300 SVG; the CSS in chamber.css animates
// the k-* classes. Casting shows tools face down or in motion only, so nothing on the table contradicts the reading.

const G = { gold: "#E2B04A", light: "#FADE8C", pink: "#FF4FB3", teal: "#66E0C8", cream: "#F3E3C3", dark: "#160b2c" };
const f1 = (n) => Number(n.toFixed(1));

function tableSvg(inner) {
  return `<svg viewBox="0 0 400 300" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
<defs>
  <radialGradient id="tb-cloth" cx="50%" cy="65%" r="75%"><stop offset="0" style="stop-color:var(--cloth1,#5a2a8a)"/><stop offset=".55" style="stop-color:var(--cloth2,#36185e)"/><stop offset="1" style="stop-color:var(--cloth3,#170a2e)"/></radialGradient>
  <linearGradient id="tb-edge" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2a1248"/><stop offset="1" stop-color="#0d0618"/></linearGradient>
  <radialGradient id="tb-flame" cx="50%" cy="70%" r="60%"><stop offset="0" stop-color="#fff"/><stop offset=".4" stop-color="${G.light}"/><stop offset="1" stop-color="#ff8a3d" stop-opacity="0"/></radialGradient>
  <radialGradient id="tb-halo" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="${G.light}" stop-opacity=".45"/><stop offset="1" stop-color="${G.light}" stop-opacity="0"/></radialGradient>
  <radialGradient id="tb-coin" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".5" stop-color="${G.gold}"/><stop offset="1" stop-color="#8a5c16"/></radialGradient>
  <radialGradient id="tb-stone" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#e9e4f2"/><stop offset=".6" stop-color="#a39cb8"/><stop offset="1" stop-color="#5e5674"/></radialGradient>
  <radialGradient id="tb-bone" cx="45%" cy="40%" r="65%"><stop offset="0" stop-color="#fff8e6"/><stop offset=".7" stop-color="#e6d2a6"/><stop offset="1" stop-color="#b89a62"/></radialGradient>
  <radialGradient id="tb-seed" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#d79b5a"/><stop offset="1" stop-color="#5a2e10"/></radialGradient>
  <radialGradient id="tb-sun" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFF1B8"/><stop offset=".6" stop-color="${G.gold}"/><stop offset="1" stop-color="#c46a16"/></radialGradient>
  <filter id="tb-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter>
  <filter id="tb-shadow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="2.5"/></filter>
</defs>
<path d="M22 300 L64 104 Q200 88 336 104 L378 300Z" fill="url(#tb-cloth)"/>
<path d="M64 104 Q200 88 336 104" fill="none" stroke="${G.gold}" stroke-width="2"/>
<path d="M22 300 L64 104 M378 300 L336 104" stroke="${G.gold}" stroke-width="1.2" opacity=".6"/>
<g class="t-sigil" fill="none" stroke="${G.gold}" opacity=".38">
  <ellipse cx="200" cy="200" rx="150" ry="74" stroke-width="1.4"/><ellipse cx="200" cy="200" rx="132" ry="64" stroke-width=".8" stroke-dasharray="3 6"/>
  <ellipse cx="200" cy="200" rx="64" ry="31" stroke-width=".8"/>
  <path d="M50 200 H350 M200 126 V274" stroke-width=".6" opacity=".6"/>
</g>
<g class="t-candle"><ellipse cx="84" cy="122" rx="30" ry="12" fill="url(#tb-halo)"/><rect x="76" y="96" width="16" height="30" rx="3" fill="#efe3cf"/><path d="M78 98 q2 8 0 12 M88 98 q-1 6 1 10" stroke="#d8c8ad" stroke-width="2" fill="none"/>
  <path class="t-flame" d="M84 76 C90 86 90 92 84 96 C78 92 78 86 84 76Z" fill="url(#tb-flame)"/><circle class="t-flicker" cx="84" cy="88" r="22" fill="url(#tb-halo)"/></g>
<g class="t-candle"><ellipse cx="316" cy="122" rx="30" ry="12" fill="url(#tb-halo)"/><rect x="308" y="102" width="16" height="24" rx="3" fill="#efe3cf"/>
  <path class="t-flame t2" d="M316 82 C322 92 322 98 316 102 C310 98 310 92 316 82Z" fill="url(#tb-flame)"/><circle class="t-flicker t2" cx="316" cy="94" r="22" fill="url(#tb-halo)"/></g>
<g id="tb-cast">${inner}</g>
</svg>`;
}

const shadow = (x, y, rx, ry = rx * 0.35) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" fill="#000" opacity=".4" filter="url(#tb-shadow)"/>`;
const d = (i, step = 0.16, base = 0) => `style="--d:${f1(base + i * step)}s"`;

// ---- each system's tools, cast with the k-* animations ----
const SCENES = {
  iching() {
    const pos = [[140, 172], [200, 166], [260, 172], [140, 226], [200, 232], [260, 226]];
    return pos.map(([x, y], i) => `<g transform="translate(${x} ${y})">${shadow(0, 14, 15)}<g class="k-drop" ${d(i)}><g class="k-flip" ${d(i)}>
      <circle r="17" fill="url(#tb-coin)" stroke="#7a4f12" stroke-width="1.5"/><circle r="12.5" fill="none" stroke="#7a4f12" stroke-width="1" opacity=".7"/>
      <rect x="-4.5" y="-4.5" width="9" height="9" fill="#2a1406"/><g fill="#7a4f12">${[0, 1, 2, 3].map((k) => `<circle cx="${f1(8.5 * Math.cos(k * 1.5708 + 0.785))}" cy="${f1(8.5 * Math.sin(k * 1.5708 + 0.785))}" r="1.4"/>`).join("")}</g></g></g></g>`).join("");
  },
  runes() {
    const pos = [[150, 180, -12], [204, 170, 8], [258, 182, -4], [176, 230, 14], [234, 232, -10]];
    const stone = `<path d="M-15 -9 C-12 -19 10 -20 15 -10 C19 0 14 14 0 15 C-14 15 -19 2 -15 -9Z" fill="url(#tb-stone)" stroke="#4a4360" stroke-width="1"/><path d="M-9 -10 C-4 -14 6 -14 9 -10" stroke="#fff" stroke-width="1.5" opacity=".5" fill="none"/>`;
    return `<g transform="translate(92 236)"><path d="M-26 6 C-30 -16 -16 -28 0 -28 C16 -28 30 -16 26 6 C22 22 -22 22 -26 6Z" fill="#6b3a1c" stroke="#3a1e0c" stroke-width="1.5"/><path d="M-14 -24 Q0 -16 14 -24" stroke="${G.gold}" stroke-width="2.5" fill="none"/><path class="k-only k-tie" d="M0 -26 l-6 -10 M0 -26 l6 -10" stroke="${G.gold}" stroke-width="2"/></g>` +
      pos.map(([x, y, r], i) => `<g transform="translate(${x} ${y})">${shadow(0, 12, 16)}<g class="k-toss" style="--d:${f1(0.2 + i * 0.2)}s;--sx:${92 - x}px;--sy:${236 - y}px;--r:${r}deg">${stone}</g></g>`).join("");
  },
  oraclebones() {
    const cracks = ["M200 196 L212 178 L220 182 L232 166", "M200 196 L186 182 L190 172", "M200 196 L214 206 L232 204", "M200 196 L192 214 L180 220"];
    return `<g transform="translate(200 196)">${shadow(0, 30, 92, 22)}
      <path d="M-86 -6 C-80 -46 -36 -60 0 -60 C36 -60 80 -46 86 -6 C90 30 50 56 0 58 C-50 56 -90 30 -86 -6Z" fill="url(#tb-bone)" stroke="#8a6a3a" stroke-width="1.6"/>
      <path d="M0 -60 V58 M-84 -12 H84 M-78 22 H78 M-60 -44 Q0 -30 60 -44" stroke="#b49460" stroke-width="1.2" fill="none" opacity=".8"/>
      ${[-54, -26, 26, 54].map((x) => `<ellipse cx="${x}" cy="4" rx="7" ry="11" fill="#c9ad78" opacity=".6"/>`).join("")}</g>
    <g class="k-only k-poke"><path d="M380 100 L210 190" stroke="#6b4a1a" stroke-width="7" stroke-linecap="round"/><path d="M380 100 L320 132" stroke="#3a220c" stroke-width="10" stroke-linecap="round"/><circle cx="210" cy="190" r="6" fill="#ff8a3d"/><circle cx="210" cy="190" r="14" fill="#ff8a3d" opacity=".5" filter="url(#tb-glow)"/></g>
    <g class="k-only" fill="none" stroke-linecap="round">${cracks.map((p, i) => `<path class="k-crack" ${d(i, 0.18, 1.1)} d="${p}" stroke="#ffb066" stroke-width="5" opacity=".6" filter="url(#tb-glow)"/><path class="k-crack" ${d(i, 0.18, 1.1)} d="${p}" stroke="#2a1406" stroke-width="2"/>`).join("")}</g>
    <g class="k-only">${[0, 1, 2, 3, 4, 5].map((i) => `<circle class="k-spark" style="--d:${f1(0.9 + i * 0.12)}s;--sx:${f1(Math.cos(i * 1.1) * 40)}px;--sy:${f1(-20 - Math.abs(Math.sin(i * 1.7)) * 40)}px" cx="205" cy="192" r="2.2" fill="${G.light}"/>`).join("")}
      ${[0, 1, 2].map((i) => `<ellipse class="k-smoke" ${d(i, 0.35, 1.2)} cx="${196 + i * 6}" cy="176" rx="10" ry="6" fill="#d9d0ee" opacity="0" filter="url(#tb-glow)"/>`).join("")}</g>`;
  },
  ifa() {
    const P = [[110, 136], [130, 280], [270, 280], [290, 136]], pt = (t) => { const u = 1 - t; return [0, 1].map((k) => u * u * u * P[0][k] + 3 * u * u * t * P[1][k] + 3 * u * t * t * P[2][k] + t * t * t * P[3][k]); };
    const seeds = Array.from({ length: 8 }, (_, i) => pt((i + 0.5) / 8));
    const path = `M${P[0]} C${P[1]} ${P[2]} ${P[3]}`;
    return `<path d="${path}" fill="none" stroke="#000" stroke-width="5" opacity=".35" filter="url(#tb-shadow)" transform="translate(0 6)"/>
      <path class="k-chain" d="${path}" fill="none" stroke="${G.gold}" stroke-width="2.4" stroke-dasharray="4 3"/>
      ${seeds.map(([x, y], i) => `<g transform="translate(${f1(x)} ${f1(y)})"><g class="k-pop" ${d(i, 0.14, 0.5)}><ellipse rx="13" ry="9" fill="url(#tb-seed)" stroke="#3a1e0c" stroke-width="1.2"/><path d="M-9 0 Q0 -5 9 0" stroke="#f2c48a" stroke-width="1.2" fill="none" opacity=".7"/></g></g>`).join("")}`;
  },
  astrology() {
    const signs = "♈♉♊♋♌♍♎♏♐♑♒♓", R = 70;
    return `<g transform="translate(200 196) scale(1 .62)">${shadow(0, 8, 104, 104)}
      <g class="k-spin"><circle r="${R + 22}" fill="#120830" stroke="${G.gold}" stroke-width="2"/><circle r="${R}" fill="none" stroke="${G.gold}" stroke-width="1"/>
      ${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 6.2832; return `<line x1="${f1(R * Math.cos(a))}" y1="${f1(R * Math.sin(a))}" x2="${f1((R + 22) * Math.cos(a))}" y2="${f1((R + 22) * Math.sin(a))}" stroke="${G.gold}" stroke-width=".8"/><text x="${f1((R + 11) * Math.cos(a + 0.26))}" y="${f1((R + 11) * Math.sin(a + 0.26) + 5)}" font-size="13" text-anchor="middle" fill="${G.light}">${signs[i]}</text>`; }).join("")}</g>
      <circle r="${R - 2}" fill="none" stroke="${G.teal}" stroke-width=".6" opacity=".5"/>
      ${["☉", "☽", "☿", "♀", "♂", "♃", "♄"].map((g, i) => `<g class="k-orbit" style="--d:${f1(i * 0.1)}s;--t:${f1(2.4 + i * 0.7)}s"><text x="${36 + (i % 3) * 10}" y="5" font-size="14" text-anchor="middle" fill="${i % 2 ? G.teal : G.pink}" class="k-pop" ${d(i, 0.12, 0.3)}>${g}</text></g>`).join("")}
      <circle r="5" fill="${G.light}" class="k-pulse"/></g>`;
  },
  humandesign() {
    const C = [["tri", 200, 120, 1], ["tri", 200, 146, -1], ["sq", 200, 172], ["dia", 200, 202], ["tri", 228, 214, 1], ["sq", 200, 252], ["tri", 168, 232, 1], ["tri", 232, 238, -1], ["sq", 200, 280]];
    const shape = ([k, x, y, up]) => k === "sq" ? `<rect x="${x - 10}" y="${y - 10}" width="20" height="20"/>` : k === "dia" ? `<path d="M${x} ${y - 13} L${x + 13} ${y} L${x} ${y + 13} L${x - 13} ${y}Z"/>` : `<path d="M${x} ${y - 11 * up} L${x + 12} ${y + 9 * up} L${x - 12} ${y + 9 * up}Z"/>`;
    const lines = [[0, 1], [1, 2], [2, 3], [3, 5], [5, 8], [3, 4], [5, 6], [5, 7], [2, 6], [2, 7], [4, 7]];
    return `<g class="k-only" stroke="${G.gold}" stroke-width="2" fill="none">${lines.map(([a, b], i) => `<path class="k-crack" ${d(i, 0.08, 0.9)} d="M${C[a][1]} ${C[a][2]} L${C[b][1]} ${C[b][2]}"/>`).join("")}</g>
      <g stroke="${G.gold}" stroke-width="1.6">${C.map((c, i) => `<g class="k-light" ${d(i, 0.12, 0.2)} fill="${i % 3 === 0 ? G.pink : i % 3 === 1 ? G.teal : G.light}">${shape(c)}</g>`).join("")}</g>`;
  },
  numerology() {
    return `<g transform="translate(200 196)">${shadow(0, 30, 70, 16)}
      <g class="k-spin" fill="none" stroke="${G.gold}" stroke-width="1" opacity=".7" transform="scale(1 .62)"><circle r="64"/>${Array.from({ length: 6 }, (_, i) => `<circle cx="${f1(32 * Math.cos(i * 1.047))}" cy="${f1(32 * Math.sin(i * 1.047))}" r="32"/>`).join("")}</g>
      ${Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * 6.2832 - 1.5708; return `<text class="k-fly" style="--d:${f1(i * 0.12)}s;--sx:${f1(Math.cos(a) * 160)}px;--sy:${f1(Math.sin(a) * 120)}px" x="${f1(Math.cos(a) * 82)}" y="${f1(Math.sin(a) * 46 + 7)}" font-family="Cinzel, Georgia, serif" font-size="20" font-weight="700" text-anchor="middle" fill="${i % 2 ? G.teal : G.light}">${i + 1}</text>`; }).join("")}
      <text class="k-pop" style="--d:1.6s" y="12" font-size="30" text-anchor="middle" fill="${G.pink}">✶</text></g>`;
  },
  chinesezodiac() {
    const an = "🐀🐂🐅🐇🐉🐍🐎🐐🐒🐓🐕🐖";
    const list = [...an];
    return `<g transform="translate(200 196) scale(1 .62)">${shadow(0, 8, 104, 104)}<g class="k-wheel"><circle r="96" fill="#5a0f1c" stroke="${G.gold}" stroke-width="3"/><circle r="64" fill="#3a0a14" stroke="${G.gold}" stroke-width="1.5"/>
      ${list.map((e, i) => { const a = (i / 12) * 6.2832 - 1.5708; return `<line x1="0" y1="0" x2="${f1(96 * Math.cos(a + 0.26))}" y2="${f1(96 * Math.sin(a + 0.26))}" stroke="${G.gold}" stroke-width=".6" opacity=".6"/><text x="${f1(80 * Math.cos(a))}" y="${f1(80 * Math.sin(a) + 7)}" font-size="20" text-anchor="middle">${e}</text>`; }).join("")}
      <circle r="22" fill="${G.gold}"/><path d="M0 -22 A22 22 0 0 1 0 22 A11 11 0 0 1 0 0 A11 11 0 0 0 0 -22Z" fill="#3a0a14"/></g></g>
      <path d="M200 112 l-7 -14 h14Z" fill="${G.light}"/>`;
  },
  mayan() {
    const gear = (r, n, fill) => { let p = ""; for (let i = 0; i < n * 2; i++) { const a = (i / (n * 2)) * 6.2832, rr = i % 2 ? r : r + 7; p += `${i ? "L" : "M"}${f1(rr * Math.cos(a))} ${f1(rr * Math.sin(a))}`; } return `<path d="${p}Z" fill="${fill}" stroke="${G.gold}" stroke-width="1.4"/>`; };
    return `<g transform="translate(0 0) scale(1 .7) translate(0 84)">
      <g transform="translate(160 196)">${shadow(0, 8, 50, 50)}<g class="k-spin">${gear(44, 13, "#1f5a4e")}${Array.from({ length: 13 }, (_, i) => `<circle cx="${f1(32 * Math.cos(i * 0.483))}" cy="${f1(32 * Math.sin(i * 0.483))}" r="2.6" fill="${G.light}"/>`).join("")}<circle r="10" fill="${G.gold}"/></g></g>
      <g transform="translate(250 196)">${shadow(0, 8, 58, 58)}<g class="k-spin rev">${gear(54, 20, "#6a2a12")}${Array.from({ length: 20 }, (_, i) => `<rect x="${f1(42 * Math.cos(i * 0.314) - 2.5)}" y="${f1(42 * Math.sin(i * 0.314) - 2.5)}" width="5" height="5" fill="${G.light}"/>`).join("")}<circle r="14" fill="${G.gold}"/><path d="M-6 -4 h12 M-6 4 h12" stroke="#6a2a12" stroke-width="2"/></g></g></g>`;
  },
  egyptian() {
    return `<g class="k-rise"><circle cx="200" cy="150" r="30" fill="url(#tb-sun)"/><g transform="translate(200 150)"><g class="k-spin">${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 6.2832; return `<line x1="${f1(36 * Math.cos(a))}" y1="${f1(36 * Math.sin(a))}" x2="${f1(48 * Math.cos(a))}" y2="${f1(48 * Math.sin(a))}" stroke="${G.light}" stroke-width="2" stroke-linecap="round"/>`; }).join("")}</g></g></g>
      ${shadow(200, 252, 110, 12)}<path d="M110 252 L170 172 L230 252Z" fill="#c99a48" stroke="#7a5a22" stroke-width="1.2"/><path d="M170 172 L230 252 L200 252Z" fill="#9a7230"/>
      <path d="M200 252 L250 186 L300 252Z" fill="#b8883a" stroke="#7a5a22" stroke-width="1.2"/><path d="M250 186 L300 252 L276 252Z" fill="#8a6428"/>
      <g class="k-light" ${d(0, 0, 1.2)} transform="translate(96 214)" fill="none" stroke="${G.light}" stroke-width="4" stroke-linecap="round"><ellipse cx="0" cy="-16" rx="8" ry="11"/><path d="M0 -5 V24 M-13 2 H13"/></g>`;
  },
  celtic() {
    const branches = ["M200 260 C198 230 202 210 200 180", "M200 214 C186 202 172 198 160 184", "M200 206 C214 194 230 190 242 176", "M200 190 C192 178 186 168 184 152", "M200 186 C210 174 218 164 220 150", "M200 180 C200 168 200 156 200 140"];
    const leaves = [[160, 182], [150, 172], [244, 174], [254, 166], [182, 150], [190, 140], [222, 148], [212, 138], [200, 136], [170, 162], [232, 160]];
    return `${shadow(200, 264, 60, 10)}<g fill="none" stroke="#6b4a2a" stroke-linecap="round">${branches.map((p, i) => `<path class="k-crack" ${d(i, 0.16)} d="${p}" stroke-width="${i ? 4 : 9}"/>`).join("")}</g>
      ${leaves.map(([x, y], i) => `<circle class="k-pop" ${d(i, 0.07, 1.0)} cx="${x}" cy="${y}" r="9" fill="${i % 3 ? "#2f8a5a" : G.teal}" opacity=".9"/>`).join("")}
      <g stroke="${G.gold}" stroke-width="2">${[0, 1, 2, 3, 4].map((i) => `<path class="k-light" ${d(i, 0.1, 1.6)} d="M${192 - (i % 2) * 4} ${244 - i * 10} h${16 + (i % 2) * 8}"/>`).join("")}</g>
      ${[0, 1, 2, 3, 4].map((i) => `<circle class="k-pop" ${d(i, 0.12, 1.2)} cx="${120 + i * 40}" cy="${112 - Math.sin(i * 0.785) * 10}" r="6" fill="${G.cream}" opacity="${0.4 + i * 0.12}"/>`).join("")}`;
  },
};

/** Fallback for a system without its own scene: a ring of sparks gathering. */
const sparkle = () => Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * 6.2832; return `<circle class="k-fly" style="--d:${f1(i * 0.1)}s;--sx:${f1(Math.cos(a) * 120)}px;--sy:${f1(Math.sin(a) * 80)}px" cx="${f1(200 + Math.cos(a) * 40)}" cy="${f1(196 + Math.sin(a) * 22)}" r="4" fill="${i % 2 ? G.pink : G.light}"/>`; }).join("");

/** Idle: a single faceted crystal on the sigil. */
const idle = () => `<g class="k-float"><path d="M200 150 L222 184 L200 238 L178 184Z" fill="${G.teal}" opacity=".55" stroke="${G.light}" stroke-width="1.2"/><path d="M200 150 L210 184 L200 238 L190 184Z" fill="#fff" opacity=".25"/></g>${shadow(200, 246, 30, 6)}`;

const scene = (key) => (SCENES[key] || sparkle)();

export function makeTable(el, { reduced = false } = {}) {
  const set = (inner, cls) => { el.className = "table " + (cls || ""); el.innerHTML = tableSvg(inner); };
  return {
    idle() { set(idle(), "idle"); },
    /** Tools at rest for the chosen system. */
    rest(key) { set(scene(key), "rest"); },
    /** Cast: the tools fly, spin, crack or turn. Returns after the animation's main beats. */
    cast(key) { set(scene(key), "casting"); return new Promise((r) => setTimeout(r, reduced ? 0 : 2600)); },
    /** Lay the real reading art on the table. */
    reveal(svgs) {
      const art = svgs[0];
      if (!art) { el.classList.add("done"); return; }
      el.className = "table revealed";
      el.innerHTML = tableSvg("") + `<button type="button" class="art-card" aria-label="Enlarge the reading art">${art}</button>`;
      return el.querySelector(".art-card");
    },
  };
}

/** Make a module's SVG scale to its box (adds a viewBox from width/height when missing). */
export function fitSvg(svg) {
  return svg.replace(/<svg\b([^>]*)>/, (m, attrs) => {
    const w = /\bwidth="([\d.]+)"/.exec(attrs), h = /\bheight="([\d.]+)"/.exec(attrs);
    let a = attrs;
    if (!/viewBox=/.test(a) && w && h) a += ` viewBox="0 0 ${w[1]} ${h[1]}"`;
    a = a.replace(/\b(width|height)="[^"]*"/g, "");
    return `<svg${a} width="100%" height="100%" preserveAspectRatio="xMidYMid meet">`;
  });
}
