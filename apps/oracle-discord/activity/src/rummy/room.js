// Constellation Rummy: a card room of the Oracle Chamber. Collect real stars into constellation sets (and, from Level 2,
// colour sets of one spectral class), playing against the Oracle. Laying a constellation down tells one of its myths
// (shared with Star Lore Navigator); every card carries a real fact. Rules in engine.js, deck in deck.js.
// Mounted via main.js ROOMS; sells card backs on the Essence store's "🌌 Star cards" shelf (store.js registerShelf). The table pane is drawn top-down on the equipped table cloth (table.js getTableDecor).
import { CARD, CONS, CLASSES, FIGURE } from "./deck.js";
import { GUIDE } from "./guide.js";
import { LEVELS, newGame, levelOf, top, setType, fits, draw, layDown, layOff, discard, tally, oracleTurn, settle, pts, room as rummyOf,
  winsOf, titleOf, nextTitle, KIND, BACKS, backOf } from "./engine.js";
import { project, centroid } from "../stars/engine.js";
import { getTableDecor } from "../table.js";
import { shuffleSfx, dealSfx, flickSfx, takeSfx, discardSfx, meldSfx, layoffSfx, badSfx, oracleSfx, winSfx, loseSfx, dawnSfx } from "./sfx.js";

const esc = (s) => String(s ?? "").replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" }[c]));
const pick = (a) => a[Math.floor(Math.random() * a.length)];
const stars = (n) => "★".repeat(n);
const conLabel = (con) => `${CONS[con].emoji} ${CONS[con].name}`;
const setName = (m) => (m.type === "con" ? conLabel(m.key) : `${CLASSES[m.key].name} stars (class ${m.key})`);

