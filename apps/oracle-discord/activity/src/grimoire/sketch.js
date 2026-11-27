// Herbalist's Grimoire: botanical sketches drawn from each plant's `look` (plants.js), in ink on a grimoire page.
// Pure string-building, so tests can render every plant. The same seed always draws the same specimen.

const rng = (seed) => { let h = [...String(seed)].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 2166136261); return () => ((h = (h * 1664525 + 1013904223) >>> 0) / 4294967296); };
const f = (n) => Math.round(n * 10) / 10;
const INK = "#3a2716";

/** One leaf, base at 0,0 pointing up (-y), length L. */
function leafPath(kind, L, o = {}) {
  const w = { lance: 0.17, oval: 0.33, heart: 0.42, tiny: 0.3, strap: 0.06, broad: 0.3, huge: 0.55 }[kind] ?? 0.3;
  const W = L * w * (o.big ? 1.3 : 1);
  if (kind === "toothed" || o.toothed && kind !== "heart") {
    const n = kind === "toothed" ? 6 : 9, depth = kind === "toothed" ? W * 0.9 + L * 0.16 : L * 0.05, ww = kind === "toothed" ? L * 0.16 : W;
    const side = (s) => Array.from({ length: n }, (_, i) => { const t = (i + 1) / (n + 1), y = -L * t, b = Math.sin(Math.PI * t) * ww;
      return `L${f(s * (b + (i % 2 ? 0 : depth * Math.sin(Math.PI * t) * (kind === "toothed" ? 1 : 0.5))))} ${f(y - (kind === "toothed" ? L * 0.04 : 0))} L${f(s * b * 0.75)} ${f(y + L * 0.02)}`; }).join(" ");
    return `M0 0 ${side(1)} L0 ${f(-L)} ${side(-1).split(" L").reverse().join(" L").replace(/^/, "L")} Z`.replace("LL", "L");
  }
  if (kind === "heart") return `M0 ${f(-L * 0.05)} C${f(W * 0.6)} ${f(L * 0.1)} ${f(W * 1.3)} ${f(-L * 0.35)} 0 ${f(-L)} C${f(-W * 1.3)} ${f(-L * 0.35)} ${f(-W * 0.6)} ${f(L * 0.1)} 0 ${f(-L * 0.05)}Z`;
  if (kind === "huge") return `M0 0 C${f(W * 1.4)} ${f(-L * 0.05)} ${f(W * 1.5)} ${f(-L * 0.9)} 0 ${f(-L)} C${f(-W * 1.5)} ${f(-L * 0.9)} ${f(-W * 1.4)} ${f(-L * 0.05)} 0 0Z`;
  return `M0 0 C${f(W)} ${f(-L * 0.25)} ${f(W * 0.8)} ${f(-L * 0.75)} 0 ${f(-L)} C${f(-W * 0.8)} ${f(-L * 0.75)} ${f(-W)} ${f(-L * 0.25)} 0 0Z`;
}

/** A whole leaf (with compound and divided kinds), placed at x,y with angle a (degrees from up). */
function leaf(look, x, y, a, L, r) {
  const k = look.leaf, fill = look.lc, st = `stroke="${INK}" stroke-width=".9" fill="${fill}"`;
  const g = (inner) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">${inner}</g>`;
  if (k === "needle") return g(`<path d="M0 0 L0 ${f(-L * 0.6)}" stroke="${fill}" stroke-width="2.6" stroke-linecap="round"/><path d="M0 0 L0 ${f(-L * 0.6)}" stroke="${INK}" stroke-width=".5"/>`);
  if (k === "pinnate" || k === "fern") {
    const n = k === "fern" ? 7 : 3, parts = [`<path d="M0 0 L0 ${f(-L)}" stroke="${INK}" stroke-width=".9"/>`];
    for (let i = 1; i <= n; i++) { const t = i / (n + 1), y2 = -L * t, s = L * (k === "fern" ? 0.32 : 0.42) * (1 - t * 0.4);
      for (const side of [1, -1]) parts.push(k === "fern"
        ? `<path d="M0 ${f(y2)} q${f(side * s * 0.5)} ${f(-s * 0.2)} ${f(side * s)} ${f(-s * 0.55)} M${f(side * s * 0.45)} ${f(y2 - s * 0.18)} l${f(side * s * 0.12)} ${f(-s * 0.3)} M${f(side * s * 0.7)} ${f(y2 - s * 0.33)} l${f(side * s * 0.18)} ${f(-s * 0.12)}" stroke="${fill}" stroke-width="1.5" fill="none" stroke-linecap="round"/>`
        : `<path d="${leafPath("lance", s)}" transform="translate(0 ${f(y2)}) rotate(${side * 62})" ${st}/>`); }
    if (k === "pinnate") parts.push(`<path d="${leafPath("lance", L * 0.4)}" transform="translate(0 ${f(-L * 0.85)})" ${st}/>`);
    return g(parts.join(""));
  }
  if (k === "palmate" || k === "lobed") {
    const n = k === "palmate" ? 5 : 3, parts = [];
    if (k === "lobed") { const lo = look.small ? 0.5 : 1; for (let i = 0; i < 4; i++) for (const s of [1, -1]) { const t = (i + 0.6) / 4.6;
        parts.push(`<ellipse cx="${f(s * L * 0.16 * lo)}" cy="${f(-L * t)}" rx="${f(L * 0.16 * lo * (1 - t * 0.5))}" ry="${f(L * 0.08)}" transform="rotate(${s * -25} ${f(s * L * 0.16 * lo)} ${f(-L * t)})" fill="${fill}" stroke="${INK}" stroke-width=".8"/>`); }
      parts.push(`<path d="${leafPath("lance", L * 0.95)}" fill="${fill}" stroke="${INK}" stroke-width=".8"/><path d="M0 0 L0 ${f(-L * 0.9)}" stroke="${INK}" stroke-width=".6"/>`); return g(parts.join("")); }
    for (let i = 0; i < n; i++) parts.push(`<path d="${leafPath("lance", L * (i === 2 ? 1 : 0.8))}" transform="rotate(${(i - 2) * 26})" ${st}/>`);
    return g(parts.join(""));
  }
  const vein = k === "strap" ? "" : `<path d="M0 0 L0 ${f(-L * 0.92)}" stroke="${INK}" stroke-width=".55" opacity=".8"/>`;
  return g(`<path d="${leafPath(k, L * (k === "strap" ? (look.short ? 0.5 : 1.4) : 1), look)}" ${st}/>${vein}`);
}

