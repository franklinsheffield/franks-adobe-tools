// The Alchemist's House, Phase 1: Vell's lab scene, her flask (in place of the crystal ball), gloves, 8 lab poses tied
// to her moods, her reactions (poke, win, loss) and her 8 lab emotes. Drawing and rules only; alchemist.js wires it in.
// Every label and line is real chemistry or real history.

/** The philosopher's stone as a rough rock with a red crystal heart (Frank: "a rock, not a red dot"). Inline SVG, text-sized. */
export const STONE_ICON = `<svg class="tok-rock" viewBox="0 0 24 24" width="1.15em" height="1.15em" aria-hidden="true" style="vertical-align:-.2em"><path d="M2.5 15.5 L5.5 7 L11.5 3.5 L19 5.5 L22 12.5 L18.5 20 L8 21.5Z" fill="#6e5f57" stroke="#2a201c" stroke-width="1.2" stroke-linejoin="round"/><path d="M5.5 7 L11.5 3.5 L9 9.5Z" fill="#8f8178"/><path d="M19 5.5 L22 12.5 L16.5 11Z" fill="#54463f"/><path d="M9 9.5 L13.5 7 L16.5 11 L12.5 15.5 L8 13.5Z" fill="#e3173e"/><path d="M13.5 7 L16.5 11 L12.8 10.6Z" fill="#ff8a96"/><path d="M8 13.5 L12.5 15.5 L10 18.5Z" fill="#8a0a22"/><circle cx="11.2" cy="10.4" r="1" fill="#fff" opacity=".8"/></svg>`;

