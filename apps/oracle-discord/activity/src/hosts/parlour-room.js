// Madame Rook's House, Phase 1: the séance parlour behind her, the spirit bell under a glass dome where the crystal ball
// was, her 8 poses (each one gives a trick away), reactions, 8 séance emotes and her gowns. Every fact in a line is real.
import { coatOverlay } from "./alchemist-lab.js";

// ---- the parlour: séances were held after dark, so the lamp dims through the evening and the candles take over ----
/** 0 (bright day) .. 1 (deep night): how dark the parlour is. */
export const gloom = (h) => +(0.5 - 0.5 * Math.cos((2 * Math.PI * (h - 13)) / 24)).toFixed(3);
export function parlourSceneHtml(at = Date.now(), { prog = {}, motes = 14, rnd = Math.random } = {}) {
  const g = gloom(new Date(at).getHours());
  const curtain = (side) => `<svg class="pr-curtain pr-${side}" viewBox="0 0 40 120" preserveAspectRatio="none" aria-hidden="true"><path d="M0 0H40V6Q30 60 34 120H0Z" fill="#4a1640"/>${[6, 14, 22, 30].map((x) => `<path d="M${x} 6Q${x - 3} 60 ${x + 1} 120" stroke="#2A0F24" stroke-width="1.6" fill="none" opacity=".7"/>`).join("")}<path d="M0 0H40V7H0Z" fill="#B8893A"/></svg>`;
  const cabinet = `<svg class="pr-cabinet mb-hot" data-tap="cabinet" viewBox="0 0 60 100" aria-hidden="true"><title>A spirit cabinet: the Davenport brothers were tied up inside one, and still the instruments played</title>
    <rect x="4" y="6" width="52" height="92" fill="#3a1a12" stroke="#B8893A" stroke-width="2"/><rect x="8" y="12" width="21" height="80" fill="#2a120c"/><rect x="31" y="12" width="21" height="80" fill="#2a120c"/><path d="M6 6L30 0L54 6" fill="#3a1a12" stroke="#B8893A"/>
    <circle cx="27" cy="54" r="1.6" fill="#FADE8C"/><circle cx="33" cy="54" r="1.6" fill="#FADE8C"/><g class="pr-wisp"><path d="M30 40q8 -10 0 -20q-8 -8 2 -16" stroke="#C3A6FF" stroke-width="2" fill="none" opacity=".6"/></g></svg>`;
  const trumpet = `<svg class="pr-trumpet mb-hot" data-tap="trumpet" viewBox="0 0 50 60" aria-hidden="true"><title>A spirit trumpet: luminous paint on the rim let sitters 'see' it float in the dark</title><path d="M18 56 L24 6 L30 6 L36 56Z" fill="#9aa0aa" stroke="#4a4a52"/><ellipse cx="27" cy="56" rx="9" ry="3" fill="none" stroke="#c8ffb0" stroke-width="1.6" class="pr-lum"/></svg>`;
  const table = `<div class="pr-table"></div>`;
  const dust = Array.from({ length: motes }, () => `<i style="--x:${(rnd() * 100).toFixed(0)}%;--y:${(30 + rnd() * 60).toFixed(0)}%;--d:${(rnd() * 9).toFixed(1)}s;--t:${(9 + rnd() * 9).toFixed(1)}s"></i>`).join("");
  return `<div class="sc parlour" data-gloom="${g}">${curtain("l")}${curtain("r")}${cabinet}${trumpet}${table}<div class="sc-dust">${dust}</div>
    <div class="pr-dark" style="opacity:${(0.1 + 0.35 * g).toFixed(2)}"></div><div class="pr-candle" style="opacity:${(0.25 + 0.6 * g).toFixed(2)}"></div></div>`;
}

