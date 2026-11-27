// Constellation Rummy: a card room of the Oracle Chamber. Collect real stars into constellation sets (and, from Level 2,
// colour sets of one spectral class), playing against the Oracle. Laying a constellation down tells one of its myths
// (shared with Star Lore Navigator); every card carries a real fact. Rules in engine.js, deck in deck.js.
// Play alone against one of four Oracles (each with its own style, lines and first-win prize), take the Daily deal (same
// shuffle for everyone, shared board via ../daily.js), or play together: everyone in the Discord call at one table
// (../net.js; the host's screen runs the game). The game ends on a night sky of the constellations laid down.
// Mounted via main.js ROOMS; card backs come from the Essence store's shared Cards shelf (cardbacks.js). The table pane is drawn top-down on the equipped table cloth (table.js getTableDecor).
import { CARD, CONS, CLASSES, FIGURE } from "./deck.js";
import { GUIDE } from "./guide.js";
import { LEVELS, newGame, levelOf, top, setType, fits, draw, layDown, layOff, discard, tally, oracleTurn, settle, pts, room as rummyOf,
  winsOf, titleOf, nextTitle, backOf, PERSONAS, freeze, thaw } from "./engine.js";
import { joinTable, canJoin } from "../net.js";
import { dailySeed, dailyState, finishDaily, postDaily, boardOf, boardHtml, dayNumber } from "../daily.js";
import { cardBackSvg, CARD_BACK } from "../cardbacks.js";
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
let UNI = ""; // the card back equipped on the store's Cards shelf ("" = this deck's own midnight star)
const back = (cls = "", style = "") => (UNI ? `<span class="cr-back cr-uni ${cls}"${style ? ` style="${style}"` : ""}>${cardBackSvg(UNI)}</span>` : `<span class="cr-back ${cls}"${style ? ` style="${style}"` : ""}><i></i></span>`);
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
/** The table seen from above. o.me = your seat (null when watching), o.names = { seat: name }, o.got = { seat: cards just drawn },
 *  o.thinking = the seat now playing, o.fresh / o.grew = a meld that just landed, o.flip = the discard just thrown. */
function tableHtml(g, o = {}) {
  const L = levelOf(g), t = top(g), me = o.me ?? null, opps = g.seats.filter((s) => s !== me), many = opps.length > 1;
  const opp = `<div class="cr-opps${many ? " many" : ""}">${opps.map((s) => { const n = g.hands[s].length, got = (o.got && o.got[s]) || 0;
    return `<div class="cr-opp${o.thinking === s ? " think" : ""}${g.turn === s && !g.over ? " turn" : ""}"><div class="cr-ofan">${g.hands[s].map((_, i) => back(i >= n - got ? "cr-new" : "", `--r:${f1((i - (n - 1) / 2) * (many ? 5 : 7))}deg;--y:${f1(Math.abs(i - (n - 1) / 2) * 1.6)}px`)).join("")}</div><span class="cr-cnt">${esc((o.names && o.names[s]) || "Oracle")} · ${n}</span></div>`; }).join("")}</div>`;
  const deckN = g.deck.length;
  const piles = `<div class="cr-piles"><button type="button" class="cr-pile" data-draw="deck" ${deckN ? "" : "disabled"}>${deckN ? `<span class="cr-stack">${back("", "--o:2")}${back("", "--o:1")}${back()}</span>` : `<span class="cr-empty">${g.nights < 2 ? "new night" : "dawn"}</span>`}<span class="cr-cnt">${deckN} left${g.nights > 1 ? " · night 2" : ""}</span></button>
    <button type="button" class="cr-pile" data-draw="discard" data-drop="discard" ${t != null ? "" : "disabled"}>${t != null ? face(t, { mini: true, labels: L.labels, cls: o.flip ? "cr-flip" : "" }) : `<span class="cr-empty">discards</span>`}<span class="cr-cnt">discards</span></button></div>`;
  const melds = g.melds.length ? g.melds.map((m) => `<div class="cr-meld ${m.owner === me ? "mine" : "theirs"}${m.id === o.fresh ? " fresh" : ""}${m.id === o.grew ? " grew" : ""}" data-id="${m.id}">
      <div class="cr-fan">${m.cards.map((c, i) => face(c.hip, { mini: true, labels: true, cls: (c.by === me ? "by-me" : "by-or") + (m.id === o.grew && i === m.cards.length - 1 ? " cr-new" : "") })).join("")}</div>
      <span class="cr-mh">${m.type === "con" ? CONS[m.key].emoji + " " + esc(CONS[m.key].name) : "🌈 Class " + m.key}${m.type === "con" && m.cards.length === 4 ? " ✓" : ""}</span></div>`).join("")
    : `<div class="cr-hint">Sets are laid down here. Drag cards from your hand onto the table, a set, or the discard pile.</div>`;
  const surface = o.surface === "cloth" ? clothSvg() : `<div class="cr-mat">${back()}<span class="cr-matshade"></span></div>`;
  return `<div class="cr-wrap cr-b-own">${surface}${opp}${piles}<div class="cr-melds">${melds}</div>${o.burst ? `<div class="cr-burst">${Array.from({ length: 12 }, (_, i) => `<i style="--a:${i * 30}deg;--d:${(i % 3) * 0.06}s"></i>`).join("")}</div>` : ""}</div>`;
}
/** The night sky at the end of a game: every constellation laid down tonight, its lines drawing themselves in, the stars
 *  from the sets blazing. Gold = yours. Tap one to hear its myth. */
function nightHtml(g, me) {
  const cons = [...new Set(g.melds.filter((m) => m.type === "con").map((m) => m.key))];
  if (!cons.length) return `<div class="cr-night"><div class="cr-hint">No constellations were laid down tonight. The sky stays dark.</div></div>`;
  const tiles = cons.map((con, k) => {
    const F = fig(con), cards = g.melds.filter((m) => m.type === "con" && m.key === con).flatMap((m) => m.cards), mine = cards.some((c) => c.by === me);
    const lit = cards.map((c) => { const s = CARD[c.hip], [x, y] = F.xy(s.ra, s.de), p = pts(c.hip);
      return `<g class="cr-lit" style="--d:${f1(0.9 + k * 0.25)}s"><circle cx="${f1(x)}" cy="${f1(y)}" r="${4 + p * 1.6}" fill="url(#cr-gl-${s.cls})"/>${spark(x, y, 3 + p * 1.4)}</g>
        <text x="${f1(x)}" y="${f1(y + 6.5)}" text-anchor="middle" font-size="2.6" fill="#fff6dc" class="cr-lit" style="--d:${f1(1.1 + k * 0.25)}s">${esc(s.name)}</text>`; }).join("");
    return `<button type="button" class="cr-sky-t${mine ? " mine" : ""}" data-sky="${con}"><svg viewBox="6 10 58 54" aria-hidden="true">
      <path d="${F.path}" pathLength="100" fill="none" stroke="${mine ? "#FADE8C" : "#ff8fd0"}" stroke-width=".7" stroke-linecap="round" class="cr-line" style="--d:${f1(k * 0.25)}s"/>
      ${F.nodes.map(([a, b]) => `<circle cx="${f1(a)}" cy="${f1(b)}" r=".7" fill="#e8e6ff"/>`).join("")}${lit}</svg><span>${CONS[con].emoji} ${esc(CONS[con].name)}</span></button>`; }).join("");
  return `<div class="cr-night"><div class="cr-nh">✨ Tonight's sky · tap a constellation for its myth</div><div class="cr-tiles">${tiles}</div></div>`;
}

