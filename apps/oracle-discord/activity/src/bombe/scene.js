// Bombe Room drawing: a hut with the bombe cabinet (three rows of spinning drums), an Enigma on the desk, and the
// crib strip slid along the cipher. HTML/SVG only, no rules. Look from shop.js: machine, bombe, hut.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const CAB = { "bo-bombe": ["#2c2a28", "#6b6660"], "bo-bomba": ["#3a3326", "#8a7a52"], "bo-usbombe": ["#4a4e52", "#9aa2a8"] };
const HUT = { "bo-hut6": ["#3b4a3a", "#1d241c"], "bo-wrens": ["#26324a", "#111827"], "bo-cottage": ["#4a3a2a", "#1f160e"] };

function machineSvg(id) {
  if (id === "bo-typex") return `<rect x="10" y="150" width="96" height="44" rx="4" fill="#2b2b2b"/><rect x="18" y="142" width="80" height="12" rx="3" fill="#454545"/>${[0, 1, 2, 3, 4].map((i) => `<rect x="${24 + i * 14}" y="134" width="10" height="12" rx="2" fill="#bba67a"/>`).join("")}<rect x="22" y="196" width="72" height="6" fill="#ddd"/>`;
  const rot = id === "bo-m4" ? 4 : 3, body = id === "bo-m4" ? "#2a2f26" : "#1f1c18";
  return `<rect x="12" y="148" width="92" height="48" rx="4" fill="#6b4a2a"/><rect x="18" y="154" width="80" height="38" rx="3" fill="${body}"/>${Array.from({ length: rot }, (_, i) => `<rect x="${40 + i * 10}" y="140" width="8" height="12" rx="2" fill="#cfc6b0"/>`).join("")}
    ${Array.from({ length: 18 }, (_, i) => `<circle cx="${26 + (i % 9) * 8}" cy="${166 + Math.floor(i / 9) * 10}" r="2.6" fill="#e8d9a8" class="bo-lamp" style="--d:${(i * 0.17).toFixed(2)}s"/>`).join("")}`;
}

/** The hut. drums: [l, m, r] letters. spin: drums turning. state: "" | "stop" | "won" | "lost". */
export function hutHtml({ look, drums = ["A", "A", "A"], spin = false, state = "", label = "" }) {
  const [c1, c2] = CAB[look.bombe] || CAB["bo-bombe"], [h1, h2] = HUT[look.hut] || HUT["bo-hut6"];
  const drum = (x, y, l, i) => `<g class="bo-drum${spin ? " spin" : ""}" style="--d:${(i * 0.07).toFixed(2)}s"><circle cx="${x}" cy="${y}" r="15" fill="#d9d2c0" stroke="#111" stroke-width="2"/><circle cx="${x}" cy="${y}" r="11" fill="none" stroke="${i % 3 === 0 ? "#b0302a" : i % 3 === 1 ? "#2f6a3a" : "#2f4f8a"}" stroke-width="3" stroke-dasharray="4 3"/><text x="${x}" y="${y + 5}" text-anchor="middle" font-family="monospace" font-weight="700" font-size="13" fill="#111">${esc(l)}</text></g>`;
  let rows = ""; for (let r = 0; r < 3; r++) for (let c = 0; c < 3; c++) { const i = r * 3 + c; rows += drum(184 + c * 38, 52 + r * 44, r === 1 ? drums[c] : "ABCDEFGHIJKLMNOPQRSTUVWXYZ"[(i * 7) % 26], i); }
  return `<div class="bo-hut${state ? " " + state : ""}" style="--h1:${h1};--h2:${h2}"><div class="bo-bulb"></div>
    <svg class="bo-scene" viewBox="0 0 400 220" aria-hidden="true">
      <rect x="0" y="196" width="400" height="24" fill="#2a1d12"/>
      <rect x="160" y="22" width="126" height="168" rx="5" fill="${c1}" stroke="${c2}" stroke-width="3"/>
      <rect x="166" y="28" width="114" height="150" rx="3" fill="#121212" opacity=".55"/>${rows}
      <rect x="176" y="72" width="94" height="4" fill="#c9a24a" opacity="${state === "stop" || state === "won" ? 1 : 0.25}" class="bo-stopbar"/>
      <rect x="296" y="60" width="46" height="120" rx="4" fill="${c1}" stroke="${c2}" stroke-width="2"/>${[0, 1, 2, 3, 4, 5].map((i) => `<path d="M304 ${74 + i * 16} h30" stroke="#8a6a3a" stroke-width="3" class="bo-cable"/>`).join("")}
      ${machineSvg(look.machine)}
      <rect x="350" y="150" width="40" height="44" rx="3" fill="#efe2c2" transform="rotate(4 370 172)"/><path d="M356 160 h28 M356 168 h22 M356 176 h26" stroke="#6b5a3a" stroke-width="2" transform="rotate(4 370 172)"/>
    </svg>${label ? `<div class="bo-label">${esc(label)}</div>` : ""}</div>`;
}