// ---- the lab scene, behind Vell (replaces the Chamber's window, shelf and herbs) ----
/** Reagent jars on the shelf: the old name and the modern formula, both real. */
export const REAGENTS = [
  ["Oil of vitriol", "H₂SO₄", "#d8e6b0"], ["Aqua fortis", "HNO₃", "#f2d878"], ["Quicksilver", "Hg", "#c4ccd6"], ["Saltpetre", "KNO₃", "#f4f2ea"],
  ["Cinnabar", "HgS", "#d0302a"], ["Blue vitriol", "CuSO₄", "#2a7ad8"], ["Sal ammoniac", "NH₄Cl", "#ebe8df"], ["Green vitriol", "FeSO₄", "#6ab07a"],
];
/** How hot the athanor burns at a local hour: banked low before dawn, stoked hottest mid-afternoon (0..1). */
export const athanorHeat = (h) => +(0.5 - 0.5 * Math.cos((2 * Math.PI * (h - 3)) / 24)).toFixed(3);
const mix = (a, b, t) => "#" + [0, 2, 4].map((i) => Math.round(parseInt(a.slice(1 + i, 3 + i), 16) * (1 - t) + parseInt(b.slice(1 + i, 3 + i), 16) * t).toString(16).padStart(2, "0")).join("");
export function labSceneHtml(at = Date.now(), { prog = {}, motes = 14, rnd = Math.random } = {}) {
  const d = new Date(at), h = d.getHours(), heat = athanorHeat(h), fire = mix("#6a1206", "#ffd27a", heat), hh = ((h + 11) % 12) + 1;
  const owned = (((prog.houses || {}).alchemist || {}).relics || []).includes("st-athanor"); // the relic athanor takes its place
  const jar = ([name, f, col], i) => { const x = 3 + (i % 4) * 24, y = i < 4 ? 4 : 38;
    return `<g><title>${name} (${f})</title><rect x="${x}" y="${y + 6}" width="18" height="22" rx="3" fill="${col}" opacity=".7" stroke="#e8d6b0" stroke-opacity=".5"/><rect x="${x + 3}" y="${y + 2}" width="12" height="5" rx="1" fill="#6b4a2a"/>
      <rect x="${x + 1.5}" y="${y + 13}" width="15" height="10" fill="#f3e6c6"/><text x="${x + 9}" y="${y + 17.4}" font-size="3.3" text-anchor="middle" fill="#3a2410" font-family="Georgia,serif">${name}</text><text x="${x + 9}" y="${y + 21.6}" font-size="3.6" text-anchor="middle" fill="#7a1a10" font-family="Georgia,serif">${f}</text></g>`; };
  const shelf = `<svg class="lab-jars" viewBox="0 0 100 68" aria-hidden="true">${REAGENTS.map(jar).join("")}<rect x="0" y="32" width="100" height="3" fill="#5a3a1e"/><rect x="0" y="66" width="100" height="2.5" fill="#5a3a1e"/></svg>`;
  const hood = `<svg class="lab-hood" viewBox="0 0 80 104" aria-hidden="true"><rect x="30" y="0" width="20" height="12" fill="#5a4a3a"/><rect x="4" y="10" width="72" height="90" rx="4" fill="#2a1d14" stroke="#C88A3A" stroke-width="2"/>
    <rect x="10" y="18" width="60" height="56" fill="#9fd4f2" opacity=".12" stroke="#e8d6b0" stroke-opacity=".5"/><path d="M10 46 H70" stroke="#C88A3A" stroke-width="2"/>
    <g class="lab-hflask"><path d="M36 70 V58 L30 46 H50 L44 58 V70Z" transform="translate(0 0)" fill="#66E0C8" fill-opacity=".35" stroke="#e8d6b0" stroke-width="1"/><circle class="lab-hb" cx="39" cy="66" r="1.2" fill="#C9FFF2"/><circle class="lab-hb" style="--d:.7s" cx="42" cy="64" r="1" fill="#C9FFF2"/></g>
    <g class="lab-cloud"><ellipse cx="26" cy="34" rx="16" ry="10" fill="#8a8580"/><ellipse cx="44" cy="28" rx="18" ry="12" fill="#a29c96"/><ellipse cx="56" cy="40" rx="14" ry="10" fill="#7a7570"/><ellipse cx="38" cy="50" rx="22" ry="12" fill="#6a6560"/></g>
    <rect x="8" y="78" width="64" height="18" fill="#3a2a1c"/><text x="40" y="90" font-size="6.5" text-anchor="middle" fill="#E89A55" font-family="Georgia,serif" letter-spacing=".5">FUME HOOD</text></svg>`;
  const ath = owned ? "" : `<svg class="lab-athanor" viewBox="0 0 70 100" aria-hidden="true" style="--heat:${heat}"><title>The athanor at ${hh} o'clock: banked low at night, hottest mid-afternoon</title>
    <path d="M12 98V34q23 -26 46 0v64z" fill="#6a3220" stroke="#2a120a" stroke-width="2"/>${Array.from({ length: 6 }, (_, i) => `<path d="M12 ${46 + i * 9}H58" stroke="#2a120a" stroke-width="1" opacity=".5"/>`).join("")}
    <rect x="26" y="4" width="18" height="18" fill="#4a2414" stroke="#2a120a"/><path d="M22 66 h26 v22 h-26z" fill="#160604"/>
    <ellipse class="lab-fire" cx="35" cy="80" rx="11" ry="8" fill="${fire}" style="opacity:${(0.35 + 0.65 * heat).toFixed(2)}"/><path class="lab-fire" d="M28 86 Q30 72 35 70 Q40 72 42 86Z" fill="${mix("#a02a0a", "#fff3c0", heat)}" style="opacity:${(0.3 + 0.7 * heat).toFixed(2)}"/>
    <circle cx="35" cy="56" r="5" fill="none" stroke="#E2B04A" stroke-width="1.2"/><path d="M35 56 L35 52.5 M35 56 L${(35 + 3 * Math.sin((hh / 12) * 2 * Math.PI)).toFixed(1)} ${(56 - 3 * Math.cos((hh / 12) * 2 * Math.PI)).toFixed(1)}" stroke="#E2B04A" stroke-width="1"/></svg>`;
  const bench = `<div class="lab-bench"></div><svg class="lab-rack" viewBox="0 0 60 44" aria-hidden="true"><rect x="2" y="18" width="56" height="5" fill="#7a4a26"/><rect x="2" y="38" width="56" height="5" fill="#7a4a26"/>
    ${[["#e3173e", 22], ["#FFB400", 16], ["#1FC7A6", 26], ["#B57BE8", 12]].map(([c, l], i) => `<rect x="${8 + i * 12}" y="6" width="7" height="34" rx="3.5" fill="#e8f4ff" fill-opacity=".25" stroke="#e8f4ff" stroke-opacity=".6"/><rect x="${8 + i * 12}" y="${40 - l}" width="7" height="${l}" rx="3.5" fill="${c}" opacity=".75"/>`).join("")}</svg>
    <svg class="lab-burner" viewBox="0 0 50 70" aria-hidden="true"><circle cx="25" cy="30" r="15" fill="#FF4FB3" fill-opacity=".3" stroke="#e8f4ff" stroke-opacity=".7"/><rect x="21" y="4" width="8" height="14" fill="#e8f4ff" fill-opacity=".2" stroke="#e8f4ff" stroke-opacity=".7"/>
    ${[0, 0.5, 1].map((dl, i) => `<circle class="lab-hb" style="--d:${dl}s" cx="${20 + i * 5}" cy="34" r="${1.6 - i * 0.3}" fill="#ffd0ec"/>`).join("")}<path d="M10 46 H40 M14 46 L10 66 M36 46 L40 66" stroke="#8a8a92" stroke-width="2"/><path class="lab-bflame" d="M25 62 Q30 56 25 48 Q20 56 25 62Z" fill="#5aa8ff"/></svg>`;
  const dust = Array.from({ length: motes }, () => `<i style="--x:${(rnd() * 100).toFixed(0)}%;--y:${(30 + rnd() * 60).toFixed(0)}%;--d:${(rnd() * 9).toFixed(1)}s;--t:${(9 + rnd() * 9).toFixed(1)}s"></i>`).join("");
  return `<div class="sc lab" data-heat="${heat}">${hood}${shelf}${ath}${bench}<div class="sc-dust">${dust}</div><div class="lab-glow" style="opacity:${(0.25 + 0.5 * heat).toFixed(2)}"></div></div>`;
}