const CSS = `
.table.rummy{pointer-events:auto;background:#0b0618;overflow:hidden}
.cr-wrap{position:absolute;inset:0;display:grid;grid-template-rows:auto auto 1fr;gap:4px;padding:12px 12px 24px}
.cr-cloth{position:absolute;inset:0;width:100%;height:100%;z-index:0}.cr-wrap>*:not(.cr-cloth):not(.cr-mat){position:relative;z-index:1}
.cr-mat{position:absolute;inset:6px;z-index:0;border-radius:14px;overflow:hidden;box-shadow:inset 0 0 40px rgba(0,0,0,.6)}.cr-mat .cr-back{position:absolute;inset:0;width:100%;height:100%;border-radius:14px;border-width:3px;font-size:7rem}.cr-mat .cr-back i{inset:10px;border-radius:10px;border-width:2px}
.cr-matshade{position:absolute;inset:0;background:radial-gradient(70% 60% at 50% 55%,rgba(0,0,0,.35),rgba(0,0,0,.05) 60%,rgba(0,0,0,.45))}
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
.cr-mat .cr-back.cr-uni svg{opacity:.5}.cr-back.cr-uni{background:#0b1040}.cr-back.cr-uni::after{content:none}
.cr-back i{position:absolute;inset:3px;border:1px solid rgba(250,222,140,.45);border-radius:4px}
.cr-back::after{content:"✷";position:absolute;inset:0;display:grid;place-items:center;color:#FADE8C;font-size:1.2em;text-shadow:0 0 6px #FADE8C}
@keyframes cr-spin{to{transform:rotate(360deg)}}@keyframes cr-drift{to{background-position:100% 100%}}@keyframes cr-wave{to{background-position:0 100%}}@keyframes cr-pulse{50%{opacity:.3}}
.cr-shelf{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;gap:10px}.cr-shelf .cr-back{width:66px;height:92px}.cr-shelf .cr-back:nth-child(1){transform:rotate(-10deg)}.cr-shelf .cr-back:nth-child(3){transform:rotate(10deg)}
.cr-opps{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}.cr-opps.many .cr-ofan .cr-back{width:20px;height:28px;margin-left:-11px}
.cr-opp{display:flex;align-items:center;justify-content:center;gap:8px;min-height:40px;padding:0 6px;border-radius:10px}
.cr-opp.turn{box-shadow:0 0 0 1px rgba(250,222,140,.6),0 0 12px rgba(250,222,140,.35);background:rgba(5,3,14,.35)}
.cr-ghost{position:fixed;z-index:9999;pointer-events:none;transform:translate(-50%,-60%) rotate(var(--rot,0deg)) scale(1.08);box-shadow:0 14px 28px rgba(0,0,0,.65),0 0 18px var(--k)}
.cr-card.lift{opacity:.25}
.cr-drop-on{outline:2px dashed #FADE8C;outline-offset:3px;border-radius:8px;filter:drop-shadow(0 0 10px rgba(250,222,140,.8))}
.table.rummy.cr-drop-on{outline-offset:-6px}
.cr-night{position:absolute;inset:0;z-index:3;background:radial-gradient(120% 90% at 50% 20%,#141046,#05040f 70%);padding:10px;overflow:auto;animation:cr-fade .8s ease-out both}
@keyframes cr-fade{from{opacity:0}}
.cr-nh{font-size:.7rem;color:var(--gold2,#FADE8C);text-align:center;letter-spacing:.06em;margin-bottom:6px}
.cr-tiles{display:grid;grid-template-columns:repeat(auto-fill,minmax(110px,1fr));gap:8px}
.cr-sky-t{display:flex;flex-direction:column;align-items:center;gap:2px;background:rgba(10,8,34,.7);border:1px solid rgba(255,143,208,.35);border-radius:10px;padding:4px;color:#fff3cf;font:inherit;font-size:.66rem;cursor:pointer}
.cr-sky-t.mine{border-color:rgba(250,222,140,.7)}.cr-sky-t:hover{box-shadow:0 0 12px rgba(250,222,140,.5)}
.cr-sky-t svg{width:100%;aspect-ratio:58/54;display:block}
.cr-line{stroke-dasharray:100;stroke-dashoffset:100;animation:cr-line 1.8s ease-out var(--d) forwards}@keyframes cr-line{to{stroke-dashoffset:0}}
.cr-lit{opacity:0;animation:cr-litup .7s ease-out var(--d) forwards}@keyframes cr-litup{to{opacity:1}}
.cr-opp-pick{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.cr-opp-pick .c.on{box-shadow:0 0 0 2px #FADE8C}
.cr-seats{display:flex;flex-wrap:wrap;gap:6px;margin:6px 0}.cr-seats span{padding:3px 9px;border-radius:12px;border:1px solid var(--line,#3a2f6a);font-size:.8rem}.cr-seats .host{border-color:#FADE8C}
@media (prefers-reduced-motion: reduce){.cr-line{animation:none;stroke-dashoffset:0}.cr-lit{animation:none;opacity:1}.cr-night{animation:none}}
@media (prefers-reduced-motion: reduce){.cr-deal,.cr-new,.cr-flip,.cr-shake,.cr-meld .cr-fan,.cr-burst,.cr-card .cr-sky,.cr-opp.think .cr-ofan,.cr-back,.cr-back::before,.cr-back::after,.cr-back i,.cr-clothfx *{animation:none}.cr-burst{display:none}}
@media (max-width:560px){.cr-card{width:62px;height:85px}.cr-hand{gap:5px}}
@media (min-width:900px){.cr-fan{padding-left:28px}.cr-fan .cr-card.mini{width:48px;height:66px;margin-left:-28px}.cr-melds{gap:10px 18px}}
`;
function styleOnce() { defsOnce(); if (document.getElementById("cr-style")) return; const st = document.createElement("style"); st.id = "cr-style"; st.textContent = CSS; document.head.append(st); }

export function guideHtml() {
  return `<div class="dec-guide cr-guide"><h3>📖 ${esc(GUIDE.title)}</h3>${GUIDE.sections.map((s, i) => `<details${i === 0 ? " open" : ""}><summary>${esc(s.h)}</summary>${s.p.map((t) => `<p>${t}</p>`).join("")}</details>`).join("")}</div>`;
}

