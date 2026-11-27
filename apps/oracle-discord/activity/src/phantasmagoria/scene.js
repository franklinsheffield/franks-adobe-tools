// Phantasmagoria drawings (SVG, 320 x 240). Lantern: a dark hall, smoke rising from a brazier, the lantern on rails
// with its beam and a ruler, the ghost on the smoke at its true height. Pepper: a theatre in cut-away, the actor
// lying in the lit pit, the glass at its angle and the reflected ghost tilted twice as far. Show: the hall in full
// swing with the cue's effect. Hall: the audience seats, for show night.
const xmlEsc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const LANTERN = { "ph-tin": ["#6a6f78", "#3a3e44"], "ph-fantascope": ["#8a5a2e", "#E2B04A"], "ph-argand": ["#b08a3a", "#FFE3A3"] };
const GLASS = { "ph-plate": "#bfe3ff", "ph-polytechnic": "#d8ecff", "ph-mansion": "#c8ffe8" };

/** The ghost figure at height h px, its feet at (x, y). Slide picks the shape. */
export function ghostShape(slide, x, y, h, op = 0.8, cls = "ph-ghost") {
  const s = h / 100;
  const body = slide === "ph-skeleton"
    ? `<circle cx="0" cy="-88" r="11" fill="none" stroke="#f4f0ff" stroke-width="3"/><path d="M0 -76v40M-16 -66h32M-14 -56h28M-12 -46h24M0 -36l-12 34M0 -36l12 34M-16 -66l-10 26M16 -66l10 26" stroke="#f4f0ff" stroke-width="3" fill="none"/><circle cx="-4" cy="-90" r="2" fill="#f4f0ff"/><circle cx="4" cy="-90" r="2" fill="#f4f0ff"/>`
    : slide === "ph-nun" ? `<path d="M-20 0q-4 -60 6 -84q14 -18 28 0q10 24 6 84z" fill="#f4f0ff"/><path d="M-10 -84q10 -12 20 0v14h-20z" fill="#1a0a14"/><circle cx="0" cy="-74" r="7" fill="#ffe9e9"/><path d="M-6 -60v40M6 -60v30" stroke="#c8203a" stroke-width="2"/><circle cx="14" cy="-56" r="3" fill="#FFB347"/>`
    : `<path d="M0 -100q-24 0 -26 34v66l9 -7l8 7l9 -7l9 7l9 -7l8 7v-66q-2 -34 -26 -34z" fill="#f4f0ff"/><ellipse cx="-8" cy="-74" rx="4" ry="6" fill="#1a0a14"/><ellipse cx="8" cy="-74" rx="4" ry="6" fill="#1a0a14"/><ellipse cx="0" cy="-58" rx="5" ry="7" fill="#1a0a14"/>`;
  return `<g class="${cls}" opacity="${op}" transform="translate(${x} ${y}) scale(${s.toFixed(3)})">${body}</g>`;
}
const smoke = () => `<g class="ph-smoke">${[0, 1, 2, 3, 4].map((i) => `<ellipse class="ph-puff" style="--d:${(i * 0.9).toFixed(1)}s" cx="${210 + (i % 2) * 18}" cy="200" rx="22" ry="16" fill="#cfc6d8" opacity=".18"/>`).join("")}</g>`;

