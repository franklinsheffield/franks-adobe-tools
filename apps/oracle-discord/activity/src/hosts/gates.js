// Each House's own door (Frank 2026-11-28: "a custom entry page that's branded for each one, to the same quality as
// the current catch-all"). The Oracle keeps her zodiac door (home.js gateBgHtml); every other House gets its own living
// backdrop, words, colours and button. Pure CSS/SVG, parallax on --px/--py, quiet under prefers-reduced-motion.
// Every piece of decoration is drawn from the House's real subject (the seven metals and their planets, star trails
// around the celestial pole, Victorian stage magic, real scripts).

const f = (n) => n.toFixed(1);

/** The Alchemist's House: a lit bench. Seven metals paired with their seven planets turn overhead (the old alchemical
 *  pairing: gold-Sun, silver-Moon, copper-Venus, iron-Mars, mercury-Mercury, tin-Jupiter, lead-Saturn). */
function labBg(rnd) {
  const metals = [["Au", "☉"], ["Ag", "☽"], ["Cu", "♀"], ["Fe", "♂"], ["Hg", "☿"], ["Sn", "♃"], ["Pb", "♄"]];
  const ring = metals.map(([el, pl], i) => { const a = ((i * 360) / 7 - 90) * Math.PI / 180;
    return `<g transform="translate(${f(Math.cos(a) * 190)} ${f(Math.sin(a) * 190)})"><circle r="30"/><text y="-4" text-anchor="middle" class="gl-el">${el}</text><text y="18" text-anchor="middle" class="gl-pl">${pl}︎</text></g>`; }).join("");
  const spokes = metals.map((_, i) => `<path d="M0 -150V-160" transform="rotate(${f((i * 360) / 7)})"/>`).join("");
  const bubbles = Array.from({ length: 26 }, () => `<i style="left:${f(rnd() * 100)}%;--s:${(0.4 + rnd() * 1.3).toFixed(2)};--d:${f(rnd() * 12)}s;--t:${f(7 + rnd() * 9)}s;--x:${Math.round(rnd() * 60 - 30)}px"></i>`).join("");
  // the glassware on the bench: round flask, conical flask, retort, tall cylinder, alembic; each with a glowing liquid
  const glass = `<svg class="gl-bench" viewBox="0 0 1000 220" preserveAspectRatio="xMidYMax meet">
    <path class="gl-shelf" d="M0 206H1000V220H0Z"/>
    <g class="gl-flask" style="--c:#4dffb0;--d:0s"><path class="gl-liq" d="M136 150a52 52 0 1 0 104 0H136Z"/><path class="gl-gl" d="M172 60h32v34a58 58 0 1 1-32 0Z"/><path class="gl-lip" d="M166 60h44"/></g>
    <g class="gl-flask" style="--c:#ff7ad0;--d:-1.4s"><path class="gl-liq" d="M322 206l20-42h56l20 42Z"/><path class="gl-gl" d="M354 90h32v40l44 76H310l44-76Z"/><path class="gl-lip" d="M348 90h44"/></g>
    <g class="gl-flask" style="--c:#ffb347;--d:-2.6s"><path class="gl-liq" d="M470 170a44 30 0 0 0 88 0Z"/><path class="gl-gl" d="M470 170a44 40 0 1 1 88 0a44 36 0 0 1-88 0ZM548 140C600 100 660 96 712 120"/><path class="gl-lip" d="M712 114v12"/><circle class="gl-fire" cx="514" cy="206" r="10"/></g>
    <g class="gl-flask" style="--c:#8fd3ff;--d:-3.3s"><path class="gl-liq" d="M772 206V150h36v56Z"/><path class="gl-gl" d="M768 60h44v146h-44ZM762 60h56"/><path class="gl-tick" d="M768 90h10M768 110h10M768 130h10M768 150h10M768 170h10"/></g>
    <g class="gl-flask" style="--c:#c3ff6b;--d:-4.1s"><path class="gl-liq" d="M876 178a34 26 0 0 0 68 0Z"/><path class="gl-gl" d="M876 178a34 30 0 1 1 68 0a34 28 0 0 1-68 0ZM892 150c-10-30 0-50 18-58c18 8 28 28 18 58M910 92c30-12 56-8 76 6"/></g>
  </svg>`;
  const steam = Array.from({ length: 6 }, (_, i) => `<b style="left:${[18, 36, 51, 78, 91, 64][i]}%;--d:${f(i * 1.6)}s"></b>`).join("");
  return `<div class="gate-bg gh-lab" aria-hidden="true"><div class="gl-glow g1"></div><div class="gl-glow g2"></div>
  <div class="gl-ring"><svg viewBox="-260 -260 520 520"><g class="gl-spin"><circle r="232"/><circle r="150" stroke-dasharray="3 9"/>${spokes}${ring}</g><g class="gl-tri"><path d="M0 -120L104 60H-104Z"/><circle r="60"/></g></svg></div>
  <div class="gl-bubbles">${bubbles}</div><div class="gl-steam">${steam}</div>${glass}<div class="gb-vig"></div></div>`;
}