/** One flower (or flower head) at x,y; a = lean in degrees. */
function flower(look, x, y, a, s, r) {
  const fc = look.fc || "#fff", cc = look.cc || "#e8c040", ink = `stroke="${INK}" stroke-width=".7"`;
  const g = (inner) => `<g transform="translate(${f(x)} ${f(y)}) rotate(${f(a)})">${inner}</g>`;
  switch (look.flower) {
    case "daisy": { const n = look.double ? 22 : 14, out = [];
      if (look.puff && r() < 0.5) { for (let i = 0; i < 26; i++) { const t = (i / 26) * 6.283; out.push(`<path d="M0 0 L${f(Math.cos(t) * s * 1.5)} ${f(Math.sin(t) * s * 1.5)}" stroke="${INK}" stroke-width=".35" opacity=".7"/><circle cx="${f(Math.cos(t) * s * 1.5)}" cy="${f(Math.sin(t) * s * 1.5)}" r="1" fill="#fff" stroke="${INK}" stroke-width=".3"/>`); } return g(out.join("")); }
      for (let i = 0; i < n; i++) out.push(`<ellipse cx="0" cy="${f(-s * (look.double && i % 2 ? 0.55 : 0.75))}" rx="${f(s * 0.18)}" ry="${f(s * 0.5)}" transform="rotate(${f((i / n) * 360)})" fill="${fc}" ${ink}/>`);
      return g(out.join("") + `<circle r="${f(s * 0.34)}" fill="${cc}" ${ink}/>`); }
    case "cone": { const out = []; for (let i = 0; i < 10; i++) { const t = -30 + (i / 9) * 240; out.push(`<path d="M0 0 Q${f(Math.cos((t * Math.PI) / 180) * s)} ${f(Math.sin((t * Math.PI) / 180) * s * 0.5 + s * 0.4)} ${f(Math.cos((t * Math.PI) / 180) * s * 1.1)} ${f(s * 1.1)}" stroke="${fc}" stroke-width="${f(s * 0.22)}" fill="none" stroke-linecap="round"/>`); }
      return g(out.join("") + `<path d="M${f(-s * 0.45)} 0 Q0 ${f(-s * 1.1)} ${f(s * 0.45)} 0Z" fill="${cc}" ${ink}/>`); }
    case "umbel": { const out = [], n = 9, R = s * 1.6;
      for (let i = 0; i < n; i++) { const t = -0.5 + i / (n - 1), ex = t * R * 2, ey = -s * 1.2 + Math.abs(t) * s * 0.5;
        out.push(`<path d="M0 0 L${f(ex)} ${f(ey)}" stroke="${INK}" stroke-width=".5"/>`);
        for (let j = 0; j < 5; j++) out.push(`<circle cx="${f(ex + (j - 2) * s * 0.18)}" cy="${f(ey - s * 0.12 - Math.abs(j - 2) * -0.4)}" r="${f(s * 0.13)}" fill="${fc}" ${ink}/>`); }
      if (look.berry) for (let i = 0; i < 7; i++) out.push(`<circle cx="${f((i - 3) * s * 0.45)}" cy="${f(-s * 0.4 + Math.abs(i - 3) * 1.5)}" r="${f(s * 0.2)}" fill="${look.berry}" ${ink}/>`);
      return g(out.join("")); }
    case "globe": { const out = []; for (let i = 0; i < 24; i++) { const t = r() * 6.283, d = r() * s; out.push(`<circle cx="${f(Math.cos(t) * d)}" cy="${f(Math.sin(t) * d - s)}" r="${f(s * 0.17)}" fill="${fc}" ${ink}/>`); } return g(out.join("")); }
    case "cup": { const vein = look.veins ? `<path d="M0 ${f(-s * 0.2)} L${f(-s * 0.6)} ${f(-s)} M0 ${f(-s * 0.2)} L${f(s * 0.6)} ${f(-s)} M0 ${f(-s * 0.2)} L0 ${f(-s * 1.1)}" stroke="${look.veins}" stroke-width=".8"/>` : "";
      return g(`<path d="M0 0 C${f(-s * 1.4)} ${f(-s * 0.2)} ${f(-s * 1.2)} ${f(-s * 1.4)} ${f(-s * 0.3)} ${f(-s * 1.2)} C${f(-s * 0.1)} ${f(-s * 1.5)} ${f(s * 0.1)} ${f(-s * 1.5)} ${f(s * 0.3)} ${f(-s * 1.2)} C${f(s * 1.2)} ${f(-s * 1.4)} ${f(s * 1.4)} ${f(-s * 0.2)} 0 0Z" fill="${fc}" ${ink}/>${vein}<circle cy="${f(-s * 0.45)}" r="${f(s * 0.26)}" fill="${cc}" ${ink}/>`); }
    case "star": { const out = []; for (let i = 0; i < 5; i++) out.push(`<path d="${leafPath("heart", s)}" transform="rotate(${i * 72 + 180})" fill="${fc}" ${ink}/>`);
      return g(out.join("") + `<circle r="${f(s * 0.22)}" fill="${cc}" ${ink}/>`); }
    case "trumpet": return g(`<path d="M0 0 L${f(-s * 0.25)} ${f(-s * 1.6)} Q${f(-s * 1.1)} ${f(-s * 2.2)} ${f(-s * 0.9)} ${f(-s * 2.7)} L${f(s * 0.9)} ${f(-s * 2.7)} Q${f(s * 1.1)} ${f(-s * 2.2)} ${f(s * 0.25)} ${f(-s * 1.6)} Z" fill="${fc}" ${ink}/><path d="M0 0 L0 ${f(-s * 2.6)} M${f(-s * 0.1)} ${f(-s * 1.4)} L${f(-s * 0.6)} ${f(-s * 2.6)} M${f(s * 0.1)} ${f(-s * 1.4)} L${f(s * 0.6)} ${f(-s * 2.6)}" stroke="${INK}" stroke-width=".4" opacity=".6"/>`);
    case "daff": { const out = []; for (let i = 0; i < 6; i++) out.push(`<path d="${leafPath("oval", s * 0.9)}" transform="rotate(${i * 60})" fill="${fc}" ${ink}/>`);
      return g(`<g transform="rotate(70)">${out.join("")}<path d="M${f(-s * 0.32)} 0 L${f(-s * 0.42)} ${f(-s * 1.2)} Q0 ${f(-s * 1.4)} ${f(s * 0.42)} ${f(-s * 1.2)} L${f(s * 0.32)} 0Z" fill="${cc}" ${ink}/></g>`); }
    case "catkin": return g(`<path d="M0 0 q${f(s * 0.3)} ${f(s * 0.9)} 0 ${f(s * 2)}" stroke="${fc}" stroke-width="${f(s * 0.5)}" stroke-linecap="round" fill="none"/><path d="M0 0 q${f(s * 0.3)} ${f(s * 0.9)} 0 ${f(s * 2)}" stroke="${INK}" stroke-width=".5" stroke-dasharray="1 2" fill="none"/>`);
    default: return "";
  }
}