// ---- Vell's figure: the flask, the goggle wrap, her 8 lab poses and reaction pieces (all 400 x 400 figure space) ----
/** Mood -> lab pose. "Listening" has no mood of its own; she takes notes when smug. */
export const POSES = { think: "swirl", curious: "tube", nod: "pour", wow: "tap", smug: "scribble", flinch: "goggles", nervous: "mitt", dizzy: "soot" };
/** The flask that stands where the crystal ball was. Liquid colour follows her mood (CSS). */
export const flaskSvg = (id) => `<g class="hv-flask"><defs><clipPath id="${id}-flaskclip"><circle cx="200" cy="312" r="41"/></clipPath></defs>
  <ellipse cx="200" cy="312" rx="66" ry="60" class="hv-liqglow" opacity=".22"/>
  <path d="M166 352 L234 352 M174 352 L160 380 M226 352 L240 380 M200 352 L200 380" stroke="#8a8a92" stroke-width="4" stroke-linecap="round"/><ellipse cx="200" cy="352" rx="32" ry="5" fill="none" stroke="#C88A3A" stroke-width="3"/>
  <path class="hv-burn" d="M200 378 Q208 368 200 356 Q192 368 200 378Z" fill="#5aa8ff"/>
  <path d="M189 248 V280 A44 44 0 1 0 211 280 V248Z" fill="#e8f4ff" fill-opacity=".12" stroke="#e8f4ff" stroke-width="2.4" stroke-opacity=".85"/>
  <g clip-path="url(#${id}-flaskclip)"><path class="hv-liq" d="M150 310 Q175 302 200 310 T250 310 V360 H150Z"/>
    ${[[188, 340, 3, 0], [206, 346, 2.4, 0.6], [196, 334, 1.8, 1.1], [214, 336, 2, 1.6]].map(([x, y, r, d]) => `<circle class="hv-bub" style="--d:${d}s" cx="${x}" cy="${y}" r="${r}" fill="#fff" opacity=".7"/>`).join("")}</g>
  <ellipse cx="200" cy="248" rx="13" ry="3.2" fill="none" stroke="#e8f4ff" stroke-width="2.4"/>
  <path d="M174 296 A30 30 0 0 1 192 276" stroke="#fff" stroke-opacity=".5" stroke-width="4" fill="none" stroke-linecap="round"/>
  <g class="hv-tink" fill="none" stroke="#fff" stroke-width="2" stroke-linecap="round"><path d="M246 296 l8 -4 M248 306 h9 M246 316 l8 4"/></g>
  <g class="hv-foam" fill="#f4fbff">${[[192, 246, 8], [204, 240, 9], [214, 248, 7], [198, 232, 7], [210, 226, 6], [186, 238, 5]].map(([x, y, r], i) => `<circle style="--d:${i * 0.08}s" cx="${x}" cy="${y}" r="${r}"/>`).join("")}<path d="M211 250 Q216 266 213 282" stroke="#f4fbff" stroke-width="5" fill="none" stroke-linecap="round"/></g>
  <g class="hv-sparks">${Array.from({ length: 10 }, (_, i) => { const a = (i / 10) * Math.PI * 2, x = (200 + 64 * Math.cos(a)).toFixed(0), y = (300 + 58 * Math.sin(a)).toFixed(0); return `<path style="--d:${(i * 0.05).toFixed(2)}s" d="M${x} ${y - 7} L${+x + 2} ${y - 2} L${+x + 7} ${y} L${+x + 2} ${+y + 2} L${x} ${+y + 7} L${x - 2} ${+y + 2} L${x - 7} ${y} L${x - 2} ${y - 2}Z" fill="#FADE8C" stroke="#fff" stroke-width=".8"/>`; }).join("")}</g>
  <g class="hv-puff">${[[196, 236, 18], [214, 222, 22], [184, 214, 16], [204, 198, 20]].map(([x, y, r], i) => `<circle style="--d:${i * 0.1}s" cx="${x}" cy="${y}" r="${r}" fill="#4a4540"/>`).join("")}</g></g>`;