/** The Observatory: a long exposure. Star trails wheel round the celestial pole above an open dome. */
function domeBg(rnd) {
  const trails = Array.from({ length: 22 }, (_, i) => { const r = 40 + i * 26 + rnd() * 12, len = 30 + rnd() * 80, off = rnd() * 600;
    return `<circle r="${f(r)}" stroke-dasharray="${f(len)} ${f(r * 6.28 - len)}" stroke-dashoffset="${f(off)}" style="opacity:${(0.25 + rnd() * 0.6).toFixed(2)}"/>`; }).join("");
  const stars = (n, cls) => Array.from({ length: n }, () => `<i style="left:${f(rnd() * 100)}%;top:${f(rnd() * 70)}%;--d:${f(rnd() * 5)}s;--s:${(0.5 + rnd() * 1.1).toFixed(2)}"></i>`).join("");
  const meteors = Array.from({ length: 3 }, (_, i) => `<u style="top:${f(6 + rnd() * 30)}%;left:${f(30 + rnd() * 60)}%;--d:${f(3 + i * 5 + rnd() * 2)}s"></u>`).join("");
  const dome = `<svg class="go-dome" viewBox="0 0 600 260" preserveAspectRatio="xMidYMax meet">
    <path class="go-hill" d="M0 260V210C120 190 200 200 300 196S480 186 600 206V260Z"/>
    <path class="go-wall" d="M190 204V150h220v54Z"/>
    <path class="go-cap" d="M180 152a120 104 0 0 1 240 0Z"/>
    <path class="go-slit" d="M284 50a120 104 0 0 1 34 2L326 152H276Z"/>
    <g class="go-scope"><path d="M296 128L346 36l16 8L312 136Z"/><circle cx="304" cy="132" r="9"/></g>
    <path class="go-door" d="M286 204v-26a14 14 0 0 1 28 0v26Z"/><circle class="go-lamp" cx="300" cy="182" r="3"/>
  </svg>`;
  return `<div class="gate-bg gh-dome" aria-hidden="true"><div class="go-milky"></div>
  <div class="go-trails"><svg viewBox="-620 -620 1240 1240">${trails}<circle class="go-pole" r="3"/></svg></div>
  <div class="gb-stars far">${stars(70)}</div><div class="gb-stars near go-near">${stars(18)}</div>${meteors}${dome}<div class="gb-vig"></div></div>`;
}

/** The Séance Parlour: a Victorian stage. Velvet curtains, footlights, a sweeping limelight, floating card suits. */
function stageBg(rnd) {
  const suits = Array.from({ length: 12 }, (_, i) => `<b style="left:${f(6 + rnd() * 88)}%;--d:${f(rnd() * 16)}s;--t:${f(14 + rnd() * 10)}s;--x:${Math.round(rnd() * 80 - 40)}px;--r:${Math.round(rnd() * 360)}deg" class="${i % 4 === 1 || i % 4 === 2 ? "red" : ""}">${"♠♥♦♣"[i % 4]}︎</b>`).join("");
  const candles = [12, 26, 74, 88].map((x, i) => `<div class="gp-candle" style="left:${x}%;--d:${f(i * 0.37)}s;--h:${[46, 64, 58, 42][i]}px"><i></i></div>`).join("");
  const smoke = Array.from({ length: 5 }, (_, i) => `<s style="left:${[12, 26, 50, 74, 88][i]}%;--d:${f(i * 2.1)}s"></s>`).join("");
  return `<div class="gate-bg gh-stage" aria-hidden="true"><div class="gp-wall"></div><div class="gp-lime"></div>
  <div class="gp-suits">${suits}</div><div class="gp-smoke">${smoke}</div>
  <div class="gp-curtain l"></div><div class="gp-curtain r"></div><div class="gp-valance"></div>
  <div class="gp-floor"></div>${candles}<div class="gb-vig"></div></div>`;
}

