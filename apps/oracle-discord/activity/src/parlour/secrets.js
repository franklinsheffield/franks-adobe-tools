// The Séance Parlour (Madame Rook): its animated menu background and its 20 hidden finds ("Hidden Parlour").
// Same shape as hosts/alchemist-secrets.js; see hosts/secrets.js for the events and the api.
// Every line carries a real fact. Nothing here promises contact with the dead.

/** The menu background: velvet curtains that breathe, a guttering candle and its smoke, a round table with a
 *  fringed cloth, a talking board whose planchette glides, and a Houdini lecture playbill.
 *  Hotspots (data-tap): tassel, bgtable, cloth, bgcandle, planchette, playbill, ltr-A..ltr-Z, yes, no, goodbye. */
export const PARLOUR_BG_CSS = `
.mb-parlour .mbp-cur{transform-box:fill-box;transform-origin:50% 0;animation:mbp-breathe 7s ease-in-out infinite}.mb-parlour .mbp-cur.r{animation-delay:-3.5s}
@keyframes mbp-breathe{0%,100%{transform:scaleX(1) skewX(0)}50%{transform:scaleX(1.03) skewX(1.2deg)}}
.mb-parlour .mbp-flame{transform-box:fill-box;transform-origin:50% 100%;animation:mbp-gutter 1.3s ease-in-out infinite alternate}
@keyframes mbp-gutter{0%{transform:scale(1,1) rotate(-2deg);opacity:.95}60%{transform:scale(.9,1.12) rotate(3deg)}100%{transform:scale(1.05,.92) rotate(-1deg);opacity:.8}}
.mb-parlour.out .mbp-flame,.mb-parlour.out .mbp-glow{opacity:0;animation:none}.mb-parlour.out .mbp-lum{opacity:1}
.mb-parlour .mbp-lum{opacity:0;transition:opacity 1s}
.mb-parlour .mbp-glow{animation:mbp-pulse 2.6s ease-in-out infinite}@keyframes mbp-pulse{0%,100%{opacity:.35}50%{opacity:.55}}
.mb-parlour .mbp-smoke{animation:mbp-smoke var(--t,9s) linear infinite;animation-delay:var(--d,0s)}
@keyframes mbp-smoke{0%{transform:translate(0,0) scale(.6);opacity:0}15%{opacity:.35}100%{transform:translate(var(--x,20px),-170px) scale(2.2);opacity:0}}
.mb-parlour .mbp-plan{animation:mbp-glide 16s ease-in-out infinite}
@keyframes mbp-glide{0%,100%{transform:translate(0,0)}20%{transform:translate(-62px,-8px)}40%{transform:translate(48px,-14px)}60%{transform:translate(-20px,10px)}80%{transform:translate(70px,4px)}}
.mb-parlour .mbp-ltr:hover text,.mb-parlour .mbp-word:hover{fill:#FFE3A3}.mb-parlour .mb-hot:hover{filter:brightness(1.35)}
.mb-parlour .mbp-fringe{animation:mbp-sway 4s ease-in-out infinite alternate}@keyframes mbp-sway{to{transform:translateX(2px)}}`;

