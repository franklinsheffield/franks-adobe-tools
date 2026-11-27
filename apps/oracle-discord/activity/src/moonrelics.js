// Moon relics: permanent fixtures for the Oracle's chamber, bought only with 🌙 moon tokens (one a day, from the first
// reading of each day). Once bought, a relic stays in the Oracle box for good, alongside every other relic: nothing to
// equip or swap. Tokens spent are tracked apart from tokens earned (prog.moonSpent), so the Moonlit silver cloth, which
// unlocks at 15 earned, never re-locks. prog.relics = owned ids. Rules and art only; main.js sells and places them.

/** x/y/w are % of the Oracle pane (kept to the sides and corners so the Oracle stays clear); art is detailed SVG. */
const lin = (id, stops, x2 = 0, y2 = 1) => `<linearGradient id="${id}" x1="0" y1="0" x2="${x2}" y2="${y2}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</linearGradient>`;
const rad = (id, stops, cx = 0.5, cy = 0.5, r = 0.5) => `<radialGradient id="${id}" cx="${cx}" cy="${cy}" r="${r}">${stops.map(([o, c, a = 1]) => `<stop offset="${o}" stop-color="${c}" stop-opacity="${a}"/>`).join("")}</radialGradient>`;
const BRASS = [[0, "#fff1b8"], [0.35, "#e2b04a"], [0.7, "#9a6a1c"], [1, "#5a3a0c"]];
/** A candle: waxy body with drips, a wick and a two-layer flame with halo. */
const candle = (x, y, h, k) => `<g class="mr-float" style="--d:${(k * 0.6).toFixed(1)}s"><ellipse cx="${x}" cy="${y - 14}" rx="16" ry="18" fill="url(#mrc-halo)" class="mr-glow"/>
<path d="M${x - 6} ${y}h12v${h}a6 2 0 0 1 -12 0z" fill="url(#mrc-wax)"/><path d="M${x - 6} ${y}a6 2 0 0 0 12 0" fill="#fffaf0"/><path d="M${x + 2} ${y + 1}q1.5 6 0 9q-2 1 -1.6 -3z" fill="#f6ecd6"/>
<path d="M${x} ${y}v-4" stroke="#3a2a1a" stroke-width="1"/><g class="mr-flame"><path d="M${x} ${y - 19}q6 8 2.6 13q-2.6 2.4 -5.2 0q-3.4 -5 2.6 -13z" fill="url(#mrc-flame)"/><path d="M${x} ${y - 11}q2 3 .9 5q-.9 .8 -1.8 0q-1.1 -2 .9 -5z" fill="#fff"/></g></g>`;
const CANDLE_DEFS = `<defs>${lin("mrc-wax", [[0, "#fff8e8"], [0.55, "#efe0bd"], [1, "#c9b48a"]], 1, 0)}${lin("mrc-flame", [[0, "#fff6c8"], [0.5, "#ffc44d"], [1, "#ff7a1a"]])}${rad("mrc-halo", [[0, "#ffd27a", 0.45], [1, "#ffd27a", 0]])}</defs>`;