/** The Scriptorium: light through a lancet window, dust in the beam, real letters drifting down
 *  (Elder Futhark runes, Greek, Ogham, Latin), an illuminated border drawing itself round the page. */
function scriptBg(rnd) {
  const LETTERS = "ᚠᚢᚦᚨᚱᚲᚷᚹΑΒΓΔΩᚁᚂᚃᚄᚅABCDEFQRS".split("");
  const letters = Array.from({ length: 18 }, (_, i) => `<b style="left:${f(4 + rnd() * 92)}%;--d:${f(rnd() * 20)}s;--t:${f(18 + rnd() * 12)}s;--x:${Math.round(rnd() * 60 - 30)}px;--r:${Math.round(rnd() * 60 - 30)}deg" class="${i % 5 === 0 ? "rub" : ""}">${LETTERS[Math.floor(rnd() * LETTERS.length)]}</b>`).join("");
  const motes = Array.from({ length: 34 }, () => `<i style="left:${f(30 + rnd() * 40)}%;top:${f(rnd() * 90)}%;--d:${f(rnd() * 9)}s;--s:${(0.5 + rnd()).toFixed(2)}"></i>`).join("");
  const lines = [0, 1, 2].map((k) => `<path pathLength="1" style="--d:${k * 1.8}s" d="M${40 + k * 6} ${880 + k * 26}c40-10 60 8 100 0s60-12 100 0 60 10 100-2 60-8 100 2 70 6 110-4 50-8 90 2"/>`).join("");
  return `<div class="gate-bg gh-script" aria-hidden="true">
  <svg class="gs-win" viewBox="0 0 400 600" preserveAspectRatio="xMidYMin meet"><path d="M120 600V190Q120 70 200 20Q280 70 280 190V600Z"/><path class="gs-mull" d="M200 40V600M120 300H280"/><circle class="gs-rose" cx="200" cy="150" r="34"/></svg>
  <div class="gs-beam"></div><div class="gs-motes">${motes}</div><div class="gs-letters">${letters}</div>
  <svg class="gs-frame" viewBox="0 0 1000 1000" preserveAspectRatio="none"><rect class="gs-b1" x="22" y="22" width="956" height="956" rx="6" pathLength="1"/><rect class="gs-b2" x="38" y="38" width="924" height="924" pathLength="1"/>${lines}</svg>
  <div class="gs-corner tl"></div><div class="gs-corner tr"></div><div class="gs-corner bl"></div><div class="gs-corner br"></div><div class="gb-vig"></div></div>`;
}

export const GATES = {
  alchemist: { eye: "Science is Magic · House I", title: "The Alchemist's House", sub: "Real chemistry and the strange history of alchemy, with a magister who measures everything", cta: "⚗ Enter the Lab", note: "🔊 Sound on: Magister Vell speaks. You can mute the voice any time.", bg: labBg },
  observatory: { eye: "Science is Magic · House II", title: "The Observatory", sub: "The real sky tonight, star lore from every culture, and a keeper who shows you where to look", cta: "🔭 Open the Dome", note: "🔊 Sound on: Keeper Altair speaks. You can mute the voice any time.", bg: domeBg },
  parlour: { eye: "Science is Magic · House III", title: "The Séance Parlour", sub: "Ghosts, conjurors and the real history of magic, with a medium who shows you the trick", cta: "🕯 Take your seat", note: "🔊 Sound on: Madame Rook speaks. You can mute the voice any time.", bg: stageBg },
  scriptorium: { eye: "Science is Magic · House IV", title: "The Scriptorium", sub: "Runes, ciphers and old scripts, with an archivist who reads every mark", cta: "🪶 Open the Book", note: "🔊 Sound on: Archivist Wren speaks. You can mute the voice any time.", bg: scriptBg },
};
/** This House's door, or null for the Oracle's own. */
export const gateOf = (id) => GATES[id] || null;