/** opts: { mode: "lantern"|"pepper"|"show"|"hall", look, dist, angle, showGhost, h, tilt, cue, state } */
export function sceneSvg({ mode = "lantern", look = {}, dist = 3, angle = 45, showGhost = false, h = null, tilt = null, cue = null, state = null } = {}) {
  const [la, lb] = LANTERN[look.lantern] || LANTERN["ph-tin"], gl = GLASS[look.glass] || GLASS["ph-plate"], slide = look.slide || "ph-spectre";
  const end = state === "won" ? `<g class="ph-bow">${[0, 1, 2, 3, 4, 5, 6, 7].map((i) => `<text class="ph-clap" style="--d:${(i * 0.12).toFixed(2)}s" x="${20 + i * 38}" y="${228 - (i % 2) * 8}" font-size="13">${i % 2 ? "👏" : "✨"}</text>`).join("")}</g>`
    : state === "flop" ? `<rect width="320" height="240" fill="#000" opacity=".45"/><g class="ph-stamp"><rect x="100" y="96" width="120" height="34" rx="3" fill="#0009" stroke="#c8203a" stroke-width="3" transform="rotate(-6 160 113)"/><text x="160" y="120" font-size="16" font-weight="700" fill="#ff5a6a" text-anchor="middle" transform="rotate(-6 160 113)" font-family="Georgia,serif">LAMP OUT</text></g>` : "";
  if (mode === "pepper") {
    const th = (angle * Math.PI) / 180, gx = 170, gy = 150, L = 70, x2 = gx + Math.cos(th) * L, y2 = gy - Math.sin(th) * L, x1 = gx - Math.cos(th) * L * 0.6, y1 = gy + Math.sin(th) * L * 0.6;
    const t = tilt ?? angle * 2, ghost = showGhost ? `<g transform="translate(232 150) rotate(${90 - t})">${ghostShape(slide, 0, 0, 74, 0.6, "ph-ghost ph-fadein")}</g>` : "";
    return `<svg viewBox="0 0 320 240" role="img" aria-label="Pepper's ghost: the stage in cut-away">
    <rect width="320" height="240" fill="#0a0710"/><rect x="0" y="150" width="320" height="6" fill="#5a2a14"/><rect x="0" y="156" width="320" height="84" fill="#120a08"/>
    <rect x="100" y="166" width="120" height="60" fill="#2a1a10" stroke="#5a3a1a"/><circle class="ph-lamp" cx="112" cy="176" r="6" fill="#FFD27A"/><path d="M112 176l40 30" stroke="#FFD27A" stroke-opacity=".3" stroke-width="12"/>
    <g transform="translate(176 210) rotate(-90)"><path d="M0 -40q-10 0 -10 14v26h20v-26q0 -14 -10 -14z" fill="#d9b8a0"/><circle cx="0" cy="-48" r="7" fill="#d9b8a0"/></g>
    <line class="ph-glass" x1="${x1.toFixed(1)}" y1="${y1.toFixed(1)}" x2="${x2.toFixed(1)}" y2="${y2.toFixed(1)}" stroke="${gl}" stroke-width="3" stroke-opacity=".8"/>
    <path d="M${gx + 22} ${gy} A22 22 0 0 0 ${(gx + Math.cos(th) * 22).toFixed(1)} ${(gy - Math.sin(th) * 22).toFixed(1)}" fill="none" stroke="#FFE3A3" stroke-width="1"/><text x="${gx + 26}" y="${gy - 6}" font-size="9" fill="#FFE3A3" font-family="Georgia,serif">${angle}°</text>
    ${ghost}<g fill="#1a1220">${[30, 60, 270, 300].map((x) => `<circle cx="${x}" cy="140" r="7"/><path d="M${x - 11} 150q0 -12 11 -12q11 0 11 12z"/>`).join("")}</g>
    <text x="8" y="16" font-size="9" fill="#cfc6d8" font-family="Georgia,serif">The audience sees the stage; the pit below is hidden.</text>${end}</svg>`;
  }
  if (mode === "show" || mode === "hall") {
    const fx = { appear: ghostShape(slide, 210, 170, 110, 0.75, "ph-ghost ph-fadein"), grow: ghostShape(slide, 210, 190, 160, 0.7, "ph-ghost ph-grow"), thunder: `<rect class="ph-flash" width="320" height="240" fill="#fff"/><path d="M220 20l-20 50h16l-14 44" stroke="#FFE3A3" stroke-width="4" fill="none"/>`,
      fade: ghostShape(slide, 210, 170, 110, 0.75, "ph-ghost ph-fadeout"), skull: `<text class="ph-ghost ph-grow" x="186" y="140" font-size="60">💀</text>`, dissolve: `${ghostShape(slide, 190, 170, 100, 0.6, "ph-ghost ph-fadeout")}${ghostShape("ph-skeleton", 230, 170, 100, 0.6, "ph-ghost ph-fadein")}` }[cue] || "";
    return `<svg viewBox="0 0 320 240" role="img" aria-label="The phantasmagoria hall"><rect width="320" height="240" fill="#07050a"/><rect x="140" y="20" width="160" height="170" fill="#100c16"/>${smoke()}${fx}
    <g fill="#1a1220">${[24, 64, 104, 144, 184, 224, 264, 304].map((x, i) => `<circle cx="${x}" cy="${206 + (i % 2) * 4}" r="9"/><path d="M${x - 14} 240q0 -22 14 -22q14 0 14 22z"/>`).join("")}</g>${end}</svg>`;
  }
  const px = 40 + (dist - 1) * 22, ghostPx = (h ?? dist * 0.5) * 40, ruler = [0, 1, 2, 3, 4].map((m) => `<line x1="296" y1="${200 - m * 40}" x2="306" y2="${200 - m * 40}" stroke="#FFE3A3" stroke-width="1"/><text x="308" y="${203 - m * 40}" font-size="8" fill="#FFE3A3">${m}m</text>`).join("");
  return `<svg viewBox="0 0 320 240" role="img" aria-label="The magic lantern and the smoke">
  <rect width="320" height="240" fill="#07050a"/><rect y="200" width="320" height="40" fill="#160e0a"/><path d="M20 214h190" stroke="#5a3a1a" stroke-width="2" stroke-dasharray="6 4"/>
  ${smoke()}<path d="M196 200l10 -10h20l10 10z" fill="#5a2a14"/><circle class="ph-ember" cx="216" cy="194" r="4" fill="#FF7A2A"/>
  <path class="ph-beam" d="M${(255 - px).toFixed(1)} 186L216 ${(200 - ghostPx).toFixed(1)}L216 200Z" fill="#FFF3C4" opacity=".12"/>
  <g transform="translate(${(232 - px).toFixed(1)} 0)"><rect x="0" y="176" width="26" height="20" rx="3" fill="${la}" stroke="${lb}" stroke-width="2"/><rect x="24" y="182" width="8" height="8" fill="${lb}"/><path d="M8 176v-8h10v8" fill="${la}"/><circle cx="6" cy="200" r="5" fill="#2a1a10" stroke="${lb}"/><circle cx="22" cy="200" r="5" fill="#2a1a10" stroke="${lb}"/><circle class="ph-lamp" cx="13" cy="186" r="4" fill="#FFD27A"/></g>
  <text x="${(245 - px).toFixed(1)} " y="232" font-size="9" fill="#cfc6d8" text-anchor="middle" font-family="Georgia,serif">${dist.toFixed(1)} m</text>
  ${showGhost ? ghostShape(slide, 220, 200, ghostPx, 0.7, "ph-ghost ph-fadein") : ""}${ruler}${end}</svg>`;
}
export { xmlEsc };