// ---- her figure: a spirit bell under a glass dome where the crystal ball was; pose props; reaction pieces ----
export const POSES = { think: "slate", curious: "lorgnette", nod: "planchette", wow: "bell", smug: "thread", flinch: "veil", nervous: "cheesecloth", dizzy: "tilt" };
export const bellJarSvg = (id) => `<g class="pb-jar"><ellipse cx="200" cy="312" rx="64" ry="58" class="pb-glow" opacity=".2"/>
  <ellipse cx="200" cy="356" rx="50" ry="8" fill="#3a1a12" stroke="#B8893A" stroke-width="2"/>
  <g class="pb-bell"><path d="M200 292 v-10" stroke="#B8893A" stroke-width="3"/><path d="M178 340 Q178 296 200 294 Q222 296 222 340 L228 346 H172Z" fill="#B8893A" stroke="#6b3f12" stroke-width="1.6"/><circle cx="200" cy="350" r="4" fill="#6b3f12"/></g>
  <g class="pb-dings" fill="none" stroke="#FFE3A3" stroke-width="2" stroke-linecap="round"><path d="M240 304 l8 -4 M242 316 h9 M240 328 l8 4"/><path d="M160 304 l-8 -4 M158 316 h-9 M160 328 l-8 4"/></g>
  <path d="M152 352 V300 Q152 254 200 252 Q248 254 248 300 V352" fill="#e8f4ff" fill-opacity=".08" stroke="#e8f4ff" stroke-opacity=".7" stroke-width="2.4"/><circle cx="200" cy="248" r="5" fill="#e8f4ff" fill-opacity=".5"/>
  <path d="M166 300 Q168 272 190 262" stroke="#fff" stroke-opacity=".45" stroke-width="4" fill="none" stroke-linecap="round"/>
  <g class="pb-cards">${Array.from({ length: 9 }, (_, i) => { const a = (i / 9) * Math.PI * 2, x = (200 + 70 * Math.cos(a)).toFixed(0), y = (300 + 60 * Math.sin(a)).toFixed(0); return `<rect style="--d:${(i * 0.06).toFixed(2)}s" x="${x - 7}" y="${y - 10}" width="14" height="20" rx="2" fill="#FFF6EE" stroke="#C3A6FF" transform="rotate(${i * 40} ${x} ${y})"/>`; }).join("")}</g></g>`;
export const propsSvg = () => `<g class="pb-props">
  <g class="hp hp-slate"><g transform="rotate(-10 150 268)"><rect x="112" y="240" width="64" height="48" rx="3" fill="#2a2e34" stroke="#7a5a32" stroke-width="4"/><path class="hp-chalk" d="M122 258 q6 -6 10 0 t10 0 M122 272 h30" stroke="#e8eef4" stroke-width="1.8" fill="none"/></g></g>
  <g class="hp hp-lorgnette"><path d="M282 286 L262 250" stroke="#B8893A" stroke-width="4" stroke-linecap="round"/><circle cx="250" cy="240" r="11" fill="#e8f4ff" fill-opacity=".2" stroke="#B8893A" stroke-width="2.4"/><circle cx="274" cy="236" r="11" fill="#e8f4ff" fill-opacity=".2" stroke="#B8893A" stroke-width="2.4"/></g>
  <g class="hp hp-planchette"><path d="M130 296 Q150 250 176 258 Q196 268 178 300Z" fill="#6b3a1e" stroke="#2a120c" stroke-width="1.6"/><circle cx="160" cy="278" r="6" fill="#e8f4ff" fill-opacity=".3" stroke="#FADE8C"/></g>
  <g class="hp hp-thread"><path d="M262 236 Q236 270 214 300" stroke="#fff" stroke-width="1" stroke-dasharray="3 2"/><circle cx="214" cy="300" r="2" fill="#fff"/></g>
  <g class="hp hp-cloth"><path class="hp-wave" d="M200 182 Q186 220 206 250 Q226 284 196 320 Q182 340 204 360" stroke="#f4f0ff" stroke-width="16" fill="none" stroke-linecap="round" opacity=".75"/><path d="M200 182 Q186 220 206 250 Q226 284 196 320" stroke="#c8c0d8" stroke-width="1" fill="none" stroke-dasharray="2 2"/></g>
</g>`;
export const REACT = {
  "poke-eye": { cls: "pb-lift", ms: 1000, say: ["The veil's lace, darling. Mediums sat in the dark so nobody saw their hands.", "Peek all you like. Margaret Fox admitted in 1888 the 'raps' were her toe joints."] },
  "poke-orb": { cls: "pb-ring", ms: 1400, say: ["Ding! A bell under glass can't ring by itself. Unless someone tips the table.", "In 1853 Faraday showed table-turning came from sitters' own unconscious pushes."] },
  perfect: { cls: "pb-reveal", ms: 1800 },
  lose: { cls: "pb-out", ms: 3200, dark: 5000, gesture: "swatL" },
};
export function react(kind, { teller, scene, gesture, reduced = false } = {}) {
  const r = REACT[kind]; if (!r || !teller) return null;
  if (!reduced) { teller.classList.remove(r.cls); void teller.offsetWidth; teller.classList.add(r.cls); setTimeout(() => teller.classList.remove(r.cls), r.ms); }
  if (r.dark && scene) { scene.classList.add("lights-out"); setTimeout(() => scene.classList.remove("lights-out"), r.dark); }
  if (r.gesture && gesture) setTimeout(() => gesture(r.gesture), reduced ? 0 : 1600); // she waves the smoke off
  return r.say ? r.say[Math.floor(Math.random() * r.say.length)] : null;
}

