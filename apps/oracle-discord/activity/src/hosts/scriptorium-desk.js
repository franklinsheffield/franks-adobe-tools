// Archivist Wren's House, Phase 1: the writing room behind them, the open codex where the crystal ball was, their 8
// scribe poses, reactions, 8 scribe emotes and their habits and gowns. Every fact in a line is real.
import { coatOverlay } from "./alchemist-lab.js";

// ---- the writing room: daylight through the arched window follows the hour (scribes wrote by daylight) ----
/** 0 (night) .. 1 (noon): how much daylight falls on the desk. */
export const daylight = (h) => +Math.max(0, Math.sin(((h - 6) / 12) * Math.PI)).toFixed(3);
export function deskSceneHtml(at = Date.now(), { prog = {}, motes = 14, rnd = Math.random } = {}) {
  const h = new Date(at).getHours(), L = daylight(h), night = L === 0;
  const win = `<svg class="ws-window" viewBox="0 0 60 100" aria-hidden="true"><defs><linearGradient id="ws-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${night ? "#0b1124" : "#bcd6f0"}"/><stop offset="1" stop-color="${night ? "#1c2240" : "#f4e8c8"}"/></linearGradient></defs>
    <path d="M6 98V34Q6 6 30 4Q54 6 54 34V98Z" fill="#3a2c1c" stroke="#7a5a32" stroke-width="2"/><path d="M12 92V36Q12 12 30 10Q48 12 48 36V92Z" fill="url(#ws-sky)"/>
    ${night ? `<circle cx="38" cy="26" r="1" fill="#fff"/><circle cx="22" cy="40" r=".8" fill="#fff"/><circle cx="34" cy="54" r=".7" fill="#fff"/>` : ""}<path d="M30 10V92M12 50H48" stroke="#3a2c1c" stroke-width="2.4"/>
    ${[[12, 36], [30, 36], [12, 64], [30, 64]].map(([x, y]) => `<path d="M${x} ${y}L${x + 18} ${y + 28}M${x + 18} ${y}L${x} ${y + 28}" stroke="#3a2c1c" stroke-width=".6" opacity=".6"/>`).join("")}</svg>`;
  const shelf = `<svg class="ws-shelf" viewBox="0 0 100 60" aria-hidden="true"><rect x="0" y="27" width="100" height="3" fill="#5a3a1e"/><rect x="0" y="57" width="100" height="3" fill="#5a3a1e"/>
    ${[["#7a1a10", 10], ["#2a3a6a", 8], ["#3a5a2a", 12], ["#6a4a1a", 9], ["#5a1a4a", 10], ["#1a1a1a", 8], ["#8a6a2a", 11]].map(([c, w], i, a) => { const x = 4 + a.slice(0, i).reduce((s, [, ww]) => s + ww + 2, 0); return `<rect x="${x}" y="${4 + (i % 3)}" width="${w}" height="${23 - (i % 3)}" rx="1" fill="${c}" stroke="#E2B04A" stroke-opacity=".5"/>`; }).join("")}
    <g class="mb-hot" data-tap="book"><title>A chained book: libraries chained valuable books to the shelf</title><rect x="12" y="34" width="26" height="22" rx="2" fill="#6a2a1a" stroke="#E2B04A"/><path d="M38 44 q10 4 14 -4 q4 -8 12 -6" fill="none" stroke="#9a9aa4" stroke-width="1.4" stroke-dasharray="3 1.5"/></g>
    <g class="mb-hot" data-tap="inkwell"><title>Inkwell</title><path d="M74 56 h14 l-2 -10 h-10z" fill="#1a1612" stroke="#7a5a32"/><rect x="77" y="43" width="8" height="3" fill="#3a2c1c"/></g></svg>`;
  const candle = `<svg class="ws-candle mb-hot" data-tap="candle" viewBox="0 0 30 60" aria-hidden="true"><title>Candle</title><rect x="10" y="22" width="10" height="32" rx="2" fill="#f1e4c6" stroke="#b8a582"/><path d="M6 54h18" stroke="#7a5a32" stroke-width="4"/>
    <path class="ws-flame" d="M15 6 Q21 14 15 22 Q9 14 15 6Z" fill="#ffcf5a"/><circle cx="15" cy="16" r="10" fill="#ffb84a" opacity=".2"/></svg>`;
  const bell = `<svg class="ws-bell mb-hot" data-tap="bell" viewBox="0 0 40 50" aria-hidden="true"><title>The bell for the hours</title><path d="M20 2V8" stroke="#7a5a32" stroke-width="2"/><path d="M8 34 Q8 10 20 8 Q32 10 32 34 L36 38 H4Z" fill="#C88A3A" stroke="#6b3f12"/><circle cx="20" cy="42" r="3" fill="#6b3f12"/></svg>`;
  const dust = Array.from({ length: motes }, () => `<i style="--x:${(rnd() * 100).toFixed(0)}%;--y:${(30 + rnd() * 60).toFixed(0)}%;--d:${(rnd() * 9).toFixed(1)}s;--t:${(9 + rnd() * 9).toFixed(1)}s"></i>`).join("");
  return `<div class="sc desk${night ? " night" : ""}" data-light="${L}">${win}${shelf}${bell}<div class="ws-desk"></div>${candle}<div class="sc-dust">${dust}</div>
    <div class="ws-beam" style="opacity:${(0.08 + 0.32 * L).toFixed(2)}"></div><div class="ws-glow" style="opacity:${(0.2 + 0.5 * (1 - L)).toFixed(2)}"></div></div>`;
}