/** The crib strip: the cipher with the crib slid under it at offset; clashes in red. */
export function stripHtml(cipher, crib, at, { lo = 0, hi = cipher.length, reveal = null } = {}) {
  const from = Math.max(0, lo - 2), to = Math.min(cipher.length, hi + crib.length + 2), cl = new Set([...crib].map((c, i) => (cipher[at + i] === c ? at + i : -1)));
  let top = "", bot = "";
  for (let i = from; i < to; i++) {
    const k = i - at, under = k >= 0 && k < crib.length ? crib[k] : "";
    top += `<span class="bo-c${cl.has(i) ? " clash" : ""}">${cipher[i]}</span>`;
    bot += `<span class="bo-p${under ? " on" : ""}${cl.has(i) ? " clash" : ""}">${under || (reveal ? reveal[i] : "·")}</span>`;
  }
  return `<div class="bo-strip"><div class="bo-row">${top}</div><div class="bo-row">${bot}</div></div>`;
}

export const CSS = () => `
.table.bombe{padding:0;overflow:hidden}
.bo-hut{position:relative;width:100%;height:100%;min-height:240px;background:radial-gradient(circle at 60% 0%,var(--h1),var(--h2) 75%);overflow:hidden}
.bo-bulb{position:absolute;inset:0;background:radial-gradient(circle at 55% 0%,rgba(255,226,150,.35),transparent 45%);animation:bo-flick 3s ease-in-out infinite;pointer-events:none}
.bo-scene{position:absolute;inset:0;width:100%;height:100%}
.bo-drum{transform-box:fill-box;transform-origin:center}
.bo-drum.spin{animation:bo-spin .35s linear infinite;animation-delay:var(--d)}
.bo-lamp{opacity:.25;animation:bo-lamp 2.4s ease-in-out infinite;animation-delay:var(--d)}
.bo-hut.stop .bo-stopbar,.bo-hut.won .bo-stopbar{animation:bo-glow 1s ease-in-out infinite}
.bo-hut.lost .bo-scene{filter:grayscale(.7) brightness(.8)}
.bo-cable{stroke-dasharray:6 3;animation:bo-cable 1.2s linear infinite}
.bo-label{position:absolute;left:4%;top:6%;max-width:40%;font:600 12px Georgia,serif;color:#f3e6c8;letter-spacing:.12em;text-transform:uppercase}
.bo-strip{overflow-x:auto;padding:8px;border-radius:8px;background:#efe2c2;color:#2a1b10;margin:6px 0}
.bo-row{display:flex;gap:2px;white-space:nowrap}
.bo-c,.bo-p{display:inline-block;min-width:18px;text-align:center;font:700 15px/1.5 monospace;border-radius:3px}
.bo-p{color:#8a7a5a}.bo-p.on{color:#1f4f8a;background:rgba(31,79,138,.12)}
.bo-c.clash,.bo-p.clash{background:#e8483b;color:#fff}
.bo-wheels{display:flex;flex-wrap:wrap;gap:6px}
@keyframes bo-spin{to{transform:rotate(360deg)}}
@keyframes bo-lamp{50%{opacity:1}}
@keyframes bo-glow{50%{opacity:.4}}
@keyframes bo-flick{50%{opacity:.8}}
@keyframes bo-cable{to{stroke-dashoffset:-9}}
@media (prefers-reduced-motion:reduce){.bo-hut *{animation:none!important}}
`;