const BOARD = { x: 400, y: 196, w: 250, h: 92 };
export function parlourBgHtml(at = Date.now(), { rnd = Math.random } = {}) {
  const row1 = "ABCDEFGHIJKLM", row2 = "NOPQRSTUVWXYZ";
  const letter = (ch, i, row) => { const n = 13, x = BOARD.x + 18 + (i * (BOARD.w - 36)) / (n - 1), y = BOARD.y + (row ? 50 : 30) + Math.abs(i - 6) * (row ? 0.6 : -0.6);
    return `<g class="mb-hot mbp-ltr" data-tap="ltr-${ch}"><rect x="${(x - 8).toFixed(1)}" y="${(y - 13).toFixed(1)}" width="16" height="17" fill="transparent"/><text x="${x.toFixed(1)}" y="${y.toFixed(1)}" font-size="13" text-anchor="middle" fill="#2A0F24" font-family="Georgia,serif">${ch}</text></g>`; };
  const smoke = Array.from({ length: 6 }, (_, i) => `<circle class="mbp-smoke" style="--d:${(i * 1.5 + rnd()).toFixed(1)}s;--t:${(8 + rnd() * 4).toFixed(1)}s;--x:${(-30 + rnd() * 60).toFixed(0)}px" cx="160" cy="150" r="${(5 + rnd() * 4).toFixed(1)}" fill="#cfc6d8"/>`).join("");
  const fringe = Array.from({ length: 22 }, (_, i) => `<line x1="${206 + i * 6}" y1="222" x2="${206 + i * 6}" y2="232" stroke="#E2B04A" stroke-width="1.2"/>`).join("");
  return `<div class="menu-bg mb-parlour" aria-hidden="true"><svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
  <defs><radialGradient id="mbp-g" cx="50%" cy="50%" r="50%"><stop offset="0" stop-color="#FFD27A" stop-opacity=".6"/><stop offset="1" stop-color="#FFD27A" stop-opacity="0"/></radialGradient>
  <linearGradient id="mbp-v" x1="0" x2="1"><stop offset="0" stop-color="#3d0b2a"/><stop offset=".5" stop-color="#6b1846"/><stop offset="1" stop-color="#2a0619"/></linearGradient></defs>
  <rect width="800" height="300" fill="#12040d"/>
  <circle class="mbp-glow" cx="160" cy="160" r="150" fill="url(#mbp-g)"/>
  <g class="mbp-cur"><path d="M0 0 H120 Q100 80 118 160 Q96 230 112 300 H0Z" fill="url(#mbp-v)"/><path d="M30 0 V300 M62 0 Q55 150 66 300 M92 0 Q80 150 90 300" stroke="#1a0410" stroke-width="3" fill="none" opacity=".6"/></g>
  <g class="mbp-cur r"><path d="M800 0 H680 Q700 80 682 160 Q704 230 688 300 H800Z" fill="url(#mbp-v)"/><path d="M770 0 V300 M738 0 Q745 150 734 300 M708 0 Q720 150 710 300" stroke="#1a0410" stroke-width="3" fill="none" opacity=".6"/></g>
  <g class="mb-hot" data-tap="tassel"><line x1="690" y1="150" x2="690" y2="176" stroke="#E2B04A" stroke-width="2"/><path d="M684 176 h12 l3 22 h-18z" fill="#E2B04A"/><circle cx="690" cy="174" r="5" fill="#FFE3A3"/></g>
  <g class="mb-hot" data-tap="playbill"><rect x="560" y="24" width="96" height="128" fill="#e9dcc0" stroke="#7a5a2a" transform="rotate(3 608 88)"/>
   <g transform="rotate(3 608 88)" font-family="Georgia,serif" text-anchor="middle" fill="#3a0a0a"><text x="608" y="48" font-size="11" font-weight="bold">HOUDINI</text><text x="608" y="68" font-size="9">DO SPIRITS</text><text x="608" y="80" font-size="9">RETURN?</text><text x="608" y="104" font-size="8">Houdini says</text><text x="608" y="120" font-size="14" font-weight="bold" fill="#8a0d0d">NO</text><text x="608" y="138" font-size="7">and proves it</text></g></g>
  ${smoke}
  <g class="mb-hot" data-tap="bgcandle"><rect x="152" y="160" width="16" height="44" rx="2" fill="#efe6d2"/><path d="M152 166 q4 6 0 12" stroke="#d9ccb0" fill="none"/><line x1="160" y1="160" x2="160" y2="152" stroke="#222"/>
   <path class="mbp-flame" d="M160 128 C170 142 168 152 160 154 C152 152 150 142 160 128Z" fill="#FFB347"/><rect x="140" y="204" width="40" height="6" rx="3" fill="#7a5a2a"/></g>
  <g class="mb-hot" data-tap="bgtable"><ellipse cx="270" cy="212" rx="78" ry="16" fill="#3a1a10" stroke="#7a4a2a"/><rect x="262" y="222" width="16" height="70" fill="#2a1208"/></g>
  <g class="mb-hot" data-tap="cloth"><path d="M196 212 Q270 236 344 212 L340 222 Q270 244 200 222Z" fill="#5a1838"/><g class="mbp-fringe">${fringe}</g></g>
  <path class="mbp-lum" d="M256 196 L262 150 L268 150 L274 196Z" fill="none" stroke="#c8ffb0" stroke-width="2"/>
  <rect x="${BOARD.x}" y="${BOARD.y}" width="${BOARD.w}" height="${BOARD.h}" rx="14" fill="#c9a66b" stroke="#5a3a1a" stroke-width="2"/>
  <g class="mb-hot mbp-word" data-tap="yes"><text x="${BOARD.x + 26}" y="${BOARD.y + 13}" font-size="10" fill="#2A0F24" font-family="Georgia,serif">YES</text></g>
  <g class="mb-hot mbp-word" data-tap="no"><text x="${BOARD.x + BOARD.w - 40}" y="${BOARD.y + 13}" font-size="10" fill="#2A0F24" font-family="Georgia,serif">NO</text></g>
  ${[...row1].map((c, i) => letter(c, i, 0)).join("")}${[...row2].map((c, i) => letter(c, i, 1)).join("")}
  <g class="mb-hot mbp-word" data-tap="goodbye"><text x="${BOARD.x + BOARD.w / 2}" y="${BOARD.y + 84}" font-size="10" text-anchor="middle" fill="#2A0F24" font-family="Georgia,serif" letter-spacing="2">GOOD BYE</text></g>
  <g class="mbp-plan"><g class="mb-hot" data-tap="planchette"><path d="M520 238 C540 222 560 238 552 262 L526 262 C516 252 514 244 520 238Z" fill="#e9dcc0" fill-opacity=".85" stroke="#5a3a1a"/><circle cx="536" cy="246" r="6" fill="none" stroke="#5a3a1a" stroke-width="1.5"/></g></g>
  </svg></div>`;
}