/** Pose props, drawn inside .o-hands so they travel with her hands. One shows at a time, chosen by data-mood (CSS). */
export const propsSvg = () => `<g class="hv-props">
  <g class="hp hp-tube"><g transform="rotate(14 262 260)"><rect x="255" y="214" width="14" height="62" rx="7" fill="#e8f4ff" fill-opacity=".2" stroke="#e8f4ff" stroke-width="2"/><rect x="255" y="248" width="14" height="28" rx="7" fill="#1FC7A6" opacity=".8"/><rect x="253" y="210" width="18" height="5" rx="2" fill="#C88A3A"/></g></g>
  <g class="hp hp-pour"><g transform="rotate(-48 160 262)"><path d="M146 236 H176 L174 286 Q160 292 148 286Z" fill="#e8f4ff" fill-opacity=".18" stroke="#e8f4ff" stroke-width="2"/><path d="M147 262 H175 L174 286 Q160 292 148 286Z" fill="var(--liq,#66E0C8)" opacity=".8"/></g>
    <path class="hp-stream" d="M184 236 Q197 236 199 250" stroke="var(--liq,#66E0C8)" stroke-width="4" fill="none" stroke-linecap="round"/></g>
  <g class="hp hp-scribble"><g transform="rotate(-12 144 268)"><rect x="118" y="244" width="48" height="58" rx="3" fill="#f3e6c6" stroke="#7a4f12" stroke-width="1.5"/>${[256, 264, 272, 280, 288].map((y) => `<path d="M124 ${y} h36" stroke="#b8a582" stroke-width="1"/>`).join("")}<path class="hp-ink" d="M124 262 q6 -4 10 0 t10 0 t8 -2" stroke="#2a1a0a" stroke-width="1.4" fill="none"/></g>
    <g class="hp-pencil"><path d="M168 232 L150 270" stroke="#E2B04A" stroke-width="5" stroke-linecap="round"/><path d="M150 270 L148 276" stroke="#2a1a0a" stroke-width="3" stroke-linecap="round"/></g></g>
  <g class="hp hp-mitt"><path d="M230 352 C226 318 230 286 246 268 C252 250 270 246 276 262 C282 250 296 258 292 276 C300 300 298 330 288 352Z" fill="#c8402a" stroke="#5a140a" stroke-width="2"/>
    <path d="M238 300 L290 296 M236 322 L292 320 M252 270 L248 350 M272 266 L272 350" stroke="#8a2414" stroke-width="1.4" opacity=".7"/><rect x="228" y="340" width="64" height="14" rx="5" fill="#f3e6c6" stroke="#5a140a"/></g>
  <g class="hp hp-soot"><g transform="translate(300 214)"><rect x="-14" y="-4" width="26" height="24" rx="8" fill="var(--glove,#7a4a26)" stroke="#2a1a0a" stroke-width="1.5"/><rect x="-8" y="-24" width="10" height="24" rx="5" fill="var(--glove,#7a4a26)" stroke="#2a1a0a" stroke-width="1.5"/>
    <circle cx="4" cy="8" r="3" fill="#2a2420" opacity=".7"/><circle cx="-6" cy="14" r="2.4" fill="#2a2420" opacity=".6"/></g></g>
</g>`;
/** Soot on the mask (after a bang, or a lost game). Sits over the face, under the goggle. */
export const sootSvg = () => `<g class="hv-soot" fill="#1a1512">${[[168, 120, 14, 8], [232, 188, 16, 7], [182, 196, 10, 5], [222, 112, 9, 6], [200, 210, 12, 5]].map(([x, y, rx, ry]) => `<ellipse cx="${x}" cy="${y}" rx="${rx}" ry="${ry}" opacity=".55"/>`).join("")}</g>`;
/** Reactions: what a poke, a win or a loss does to her (class on the teller, plus the fume hood behind her). */
export const REACT = {
  "poke-eye": { cls: "hv-adjust", ms: 900, say: ["Mind the goggles! Davy hurt an eye in a nitrogen trichloride blast in 1812. I'm keeping mine.", "Adjusting. Brass rim, glass lens, zero tolerance for fingers."] },
  "poke-orb": { cls: "hv-foaming", ms: 1700, say: ["Now it's foaming! Agitate a fizzy liquid and the dissolved gas rushes out.", "You shook it! That's carbon dioxide escaping, same as a dropped soda."] },
  perfect: { cls: "hv-spark", ms: 1600 },
  lose: { cls: "hv-sooty", ms: 3200, hood: 6000, gesture: "swatL" },
};
export function react(kind, { teller, scene, gesture, reduced = false } = {}) {
  const r = REACT[kind]; if (!r || !teller) return null;
  if (!reduced) { teller.classList.remove(r.cls); void teller.offsetWidth; teller.classList.add(r.cls); setTimeout(() => teller.classList.remove(r.cls), r.ms); }
  if (r.hood && scene) { scene.classList.add("clouded"); setTimeout(() => scene.classList.remove("clouded"), r.hood); }
  if (r.gesture && gesture) setTimeout(() => gesture(r.gesture), reduced ? 0 : 1600); // she wipes the soot off
  return r.say ? r.say[Math.floor(Math.random() * r.say.length)] : null;
}