/** Small flowers along the top of a stem path (spike, spire, hood, bells, tassel, dots). */
function along(look, pts, r) {
  const kind = look.flower, fc = look.fc, ink = `stroke="${INK}" stroke-width=".6"`, out = [];
  const top = pts.slice(Math.floor(pts.length * (kind === "spire" || kind === "hood" ? 0.45 : kind === "bells" ? 0.55 : 0.62)));
  top.forEach(([x, y], i) => {
    const s = (kind === "bells" ? 5.5 : 3) + (1 - i / top.length) * 2.5;
    if (kind === "spike") { const w = look.thin ? 0.6 : 1; for (const d of [-1, 1]) out.push(`<ellipse cx="${f(x + d * s * 0.7 * w)}" cy="${f(y)}" rx="${f(s * 0.55 * w)}" ry="${f(s * 0.75)}" fill="${fc}" ${ink}/>`); }
    else if (kind === "spire" && i % 2 === 0) out.push(`<path d="M${f(x)} ${f(y)} q${f(s * 1.6)} ${f(s * 0.4)} ${f(s * 2.6)} ${f(s * 2.4)} q${f(-s * 0.9)} ${f(s * 0.9)} ${f(-s * 2.2)} ${f(s * 0.2)}Z" fill="${fc}" ${ink}/><circle cx="${f(x + s * 1.8)}" cy="${f(y + s * 1.9)}" r=".8" fill="${INK}"/>`);
    else if (kind === "hood" && i % 2 === 0) out.push(`<path d="M${f(x)} ${f(y + s)} q${f(s * 2.4)} ${f(-s * 0.4)} ${f(s * 1.8)} ${f(-s * 2.2)} q${f(-s * 1)} ${f(-s * 0.9)} ${f(-s * 2.2)} ${f(0)} Q${f(x - s * 1.4)} ${f(y + s * 1.6)} ${f(x)} ${f(y + s)}Z" transform="translate(${f(-x * 0)} 0)" fill="${fc}" ${ink}/>`);
    else if (kind === "bells" && i % 2 === 0) out.push(`<path d="M${f(x)} ${f(y)} l${f(s * 0.8)} ${f(s * 0.6)}" stroke="${INK}" stroke-width=".5"/><path d="M${f(x + s * 0.2)} ${f(y + s * 0.8)} q${f(s * 0.6)} ${f(-s * 1.4)} ${f(s * 1.3)} 0 l${f(s * 0.2)} ${f(s * 0.3)} l${f(-s * 1.7)} 0Z" fill="${fc}" ${ink}/>`);
    else if (kind === "tassel" && i % 3 === 0) for (const d of [-1, 1]) out.push(`<path d="M${f(x)} ${f(y)} q${f(d * s * 2)} ${f(s)} ${f(d * s * 2.6)} ${f(s * 3.4)}" stroke="${fc}" stroke-width="2.2" fill="none" stroke-dasharray="1.6 1"/>`);
    else if (kind === "dots" && i % 2 === 0) for (let j = 0; j < 3; j++) out.push(`<circle cx="${f(x + (r() - 0.5) * 8)}" cy="${f(y + (r() - 0.5) * 6)}" r="${f(1.6 + r())}" fill="${fc}" ${ink}/>`);
  });
  if (kind === "bell") { const [x, y] = pts[Math.floor(pts.length * 0.7)]; for (const d of [-1, 1]) out.push(`<path d="M${f(x)} ${f(y)} q${f(d * 5)} 2 ${f(d * 7)} 7" stroke="${INK}" stroke-width=".6" fill="none"/><path d="M${f(x + d * 7 - 4)} ${f(y + 15)} q4 -14 8 0 l1 2 l-10 0Z" fill="${fc}" ${ink}/>`); }
  return out.join("");
}