// ---- their figure: an open codex on a lectern where the crystal ball was; pose props; reaction pieces ----
export const POSES = { think: "turn", curious: "stone", nod: "write", wow: "gild", smug: "seal", flinch: "blot", nervous: "scrape", dizzy: "letters" };
export const codexSvg = (id) => `<g class="wc-codex"><ellipse cx="200" cy="312" rx="70" ry="54" class="wc-glow" opacity=".18"/>
  <path d="M170 356 L200 384 L230 356" fill="none" stroke="#5a3a1e" stroke-width="8" stroke-linejoin="round"/><path d="M200 384 V396" stroke="#5a3a1e" stroke-width="8"/>
  <path d="M146 346 L254 346 L262 286 L138 286Z" fill="#5a3a1e" stroke="#2a1a0a" stroke-width="2"/>
  <path d="M200 296 Q176 284 150 292 L146 340 Q172 332 200 342Z" fill="#f1e4c6" stroke="#b8a582"/><path d="M200 296 Q224 284 250 292 L254 340 Q228 332 200 342Z" fill="#f4ead2" stroke="#b8a582"/>
  <rect x="156" y="298" width="16" height="18" fill="var(--wink,#E8483B)" opacity=".85"/><text x="164" y="313" font-size="15" text-anchor="middle" fill="#FADE8C" font-family="Georgia,serif" font-weight="bold">A</text>
  ${[302, 309, 316, 323, 330].map((y, i) => `<path d="M${i < 2 ? 176 : 156} ${y} H194" stroke="#3b2f2a" stroke-width="1" opacity=".55"/><path d="M206 ${y} H246" stroke="#3b2f2a" stroke-width="1" opacity=".55"/>`).join("")}
  <path d="M200 296 V342" stroke="#b8a582" stroke-width="1.4"/>
  <g class="wc-leaf"><path d="M200 296 Q224 284 250 292 L254 340 Q228 332 200 342Z" fill="#fbf3de" stroke="#b8a582"/></g>
  <g class="wc-gold">${[[216, 300], [238, 312], [222, 330], [168, 336]].map(([x, y], i) => `<path style="--d:${i * 0.1}s" d="M${x} ${y - 6} L${x + 1.5} ${y - 1.5} L${x + 6} ${y} L${x + 1.5} ${y + 1.5} L${x} ${y + 6} L${x - 1.5} ${y + 1.5} L${x - 6} ${y} L${x - 1.5} ${y - 1.5}Z" fill="#FADE8C" stroke="#7a5212" stroke-width=".6"/>`).join("")}</g>
  <g class="wc-blot"><path d="M232 318 q8 -10 14 -2 q10 -2 6 8 q8 6 -2 10 q0 10 -10 4 q-8 6 -10 -4 q-10 -2 -4 -8 q-4 -8 6 -8z" fill="#141018"/><circle cx="256" cy="312" r="2" fill="#141018"/><circle cx="226" cy="336" r="1.6" fill="#141018"/></g></g>`;