// ---- her 8 lab emotes: the 8 starting emotes, re-dressed in her House (ids, levels and slots stay the same) ----
export const LAB_EMOTES = {
  wave: { e: "💡", name: "Eureka", mood: "wow", say: "Eureka! Greek for 'I have found it'. Archimedes is said to have shouted it in his bath.", fx: { p: ["💡", "✨"], m: "rise" } },
  love: { e: "🧪", name: "Pour", mood: "nod", say: "Pouring. Acid into water, never water into acid.", fx: { p: ["💧", "🧪"], m: "fall" } },
  laugh: { e: "🫧", name: "Fizz", mood: "laugh", say: "Fizz! Baking soda and vinegar make carbon dioxide.", fx: { p: ["🫧", "◦"], m: "rise" } },
  gasp: { e: "💥", name: "Bang", mood: "dizzy", say: "Bang! The oldest known gunpowder recipes are Chinese, printed in 1044. I'm fine.", fx: { p: ["💥", "💨"], m: "burst" } },
  spook: { e: "⚖️", name: "Measure", mood: "curious", say: "Measure twice. Lavoisier's careful weighing showed mass is conserved in a reaction.", fx: { p: ["⚖️", "✦"], m: "orbit" } },
  dance: { e: "🥂", name: "Toast", mood: "cheer", say: "A toast! Champagne's bubbles come from a second fermentation in the bottle.", fx: { p: ["🥂", "🫧"], m: "rise" } },
  wink: { e: "🥽", name: "Goggle flip", mood: "flinch", say: "Goggles up… and straight back down. Eyes first, curiosity second.", fx: { p: ["🥽", "✦"], m: "swirl" } },
  think: { e: "⚗️", name: "Bubble", mood: "think", say: "Swirl, swirl. Water boils at 100 °C at sea level, and lower up a mountain.", fx: { p: ["🫧", "⚗️"], m: "swirl" } },
};

const MOOD_LIQ = { joy: "#FADE8C", cheer: "#FFB400", love: "#FF6AB8", laugh: "#8BD630", wow: "#7AD7FF", curious: "#1FC7A6", think: "#B57BE8", nod: "#66E0C8", shake: "#c4ccd6",
  wink: "#FF4FB3", flinch: "#ffffff", sad: "#5a8cff", sulk: "#6a6a8a", smug: "#E2B04A", angry: "#e3173e", sleepy: "#3a3a6a", nervous: "#d8e66a", dizzy: "#ff7a1f" };