const inHour = (at, h) => new Date(at).getHours() === h;
const onDay = (at, m, d) => { const x = new Date(at); return x.getMonth() + 1 === m && x.getDate() === d; };
const EMOTES = ["wave", "love", "laugh", "gasp", "spook", "dance", "wink", "think"];
/** Darken or light the menu background's candle (no-op outside a browser). */
const candle = (out) => { try { document.querySelectorAll(".mb-parlour").forEach((el) => el.classList.toggle("out", out)); } catch { /* not in a browser */ } };

/** Hidden Parlour: 20 finds. Pays 💎 Essence; the rare ones pay 🗝️ skeleton keys. Hints are riddles. */
export const PARLOUR_SECRETS = {
  label: "🕯️ Hidden Parlour",
  items: [
    { id: "knock", e: "👊", name: "Knock, knock", hint: "Ask the table behind the menu a question the old way: three knocks.", pay: { gem: 15 } },
    { id: "knee", e: "🦵", name: "Under the cloth", hint: "Lift the hem of the tablecloth. What is the table resting on?", pay: { gem: 20 } },
    { id: "luminous", e: "📯", name: "The glowing trumpet", hint: "Put out the candle, then look for the trumpet in the dark.", pay: { gem: 25 } },
    { id: "ideomotor", e: "🫳", name: "Who moved it?", hint: "Stop the planchette three times. Ask yourself whose hand moved it.", pay: { gem: 20 } },
    { id: "ouija", e: "🔤", name: "The board's own name", hint: "Spell the board's name on the board.", pay: { gem: 25 } },
    { id: "goodbye", e: "👋", name: "Say goodbye", hint: "Every session on the board is supposed to end the same way.", pay: { gem: 15 } },
    { id: "halloween", e: "🎃", name: "The last night of October", hint: "Visit on the night a famous escape artist died.", pay: { token: 2 }, rare: true },
    { id: "houdini", e: "⛓️", name: "Ehrich Weisz's birthday", hint: "Visit on the spring birthday of a boy from Budapest who became the world's best-known magician.", pay: { token: 2 }, rare: true },
    { id: "hydesville", e: "🏚️", name: "Hydesville night", hint: "Visit on the last night of March, when two sisters first heard the raps.", pay: { token: 2 }, rare: true },
    { id: "patent", e: "📜", name: "Patent day", hint: "Visit on the February day in 1891 when the talking board became an invention on paper.", pay: { token: 1 }, rare: true },
    { id: "witching", e: "🌑", name: "The witching hour", hint: "Visit in the first hour of the day.", pay: { gem: 15 } },
    { id: "cabinet", e: "🚪", name: "Knock on the cabinet", hint: "Three knocks on the spirit cabinet. Who is tied up inside?", pay: { gem: 15 } },
    { id: "tassel", e: "🎭", name: "Ring down the curtain", hint: "Pull the curtain's tassel three times, like a stage magician taking a bow.", pay: { gem: 15 } },
    { id: "playbill", e: "🎟️", name: "Read the playbill", hint: "The poster on the wall asks a question. Read the answer.", pay: { gem: 15 } },
    { id: "veil", e: "🖤", name: "Behind the veil", hint: "Three taps near her eyes. She'll lift the veil.", pay: { gem: 15 } },
    { id: "crystal", e: "🔮", name: "Shew-stone", hint: "Tap the crystal five times and gaze into it.", pay: { gem: 15 } },
    { id: "coldread", e: "🧠", name: "Read, then reveal", hint: "Think hard, then make the big reveal. Quickly.", pay: { gem: 20 } },
    { id: "repertoire", e: "🎪", name: "The whole act", hint: "Use every one of her eight gestures.", pay: { gem: 25 } },
    { id: "clean", e: "✨", name: "Not a single slip", hint: "Win a game here without a single mistake.", pay: { gem: 25 } },
    { id: "debunker", e: "🔎", name: "Debunker", hint: "Crack one of the hardest cases in the files.", pay: { token: 1 }, rare: true },
  ],
  event(kind, d, api) {
    const S = (PARLOUR_SECRETS._s ||= { word: "", out: 0, used: new Set(), think: 0 });
    if (kind === "tap") {
      const t = d.tap;
      if (t === "bgtable" && d.count >= 3) api.find("knock", "Knock, knock. In 1848 Kate Fox snapped her fingers and said 'Mr Splitfoot, do as I do', and the raps answered.");
      if (t === "cloth") api.find("knee", "Just a knee. At Cambridge in 1895, investigators saw Eusapia Palladino lift the table with her knees and feet.");
      if (t === "bgcandle") { S.out = S.out ? 0 : api.at; candle(!!S.out); }
      if (t === "trumpet" && S.out) api.find("luminous", "There it is, glowing. Mediums painted trumpets with luminous paint so sitters could watch them 'float' in the dark.");
      if (t === "planchette" && d.count >= 3) api.find("ideomotor", "Yours. William Carpenter named it the ideo-motor response in 1852: muscles move with an idea, with no decision to move them.");
      if (/^ltr-[A-Z]$/.test(t)) { S.word = (S.word + t.slice(4)).slice(-5); if (S.word === "OUIJA") api.find("ouija", "OUIJA. Its makers said the board spelled its own name in 1890. Nobody has ever shown where the word really came from."); }
      if (t === "goodbye") api.find("goodbye", "Good bye. Talking boards have printed GOOD BYE at the bottom since the 1890s, so every sitting has a way to end.");
      if (t === "cabinet" && d.count >= 3) api.find("cabinet", "Nobody's in. In 1865 the Davenport brothers were tied in a cabinet like this one, and the instruments still played.");
      if (t === "tassel" && d.count >= 3) api.find("tassel", "Curtain! In 1865 John Nevil Maskelyne copied the Davenports' cabinet act on stage to show it was a trick.");
      if (t === "playbill") api.find("playbill", "'Do Spirits Return? Houdini Says No, and Proves It.' Houdini toured with lectures exposing mediums in the 1920s.");
    }
    if (kind === "poke" && d.zone === "eye" && d.count >= 3) api.find("veil", "The veil's up. Mourning black was everywhere in Victorian parlours after Queen Victoria lost Albert in 1861.");
    if (kind === "poke" && d.zone === "orb" && d.count >= 5) api.find("crystal", "Gaze away. In the 1580s John Dee's scryer, Edward Kelley, claimed to see angels in a 'shew-stone'.");
    if (kind === "emote") {
      S.used.add(d.id); if (EMOTES.every((e) => S.used.has(e))) api.find("repertoire", "The whole act. In 1924 Houdini explained many of these tricks in A Magician Among the Spirits.");
      if (d.id === "think") S.think = api.at;
      if (d.id === "dance" && S.think && api.at - S.think < 3000) api.find("coldread", "Read, then reveal. Ray Hyman described cold reading step by step in 1977.");
    }
    if (kind === "home") {
      if (inHour(api.at, 0)) api.find("witching", "'Tis now the very witching time of night', says Hamlet. A good hour for a séance, and for a magic show.");
      if (onDay(api.at, 10, 31)) api.find("halloween", "Houdini died on 31 October 1926. Bess Houdini held a séance for him each Halloween for ten years, and in 1936 said ten years was long enough to wait.");
      if (onDay(api.at, 3, 24)) api.find("houdini", "Happy birthday, Houdini: born Erik Weisz in Budapest on 24 March 1874.");
      if (onDay(api.at, 3, 31)) api.find("hydesville", "31 March 1848, Hydesville, New York: Kate and Maggie Fox's raps began. In 1888 Maggie showed how she made them.");
      if (onDay(api.at, 2, 10)) api.find("patent", "On 10 February 1891 the US Patent Office granted the patent for the Ouija talking board.");
    }
    if (kind === "result" && d.won && d.perfect) api.find("clean", "Not a single slip. The Fox sisters kept their raps going for forty years, from 1848 to 1888.");
    if (kind === "result" && d.won && d.room === "casefiles" && d.level === 3) api.find("debunker", "Debunker! Scientists and magicians checking claims together is how most of these cases were cracked.");
  },
};