// Each Oracle's voice: what it says when it takes a discard, lays a set down, discards, wins and loses.
const LINES = {
  seer: { hello: "I am the Oracle. A steady hand and a clear sky.", take: ["I'll take that one.", "That star calls to me."], meld: ["The stars align."], dis: ["Your turn.", "Over to you.", "Your move, stargazer."],
    win: ["I win this time. The stars favoured me.", "My game. Want a rematch?", "Ha! The Oracle foresaw this."], lose: ["You win. The heavens applaud.", "Victory! I shall consult my cards about this.", "You beat me fair and square. Mostly fair."] },
  magpie: { hello: "Caw! I take whatever you throw away, so careful what you discard.", take: ["Mine! Shiny.", "Ooh, I'll have that.", "Finders keepers."], meld: ["Look at my collection!"], dis: ["Here, have a dull one.", "I'm bored of this one."],
    win: ["Caw! All the shiny stars are mine."], lose: ["You out-grabbed the grabber."] },
  hoarder: { hello: "I keep the brightest stars and throw away the dim ones. Bright stars score more, but they weigh heavy in the hand.", take: ["A bright one. Into the vault."], meld: ["Only the finest stars."], dis: ["Too dim for my vault.", "Keep your faint little star."],
    win: ["My vault overflows with light."], lose: ["You spent your stars better than I hoarded mine."] },
  trickster: { hello: "I hide my sets and throw out bait. Don't trust what I discard.", take: ["Oh, just a whim."], meld: ["Surprise! You didn't see that coming."], dis: ["I don't need that one at all.", "Take it. It's useless to me. Probably."],
    win: ["Fooled you! The cards were mine all along."], lose: ["You saw through my tricks."] },
};
const OPPS = ["seer", "magpie", "hoarder", "trickster"];
const oracleName = (k) => `${PERSONAS[k].emoji} ${PERSONAS[k].name}`;