export const LAB_CSS = `
body[data-house="alchemist"]{--glove:#7a4a26;--glove2:#4a2a14;--liq:#66E0C8}
body[data-house="alchemist"][data-room="alchemy"]{--glove:#4f7fe0;--glove2:#2f5fc0}
${Object.entries(MOOD_LIQ).map(([m, c]) => `body[data-house="alchemist"] [data-mood="${m}"]{--liq:${c}}`).join("")}
body[data-house="alchemist"] .o-ball>:not(.hv-flask){display:none}
body[data-house="alchemist"] .o-hands [data-skin="fill"]{fill:var(--glove)}body[data-house="alchemist"] .o-hands [data-skin="stroke"]{stroke:var(--glove)}
body[data-house="alchemist"] .o-hands .o-nail{fill:var(--glove2)}body[data-house="alchemist"] .o-hands .o-peye,body[data-house="alchemist"] .o-hands .o-pline{display:none}
.hv-liq{fill:var(--liq);opacity:.82;transition:fill .5s}.hv-liqglow{fill:var(--liq);transition:fill .5s}
.hv-flask{transform-origin:200px 352px;transform-box:view-box}
.hv-bub{animation:hv-bub 2.2s ease-in infinite;animation-delay:var(--d)}@keyframes hv-bub{0%{transform:translateY(0);opacity:0}20%{opacity:.8}100%{transform:translateY(-56px);opacity:0}}
.hv-burn{animation:hr-flick .3s ease-in-out infinite alternate;transform-origin:200px 378px;transform-box:view-box}
.hv-tink,.hv-foam,.hv-sparks,.hv-puff,.hv-soot,.hp{opacity:0;transition:opacity .25s}
.hv-goggle{transition:transform .35s cubic-bezier(.3,1.5,.5,1)}
[data-mood="think"] .hv-flask{animation:hv-swirl .9s ease-in-out 3}@keyframes hv-swirl{25%{transform:rotate(-7deg)}75%{transform:rotate(7deg)}}
[data-mood="curious"] .hp-tube,[data-mood="nod"] .hp-pour,[data-mood="smug"] .hp-scribble,[data-mood="nervous"] .hp-mitt,[data-mood="dizzy"] .hp-soot{opacity:1}
[data-mood="wow"] .hv-tink{opacity:1;animation:hv-tink .3s steps(2) 4}[data-mood="wow"] .hv-flask{animation:hv-wob .12s linear 4}@keyframes hv-tink{50%{opacity:.2}}@keyframes hv-wob{50%{transform:translateX(1.5px)}}
[data-mood="flinch"] .hv-goggle{transform:translateY(-48px)}
[data-mood="dizzy"] .hv-soot{opacity:1}
.hp-pencil{animation:hp-pen .35s ease-in-out infinite alternate;transform-origin:168px 232px;transform-box:view-box}@keyframes hp-pen{to{transform:translate(6px,2px) rotate(4deg)}}
.hp-stream{stroke-dasharray:6 4;animation:hp-flow .4s linear infinite}@keyframes hp-flow{to{stroke-dashoffset:-10}}
.teller.hv-adjust .hv-goggle{animation:hv-adj .8s ease-in-out}@keyframes hv-adj{30%{transform:translateY(-8px) rotate(-4deg)}60%{transform:translateY(3px) rotate(3deg)}}
.teller.hv-foaming .hv-foam{opacity:1;animation:hv-foam 1.6s ease-out both}@keyframes hv-foam{0%{transform:translateY(12px) scale(.4)}40%{transform:none}100%{transform:none;opacity:0}}
.teller.hv-foaming .hv-flask{animation:hv-wob .1s linear 6}
.teller.hv-spark .hv-sparks{opacity:1}.teller.hv-spark .hv-sparks path{animation:hv-spk 1.4s ease-out both;animation-delay:var(--d);transform-origin:200px 304px;transform-box:view-box}@keyframes hv-spk{0%{transform:scale(.3);opacity:0}30%{opacity:1}100%{transform:scale(1.35);opacity:0}}
.teller.hv-sooty .hv-puff{opacity:1}.teller.hv-sooty .hv-puff circle{animation:hv-puff 1.4s ease-out both;animation-delay:var(--d);transform-box:fill-box;transform-origin:50% 50%}@keyframes hv-puff{0%{transform:scale(.2);opacity:.9}100%{transform:scale(1.8) translateY(-30px);opacity:0}}
.teller.hv-sooty .hv-soot{opacity:1;animation:hv-wipe 3.2s ease-in both}@keyframes hv-wipe{0%,55%{opacity:1}100%{opacity:0}}
.lab-hood{position:absolute;left:3%;top:4%;width:clamp(56px,15%,104px);opacity:.92;filter:drop-shadow(0 0 12px rgba(0,0,0,.6))}
.lab-cloud{opacity:0;transition:opacity 1.2s}.scene.clouded .lab-cloud{opacity:.95}.scene.clouded .lab-cloud ellipse{animation:lab-roil 2s ease-in-out infinite alternate}@keyframes lab-roil{to{transform:translate(2px,-2px)}}
.lab-jars{position:absolute;right:2%;top:40%;width:clamp(78px,22%,150px);opacity:.85}
.lab-athanor{position:absolute;left:3%;top:52%;width:clamp(40px,11%,78px);opacity:.92}
.lab-fire{animation:hr-flick .45s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
.lab-bench{position:absolute;left:0;right:0;bottom:0;height:7%;background:linear-gradient(#6a3e1e,#2e1a0c);border-top:2px solid #C88A3A;opacity:.85}
.lab-rack{position:absolute;left:3%;bottom:6.5%;width:clamp(38px,10%,70px);opacity:.85}
.lab-burner{position:absolute;right:3%;bottom:6.5%;width:clamp(30px,7.5%,54px);opacity:.85}
.lab-hb{animation:ph-rise 2s linear infinite;animation-delay:var(--d,0s)}.lab-bflame{animation:hr-flick .3s ease-in-out infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
.lab-glow{position:absolute;left:0;bottom:0;width:40%;height:55%;background:radial-gradient(circle at 12% 70%,rgba(255,140,60,.35),transparent 60%);mix-blend-mode:screen;pointer-events:none}
@media (prefers-reduced-motion: reduce){.hv-bub,.hv-burn,.hp-pencil,.hp-stream,.lab-fire,.lab-hb,.lab-bflame,.lab-cloud ellipse,[data-mood] .hv-flask{animation:none}}`;

