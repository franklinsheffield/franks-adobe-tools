// Keeper Altair's House, Phase 1: the dome scene behind him, the astrolabe he holds where the crystal ball was, his 8
// observing poses, his reactions, his 8 sky emotes and his observing coats. Every fact in a line is real.
import { coatOverlay } from "./alchemist-lab.js";
import { houseRank } from "../obsprog.js";

// ---- the dome: slit open at night (real Moon phase in the slit), shutters closed by day; the telescope tracks slowly ----
const SYNODIC = 29.530588853, NEW_MOON = Date.UTC(2000, 0, 6, 18, 14); // a known new moon (6 January 2000, 18:14 UTC)
/** Moon phase 0..1 (0 new, 0.5 full) at a time. */
export const moonPhase = (at = Date.now()) => { const d = ((at - NEW_MOON) / 86400000) % SYNODIC; return +(((d + SYNODIC) % SYNODIC) / SYNODIC).toFixed(3); };
export const domeOpen = (at = Date.now()) => { const h = new Date(at).getHours(); return h >= 19 || h < 6; };
/** The lit part of the Moon as an SVG path (radius r, centre cx, cy). */
export function moonPath(phase, cx, cy, r) {
  const k = Math.cos(phase * 2 * Math.PI), waxing = phase < 0.5, sx = waxing ? 1 : 0; // the terminator is an ellipse of half-width r*|k|
  return `M${cx} ${cy - r} A${r} ${r} 0 0 ${sx} ${cx} ${cy + r} A${(r * Math.abs(k)).toFixed(2)} ${r} 0 0 ${k > 0 ? 1 - sx : sx} ${cx} ${cy - r}Z`;
}
export function domeSceneHtml(at = Date.now(), { prog = {}, motes = 14, rnd = Math.random } = {}) {
  const open = domeOpen(at), ph = moonPhase(at), full = Math.abs(ph - 0.5) < 0.034;
  const stars = Array.from({ length: 26 }, (_, i) => `<circle class="od-tw" style="--d:${((i * 0.61) % 4).toFixed(2)}s" cx="${(44 + ((i * 37) % 32)).toFixed(0)}" cy="${(8 + ((i * 53) % 52)).toFixed(0)}" r="${(0.35 + (i % 3) * 0.25).toFixed(2)}" fill="#DCE6FF"/>`).join("");
  const dome = `<svg class="od-dome" viewBox="0 0 120 70" aria-hidden="true"><defs><clipPath id="od-slit"><rect x="44" y="2" width="32" height="68"/></clipPath>
    <linearGradient id="od-shell" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#1a2547"/><stop offset=".5" stop-color="#3a4a78"/><stop offset="1" stop-color="#1a2547"/></linearGradient></defs>
    <path d="M2 70 A58 62 0 0 1 118 70Z" fill="url(#od-shell)" stroke="#8FB8FF" stroke-opacity=".5"/>${[22, 40, 80, 98].map((x) => `<path d="M${x} 70 Q${60 + (x - 60) * 0.35} 14 60 8" fill="none" stroke="#0B1530" stroke-width=".8" opacity=".7"/>`).join("")}
    <g clip-path="url(#od-slit)"><rect x="44" y="2" width="32" height="68" fill="#050a18"/>${stars}
      <g class="mb-hot" data-tap="moon"><title>Tonight's Moon (${Math.round((1 - Math.cos(ph * 2 * Math.PI)) * 50)}% lit)</title><circle cx="62" cy="22" r="7" fill="#1a2140"/><path d="${moonPath(ph, 62, 22, 7)}" fill="#f1ecd6"/></g>
      <g class="od-shut mb-hot${open ? "" : " shut"}" data-tap="dome"><rect x="44" y="2" width="16" height="68" fill="#2b3a66" stroke="#0B1530"/><rect x="60" y="2" width="16" height="68" fill="#2b3a66" stroke="#0B1530"/>${[16, 34, 52].map((y) => `<path d="M44 ${y}H76" stroke="#0B1530" stroke-width=".8"/>`).join("")}</g>
      <g class="od-cloud"><ellipse cx="52" cy="26" rx="12" ry="6" fill="#5a6480"/><ellipse cx="66" cy="20" rx="13" ry="7" fill="#6a7490"/><ellipse cx="72" cy="30" rx="10" ry="5" fill="#4a5470"/></g></g>
    <path d="M44 2 V70 M76 2 V70" stroke="#E2B04A" stroke-width="1.2" opacity=".7"/>
    <g class="od-rank"><title>Your Observatory rank${(() => { const r = houseRank(prog); return r.next ? `: ${r.xp} of ${r.next.at} to ${r.next.name}` : ""; })()}</title><rect x="26" y="55" width="68" height="13" rx="2" fill="#0B1530" stroke="#E2B04A" stroke-width=".8"/><text x="60" y="64" font-size="7" text-anchor="middle" fill="#FADE8C" font-family="Georgia,serif">★ ${houseRank(prog).name}</text></g></svg>`;
  const scope = `<svg class="od-scope" viewBox="0 0 80 90" aria-hidden="true"><path d="M40 88 L28 60 M40 88 L52 60 M40 88 V58" stroke="#5a6480" stroke-width="3" stroke-linecap="round"/><circle cx="40" cy="56" r="5" fill="#C88A3A"/>
    <g class="od-tube"><rect x="10" y="44" width="60" height="11" rx="3" fill="#dfe6f4" stroke="#2A3F6E" stroke-width="1.5" transform="rotate(-38 40 50)"/><rect x="62" y="41" width="10" height="17" rx="2" fill="#C88A3A" transform="rotate(-38 40 50)"/><rect x="6" y="47" width="6" height="5" fill="#2A3F6E" transform="rotate(-38 40 50)"/></g></svg>`;
  const board = `<svg class="od-board" viewBox="0 0 80 52" aria-hidden="true"><rect x="2" y="2" width="76" height="46" rx="2" fill="#1f2a24" stroke="#7a5a32" stroke-width="3"/>
    <text x="40" y="20" font-size="9" text-anchor="middle" fill="#e8eef4" font-family="Georgia,serif" opacity=".85">T² ∝ a³</text><text x="40" y="32" font-size="5" text-anchor="middle" fill="#e8eef4" font-family="Georgia,serif" opacity=".6">Kepler, 1619</text>
    <ellipse cx="62" cy="40" rx="10" ry="4" fill="none" stroke="#e8eef4" stroke-opacity=".5" stroke-width=".7"/><circle cx="58" cy="40" r="1.4" fill="#FADE8C"/></svg>`;
  const desk = `<div class="od-desk"></div><svg class="od-torch" viewBox="0 0 30 40" aria-hidden="true"><rect x="10" y="12" width="10" height="24" rx="3" fill="#3a3a44"/><rect x="8" y="6" width="14" height="8" rx="2" fill="#5a1414"/><circle cx="15" cy="8" r="4" fill="#ff3a3a" class="od-red"/></svg>`;
  const dust = Array.from({ length: motes }, () => `<i style="--x:${(rnd() * 100).toFixed(0)}%;--y:${(30 + rnd() * 60).toFixed(0)}%;--d:${(rnd() * 9).toFixed(1)}s;--t:${(9 + rnd() * 9).toFixed(1)}s"></i>`).join("");
  return `<div class="sc dome${open ? " open" : ""}${full ? " fullmoon" : ""}" data-phase="${ph}">${dome}${scope}${board}${desk}<div class="sc-dust">${dust}</div><div class="od-redglow"></div></div>`;
}