export const rummy = {
  id: "rummy", row: "cards", label: "Constellation Rummy", emoji: "🃏", blurb: "Collect real stars into constellation sets against the Oracle or your friends, and learn their myths",
  open(ctx) {
    const { $, say, ui, talkThrough, cap, clearReading, state, saveProgress, showStats, chime, greet, award, tableEl, reduced } = ctx;
    styleOnce();
    const prog = () => rummyOf(state.prog), backId = () => { const id = backOf(state.prog); UNI = CARD_BACK[id] ? id : ""; return id; };
    // g = the game (on a guest's screen: the host's view of it); me = your seat; T = the call's table when playing together
    // real = this screen holds the real game (alone, or the host); a guest only holds the host's view of it
    let g = null, me = "me", T = null, sel = [], busy = false, pending = false, tell = 0, cfg = null, lastO = {}, real = true;
    const solo = () => !T, host = () => !T || (T.isHost() && real), seated = () => !!g && g.seats.includes(me);
    const isOracle = (s) => g.kind[s] === "oracle", nameOf = (s) => (s === me ? "You" : g.names[s] || "Someone");
    const guideBtn = `<button class="c" type="button" id="cr-guide">📖 Study guide</button>`;
    const wireGuide = () => { const b = $("cr-guide"); if (!b) return; b.onclick = () => { const rb = $("reading-body"), on = !rb.querySelector(".cr-guide"); rb.innerHTML = on ? guideHtml() : "";
      b.textContent = on ? "📖 Close study guide" : "📖 Study guide"; if (on) rb.querySelector(".cr-guide").scrollIntoView({ behavior: "smooth", block: "start" }); }; };
    const paint = (o = {}) => { lastO = o; tableEl.className = "table rummy";
      tableEl.innerHTML = tableHtml(g, { surface: prog().surface || "back", me: seated() ? me : null, names: Object.fromEntries(g.seats.map((s) => [s, g.names[s]])), thinking: !g.over && isOracle(g.turn) ? g.turn : null, ...o });
      backId(); tableEl.querySelectorAll("[data-draw]").forEach((b) => (b.onclick = () => doDraw(b.dataset.draw))); };
    const wait = (ms) => new Promise((r) => setTimeout(r, reduced ? Math.min(ms, 150) : ms));
    const leaveTable = () => { if (T) { const t = T; T = null; t.leave(); } };

    // ---------- lobby ----------
    function lobby(first) {
      leaveTable(); g = null; me = "me"; clearReading(); cap("🃏 Constellation Rummy");
      tableEl.className = "table rummy"; tableEl.innerHTML = `<div class="cr-shelf cr-b-${backId()}">${back()}${face(37826, { mini: true })}${back()}</div>`;
      const w = winsOf(state.prog), t = titleOf(w), nx = nextTitle(w), opp = PERSONAS[prog().opp] ? prog().opp : "seer", beat = prog().beat || {};
      say(first && !prog().plays
        ? `Pull up a chair, ${state.name}. This deck holds 48 real stars. Collect three or four from the same constellation and lay them down as a set. Each turn: draw one, lay down what you can, discard one. Empty your hand first and the night is yours. Brighter stars score more.`
        : pick([`The cards are cold and the stars are out, ${state.name}. Fancy a hand?`, `Back for another game, ${state.name}? I've been practising my shuffle.`, `The table is set, ${state.name}. Choose your sky and your opponent.`]));
      const lvl = (L) => `<button class="c level" type="button" data-l="${L.n}"><b>${"⭐".repeat(L.n)} Level ${L.n} · ${esc(L.name)}</b><span>${esc(L.what)} · ${L.hand} cards · points ×${L.mult}${prog().wins[L.n] ? ` · ${prog().wins[L.n]} won` : ""}${prog().best[L.n] != null ? ` · best ${prog().best[L.n]}` : ""}</span></button>`;
      const ds = dailyState(state.prog, "rummy"), dl = dailyLevel(), dp = dailyOpp();
      ui(`<div class="cx-top"><b>🃏 ${esc(t.name)}</b> · ${w} win${w === 1 ? "" : "s"}${nx ? ` · ${nx.at - w} more to ${esc(nx.name)}` : ""} · ${Object.keys(prog().cons).length} / 12 constellations played</div>
        <div class="group">Your opponent</div><div class="cr-opp-pick">${OPPS.map((k) => `<button class="c small${k === opp ? " on" : ""}" type="button" data-opp="${k}" title="${esc(PERSONAS[k].style)}">${oracleName(k)}${PERSONAS[k].prize ? (beat[k] ? " ✓" : ` · first win +${PERSONAS[k].prize} 💎`) : ""}</button>`).join("")}</div>
        <div class="note">${esc(PERSONAS[opp].style)}</div>
        <div class="levels">${LEVELS.map(lvl).join("")}</div>
        <div class="choices"><button class="c main" type="button" id="cr-daily">📅 Daily deal #${dayNumber()}${ds.played ? " ✓" : ""}</button><button class="c main" type="button" id="cr-together">👥 Play together</button>${guideBtn}<button class="c" type="button" id="back">✦ Back to the Oracle</button></div>
        <div class="note">Daily deal: everyone gets the same cards today · Level ${dl.n} against ${oracleName(dp)}${ds.streak ? ` · streak ${ds.streak} 🔥` : ""}. Play together: everyone in this Discord call sits at one table (2 to 4 players, Oracles fill empty seats).</div>`);
      $("ui").querySelectorAll("[data-l]").forEach((b) => (b.onclick = () => dealSolo(LEVELS[+b.dataset.l - 1], opp)));
      $("ui").querySelectorAll("[data-opp]").forEach((b) => (b.onclick = () => { prog().opp = b.dataset.opp; saveProgress(); flickSfx(); say(LINES[b.dataset.opp].hello); lobby(false); }));
      $("cr-daily").onclick = dailyLobby; $("cr-together").onclick = together;
      $("back").onclick = greet; wireGuide();
    }
    const dailyLevel = () => LEVELS[dayNumber() % 3], dailyOpp = () => OPPS[dayNumber() % OPPS.length];

    async function dailyLobby() {
      const ds = dailyState(state.prog, "rummy"), L = dailyLevel(), opp = dailyOpp();
      const draw = (board) => ui(`<div class="group">📅 Daily deal #${dayNumber()} · Level ${L.n} ${esc(L.name)} against ${oracleName(opp)}</div>
        <div class="note">Everyone in Science is Magic gets the same shuffle today. Your first game of the day goes on the board.${ds.played ? ` You scored <b>${ds.today.score}</b> today${ds.today.won ? " and won" : ""}. Play again for practice: it won't count.` : ""}</div>
        <div class="group">🏆 Today's board</div>${board === undefined ? `<div class="note">Reading the board…</div>` : boardHtml(board, esc, { unit: "pts", local: ds.today })}
        <div class="choices"><button class="c main" type="button" id="cr-dgo">🃏 ${ds.played ? "Practice today's deal" : "Deal today's cards"}</button><button class="c" type="button" id="cr-lobby">Back</button></div>`);
      const wire = () => { $("cr-dgo").onclick = () => dealSolo(L, opp, { daily: !ds.played }); $("cr-lobby").onclick = () => lobby(false); };
      draw(undefined); wire(); const b = await boardOf(state, "rummy"); if (!g && $("cr-dgo")) { draw(b); wire(); }
    }

    // ---------- dealing ----------
    function dealSolo(L, opp, o = {}) {
      real = true; g = newGame(L, o.daily !== undefined ? dailySeed("rummy") : Date.now(), { seats: ["me", "or"], persona: { or: opp } });
      g.kind = { me: "human", or: "oracle" }; g.names = { me: state.name, or: oracleName(opp) }; g.daily = !!o.daily; me = "me";
      startGame();
    }
    async function startGame() {
      const L = levelOf(g); sel = []; busy = true; tell = prog().plays || 0; clearReading(); cap(`🃏 Level ${L.n} · ${L.name}${g.daily ? " · Daily deal" : ""}`);
      shuffleSfx(); paint(); hand({ deal: true }); await wait(700); dealSfx(L.hand);
      const opps = g.seats.filter((s) => s !== me && isOracle(s));
      say((g.turn === me ? pick(["The cards are dealt. Your move.", "I shuffled the heavens. You go first.", "Stars in hand. Draw a card to begin."]) : `The cards are dealt. ${g.names[g.turn]} goes first.`)
        + (opps.length === 1 && solo() ? " " + LINES[g.persona[opps[0]] || "seer"].hello : "") + (L.labels ? "" : " On this level the cards don't say where each star lives. A wrong set costs a point."));
      busy = false; hand();
      if (host() && isOracle(g.turn)) runOracles();
    }

    // ---------- your hand ----------
    function hand(o = {}) {
      if (!g) return;
      const L = levelOf(g), mine = seated() && g.turn === me && !g.over && !busy && !pending, t = top(g), my = seated() ? g.hands[me] : [];
      sel = sel.filter((h) => my.includes(h));
      const cards = my.map((h, i) => face(h, { labels: L.labels, sel: sel.includes(h), i, cls: o.deal ? "cr-deal" : o.fresh === h ? "cr-new" : "" })).join("");
      let acts = "";
      if (mine && g.phase === "draw") acts = `<button class="c main" type="button" id="cr-deck" ${g.deck.length || g.nights < 2 ? "" : "disabled"}>🂠 Draw from the deck</button>${t != null ? `<button class="c" type="button" id="cr-top">⤴ Take ${esc(CARD[t].name)}</button>` : ""}`;
      else if (mine) {
        const set = sel.length >= 3 && (L.labels ? setType(g, sel) : true), one = sel.length === 1;
        acts = `<button class="c main" type="button" id="cr-set" ${set ? "" : "disabled"}>✦ Lay down set</button><button class="c" type="button" id="cr-add" ${one && g.melds.length ? "" : "disabled"}>➕ Add to a set</button>
          <button class="c" type="button" id="cr-dis" ${one && (sel[0] !== g.took || my.length === 1) ? "" : "disabled"}>⤵ Discard${one ? " " + esc(CARD[sel[0]].name) : ""}</button>`;
      }
      const tip = !seated() ? "You're watching this game. You'll get a seat in the next one." : !mine ? (g.over ? "" : pending ? "…" : `${g.names[g.turn]} is playing…`) : g.phase === "draw" ? "Draw a card: from the deck, or take the top discard. Drag cards to rearrange your hand." :
        sel.length === 0 ? "Tap cards to pick them, drag to rearrange. 3 or 4 of one constellation make a set" + (L.colour ? "; so do 3+ of one colour class from different constellations." : ".") + " Drag a card onto a set or the discard pile, or a picked set onto the table." :
        sel.length === 1 ? "One card: add it to a set on the table, or discard it. You can drag it there too." : sel.length === 2 ? "Pick at least 3 cards for a set." : (L.labels && !setType(g, sel) ? "These don't make a set yet." : "Lay them down, or drag them onto the table!");
      const who = T ? `<div class="cr-seats">${g.seats.map((s) => `<span${g.turn === s && !g.over ? ' class="host"' : ""}>${esc(s === me ? "You" : g.names[s])} · ${g.hands[s].length}</span>`).join("")}</div>` : "";
      ui(`${who}<div class="cr-hand${o.shake ? " cr-shake" : ""}">${cards}</div><div class="choices">${acts}${g.over || !seated() ? "" : `<button class="c small" type="button" id="cr-sort">⇅ Sort</button>`}<button class="c small" type="button" id="cr-surf">${prog().surface === "cloth" ? "🃏 Card-back table" : "🧵 Cloth table"}</button>${guideBtn}<button class="c small" type="button" id="cr-leave">↩ Leave game</button></div><div class="note">${esc(tip)}</div>`);
      wireHand();
      $("cr-surf").onclick = () => { prog().surface = prog().surface === "cloth" ? "back" : "cloth"; saveProgress(); flickSfx(); paint(lastO); hand(); };
      if ($("cr-sort")) $("cr-sort").onclick = () => { const order = Object.keys(CONS); flickSfx();
        g.hands[me].sort((a, b) => L.labels ? order.indexOf(CARD[a].con) - order.indexOf(CARD[b].con) || CARD[a].mag - CARD[b].mag : "BAFKM".indexOf(CARD[a].cls) - "BAFKM".indexOf(CARD[b].cls) || CARD[a].mag - CARD[b].mag); hand(); };
      if ($("cr-deck")) $("cr-deck").onclick = () => doDraw("deck");
      if ($("cr-top")) $("cr-top").onclick = () => doDraw("discard");
      if ($("cr-set")) $("cr-set").onclick = () => doSet(sel);
      if ($("cr-add")) $("cr-add").onclick = () => doAdd(sel[0]);
      if ($("cr-dis")) $("cr-dis").onclick = () => doDiscard(sel[0]);
      $("cr-leave").onclick = () => lobby(false); wireGuide();
    }
    const toggle = (h) => { if (busy || g.over) return; flickSfx(); sel = sel.includes(h) ? sel.filter((x) => x !== h) : [...sel, h]; info(h); hand(); };
    /** What's under the pointer on the table: a set, the discard pile, or the table itself. */
    function dropAt(x, y) {
      for (const el of document.elementsFromPoint(x, y)) {
        const m = el.closest && el.closest(".cr-meld[data-id]"); if (m && tableEl.contains(m)) return { kind: "meld", el: m, id: +m.dataset.id };
        const d = el.closest && el.closest("[data-drop=discard]"); if (d) return { kind: "discard", el: d };
        if (el === tableEl || (el.closest && el.closest(".table.rummy") === tableEl)) return { kind: "table", el: tableEl };
      }
      return null;
    }
    /** Tap a card to pick it; drag it (mouse or finger) to move it in your hand, or onto the table. */
    function wireHand() {
      const box = $("ui").querySelector(".cr-hand"); if (!box) return;
      box.querySelectorAll("[data-h]").forEach((b) => {
        const h = +b.dataset.h;
        b.onclick = (e) => { if (e.detail === 0) toggle(h); }; // keyboard (Enter/Space); pointer taps are handled below
        b.onpointerdown = (e) => {
          if (e.button > 0 || g.over) return;
          const sx = e.clientX, sy = e.clientY; let drag = false, target = null, after = false, ghost = null, drop = null;
          try { b.setPointerCapture(e.pointerId); } catch {}
          const others = [...box.querySelectorAll("[data-h]")].filter((x) => x !== b), hb = box.getBoundingClientRect();
          b.onpointermove = (ev) => {
            const dx = ev.clientX - sx, dy = ev.clientY - sy;
            if (!drag && Math.hypot(dx, dy) > 8) { drag = true; b.classList.add("lift"); ghost = b.cloneNode(true); ghost.classList.add("cr-ghost"); ghost.classList.remove("sel", "lift"); ghost.style.width = b.offsetWidth + "px"; ghost.style.height = b.offsetHeight + "px"; document.body.append(ghost); }
            if (!drag) return;
            ghost.style.left = ev.clientX + "px"; ghost.style.top = ev.clientY + "px"; ghost.style.setProperty("--rot", Math.max(-12, Math.min(12, dx / 18)) + "deg");
            others.forEach((o) => o.classList.remove("ins-l", "ins-r")); if (drop) drop.el.classList.remove("cr-drop-on"); drop = null; target = null;
            const inHand = ev.clientY > hb.top - 30 && ev.clientY < hb.bottom + 30 && ev.clientX > hb.left - 30 && ev.clientX < hb.right + 30;
            if (!inHand) { drop = dropAt(ev.clientX, ev.clientY); if (drop) drop.el.classList.add("cr-drop-on"); return; }
            let best = null, bd = Infinity;
            for (const o of others) { const r = o.getBoundingClientRect(), d = Math.hypot(ev.clientX - (r.left + r.width / 2), (ev.clientY - (r.top + r.height / 2)) * 1.5); if (d < bd) { bd = d; best = o; } }
            if (best) { const r = best.getBoundingClientRect(); after = ev.clientX > r.left + r.width / 2; target = best; best.classList.add(after ? "ins-r" : "ins-l"); }
          };
          const done = (ev, cancel) => {
            b.onpointermove = b.onpointerup = b.onpointercancel = null; if (ghost) ghost.remove(); if (drop) drop.el.classList.remove("cr-drop-on");
            if (!drag) { if (!cancel) toggle(h); return; }
            b.classList.remove("lift");
            if (!cancel && drop) return dropCard(h, drop);
            if (!cancel && target) { const arr = g.hands[me], t = +target.dataset.h; arr.splice(arr.indexOf(h), 1); arr.splice(arr.indexOf(t) + (after ? 1 : 0), 0, h); takeSfx(); }
            hand();
          };
          b.onpointerup = (ev) => done(ev, false); b.onpointercancel = (ev) => done(ev, true);
        };
      });
    }
    /** A card dropped on the table: onto a set = add it, onto the discards = discard it, onto the cloth = lay down your picked set. */
    function dropCard(h, d) {
      const mine = seated() && g.turn === me && !g.over && !busy && !pending;
      if (!mine) { say(g.over ? "The game is over." : `Wait for your turn: ${g.names[g.turn]} is playing.`); return hand(); }
      if (g.phase === "draw") { say("Draw a card first: tap the deck or the discards."); return hand(); }
      if (d.kind === "meld") return doAdd(h, d.id);
      if (d.kind === "discard") return doDiscard(h);
      const cards = sel.includes(h) ? sel : [...sel, h];
      if (cards.length >= 3) return doSet(cards);
      if (cards.length === 1) { const m = g.melds.find((x) => fits(g, h, x)); if (m) return doAdd(h, m.id); }
      say("Pick 3 or more cards that make a set, then drag them onto the table."); hand();
    }
    /** The card's real facts, under the hand. On Level 3 the fact would give away the constellation, so only once it's on the table. */
    function info(h) {
      const c = CARD[h], L = levelOf(g), k = CLASSES[c.cls], hidden = !L.labels;
      $("reading-body").innerHTML = `<div class="cr-info"><b>${esc(c.name)}</b>${hidden ? "" : ` · ${esc(conLabel(c.con))}`} · class ${c.cls} (${k.name.toLowerCase()}, ${k.temp}) · magnitude ${c.mag} · ${stars(pts(h))}<br>${hidden ? "Lay it in a set to learn its story." : esc(c.fact)}</div>`;
    }

    // ---------- moves: played here (alone, or as the host) or sent up to the host ----------
    const canMove = () => seated() && g && g.turn === me && !g.over && !busy && !pending;
    function doDraw(from) { if (!canMove() || g.phase !== "draw") return; move({ a: "draw", from }); }
    function doSet(hips) { if (!canMove() || g.phase !== "play" || hips.length < 3) return;
      if (levelOf(g).labels && !setType(g, hips)) { badSfx(); say("Those stars don't make a set."); return hand({ shake: true }); } move({ a: "set", hips: [...hips] }); }
    function doAdd(hip, meld) { if (!canMove() || g.phase !== "play" || hip == null) return; move({ a: "add", hip, meld }); }
    function doDiscard(hip) { if (!canMove() || g.phase !== "play" || hip == null) return;
      if (hip === g.took && g.hands[me].length > 1) { badSfx(); say("You can't throw back the card you just took. Pick another."); return; } move({ a: "dis", hip }); }
    function move(a) { if (host()) act(me, a); else { pending = true; T.up(a); hand(); } }

    /** Host: apply one player's move to the game and send what happened to everyone. */
    async function act(who, a) {
      if (!g || g.over || g.turn !== who) return;
      const ev = [], before = g.nights;
      if (a.a === "draw") { const h = draw(g, who, a.from === "discard" ? "discard" : "deck"); if (g.nights > before) ev.push({ t: "night" });
        if (h == null) { if (!g.over) return; } else ev.push({ t: "draw", who, from: a.from === "discard" ? "discard" : "deck", hip: h }); }
      else if (a.a === "set") { const hips = Array.isArray(a.hips) ? a.hips.map(Number).slice(0, 8) : []; const m = layDown(g, who, hips); ev.push(m ? { t: "meld", who, meld: m } : { t: "miss", who, set: true }); }
      else if (a.a === "add") { const hip = +a.hip, target = a.meld != null ? g.melds.find((m) => m.id === +a.meld) : g.melds.find((m) => m.type === "con" && fits(g, hip, m)) || g.melds.find((m) => fits(g, hip, m));
        const m = layOff(g, who, hip, target ? target.id : -1); ev.push(m ? { t: "layoff", who, hip, meld: m } : { t: "miss", who, hip }); }
      else if (a.a === "dis") { const hip = +a.hip; ev.push(discard(g, who, hip) ? { t: "discard", who, hip } : { t: "bad", who, why: "took" }); }
      if (g.over) ev.push({ t: "over" });
      if (!ev.length) return;
      await emit(ev);
      if (!g.over && isOracle(g.turn)) runOracles();
    }
    let oraclesOn = false;
    async function runOracles() {
      if (oraclesOn) return; oraclesOn = true; busy = true; hand();
      try {
        while (g && !g.over && isOracle(g.turn) && host()) {
          const who = g.turn; await wait(700);
          for (const step of oracleTurn(g, who)) { const ev = [step]; if (g.over) ev.push({ t: "over" }); await emit(ev); if (g.over) break; await wait(step.t === "meld" ? 1500 : 950); }
          if (!g.over && g.turn === who) break; // safety: never loop on a stuck turn
        }
      } finally { oraclesOn = false; busy = false; }
      if (g && !g.over) hand();
    }
    /** Host: show the events here, and send each player their own view (their own hand only). */
    async function emit(ev) {
      if (T) {
        for (const m of T.members) if (m.id !== me) T.to(m.id, { k: "st", v: viewFor(m.id), ev: ev.map((e) => hideFor(e, m.id)) });
        T.snap({ g: freeze(g), cfg });
      }
      return play(ev);
    }
    const hideFor = (e, id) => (e.t === "draw" && e.from === "deck" && e.who !== id ? { ...e, hip: null } : e.t === "bad" && e.who !== id ? { t: "noop" } : e);
    function viewFor(id) {
      const v = freeze(g); v.rs = 0; v.deck = g.deck.map(() => 0);
      if (!g.over) v.hands = Object.fromEntries(g.seats.map((s) => [s, s === id ? [...g.hands[s]] : g.hands[s].map(() => 0)]));
      return v;
    }

    /** Everyone: tell and animate what happened, then redraw. */
    async function play(ev) {
      let o = {}, fresh = null, shake = false, endIt = false;
      for (const e of ev) {
        const P = LINES[(g.persona && g.persona[e.who]) || "seer"], orc = e.who != null && isOracle(e.who), N = e.who != null ? nameOf(e.who) : "";
        if (e.t === "night") { dawnSfx(); say("The deck is empty. A new night falls: the discards are shuffled into a fresh deck."); await wait(900); }
        else if (e.t === "draw") {
          e.from === "discard" ? takeSfx() : flickSfx();
          if (e.who === me) { fresh = e.hip; if (e.hip != null) info(e.hip); say(e.from === "discard" ? `You take ${CARD[e.hip].name}.${solo() ? " " + pick(["Bold.", "Interesting choice.", "I saw that."]) : ""}` : pick(["You draw from the deck.", "A new star for your hand.", "The deck gives you a card."])); }
          else { say(e.from === "discard" ? `${N} takes ${CARD[e.hip].name} from the discards.${orc ? " " + pick(P.take) : ""}` : `${N} draws from the deck.`); o.got = { [e.who]: 1 }; }
        } else if (e.t === "meld") {
          meldSfx(e.meld.cards.length, Math.max(...e.meld.cards.map((c) => pts(c.hip)))); o.fresh = e.meld.id;
          if (e.who === me) { o.burst = true; say(lore(e.meld)); $("reading-body").innerHTML = `<div class="cr-info">${e.meld.cards.map((c) => `<b>${esc(CARD[c.hip].name)}</b>: ${esc(CARD[c.hip].fact)}`).join("<br>")}</div>`; }
          else say(`${N} lays down ${setName(e.meld)}: ${e.meld.cards.map((c) => CARD[c.hip].name).join(", ")}.${orc ? " " + pick(P.meld) : ""}`);
        } else if (e.t === "layoff") {
          layoffSfx(); o.grew = e.meld.id; const full = e.meld.type === "con" && e.meld.cards.length === 4;
          if (e.who === me) { say(full ? `${CARD[e.hip].name} completes ${CONS[e.meld.key].name}! ${CONS[e.meld.key].science[0]}` : `${CARD[e.hip].name} joins ${setName(e.meld)}. ${CARD[e.hip].fact}`); if (full) { chime(1); o.burst = true; } }
          else say(`${N} adds ${CARD[e.hip].name} to ${setName(e.meld)}.`);
        } else if (e.t === "discard") {
          discardSfx(); o.flip = true; if (e.who === me) $("reading-body").innerHTML = "";
          const next = g.over ? "" : g.turn === me ? "Your turn." : `${nameOf(g.turn)}'s turn.`;
          say(e.who === me ? `You discard ${CARD[e.hip].name}. ${next}` : solo() ? `${N} discards ${CARD[e.hip].name}. ${pick(P.dis)}${g.persona[e.who] && g.persona[e.who] !== "seer" && !g.over ? " Your turn." : ""}` : `${N} discards ${CARD[e.hip].name}. ${next}`);
        } else if (e.t === "miss" && e.who === me) { badSfx(); shake = true;
          say(levelOf(g).labels ? (e.set ? "Those stars don't make a set." : `${CARD[e.hip].name} doesn't fit any set on the table.`) : `The stars disagree. That's not a set. One point lost (${g.miss[me] || 0} so far).`); }
        else if (e.t === "bad" && e.who === me) { badSfx(); say("You can't throw back the card you just took. Pick another."); }
        else if (e.t === "away") say(`${e.name} left the table. ${g.names[e.who]} plays their cards now.`);
        else if (e.t === "back") say(`${g.names[e.who]} is back at the table.`);
        else if (e.t === "over") endIt = true;
      }
      if (g) { paint(o); if (!endIt) hand({ fresh, shake }); }
      if (endIt) end();
    }
    function lore(m) {
      if (m.type === "col") return `A colour set! ${CLASSES[m.key].fact}`;
      const c = CONS[m.key], x = c.lore[tell++ % c.lore.length];
      return `${c.emoji} ${c.name}! ${x.c}, "${x.title}": ${x.t}`;
    }

    // ---------- playing together ----------
    async function together() {
      ui(`<div class="note">Finding your table…</div>`);
      if (!canJoin(state)) { say("Playing together works inside a Discord call: open the Oracle Chamber Activity in a voice channel with friends."); return lobby(false); }
      try { T = await joinTable("rummy", state); } catch (e) { T = null; say(`I couldn't set the table: ${e.message}`); return lobby(false); }
      me = T.me.id; g = null; real = T.isHost(); cfg = { level: 1, opp: PERSONAS[prog().opp] ? prog().opp : "seer" };
      T.on("msg", onMsg).on("members", onMembers).on("host", onHost).on("close", () => { if (!T) return; T = null; say("The table closed. You're back in the lobby."); lobby(false); });
      say(T.isHost() ? `You're hosting, ${state.name}. Everyone in this call who opens Constellation Rummy and taps Play together joins your table.` : `You sit down at ${T.nameOf(T.host)}'s table.`);
      if (!T.isHost()) T.up({ a: "hi" });
      tableLobby();
    }
    const players = () => T.members.slice(0, 4);
    function tableLobby() {
      if (!T) return;
      if (g && !g.over) return;
      cap("🃏 Constellation Rummy · together"); g = null;
      tableEl.className = "table rummy"; tableEl.innerHTML = `<div class="cr-shelf cr-b-${backId()}">${back()}${face(32349, { mini: true })}${back()}</div>`;
      const ps = players(), L = LEVELS[cfg.level - 1], oracles = Math.max(0, 2 - ps.length);
      const seats = `<div class="cr-seats">${ps.map((m) => `<span class="${m.id === T.host ? "host" : ""}">${m.id === T.host ? "👑 " : ""}${esc(m.id === me ? m.name + " (you)" : m.name)}</span>`).join("")}${oracles ? `<span>${oracleName(cfg.opp)}</span>` : ""}${T.members.length > 4 ? `<span>+${T.members.length - 4} watching</span>` : ""}</div>`;
      if (host()) {
        ui(`<div class="group">👥 Your table</div>${seats}
          <div class="group">Level</div><div class="cr-opp-pick">${LEVELS.map((x) => `<button class="c small${x.n === cfg.level ? " on" : ""}" type="button" data-tl="${x.n}">${"⭐".repeat(x.n)} ${esc(x.name)}</button>`).join("")}</div>
          <div class="group">Oracle in empty seats</div><div class="cr-opp-pick">${OPPS.map((k) => `<button class="c small${k === cfg.opp ? " on" : ""}" type="button" data-to="${k}">${oracleName(k)}</button>`).join("")}</div>
          <div class="group">Seats</div><div class="cr-opp-pick">${[2, 3, 4].map((n) => `<button class="c small${n === (cfg.seats || Math.max(2, ps.length)) ? " on" : ""}" type="button" data-ts="${n}" ${n < ps.length ? "disabled" : ""}>${n} players</button>`).join("")}</div>
          <div class="choices"><button class="c main" type="button" id="cr-tdeal">🃏 Deal for ${Math.max(cfg.seats || 0, ps.length, 2)}</button><button class="c" type="button" id="cr-tleave">↩ Leave the table</button></div>
          <div class="note">${esc(L.what)}. Empty seats get an Oracle. More than 4 people? The rest watch and get the next seats.</div>`);
        $("ui").querySelectorAll("[data-tl]").forEach((b) => (b.onclick = () => { cfg.level = +b.dataset.tl; flickSfx(); syncLobby(); }));
        $("ui").querySelectorAll("[data-to]").forEach((b) => (b.onclick = () => { cfg.opp = b.dataset.to; flickSfx(); syncLobby(); }));
        $("ui").querySelectorAll("[data-ts]").forEach((b) => (b.onclick = () => { cfg.seats = +b.dataset.ts; flickSfx(); syncLobby(); }));
        $("cr-tdeal").onclick = dealTogether;
      } else ui(`<div class="group">👥 ${esc(T.nameOf(T.host))}'s table</div>${seats}<div class="note">Level ${L.n} · ${esc(L.name)}. Waiting for ${esc(T.nameOf(T.host))} to deal…</div>
        <div class="choices">${guideBtn}<button class="c" type="button" id="cr-tleave">↩ Leave the table</button></div>`);
      $("cr-tleave").onclick = () => lobby(false); wireGuide();
    }
    function syncLobby() { if (T && host()) T.to("*", { k: "lobby", cfg }); tableLobby(); }
    function dealTogether() {
      const ps = players(), n = Math.max(cfg.seats || 0, ps.length, 2), L = LEVELS[cfg.level - 1];
      const seats = ps.map((m) => m.id), kind = {}, names = {}, persona = {};
      for (const m of ps) { kind[m.id] = "human"; names[m.id] = m.name; }
      for (let i = seats.length; i < n; i++) { const id = "or" + i, k = i === seats.length ? cfg.opp : OPPS[(OPPS.indexOf(cfg.opp) + i - seats.length) % OPPS.length]; seats.push(id); kind[id] = "oracle"; persona[id] = k; names[id] = oracleName(k); }
      g = newGame(L, Date.now(), { seats, persona }); g.kind = kind; g.names = names; g.daily = false;
      for (const m of T.members) if (m.id !== me) T.to(m.id, { k: "deal", v: viewFor(m.id) });
      T.snap({ g: freeze(g), cfg }); startGame();
    }
    function onMsg({ from, m }) {
      if (!m || typeof m !== "object") return;
      if (T && host()) {
        if (m.a === "hi") { if (g && !g.over) { const v = viewFor(from); T.to(from, { k: "st", v, ev: [] }); } else T.to(from, { k: "lobby", cfg }); return; }
        if (g && m.a && g.turn === from && g.kind[from] === "human") act(from, m);
        return;
      }
      if (from !== T.host) return;
      if (m.k === "lobby") { cfg = m.cfg; if (!g) tableLobby(); }
      else if (m.k === "deal") { g = adopt(m.v); startGame(); }
      else if (m.k === "st") { const was = !!g; g = adopt(m.v); pending = false; if (!was) { clearReading(); cap(`🃏 Level ${g.level} · ${levelOf(g).name}`); } play(m.ev || []); }
    }
    /** A view from the host becomes this screen's game; keep the order you arranged your hand in. */
    function adopt(v) {
      const old = g && g.hands && g.hands[me] ? g.hands[me] : [], nu = v.hands[me];
      if (nu) v.hands[me] = [...old.filter((h) => nu.includes(h)), ...nu.filter((h) => !old.includes(h))];
      return thaw(v);
    }
    function onMembers() {
      if (!T) return;
      if (!T.isHost()) { if (!g) tableLobby(); return; }
      if (!real) return; // just made host: wait for the saved game (onHost)
      if (!g || g.over) { T.to("*", { k: "lobby", cfg }); if (!g) tableLobby(); return; }
      // host: a player who left is played by an Oracle until they come back
      const here = new Set(T.members.map((m) => m.id)), ev = [];
      for (const s of g.seats) {
        if (g.kind[s] === "human" && !here.has(s) && s !== me) { g.kind[s] = "oracle"; g.persona[s] = "seer"; const nm = g.names[s]; g.away = { ...(g.away || {}), [s]: nm }; g.names[s] = `🔮 Oracle for ${nm}`; ev.push({ t: "away", who: s, name: nm }); }
        else if (g.away && g.away[s] && here.has(s)) { g.kind[s] = "human"; g.names[s] = g.away[s]; delete g.persona[s]; delete g.away[s]; ev.push({ t: "back", who: s }); }
      }
      emit(ev).then(() => { if (!g.over && isOracle(g.turn)) runOracles(); });
    }
    function onHost(snap) {
      if (!T) return;
      say("You're the host now."); real = true; pending = false;
      if (snap && snap.g && !snap.g.over) { g = thaw(snap.g); cfg = snap.cfg || cfg; if (g.away && g.away[me]) { g.kind[me] = "human"; g.names[me] = g.away[me]; delete g.away[me]; } onMembers(); }
      else { g = null; syncLobby(); }
    }

    // ---------- the end ----------
    async function end() {
      busy = true;
      if (!g.result) {
        const before = winsOf(state.prog), r = seated() ? settle(state.prog, g, me) : null, aw = r ? award(r.xp, r.essence) : { rankUp: null };
        if (r) { saveProgress(); showStats(); ctx.trophy?.("rummy", g.level, { won: r.win, perfect: r.win && g.out === me }); } // Trophy Case (trophies.js)
        let daily = null;
        if (r && g.daily) { const detail = `Level ${g.level} vs ${PERSONAS[g.persona.or || "seer"].name}`; daily = finishDaily(state.prog, "rummy", { score: r.score.me.total, won: r.win, detail }); saveProgress();
          if (daily.first) postDaily(state, "rummy", { score: r.score.me.total, won: r.win, detail }); }
        const t = titleOf(winsOf(state.prog)); g.result = { r, aw, t, titled: titleOf(before).name !== t.name, daily };
      }
      results(true);
    }
    function results(fresh) {
      const L = levelOf(g), { r, aw, t, titled, daily } = g.result, s = tally(g, seated() ? me : g.seats[0]);
      tableEl.className = "table rummy"; tableEl.innerHTML = tableHtml(g, { surface: prog().surface || "back", me: seated() ? me : null, names: g.names }) + nightHtml(g, me);
      tableEl.querySelectorAll("[data-sky]").forEach((b) => (b.onclick = () => myth(b.dataset.sky)));
      const out = g.out, how = out === me ? "You went out!" : out ? `${g.names[out]} went out.` : "Dawn breaks and the stars fade. Game over.";
      const opp1 = g.seats.find((x) => x !== me && isOracle(x)), P = LINES[(opp1 && g.persona[opp1]) || "seer"];
      if (fresh && r) (r.win ? winSfx : r.tie ? dawnSfx : loseSfx)();
      if (fresh) say(`${how} ${!r ? `${g.names[s.best === me ? g.seats[0] : s.best] || ""} wins.` : r.win ? (solo() ? pick(P.lose) : "You win the table!") : r.tie ? "A tie. The stars can't decide." : solo() ? pick(P.win) : `${g.names[s.best]} wins this one. Place: ${s.place} of ${g.seats.length}.`}`);
      const cols = g.seats, head = cols.map((x) => `<b>${esc(x === me ? "You" : g.names[x])}</b>`);
      const row = (k, f) => `<span>${k}</span>${cols.map((x) => `<span>${f(s.by[x])}</span>`).join("")}`;
      const played = [...new Set(g.melds.filter((m) => m.type === "con").map((m) => m.key))], canDeal = host();
      ui(`<div class="cr-score" style="grid-template-columns:auto repeat(${cols.length},1fr)"><span></span>${head.join("")}${row("Stars laid down", (x) => "+" + x.melded)}${row("Left in hand", (x) => "−" + x.hand)}${row("Went out", (x) => (x.bonus ? "+5" : ""))}${cols.some((x) => s.by[x].miss) ? row("Wrong sets", (x) => (x.miss ? "−" + x.miss : "")) : ""}${row("<b>Total</b>", (x) => `<b>${x.total}</b>`)}</div>
        ${r ? `<div class="reward"><div><b>+${r.xp} ✦${r.essence ? ` · +${r.essence} 💎` : ""}</b>${r.firstWin ? " · first win at this level" : ""}${r.best ? " · new best" : ""}${r.newFull.length ? ` · completed ${r.newFull.map((c) => CONS[c].name).join(", ")}` : ""}${r.beat ? ` · first win against ${esc(oracleName(r.beat.key))} (+${r.beat.prize} 💎)` : ""}</div>
        ${daily ? `<div class="up">📅 Daily deal ${daily.first ? `scored <b>${s.me.total}</b> · streak ${daily.streak} 🔥` : "practice game (only your first game of the day counts)"}</div>` : ""}
        ${titled ? `<div class="up">🃏 Card title: <b>${esc(t.name)}</b></div>` : ""}${aw.rankUp ? `<div class="up">🏅 You are now <b>${esc(aw.rankUp)}</b></div>` : ""}</div>` : ""}
        <div id="cr-board"></div>
        <div class="choices">${canDeal ? `<button class="c main" type="button" id="cr-again">🃏 Deal again</button>` : `<span class="note">Waiting for ${esc(T.nameOf(T.host))} to deal again…</span>`}${played.length ? `<button class="c" type="button" id="cr-myths">📜 Hear the myths (${played.length})</button>` : ""}<button class="c" type="button" id="cr-lobby">${T ? "Leave the table" : "Choose a level"}</button><button class="c" type="button" id="back">✦ Back to the Oracle</button></div>`);
      if (fresh && (titled || aw.rankUp)) chime(2);
      if ($("cr-again")) $("cr-again").onclick = () => (T ? (g.result = null, dealTogether()) : g.daily !== undefined && g.seed === dailySeed("rummy") ? dealSolo(L, g.persona.or, { daily: false }) : dealSolo(L, g.persona.or));
      $("cr-lobby").onclick = () => lobby(false); $("back").onclick = () => { leaveTable(); greet(); };
      if ($("cr-myths")) $("cr-myths").onclick = () => { const pages = played.flatMap((c) => [`${CONS[c].emoji} ${CONS[c].name}.`, ...CONS[c].lore.slice(0, 2).flatMap((x) => [`${x.c}: ${x.title}.`, ...x.parts]), CONS[c].science[0]]);
        talkThrough(pages, () => { say("Those are the stories of tonight's sky."); results(false); }); };
      if (daily && daily.first !== undefined) boardOf(state, "rummy").then((b) => { const el = $("cr-board"); if (el) el.innerHTML = `<div class="group">🏆 Today's board</div>${boardHtml(b, esc, { unit: "pts", local: dailyState(state.prog, "rummy").today })}`; });
    }
    function myth(con) {
      const c = CONS[con], x = c.lore[Math.floor(Math.random() * c.lore.length)]; flickSfx();
      talkThrough([`${c.emoji} ${c.name}. ${x.c}: ${x.title}.`, ...x.parts, c.science[0]], () => { say("Tap another constellation, or deal again."); results(false); });
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