// ---- her outfit line: lab coats (robes stay the Oracle's). prog.coat; the Magister coat is earned, never sold ----
/** style: lapel (coat with lapels and a breast pocket), apron (bib and straps), bands (reflective stripes), suit (zip and hood seam). */
export const COATS = [
  { id: "coat-white", name: "White lab coat", price: 0, style: "lapel", hood: ["#ffffff", "#dfe3ea", "#7d869a"], trim: "#b8c2d6", lapel: "#f4f6fa", note: "Doctors took up the white coat in the late 1800s, to look like the laboratory scientists of the day." },
  { id: "coat-apron", name: "Copper-stained apron", price: 60, style: "apron", hood: ["#8a5a32", "#4a2c16", "#1a0d05"], trim: "#3FA08A", lapel: "#6a4022", note: "Copper stains blue-green: verdigris, the same patina that turns old copper roofs green." },
  { id: "coat-frock", name: "Victorian lecturer's frock coat", price: 120, style: "lapel", hood: ["#3a4a7a", "#1a2340", "#070a14"], trim: "#E2B04A", lapel: "#2a3560", note: "Michael Faraday began the Royal Institution's Christmas Lectures in 1825. They still run every year." },
  { id: "coat-pyro", name: "Fireworks maker's flame-resistant coat", price: 140, style: "bands", hood: ["#ff9a4a", "#c8401a", "#4a1206"], trim: "#e8e8ee", lapel: "#c8401a", note: "Flame-resistant workwear uses fibres such as aramid, which char instead of melting." },
  { id: "coat-bunny", name: "Cleanroom bunny suit", price: 160, style: "suit", hood: ["#f4fbff", "#b8d8f0", "#5a7a9a"], trim: "#7AD7FF", lapel: "#dceefa", note: "Cleanroom suits keep hair and skin flakes off microchips. One speck of dust can ruin a chip." },
  { id: "coat-hazmat", name: "Orange hazmat suit", price: 180, style: "suit", hood: ["#ffb347", "#f07a10", "#6a2a04"], trim: "#2a2a2a", lapel: "#f07a10", note: "Hazmat suits are rated A to D: A is fully sealed with its own air supply, D is ordinary work clothes." },
  { id: "coat-magister", name: "Gold-trimmed Magister coat", earned: true, how: "Finish the Great Work (the Magnum Opus)", style: "lapel", hood: ["#5a1a2a", "#2a0a14", "#0a0205"], trim: "#FADE8C", lapel: "#3a0d1a", note: "Magister was the title of a medieval university teacher. It lives on as 'master', as in a master's degree." },
];
export const coatOf = (id) => COATS.find((c) => c.id === id) || COATS[0];
/** The Magnum Opus module grants the Magister coat by adding its id to prog.owned. */
export const MAGISTER_COAT = "coat-magister";
export function coatOverlay(c) {
  const L = c.lapel, T = c.trim;
  if (c.style === "apron") return `<g class="hv-coat"><path d="M158 252 H242 L252 400 H148Z" fill="${L}" stroke="${T}" stroke-width="2"/><path d="M158 252 L132 236 M242 252 L268 236" stroke="${L}" stroke-width="6"/>
    ${[[172, 300, 9], [228, 330, 12], [190, 372, 8], [240, 384, 6]].map(([x, y, r]) => `<ellipse cx="${x}" cy="${y}" rx="${r}" ry="${r * 0.7}" fill="${T}" opacity=".55"/>`).join("")}</g>`;
  if (c.style === "bands") return `<g class="hv-coat"><path d="M200 240 L152 246 L176 322Z M200 240 L248 246 L224 322Z" fill="${L}" stroke="${T}" stroke-width="1.5"/><path d="M92 340 H308 M80 368 H320" stroke="${T}" stroke-width="7" opacity=".9"/><path d="M92 340 H308 M80 368 H320" stroke="#fff" stroke-width="2" stroke-dasharray="4 6" opacity=".7"/></g>`;
  if (c.style === "suit") return `<g class="hv-coat"><path d="M200 240 V400" stroke="${T}" stroke-width="3"/><path d="M200 240 V400" stroke="#fff" stroke-width="1" stroke-dasharray="2 3"/><path d="M118 238 C150 262 250 262 282 238" fill="none" stroke="${T}" stroke-width="5" opacity=".8"/><rect x="194" y="244" width="12" height="10" rx="2" fill="${T}"/></g>`;
  return `<g class="hv-coat"><path d="M200 240 L150 246 L176 330Z M200 240 L250 246 L224 330Z" fill="${L}" stroke="${T}" stroke-width="2" stroke-linejoin="round"/>
    <rect x="122" y="292" width="28" height="22" rx="2" fill="none" stroke="${T}" stroke-width="2"/><path d="M130 292 V280 M138 292 V276" stroke="${T}" stroke-width="3" stroke-linecap="round"/>
    ${[344, 368].map((y) => `<circle cx="176" cy="${y}" r="3.6" fill="${T}"/><circle cx="224" cy="${y}" r="3.6" fill="${T}"/>`).join("")}</g>`;
}
const coatSwatch = (c) => `<svg viewBox="0 0 400 400" aria-hidden="true"><defs><linearGradient id="cs-g" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${c.hood[0]}"/><stop offset=".5" stop-color="${c.hood[1]}"/><stop offset="1" stop-color="${c.hood[2]}"/></linearGradient></defs>
  <g transform="translate(0 -150) scale(1)"><path d="M200 230 C250 232 300 250 312 290 L340 400 H60 L88 290 C100 250 150 232 200 230Z" fill="url(#cs-g)" stroke="${c.trim}" stroke-width="3"/>${coatOverlay(c)}</g></svg>`;