// ---- his figure: the astrolabe where the crystal ball was, pose props, reaction pieces (400 x 400 figure space) ----
/** Mood -> observing pose. */
export const POSES = { think: "rete", curious: "spyglass", nod: "chart", wow: "glint", smug: "logbook", flinch: "eyepiece", nervous: "torch", dizzy: "orbit" };
export const astrolabeSvg = (id) => `<g class="ao-astro"><ellipse cx="200" cy="312" rx="66" ry="60" class="ao-glow" opacity=".2"/>
  <circle cx="200" cy="262" r="8" fill="none" stroke="#C88A3A" stroke-width="4"/><circle cx="200" cy="312" r="46" fill="#C88A3A" stroke="#6b3f12" stroke-width="3"/>
  <circle cx="200" cy="312" r="38" fill="#0B1530"/>${Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * Math.PI * 2; return `<path d="M${(200 + 38 * Math.cos(a)).toFixed(1)} ${(312 + 38 * Math.sin(a)).toFixed(1)}L${(200 + (i % 2 ? 42 : 45) * Math.cos(a)).toFixed(1)} ${(312 + (i % 2 ? 42 : 45) * Math.sin(a)).toFixed(1)}" stroke="#3a2208" stroke-width="1"/>`; }).join("")}
  <circle cx="200" cy="312" r="22" fill="none" stroke="#8FB8FF" stroke-opacity=".4"/><path d="M162 312H238M200 274V350" stroke="#8FB8FF" stroke-opacity=".25"/>
  <g class="ao-rete"><circle cx="200" cy="304" r="27" fill="none" stroke="#E2B04A" stroke-width="2.2"/><path d="M200 312 L200 276 M200 312 L226 330 M200 312 L172 326" stroke="#E2B04A" stroke-width="2"/>
    ${[[200, 279], [224, 328], [175, 324], [214, 290]].map(([x, y]) => `<path d="M${x} ${y - 5} L${x + 2} ${y} L${x} ${y + 5} L${x - 2} ${y}Z" class="ao-jewel"/>`).join("")}</g>
  <circle cx="200" cy="312" r="3.4" fill="#FADE8C"/><path d="M164 296 A40 40 0 0 1 184 276" stroke="#fff" stroke-opacity=".45" stroke-width="3" fill="none" stroke-linecap="round"/>
  <g class="ao-glints">${[[166, 284], [236, 300], [210, 346]].map(([x, y], i) => `<path style="--d:${i * 0.12}s" d="M${x} ${y - 7} L${x + 1.6} ${y - 1.6} L${x + 7} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 7} L${x - 1.6} ${y + 1.6} L${x - 7} ${y} L${x - 1.6} ${y - 1.6}Z" fill="#fff"/>`).join("")}</g>
  <g class="ao-meteors">${Array.from({ length: 7 }, (_, i) => `<path style="--d:${(i * 0.13).toFixed(2)}s" d="M${300 - i * 30} ${150 + (i * 37) % 90} l-34 18" stroke="#e9f0ff" stroke-width="2.4" stroke-linecap="round"/>`).join("")}</g></g>`;