/** Pose props inside .o-hands (they travel with the hands). One shows at a time, by data-mood (CSS). */
export const propsSvg = () => `<g class="wc-props">
  <g class="hp hp-stone"><circle cx="262" cy="250" r="22" fill="#e8f4ff" fill-opacity=".22" stroke="#e8f4ff" stroke-width="2.4"/><path d="M248 238 A18 18 0 0 1 262 232" stroke="#fff" stroke-opacity=".7" stroke-width="3" fill="none" stroke-linecap="round"/></g>
  <g class="hp hp-seal"><g transform="rotate(-10 150 270)"><rect x="140" y="228" width="16" height="34" rx="6" fill="#5a3a1e"/><circle cx="148" cy="270" r="11" fill="#E8483B" stroke="#8a1a10" stroke-width="1.5"/><path d="M142 270 h12 M148 264 v12" stroke="#8a1a10" stroke-width="1.4"/></g></g>
  <g class="hp hp-knife"><path d="M258 250 L300 214" stroke="#c8ccd6" stroke-width="5" stroke-linecap="round"/><path d="M250 258 L262 246" stroke="#5a3a1e" stroke-width="7" stroke-linecap="round"/><g class="hp-shav">${[[226, 300], [232, 312], [220, 316]].map(([x, y], i) => `<path style="--d:${i * 0.12}s" d="M${x} ${y} q4 -3 8 0" stroke="#f1e4c6" stroke-width="1.6" fill="none"/>`).join("")}</g></g>
</g>`;
/** Letters swirling round their head (dizzy) and a splash of ink on the face (a lost game). */
export const headSvg = () => `<g class="wc-letters">${["A", "Ω", "ß", "ð"].map((c, i) => `<text style="--d:-${(i * 0.4).toFixed(1)}s" x="200" y="96" font-size="15" text-anchor="middle" fill="#E8483B" font-family="Georgia,serif">${c}</text>`).join("")}</g>
  <g class="wc-splash" fill="#141018">${[[176, 128, 7], [226, 176, 6], [188, 186, 4], [214, 118, 3.4]].map(([x, y, r]) => `<circle cx="${x}" cy="${y}" r="${r}" opacity=".7"/>`).join("")}</g>`;
export const REACT = {
  "poke-eye": { cls: "wc-squint", ms: 1000, say: ["Careful, these eyes have read a lot of tiny writing. Reading stones helped from about the year 1000.", "Ow. Eyeglasses were invented in Italy around 1286. I could use a pair."] },
  "poke-orb": { cls: "wc-flip", ms: 1600, say: ["You turned the page! Vellum is calfskin, scraped thin. One big book could take hundreds of animals.", "Gently! The Book of Kells is about 1,200 years old. Pages last if hands are kind."] },
  perfect: { cls: "wc-gilded", ms: 1800 },
  lose: { cls: "wc-blotted", ms: 3200, gesture: "swatL" },
};
export function react(kind, { teller, gesture, reduced = false } = {}) {
  const r = REACT[kind]; if (!r || !teller) return null;
  if (!reduced) { teller.classList.remove(r.cls); void teller.offsetWidth; teller.classList.add(r.cls); setTimeout(() => teller.classList.remove(r.cls), r.ms); }
  if (r.gesture && gesture) setTimeout(() => gesture(r.gesture), reduced ? 0 : 1600); // they flap the blot dry
  return r.say ? r.say[Math.floor(Math.random() * r.say.length)] : null;
}

