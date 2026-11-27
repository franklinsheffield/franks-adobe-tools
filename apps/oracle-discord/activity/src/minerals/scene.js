// Mineral Cabinet drawings (SVG): the specimen as a rough rock with its colour and lustre, sitting in the chosen case,
// and an overlay for each test (scratch marks, streak plate, magnet, acid fizz, balance, UV glow). The flame test
// reuses Flame Test Lab's burner, so a mineral's flame is exactly the flame of its metal.
import { sample } from "../flametest/data.js";
import { benchSvg } from "../flametest/scene.js";

const STREAK = { white: "#f4f2ee", "lead grey": "#6a6e74", "greenish black": "#2a3328", black: "#1a1a1a", "red-brown": "#8a3a26", "light green": "#9ad8a8", "pale yellow": "#f0e08a",
  "copper red": "#b5532a", "golden yellow": "#e8b828", "light blue": "#8ab4f0", scarlet: "#d8321e", "pale yellow-brown": "#d8b878", "white to pale brown": "#e2d2b8", brown: "#6a4a32" };
export const streakHex = (s) => STREAK[s] || "#eee";
const hash = (s) => [...s].reduce((n, c) => (n * 31 + c.charCodeAt(0)) >>> 0, 7);
/** An irregular rock outline, the same for each mineral every time. */
function rockPath(id, cx, cy, r) {
  let h = hash(id); const pts = []; const n = 9 + (h % 4);
  for (let i = 0; i < n; i++) { h = (h * 1103515245 + 12345) >>> 0; const a = (i / n) * Math.PI * 2, k = 0.72 + ((h >>> 8) % 100) / 340; pts.push([cx + Math.cos(a) * r * k * 1.15, cy + Math.sin(a) * r * k * 0.85]); }
  return "M" + pts.map((p) => p.map((v) => v.toFixed(1)).join(" ")).join(" L") + "Z";
}
function rockSvg(m, cx = 160, cy = 120, r = 62, glow = null) {
  const [a, b] = m.c, id = "mr-" + m.id, met = m.lustre === "metallic", shine = met ? 0.85 : m.lustre === "adamantine" || m.lustre === "vitreous" ? 0.55 : m.lustre === "earthy" ? 0 : 0.3;
  const d = rockPath(m.id, cx, cy, r);
  return `<defs><radialGradient id="${id}" cx="38%" cy="32%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>
    <path class="mc-rock" d="${d}" fill="${glow || `url(#${id})`}" stroke="#0008" stroke-width="2"/>${glow ? "" : `
    <path d="M${cx - r * 0.5} ${cy - r * 0.2} L${cx - r * 0.1} ${cy - r * 0.55} L${cx + r * 0.25} ${cy - r * 0.15}" stroke="#ffffff" stroke-opacity="${shine * 0.6}" stroke-width="${met ? 3 : 2}" fill="none"/>
    <path d="M${cx + r * 0.1} ${cy + r * 0.35} L${cx + r * 0.5} ${cy + r * 0.05}" stroke="#000" stroke-opacity=".25" stroke-width="2"/>
    ${shine ? `<circle class="mc-glint" cx="${cx - r * 0.25}" cy="${cy - r * 0.3}" r="${met ? 5 : 3.5}" fill="#fff" opacity="${shine}"/>` : ""}`}`;
}
const caseSvg = (id) => id === "mc-drawer" ? `<rect x="20" y="164" width="280" height="56" rx="4" fill="#6a4426" stroke="#3a2210"/><rect x="140" y="186" width="40" height="8" rx="3" fill="#c8a060"/>`
  : id === "mc-dome" ? `<ellipse cx="160" cy="196" rx="96" ry="14" fill="#5a3a20"/><path d="M78 194 Q78 40 160 36 Q242 40 242 194" fill="#cfe8ff14" stroke="#cfe8ff66" stroke-width="2"/>`
  : id === "mc-museum" ? `<rect x="40" y="30" width="240" height="176" rx="6" fill="#ffffff08" stroke="#d8c08a" stroke-width="3"/><rect x="40" y="30" width="240" height="10" fill="#fff6d0" opacity=".25"/><rect x="40" y="196" width="240" height="22" fill="#3a2a1a"/>`
  : `<rect x="70" y="172" width="180" height="40" rx="3" fill="#c8b48a" stroke="#8a7650"/><path d="M130 172 V212 M190 172 V212" stroke="#8a7650"/>`;

/** The cabinet scene. test: the last test run, to draw its overlay. */
export function cabinetSvg(m, { look, test = null, label = "", unknown = true } = {}) {
  if (test === "flame" || test === "scope") {
    const s = m.flame && m.flame.length <= 2 && m.flame !== "pb" ? sample(m.flame) : null;
    const flame = s ? s.flame : m.flame === "pb" ? ["#ffffff", "#bcd8ff", "#7a9ad8"] : m.flame === "s" ? ["#dde6ff", "#4a6aff", "#1a2ab0"] : null;
    return benchSvg({ look: { burner: "ft-bunsen", wire: "ft-nichrome", scope: "ft-hand" }, flame, dip: true, spectrum: test === "scope" && s ? s : null });
  }
  const uv = test === "uv", lens = look.lens;
  const over = {
    scratch: `<g class="mc-tool"><path d="M222 60 L262 20" stroke="#bfc4c8" stroke-width="6" stroke-linecap="round"/><path d="M150 112 l26 -6 M152 120 l22 -5" stroke="#fff" stroke-width="1.5" opacity=".8"/></g>`,
    streak: `<g class="mc-tool"><rect x="206" y="150" width="96" height="58" rx="4" fill="#f6f3ec" stroke="#aaa"/><path class="mc-streak" d="M220 182 Q250 172 286 178" stroke="${streakHex(m.streak)}" stroke-width="9" stroke-linecap="round" fill="none"/></g>`,
    magnet: `<g class="mc-tool${m.mag === "yes" ? " snap" : m.mag === "weak" ? " tug" : ""}"><path d="M230 40 v40 a20 20 0 0 0 40 0 v-40" stroke="#c8281e" stroke-width="14" fill="none"/><rect x="223" y="36" width="14" height="12" fill="#ddd"/><rect x="263" y="36" width="14" height="12" fill="#ddd"/></g>`,
    acid: `<g class="mc-tool"><path d="M196 30 L206 30 L206 64 L201 74 L196 64Z" fill="#cfe8ff" stroke="#8ab"/><circle class="mc-drop" cx="201" cy="80" r="3" fill="#bfe0ff"/>${m.fizz === "no" ? "" : Array.from({ length: m.fizz === "yes" ? 10 : 4 }, (_, i) => `<circle class="mc-bub" style="--d:${i * 0.12}s" cx="${168 + (i % 5) * 7}" cy="${96 - (i % 3) * 5}" r="${2 + (i % 2)}" fill="none" stroke="#fff" opacity=".8"/>`).join("")}</g>`,
    heft: `<g class="mc-tool"><path d="M160 26 v20 M110 46 h100" stroke="#c8a060" stroke-width="4"/><path d="M104 46 l-14 30 h28z M216 46 l-14 30 h28z" fill="none" stroke="#c8a060" stroke-width="2"/><text x="160" y="22" font-size="12" fill="#f3e6c8" text-anchor="middle">${m.sg} g/cm³</text></g>`,
  }[test] || "";
  return `<svg class="mc-scene${uv ? " uv" : ""}" viewBox="0 0 320 240" role="img" aria-label="${unknown ? "An unknown mineral specimen" : m.name}">
    <rect width="320" height="240" fill="${uv ? "#07030f" : "#16110c"}"/>${uv ? "" : `<rect y="214" width="320" height="26" fill="#2a2018"/>`}
    ${uv ? "" : caseSvg(look.case)}${rockSvg(m, 160, 120, 62, uv ? (m.uv ? (m.uv.includes("blue") ? "#6a4aff" : "#ff4a8a") : "#120a1e") : null)}${uv && m.uv ? `<circle class="mc-uvglow" cx="160" cy="120" r="80" fill="${m.uv.includes("blue") ? "#6a4aff" : "#ff4a8a"}" opacity=".25"/>` : ""}
    ${over}${lens === "mc-brass" ? `<circle cx="64" cy="58" r="26" fill="#cfe8ff22" stroke="#c8a060" stroke-width="5"/><path d="M82 76 l20 20" stroke="#5a3a20" stroke-width="7"/>` : lens === "mc-loupe" ? `<circle cx="60" cy="56" r="16" fill="#cfe8ff22" stroke="#222" stroke-width="7"/>` : `<rect x="40" y="40" width="34" height="22" rx="6" fill="#2a2a2a"/><circle cx="57" cy="51" r="8" fill="#cfe8ff33" stroke="#888"/>`}
    ${label ? `<text x="160" y="232" font-size="12" fill="#f3e6c8" text-anchor="middle">${label.replace(/[<&>]/g, "")}</text>` : ""}</svg>`;
}
/** A small rock icon for the drawers. */
export const rockIcon = (m, size = 34) => `<svg viewBox="80 40 160 160" width="${size}" height="${size}" aria-hidden="true">${rockSvg(m, 160, 120, 62)}</svg>`;