export const RELICS = [
  { id: "mr-candles", e: "🕯️", name: "Floating candles", price: 5, note: "Four beeswax candles that float either side of the Oracle, never dripping, never going out.", x: 14, y: 40, w: 72, vb: "0 0 400 90",
    art: () => CANDLE_DEFS + candle(24, 46, 30, 0) + candle(58, 30, 38, 1) + candle(342, 32, 36, 2) + candle(376, 50, 28, 3) },
  { id: "mr-lanterns", e: "🏮", name: "Paper moon lanterns", price: 6, note: "Two ribbed paper lanterns on silk cords, each glowing like a small moon.", x: 18, y: 0, w: 16, vb: "0 0 100 150",
    art: () => { const L = (cx, len, r, k) => `<g class="mr-sway" style="--d:${k * 1.3}s;transform-origin:${cx}px 0"><path d="M${cx} 0V${len - r}" stroke="#2a1a10" stroke-width="1.4"/>
<circle cx="${cx}" cy="${len}" r="${r * 1.9}" fill="url(#mrl-halo)" class="mr-glow"/><rect x="${cx - r * 0.45}" y="${len - r - 4}" width="${r * 0.9}" height="6" rx="1.5" fill="#1a1010"/><ellipse cx="${cx}" cy="${len}" rx="${r}" ry="${r * 0.92}" fill="url(#mrl-paper)"/>
${[0.35, 0.7].map((f) => `<ellipse cx="${cx}" cy="${len}" rx="${(r * f).toFixed(1)}" ry="${(r * 0.92).toFixed(1)}" fill="none" stroke="#c97a2a" stroke-width=".7" opacity=".55"/>`).join("")}<path d="M${cx} ${len - r * 0.92}V${len + r * 0.92}" stroke="#c97a2a" stroke-width=".7" opacity=".55"/>
${[-0.5, 0, 0.5].map((f) => `<path d="M${cx - r} ${len + f * r * 0.8}Q${cx} ${len + f * r * 0.8 + 3} ${cx + r} ${len + f * r * 0.8}" stroke="#c97a2a" stroke-width=".5" fill="none" opacity=".35"/>`).join("")}
<ellipse cx="${cx - r * 0.35}" cy="${len - r * 0.4}" rx="${r * 0.25}" ry="${r * 0.35}" fill="#fff" opacity=".35"/><rect x="${cx - r * 0.4}" y="${len + r * 0.86}" width="${r * 0.8}" height="5" rx="1.5" fill="#1a1010"/>
<path d="M${cx} ${len + r * 0.86 + 5}v6" stroke="#b02a2a" stroke-width="1.2"/><path d="M${cx - 3} ${len + r * 0.86 + 11}h6l-1 12h-4z" fill="#c8302a"/></g>`;
      return `<defs>${rad("mrl-paper", [[0, "#fffbe6"], [0.55, "#ffd98a"], [1, "#e08a2a"]], 0.42, 0.4, 0.62)}${rad("mrl-halo", [[0, "#ffcf6a", 0.5], [1, "#ffcf6a", 0]])}</defs>${L(30, 62, 20, 0)}${L(74, 92, 16, 1)}`; } },
  { id: "mr-jars", e: "🫙", name: "Spirit jars", price: 7, note: "Three hand-blown jars, corked and labelled, each holding a wisp that turns in its own light.", x: 80, y: 70, w: 18, vb: "0 0 120 90",
    art: () => { const J = (x, w, h, c, k, lab) => `<g><ellipse cx="${x + w / 2}" cy="88" rx="${w / 2 + 2}" ry="3" fill="#000" opacity=".35"/><ellipse cx="${x + w / 2}" cy="${88 - h * 0.45}" rx="${w}" ry="${h * 0.7}" fill="${c}" opacity=".18" class="mr-glow"/>
<path d="M${x + 3} ${88 - h}h${w - 6}q3 0 3 4v${h - 8}q0 6 -6 6h${-(w - 6)}q-6 0 -6 -6v${-(h - 8)}q0 -4 3 -4z" fill="url(#mrj-glass)" stroke="#d8f0ff" stroke-opacity=".55" stroke-width="1"/>
<path d="M${x + 2} ${88 - h * 0.55}h${w - 4}v${h * 0.55 - 6}q0 4 -4 4h${-(w - 12)}q-4 0 -4 -4z" fill="${c}" opacity=".55"/>
<circle class="mr-wisp" style="--d:${k * 0.8}s;transform-origin:${x + w / 2}px ${88 - h * 0.5}px" cx="${x + w / 2}" cy="${88 - h * 0.62}" r="3.4" fill="#fff"/><circle class="mr-wisp" style="--d:${k * 0.8 + 1.4}s;transform-origin:${x + w / 2}px ${88 - h * 0.5}px" cx="${x + w / 2}" cy="${88 - h * 0.38}" r="2" fill="${c}"/>
<path d="M${x + 4} ${92 - h}v${h - 14}" stroke="#fff" stroke-width="2" opacity=".35" stroke-linecap="round"/>
<path d="M${x + w * 0.25} ${88 - h - 8}h${w * 0.5}l-1 9h${-(w * 0.5 - 2)}z" fill="url(#mrj-cork)"/><path d="M${x + w * 0.2} ${88 - h + 1}h${w * 0.6}" stroke="#7a5a3a" stroke-width="1.4"/>
<rect x="${x + w * 0.2}" y="${88 - h * 0.42}" width="${w * 0.6}" height="10" rx="1" fill="#f1e6c8" opacity=".9"/><text x="${x + w / 2}" y="${88 - h * 0.42 + 7.5}" text-anchor="middle" font-size="6.5" fill="#5a3a1a" font-family="serif" font-style="italic">${lab}</text></g>`;
      return `<defs>${lin("mrj-glass", [[0, "#ffffff", 0.28], [0.3, "#c8e8ff", 0.08], [0.85, "#c8e8ff", 0.05], [1, "#ffffff", 0.22]], 1, 0)}${lin("mrj-cork", [[0, "#c79a62"], [1, "#7a5430"]])}</defs>${J(4, 30, 56, "#66E0C8", 0, "aether")}${J(44, 34, 70, "#FF4FB3", 1, "anima")}${J(88, 28, 48, "#9d8cff", 2, "umbra")}`; } },
  { id: "mr-telescope", e: "🔭", name: "Brass telescope", price: 8, note: "A banded brass refractor on an oak tripod, aimed at the window. It tracks the sky all night.", x: 3, y: 30, w: 17, vb: "0 0 110 110",
    art: () => `<defs>${lin("mrt-brass", BRASS)}${lin("mrt-oak", [[0, "#a0703a"], [1, "#4a2c12"]], 1, 0)}</defs><ellipse cx="54" cy="106" rx="34" ry="3.5" fill="#000" opacity=".35"/>
<path d="M54 62L26 106M54 62L82 106M54 62L56 106" stroke="url(#mrt-oak)" stroke-width="4" stroke-linecap="round"/><path d="M38 86H72" stroke="#5a3a1a" stroke-width="1.6"/>
<g class="mr-scope" style="transform-origin:54px 58px"><g transform="rotate(-32 54 58)"><rect x="8" y="51" width="86" height="13" rx="3" fill="url(#mrt-brass)"/><rect x="90" y="48" width="14" height="19" rx="3" fill="url(#mrt-brass)"/>
<rect x="0" y="54" width="10" height="7" rx="2" fill="url(#mrt-brass)"/>${[26, 48, 70].map((x) => `<rect x="${x}" y="50" width="3" height="15" fill="#5a3a0c" opacity=".75"/>`).join("")}<ellipse cx="104" cy="57.5" rx="2" ry="8.5" fill="#bfe6ff"/><ellipse cx="104.5" cy="54" rx=".8" ry="3" fill="#fff" class="mr-glint"/><path d="M12 53.5H88" stroke="#fff5c8" stroke-width="1.4" opacity=".7"/></g></g>
<circle cx="54" cy="58" r="5" fill="url(#mrt-brass)" stroke="#5a3a0c"/>` },
  { id: "mr-tapestry", e: "🧵", name: "Constellation tapestry", price: 10, note: "A woven night sky on a brass rod, fringed in gold. Its embroidered stars pulse in turn.", x: 77, y: 14, w: 15, vb: "0 0 100 150",
    art: () => `<defs>${lin("mrp-cloth", [[0, "#172056"], [0.18, "#24307a"], [0.36, "#141b4a"], [0.55, "#26337c"], [0.75, "#151c4c"], [1, "#222c70"]], 1, 0)}${lin("mrp-rod", BRASS)}</defs>
<g class="mr-sway" style="--d:.5s;transform-origin:50px 6px;animation-duration:9s"><path d="M10 8H90V128L82 132L74 128L66 132L58 128L50 132L42 128L34 132L26 128L18 132L10 128Z" fill="url(#mrp-cloth)"/>
<path d="M15 13H85V123H15Z" fill="none" stroke="#E2B04A" stroke-width="1.2" stroke-dasharray="4 2"/><path d="M18 16H82V120H18Z" fill="none" stroke="#E2B04A" stroke-width=".5" opacity=".6"/>
<path d="M62 30a12 12 0 1 0 0 22a9 11 0 1 1 0 -22z" fill="#f4ecd0" opacity=".9"/>
<path d="M26 42L38 34L48 46L58 38M30 78L44 72L56 84L70 76L66 96M28 104L42 98L50 110" stroke="#FADE8C" stroke-width=".8" fill="none" opacity=".6"/>
${[[26, 42], [38, 34], [48, 46], [58, 38], [30, 78], [44, 72], [56, 84], [70, 76], [66, 96], [28, 104], [42, 98], [50, 110]].map(([x, y], i) => `<path class="mr-star" style="--d:${(i * 0.35).toFixed(2)}s" d="M${x} ${y - 3}L${x + 0.9} ${y - 0.9}L${x + 3} ${y}L${x + 0.9} ${y + 0.9}L${x} ${y + 3}L${x - 0.9} ${y + 0.9}L${x - 3} ${y}L${x - 0.9} ${y - 0.9}Z" fill="#FADE8C"/>`).join("")}
${Array.from({ length: 10 }, (_, i) => `<path d="M${14 + i * 8} ${128 + (i % 2 ? 4 : 0)}v8" stroke="#E2B04A" stroke-width="1.2"/><circle cx="${14 + i * 8}" cy="${137 + (i % 2 ? 4 : 0)}" r="1.6" fill="#E2B04A"/>`).join("")}</g>
<rect x="4" y="4" width="92" height="5" rx="2.5" fill="url(#mrp-rod)"/><circle cx="4" cy="6.5" r="4" fill="url(#mrp-rod)"/><circle cx="96" cy="6.5" r="4" fill="url(#mrp-rod)"/>` },
  { id: "mr-orrery", e: "🪐", name: "Clockwork orrery", price: 12, note: "A brass model of the planets on a turned pedestal. Each world circles at its true relative speed.", x: 1, y: 62, w: 22, vb: "-60 -50 120 110",
    art: () => { const P = [[16, 6, 1.6, "#c9b9a0", 3.2], [24, 9, 2.4, "#f0c878", 8], [33, 12, 2.8, "url(#mro-earth)", 13], [43, 15, 2.2, "#ff7a5a", 24]];
      return `<defs>${lin("mro-brass", BRASS)}${rad("mro-sun", [[0, "#fffbe0"], [0.45, "#ffd24a"], [1, "#ff8a1a"]])}${rad("mro-glow", [[0, "#ffd24a", 0.55], [1, "#ffd24a", 0]])}${rad("mro-earth", [[0, "#9fd8ff"], [1, "#1d5fbf"]], 0.35, 0.35)}</defs>
<ellipse cx="0" cy="56" rx="26" ry="4" fill="#000" opacity=".4"/><path d="M-22 54H22L16 44H-16Z" fill="url(#mro-brass)"/><path d="M-12 44H12L6 30H-6Z" fill="url(#mro-brass)"/><rect x="-2" y="2" width="4" height="30" fill="url(#mro-brass)"/>
${P.map(([rx, ry]) => `<ellipse rx="${rx}" ry="${ry}" fill="none" stroke="#E2B04A" stroke-width=".6" opacity=".55"/>`).join("")}<circle r="18" fill="url(#mro-glow)" class="mr-glow"/><circle r="7" fill="url(#mro-sun)"/>
${P.map(([rx, ry, s, c, t]) => `<g><circle r="${s}" fill="${c}"><animateMotion dur="${t}s" repeatCount="indefinite" path="M${rx} 0A${rx} ${ry} 0 1 1 ${-rx} 0A${rx} ${ry} 0 1 1 ${rx} 0"/></circle></g>`).join("")}
<g><g><ellipse rx="6" ry="1.8" fill="none" stroke="#e8d7a8" stroke-width="1"/><circle r="2.8" fill="#e8c890"/><animateMotion dur="40s" repeatCount="indefinite" path="M54 0A54 19 0 1 1 -54 0A54 19 0 1 1 54 0"/></g></g>
<ellipse rx="54" ry="19" fill="none" stroke="#E2B04A" stroke-width=".6" opacity=".45"/><path d="M-28 -4L28 4" stroke="url(#mro-brass)" stroke-width="1.4" opacity=".7"/>`; } },
  { id: "mr-rose", e: "🪟", name: "Rose window", price: 15, note: "Cathedral stained glass that glows behind the Oracle like a halo, lit through by the sky outside.", x: 20, y: -16, w: 60, vb: "-110 -110 220 220",
    art: () => { const C = ["#FF4FB3", "#66E0C8", "#9d8cff", "#FADE8C", "#ff7a5a", "#5fa8ff"], pet = (n, r, pr, o) => Array.from({ length: n }, (_, i) => { const a = (i / n) * Math.PI * 2 + o; return `<circle cx="${(Math.cos(a) * r).toFixed(1)}" cy="${(Math.sin(a) * r).toFixed(1)}" r="${pr}" fill="${C[i % C.length]}" opacity=".7" stroke="#1a1028" stroke-width="2.2"/>`; }).join("");
      return `<defs>${rad("mrr-glow", [[0, "#ffe9b0", 0.55], [0.7, "#ff9ad6", 0.12], [1, "#ff9ad6", 0]])}${rad("mrr-shine", [[0, "#fff", 0.5], [1, "#fff", 0]], 0.35, 0.3, 0.6)}</defs><circle r="108" fill="url(#mrr-glow)" class="mr-glow"/>
<g class="mr-rose"><circle r="96" fill="#140c26"/><circle r="96" fill="none" stroke="#E2B04A" stroke-width="4"/>${pet(16, 80, 13, 0)}${pet(8, 52, 17, Math.PI / 8)}${pet(8, 28, 10, 0)}
<circle r="14" fill="#FADE8C" stroke="#1a1028" stroke-width="2.4"/><circle r="6" fill="#fff6d0"/>${Array.from({ length: 16 }, (_, i) => `<path d="M0 0L${(Math.cos((i / 16) * Math.PI * 2) * 96).toFixed(1)} ${(Math.sin((i / 16) * Math.PI * 2) * 96).toFixed(1)}" stroke="#1a1028" stroke-width="1.4" opacity=".6"/>`).join("")}
<circle r="66" fill="none" stroke="#E2B04A" stroke-width="2"/><circle r="40" fill="none" stroke="#E2B04A" stroke-width="1.6"/><circle r="96" fill="url(#mrr-shine)"/></g>`; } },
  { id: "mr-chandelier", e: "💎", name: "Crystal chandelier", price: 18, note: "Brass arms, six candles and a rain of cut-glass drops that throw tiny rainbows.", x: 57, y: 0, w: 17, vb: "0 0 140 120",
    art: () => { const drop = (x, y, l, k) => `<g class="mr-drop" style="--d:${(k * 0.25).toFixed(2)}s;transform-origin:${x}px ${y}px"><path d="M${x} ${y}v${l}" stroke="#d8ecff" stroke-width=".6"/><path d="M${x} ${y + l}l3.2 5 -3.2 7 -3.2 -7z" fill="url(#mrd-prism)" stroke="#fff" stroke-width=".4"/><circle class="mr-star" style="--d:${(k * 0.4).toFixed(1)}s" cx="${x + 1}" cy="${y + l + 4}" r=".9" fill="#fff"/></g>`;
      return `<defs>${lin("mrd-brass", BRASS)}${lin("mrd-prism", [[0, "#ffffff"], [0.4, "#bfe6ff"], [0.7, "#ffc8f0"], [1, "#d6c8ff"]], 1, 1)}${CANDLE_DEFS.slice(6, -7)}</defs>
<path d="M70 0V22" stroke="url(#mrd-brass)" stroke-width="2.4"/><circle cx="70" cy="26" r="6" fill="url(#mrd-brass)"/><path d="M70 30V58" stroke="url(#mrd-brass)" stroke-width="5"/><ellipse cx="70" cy="62" rx="8" ry="6" fill="url(#mrd-brass)"/>
<path d="M18 46Q44 70 70 62Q96 70 122 46" stroke="url(#mrd-brass)" stroke-width="3" fill="none"/><path d="M36 40Q54 58 70 54Q86 58 104 40" stroke="url(#mrd-brass)" stroke-width="2.4" fill="none"/>
${[18, 36, 104, 122].map((x, i) => `<rect x="${x - 4}" y="${(i % 3 ? 36 : 42) - 2}" width="8" height="4" rx="1" fill="url(#mrd-brass)"/>${candle(x, (i % 3 ? 36 : 42) - 2, 0, i).replace(/<path d="M[\d.]+ [\d.]+h12v0a6 2 0 0 1 -12 0z"[^>]*\/>/, "")}`).join("")}
${[[22, 50, 14], [32, 56, 20], [44, 60, 26], [56, 64, 30], [70, 66, 34], [84, 64, 30], [96, 60, 26], [108, 56, 20], [118, 50, 14]].map(([x, y, l], k) => drop(x, y, l, k)).join("")}${drop(70, 68, 40, 9)}`; } },
  { id: "mr-pool", e: "🌊", name: "Moon pool", price: 25, note: "A still pool set in old stone at the Oracle's feet. It holds tonight's moon and ripples when she speaks.", x: 2, y: 84, w: 96, vb: "0 0 400 60",
    art: () => `<defs>${rad("mrw-water", [[0, "#2a6a8a"], [0.6, "#0d2a44"], [1, "#06121f"]])}${lin("mrw-stone", [[0, "#8a8aa0"], [1, "#3a3a4e"]])}${lin("mrw-streak", [[0, "#f4ecd0", 0], [0.5, "#f4ecd0", 0.9], [1, "#f4ecd0", 0]], 1, 0)}</defs>
<ellipse cx="200" cy="32" rx="196" ry="26" fill="url(#mrw-stone)"/><ellipse cx="200" cy="31" rx="186" ry="21" fill="url(#mrw-water)"/><ellipse cx="200" cy="31" rx="186" ry="21" fill="none" stroke="#66E0C8" stroke-opacity=".35"/>
<g class="mr-moonref"><ellipse cx="300" cy="26" rx="18" ry="5" fill="#f4ecd0" opacity=".85"/><rect x="250" y="34" width="100" height="2" fill="url(#mrw-streak)" opacity=".7"/><rect x="265" y="40" width="70" height="1.5" fill="url(#mrw-streak)" opacity=".5"/></g>
${[0, 1, 2].map((i) => `<ellipse class="mr-ripple" style="--d:${i * 1.2}s" cx="${[90, 200, 300][i]}" cy="31" rx="28" ry="5" fill="none" stroke="#cfe3ff" stroke-width=".9"/>`).join("")}
${Array.from({ length: 7 }, (_, i) => `<circle class="mr-star" style="--d:${i * 0.6}s" cx="${40 + i * 52}" cy="${24 + (i % 3) * 6}" r=".9" fill="#fff"/>`).join("")}
${Array.from({ length: 12 }, (_, i) => `<path d="M${(200 + Math.cos((i / 12) * Math.PI * 2) * 192).toFixed(1)} ${(32 + Math.sin((i / 12) * Math.PI * 2) * 24).toFixed(1)}l2 -1" stroke="#2a2a3a" stroke-width="1.2" opacity=".6"/>`).join("")}` },
  { id: "mr-arch", e: "🌙", name: "The Moon arch", price: 30, note: "A great silver crescent rising behind the Oracle, cratered and glowing. The rarest relic of all.", x: 4, y: -6, w: 60, vb: "0 0 300 300",
    art: () => `<defs>${rad("mra-moon", [[0, "#ffffff"], [0.55, "#e6ecf6"], [1, "#9aa6bf"]], 0.35, 0.35, 0.75)}${rad("mra-halo", [[0, "#dfe8ff", 0.45], [1, "#dfe8ff", 0]])}${rad("mra-crater", [[0, "#8a94ad", 0.8], [1, "#b8c2d8", 0.1]])}
<mask id="mra-mask"><rect width="300" height="300" fill="#fff"/><circle cx="200" cy="130" r="118" fill="#000"/></mask></defs>
<circle cx="150" cy="150" r="148" fill="url(#mra-halo)" class="mr-arch"/><g mask="url(#mra-mask)"><circle cx="150" cy="150" r="128" fill="url(#mra-moon)"/>
${[[70, 120, 16], [60, 190, 11], [96, 230, 14], [48, 150, 7], [86, 84, 9], [120, 262, 8], [40, 210, 6]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" fill="url(#mra-crater)"/><path d="M${x - r * 0.7} ${y - r * 0.4}a${r} ${r} 0 0 1 ${r * 1.2} -${r * 0.4}" stroke="#fff" stroke-width="1" opacity=".5" fill="none"/>`).join("")}</g>
${Array.from({ length: 10 }, (_, i) => `<path class="mr-star" style="--d:${(i * 0.4).toFixed(1)}s" d="M${30 + ((i * 67) % 250)} ${20 + ((i * 53) % 120) - 2.5}l.8 1.7 1.7 .8 -1.7 .8 -.8 1.7 -.8 -1.7 -1.7 -.8 1.7 -.8z" fill="#fff"/>`).join("")}` },
];
export const relicOf = (id) => RELICS.find((r) => r.id === id);
export const ownsRelic = (p, id) => (p.relics || []).includes(id);
/** Moon tokens left to spend: earned minus spent. */
export const moonLeft = (p) => Math.max(0, (p.tokens || 0) - (p.moonSpent || 0));
/** Buy a relic with moon tokens. Returns the relic, or null if owned, unknown or too dear. */
export function buyRelic(p, id) {
  const r = relicOf(id); if (!r || ownsRelic(p, id) || moonLeft(p) < r.price) return null;
  p.moonSpent = (p.moonSpent || 0) + r.price; (p.relics ||= []).push(id); return r;
}
/** Every owned relic, drawn into the Oracle's pane (behind the Oracle). */
export function relicsHtml(p) {
  const back = ["mr-arch", "mr-rose"]; return [...RELICS].sort((a, b) => back.includes(b.id) - back.includes(a.id)).filter((r) => ownsRelic(p, r.id)).map((r) => `<svg class="mr mr-${r.id.slice(3)}" style="left:${r.x}%;top:${r.y}%;width:${r.w}%" viewBox="${r.vb}" aria-hidden="true">${r.art()}</svg>`).join("");
}
export const relicThumb = (r) => `<svg class="mr-thumb" viewBox="${r.vb}" aria-hidden="true">${r.art()}</svg>`;

// ---- earning tokens from games: first win of each level, harder pays more; beating all three is about one good relic ----
/** Level 1 🌙2, Level 2 🌙4, Level 3 (hard) 🌙6, plus 🌙3 for finishing the whole series: 🌙15 a game, a Rose window. */
export const LEVEL_TOKENS = [0, 2, 4, 6], SERIES_BONUS = 3;
/** Pay moon tokens for the first win at this game level. Returns { n, series } (n 0 if already paid or lost). */
export function levelTokens(p, gameId, level, won) {
  if (!won || !LEVEL_TOKENS[level]) return { n: 0, series: false }; const k = `${gameId}-${level}`; p.moonLv = Array.isArray(p.moonLv) ? p.moonLv : [];
  if (p.moonLv.includes(k)) return { n: 0, series: false }; p.moonLv.push(k);
  const series = [1, 2, 3].every((l) => p.moonLv.includes(`${gameId}-${l}`)), n = LEVEL_TOKENS[level] + (series ? SERIES_BONUS : 0);
  p.tokens = (p.tokens || 0) + n; return { n, series };
}

// ---- familiars live here too: bought with moon tokens, one at a time keeps the Oracle company ----
export const FAMILIAR_TOKENS = { "fam-moth": 6, "fam-toad": 6, "fam-cat": 8, "fam-owl": 8, "fam-bot": 10 };
/** Buy a familiar with moon tokens. Returns true if bought. */
export function buyFamiliar(p, id) {
  const n = FAMILIAR_TOKENS[id]; if (!n || (p.owned || []).includes(id) || moonLeft(p) < n) return false;
  p.moonSpent = (p.moonSpent || 0) + n; (p.owned ||= []).push(id); return true;
}