/** Pose props, drawn inside .o-hands so they travel with his hands. One shows at a time, chosen by data-mood (CSS). */
export const propsSvg = () => `<g class="ao-props">
  <g class="hp hp-spyglass"><g transform="rotate(-28 262 250)"><rect x="234" y="242" width="64" height="12" rx="3" fill="#C88A3A" stroke="#6b3f12" stroke-width="1.5"/><rect x="290" y="239" width="14" height="18" rx="3" fill="#E2B04A" stroke="#6b3f12"/><path d="M252 242V254M272 242V254" stroke="#6b3f12"/></g></g>
  <g class="hp hp-chart"><g transform="rotate(-10 150 268)"><rect x="112" y="244" width="70" height="48" rx="2" fill="#0B1530" stroke="#C88A3A" stroke-width="2"/>${[[124, 256], [140, 266], [156, 260], [168, 276], [132, 282]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1.8" fill="#DCE6FF"/>`).join("")}<path d="M124 256L140 266L156 260L168 276" stroke="#8FB8FF" stroke-opacity=".6" fill="none"/><ellipse cx="112" cy="268" rx="4" ry="24" fill="#C88A3A"/><ellipse cx="182" cy="268" rx="4" ry="24" fill="#C88A3A"/></g></g>
  <g class="hp hp-logbook"><g transform="rotate(-12 144 268)"><rect x="118" y="244" width="48" height="58" rx="3" fill="#24345e" stroke="#C88A3A" stroke-width="1.5"/><rect x="122" y="248" width="40" height="50" fill="#e9eef8"/>${[258, 266, 274, 282, 290].map((y) => `<path d="M126 ${y} h32" stroke="#a8b4cc" stroke-width="1"/>`).join("")}<path class="hp-ink" d="M126 264 l3 -3 l3 3 m6 -2 h10" stroke="#1a2350" stroke-width="1.3" fill="none"/></g>
    <g class="hp-pencil"><path d="M168 232 L150 270" stroke="#8FB8FF" stroke-width="5" stroke-linecap="round"/><path d="M150 270 L148 276" stroke="#1a2350" stroke-width="3" stroke-linecap="round"/></g></g>
  <g class="hp hp-torch"><rect x="248" y="272" width="16" height="50" rx="4" fill="#3a3a44" stroke="#111"/><rect x="245" y="262" width="22" height="14" rx="3" fill="#5a1414"/><path class="hp-beam" d="M256 262 L226 196 L290 196Z" fill="#ff3a3a" opacity=".22"/><circle cx="256" cy="268" r="5" fill="#ff5a5a"/></g>