function roots(look, x, y, r) {
  const rc = look.rc || "#b8946a", ink = `stroke="${INK}" stroke-width=".8"`;
  if (look.root === "bulb") return `<path d="M${x} ${y - 4} C${x + 16} ${y} ${x + 18} ${y + 26} ${x} ${y + 30} C${x - 18} ${y + 26} ${x - 16} ${y} ${x} ${y - 4}Z" fill="${rc}" ${ink}/><path d="M${x - 6} ${y + 4} Q${x - 8} ${y + 18} ${x - 3} ${y + 28} M${x + 6} ${y + 4} Q${x + 8} ${y + 18} ${x + 3} ${y + 28}" stroke="${INK}" stroke-width=".5" fill="none"/>${[-8, -3, 2, 7].map((d) => `<path d="M${x + d} ${y + 30} q${d / 3} 6 ${d / 2} 12" stroke="${INK}" stroke-width=".5" fill="none"/>`).join("")}`;
  if (look.root === "rhizome") return [[-26, 4], [-8, 10], [10, 4], [26, 12]].map(([dx, dy], i) => `<ellipse cx="${x + dx}" cy="${y + dy}" rx="13" ry="8" transform="rotate(${i % 2 ? 18 : -14} ${x + dx} ${y + dy})" fill="${rc}" ${ink}/>`).join("") + [-30, -6, 18].map((d) => `<path d="M${x + d} ${y + 14} q-2 8 1 14" stroke="${INK}" stroke-width=".5" fill="none"/>`).join("");
  if (look.root === "human") return `<path d="M${x - 8} ${y - 2} L${x + 8} ${y - 2} C${x + 12} ${y + 14} ${x + 10} ${y + 22} ${x + 9} ${y + 28} L${x + 22} ${y + 20} L${x + 9} ${y + 32} C${x + 10} ${y + 40} ${x + 16} ${y + 52} ${x + 18} ${y + 64} L${x + 4} ${y + 44} L${x - 4} ${y + 44} L${x - 16} ${y + 64} C${x - 14} ${y + 52} ${x - 10} ${y + 40} ${x - 9} ${y + 32} L${x - 22} ${y + 22} L${x - 9} ${y + 28} C${x - 10} ${y + 22} ${x - 12} ${y + 14} ${x - 8} ${y - 2}Z" fill="${rc}" ${ink}/><path d="M${x - 3} ${y + 8} l0 2 M${x + 3} ${y + 8} l0 2 M${x - 3} ${y + 15} q3 2 6 0" stroke="${INK}" stroke-width=".7" fill="none"/>`;
  return [-10, 0, 10].map((d) => `<path d="M${x} ${y} q${d} 8 ${d * 1.6} ${14 + Math.abs(d) / 2}" stroke="${INK}" stroke-width=".6" fill="none"/>`).join("");
}