// ---- her 8 séance emotes: the 8 starting emotes, re-dressed (ids, levels and slots stay the same) ----
export const SEANCE_EMOTES = {
  wave: { e: "🔔", name: "Spirit bell", mood: "wow", say: "A bell rang in the dark! Under the table, a medium's foot is a very busy spirit.", fx: { p: ["🔔", "✦"], m: "burst" } },
  love: { e: "🕯️", name: "Candlelight", mood: "nod", say: "Low light, darling. Séances were dim because darkness hides the method.", fx: { p: ["🕯️", "✦"], m: "rise" } },
  laugh: { e: "👻", name: "Cheesecloth ghost", mood: "laugh", say: "Ectoplasm! In 1931 Harry Price's tests suggested Helen Duncan's was cheesecloth.", fx: { p: ["👻", "〰️"], m: "swirl" } },
  gasp: { e: "🎺", name: "Spirit trumpet", mood: "dizzy", say: "The trumpet floats! Luminous paint on the rim, a rod, and a medium in the dark.", fx: { p: ["🎺", "♪"], m: "orbit" } },
  spook: { e: "✋", name: "Table tip", mood: "curious", say: "The table tips! Faraday showed in 1853 the sitters were pushing it themselves.", fx: { p: ["✋", "🪑"], m: "fall" } },
  dance: { e: "🃏", name: "The reveal", mood: "cheer", say: "Ta-da! A magician's oath says never tell. A debunker's job is to tell.", fx: { p: ["🃏", "✨"], m: "rise" } },
  wink: { e: "🔍", name: "Expose!", mood: "flinch", say: "Exposed! Henry Slade's 'spirit slates' landed him in a London court in 1876.", fx: { p: ["🔍", "✦"], m: "burst" } },
  think: { e: "🔮", name: "Cold read", mood: "think", say: "'You have a great need for others to like you.' Forer showed in 1949 everyone agrees.", fx: { p: ["🔮", "💭"], m: "swirl" } },
};

const MOOD_GLOW = { joy: "#FFE3A3", cheer: "#FFB400", love: "#E7A0B4", laugh: "#c8ffb0", wow: "#F3EAFF", curious: "#C3A6FF", think: "#8A7F99", nod: "#C3A6FF", shake: "#c4ccd6",
  wink: "#E7A0B4", flinch: "#ffffff", sad: "#5a8cff", sulk: "#6a6a8a", smug: "#B8893A", angry: "#B3123A", sleepy: "#3a3a6a", nervous: "#c8ffb0", dizzy: "#C3A6FF" };