// ---- their 8 scribe emotes: the 8 starting emotes, re-dressed (ids, levels and slots stay the same) ----
export const DESK_EMOTES = {
  wave: { e: "✒️", name: "Flourish", mood: "wow", say: "A flourish! Scribes filled the ends of lines so nobody could add words later.", fx: { p: ["✒️", "〰️"], m: "swirl" } },
  love: { e: "🖋️", name: "Rubric", mood: "nod", say: "Red for headings. 'Rubric' comes from the Latin ruber, red.", fx: { p: ["🖋️", "🟥"], m: "fall" } },
  laugh: { e: "🐌", name: "Snail knight", mood: "laugh", say: "Knights fighting snails are all over 13th and 14th century margins. Nobody is sure why.", fx: { p: ["🐌", "⚔️"], m: "burst" } },
  gasp: { e: "💧", name: "Blot", mood: "dizzy", say: "A blot! Scribes scraped mistakes off vellum with a knife.", fx: { p: ["💧", "✦"], m: "burst" } },
  spook: { e: "🔍", name: "Reading stone", mood: "curious", say: "A polished crystal set on the page makes the letters bigger. People used them from about 1000 AD.", fx: { p: ["🔍", "✦"], m: "orbit" } },
  dance: { e: "🔔", name: "Ring the hour", mood: "cheer", say: "Monastery bells rang the canonical hours: Matins, Lauds, Prime, Terce, Sext, None, Vespers, Compline.", fx: { p: ["🔔", "♪"], m: "rise" } },
  wink: { e: "🔏", name: "Seal it", mood: "flinch", say: "Sealed in red wax. A broken seal showed someone had read the letter.", fx: { p: ["🔏", "✦"], m: "swirl" } },
  think: { e: "📖", name: "Turn the page", mood: "think", say: "Books with pages, codices, took over from scrolls between about the 2nd and 5th centuries.", fx: { p: ["📖", "📜"], m: "swirl" } },
};

const MOOD_INK = { joy: "#E2B04A", cheer: "#E9B92F", love: "#8E2A6E", laugh: "#2E9E5B", wow: "#3D6BE0", curious: "#3D6BE0", think: "#8E2A6E", nod: "#E8483B", shake: "#7a6e5c",
  wink: "#E8483B", flinch: "#141018", sad: "#3D6BE0", sulk: "#4a4a5a", smug: "#E2B04A", angry: "#E8483B", sleepy: "#3a3a6a", nervous: "#E9B92F", dizzy: "#E8483B" };