/** Points along a gently curved stem from (x,y) up to height h, leaning by `lean` px. */
const stemPts = (x, y, h, lean, n = 16) => Array.from({ length: n + 1 }, (_, i) => { const t = i / n; return [x + lean * t * t, y - h * t]; });
const line = (pts) => "M" + pts.map(([x, y]) => `${f(x)} ${f(y)}`).join(" L");

/** The specimen itself, centred at cx with its ground line at gy. Returns SVG markup (no <svg> wrapper). */
export function specimen(p, cx = 200, gy = 222, scale = 1) {
  const look = p.look, r = rng(p.id), out = [], stemC = look.stem || (look.habit === "shrub" || look.habit === "tree" ? "#6b4a2a" : "#4a6a3a");
  const leafLen = { tiny: 7, needle: 16, strap: 56, huge: 62, broad: 44, fern: 30, pinnate: 34, palmate: 30 }[look.leaf] || (look.big ? 34 : 24);
  const stems = [];
  if (look.habit === "rosette") {
    const n = look.leaf === "huge" ? 5 : 9;
    for (let i = 0; i < n; i++) { const a = -80 + (i / (n - 1)) * 160 + (r() - 0.5) * 10;
      if (look.leaf === "huge") out.push(`<path d="M${cx} ${gy} L${f(cx + Math.sin((a * Math.PI) / 180) * 50)} ${f(gy - Math.cos((a * Math.PI) / 180) * 50)}" stroke="${stemC}" stroke-width="5" stroke-linecap="round"/>`);
      out.push(leaf(look, cx + (look.leaf === "huge" ? Math.sin((a * Math.PI) / 180) * 50 : 0), gy - (look.leaf === "huge" ? Math.cos((a * Math.PI) / 180) * 50 : 0), a, leafLen * (look.leaf === "huge" ? 1 : 1.7) * (0.8 + r() * 0.4), r)); }
    if (look.flower && look.flower !== "none") { const pts = stemPts(cx, gy, look.root === "human" ? 22 : 88, 6); stems.push(pts); out.push(`<path d="${line(pts)}" stroke="${stemC}" stroke-width="1.6" fill="none"/>`); }
  } else if (look.habit === "ball") {
    const twig = (x, y, a, d) => { if (d > 4) return; const L = 22 - d * 3, x2 = x + Math.sin((a * Math.PI) / 180) * L, y2 = y - Math.cos((a * Math.PI) / 180) * L;
      out.push(`<path d="M${f(x)} ${f(y)} L${f(x2)} ${f(y2)}" stroke="#8a9a3a" stroke-width="${f(3 - d * 0.5)}" stroke-linecap="round"/>`);
      if (d === 4) { out.push(leaf(look, x2, y2, a - 25, 16, r), leaf(look, x2, y2, a + 25, 16, r)); out.push(`<circle cx="${f(x2)}" cy="${f(y2 + 2)}" r="3" fill="${look.berry}" stroke="${INK}" stroke-width=".6"/>`); }
      twig(x2, y2, a - 32, d + 1); twig(x2, y2, a + 32, d + 1); };
    out.push(`<path d="M${cx - 120} ${gy - 40} Q${cx} ${gy - 70} ${cx + 120} ${gy - 30}" stroke="#6b4a2a" stroke-width="7" fill="none" stroke-linecap="round"/>`);
    for (const a of [0, 120, 240]) twig(cx, gy - 60, a, 0);
  } else {
    const n = { herb: 3, tall: 2, shrub: 4, tree: 1 }[look.habit] || 2, H = { herb: 110, tall: 168, shrub: 120, tree: 160 }[look.habit] || 120;
    for (let i = 0; i < n; i++) {
      const spread = n === 1 ? 0 : (i / (n - 1) - 0.5), x0 = cx + spread * (look.habit === "shrub" ? 18 : 10);
      const pts = stemPts(x0, gy, H * (1 - Math.abs(spread) * 0.35) * scale, spread * 70 + (look.habit === "tree" ? 60 : 0) + (r() - 0.5) * 8);
      stems.push(pts);
      out.push(`<path d="${line(pts)}" stroke="${stemC}" stroke-width="${look.habit === "tree" ? 4 : look.habit === "shrub" ? 2.4 : 1.6}" fill="none" stroke-linecap="round"/>`);
      if (look.spots) pts.slice(1, -4).forEach(([x, y], j) => j % 2 || out.push(`<ellipse cx="${f(x)}" cy="${f(y)}" rx="1.3" ry="2.2" fill="#7a2a5a"/>`));
    }
  }
  // leaves up each stem
  const tipFrac = look.flower === "spike" || look.flower === "spire" || look.flower === "hood" ? 0.55 : 0.85;
  stems.forEach((pts, si) => { if (look.habit === "rosette") return;
    const step = look.leaf === "tiny" ? 1 : look.leaf === "needle" ? 1 : 2;
    for (let i = 2; i < pts.length * tipFrac; i += step) { const [x, y] = pts[i], side = (i / step) % 2 ? 1 : -1, t = i / pts.length;
      const L = leafLen * (look.leaf === "strap" ? 1 - t * 0.6 : 1.1 - t * 0.5);
      if (look.leaf === "strap" && i > 4) break;
      out.push(leaf(look, x, y, side * (look.leaf === "strap" ? 12 + si * 6 : 55 + r() * 20), L, r));
      if (look.leaf === "needle" || look.leaf === "tiny") out.push(leaf(look, x, y, -side * (50 + r() * 20), L, r));
      if (look.berry && !["umbel", "bells"].includes(look.flower) && i % 4 === 0) out.push(`<circle cx="${f(x + side * 5)}" cy="${f(y + 4)}" r="${look.leaf === "needle" ? 3.4 : 4.2}" fill="${look.berry}" stroke="${INK}" stroke-width=".6"/>${look.leaf === "needle" ? `<circle cx="${f(x + side * 5)}" cy="${f(y + 2.6)}" r="1.2" fill="#3a2a1a"/>` : ""}`);
    }
  });
  // flowers
  const head = ["daisy", "cone", "umbel", "globe", "cup", "star", "trumpet", "daff", "catkin"].includes(look.flower);
  stems.forEach((pts) => {
    const [x, y] = pts[pts.length - 1], [px, py] = pts[pts.length - 3], a = (Math.atan2(x - px, py - y) * 180) / Math.PI;
    if (head) { const s = { umbel: 12, globe: 12, cup: 15, trumpet: 9, daff: 13, catkin: 6 }[look.flower] || 9;
      if (look.flower === "catkin") for (let j = 4; j < pts.length; j += 3) out.push(flower(look, pts[j][0] + 3, pts[j][1], 0, s, r));
      else out.push(flower(look, x, y, look.flower === "daff" ? 0 : a * 0.5, s, r));
      if (look.many) for (const d of [-14, 14]) { out.push(`<path d="M${f(x)} ${f(y + 10)} L${f(x + d)} ${f(y - 2)}" stroke="#4a6a3a" stroke-width="1"/>`, flower(look, x + d, y - 2, 0, 7, r)); }
    } else out.push(along(look, pts, r));
    if (look.pod) { const [qx, qy] = pts[Math.floor(pts.length * 0.6)];
      out.push(look.pod === "spiky" ? `<g transform="translate(${f(qx + 14)} ${f(qy)})"><ellipse rx="8" ry="10" fill="#6a8a4a" stroke="${INK}" stroke-width=".7"/>${Array.from({ length: 12 }, (_, k) => { const t = (k / 12) * 6.283; return `<path d="M${f(Math.cos(t) * 7)} ${f(Math.sin(t) * 9)} l${f(Math.cos(t) * 4)} ${f(Math.sin(t) * 4)}" stroke="${INK}" stroke-width=".7"/>`; }).join("")}</g>`
        : `<g transform="translate(${f(qx + 14)} ${f(qy)})"><path d="M-3 12 L-3 6" stroke="${INK}"/><ellipse rx="8" ry="7" fill="#a8b8a0" stroke="${INK}" stroke-width=".7"/><path d="M-7 -6 L-4 -9 L-1 -6 L2 -9 L5 -6 L7 -8" stroke="${INK}" stroke-width=".8" fill="none"/></g>`); }
  });
  if (look.habit !== "ball" && look.habit !== "tree") out.push(roots(look, cx, gy, r));
  if (look.habit === "tree") out.push(`<path d="M${cx - 6} ${gy + 2} l-4 6 M${cx} ${gy + 2} l0 8 M${cx + 6} ${gy + 2} l4 6" stroke="#6b4a2a" stroke-width="1.6"/>`);
  return out.join("");
}

