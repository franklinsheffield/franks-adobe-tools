// Fireworks Workshop drawing (SVG + CSS animation): a night sky over a backdrop, mortar tubes, a rising shell and its
// burst. Every star is a circle that flies out, falls a little, changes colour for a two-stage star and fades; tails add
// trailing sparks (gold for a willow, silver for a chrysanthemum); a ring burst lays the stars in a tilted circle.
import { COLOURS, tail as tailOf } from "./data.js";
const TUBE = { "fw-card": "#8a6a44", "fw-hdpe": "#e8e4da", "fw-glass": "#3a6a5a" };
const CASE = { "fw-paper": "#c8a46a", "fw-round": "#d8b070", "fw-cyl": "#a87a4a" };
const BACK = {
  "fw-roof": `<path d="M0 214 L40 214 L40 196 L70 196 L70 206 L120 206 L120 186 L132 186 L132 174 L140 174 L140 186 L170 186 L170 200 L230 200 L230 190 L262 190 L262 208 L320 208 L320 240 L0 240Z" fill="#0b0916"/><rect x="126" y="160" width="8" height="18" fill="#0b0916"/><circle cx="130" cy="156" r="3" fill="#ffcf6a" opacity=".6"/>`,
  "fw-harbour": `<rect y="206" width="320" height="34" fill="#0a1426"/><path d="M0 206 L30 206 L36 196 L60 196 L66 206 L320 206" fill="#0b0916"/><path d="M200 206 L210 176 L214 206Z M214 206 L240 192 L240 206Z" fill="#0b0916"/>${[20, 70, 130, 190, 250, 300].map((x) => `<rect x="${x}" y="${214 + (x % 3) * 6}" width="14" height="1.5" fill="#ffffff22"/>`).join("")}`,
  "fw-castle": `<path d="M60 240 L60 180 L70 180 L70 172 L78 172 L78 180 L92 180 L92 172 L100 172 L100 180 L110 180 L110 150 L120 140 L130 150 L130 180 L190 180 L190 150 L200 140 L210 150 L210 180 L220 180 L220 172 L228 172 L228 180 L242 180 L242 172 L250 172 L250 180 L260 180 L260 240Z" fill="#0b0916"/><rect y="226" width="320" height="14" fill="#0b0916"/>`,
};
const X = (s) => String(s ?? "").replace(/[<&>"]/g, "");
let uid = 0;
/** One burst at (x, y). b = { c1, c2, effect, pat, dull }, delay in seconds, scale 0.6-1.2. */
export function burstSvg(b, x, y, { delay = 0, scale = 1, label = "" } = {}) {
  const n = b.pat === "ring" ? 22 : 30, c1 = COLOURS[b.c1]?.hex || "#fff", c2 = b.c2 ? COLOURS[b.c2]?.hex || c1 : c1, R = 62 * scale, id = "fw" + uid++;
  const tl = b.effect === "willow" ? tailOf("c").hex : b.effect === "chrysanthemum" ? tailOf("ti").hex : null, op = b.dull ? 0.45 : 1;
  const stars = Array.from({ length: n }, (_, i) => {
    const a = (i / n) * Math.PI * 2 + (b.pat === "ring" ? 0 : (i % 3) * 0.37), r = b.pat === "ring" ? R : R * (0.55 + ((i * 37) % 45) / 100);
    const dx = Math.cos(a) * r, dy = Math.sin(a) * r * (b.pat === "ring" ? 0.45 : 1), fall = b.effect === "willow" ? 38 : 16;
    const st = (k, rad, fill, extra = "") => `<circle class="fw-st${extra}" r="${rad}" style="--dx:${dx.toFixed(1)}px;--dy:${dy.toFixed(1)}px;--fall:${fall}px;--c1:${fill || c1};--c2:${fill || c2};--d:${(delay + k * 0.07).toFixed(2)}s;opacity:${op}"/>`;
    return st(0, 2.6 * scale) + (tl ? st(1, 1.5 * scale, tl, " tl") + st(2, 1.1 * scale, tl, " tl") + (b.effect === "willow" ? st(3, 0.9 * scale, tl, " tl") : "") : "");
  }).join("");
  return `<g class="fw-burst${b.effect === "willow" ? " willow" : ""}" transform="translate(${x} ${y})"><circle class="fw-flash" r="${10 * scale}" fill="#fff" style="--d:${delay}s"/>${stars}${label ? `<text class="fw-lbl" y="${R + 24}" text-anchor="middle" style="--d:${delay}s">${X(label)}</text>` : ""}</g>`;
}
/** A shell rising from its mortar to (x, y) over `rise` seconds, then bursting. */
export const rocketSvg = (x, y, rise = 0.9, delay = 0) => `<g class="fw-rise" style="--y:${(y - 206).toFixed(0)}px;--t:${rise}s;--d:${delay}s"><circle cx="${x}" cy="206" r="2.2" fill="#ffd98a"/><circle cx="${x}" cy="212" r="1.4" fill="#ff9a4a" opacity=".7"/></g>`;
/** The whole sky. shots = [{ b, x, y, rise, delay, label, scale }]. */
export function skySvg({ look = {}, shots = [], shell = null, stars = true } = {}) {
  const tube = TUBE[look.tube] || TUBE["fw-card"], back = BACK[look.sky] || BACK["fw-roof"];
  const sky = stars ? Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 97) % 320}" cy="${(i * 53) % 150}" r="${i % 4 ? 0.6 : 1}" fill="#fff" opacity="${0.3 + (i % 5) / 10}"/>`).join("") : "";
  const sh = shell ? shellSvg(shell, look) : "";
  return `<svg class="fw-sky" viewBox="0 0 320 240" role="img" aria-label="The night sky over the workshop"><defs><linearGradient id="fwg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#06061a"/><stop offset="1" stop-color="#1c1236"/></linearGradient></defs>
    <rect width="320" height="240" fill="url(#fwg)"/>${sky}${back}
    ${[110, 160, 210].map((x) => `<rect x="${x - 5}" y="200" width="10" height="16" rx="1" fill="${tube}" stroke="#0008"/>`).join("")}
    ${shots.map((s) => rocketSvg(s.x, s.y, s.rise ?? 0.9, s.delay ?? 0) + burstSvg(s.b, s.x, s.y, { delay: (s.delay ?? 0) + (s.rise ?? 0.9), scale: s.scale ?? 1, label: s.label })).join("")}${sh}</svg>`;
}
/** The shell being packed (shown on the bench before launch): casing, two layers of stars, tail flecks. */
export function shellSvg(b, look = {}) {
  const cs = CASE[look.casing] || CASE["fw-paper"], c1 = COLOURS[b.c1]?.hex || "#555", c2 = b.c2 ? COLOURS[b.c2]?.hex : null, tl = b.effect === "willow" ? "#ffb04a" : b.effect === "chrysanthemum" ? "#eef4ff" : null;
  const dots = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, r = b.pat === "ring" ? 15 : 7 + (i % 3) * 4;
    return `<circle cx="${(160 + Math.cos(a) * r).toFixed(1)}" cy="${(120 + Math.sin(a) * r * (b.pat === "ring" ? 0.6 : 1)).toFixed(1)}" r="3.2" fill="${c2 || c1}" stroke="${c1}" stroke-width="1.6"/>${tl ? `<circle cx="${(160 + Math.cos(a) * r + 3).toFixed(1)}" cy="${(120 + Math.sin(a) * r).toFixed(1)}" r="1" fill="${tl}"/>` : ""}`; }).join("");
  return `<g class="fw-shell"><rect x="96" y="70" width="128" height="104" rx="10" fill="#140e24" opacity=".85"/><circle cx="160" cy="120" r="26" fill="${cs}" stroke="#0006" stroke-width="2"/><circle cx="160" cy="120" r="5" fill="#2a2a2a"/>${dots}<path d="M160 94 L160 80" stroke="#c8a46a" stroke-width="2"/><text x="160" y="166" font-size="9" fill="#f3e6c8" text-anchor="middle">${b.dull ? "dull: wrong oxidiser" : "packed shell"}</text></g>`;
}
