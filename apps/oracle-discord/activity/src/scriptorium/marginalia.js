// The Scriptorium's animated menu background and its 20 hidden finds ("the Marginalia").
// Contract (hosts/secrets.js, Houses thread): menuBg = { css, html(at, { prog }) }, secrets = { label, items, event(kind, data, api) }.
// The engine pays, tracks finds in prog.houses.scriptorium.sec and draws the drawer. Every line carries a real fact.

const hourOf = (at) => new Date(at || Date.now()).getHours();
/** Canonical hour for a clock hour (approximate monastic day). */
export function officeOf(h) {
  if (h < 3) return "Matins"; if (h < 6) return "Lauds"; if (h < 9) return "Prime"; if (h < 12) return "Terce";
  if (h < 15) return "Sext"; if (h < 18) return "None"; if (h < 21) return "Vespers"; return "Compline";
}
const night = (h) => h < 6 || h >= 19;

// ---- 1. the background: a scriptorium desk under an arched window ----
const hot = (tap, label, body) => `<g class="mb-hot" data-tap="${tap}" aria-label="${label}">${body}</g>`;
const stars = () => [[120, 120], [168, 96], [205, 140], [140, 170], [222, 104], [180, 196]].map(([x, y], i) => `<circle class="scr-star" style="animation-delay:${i * 0.7}s" cx="${x}" cy="${y}" r="2" fill="#f6ecd0"/>`).join("");
const motes = () => Array.from({ length: 9 }, (_, i) => `<circle class="scr-mote" style="animation-delay:${(i * 1.3).toFixed(1)}s;--dx:${(i % 3) * 14 - 14}px" cx="${230 + i * 22}" cy="${330 + (i % 4) * 30}" r="${1.5 + (i % 3) * 0.6}" fill="#fff3c4"/>`).join("");
const SPINES = [["#7a2b22", 26], ["#2f4a6b", 20], ["#5d3b1c", 30], ["#6b5a1f", 18], ["#38502f", 24], ["#7a2b22", 22], ["#4a2f4f", 28]];
const spines = () => { let x = 700; return SPINES.map(([c, w], i) => { const s = `<rect x="${x}" y="${108 - (i % 3) * 6}" width="${w}" height="${82 + (i % 3) * 6}" rx="2" fill="${c}" stroke="#1d120a"/><rect x="${x + 3}" y="${124}" width="${w - 6}" height="4" fill="#c9a24a" opacity=".7"/>`; x += w + 3; return s; }).join(""); };