export const ROOM_CSS = `
body[data-house="parlour"]{--pglow:#C3A6FF}
${Object.entries(MOOD_GLOW).map(([m, c]) => `body[data-house="parlour"] [data-mood="${m}"]{--pglow:${c}}`).join("")}
body[data-house="parlour"] .o-ball>:not(.pb-jar){display:none}
.pb-glow{fill:var(--pglow);transition:fill .5s}
.pb-bell{transform-origin:200px 284px;transform-box:view-box}
.pb-dings,.pb-cards,.pb-props .hp{opacity:0;transition:opacity .25s}
body[data-house="parlour"] [data-mood="think"] .hp-slate,body[data-house="parlour"] [data-mood="curious"] .hp-lorgnette,body[data-house="parlour"] [data-mood="nod"] .hp-planchette,body[data-house="parlour"] [data-mood="smug"] .hp-thread,body[data-house="parlour"] [data-mood="nervous"] .hp-cloth{opacity:1}
body[data-house="parlour"] [data-mood="wow"] .pb-dings{opacity:1}body[data-house="parlour"] [data-mood="wow"] .pb-bell{animation:pb-ring .18s ease-in-out 6}@keyframes pb-ring{25%{transform:rotate(12deg)}75%{transform:rotate(-12deg)}}
body[data-house="parlour"] [data-mood="flinch"] .hk-veil{transform:translateY(-14px);opacity:.4}.h-rook .hk-veil{transition:transform .35s,opacity .35s}
body[data-house="parlour"] [data-mood="dizzy"] .pb-jar{animation:pb-tilt 1.2s ease-in-out infinite alternate;transform-origin:200px 356px;transform-box:view-box}@keyframes pb-tilt{from{transform:rotate(-7deg)}to{transform:rotate(7deg)}}
.hp-chalk{stroke-dasharray:60;animation:pb-chalk 1.4s linear infinite}@keyframes pb-chalk{from{stroke-dashoffset:60}to{stroke-dashoffset:0}}
body[data-house="parlour"] [data-mood="nod"] .hp-planchette{animation:pb-glide 1.6s ease-in-out infinite alternate;transform-box:view-box}@keyframes pb-glide{to{transform:translate(14px,-6px)}}
.hp-wave{stroke-dasharray:240;animation:pb-cloth 1.6s ease-out both}@keyframes pb-cloth{from{stroke-dashoffset:240}to{stroke-dashoffset:0}}
.teller.pb-lift .hk-veil{animation:pb-lift .9s ease-in-out}@keyframes pb-lift{40%{transform:translateY(-16px);opacity:.3}}
.teller.pb-ring .pb-dings{opacity:1}.teller.pb-ring .pb-bell{animation:pb-ring .16s ease-in-out 8}
.teller.pb-reveal .pb-cards{opacity:1}.teller.pb-reveal .pb-cards rect{animation:pb-card 1.6s ease-out both;animation-delay:var(--d);transform-box:fill-box;transform-origin:50% 50%}@keyframes pb-card{0%{transform:scale(0) rotate(0)}40%{transform:scale(1.2) rotate(180deg)}100%{transform:scale(1) rotate(360deg);opacity:0}}
.teller.pb-out .hk-flame,.teller.pb-out .rk-flame{opacity:0;transition:opacity .2s}
.pr-curtain{position:absolute;top:0;height:92%;width:clamp(30px,9%,70px);opacity:.9}.pr-l{left:0}.pr-r{right:0;transform:scaleX(-1)}
.pr-cabinet{position:absolute;left:9%;top:30%;width:clamp(44px,11%,84px);opacity:.88}
.pr-wisp{animation:pb-wisp 5s ease-in-out infinite}@keyframes pb-wisp{0%,100%{opacity:0;transform:translateY(4px)}50%{opacity:1;transform:translateY(-4px)}}
.pr-trumpet{position:absolute;right:10%;top:44%;width:clamp(26px,6%,46px);opacity:.85;animation:pb-float 6s ease-in-out infinite}@keyframes pb-float{50%{transform:translateY(-8px) rotate(-6deg)}}
.pr-lum{animation:hk-tw 3s ease-in-out infinite}@keyframes hk-tw{0%,100%{opacity:.35}50%{opacity:1}}
.pr-table{position:absolute;left:0;right:0;bottom:0;height:7%;background:linear-gradient(#4a1e3a,#1a0814);border-top:2px solid #C3A6FF;opacity:.85}
.pr-dark{position:absolute;inset:0;background:#05010a;pointer-events:none;transition:opacity 1.2s}.scene.lights-out .pr-dark{opacity:.7!important}
.pr-candle{position:absolute;left:30%;bottom:0;width:40%;height:50%;background:radial-gradient(circle at 50% 95%,rgba(255,200,120,.3),transparent 60%);mix-blend-mode:screen;pointer-events:none}
.scene .mb-hot{pointer-events:auto;cursor:pointer}
@media (prefers-reduced-motion: reduce){.hp-chalk,.hp-wave,.pr-wisp,.pr-trumpet,.pr-lum,[data-mood] .pb-jar,[data-mood] .pb-bell,[data-mood="nod"] .hp-planchette{animation:none!important}}`;