/** Fit each habit to the page: small plants drawn bigger, roots kept on the page. */
export function placed(p) {
  const L = p.look, k = L.leaf === "huge" ? 1.05 : { tall: 1.08, tree: 1.12, herb: 1.4, shrub: 1.32, rosette: 1.45, ball: 1 }[L.habit] || 1.2;
  const gy = L.root === "human" ? 168 : L.root ? 196 : 226, s = L.root === "human" ? 1.25 : k;
  return `<g transform="translate(200 ${gy}) scale(${s}) translate(-200 ${-gy})">${specimen(p, 200, gy)}</g>`;
}

/** The grimoire page in the table pane: parchment, tape, the specimen, its label and the leaves you have left. */
export function pageSvg(p, { leaves = 5, max = 5, revealed = false, no = 1, theme = null, poison = false, fell = -1, fellTo = fell + 1, turn = false, sparkle = false } = {}) {
  const T = theme || PAGE_THEMES.parchment, latin = revealed && p ? `<tspan font-style="italic">${esc(p.latin)}</tspan>` : "· · · · ·";
  const name = revealed && p ? esc(p.name) : "Unknown specimen";
  const leafIcons = Array.from({ length: max }, (_, i) => `${i >= fell && i < fellTo && fell >= 0 ? `<g transform="translate(${36 + i * 18} 40)"><g class="gr-fall"><path d="${leafPath("oval", 13)}" transform="rotate(-30)" fill="#5a9a4a" stroke="${INK}" stroke-width=".9"/></g></g>` : ""}<g transform="translate(${36 + i * 18} 40) rotate(-30)"><path d="${leafPath("oval", 13)}" fill="${i < leaves ? "#5a9a4a" : "none"}" stroke="${i < leaves ? INK : T.ink}" stroke-width=".9" opacity="${i < leaves ? 1 : 0.45}"/></g>`).join("");
  return `<svg viewBox="0 0 400 318" preserveAspectRatio="xMidYMid meet" aria-hidden="true">
<defs><radialGradient id="gr-page" cx="50%" cy="45%" r="75%"><stop offset="0" stop-color="${T.paper}"/><stop offset="1" stop-color="${T.edge}"/></radialGradient></defs>
<rect x="-600" y="-400" width="1600" height="1100" fill="${T.desk}"/>
<rect x="14" y="10" width="372" height="282" rx="6" fill="url(#gr-page)" stroke="${T.ink}" stroke-width="1.2"/>
<rect x="22" y="18" width="356" height="266" rx="3" fill="none" stroke="${T.ink}" stroke-width=".6" opacity=".55" stroke-dasharray="${T.dash || "none"}"/>
${T.decor || ""}
<rect x="174" y="12" width="52" height="14" fill="#efe3b8" opacity=".75" transform="rotate(-3 200 19)"/>
<g class="gr-spec${turn ? " turn" : ""}"><g class="gr-sway">${p ? placed(p) : ""}</g></g>${sparkle ? `<g class="gr-spark">${Array.from({ length: 16 }, (_, i) => `<circle cx="${130 + ((i * 53) % 140)}" cy="${90 + ((i * 37) % 120)}" r="${i % 3 ? 2 : 3.2}" fill="${["#FADE8C", "#9be59b", "#f7b6e0"][i % 3]}" style="--d:${(i % 8) * 0.09}s"/>`).join("")}</g>` : ""}
${leafIcons}
<g transform="translate(244 240)"><rect width="130" height="42" rx="3" fill="${T.label}" stroke="${T.ink}" stroke-width=".8"/>
<text x="8" y="13" font-family="Cinzel, Georgia, serif" font-size="8" fill="${T.ink}" letter-spacing="1">SPECIMEN Nº ${String(no).padStart(2, "0")}</text>
<text x="8" y="26" font-family="Cormorant Garamond, Georgia, serif" font-size="${name.length > 20 ? 8.5 : 10.5}" fill="${T.ink}" font-weight="700">${name}</text><text x="8" y="37" font-family="Cormorant Garamond, Georgia, serif" font-size="8.5" fill="${T.ink}" opacity=".85">${latin}</text></g>

${revealed && poison ? `<g class="gr-stamp" transform="translate(84 236) rotate(-12)"><rect x="-52" y="-15" width="104" height="30" rx="4" fill="none" stroke="#b3122a" stroke-width="2.5"/><text y="7" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="17" fill="#b3122a" letter-spacing="2">☠ POISON</text></g>` : ""}
</svg>`;
}
const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));