export const menuBg = {
  css: `
.scr-bg{position:absolute;inset:0;overflow:hidden;pointer-events:none}
.scr-bg svg{width:100%;height:100%;display:block}
.scr-bg .mb-hot{pointer-events:auto;cursor:pointer}
.scr-bg .mb-hot:hover{filter:drop-shadow(0 0 6px #ffd98a)}
.scr-star{animation:scr-tw 4s ease-in-out infinite}
.scr-mote{animation:scr-mote 11s linear infinite;opacity:0}
.scr-flame{transform-origin:520px 318px;animation:scr-fl 1.6s ease-in-out infinite}
.scr-glow{animation:scr-gl 1.6s ease-in-out infinite}
.scr-ink{stroke-dasharray:240;stroke-dashoffset:240;animation:scr-write 9s linear infinite}
.scr-ink.l2{animation-delay:3s}.scr-ink.l3{animation-delay:6s}
.scr-quill{animation:scr-quill 3s ease-in-out infinite;transform-origin:430px 420px}
.scr-tail{transform-origin:860px 470px;animation:scr-tail 3.4s ease-in-out infinite}
.scr-mouse{animation:scr-mouse 14s ease-in-out infinite}
.scr-snail{animation:scr-snail 22s ease-in-out infinite alternate}
.scr-rope{transform-origin:600px 0;animation:scr-rope 7s ease-in-out infinite}
@keyframes scr-tw{50%{opacity:.25}}
@keyframes scr-mote{0%{opacity:0;transform:translate(0,0)}15%{opacity:.8}100%{opacity:0;transform:translate(var(--dx),-120px)}}
@keyframes scr-fl{50%{transform:scaleY(1.12) skewX(3deg)}}
@keyframes scr-gl{50%{opacity:.75}}
@keyframes scr-write{60%,100%{stroke-dashoffset:0}}
@keyframes scr-quill{50%{transform:rotate(-4deg) translateX(10px)}}
@keyframes scr-tail{50%{transform:rotate(12deg)}}
@keyframes scr-mouse{0%,70%,100%{transform:translateX(26px)}78%,92%{transform:translateX(0)}}
@keyframes scr-snail{to{transform:translateY(-38px)}}
@keyframes scr-rope{50%{transform:rotate(1.2deg)}}
@media (prefers-reduced-motion:reduce){.scr-bg *{animation:none!important}.scr-ink{stroke-dashoffset:0}}`,
  html(at = Date.now()) {
    const h = hourOf(at), dark = night(h);
    const sky = dark ? "#16203a" : h < 9 || h >= 17 ? "#e9b77a" : "#9cc6e6";
    return `<div class="scr-bg" aria-hidden="true"><svg viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice">
<defs><radialGradient id="scr-cg" cx="520" cy="320" r="220" gradientUnits="userSpaceOnUse"><stop offset="0" stop-color="#ffcf7a" stop-opacity=".45"/><stop offset="1" stop-color="#ffcf7a" stop-opacity="0"/></radialGradient></defs>
<rect width="1000" height="600" fill="#2a1b10"/><rect width="1000" height="600" fill="url(#scr-cg)" class="scr-glow"/>
${hot("window", "window", `<path d="M90 380 V140 Q90 60 170 60 Q250 60 250 140 V380Z" fill="${sky}" stroke="#5a3d22" stroke-width="10"/><path d="M170 62 V380 M92 220 H248" stroke="#5a3d22" stroke-width="6"/>${dark ? stars() + `<circle cx="210" cy="110" r="14" fill="#f6ecd0"/>` : ""}`)}
${dark ? "" : `<polygon points="250,150 250,380 560,560 640,560" fill="#fff3c4" opacity=".08"/>${motes()}`}
<rect x="680" y="196" width="230" height="10" fill="#4a2f18"/>${hot("book", "chained book", spines())}
${hot("worm", "worm hole", `<circle cx="744" cy="150" r="3" fill="#120a05"/><circle cx="752" cy="160" r="2" fill="#120a05"/>`)}
${hot("frame", "drying vellum", `<rect x="300" y="70" width="140" height="150" fill="none" stroke="#5a3d22" stroke-width="8"/><path d="M318 88 Q370 80 422 90 L418 204 Q370 210 322 202Z" fill="#e8d9b4"/><path d="M304 74 L318 88 M436 74 L422 90 M304 216 L322 202 M436 216 L418 204" stroke="#bda57a"/>`)}
<g class="scr-rope">${hot("bell", "bell rope", `<path d="M600 0 V160" stroke="#a8844c" stroke-width="5"/><ellipse cx="600" cy="170" rx="9" ry="14" fill="#7a2b22"/>`)}</g>
<path d="M0 470 L1000 430 L1000 600 L0 600Z" fill="#4a2f18"/><path d="M300 440 L760 410 L780 470 L290 500Z" fill="#6b4524"/>
${hot("page", "page", `<path d="M340 440 L700 418 L712 462 L332 488Z" fill="#efe2c2"/><path class="scr-ink" d="M360 450 L560 437" stroke="#2a1b10" stroke-width="2.5" fill="none"/><path class="scr-ink l2" d="M362 462 L600 446" stroke="#2a1b10" stroke-width="2.5" fill="none"/><path class="scr-ink l3" d="M364 474 L520 464" stroke="#a52a1e" stroke-width="2.5" fill="none"/>`)}
${hot("hand", "manicule", `<path d="M650 446 h22 l6 -4 v8 l-6 -4" stroke="#2a1b10" stroke-width="2" fill="none"/><circle cx="648" cy="446" r="3" fill="#2a1b10"/>`)}
${hot("drollery", "margin beast", `<path d="M684 432 q6 -12 14 -4 q6 8 -4 10 q8 6 0 10" stroke="#2f4a6b" stroke-width="2" fill="none"/><circle cx="696" cy="428" r="1.6" fill="#a52a1e"/>`)}
<g class="scr-snail">${hot("snail", "snail", `<path d="M705 470 q10 -2 16 2" stroke="#6b5a1f" stroke-width="3"/><circle cx="716" cy="464" r="6" fill="none" stroke="#6b5a1f" stroke-width="2.5"/>`)}</g>
<g class="scr-quill">${hot("quill", "quill", `<path d="M430 420 Q470 330 520 260" stroke="#f3efe6" stroke-width="3" fill="none"/><path d="M520 260 Q500 300 470 350 Q486 300 520 260Z" fill="#f3efe6" opacity=".85"/>`)}</g>
${hot("inkwell", "inkwell", `<path d="M250 470 h40 l-4 -26 h-32Z" fill="#1d120a"/><ellipse cx="270" cy="444" rx="16" ry="5" fill="#0b0704"/>`)}
${hot("shells", "paint shells", `<ellipse cx="226" cy="482" rx="12" ry="6" fill="#efe2c2"/><ellipse cx="226" cy="480" rx="8" ry="3" fill="#1f4fbf"/><ellipse cx="200" cy="488" rx="11" ry="5" fill="#efe2c2"/><ellipse cx="200" cy="486" rx="7" ry="3" fill="#a52a1e"/>`)}
${hot("candle", "candle", `<rect x="510" y="330" width="20" height="80" fill="#efe2c2"/><path class="scr-flame" d="M520 296 Q532 316 520 330 Q508 316 520 296Z" fill="#ffb347"/><rect x="498" y="408" width="44" height="8" rx="3" fill="#8a6a3a"/>`)}
${hot("cat", "white cat", `<ellipse cx="830" cy="470" rx="46" ry="20" fill="#f3efe6"/><circle cx="788" cy="456" r="16" fill="#f3efe6"/><path d="M776 444 l4 -12 l6 10 M792 442 l6 -10 l2 12" fill="#f3efe6"/><path d="M782 456 q3 2 6 0 M792 456 q3 2 6 0" stroke="#2a1b10" stroke-width="1.5" fill="none"/><path class="scr-tail" d="M874 472 Q912 470 904 440" stroke="#f3efe6" stroke-width="8" fill="none" stroke-linecap="round"/>`)}
<path d="M940 560 q20 -36 40 0Z" fill="#120a05"/><g class="scr-mouse">${hot("mouse", "mouse", `<ellipse cx="952" cy="552" rx="10" ry="6" fill="#8b7d6b"/><circle cx="944" cy="548" r="3" fill="#8b7d6b"/>`)}</g>
</svg></div>`;
  },
};