// ---- her outfit line: gowns and stage clothes (prog.gown). The Debunker's cloak is earned, never sold ----
export const DEBUNKER = "gw-debunker";
export const GOWNS = [
  { id: "gw-mourning", name: "Victorian mourning dress", price: 0, style: "lapel", hood: ["#3a3040", "#16101c", "#050208"], trim: "#C3A6FF", lapel: "#241a2a", note: "Queen Victoria wore mourning black for 40 years after Prince Albert died in 1861." },
  { id: "gw-tails", name: "Stage illusionist's tailcoat", price: 60, style: "lapel", hood: ["#2a2a36", "#101018", "#030306"], trim: "#FADE8C", lapel: "#f4f4f4", note: "Robert-Houdin, a French clockmaker, put magicians in evening dress in the 1840s." },
  { id: "gw-spiritualist", name: "Spiritualist's white robe", price: 100, style: "suit", hood: ["#f4f0ff", "#cfc6e2", "#6a5a8a"], trim: "#C3A6FF", lapel: "#e6dff4", note: "Spiritualism began in 1848 with the Fox sisters' 'rapping' in Hydesville, New York." },
  { id: "gw-tweed", name: "Psychical investigator's tweed", price: 140, style: "lapel", hood: ["#7a6a4a", "#4a3e2a", "#14100a"], trim: "#B8893A", lapel: "#5a4a32", note: "The Society for Psychical Research was founded in London in 1882 to test séance claims." },
  { id: "gw-sequins", name: "Magician's sequinned costume", price: 160, style: "bands", hood: ["#B3123A", "#6a0820", "#200008"], trim: "#FADE8C", lapel: "#8a0a2c", note: "Adelaide Herrmann, billed as the Queen of Magic, even performed the bullet catch." },
  { id: "gw-escape", name: "Escape artist's suit", price: 180, style: "suit", hood: ["#2a4a6a", "#14283e", "#040a14"], trim: "#c8ccd6", lapel: "#1e3a56", note: "Houdini first performed the Water Torture Cell in public in Berlin in 1912." },
  { id: DEBUNKER, name: "The Debunker's cloak", earned: true, how: "Solve every Level 3 case in the Case Files", style: "lapel", hood: ["#4a1640", "#1a0614", "#060004"], trim: "#FFE3A3", lapel: "#2A0F24", note: "In 1924 Houdini sat on a Scientific American committee that tested the medium 'Margery'. He called her a fraud." },
];
export const gownOf = (id) => GOWNS.find((c) => c.id === id) || GOWNS[0];
const swatch = (c) => `<svg viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="gw-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.hood[0]}"/><stop offset=".5" stop-color="${c.hood[1]}"/><stop offset="1" stop-color="${c.hood[2]}"/></linearGradient></defs>
  <g transform="translate(0 -150)"><path d="M200 230 C250 232 300 250 312 290 L340 400 H60 L88 290 C100 250 150 232 200 230Z" fill="url(#gw-g)" stroke="${c.trim}" stroke-width="3"/>${coatOverlay(c)}</g></svg>`;
export const gownShop = {
  kind: "gown", label: "🎭 Rook's gowns and stage clothes",
  items: GOWNS.map(({ id, name, note, price, earned, how }) => ({ id, name, note, ...(earned ? { earned, how } : { price }) })),
  talk: {
    open: ["My wardrobe, darling: half medium, half magician. Same thing, different poster.", "Every one of these was worn by someone who fooled a room. Or caught someone fooling one.", "The cloak you earn: solve every Level 3 case in the Case Files."],
    tryon: ["{item}. Dramatic. Hides a trick or two.", "{item}. Lights down... and the reveal!", "{item}. The sleeves are deep. For reasons."],
    buy: ["{item}, darling. It's on the rail behind the curtain.", "{item}! Showtime.", "{item} is yours. Check the pockets: one card, one wire, one secret."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(swatch(gownOf(id))); ctx.cap("🎭 " + gownOf(id).name); },
};
/** Case Files calls this once every Level 3 case is solved: the Debunker's cloak is earned. */
export function grantDebunker(p) {
  p.houses = p.houses || {}; (p.houses.parlour ||= {}).debunker = true;
  p.owned = p.owned || []; if (!p.owned.includes(DEBUNKER)) p.owned.push(DEBUNKER); return p;
}