export const DESK_CSS = `
body[data-house="scriptorium"]{--wink:#E8483B}
${Object.entries(MOOD_INK).map(([m, c]) => `body[data-house="scriptorium"] [data-mood="${m}"]{--wink:${c}}`).join("")}
body[data-house="scriptorium"] .o-ball>:not(.wc-codex){display:none}
.wc-glow{fill:var(--wink);transition:fill .5s}
.wc-leaf{transform-origin:200px 320px;transform-box:view-box;opacity:0}
.wc-gold,.wc-blot,.wc-letters,.wc-splash,.wc-props .hp{opacity:0;transition:opacity .25s}
body[data-house="scriptorium"] [data-mood="think"] .wc-leaf{animation:wc-turn 1.4s ease-in-out 2}@keyframes wc-turn{0%{opacity:1;transform:scaleX(1)}50%{opacity:1;transform:scaleX(0)}100%{opacity:0;transform:scaleX(-1)}}
body[data-house="scriptorium"] [data-mood="curious"] .hp-stone,body[data-house="scriptorium"] [data-mood="smug"] .hp-seal,body[data-house="scriptorium"] [data-mood="nervous"] .hp-knife{opacity:1}
body[data-house="scriptorium"] [data-mood="nod"] .hg-quill{opacity:1}
body[data-house="scriptorium"] [data-mood="wow"] .wc-gold{opacity:1}.wc-gold path{animation:a-twinkle 1s ease-out infinite;animation-delay:var(--d);transform-box:fill-box;transform-origin:50% 50%}
body[data-house="scriptorium"] [data-mood="flinch"] .wc-blot{opacity:1}
body[data-house="scriptorium"] [data-mood="dizzy"] .wc-letters{opacity:1}.wc-letters text{animation:ao-orb 1.8s linear infinite;animation-delay:var(--d);transform-origin:200px 112px;transform-box:view-box}
@keyframes ao-orb{from{transform:rotate(0) translateX(56px) rotate(0)}to{transform:rotate(360deg) translateX(56px) rotate(-360deg)}}
@keyframes a-twinkle{0%{transform:scale(0) rotate(0)}60%{transform:scale(1.3) rotate(45deg)}100%{transform:scale(.8) rotate(90deg);opacity:0}}
.hp-shav path{animation:wc-shav .6s ease-out infinite;animation-delay:var(--d)}@keyframes wc-shav{from{transform:translateY(0);opacity:1}to{transform:translateY(14px);opacity:0}}
body[data-house="scriptorium"] [data-mood="nervous"] .hp-knife{animation:wc-scrape .3s ease-in-out infinite alternate;transform-box:view-box;transform-origin:262px 246px}@keyframes wc-scrape{to{transform:translate(-6px,4px)}}
.teller.wc-squint .o-eye{animation:wc-squint .9s ease-in-out}@keyframes wc-squint{40%{transform:scaleY(.4)}}
.teller.wc-flip .wc-leaf{animation:wc-turn .4s linear 4}
.teller.wc-gilded .wc-gold{opacity:1}
.teller.wc-blotted .wc-splash,.teller.wc-blotted .wc-blot{opacity:1;animation:wc-dry 3.2s ease-in both}@keyframes wc-dry{0%,60%{opacity:1}100%{opacity:0}}
.ws-window{position:absolute;left:3%;top:3%;width:clamp(44px,12%,92px);opacity:.85}
.ws-shelf{position:absolute;right:2%;top:36%;width:clamp(80px,22%,150px);opacity:.85}
.ws-candle{position:absolute;left:4%;bottom:6.5%;width:clamp(18px,4.5%,34px);opacity:.92}.ws-flame{animation:hr-flick .4s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
.ws-bell{position:absolute;right:4%;top:6%;width:clamp(22px,5%,40px);opacity:.8}.ws-bell:active{animation:wc-ring .5s ease-in-out}@keyframes wc-ring{25%{transform:rotate(14deg)}75%{transform:rotate(-14deg)}}
.ws-desk{position:absolute;left:0;right:0;bottom:0;height:7%;background:linear-gradient(#6a4a2a,#2e1e0e);border-top:2px solid #E8483B;opacity:.85}
.ws-beam{position:absolute;left:4%;top:8%;width:44%;height:90%;background:linear-gradient(160deg,rgba(255,240,200,.9),transparent 70%);clip-path:polygon(0 0,22% 0,100% 100%,40% 100%);mix-blend-mode:screen;pointer-events:none}
.ws-glow{position:absolute;left:0;bottom:0;width:36%;height:45%;background:radial-gradient(circle at 10% 88%,rgba(255,190,90,.35),transparent 60%);mix-blend-mode:screen;pointer-events:none}
.scene .mb-hot{pointer-events:auto;cursor:pointer}
@keyframes hr-flick{to{transform:scaleY(1.18)}}
@media (prefers-reduced-motion: reduce){.wc-leaf,.wc-gold path,.wc-letters text,.hp-shav path,.ws-flame,[data-mood="nervous"] .hp-knife,.ws-bell:active{animation:none!important}}`;