// ---- drawing ----
/** Card colours by spectral class: [top of the card, bottom]. */
const BG = { B: ["#1d3f97", "#070b2c"], A: ["#34407a", "#080a24"], F: ["#6a5418", "#120c22"], K: ["#7a3a10", "#160a1e"], M: ["#7e1426", "#150616"] };
const f1 = (n) => n.toFixed(1);
/** Shared SVG defs (gradients and the card clip), put in the page once. */
function defsOnce() {
  if (document.getElementById("cr-defs")) return;
  const grads = Object.entries(BG).map(([k, [a, b]]) => `<linearGradient id="cr-bg-${k}" x1="0" y1="0" x2=".3" y2="1"><stop offset="0" stop-color="${a}"/><stop offset=".62" stop-color="${b}"/></linearGradient>
    <radialGradient id="cr-gl-${k}"><stop offset="0" stop-color="#fff"/><stop offset=".22" stop-color="${CLASSES[k].colour}"/><stop offset="1" stop-color="${CLASSES[k].colour}" stop-opacity="0"/></radialGradient>`).join("");
  document.body.insertAdjacentHTML("beforeend", `<svg id="cr-defs" width="0" height="0" style="position:absolute" aria-hidden="true"><defs>${grads}
    <linearGradient id="cr-ban" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#05040f" stop-opacity="0"/><stop offset=".35" stop-color="#05040f" stop-opacity=".85"/><stop offset="1" stop-color="#05040f"/></linearGradient>
    <clipPath id="cr-clip"><rect width="70" height="96" rx="7"/></clipPath></defs></svg>`);
}
/** Each constellation's stick figure fitted to the card's art window (x 8..62, y 12..60). Cached. */
const FIG = {};
function fig(con) {
  if (FIG[con]) return FIG[con];
  const lines = FIGURE(con), all = lines.flat(), [ra0, de0] = centroid(all), P = all.map(([r, d]) => project(r, d, ra0, de0));
  const xs = P.map((p) => p.x), ys = P.map((p) => p.y), w = Math.max(...xs) - Math.min(...xs) || 1, h = Math.max(...ys) - Math.min(...ys) || 1, s = Math.min(54 / w, 46 / h);
  const cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const xy = (r, d) => { const p = project(r, d, ra0, de0); return [35 + (p.x - cx) * s, 36 - (p.y - cy) * s]; };
  const path = lines.map((l) => l.map(([r, d], i) => { const [x, y] = xy(r, d); return (i ? "L" : "M") + f1(x) + " " + f1(y); }).join("")).join("");
  const nodes = [...new Set(all.map((p) => p.join(",")))].map((k) => xy(...k.split(",").map(Number)));
  return (FIG[con] = { path, nodes, xy });
}
const spark = (x, y, r) => `<path d="M${f1(x)} ${f1(y - r)}L${f1(x + r * .16)} ${f1(y - r * .16)}L${f1(x + r)} ${f1(y)}L${f1(x + r * .16)} ${f1(y + r * .16)}L${f1(x)} ${f1(y + r)}L${f1(x - r * .16)} ${f1(y + r * .16)}L${f1(x - r)} ${f1(y)}L${f1(x - r * .16)} ${f1(y - r * .16)}Z" fill="#fff"/>`;
/** The card's art: class-coloured sky, its constellation drawn with this star blazing, a name banner. hidden = Level 3 (no constellation shown). */
function art(hip, hidden) {
  const c = CARD[hip], p = pts(hip), k = c.cls;
  let seed = hip; const rnd = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  const dust = Array.from({ length: 14 }, () => `<circle cx="${f1(4 + rnd() * 62)}" cy="${f1(4 + rnd() * 60)}" r="${f1(.25 + rnd() * .5)}" fill="#fff" opacity="${f1(.3 + rnd() * .5)}"/>`).join("");
  let sky;
  if (hidden) sky = `<circle cx="35" cy="36" r="24" fill="url(#cr-gl-${k})" opacity=".85"/><circle cx="35" cy="36" r="${3 + p}" fill="#fff"/>${spark(35, 36, 14 + p * 3)}
    <circle cx="35" cy="36" r="21" fill="none" stroke="#FADE8C" stroke-width=".5" stroke-dasharray="1.5 2.5" opacity=".6"/>`;
  else { const F = fig(c.con), [x, y] = F.xy(c.ra, c.de);
    sky = `<path d="${F.path}" fill="none" stroke="#FADE8C" stroke-width=".8" stroke-opacity=".55" stroke-linecap="round"/>${F.nodes.map(([a, b]) => `<circle cx="${f1(a)}" cy="${f1(b)}" r=".9" fill="#e8e6ff"/>`).join("")}
      <circle cx="${f1(x)}" cy="${f1(y)}" r="${11 + p * 2.5}" fill="url(#cr-gl-${k})"/><circle cx="${f1(x)}" cy="${f1(y)}" r="${1.6 + p * .6}" fill="#fff"/>${spark(x, y, 7 + p * 2.2)}`; }
  const n = c.name, fs = n.length <= 6 ? 9.5 : n.length <= 8 ? 8.2 : n.length <= 9 ? 7.2 : 6.4;
  const sub = hidden ? "✧ which sky?" : CONS[c.con].emoji + " " + CONS[c.con].name;
  return `<svg class="cr-art" viewBox="0 0 70 96" aria-hidden="true"><g clip-path="url(#cr-clip)"><rect width="70" height="96" fill="url(#cr-bg-${k})"/>${dust}<g class="cr-sky">${sky}</g>
    <rect y="60" width="70" height="36" fill="url(#cr-ban)"/></g>
    <circle cx="9.5" cy="9.5" r="6" fill="${CLASSES[k].colour}"/><text x="9.5" y="12.4" text-anchor="middle" font-size="8" font-weight="700" fill="#0a0820" font-family="Cinzel, Georgia, serif">${k}</text>
    <text x="64" y="11" text-anchor="end" font-size="7" fill="#FADE8C" letter-spacing="-.5">${"★".repeat(p)}</text>
    <text x="35" y="80" text-anchor="middle" font-size="${fs}" fill="#fff6dc" font-family="Cinzel, Georgia, serif" font-weight="700">${esc(n)}</text>
    <text x="35" y="89.5" text-anchor="middle" font-size="${CONS[c.con].name.length > 11 && !hidden ? 4.8 : 5.4}" fill="#cfc8ff">${esc(sub)}</text>
    <rect x=".6" y=".6" width="68.8" height="94.8" rx="6.6" fill="none" stroke="${CLASSES[k].colour}" stroke-width="1.2"/><rect x="3" y="3" width="64" height="90" rx="5" fill="none" stroke="#FADE8C" stroke-opacity=".25" stroke-width=".5"/></svg>`;
}
/** One card. o = { labels, sel, cls (extra classes), mini, i (deal order) } */
function face(hip, o = {}) {
  const c = CARD[hip], tag = o.mini ? "span" : "button";
  return `<${tag} ${tag === "button" ? `type="button" data-h="${hip}"` : ""} class="cr-card c-${c.cls}${o.mini ? " mini" : ""}${o.sel ? " sel" : ""}${o.cls ? " " + o.cls : ""}"
    style="--k:${CLASSES[c.cls].colour};--i:${o.i || 0}" aria-label="${esc(c.name)}, class ${c.cls}, magnitude ${c.mag}">${art(hip, o.labels === false)}</${tag}>`;
}
const back = (cls = "", style = "") => `<span class="cr-back ${cls}"${style ? ` style="${style}"` : ""}><i></i></span>`;
/** The table seen from above: the player's equipped cloth (colours from the Chamber's --cloth vars, its design and motion). */
function clothSvg() {
  const D = getTableDecor(), ink = D.ink || "#E2B04A";
  return `<svg class="cr-cloth" viewBox="0 0 400 300" preserveAspectRatio="xMidYMid slice" aria-hidden="true"><defs>
    <radialGradient id="cr-clothg" cx="50%" cy="50%" r="70%"><stop offset="0" style="stop-color:var(--cloth1,#5a2a8a)"/><stop offset=".6" style="stop-color:var(--cloth2,#36185e)"/><stop offset="1" style="stop-color:var(--cloth3,#170a2e)"/></radialGradient>
    <radialGradient id="cr-vign" cx="50%" cy="50%" r="72%"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".55"/></radialGradient></defs>
    <rect width="400" height="300" fill="url(#cr-clothg)"/>
    ${D.design ? `<g fill="none" stroke="${ink}" stroke-width="1.4" opacity=".5" transform="translate(200 150) scale(.92) translate(-200 -200)">${D.design}</g>`
      : `<g fill="none" stroke="${ink}" opacity=".45"><circle cx="200" cy="150" r="128" stroke-width="1.4"/><circle cx="200" cy="150" r="112" stroke-width=".8" stroke-dasharray="3 6"/><circle cx="200" cy="150" r="46" stroke-width=".8"/><path d="M60 150H340M200 14V286" stroke-width=".6"/></g>`}
    ${D.fx ? `<g class="cr-clothfx" transform="translate(200 150) scale(.92) translate(-200 -200)">${D.fx}</g>` : ""}
    <rect width="400" height="300" fill="url(#cr-vign)"/><rect x="6" y="6" width="388" height="288" rx="14" fill="none" stroke="${ink}" stroke-opacity=".7" stroke-width="2"/><rect x="12" y="12" width="376" height="276" rx="10" fill="none" stroke="${ink}" stroke-opacity=".35" stroke-dasharray="2 5"/></svg>`;
}
function tableHtml(g, o = {}) {
  const L = levelOf(g), t = top(g), b = "cr-b-" + (o.back || "cb-midnight"), n = g.hands.or.length;
  const opp = `<div class="cr-opp${o.thinking ? " think" : ""}"><div class="cr-ofan">${g.hands.or.map((_, i) => back(i >= n - (o.oracleGot || 0) ? "cr-new" : "", `--r:${f1((i - (n - 1) / 2) * 7)}deg;--y:${f1(Math.abs(i - (n - 1) / 2) * 1.6)}px`)).join("")}</div><span class="cr-cnt">Oracle · ${n}</span></div>`;
  const piles = `<div class="cr-piles"><button type="button" class="cr-pile" data-draw="deck" ${g.deck.length ? "" : "disabled"}>${g.deck.length ? `<span class="cr-stack">${back("", "--o:2")}${back("", "--o:1")}${back()}</span>` : `<span class="cr-empty">${g.nights < 2 ? "new night" : "dawn"}</span>`}<span class="cr-cnt">${g.deck.length} left${g.nights > 1 ? " · night 2" : ""}</span></button>
    <button type="button" class="cr-pile" data-draw="discard" ${t != null ? "" : "disabled"}>${t != null ? face(t, { mini: true, labels: L.labels, cls: o.flip ? "cr-flip" : "" }) : `<span class="cr-empty">discards</span>`}<span class="cr-cnt">discards</span></button></div>`;
  const melds = g.melds.length ? g.melds.map((m) => `<div class="cr-meld ${m.owner === "me" ? "mine" : "theirs"}${m.id === o.fresh ? " fresh" : ""}${m.id === o.grew ? " grew" : ""}">
      <div class="cr-fan">${m.cards.map((c, i) => face(c.hip, { mini: true, labels: true, cls: (c.by === "me" ? "by-me" : "by-or") + (m.id === o.grew && i === m.cards.length - 1 ? " cr-new" : "") })).join("")}</div>
      <span class="cr-mh">${m.type === "con" ? CONS[m.key].emoji + " " + esc(CONS[m.key].name) : "🌈 Class " + m.key}${m.type === "con" && m.cards.length === 4 ? " ✓" : ""}</span></div>`).join("")
    : `<div class="cr-hint">Sets you and the Oracle lay down are dealt onto the cloth here.</div>`;
  return `<div class="cr-wrap ${b}">${clothSvg()}${opp}${piles}<div class="cr-melds">${melds}</div>${o.burst ? `<div class="cr-burst">${Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;--d:${(i % 3) * 0.06}s"></i>`).join("")}</div>` : ""}</div>`;
}

const CSS = `
.table.rummy{pointer-events:auto;background:#0b0618;overflow:hidden}
.cr-wrap{position:absolute;inset:0;display:grid;grid-template-rows:auto auto 1fr;gap:4px;padding:12px 12px 24px}
.cr-cloth{position:absolute;inset:0;width:100%;height:100%;z-index:0}.cr-wrap>*:not(.cr-cloth){position:relative;z-index:1}
.cr-clothfx *{transform-box:fill-box;transform-origin:center}
.cr-opp{display:flex;align-items:center;justify-content:center;gap:10px;min-height:40px}
.cr-ofan{display:flex;padding-left:12px}.cr-ofan .cr-back{width:26px;height:36px;margin-left:-12px;border-radius:4px;transform:translateY(var(--y,0)) rotate(var(--r,0));box-shadow:0 2px 4px rgba(0,0,0,.6)}
.cr-opp.think .cr-ofan{animation:cr-think .9s ease-in-out infinite}
@keyframes cr-think{50%{transform:translateY(-3px)}}
.cr-cnt{font-size:.66rem;color:var(--gold2,#FADE8C);letter-spacing:.06em;white-space:nowrap;text-shadow:0 1px 3px #000}
.cr-piles{display:flex;gap:14px;justify-content:center}
.cr-pile{background:none;border:0;padding:0;display:flex;flex-direction:column;align-items:center;gap:2px;cursor:pointer;color:inherit;font:inherit}
.cr-pile:disabled{cursor:default;opacity:.6}
.cr-stack{position:relative;display:block;width:50px;height:68px}.cr-stack .cr-back{position:absolute;left:calc(var(--o,0) * -2px);top:calc(var(--o,0) * 2px);width:50px;height:68px}
.cr-pile:not(:disabled):hover .cr-back,.cr-pile:not(:disabled):hover .cr-card{box-shadow:0 0 14px rgba(250,222,140,.7)}
.cr-empty{display:grid;place-items:center;width:50px;height:68px;border:1px dashed rgba(250,222,140,.5);border-radius:6px;font-size:.6rem;color:#e8dcb0}
.cr-melds{display:flex;flex-wrap:wrap;gap:8px 12px;align-content:flex-start;justify-content:center;overflow:auto;min-height:0;padding-top:4px}
.cr-meld{display:flex;flex-direction:column;align-items:center;gap:1px}
.cr-fan{display:flex;padding-left:24px}.cr-fan .cr-card.mini{width:38px;height:52px;margin-left:-24px;box-shadow:-2px 2px 5px rgba(0,0,0,.6)}
.cr-fan .cr-card.mini:nth-child(2){transform:rotate(3deg)}.cr-fan .cr-card.mini:nth-child(3){transform:rotate(6deg)}.cr-fan .cr-card.mini:nth-child(4){transform:rotate(9deg)}.cr-fan .cr-card.mini:nth-child(n+5){transform:rotate(12deg)}
.cr-meld.fresh .cr-fan{animation:cr-glow 1.6s ease-out}.cr-meld.grew .cr-fan{animation:cr-glow 1s ease-out}
@keyframes cr-glow{0%{filter:drop-shadow(0 0 0 rgba(250,222,140,0));transform:scale(.5) translateY(-30px);opacity:0}35%{filter:drop-shadow(0 0 12px rgba(250,222,140,.95));transform:scale(1.08);opacity:1}100%{filter:drop-shadow(0 0 0 rgba(250,222,140,0));transform:none}}
.cr-mh{font-size:.6rem;color:#fff3cf;white-space:nowrap;padding:0 6px;border-radius:8px;background:rgba(5,3,14,.7);text-shadow:0 1px 2px #000}
.cr-meld.mine .cr-mh{box-shadow:inset 0 0 0 1px rgba(250,222,140,.7)}.cr-meld.theirs .cr-mh{box-shadow:inset 0 0 0 1px rgba(255,90,180,.6)}
.cr-hint{font-size:.72rem;color:#fff3cf;text-align:center;padding:8px;text-shadow:0 1px 3px #000}
.cr-burst{position:absolute;left:50%;top:60%;pointer-events:none;z-index:2}.cr-burst i{position:absolute;width:6px;height:6px;border-radius:50%;background:#FADE8C;box-shadow:0 0 8px #FADE8C;animation:cr-burst 1s ease-out var(--d) both}
@keyframes cr-burst{from{transform:rotate(var(--a)) translateX(0);opacity:1}to{transform:rotate(var(--a)) translateX(90px);opacity:0}}
.cr-hand{display:flex;flex-wrap:wrap;gap:7px;margin:6px 0;justify-content:center}
.cr-card{position:relative;display:block;width:78px;height:107px;border:0;border-radius:8px;background:none;padding:0;cursor:grab;transition:transform .18s,box-shadow .18s,filter .18s;box-shadow:0 3px 8px rgba(0,0,0,.55);touch-action:none;user-select:none;-webkit-user-select:none}
.cr-art{display:block;width:100%;height:100%;pointer-events:none}
.cr-card:hover{box-shadow:0 0 12px var(--k)}
.cr-card.sel{transform:translateY(-12px);box-shadow:0 0 18px var(--k),0 0 0 2px #FADE8C}
.cr-card .cr-sky{animation:cr-tw 3.4s ease-in-out infinite;animation-delay:calc(var(--i) * -.5s)}@keyframes cr-tw{50%{opacity:.82}}
.cr-card.drag{z-index:5;cursor:grabbing;transition:none;box-shadow:0 12px 24px rgba(0,0,0,.6),0 0 16px var(--k)}
.cr-card.ins-l{box-shadow:-6px 0 0 -2px #FADE8C,0 3px 8px rgba(0,0,0,.55)}.cr-card.ins-r{box-shadow:6px 0 0 -2px #FADE8C,0 3px 8px rgba(0,0,0,.55)}
.cr-card.mini{width:50px;height:68px;border-radius:5px;cursor:inherit;box-shadow:0 2px 5px rgba(0,0,0,.6)}
.cr-deal{animation:cr-deal .5s cubic-bezier(.2,1.2,.4,1) calc(var(--i) * .07s) both}@keyframes cr-deal{from{transform:translateY(-140px) rotate(-14deg) scale(.6);opacity:0}}
.cr-new{animation:cr-new .6s cubic-bezier(.2,1.3,.4,1) both}@keyframes cr-new{from{transform:rotateY(90deg) translateY(-30px);opacity:0}}
.cr-flip{animation:cr-flip .5s ease-out both}@keyframes cr-flip{from{transform:translateY(-24px) rotate(10deg);opacity:0}}
.cr-shake{animation:cr-shake .45s ease-in-out}@keyframes cr-shake{20%{transform:translateX(-7px)}40%{transform:translateX(6px)}60%{transform:translateX(-4px)}80%{transform:translateX(2px)}}
.cr-info{font-size:.84rem;margin:4px 0;padding:6px 9px;border:1px solid var(--line,#3a2f6a);border-radius:9px;background:rgba(22,16,48,.6)}
.cr-info b{color:var(--gold2,#FADE8C)}
.cr-score{display:grid;grid-template-columns:auto 1fr 1fr;gap:2px 12px;font-size:.84rem;margin:6px 0}.cr-score b{color:var(--gold2,#FADE8C)}
.c[disabled]{opacity:.45;cursor:default}
/* card backs (store shelf) */
.cr-back{position:relative;display:inline-block;width:44px;height:60px;border-radius:6px;overflow:hidden;border:1.5px solid #c9a24a;background:radial-gradient(circle at 50% 45%,#24307a,#0b1040);box-shadow:0 2px 6px rgba(0,0,0,.5)}
.cr-back i{position:absolute;inset:3px;border:1px solid rgba(250,222,140,.45);border-radius:4px}
.cr-back::after{content:"✷";position:absolute;inset:0;display:grid;place-items:center;color:#FADE8C;font-size:1.2em;text-shadow:0 0 6px #FADE8C}
.cr-b-cb-astrolabe .cr-back{background:repeating-radial-gradient(circle at 50% 50%,#b8862f 0 2px,#6a4510 2px 5px,#d8a84a 5px 6px,#5a3a0c 6px 9px);border-color:#e6c06a}
.cr-b-cb-astrolabe .cr-back::after{content:"";inset:12%;border-radius:50%;background:conic-gradient(from 0deg,transparent 0 40deg,#fbe3a0 40deg 44deg,transparent 44deg 160deg,#fbe3a0 160deg 164deg,transparent 164deg 280deg,#fbe3a0 280deg 284deg,transparent 0);animation:cr-spin 9s linear infinite}
.cr-b-cb-zodiac .cr-back{background:conic-gradient(#3b1f6e 0 30deg,#21134a 30deg 60deg,#3b1f6e 60deg 90deg,#21134a 90deg 120deg,#3b1f6e 120deg 150deg,#21134a 150deg 180deg,#3b1f6e 180deg 210deg,#21134a 210deg 240deg,#3b1f6e 240deg 270deg,#21134a 270deg 300deg,#3b1f6e 300deg 330deg,#21134a 330deg);border-color:#d8b0ff}
.cr-b-cb-zodiac .cr-back::after{content:"☉";color:#ffd56a}.cr-b-cb-zodiac .cr-back i{border-radius:50%;inset:14%;border:1.5px dotted #d8b0ff;animation:cr-spin 14s linear infinite}
.cr-b-cb-nebula .cr-back{background:radial-gradient(circle at 30% 40%,#ff5fa8 0,transparent 40%),radial-gradient(circle at 70% 65%,#3fd0e0 0,transparent 45%),radial-gradient(circle at 50% 50%,#2a1260,#060418);background-size:180% 180%;animation:cr-drift 8s ease-in-out infinite alternate;border-color:#ff9ad0}
.cr-b-cb-nebula .cr-back::after{content:"✦";color:#fff;font-size:.9em}
.cr-b-cb-aurora .cr-back{background:linear-gradient(170deg,transparent 30%,rgba(80,255,170,.75) 45%,transparent 60%),linear-gradient(190deg,transparent 40%,rgba(120,120,255,.5) 55%,transparent 70%),#041226;background-size:100% 220%;animation:cr-wave 5s ease-in-out infinite alternate;border-color:#7dffc0}
.cr-b-cb-aurora .cr-back::after{content:"";}
.cr-b-cb-atlas .cr-back{background:radial-gradient(circle at 50% 50%,#f1e1b6,#c9a66a);border-color:#6a4318}
.cr-b-cb-atlas .cr-back i{border-color:#7a4f22;border-style:dashed}.cr-b-cb-atlas .cr-back::after{content:"✶";color:#5a1a0a;text-shadow:none}
.cr-b-cb-pulsar .cr-back{background:#03030c;border-color:#8fc8ff}
.cr-b-cb-pulsar .cr-back::before{content:"";position:absolute;inset:-40%;background:conic-gradient(from 0deg,transparent 0 80deg,rgba(150,210,255,.85) 88deg,transparent 96deg 260deg,rgba(150,210,255,.85) 268deg,transparent 276deg);animation:cr-spin 1.6s linear infinite}
.cr-b-cb-pulsar .cr-back::after{content:"●";color:#e6f4ff;font-size:.7em;animation:cr-pulse 1.6s ease-in-out infinite}
@keyframes cr-spin{to{transform:rotate(360deg)}}@keyframes cr-drift{to{background-position:100% 100%}}@keyframes cr-wave{to{background-position:0 100%}}@keyframes cr-pulse{50%{opacity:.3}}
.cr-shelf{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:10px}.cr-shelf .cr-back{width:66px;height:92px}.cr-shelf .cr-back:nth-child(1){transform:rotate(-10deg)}.cr-shelf .cr-back:nth-child(3){transform:rotate(10deg)}
@media (prefers-reduced-motion: reduce){.cr-deal,.cr-new,.cr-flip,.cr-shake,.cr-meld .cr-fan,.cr-burst,.cr-card .cr-sky,.cr-opp.think .cr-ofan,.cr-back,.cr-back::before,.cr-back::after,.cr-back i,.cr-clothfx *{animation:none}.cr-burst{display:none}}
@media (max-width:560px){.cr-card{width:62px;height:85px}.cr-hand{gap:5px}}
@media (min-width:900px){.cr-fan{padding-left:28px}.cr-fan .cr-card.mini{width:48px;height:66px;margin-left:-28px}.cr-melds{gap:10px 18px}}
`;
function styleOnce() { defsOnce(); if (document.getElementById("cr-style")) return; const st = document.createElement("style"); st.id = "cr-style"; st.textContent = CSS; document.head.append(st); }

export function guideHtml() {
  return `<div class="dec-guide cr-guide"><h3>📖 ${esc(GUIDE.title)}</h3>${GUIDE.sections.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(s.h)}</summary>${s.p.map((t) => `<p>${t}</p>`).join("")}</details>`).join("")}</div>`;
}

// ---- the store shelf ----
export const shop = {
  kind: KIND, label: "🌌 Star cards", items: BACKS,
  talk: {
    open: ["Card backs for Constellation Rummy. The stars are on the front; the style is on the back.", "Deal in style, darling. Even the heavens judge a deck by its cover."],
    tryon: ["The {item}. Shuffle it and see.", "Ooh, {item}. The Oracle may cheat less against such a pretty deck."],
    buy: ["{item}: yours. Every deal at the rummy table uses it now.", "Sold! {item}. May your sets be bright."],
  },
  preview(id, ctx) { styleOnce(); const t = ctx.tableEl; t.className = "table rummy"; t.innerHTML = `<div class="cr-shelf cr-b-${id}">${back()}${back()}${back()}</div>`; if (ctx.cap) ctx.cap("🃏 " + (BACKS.find((x) => x.id === id) || {}).name); },
};

export const rummy = {
  id: "rummy", row: "cards", label: "Constellation Rummy", emoji: "🃏", blurb: "Collect real stars into constellation sets against the Oracle and learn their myths", shop,
  open(ctx) {
    const { $, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl, reduced } = ctx;
    styleOnce();
    const prog = () => rummyOf(state.prog), backId = () => backOf(state.prog);
    let g = null, sel = [], busy = false, tell = 0;
    const guideBtn = `<button class="c" type="button" id="cr-guide">📖 Study guide</button>`;
    const wireGuide = () => { const b = $("cr-guide"); if (!b) return; b.onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".cr-guide"); rb.innerHTML = on ? guideHtml() : "";
      b.textContent = on ? "📖 Close study guide" : "📖 Study guide"; if (on) rb.querySelector(".cr-guide").scrollIntoView({ behavior: "smooth", block: "start" }); }; };
    const paint = (o = {}) => { tableEl.className = "table rummy"; tableEl.innerHTML = tableHtml(g, { back: backId(), ...o });
      tableEl.querySelectorAll("[data-draw]").forEach((b) => (b.onclick = () => myDraw(b.dataset.draw))); };
    const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 150) : ms));

    function lobby(first) {
      g = null; clearReading(); cap("🃏 Constellation Rummy");
      tableEl.className = "table rummy"; tableEl.innerHTML = `<div class="cr-shelf cr-b-${backId()}">${back()}${face(37826, { mini: true })}${back()}</div>`;
      const w = winsOf(state.prog), t = titleOf(w), nx = nextTitle(w);
      say(first && !prog().plays
        ? `Pull up a chair, ${state.name}. This deck holds 48 real stars. Collect three or four from the same constellation and lay them down as a set. Each turn: draw one, lay down what you can, discard one. Empty your hand first and the night is yours. Brighter stars score more.`
        : pick([`The cards are cold and the stars are out, ${state.name}. Fancy a hand?`, `Back for another game, ${state.name}? I've been practising my shuffle.`, `The table is set, ${state.name}. Choose your sky.`]));
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"⭐".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${L.hand} cards · points ×${L.mult}${prog().wins[L.n] ? ` · ${prog().wins[L.n]} won` : ""}${prog().best[L.n] != null ? ` · best ${prog().best[L.n]}` : ""}</span></button>`;
      ui(`<div class="cx-top"><b>🃏 ${esc(t.name)}</b> · ${w} win${w === 1 ? "" : "s"}${nx ? ` · ${nx.at - w} more to ${esc(nx.name)}` : ""} · ${Object.keys(prog().cons).length} / 12 constellations played</div>
        <div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="choices">${guideBtn}<button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => deal(LEVELS[+b.dataset.l - 1])));
      $("back").onclick = greet; wireGuide();
    }

    async function deal(L) {
      g = newGame(L); sel = []; busy = true; tell = prog().plays || 0; clearReading(); cap(`🃏 Level ${L.n} · ${L.name}`);
      shuffleSfx(); paint(); hand({ deal: true }); await wait(700); dealSfx(L.hand);
      say(pick(["The cards are dealt. Your move.", "I shuffled the heavens. You go first.", "Stars in hand. Draw a card to begin."]) + (L.labels ? "" : " On this level the cards don't say where each star lives. A wrong set costs a point."));
      busy = false; hand();
    }

    /** Your hand and the buttons for this phase. */
    function hand(o = {}) {
      const L = levelOf(g), mine = g.turn === "me" && !g.over && !busy, t = top(g);
      const cards = g.hands.me.map((h, i) => face(h, { labels: L.labels, sel: sel.includes(h), i, cls: o.deal ? "cr-deal" : o.fresh === h ? "cr-new" : "" })).join("");
      let acts = "";
      if (mine && g.phase === "draw") acts = `<button class="c main" type="button" id="cr-deck" ${g.deck.length || g.nights < 2 ? "" : "disabled"}>🂠 Draw from the deck</button>${t != null ? `<button class="c" type="button" id="cr-top">⤴ Take ${esc(CARD[t].name)}</button>` : ""}`;
      else if (mine) {
        const set = sel.length >= 3 && (L.labels ? setType(g, sel) : true), one = sel.length === 1;
        acts = `<button class="c main" type="button" id="cr-set" ${set ? "" : "disabled"}>✦ Lay down set</button><button class="c" type="button" id="cr-add" ${one && g.melds.length ? "" : "disabled"}>➕ Add to a set</button>
          <button class="c" type="button" id="cr-dis" ${one && (sel[0] !== g.took || g.hands.me.length === 1) ? "" : "disabled"}>⤵ Discard${one ? " " + esc(CARD[sel[0]].name) : ""}</button>`;
      }
      const tip = !mine ? (g.over ? "" : "The Oracle is playing…") : g.phase === "draw" ? "Draw a card: from the deck, or take the top discard. Drag cards to rearrange your hand." :
        sel.length === 0 ? "Tap cards to pick them, drag to rearrange. 3 or 4 of one constellation make a set" + (L.colour ? "; so do 3+ of one colour class from different constellations." : ".") + " Then discard one to end your turn." :
        sel.length === 1 ? "One card: add it to a set on the table, or discard it." : sel.length === 2 ? "Pick at least 3 cards for a set." : (L.labels && !setType(g, sel) ? "These don't make a set yet." : "Lay them down!");
      ui(`<div class="cr-hand${o.shake ? " cr-shake" : ""}">${cards}</div><div class="choices">${acts}${g.over ? "" : `<button class="c small" type="button" id="cr-sort">⇅ Sort</button>`}${guideBtn}<button class="c small" type="button" id="cr-leave">↩ Leave game</button></div><div class="note">${esc(tip)}</div>`);
      wireHand();
      if ($("cr-sort")) $("cr-sort").onclick = () => { const order = Object.keys(CONS); flickSfx();
        g.hands.me.sort((a, b) => L.labels ? order.indexOf(CARD[a].con) - order.indexOf(CARD[b].con) || CARD[a].mag - CARD[b].mag : "BAFKM".indexOf(CARD[a].cls) - "BAFKM".indexOf(CARD[b].cls) || CARD[a].mag - CARD[b].mag); hand(); };
      if ($("cr-deck")) $("cr-deck").onclick = () => myDraw("deck");
      if ($("cr-top")) $("cr-top").onclick = () => myDraw("discard");
      if ($("cr-set")) $("cr-set").onclick = mySet;
      if ($("cr-add")) $("cr-add").onclick = myAdd;
      if ($("cr-dis")) $("cr-dis").onclick = myDiscard;
      $("cr-leave").onclick = () => lobby(false); wireGuide();
    }
    const toggle = (h) => { if (busy || g.over) return; flickSfx(); sel = sel.includes(h) ? sel.filter((x) => x !== h) : [...sel, h]; info(h); hand(); };
    /** Tap a card to pick it; drag it (mouse or finger) to move it in your hand. */
    function wireHand() {
      const box = $("ui").querySelector(".cr-hand"); if (!box) return;
      box.querySelectorAll("[data-h]").forEach((b) => {
        const h = +b.dataset.h;
        b.onclick = (e) => { if (e.detail === 0) toggle(h); }; // keyboard (Enter/Space); pointer taps are handled below
        b.onpointerdown = (e) => {
          if (e.button > 0 || g.over) return;
          const sx = e.clientX, sy = e.clientY; let drag = false, target = null, after = false;
          try { b.setPointerCapture(e.pointerId); } catch {}
          const others = [...box.querySelectorAll("[data-h]")].filter((x) => x !== b);
          b.onpointermove = (ev) => {
            const dx = ev.clientX - sx, dy = ev.clientY - sy;
            if (!drag && Math.hypot(dx, dy) > 8) { drag = true; b.classList.add("drag"); }
            if (!drag) return;
            b.style.transform = `translate(${dx}px,${dy}px) rotate(${Math.max(-12, Math.min(12, dx / 18))}deg) scale(1.06)`;
            let best = null, bd = Infinity;
            for (const o of others) { const r = o.getBoundingClientRect(), d = Math.hypot(ev.clientX - (r.left + r.width / 2), (ev.clientY - (r.top + r.height / 2)) * 1.5); if (d < bd) { bd = d; best = o; } }
            others.forEach((o) => o.classList.remove("ins-l", "ins-r"));
            if (best) { const r = best.getBoundingClientRect(); after = ev.clientX > r.left + r.width / 2; target = best; best.classList.add(after ? "ins-r" : "ins-l"); }
          };
          const done = (ev, cancel) => {
            b.onpointermove = b.onpointerup = b.onpointercancel = null;
            if (!drag) { if (!cancel) toggle(h); return; }
            if (!cancel && target) { const arr = g.hands.me, t = +target.dataset.h; arr.splice(arr.indexOf(h), 1); arr.splice(arr.indexOf(t) + (after ? 1 : 0), 0, h); takeSfx(); }
            hand();
          };
          b.onpointerup = (ev) => done(ev, false); b.onpointercancel = (ev) => done(ev, true);
        };
      });
    }
    /** The card's real facts, under the hand. On Level 3 the fact would give away the constellation, so only once it's on the table. */
    function info(h) {
      const c = CARD[h], L = levelOf(g), k = CLASSES[c.cls], hidden = !L.labels;
      $("reading-body").innerHTML = `<div class="cr-info"><b>${esc(c.name)}</b>${hidden ? "" : ` · ${esc(conLabel(c.con))}`} · class ${c.cls} (${k.name.toLowerCase()}, ${k.temp}) · magnitude ${c.mag} · ${stars(pts(h))}<br>${hidden ? "Lay it in a set to learn its story." : esc(c.fact)}</div>`;
    }

    function myDraw(from) {
      if (!g || busy || g.over || g.turn !== "me" || g.phase !== "draw") return;
      const before = g.nights, h = draw(g, "me", from);
      if (h == null) { if (g.over) return end(); return; }
      if (g.nights > before) { dawnSfx(); say("The deck is empty. A new night falls: the discards are shuffled into a fresh deck."); }
      else say(from === "discard" ? `You take ${CARD[h].name}. ${pick(["Bold.", "Interesting choice.", "I saw that."])}` : pick(["You draw from the deck.", "A new star for your hand.", "The deck gives you a card."]));
      from === "discard" ? takeSfx() : flickSfx(); sel = []; info(h); paint(); hand({ fresh: h });
    }
    function lore(m) {
      if (m.type === "col") return `A colour set! ${CLASSES[m.key].fact}`;
      const c = CONS[m.key], x = c.lore[tell++ % c.lore.length];
      return `${c.emoji} ${c.name}! ${x.c}, "${x.title}": ${x.t}`;
    }
    function mySet() {
      if (busy || sel.length < 3) return;
      const m = layDown(g, "me", sel);
      if (!m) { badSfx(); say(levelOf(g).labels ? "Those stars don't make a set." : `The stars disagree. That's not a set. One point lost (${g.misses} so far).`); hand({ shake: true }); return; }
      meldSfx(m.cards.length, Math.max(...m.cards.map((c) => pts(c.hip)))); sel = []; say(lore(m));
      $("reading-body").innerHTML = `<div class="cr-info">${m.cards.map((c) => `<b>${esc(CARD[c.hip].name)}</b>: ${esc(CARD[c.hip].fact)}`).join("<br>")}</div>`;
      paint({ fresh: m.id, burst: true }); if (g.over) return end(); hand();
    }
    function myAdd() {
      if (busy || sel.length !== 1) return;
      const h = sel[0], target = g.melds.find((m) => m.type === "con" && fits(g, h, m)) || g.melds.find((m) => fits(g, h, m));
      const m = layOff(g, "me", h, target ? target.id : -1);
      if (!m) { badSfx(); say(levelOf(g).labels ? `${CARD[h].name} doesn't fit any set on the table.` : `${CARD[h].name} doesn't belong to any set there. One point lost.`); hand({ shake: true }); return; }
      layoffSfx(); sel = [];
      const done = m.type === "con" && m.cards.length === 4;
      say(done ? `${CARD[h].name} completes ${CONS[m.key].name}! ${CONS[m.key].science[0]}` : `${CARD[h].name} joins ${setName(m)}. ${CARD[h].fact}`);
      if (done) chime(1); paint({ grew: m.id, burst: done }); if (g.over) return end(); hand();
    }
    async function myDiscard() {
      if (busy || sel.length !== 1) return;
      const h = sel[0]; if (!discard(g, "me", h)) { badSfx(); say("You can't throw back the card you just took. Pick another."); return; }
      discardSfx(); sel = []; $("reading-body").innerHTML = ""; paint({ flip: true });
      if (g.over) return end();
      busy = true; hand(); await oracle();
    }

    async function oracle() {
      oracleSfx(); paint({ thinking: true }); await wait(700);
      const before = g.nights;
      for (const step of oracleTurn(g)) {
        if (step.t === "draw") { if (g.nights > before) { dawnSfx(); say("The deck ran dry. A new night falls and the discards become the deck."); await wait(900); }
          say(step.from === "discard" ? `The Oracle takes ${CARD[step.hip].name} from the discards.` : step.hip != null ? "The Oracle draws from the deck." : "The deck is empty.");
          step.from === "discard" ? takeSfx() : flickSfx(); paint({ thinking: true, oracleGot: 1 }); }
        else if (step.t === "meld") { meldSfx(step.meld.cards.length, 1); say(`The Oracle lays down ${setName(step.meld)}: ${step.meld.cards.map((c) => CARD[c.hip].name).join(", ")}.`); paint({ fresh: step.meld.id, thinking: true }); }
        else if (step.t === "layoff") { layoffSfx(); say(`The Oracle adds ${CARD[step.hip].name} to ${setName(step.meld)}.`); paint({ grew: step.meld.id, thinking: true }); }
        else if (step.t === "discard") { discardSfx(); say(`The Oracle discards ${CARD[step.hip].name}. ${pick(["Your turn.", "Over to you.", "Your move, stargazer."])}`); paint({ flip: true }); }
        await wait(step.t === "meld" ? 1500 : 950);
        if (g.over) break;
      }
      busy = false;
      if (g.over) return end();
      hand();
    }

    function end() {
      busy = true;
      if (!g.result) { const before = winsOf(state.prog), r = settle(state.prog, g), aw = award(r.xp, r.essence); saveProgress(); showStats();
        ctx.trophy?.("rummy", g.level, { won: r.win, perfect: r.win && g.out === "me" }); // Trophy Case (trophies.js)
        const t = titleOf(winsOf(state.prog)); g.result = { r, aw, t, titled: titleOf(before).name !== t.name }; }
      results(true);
    }
    function results(fresh) {
      const L = levelOf(g), { r, aw, t, titled } = g.result, s = r.score; paint();
      const how = g.out === "me" ? "You went out!" : g.out === "or" ? "The Oracle went out." : "Dawn breaks and the stars fade. Game over.";
      if (fresh) (r.win ? winSfx : r.tie ? dawnSfx : loseSfx)();
      if (fresh) say(`${how} ${r.win ? pick(["You win. The heavens applaud.", "Victory! I shall consult my cards about this.", "You beat me fair and square. Mostly fair."]) : r.tie ? "A tie. The stars can't decide." : pick(["I win this time. The stars favoured me.", "My game. Want a rematch?", "Ha! The Oracle foresaw this."])}`);
      const row = (k, a, b) => `<span>${k}</span><span>${a}</span><span>${b}</span>`;
      const played = [...new Set(g.melds.filter((m) => m.type === "con").map((m) => m.key))];
      ui(`<div class="cr-score">${row("", "<b>You</b>", "<b>Oracle</b>")}${row("Stars laid down", "+" + s.me.melded, "+" + s.or.melded)}${row("Left in hand", "−" + s.me.hand, "−" + s.or.hand)}${row("Went out", s.me.bonus ? "+5" : "", s.or.bonus ? "+5" : "")}${s.me.miss ? row("Wrong sets", "−" + s.me.miss, "") : ""}${row("<b>Total</b>", `<b>${s.me.total}</b>`, `<b>${s.or.total}</b>`)}</div>
        <div class="reward"><div><b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>${r.firstWin ? " · first win at this level" : ""}${r.best ? " · new best" : ""}${r.newFull.length ? ` · completed ${r.newFull.map((c) => CONS[c].name).join(", ")}` : ""}</div>
        ${titled ? `<div class="up">🃏 Card title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>
        <div class="choices"><button class="c main" type="button" id="cr-again">🃏 Deal again</button>${played.length ? `<button class="c" type="button" id="cr-myths">📜 Hear the myths (${played.length})</button>` : ""}<button class="c" type="button" id="cr-lobby">Choose a level</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (fresh && (titled || aw.rankUp)) chime(2);
      $("cr-again").onclick = () => deal(L); $("cr-lobby").onclick = () => lobby(false); $("back").onclick = greet;
      if ($("cr-myths")) $("cr-myths").onclick = () => { const pages = played.flatMap((c) => [`${CONS[c].emoji} ${CONS[c].name}.`, ...CONS[c].lore.slice(0, 2).flatMap((x) => [`${x.c}: ${x.title}.`, ...x.parts]), CONS[c].science[0]]);
        talkThrough(pages, () => { say("Those are the stories of tonight's sky."); results(false); }); };
    }

    lobby(true);
  },
};

/** For the Codex page: constellations played and completed. */
export function rummyCodex(p, e = esc) {
  const r = rummyOf(p), all = Object.values(CONS), got = all.filter((c) => r.cons[c.con]);
  return `<div class="cx"><div class="cx-h"><span>🃏 Constellation Rummy: sets laid down</span><span class="note">${got.length} / ${all.length} · ${winsOf(p)} wins</span></div>
    <div class="bar"><i style="width:${(got.length / all.length) * 100}%"></i></div>${got.length ? `<div class="chips">${got.map((c) => `<span>${c.emoji} ${e(c.name)}${r.full[c.con] ? " ✓" : ""}</span>`).join("")}</div>` : ""}</div>`;
}