export const GATES_CSS = `
.gate[data-house]:not([data-house=oracle]) .gate-sigil i{border-color:var(--house-accent)}
.gate[data-house]:not([data-house=oracle]) .gate-sigil svg{filter:drop-shadow(0 0 16px var(--house-accent))}
.gate[data-house]:not([data-house=oracle]) .gate-eye{color:var(--house-accent)}
.gate[data-house]:not([data-house=oracle]) .gate-go{background:linear-gradient(180deg,var(--gg1),var(--gg2));color:var(--ggt);border-color:var(--gg1)}

/* ---- Alchemist: copper, brass and emerald ---- */
.gate[data-house=alchemist]{background:radial-gradient(60% 50% at 50% 40%,rgba(58,36,14,.94),rgba(6,9,6,.98) 75%);--gg1:#F2B36F;--gg2:#B8642A;--ggt:#1a0d03}
.gate[data-house=alchemist] .gate-title{color:#F7C98E;text-shadow:0 0 24px rgba(232,154,85,.45),0 2px 0 #4a2a10}
.gh-lab .gl-glow{position:absolute;width:60vmax;height:60vmax;border-radius:50%;filter:blur(70px);mix-blend-mode:screen;opacity:.35;animation:gb-neb 40s ease-in-out infinite alternate}
.gh-lab .g1{left:-18vmax;bottom:-28vmax;background:radial-gradient(circle,#E89A55,transparent 62%)}
.gh-lab .g2{right:-22vmax;top:-26vmax;background:radial-gradient(circle,#2fd68a,transparent 60%);animation-delay:-14s}
.gl-ring{position:absolute;left:50%;top:44%;width:min(120vmin,900px);aspect-ratio:1;transform:translate(-50%,-50%) translate(calc(var(--px) * 16px),calc(var(--py) * 16px));opacity:.24}
.gl-ring svg{width:100%;height:100%;fill:none;stroke:#E89A55;stroke-width:1.2}
.gl-spin{animation:gb-spin 140s linear infinite}
.gl-spin text{stroke:none;fill:#F7C98E;font-family:var(--display,serif)}
.gl-el{font-size:20px;font-weight:700}.gl-pl{font-size:17px;fill:#9ff5c8!important;font-family:"Segoe UI Symbol","Noto Sans Symbols","Apple Symbols",serif!important}
.gl-tri{stroke:#4dffb0;opacity:.5;animation:gb-breathe 7s ease-in-out infinite;transform-origin:center}
.gl-bubbles i{position:absolute;bottom:-20px;width:calc(12px * var(--s));height:calc(12px * var(--s));border-radius:50%;border:1.5px solid rgba(180,255,220,.55);background:radial-gradient(circle at 35% 30%,rgba(255,255,255,.55),transparent 45%);opacity:0;animation:gl-bub var(--t) ease-in var(--d) infinite}
@keyframes gl-bub{0%{opacity:0;transform:translate(0,0)}10%{opacity:.8}50%{transform:translate(var(--x),-55vh)}90%{opacity:.5}100%{opacity:0;transform:translate(calc(var(--x) * -1),-108vh) scale(1.3)}}
.gl-steam b{position:absolute;bottom:22vh;width:70px;height:70px;border-radius:50%;background:radial-gradient(circle,rgba(230,240,235,.22),transparent 65%);filter:blur(6px);opacity:0;animation:gl-steam 7s ease-out var(--d) infinite}
@keyframes gl-steam{0%{opacity:0;transform:translate(-50%,0) scale(.5)}25%{opacity:.8}100%{opacity:0;transform:translate(-30%,-40vh) scale(2.4)}}
.gl-bench{position:absolute;left:0;right:0;bottom:0;width:100%;height:min(30vh,240px);transform:translate(calc(var(--px) * -22px),0)}
.gl-shelf{fill:#3a2412}
.gl-gl{fill:rgba(200,240,255,.06);stroke:rgba(220,245,255,.55);stroke-width:2.5;stroke-linejoin:round}
.gl-lip,.gl-tick{stroke:rgba(220,245,255,.7);stroke-width:3;fill:none;stroke-linecap:round}.gl-tick{stroke-width:1.5}
.gl-liq{fill:var(--c);opacity:.75;filter:drop-shadow(0 0 12px var(--c));animation:gl-slosh 3.6s ease-in-out var(--d) infinite;transform-box:fill-box;transform-origin:50% 100%}
@keyframes gl-slosh{0%,100%{transform:skewY(0) scaleY(1)}30%{transform:skewY(-2deg) scaleY(1.04)}70%{transform:skewY(2deg) scaleY(.97)}}
.gl-fire{fill:#4da6ff;filter:drop-shadow(0 0 10px #4da6ff);animation:gl-fire .18s steps(2) infinite alternate;transform-box:fill-box;transform-origin:50% 100%}
@keyframes gl-fire{to{transform:scale(.8,1.25)}}

/* ---- Observatory: night blue and silver ---- */
.gate[data-house=observatory]{background:radial-gradient(70% 60% at 50% 30%,rgba(16,32,72,.95),rgba(2,4,14,.98) 75%);--gg1:#BFD5FF;--gg2:#5F86D6;--ggt:#06102a}
.gate[data-house=observatory] .gate-title{color:#DCE8FF;text-shadow:0 0 26px rgba(143,184,255,.55)}
.go-milky{position:absolute;inset:-20%;background:linear-gradient(118deg,transparent 36%,rgba(190,200,255,.10) 44%,rgba(255,236,214,.16) 50%,rgba(190,200,255,.10) 56%,transparent 64%);filter:blur(8px);transform:translate(calc(var(--px) * -12px),calc(var(--py) * -12px))}
.go-trails{position:absolute;left:50%;top:4%;width:170vmax;aspect-ratio:1;transform:translate(-50%,-50%) translate(calc(var(--px) * 10px),calc(var(--py) * 10px))}
.go-trails svg{width:100%;height:100%;fill:none;stroke:#cfe0ff;stroke-width:2.4;stroke-linecap:round;animation:gb-spin 240s linear infinite}
.go-pole{fill:#fff;stroke:none;filter:drop-shadow(0 0 6px #fff)}
.gh-dome .gb-stars.near i{background:#cfe0ff;box-shadow:0 0 10px #8FB8FF}
.gh-dome u{position:absolute;width:160px;height:1.5px;background:linear-gradient(90deg,#fff,transparent);opacity:0;transform:rotate(-30deg);animation:gb-shoot 14s ease-in var(--d) infinite}
.go-dome{position:absolute;left:0;right:0;bottom:0;width:100%;height:min(24vh,210px);transform:translate(calc(var(--px) * -20px),0)}
.go-hill{fill:#03060f}.go-wall{fill:#0b1329;stroke:#24365f;stroke-width:1.5}.go-cap{fill:#121d3d;stroke:#3a5288;stroke-width:1.5}
.go-slit{fill:#ffd98a;opacity:.85;filter:drop-shadow(0 0 14px #ffcf6b);animation:go-slit 6s ease-in-out infinite}
@keyframes go-slit{50%{opacity:.6}}
.go-scope path{fill:#0b1329;stroke:#8FB8FF;stroke-width:1.5}.go-scope circle{fill:#24365f}
.go-scope{transform-origin:304px 132px;animation:go-scope 18s ease-in-out infinite}
@keyframes go-scope{0%,100%{transform:rotate(-4deg)}50%{transform:rotate(6deg)}}
.go-door{fill:#03060f;stroke:#3a5288}.go-lamp{fill:#ffcf6b;filter:drop-shadow(0 0 6px #ffcf6b)}

/* ---- Séance Parlour: plum velvet, gold fringe, limelight ---- */
.gate[data-house=parlour]{background:radial-gradient(60% 55% at 50% 40%,rgba(52,16,44,.95),rgba(8,3,8,.98) 75%);--gg1:#E9D9FF;--gg2:#8E6AD8;--ggt:#1a0a24}
.gate[data-house=parlour] .gate-title{color:#F1E6FF;font-style:italic;text-shadow:0 0 26px rgba(195,166,255,.5),0 2px 0 #3a0f2c}
.gp-wall{position:absolute;inset:0;background:repeating-linear-gradient(90deg,rgba(255,255,255,.018) 0 2px,transparent 2px 46px),radial-gradient(40% 30% at 50% 45%,rgba(195,166,255,.12),transparent 70%)}
.gp-lime{position:absolute;left:50%;top:-10%;width:90vmin;height:120vh;transform-origin:50% 0;background:conic-gradient(from 168deg at 50% 0,transparent 0deg,rgba(255,240,210,.14) 10deg,rgba(255,240,210,.20) 12deg,rgba(255,240,210,.14) 14deg,transparent 24deg);translate:-50% 0;animation:gp-lime 12s ease-in-out infinite;filter:blur(3px)}
@keyframes gp-lime{0%,100%{transform:rotate(-9deg)}50%{transform:rotate(9deg)}}
.gp-curtain{position:absolute;top:0;bottom:0;width:22vw;min-width:90px;background:repeating-linear-gradient(90deg,#4a0f2e 0 10px,#7a1b45 18px,#5a1236 30px,#2e0819 38px);box-shadow:inset 0 -60px 80px rgba(0,0,0,.6);animation:gp-sway 9s ease-in-out infinite;transform-origin:50% 0}
.gp-curtain.l{left:0;border-bottom-right-radius:60% 12%;transform:translate(calc(var(--px) * 8px),0)}
.gp-curtain.r{right:0;border-bottom-left-radius:60% 12%;animation-delay:-4.5s}
@keyframes gp-sway{0%,100%{rotate:0deg}50%{rotate:.8deg}}
.gp-valance{position:absolute;left:0;right:0;top:0;height:46px;background:radial-gradient(circle at 50% 0,#7a1b45 32px,transparent 33px) 0 0/72px 46px repeat-x,linear-gradient(#5a1236,#5a1236) 0 0/100% 14px no-repeat;filter:drop-shadow(0 4px 0 #c99a3a)}
.gp-floor{position:absolute;left:0;right:0;bottom:0;height:16vh;background:linear-gradient(180deg,transparent,rgba(40,14,10,.9));border-top:2px solid rgba(201,154,58,.35)}
.gp-candle{position:absolute;bottom:9vh;width:14px;height:var(--h);background:linear-gradient(90deg,#d9cdb2,#fff6dd 40%,#b9ab8c);border-radius:3px 3px 2px 2px;transform:translate(calc(var(--px) * -14px),0)}
.gp-candle i{position:absolute;left:50%;bottom:100%;width:12px;height:22px;margin-left:-6px;border-radius:50% 50% 45% 45%/65% 65% 35% 35%;background:radial-gradient(circle at 50% 75%,#fff 0 18%,#ffd36b 38%,#ff7a2a 70%,transparent 72%);filter:drop-shadow(0 0 14px #ffb347);animation:gp-flick 1.6s ease-in-out var(--d) infinite;transform-origin:50% 100%}
@keyframes gp-flick{0%,100%{transform:scale(1) rotate(-2deg)}25%{transform:scale(.92,1.08) rotate(3deg)}55%{transform:scale(1.05,.95) rotate(-3deg)}80%{transform:scale(.96,1.1) rotate(1deg)}}
.gp-smoke s{position:absolute;bottom:20vh;width:60px;height:120px;border-radius:50%;background:radial-gradient(circle,rgba(220,210,240,.14),transparent 65%);filter:blur(8px);opacity:0;animation:gp-smoke 11s ease-out var(--d) infinite}
@keyframes gp-smoke{0%{opacity:0;transform:translate(-50%,0) scale(.6)}30%{opacity:.8}100%{opacity:0;transform:translate(-10%,-50vh) scale(2.2) rotate(30deg)}}
.gp-suits b{position:absolute;bottom:-50px;font-size:26px;font-weight:400;color:#E9D9FF;opacity:0;animation:gp-suit var(--t) linear var(--d) infinite;text-shadow:0 0 12px rgba(195,166,255,.6);font-family:"Segoe UI Symbol","Noto Sans Symbols","Apple Symbols",serif}
.gp-suits b.red{color:#ff6b8a;text-shadow:0 0 12px rgba(255,80,120,.6)}
@keyframes gp-suit{0%{opacity:0;transform:translate(0,0) rotate(0)}12%{opacity:.45}85%{opacity:.3}100%{opacity:0;transform:translate(var(--x),-112vh) rotate(var(--r))}}

/* ---- Scriptorium: vellum, oak gall ink, vermilion rubric and gold ---- */
.gate[data-house=scriptorium]{background:radial-gradient(60% 55% at 50% 38%,rgba(62,40,20,.95),rgba(10,6,3,.98) 75%);--gg1:#F4E3C1;--gg2:#C99A5A;--ggt:#2a1608}
.gate[data-house=scriptorium] .gate-title{color:#F4E3C1;text-shadow:0 0 22px rgba(232,72,59,.35),0 2px 0 #3a1d0c}
.gate[data-house=scriptorium] .gate-title::first-letter{color:#E8483B;font-size:1.3em}
.gs-win{position:absolute;left:50%;top:0;height:78vh;translate:-50% 0;opacity:.5;transform:translate(calc(var(--px) * 10px),0)}
.gs-win path{fill:rgba(255,214,140,.07);stroke:#7a5530;stroke-width:6}.gs-win .gs-mull{fill:none;stroke-width:5}
.gs-rose{fill:rgba(232,72,59,.14);stroke:#7a5530;stroke-width:4}
.gs-beam{position:absolute;left:50%;top:0;width:60vmin;height:120vh;translate:-50% 0;transform:skewX(-14deg);transform-origin:50% 0;background:linear-gradient(180deg,rgba(255,220,150,.20),rgba(255,220,150,.04) 70%,transparent);filter:blur(10px);animation:gs-beam 10s ease-in-out infinite}
@keyframes gs-beam{50%{opacity:.6}}
.gs-motes i{position:absolute;width:calc(3px * var(--s));height:calc(3px * var(--s));border-radius:50%;background:#ffe2a8;box-shadow:0 0 6px #ffd27a;opacity:.0;animation:gs-mote 9s ease-in-out var(--d) infinite}
@keyframes gs-mote{0%,100%{opacity:0;translate:0 0}40%{opacity:.8}60%{opacity:.6;translate:14px -18px}}
.gs-letters b{position:absolute;top:-60px;font-size:30px;font-weight:400;color:#2a1608;opacity:0;font-family:var(--display,serif);text-shadow:0 0 1px rgba(244,227,193,.6),0 0 14px rgba(244,227,193,.25);-webkit-text-stroke:.6px rgba(244,227,193,.55);animation:gs-fall var(--t) linear var(--d) infinite}
.gs-letters b.rub{color:#E8483B;-webkit-text-stroke:0;text-shadow:0 0 12px rgba(232,72,59,.5)}
@keyframes gs-fall{0%{opacity:0;transform:translate(0,0) rotate(0)}12%{opacity:.55}85%{opacity:.4}100%{opacity:0;transform:translate(var(--x),112vh) rotate(var(--r))}}
.gs-frame{position:absolute;inset:0;width:100%;height:100%;fill:none}
.gs-b1{stroke:#C99A5A;stroke-width:3;stroke-dasharray:1;stroke-dashoffset:1;animation:gs-draw 4s ease-out .3s forwards;opacity:.6}
.gs-b2{stroke:#E8483B;stroke-width:1.5;stroke-dasharray:.006 .006;opacity:.55}
.gs-frame path{stroke:rgba(244,227,193,.28);stroke-width:2;stroke-linecap:round;stroke-dasharray:1;stroke-dashoffset:1;animation:gs-write 9s ease-in-out var(--d) infinite}
@keyframes gs-draw{to{stroke-dashoffset:0}}
@keyframes gs-write{0%{stroke-dashoffset:1;opacity:0}10%{opacity:1}50%,80%{stroke-dashoffset:0;opacity:1}100%{stroke-dashoffset:0;opacity:0}}
.gs-corner{position:absolute;width:64px;height:64px;border:3px solid #C99A5A;opacity:.7}
.gs-corner::after{content:"";position:absolute;width:14px;height:14px;background:#E8483B;transform:rotate(45deg);box-shadow:0 0 10px rgba(232,72,59,.6)}
.gs-corner.tl{left:14px;top:14px;border-right:0;border-bottom:0}.gs-corner.tl::after{left:-9px;top:-9px}
.gs-corner.tr{right:14px;top:14px;border-left:0;border-bottom:0}.gs-corner.tr::after{right:-9px;top:-9px}
.gs-corner.bl{left:14px;bottom:14px;border-right:0;border-top:0}.gs-corner.bl::after{left:-9px;bottom:-9px}
.gs-corner.br{right:14px;bottom:14px;border-left:0;border-top:0}.gs-corner.br::after{right:-9px;bottom:-9px}
@media (prefers-reduced-motion:reduce){.gh-lab *,.gh-dome *,.gh-stage *,.gh-script *{animation:none!important}.gl-bubbles,.gl-steam,.gp-suits,.gp-smoke,.gs-letters,.gh-dome u{display:none}.gs-b1,.gs-frame path{stroke-dashoffset:0}}
`;
