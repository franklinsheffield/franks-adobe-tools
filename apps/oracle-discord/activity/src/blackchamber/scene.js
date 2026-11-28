// Black Chamber drawing: the chamber (candle, the opened letter with its seal lifted by a hot knife, the rival and their
// clock) and the cryptogram board. HTML/SVG only, no rules. Look from shop.js: sheet, tiles, timer.
const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);
const A = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";

function timerSvg(id, frac) {
  const f = Math.max(0, Math.min(1, frac));
  if (id === "bc-watch") { const a = (1 - f) * 6.283; return `<svg class="bc-timer" viewBox="0 0 60 70" aria-hidden="true"><circle cx="30" cy="8" r="4" fill="none" stroke="#c9a24a" stroke-width="2"/><circle cx="30" cy="38" r="26" fill="#f3efe6" stroke="#c9a24a" stroke-width="4"/><path d="M30 38 L${30 + 20 * Math.sin(a)} ${38 - 20 * Math.cos(a)}" stroke="#2a1b10" stroke-width="2.5" stroke-linecap="round"/><circle cx="30" cy="38" r="2" fill="#2a1b10"/></svg>`; }
  if (id === "bc-chess") return `<svg class="bc-timer" viewBox="0 0 80 60" aria-hidden="true"><rect x="4" y="16" width="72" height="40" rx="4" fill="#5a3d22"/><circle cx="24" cy="36" r="14" fill="#f3efe6"/><circle cx="56" cy="36" r="14" fill="#f3efe6"/><path d="M24 36 L${24 + 11 * Math.sin((1 - f) * 6.283)} ${36 - 11 * Math.cos((1 - f) * 6.283)}" stroke="#a52a1e" stroke-width="2"/><path d="M56 36 L56 26" stroke="#2a1b10" stroke-width="2"/><rect x="16" y="10" width="16" height="6" rx="2" fill="#c9a24a"/></svg>`;
  const top = 26 * f, bot = 26 * (1 - f);
  return `<svg class="bc-timer" viewBox="0 0 50 80" aria-hidden="true"><path d="M8 4 H42 M8 76 H42" stroke="#8a6a3a" stroke-width="4"/><path d="M12 6 Q12 30 25 40 Q38 30 38 6Z M12 74 Q12 50 25 40 Q38 50 38 74Z" fill="rgba(255,255,255,.15)" stroke="#d9c49b"/><path d="M${25 - top * 0.45} ${40 - top} Q25 ${40 - top + 4} ${25 + top * 0.45} ${40 - top} L25 40Z" fill="#e9c46a"/><path d="M${25 - bot * 0.5} 74 Q25 ${74 - bot} ${25 + bot * 0.5} 74Z" fill="#e9c46a"/>${f > 0 && f < 1 ? `<path class="bc-sand" d="M25 40 V72" stroke="#e9c46a" stroke-width="1.2"/>` : ""}</svg>`;
}

/** The chamber. rival: { e, name, when }. frac: share of the rival's time left. state: "" | "won" | "lost". */
export function chamberHtml({ look, rival, frac = 1, state = "", label = "" }) {
  return `<div class="bc-room${state ? " " + state : ""}"><div class="bc-glow"></div>
    <svg class="bc-scene" viewBox="0 0 400 220" aria-hidden="true">
      <rect x="0" y="150" width="400" height="70" fill="#3a2414"/><rect x="0" y="146" width="400" height="6" fill="#5a3d22"/>
      <rect x="40" y="70" width="14" height="80" fill="#efe2c2"/><path class="bc-flame" d="M47 44 Q57 62 47 72 Q37 62 47 44Z" fill="#ffb347"/>
      <g class="bc-letter"><rect x="120" y="96" width="150" height="70" fill="#efe2c2" transform="rotate(-4 195 131)"/><path d="M120 100 L195 140 L270 92" fill="none" stroke="#bda57a" stroke-width="2" transform="rotate(-4 195 131)"/>
        <circle class="bc-wax" cx="196" cy="132" r="10" fill="#a52a1e"/></g>
      <path class="bc-knife" d="M280 160 L340 120 L346 126 L288 166Z" fill="#c0c6cc"/><rect x="336" y="108" width="26" height="9" rx="3" fill="#5a3d22" transform="rotate(-34 349 112)"/>
    </svg>
    <div class="bc-rival"><span>${rival.e}</span><b>${esc(rival.name)}</b><i>${esc(rival.when)}</i></div>
    ${timerSvg(look.timer, frac)}${label ? `<div class="bc-label">${esc(label)}</div>` : ""}</div>`;
}