// ---- 2. the Marginalia: 20 hidden finds, each a real fact ----
const T = (token, gem = 0) => ({ token, ...(gem ? { gem } : {}) });
export const MARGINALIA = [
  { id: "pangur", e: "🐈", name: "Pangur Bán", hint: "The white cat is asleep. Wake it, gently, more than once.", pay: T(2), line: "Pangur Bán: a 9th-century Irish monk wrote a poem comparing his cat's mouse-hunting to his own hunt for meaning." },
  { id: "paws", e: "🐾", name: "Inky paw prints", hint: "Cats and wet pages do not mix. Let the cat near the page.", pay: T(2), line: "A 15th-century manuscript in Dubrovnik has a cat's inky paw prints walking across the page." },
  { id: "snail", e: "🐌", name: "Knight vs snail", hint: "Something slow is climbing the margin.", pay: T(1), line: "Knights fighting snails appear in dozens of 13th and 14th-century margins. Nobody is sure why." },
  { id: "mouse", e: "🐭", name: "The archive's enemy", hint: "Something small lives in the hole by the floor.", pay: T(1), line: "Mice and insects ate parchment and glue, which is one reason monasteries kept cats." },
  { id: "dark", e: "🌇", name: "Soon be dark", hint: "Visit when the light is going.", pay: T(2), line: "An Irish scribe wrote in a margin: 'Thank God, it will soon be dark.' The working day ended with the light." },
  { id: "drudgery", e: "✍️", name: "Excessive drudgery", hint: "Keep the quill busy for a while.", pay: T(2), line: "Florentius of Valeránica, 945: 'Writing is excessive drudgery. It crooks your back, it dims your sight.'" },
  { id: "curse", e: "⛓️", name: "The book curse", hint: "Pull a book off the shelf. Then again. Then again.", pay: T(2), line: "Scribes wrote curses into books against thieves, and libraries chained their books to the shelves." },
  { id: "palimpsest", e: "🧽", name: "Palimpsest", hint: "Scrape the page. Keep scraping.", pay: T(3), rare: true, line: "In 1229 a scribe scraped Archimedes off a parchment to write prayers. Imaging in the 2000s read him again." },
  { id: "irongall", e: "🫙", name: "Iron gall ink", hint: "What is in the inkwell?", pay: T(1), line: "Iron gall ink: crushed oak galls plus iron sulfate. It darkens as it dries and can slowly eat through the page." },
  { id: "vellum", e: "🐄", name: "Stretched skin", hint: "Something is drying on the frame.", pay: T(1), line: "Vellum is calfskin, stretched and scraped. The Codex Amiatinus Bible needed the skins of about 500 calves." },
  { id: "lapis", e: "💙", name: "Ultramarine", hint: "Look at the paint shells.", pay: T(2), line: "Ultramarine was ground from Afghan lapis lazuli. Flecks of it were found in the teeth of a medieval woman buried at Dalheim, Germany." },
  { id: "hours", e: "🔔", name: "The hours", hint: "Ring the bell.", pay: T(1), line: "Monks kept eight daily offices, from Matins to Compline. The bells set the scribe's working day." },
  { id: "worm", e: "🪱", name: "Wormholes", hint: "Something has bored into a spine.", pay: T(2), line: "Wormholes in old woodcut blocks print as white dots, and a biologist used them to date the prints." },
  { id: "drollery", e: "🐉", name: "Drollery", hint: "A beast is doodled in the margin.", pay: T(1), line: "Drolleries are the odd hybrid beasts in Gothic margins: part bird, part fish, part bishop." },
  { id: "manicule", e: "☞", name: "Manicule", hint: "Something in the margin is pointing.", pay: T(1), line: "The manicule ☞ is a little pointing hand readers drew to say 'look here'. It is centuries older than the emoji." },
  { id: "rubric", e: "🟥", name: "Rubric", hint: "Name a script at the Inscription Tray.", pay: T(2), line: "Rubric comes from Latin rubrica, red ochre. Headings were written in red, often by a separate rubricator." },
  { id: "explicit", e: "📜", name: "Explicit", hint: "Finish any game here without a single blot.", pay: T(3), line: "Explicit: 'it is unrolled'. Scribes wrote it at the end of a book, sometimes with a plea for wine." },
  { id: "pentrial", e: "🖋️", name: "Pen trial", hint: "Try the quill, then dip it.", pay: T(1), line: "Probationes pennae: scribes tested a new nib with scribbles and stray alphabets in the margins." },
  { id: "kissed", e: "💋", name: "Worn by love", hint: "Wren does not like being poked. Try anyway.", pay: T(2), line: "Readers kissed and rubbed favourite pictures in prayer books until the paint wore away. Scholars can measure it." },
  { id: "daylight", e: "🕯️", name: "Daylight only", hint: "Fuss with the candle. Fuss a lot.", pay: T(3, 10), rare: true, line: "Fire was the scriptorium's great fear, so many monasteries worked by daylight and kept candles away from books." },
];