/** Page looks, sold in the Essence store (shop.js) and drawn by pageSvg. */
const vine = (c) => `<path d="M30 40 Q40 150 30 260 M370 40 Q360 150 370 260" stroke="${c}" stroke-width="1.4" fill="none"/>${[60, 110, 160, 210].map((y) => `<path d="${leafPath("oval", 10)}" transform="translate(${y % 100 ? 33 : 30} ${y}) rotate(${y % 100 ? 50 : -50})" fill="${c}" opacity=".7"/><path d="${leafPath("oval", 10)}" transform="translate(${y % 100 ? 367 : 370} ${y}) rotate(${y % 100 ? -50 : 50})" fill="${c}" opacity=".7"/>`).join("")}`;
const moths = (c) => [[52, 92], [344, 70], [330, 196]].map(([x, y], i) => `<g transform="translate(${x} ${y}) rotate(${i * 25 - 20})" opacity=".55"><ellipse cx="-6" cy="0" rx="7" ry="5" fill="${c}"/><ellipse cx="6" cy="0" rx="7" ry="5" fill="${c}"/><ellipse rx="1.6" ry="6" fill="#2a1a10"/></g>`).join("");
const stars = (c) => Array.from({ length: 22 }, (_, i) => `<circle cx="${30 + ((i * 97) % 340)}" cy="${26 + ((i * 53) % 250)}" r="${i % 4 ? 0.9 : 1.6}" fill="${c}"/>`).join("") + `<path d="M340 52 a18 18 0 1 0 12 30 a14 14 0 1 1 -12 -30Z" fill="${c}" opacity=".85"/>`;
const gilt = (c) => `<path d="M22 18 l24 0 M22 18 l0 24 M378 18 l-24 0 M378 18 l0 24 M22 284 l24 0 M22 284 l0 -24 M378 284 l-24 0 M378 284 l0 -24" stroke="${c}" stroke-width="3"/>` + [[34, 30], [366, 30], [34, 272], [366, 272]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="4" fill="none" stroke="${c}" stroke-width="1.2"/>`).join("");
const pressed = () => [[48, 110, "#c75a9a"], [352, 120, "#f6c518"], [56, 196, "#9b7be0"], [342, 214, "#ff9a1f"]].map(([x, y, c], i) => `<g transform="translate(${x} ${y}) rotate(${i * 40})" opacity=".8">${[0, 72, 144, 216, 288].map((a) => `<ellipse cy="-5" rx="2.6" ry="5" fill="${c}" transform="rotate(${a})"/>`).join("")}<circle r="2" fill="#f2c230"/></g>`).join("");
const runes = (c) => `<text x="200" y="27" text-anchor="middle" font-size="9" fill="${c}" letter-spacing="6" font-family="serif">☿ ♄ ♃ ♂ ☉ ♀ ☽ ✶ 🜁 🜂 🜃 🜄</text><text x="200" y="300" text-anchor="middle" font-size="8" fill="${c}" letter-spacing="5" font-family="serif" opacity=".7">✶ ✶ ✶</text>`;
export const PAGE_THEMES = {
  parchment: { paper: "#f3e6c4", edge: "#d2b98a", ink: "#3a2716", label: "#fbf3dc", desk: "#1a0f07" },
  vellum: { paper: "#fbf7ee", edge: "#e6dccb", ink: "#3c3022", label: "#ffffff", desk: "#2a2418", decor: pressed() },
  moss: { paper: "#dfe6c4", edge: "#9fb08a", ink: "#23301a", label: "#eef2da", desk: "#0e1a0b", decor: vine("#4f7a3a") },
  moonlit: { paper: "#d8d8ea", edge: "#8e90b8", ink: "#1e1f3e", label: "#ecebf8", desk: "#080918", decor: stars("#4a4c8a") },
  moth: { paper: "#ead9c0", edge: "#a88a68", ink: "#2e1f12", label: "#f6ead6", desk: "#140b05", decor: moths("#7a5a3a") },
  alchemist: { paper: "#f0dcae", edge: "#b88a4a", ink: "#3a1e08", label: "#f8ead0", desk: "#1a0a02", decor: gilt("#b8892a") + runes("#8a5a1a"), dash: "4 3" },
  poison: { paper: "#d6dcc4", edge: "#6e7a5a", ink: "#14200e", label: "#e6ead6", desk: "#050a03", decor: `<text x="40" y="276" font-size="16" opacity=".35">☠</text><text x="356" y="44" font-size="16" opacity=".35">☠</text>` + vine("#3a2a4a") },
};