/** The cryptogram board: each cipher letter with your guess above it. sel: selected cipher letter. */
export function boardHtml(d, sel, look) {
  const wrong = d.done ? new Set(Object.keys(d.guess).filter((c) => d.guess[c] !== A[d.key.indexOf(c)])) : new Set();
  const words = d.text.split(" ");
  return `<div class="bc-board t-${look.sheet} k-${look.tiles}">${words.map((w) => `<span class="bc-word">${[...w].map((c) => A.includes(c)
    ? `<button type="button" class="bc-cell${c === sel ? " sel" : ""}${d.given.includes(c) ? " given" : ""}${wrong.has(c) ? " bad" : ""}" data-c="${c}"><b>${d.guess[c] || "&nbsp;"}</b><i>${c}</i></button>`
    : `<span class="bc-punct">${esc(c)}</span>`).join("")}</span>`).join("")}</div>`;
}
/** Letter counts of the cryptogram beside English's commonest letters. */
export function countsHtml(n, ETAOIN) {
  const top = Object.entries(n).sort((a, b) => b[1] - a[1]).slice(0, 9);
  return `<div class="bc-counts"><span>Cipher: ${top.map(([c, k]) => `<b>${c}</b>${k}`).join(" ")}</span><span>English: ${[...ETAOIN.slice(0, 9)].map((c) => `<b>${c}</b>`).join(" ")}</span></div>`;
}
export const keysHtml = (used) => `<div class="bc-keys">${[...A].map((p) => `<button type="button" class="bc-key${used.includes(p) ? " used" : ""}" data-p="${p}">${p}</button>`).join("")}<button type="button" class="bc-key wide" data-p="">⌫</button></div>`;

export const CSS = () => `
.table.blackchamber{padding:0;overflow:hidden}
.bc-room{position:relative;width:100%;height:100%;min-height:240px;background:radial-gradient(circle at 15% 40%,#3a2414,#120a05 70%);overflow:hidden}
.bc-glow{position:absolute;inset:0;background:radial-gradient(circle at 12% 30%,rgba(255,179,71,.35),transparent 45%);animation:bc-gl 2s ease-in-out infinite}
.bc-scene{position:absolute;inset:0;width:100%;height:100%}
.bc-flame{transform-origin:47px 72px;animation:bc-fl 1.5s ease-in-out infinite}
.bc-knife{animation:bc-knife 4s ease-in-out infinite;transform-origin:340px 120px}
.bc-room.won .bc-wax{animation:bc-lift .8s ease-out forwards}
.bc-room.lost .bc-letter{opacity:.55;filter:grayscale(.6)}
.bc-rival{position:absolute;right:4%;top:6%;display:flex;flex-direction:column;align-items:center;background:rgba(0,0,0,.45);border:1px solid rgba(232,72,59,.5);border-radius:10px;padding:6px 10px;color:#f3e6c8;font:12px Georgia,serif}
.bc-rival span{font-size:28px}.bc-rival i{opacity:.7}
.bc-timer{position:absolute;right:6%;bottom:8%;width:12%;max-width:70px}
.bc-sand{stroke-dasharray:2 3;animation:bc-sand .4s linear infinite}
.bc-label{position:absolute;left:4%;top:6%;text-align:left;max-width:55%;font:600 12px Georgia,serif;color:#f3e6c8;letter-spacing:.12em;text-transform:uppercase}
.bc-board{display:flex;flex-wrap:wrap;gap:10px 16px;justify-content:center;padding:10px;border-radius:10px;background:#2b2f2c;margin:6px 0}
.bc-board.t-bc-graph{background:#eef2ee linear-gradient(90deg,rgba(80,120,160,.25) 1px,transparent 1px) 0 0/14px 14px,linear-gradient(rgba(80,120,160,.25) 1px,transparent 1px) 0 0/14px 14px}
.bc-board.t-bc-baize{background:#1f5a3a}
.bc-word{display:flex;gap:3px}
.bc-cell{display:flex;flex-direction:column;align-items:center;width:26px;padding:2px 0;border:0;border-radius:5px;background:#efe2c2;color:#2a1b10;cursor:pointer;font:inherit}
.k-bc-keys .bc-cell{border-radius:50%;width:28px;background:#1d1d1d;color:#f3efe6;box-shadow:inset 0 0 0 2px #c9a24a}
.k-bc-scrabble .bc-cell{background:#f1dcae;box-shadow:0 2px 0 #b08a4a;border-radius:3px}
.bc-cell b{font:700 16px/1.2 Georgia,serif;min-height:19px;color:#a52a1e}.k-bc-keys .bc-cell b{color:#ffd98a}
.bc-cell i{font:600 11px monospace;opacity:.75;font-style:normal}
.bc-cell.given b{color:#2f6a3a}.bc-cell.sel{outline:3px solid #ffd98a;transform:translateY(-2px)}.bc-cell.bad{outline:2px solid #e8483b}
.bc-punct{align-self:flex-end;color:#efe2c2}
.bc-keys{display:flex;flex-wrap:wrap;gap:4px;justify-content:center;margin:6px 0}
.bc-key{min-width:30px;padding:6px 0;border-radius:6px;border:1px solid rgba(255,255,255,.25);background:rgba(255,255,255,.06);color:inherit;font:600 14px monospace;cursor:pointer}
.bc-key.used{opacity:.4}.bc-key.wide{min-width:46px}
.bc-counts{display:flex;flex-direction:column;gap:2px;font:12px monospace;opacity:.9;text-align:center}.bc-counts b{color:#ffd98a;margin-left:6px}
.bc-tbar{display:flex;justify-content:space-between;align-items:center}.bc-tbar.low b{color:#e8483b}
@keyframes bc-gl{50%{opacity:.75}}@keyframes bc-fl{50%{transform:scaleY(1.12) skewX(3deg)}}
@keyframes bc-knife{50%{transform:translate(-6px,4px) rotate(-3deg)}}
@keyframes bc-lift{to{transform:translate(30px,-40px) rotate(40deg);opacity:0}}
@keyframes bc-sand{to{stroke-dashoffset:-5}}
@media (prefers-reduced-motion:reduce){.bc-room *{animation:none!important}}
`;