export const coatShop = {
  kind: "coat", label: "🥼 Vell's lab coats",
  items: COATS.map(({ id, name, note, price, earned, how }) => ({ id, name, note, ...(earned ? { earned, how } : { price }) })),
  talk: {
    open: ["My wardrobe: lab coats only. Robes are for oracles. I need pockets.", "Every coat here was made for real lab work. Pick one and I'll wear it at the bench.", "Coats, aprons and suits. The gold one you earn: finish the Great Work and it's yours."],
    tryon: ["{item}. Very professional. Slightly singed.", "{item}. How do I look? Scientific?", "{item}. It fits! The sleeves even clear the flask."],
    buy: ["{item}, on the hook. I'll wear it to the bench.", "{item}! Lab-ready. Mostly.", "{item} is yours. Pockets checked: one pencil, two mysteries."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(coatSwatch(coatOf(id))); ctx.cap("🥼 " + coatOf(id).name); },
};

// ---- her 4 House records (Frank's own tracks; music/<id>.mp3). They join music.js TRACKS once the audio is in. ----
const V = (p) => ((p && p.houses) || {}).alchemist || {};
export const HOUSE_RECORDS = [
  { id: "bubble-and-brass", title: "Bubble and Brass", icon: "🫧", label: "#C88A3A", ink: "#fff1c4", how: "task", house: "alchemist", task: "Visit the Alchemist's House", test: (p) => !!V(p).day },
  { id: "slow-furnace", title: "Slow Furnace", icon: "🧱", label: "#7a3a22", ink: "#ffd8b0", how: "task", house: "alchemist", task: "Beat a Level 3 game in the Alchemist's House", test: (p) => (V(p).lv || []).some((k) => /-3$/.test(k)) },
  { id: "transmutation-waltz", title: "Transmutation Waltz", icon: "⚗️", label: "#1FC7A6", ink: "#e0fff8", how: "task", house: "alchemist", task: "Run 100 experiments in the Alchemist's House", test: (p) => (V(p).rounds || 0) >= 100 },
  { id: "magnum-opus", title: "Magnum Opus", icon: "🪨", label: "#e3173e", ink: "#ffe0e4", how: "task", house: "alchemist", task: "Finish the Great Work (the Magnum Opus)", test: (p) => !!V(p).opus },
];
/** The Magnum Opus module calls this when the Great Work is finished: the record and the Magister coat are both earned. */
export function grantOpus(p) {
  p.houses = p.houses || {}; const h = (p.houses.alchemist ||= {}); h.opus = true;
  p.owned = p.owned || []; if (!p.owned.includes(MAGISTER_COAT)) p.owned.push(MAGISTER_COAT); return p;
}