</g>`;
/** Little planets circling his head (dizzy) and a raincloud over the eyepiece (a lost game). Over the face. */
export const headSvg = () => `<g class="ao-orbit">${[["#FADE8C", 0], ["#8FB8FF", 0.33], ["#e3173e", 0.66]].map(([c, d]) => `<circle style="--d:-${d * 1.6}s" cx="200" cy="92" r="6" fill="${c}"/>`).join("")}</g>
  <g class="ao-rain"><ellipse cx="186" cy="102" rx="22" ry="12" fill="#6a7490"/><ellipse cx="212" cy="96" rx="24" ry="14" fill="#7a84a0"/>${[178, 194, 210, 224].map((x, i) => `<path style="--d:${i * 0.15}s" d="M${x} 116 l-3 10" stroke="#8FB8FF" stroke-width="2" stroke-linecap="round"/>`).join("")}</g>`;
/** Reactions: what a poke, a win or a loss does to him (class on the teller, plus clouds over the dome's slit). */
export const REACT = {
  "poke-eye": { cls: "ao-focus", ms: 1000, say: ["Refocusing. Magnification is the telescope's focal length divided by the eyepiece's.", "Careful! Never look at the Sun through an eyepiece. Not even for a moment."] },
  "poke-orb": { cls: "ao-spin", ms: 1800, say: ["You spun the rete. Its pointers mark bright stars; turn it to match the sky and read the time.", "Astrolabes were made for over a thousand years. The oldest surviving ones are from the 900s."] },
  perfect: { cls: "ao-shower", ms: 1800 },
  lose: { cls: "ao-cloudy", ms: 3400, cloud: 6000, gesture: "swatL" },
};
export function react(kind, { teller, scene, gesture, reduced = false } = {}) {
  const r = REACT[kind]; if (!r || !teller) return null;
  if (!reduced) { teller.classList.remove(r.cls); void teller.offsetWidth; teller.classList.add(r.cls); setTimeout(() => teller.classList.remove(r.cls), r.ms); }
  if (r.cloud && scene) { scene.classList.add("clouded"); setTimeout(() => scene.classList.remove("clouded"), r.cloud); }
  if (r.gesture && gesture) setTimeout(() => gesture(r.gesture), reduced ? 0 : 1700); // he waves the cloud away
  return r.say ? r.say[Math.floor(Math.random() * r.say.length)] : null;
}

// ---- his 8 sky emotes: the 8 starting emotes, re-dressed (ids, levels and slots stay the same) ----
export const SKY_EMOTES = {
  wave: { e: "🌠", name: "Shooting star", mood: "wow", say: "A shooting star is a meteor: a speck of dust burning up about 100 km above us.", fx: { p: ["🌠", "✦"], m: "fall" } },
  love: { e: "🌙", name: "Moonrise", mood: "nod", say: "The Moon rises about 50 minutes later each day, on average.", fx: { p: ["🌙", "✦"], m: "rise" } },
  laugh: { e: "✨", name: "Twinkle", mood: "laugh", say: "Stars twinkle because moving air bends their light. Planets show a disc, so they twinkle less.", fx: { p: ["✨", "⋆"], m: "burst" } },
  gasp: { e: "☄️", name: "Comet!", mood: "dizzy", say: "Halley's Comet comes back about every 76 years. Next time: 2061.", fx: { p: ["☄️", "✦"], m: "burst" } },
  spook: { e: "🔭", name: "Look closer", mood: "curious", say: "Galileo's best telescopes magnified about 20 to 30 times. Enough to find Jupiter's moons.", fx: { p: ["🔭", "✦"], m: "orbit" } },
  dance: { e: "🪐", name: "Orbit", mood: "cheer", say: "Saturn's rings are mostly water ice, and in most places only about 10 metres thick.", fx: { p: ["🪐", "⋆"], m: "orbit" } },
  wink: { e: "🌑", name: "Eclipse", mood: "flinch", say: "The Sun is about 400 times wider than the Moon and about 400 times farther away. Perfect fit.", fx: { p: ["🌑", "☀️"], m: "swirl" } },
  think: { e: "🧭", name: "Find north", mood: "think", say: "Polaris sits within 1° of the celestial pole, so it barely moves all night.", fx: { p: ["⭐", "🧭"], m: "swirl" } },
};

const MOOD_GLOW = { joy: "#FADE8C", cheer: "#FFB400", love: "#FF6AB8", laugh: "#8BD630", wow: "#e9f0ff", curious: "#7AD7FF", think: "#B57BE8", nod: "#8FB8FF", shake: "#c4ccd6",
  wink: "#FF4FB3", flinch: "#ffffff", sad: "#5a8cff", sulk: "#6a6a8a", smug: "#E2B04A", angry: "#e3173e", sleepy: "#3a3a6a", nervous: "#ff5a5a", dizzy: "#ff7a1f" };
export const DOME_CSS = `.ha-star{animation:ha-tw 3.2s ease-in-out infinite;transform-origin:226px 134px}@keyframes ha-tw{0%,100%{opacity:.75;transform:scale(1)}50%{opacity:1;transform:scale(1.25)}}@media (prefers-reduced-motion: reduce){.ha-star{animation:none}}