// ---- their outfit line: habits and gowns (prog.habit). The Illuminator's mantle is earned, never sold ----
export const MANTLE = "hb-illuminator";
export const HABITS = [
  { id: "hb-tunic", name: "Scribe's wool tunic", price: 0, style: "lapel", hood: ["#8a7a5a", "#4a3e2a", "#14100a"], trim: "#E8483B", lapel: "#6a5a3e", note: "Many scriptoria worked by daylight alone. Candles near a library were a fire risk." },
  { id: "hb-benedictine", name: "Benedictine black habit", price: 60, style: "suit", hood: ["#3a3a40", "#141418", "#040406"], trim: "#c8c8d0", lapel: "#1a1a20", note: "Benedictines were called the Black Monks after their habits. Their Rule set hours for reading every day." },
  { id: "hb-cistercian", name: "Cistercian white habit", price: 100, style: "suit", hood: ["#f4f0e6", "#cfc6b2", "#6a604c"], trim: "#3a3a3a", lapel: "#e6dfcc", note: "Cistercians, the White Monks, wore undyed wool. Their early books banned bright colours and gold." },
  { id: "hb-paper", name: "Baghdad paper-maker's robe", price: 120, style: "apron", hood: ["#2E9E5B", "#14603a", "#04200e"], trim: "#E9B92F", lapel: "#f1e4c6", note: "A paper mill was working in Baghdad by the 790s. Paper reached Europe through Spain centuries later." },
  { id: "hb-printer", name: "Printer's apron", price: 140, style: "apron", hood: ["#5a4a3a", "#2e241a", "#0c0806"], trim: "#141018", lapel: "#d8ccb4", note: "Gutenberg's Bible was printed around 1455. About 180 copies were made; 49 are known today." },
  { id: "hb-gown", name: "Scholar's gown", price: 160, style: "lapel", hood: ["#1a2a5e", "#0b1330", "#020510"], trim: "#E2B04A", lapel: "#8E2A6E", note: "University gowns grew from the clerical dress of medieval scholars. Oxford was teaching by 1096." },
  { id: MANTLE, name: "Master Illuminator's mantle", earned: true, how: "Finish an illuminated page in the Illuminator", style: "lapel", hood: ["#8E2A6E", "#4a0a3a", "#14000e"], trim: "#FADE8C", lapel: "#3D6BE0", note: "Illuminators laid gold leaf before the paint, so stray colour could be cleaned off the gold." },
];
export const habitOf = (id) => HABITS.find((c) => c.id === id) || HABITS[0];
const swatch = (c) => `<svg viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="hb-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.hood[0]}"/><stop offset=".5" stop-color="${c.hood[1]}"/><stop offset="1" stop-color="${c.hood[2]}"/></linearGradient></defs>
  <g transform="translate(0 -150)"><path d="M200 230 C250 232 300 250 312 290 L340 400 H60 L88 290 C100 250 150 232 200 230Z" fill="url(#hb-g)" stroke="${c.trim}" stroke-width="3"/>${coatOverlay(c)}</g></svg>`;
export const habitShop = {
  kind: "habit", label: "🪶 Wren's habits and gowns",
  items: HABITS.map(({ id, name, note, price, earned, how }) => ({ id, name, note, ...(earned ? { earned, how } : { price }) })),
  talk: {
    open: ["Habits and gowns. Every one was worn by real people who kept the marks.", "Pick one. I'll wear it at the desk. Ink stains included.", "The mantle you earn: finish an illuminated page and it's yours."],
    tryon: ["{item}. The sleeves clear the inkwell. Good.", "{item}. Very scholarly. Slightly dusty.", "{item}. It suits the candlelight."],
    buy: ["{item}, folded on the chest by the desk.", "{item}! Ready for a long day of copying.", "{item} is yours. Pockets: one penknife, two quills."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(swatch(habitOf(id))); ctx.cap("🪶 " + habitOf(id).name); },
};
/** The Illuminator room calls this when a page is finished: the mantle is earned. */
export function grantMantle(p) {
  p.houses = p.houses || {}; (p.houses.scriptorium ||= {}).illuminated = true;
  p.owned = p.owned || []; if (!p.owned.includes(MANTLE)) p.owned.push(MANTLE); return p;
}