const ON_TAP = { cat: ["pangur", 3], snail: ["snail", 1], mouse: ["mouse", 2], quill: ["drudgery", 5], book: ["curse", 3], page: ["palimpsest", 6],
  inkwell: ["irongall", 1], frame: ["vellum", 1], shells: ["lapis", 1], bell: ["hours", 1], worm: ["worm", 1], drollery: ["drollery", 1], hand: ["manicule", 1], candle: ["daylight", 7] };
const lineOf = (id) => MARGINALIA.find((m) => m.id === id).line;
let lastTap = "", pokes = 0;

export const secrets = {
  label: "🪶 Marginalia",
  items: MARGINALIA.map(({ line, ...m }) => m),
  /** kind: home | poke | emote | result | tap. data shapes per hosts/secrets.js; read defensively. */
  event(kind, data = {}, api) {
    const find = (id) => api.find(id, lineOf(id));
    if (kind === "tap") {
      const { tap, count = 1 } = data, rule = ON_TAP[tap];
      if (rule && count >= rule[1]) find(rule[0]);
      if (tap === "page" && lastTap === "cat") find("paws");
      if (tap === "inkwell" && lastTap === "quill") find("pentrial");
      if (tap === "bell") api.say?.(`The bell rings for ${officeOf(hourOf(data.at))}.`);
      lastTap = tap;
    } else if (kind === "home") {
      const h = hourOf(data.at); if (h >= 17 && h < 21) find("dark");
    } else if (kind === "poke") {
      pokes = Math.max(pokes + 1, data.count || 0); if (pokes >= 5) find("kissed");
    } else if (kind === "result") {
      if (data.room === "inscriptions" && data.won) find("rubric");
      if (data.perfect) find("explicit");
    }
  },
};
export const _reset = () => { lastTap = ""; pokes = 0; };