body[data-house="observatory"]{--aglow:#8FB8FF}
${Object.entries(MOOD_GLOW).map(([m, c]) => `body[data-house="observatory"] [data-mood="${m}"]{--aglow:${c}}`).join("")}
body[data-house="observatory"] .o-ball>:not(.ao-astro){display:none}
.ao-glow{fill:var(--aglow);transition:fill .5s}.ao-jewel{fill:var(--aglow);transition:fill .5s}
.ao-rete{transform-origin:200px 312px;transform-box:view-box;animation:hr-spin 60s linear infinite}
.ao-glints,.ao-meteors,.ao-orbit,.ao-rain,.ao-props .hp{opacity:0;transition:opacity .25s}
.h-altair .ha-piece{transition:transform .35s cubic-bezier(.3,1.5,.5,1);transform-origin:200px 152px;transform-box:view-box}
body[data-house="observatory"] [data-mood="think"] .ao-rete{animation-duration:3s}
body[data-house="observatory"] [data-mood="curious"] .hp-spyglass,body[data-house="observatory"] [data-mood="nod"] .hp-chart,body[data-house="observatory"] [data-mood="smug"] .hp-logbook,body[data-house="observatory"] [data-mood="nervous"] .hp-torch{opacity:1}
body[data-house="observatory"] [data-mood="wow"] .ao-glints{opacity:1}[data-mood="wow"] .ao-glints path{animation:a-twinkle .8s ease-out infinite;animation-delay:var(--d);transform-box:fill-box;transform-origin:50% 50%}
body[data-house="observatory"] [data-mood="flinch"] .ha-piece{transform:translateY(-46px)}
body[data-house="observatory"] [data-mood="dizzy"] .ao-orbit{opacity:1}.ao-orbit circle{animation:ao-orb 1.6s linear infinite;animation-delay:var(--d);transform-origin:200px 112px;transform-box:view-box}
@keyframes ao-orb{from{transform:rotate(0) translateX(56px) rotate(0)}to{transform:rotate(360deg) translateX(56px) rotate(-360deg)}}
.hp-beam{animation:ao-beam 1.2s ease-in-out infinite alternate;transform-origin:256px 262px;transform-box:view-box}@keyframes ao-beam{to{transform:rotate(8deg)}}
.teller.ao-focus .ha-piece{animation:ao-focus .9s ease-in-out}@keyframes ao-focus{30%{transform:rotate(-10deg) scale(1.04)}60%{transform:rotate(8deg)}}
.teller.ao-spin .ao-rete{animation:hr-spin .45s linear 4}
.teller.ao-shower .ao-meteors{opacity:1}.teller.ao-shower .ao-meteors path{stroke-dasharray:40;animation:ao-met 1.1s ease-out both;animation-delay:var(--d)}@keyframes ao-met{from{stroke-dashoffset:40;opacity:1}to{stroke-dashoffset:-40;opacity:0}}
.teller.ao-cloudy .ao-rain{opacity:1;animation:ao-rain 3.4s ease-in both}@keyframes ao-rain{0%,60%{opacity:1}100%{opacity:0}}
.ao-rain path{animation:ao-drop .5s linear infinite;animation-delay:var(--d)}@keyframes ao-drop{from{transform:translateY(0);opacity:1}to{transform:translateY(12px);opacity:0}}
.od-dome{position:absolute;left:1%;top:1%;width:clamp(110px,30%,240px);opacity:.75}
.od-shut rect{transition:transform 1.6s ease-in-out}.od-shut:not(.shut) rect:first-child{transform:translateX(-16px)}.od-shut:not(.shut) rect:nth-child(2){transform:translateX(16px)}.od-shut:not(.shut) path{opacity:0}
.od-tw{animation:hk-tw 3s ease-in-out infinite;animation-delay:var(--d)}
.od-cloud{opacity:0;transition:opacity 1.2s}.scene.clouded .od-cloud{opacity:.95}.scene.clouded .od-cloud ellipse{animation:lab-roil 2s ease-in-out infinite alternate}@keyframes lab-roil{to{transform:translate(2px,-2px)}}
.sc.dome.fullmoon .od-dome{filter:drop-shadow(0 0 14px rgba(241,236,214,.35))}
.od-scope{position:absolute;left:3%;top:52%;width:clamp(50px,13%,96px);opacity:.85}.od-tube{transform-origin:40px 50px;transform-box:view-box;animation:od-track 40s ease-in-out infinite alternate}@keyframes od-track{to{transform:rotate(6deg)}}
.od-board{position:absolute;right:3%;top:42%;width:clamp(60px,16%,118px);opacity:.8}
.od-desk{position:absolute;left:0;right:0;bottom:0;height:7%;background:linear-gradient(#2a3556,#0b1124);border-top:2px solid #8FB8FF;opacity:.8}
.od-torch{position:absolute;right:4%;bottom:6.5%;width:clamp(18px,4%,30px);opacity:.9}.od-red{animation:hk-tw 4s ease-in-out infinite}
.od-redglow{position:absolute;right:0;bottom:0;width:35%;height:40%;background:radial-gradient(circle at 88% 88%,rgba(255,40,40,.22),transparent 60%);mix-blend-mode:screen;pointer-events:none}
@media (prefers-reduced-motion: reduce){.ao-rete,.ao-orbit circle,.hp-beam,.od-tw,.od-tube,.od-red,.ao-rain path,.od-cloud ellipse,[data-mood="wow"] .ao-glints path{animation:none}.od-shut rect{transition:none}}`;

// ---- his outfit line: observing coats (domes are kept as cold as the night outside). prog.obscoat ----
export const ROYAL_COAT = "oc-royal";
export const OBS_COATS = [
  { id: "oc-wool", name: "Wool observing coat", price: 0, style: "lapel", hood: ["#4a5878", "#26304a", "#0b1124"], trim: "#8FB8FF", lapel: "#3a4766", note: "Domes are kept as cold as the night outside, so warm air doesn't shimmer in front of the telescope. Hence the coat." },
  { id: "oc-herschel", name: "Herschel's Georgian frock coat", price: 60, style: "lapel", hood: ["#5a3a6a", "#2e1a3a", "#0e0614"], trim: "#E2B04A", lapel: "#40284e", note: "William Herschel found Uranus in 1781 with a telescope he built himself. His sister Caroline found eight comets." },
  { id: "oc-leavitt", name: "Harvard computer's jacket", price: 100, style: "lapel", hood: ["#6a5a4a", "#3a2e22", "#120c06"], trim: "#d8c8a8", lapel: "#4e4234", note: "Henrietta Swan Leavitt, one of Harvard's 'computers', found how Cepheid stars give away their distance (1912)." },
  { id: "oc-maunakea", name: "Summit hi-vis jacket", price: 140, style: "bands", hood: ["#ff9a2a", "#d0600a", "#4a1e02"], trim: "#e8f0ff", lapel: "#d0600a", note: "Mauna Kea's summit is about 4,200 m up, above roughly 40% of the atmosphere. Visitors are warned about altitude sickness." },
  { id: "oc-kao", name: "Airborne observatory flight suit", price: 160, style: "suit", hood: ["#4a6a3a", "#26381e", "#0a1206"], trim: "#FADE8C", lapel: "#3a5a2e", note: "NASA's Kuiper Airborne Observatory flew a telescope in a jet from 1974 to 1995, above most of the water vapour." },
  { id: "oc-polar", name: "South Pole parka", price: 180, style: "suit", hood: ["#e3173e", "#a00a24", "#3a0008"], trim: "#f4f4f4", lapel: "#c8102e", note: "At the South Pole the Sun sets once a year. Telescopes there get months of night." },
  { id: ROYAL_COAT, name: "Astronomer Royal's coat", earned: true, how: "Reach Astronomer Royal at the Almanac Desk", style: "lapel", hood: ["#1a2a5e", "#0b1330", "#020510"], trim: "#FADE8C", lapel: "#14204a", note: "England's Astronomer Royal post was created in 1675. John Flamsteed was the first." },
];
export const obsCoatOf = (id) => OBS_COATS.find((c) => c.id === id) || OBS_COATS[0];
const swatch = (c) => `<svg viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="oc-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.hood[0]}"/><stop offset=".5" stop-color="${c.hood[1]}"/><stop offset="1" stop-color="${c.hood[2]}"/></linearGradient></defs>
  <g transform="translate(0 -150)"><path d="M200 230 C250 232 300 250 312 290 L340 400 H60 L88 290 C100 250 150 232 200 230Z" fill="url(#oc-g)" stroke="${c.trim}" stroke-width="3"/>${coatOverlay(c)}</g></svg>`;
export const obsCoatShop = {
  kind: "obscoat", label: "🧥 Altair's observing coats",
  items: OBS_COATS.map(({ id, name, note, price, earned, how }) => ({ id, name, note, ...(earned ? { earned, how } : { price }) })),
  talk: {
    open: ["Observing coats. The dome is as cold as the night, by design.", "Every coat here kept a real astronomer warm. Pick one for the long nights.", "The gold-trimmed one you earn: become Astronomer Royal at the Almanac Desk."],
    tryon: ["{item}. Warm enough for a long exposure.", "{item}. How do I look? Nocturnal?", "{item}. Fits over the eyepiece strap. Good."],
    buy: ["{item}, on the hook by the dome door.", "{item}! Ready for a clear night.", "{item} is yours. Pockets: one red torch, one star chart."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(swatch(obsCoatOf(id))); ctx.cap("🧥 " + obsCoatOf(id).name); },
};
/** The Almanac Desk calls this when the player reaches Astronomer Royal: the coat is earned. */
export function grantRoyal(p) {
  p.houses = p.houses || {}; (p.houses.observatory ||= {}).royal = true;
  p.owned = p.owned || []; if (!p.owned.includes(ROYAL_COAT)) p.owned.push(ROYAL_COAT); return p;
}
