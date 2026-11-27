// House 3: the Observatory (#🌌-observatory). Host: the Keeper of Hours, an owl-faced astronomer with a tiny orrery
// circling her hood. She reuses the Oracle's figure rig (moods, hands, eye tracking and emotes all work) with a night-blue
// hood, a silver owl disc round the eye and an eye coloured like a real star you choose in the store. Lines are original;
// every fact in them is real.
import { vinylSvg } from "../player.js";

const NS = "http://www.w3.org/2000/svg";

/** Star-colour eyes, each the colour of a real star of that spectral class. Iris gradient: light, mid, deep. */
export const STAR_EYES = [
  { id: "eye-sun", name: "The Sun (G)", price: 0, iris: ["#FFFBEA", "#FFE9A8", "#C9A24A"], note: "A G-type star, about 5,800 K at the surface. From space it looks white; our air makes it look yellow." },
  { id: "eye-naos", name: "Naos (O)", price: 30, iris: ["#E6ECFF", "#8FA8FF", "#2F45B8"], note: "Zeta Puppis, an O-type star near 40,000 K. One of the hottest stars you can see without a telescope." },
  { id: "eye-rigel", name: "Rigel (B)", price: 30, iris: ["#EEF3FF", "#AFC4FF", "#4A64C8"], note: "Orion's blue-white foot. B-type stars run from about 10,000 to 30,000 K." },
  { id: "eye-vega", name: "Vega (A)", price: 40, iris: ["#FFFFFF", "#DDE6FF", "#7F92C9"], note: "Vega, about 9,600 K. For a long time it was the zero point of the star brightness scale." },
  { id: "eye-procyon", name: "Procyon (F)", price: 40, iris: ["#FFFFFF", "#FFF6E0", "#C2AE7E"], note: "Procyon, about 6,500 K, the bright star in Canis Minor. A little hotter than the Sun." },
  { id: "eye-arcturus", name: "Arcturus (K)", price: 40, iris: ["#FFE7C2", "#FFB25C", "#A4561A"], note: "Arcturus, an orange giant about 4,300 K. Follow the arc of the Plough's handle to find it." },
  { id: "eye-betelgeuse", name: "Betelgeuse (M)", price: 50, iris: ["#FFD0B0", "#FF7A3A", "#8F2A0C"], note: "Orion's shoulder, a red supergiant about 3,500 K. It dimmed sharply in 2019 and 2020, then recovered." },
  { id: "eye-crimson", name: "Hind's Crimson Star", price: 60, iris: ["#FFB8B0", "#E3262E", "#6A0410"], note: "R Leporis, a carbon star. Carbon in its outer layers soaks up blue light, so it looks deep red." },
];
export const starEyeOf = (id) => STAR_EYES.find((l) => l.id === id) || STAR_EYES[0];

const starDisc = (l) => `<svg viewBox="0 0 200 200" aria-hidden="true"><defs><radialGradient id="sp-g" cx="50%" cy="50%" r="55%"><stop offset="0" stop-color="${l.iris[0]}"/><stop offset=".45" stop-color="${l.iris[1]}"/><stop offset="1" stop-color="${l.iris[2]}" stop-opacity="0"/></radialGradient></defs>
  <rect width="200" height="200" rx="16" fill="#060a1f"/>${Array.from({ length: 22 }, (_, i) => `<circle cx="${(i * 47) % 200}" cy="${(i * 83) % 200}" r="${0.6 + (i % 3) * 0.4}" fill="#fff" opacity=".7"/>`).join("")}
  <circle cx="100" cy="100" r="82" fill="url(#sp-g)"/><circle cx="100" cy="100" r="26" fill="${l.iris[0]}"/><path d="M100 30V170M30 100H170" stroke="${l.iris[0]}" stroke-opacity=".5" stroke-width="2"/></svg>`;

/** The store shelf (department "House hosts"). prog.stareye = the star the Keeper's eye shines like. */
export const starEyeShop = {
  kind: "stareye", label: "✨ The Keeper's star-colour eyes",
  items: STAR_EYES.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: {
    open: ["Star colours for my eye. A star's colour tells you how hot its surface is.", "Blue stars run hottest, red stars coolest. Astronomers sort them O, B, A, F, G, K, M.", "Every eye here is a real star you can find in the sky. Pick one, then go and look for it."],
    tryon: ["{item}. Look closely. I'm shining.", "{item}. Very becoming, astronomically speaking.", "{item}. I can see further already."],
    buy: ["{item}, fitted. I'll try not to stare. I'm an owl, so no promises.", "{item}! Now my eye matches a corner of the sky.", "{item}. Lovely. Named, catalogued and blinking."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(starDisc(starEyeOf(id))); ctx.cap("✨ " + starEyeOf(id).name); },
};

/** Observatory relics: permanent fixtures in the Keeper's House, bought only with ☄️ comet shards. Notes are real history. */
const AU = `<linearGradient id="hrg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#FADE8C"/><stop offset=".5" stop-color="#C88A3A"/><stop offset="1" stop-color="#6b3f12"/></linearGradient>`;
export const SKY_RELICS = [
  { id: "sk-sundial", e: "🕰️", name: "Bronze sundial", price: 4, note: "The shadow's stick is a gnomon. Point it at the celestial pole and the hours come out right all year.", x: 82, y: 84, w: 9, vb: "0 0 100 90",
    art: () => `<defs>${AU}</defs><ellipse cx="50" cy="86" rx="36" ry="4" fill="#000" opacity=".35"/><rect x="38" y="56" width="24" height="30" fill="#3B4566"/><ellipse cx="50" cy="54" rx="40" ry="12" fill="url(#hrg)" stroke="#6b3f12"/>${Array.from({ length: 9 }, (_, i) => { const a = Math.PI + (i / 8) * Math.PI; return `<path d="M50 54L${(50 + 34 * Math.cos(a)).toFixed(1)} ${(54 + 10 * Math.sin(a)).toFixed(1)}" stroke="#6b3f12" stroke-width=".8"/>`; }).join("")}<path d="M50 54L70 30V54z" fill="#6b3f12"/><path class="hr-shadow" style="transform-origin:50px 54px" d="M50 54L24 60" stroke="#1a1426" stroke-width="3" stroke-linecap="round" opacity=".6"/>` },
  { id: "sk-astrolabe", e: "🧭", name: "Brass astrolabe", price: 6, note: "A hand-held model of the sky. Astronomers in the medieval Islamic world refined it for telling time and finding the direction of prayer.", x: 2, y: 54, w: 15, vb: "0 0 100 130",
    art: () => `<defs>${AU}</defs><circle cx="50" cy="12" r="7" fill="none" stroke="url(#hrg)" stroke-width="3"/><circle cx="50" cy="74" r="44" fill="url(#hrg)" stroke="#6b3f12" stroke-width="2"/><circle cx="50" cy="74" r="36" fill="#1a2350"/><g class="hr-spin" style="transform-origin:50px 74px"><circle cx="50" cy="66" r="22" fill="none" stroke="#FADE8C" stroke-width="1.6"/><path d="M50 40l3 6l-3 2l-3 -2zM28 74h44" stroke="#FADE8C" stroke-width="1.6" fill="#FADE8C"/>${[0, 1, 2, 3, 4].map((i) => `<path d="M${36 + i * 7} ${58 + (i % 2) * 8}l4 -6" stroke="#FADE8C" stroke-width="1.2"/>`).join("")}</g><path d="M50 30V118" stroke="#C88A3A" stroke-width="3"/>` },
  { id: "sk-meteorite", e: "🪨", name: "Iron meteorite", price: 8, note: "Mostly iron and nickel. Cut, polished and etched, many show Widmanstätten crosshatching that forms only over millions of years of slow cooling.", x: 92, y: 42, w: 7, vb: "0 0 70 90",
    art: () => `<ellipse cx="35" cy="86" rx="26" ry="3" fill="#000" opacity=".35"/><rect x="18" y="66" width="34" height="20" fill="#1a2350" stroke="#9AA6C9"/><path d="M12 64q-6 -26 14 -42q18 -14 30 6q12 18 0 36z" fill="#4a4a52" stroke="#24242a" stroke-width="1.5"/><path d="M20 58q-2 -18 10 -28l16 4q8 12 0 24z" fill="#9aa0ad"/>${[0, 1, 2, 3].map((i) => `<path d="M${18 + i * 7} ${34 + i * 2}l14 22M${46 - i * 6} ${32 + i * 3}l-14 24" stroke="#d4d8e0" stroke-width=".6" opacity=".8"/>`).join("")}<path class="hr-glint" d="M22 40l6 -4" stroke="#fff" stroke-width="2"/>` },
  { id: "sk-globe", e: "🌐", name: "Celestial globe", price: 10, note: "The sky drawn on a ball, as if seen from outside. The Farnese Atlas, a Roman statue, carries one with the constellations carved on it.", x: 80, y: 58, w: 15, vb: "0 0 110 120",
    art: () => `<defs>${AU}<radialGradient id="hrb" cx="40%" cy="35%" r="70%"><stop offset="0" stop-color="#3d4fa8"/><stop offset="1" stop-color="#0b1033"/></radialGradient></defs><ellipse cx="55" cy="116" rx="36" ry="4" fill="#000" opacity=".35"/><path d="M40 116l15 -30l15 30z" fill="url(#hrg)"/><circle cx="55" cy="52" r="40" fill="url(#hrb)" stroke="url(#hrg)" stroke-width="3"/><g class="hr-twinkle">${[[40, 34], [52, 28], [64, 36], [70, 52], [46, 60], [58, 70], [36, 50]].map(([x, y], i) => `<circle style="--d:${i * 0.3}s" cx="${x}" cy="${y}" r="1.6" fill="#fff"/>`).join("")}</g><path d="M40 34L52 28L64 36L70 52M46 60L58 70" stroke="#C9D4FF" stroke-width=".8" fill="none" opacity=".7"/><ellipse cx="55" cy="52" rx="40" ry="10" fill="none" stroke="#FADE8C" stroke-width="1.2" opacity=".7" transform="rotate(-23 55 52)"/>` },
  { id: "sk-telescope", e: "🔭", name: "Galileo's telescope", price: 12, note: "Galileo built his own telescopes in 1609 and 1610. In January 1610 he spotted four moons going round Jupiter.", x: 80, y: 14, w: 15, vb: "0 0 120 90",
    art: () => `<defs>${AU}</defs><path d="M36 86L54 52L72 86M54 52V86" stroke="#5a3a1a" stroke-width="3" fill="none"/><g transform="rotate(-24 54 50)"><rect x="8" y="42" width="96" height="14" rx="3" fill="#7a3a22" stroke="#3a1a0c"/><rect x="6" y="40" width="8" height="18" rx="2" fill="url(#hrg)"/><rect x="98" y="38" width="10" height="22" rx="2" fill="url(#hrg)"/><path d="M30 42v14M60 42v14" stroke="url(#hrg)" stroke-width="2"/></g><g class="hr-twinkle"><circle style="--d:0s" cx="112" cy="8" r="3" fill="#FFE9A8"/>${[0, 1, 2, 3].map((i) => `<circle style="--d:${0.3 + i * 0.3}s" cx="${100 + i * 5 + (i > 1 ? 12 : 0)}" cy="8" r="1.1" fill="#fff"/>`).join("")}</g>` },
  { id: "sk-armillary", e: "🪐", name: "Armillary sphere", price: 15, note: "Rings for the equator, the ecliptic and the tropics around a tiny Earth. Zhang Heng built a water-powered one in China in the 2nd century AD.", x: 24, y: 2, w: 11, vb: "0 0 100 130",
    art: () => `<defs>${AU}</defs><path d="M50 98V124M34 124h32" stroke="url(#hrg)" stroke-width="4"/><g class="hr-spin" style="transform-origin:50px 54px"><circle cx="50" cy="54" r="40" fill="none" stroke="url(#hrg)" stroke-width="3"/><ellipse cx="50" cy="54" rx="40" ry="12" fill="none" stroke="url(#hrg)" stroke-width="2.4"/><ellipse cx="50" cy="54" rx="12" ry="40" fill="none" stroke="url(#hrg)" stroke-width="2"/><ellipse cx="50" cy="54" rx="40" ry="12" fill="none" stroke="#FADE8C" stroke-width="2" transform="rotate(-23 50 54)"/></g><circle cx="50" cy="54" r="7" fill="#3d7fd9"/><path d="M45 52q5 -4 9 1" stroke="#5fd16a" stroke-width="2" fill="none"/>` },
  { id: "sk-antikythera", e: "⚙️", name: "Antikythera mechanism", price: 20, note: "A Greek bronze gear computer from roughly the 2nd century BC, found in a shipwreck in 1901. It predicted eclipses and tracked the Moon's phases.", x: 62, y: 3, w: 13, vb: "0 0 120 100",
    art: () => `<rect x="4" y="4" width="112" height="92" rx="6" fill="#4a3a22" stroke="#2a1f10" stroke-width="2"/><rect x="10" y="10" width="100" height="80" rx="4" fill="#5b7a5e" opacity=".55"/>${[[44, 50, 28, 24, "hr-spin"], [86, 36, 16, 14, "hr-spin-r"], [84, 72, 12, 10, "hr-spin"]].map(([cx, cy, r, n, cl]) => `<g class="${cl}" style="transform-origin:${cx}px ${cy}px"><circle cx="${cx}" cy="${cy}" r="${r}" fill="#8a7a4a" stroke="#3a2f14"/>${Array.from({ length: n }, (_, i) => `<rect x="${cx - 1.6}" y="${cy - r - 3}" width="3.2" height="4" fill="#8a7a4a" transform="rotate(${(i * 360) / n} ${cx} ${cy})"/>`).join("")}<circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="#3a2f14"/></g>`).join("")}<path d="M44 50L44 28" stroke="#FADE8C" stroke-width="1.6"/>` },
  { id: "sk-aurora", e: "🌌", name: "Aurora window", price: 30, note: "Charged particles from the Sun hit the upper air near the poles. Oxygen glows green and, higher up, red; nitrogen adds blues and purples.", x: 2, y: 85, w: 14, vb: "0 0 140 70",
    art: () => `<defs><linearGradient id="hrn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff4f7a" stop-opacity=".7"/><stop offset=".45" stop-color="#4dffb0" stop-opacity=".85"/><stop offset="1" stop-color="#4dffb0" stop-opacity="0"/></linearGradient></defs><rect x="2" y="2" width="136" height="66" rx="8" fill="#050816" stroke="#9AA6C9" stroke-width="2"/>${Array.from({ length: 14 }, (_, i) => `<circle cx="${8 + ((i * 37) % 126)}" cy="${6 + ((i * 23) % 30)}" r=".9" fill="#fff" opacity=".8"/>`).join("")}<g class="hr-wave"><path d="M6 46q20 -40 40 -10t40 -14t48 -6v44h-128z" fill="url(#hrn)"/></g><g class="hr-wave" style="--d:1.2s"><path d="M6 54q24 -30 44 -6t44 -10t40 0v28h-128z" fill="url(#hrn)" opacity=".6"/></g><path d="M2 60h136v8h-136z" fill="#0b1033"/>` },
];

/** The orrery music box: the Keeper's own player for the shared music pool. Same classes as the turntable (tt, tt-disc). */
export function orrerySvg(t, playing) {
  const disc = t ? `<g transform="translate(50 50) scale(.8)">${vinylSvg(t, 100).replace(/<svg[^>]*>|<\/svg>/g, "")}</g>` : `<circle cx="90" cy="90" r="40" fill="#26262c"/>`;
  const orbit = (r, s, col, sz, d) => `<ellipse cx="206" cy="66" rx="${r}" ry="${(r * 0.35).toFixed(1)}" fill="none" stroke="#9AA6C9" stroke-opacity=".5"/><g class="or-p" style="--s:${s}s;--d:${d}s"><circle r="${sz}" fill="${col}"><animateMotion dur="${s}s" begin="${d}s" repeatCount="indefinite" path="M${206 + r} 66 a${r} ${(r * 0.35).toFixed(1)} 0 1 1 ${-2 * r} 0 a${r} ${(r * 0.35).toFixed(1)} 0 1 1 ${2 * r} 0"/></circle></g>`;
  return `<svg class="tt or${playing ? " playing" : ""}" viewBox="0 0 260 190" aria-hidden="true">
  <defs><linearGradient id="or-ag" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#F4F6FF"/><stop offset=".5" stop-color="#9AA6C9"/><stop offset="1" stop-color="#3B4566"/></linearGradient>
    <linearGradient id="or-box" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#1e2a6a"/><stop offset="1" stop-color="#0b1033"/></linearGradient></defs>
  <rect x="14" y="126" width="232" height="56" rx="8" fill="url(#or-box)" stroke="url(#or-ag)" stroke-width="2"/>
  ${Array.from({ length: 10 }, (_, i) => `<circle cx="${30 + i * 21}" cy="${140 + (i % 3) * 12}" r="1" fill="#fff" opacity=".7"/>`).join("")}
  <ellipse cx="90" cy="116" rx="56" ry="10" fill="#1a1a1f" stroke="#555"/><path d="M90 116V126" stroke="#9AA6C9" stroke-width="6"/>
  <g class="tt-disc" style="transform-origin:90px 90px">${disc}</g>
  <path d="M206 126V80" stroke="#9AA6C9" stroke-width="4"/>
  <circle class="or-sun" cx="206" cy="66" r="9" fill="#FFE9A8"/><circle cx="206" cy="66" r="14" fill="#FFE9A8" opacity=".2"/>
  ${playing ? orbit(20, 3, "#C9D4FF", 2.4, 0) + orbit(32, 5, "#66E0C8", 3.4, 0.4) + orbit(46, 8, "#FF7A3A", 3, 0.9) : `<ellipse cx="206" cy="66" rx="32" ry="11" fill="none" stroke="#9AA6C9" stroke-opacity=".5"/><circle cx="238" cy="66" r="3.4" fill="#66E0C8"/>`}
  <circle class="tt-led" cx="28" cy="168" r="4" fill="${playing ? "#C9D4FF" : "#3a3a3a"}"/>
</svg>`;
}

export const OBSERVATORY_CSS = `
body[data-house="observatory"] .speaker{color:#C9D4FF}
body[data-house="observatory"] .gate-title{color:#C9D4FF}
.or.playing .or-sun{animation:hr-pulse 2.4s ease-in-out infinite;transform-origin:206px 66px}
.h-keeper .hk-orbit{animation:hr-spin 18s linear infinite;transform-origin:200px 74px}
.h-keeper .hk-glint{animation:hk-tw 5s ease-in-out infinite}
.hr-twinkle circle{animation:hk-tw 2.6s ease-in-out infinite;animation-delay:var(--d,0s)}
.hr-wave{animation:hk-wave 6s ease-in-out infinite alternate;animation-delay:var(--d,0s);transform-origin:70px 60px}
.hr-shadow{animation:hk-sweep 20s linear infinite}
.hr-spin-r{animation:hr-spin 16s linear infinite reverse}
@keyframes hk-tw{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes hk-wave{to{transform:skewX(-8deg) scaleY(1.08)}}
@keyframes hk-sweep{from{transform:rotate(0)}to{transform:rotate(180deg)}}
.hr-spin{animation:hr-spin 24s linear infinite}@keyframes hr-spin{to{transform:rotate(360deg)}}
.hr-glint{animation:hk-tw 3s ease-in-out infinite}@keyframes hr-pulse{50%{transform:scale(1.08)}}
@media (prefers-reduced-motion: reduce){.or.playing .or-sun,.h-keeper .hk-orbit,.h-keeper .hk-glint,[class^="hr-"],[class*=" hr-"],.hr-twinkle circle{animation:none}}`;

/** Dress the shared figure as the Keeper of Hours: night hood, silver owl disc, gold beak, orrery halo, star-colour eye. */
function paint(svg, prog, id = "t") {
  if (!svg) return;
  const stops = (gid, cols) => svg.querySelectorAll(`#${id}-${gid} stop`).forEach((s, i) => cols[i] && s.setAttribute("stop-color", cols[i]));
  stops("face", ["#E4EAFF", "#8E9AD0", "#2A3470"]); stops("hood", ["#1e2a6a", "#0b1033", "#02040f"]); // moonlit feathers, night hood
  svg.querySelectorAll('.o-body [stroke="#E2B04A"], .o-body [data-trim], .o-sleeves, .o-sleeves [data-trim]').forEach((e) => { if (!e.closest(".o-hands")) e.setAttribute("stroke", "#C9D4FF"); });
  const S = starEyeOf(prog && prog.stareye); stops("iris", S.iris);
  const body = svg.querySelector(".o-body"), eye = svg.querySelector(".o-eye"); if (!body || !eye) return;
  svg.querySelector(".h-keeper")?.remove();
  const g = document.createElementNS(NS, "g"); g.setAttribute("class", "h-keeper");
  const feathers = Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * Math.PI * 2, r1 = 44, r2 = 54; return `<path d="M${(200 + r1 * Math.cos(a)).toFixed(1)} ${(152 + r1 * 0.78 * Math.sin(a)).toFixed(1)}L${(200 + r2 * Math.cos(a)).toFixed(1)} ${(152 + r2 * 0.78 * Math.sin(a)).toFixed(1)}" stroke="#C9D4FF" stroke-width="2" stroke-linecap="round" opacity=".7"/>`; }).join("");
  g.innerHTML = `<ellipse cx="200" cy="152" rx="46" ry="36" fill="none" stroke="#C9D4FF" stroke-width="5" opacity=".9"/>${feathers}
    <path d="M150 116 Q170 100 186 118 M250 116 Q230 100 214 118" stroke="#C9D4FF" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M193 192 L207 192 L200 206 Z" fill="#E2B04A" stroke="#8C5E17" stroke-width="1"/>
    <ellipse class="hk-glint" cx="200" cy="152" rx="40" ry="30" fill="${S.iris[1]}" opacity=".12"/>
    <ellipse cx="200" cy="74" rx="40" ry="10" fill="none" stroke="#9AA6C9" stroke-width="1.4" stroke-dasharray="3 4" opacity=".8"/>
    <circle cx="200" cy="74" r="6" fill="#FFE9A8"/><circle cx="200" cy="74" r="10" fill="#FFE9A8" opacity=".2"/>
    <g class="hk-orbit"><circle cx="240" cy="74" r="3.4" fill="#66E0C8"/><circle cx="168" cy="80" r="2.4" fill="#FF7A3A"/><circle cx="214" cy="65" r="2" fill="#C9D4FF"/></g>`;
  eye.after(g);
}

/** Swap the Oracle's name for the Keeper's in any line or menu. Rank names (Oracle-touched) and /oracle stay. */
const RENAME = [
  [/\bThe Oracle Chamber\b/g, "The Observatory"], [/\bthe Oracle Chamber\b/g, "the Observatory"], [/\bOracle Chamber\b/g, "Observatory"],
  [/\bTHE ORACLE\b/g, "THE KEEPER"], [/\b([Tt])he Oracle's\b/g, "$1he Keeper's"], [/\b([Tt])he Oracle\b/g, "$1he Keeper"],
  [/\bEnter the Chamber\b/g, "Enter the Observatory"], [/\b[Tt]he Chamber\b/g, (m) => (m[0] === "T" ? "The Observatory" : "the Observatory")],
  [/\b([Tt])he Record Player\b/g, "$1he Orrery Music Box"], [/\brecord player\b/g, "music box"], [/\bRecord player\b/g, "Music box"],
  [/\bDraw today's card\b/g, "Tonight's sky"], [/Readings, card games and real science, with a fortune teller who talks back/g, "Constellations, star rummy and ancient calendars, with an astronomer who talks back"], [/(?<![\w/-])Oracle(?![\w-])/g, "Keeper"],
];

const G = (mid1, mid2, win, lose) => ({ mid: [mid1, mid2], win: [win], lose: [lose] });

export const observatory = {
  id: "observatory", name: "The Keeper of Hours", house: "The Observatory", emoji: "🌌", accent: "#C9D4FF",
  channelIds: ["1575975395692642596"], // #🌌-observatory
  readings: false, rooms: ["stars", "rummy", "calendar"], daily: "stars",
  voice: { type: "sine", base: 330, step: 24, vowel: 90, dur: 0.05, lp: 2600 },
  css: OBSERVATORY_CSS, paint, rename: (s) => RENAME.reduce((t, [re, to]) => t.replace(re, to), s),
  player: { name: "The Orrery Music Box", deck: orrerySvg },
  shelves: [starEyeShop],
  token: { id: "shard", emoji: "☄️", name: "comet shard", plural: "comet shards", purse: "Shard case" },
  relics: SKY_RELICS, relicLabel: "☄️ Observatory relics", relicBlurb: "Observatory relics stay up here for good. Earn shards with your first visit each night and by beating game levels here.",
  strayIntro: "Something just dropped out of the telescope:",
  lines: {
    greet: ["Good evening, {name}. Or morning. Up here, every hour is somebody's night.", "Welcome to the Observatory, {name}. The dome is open and the sky is on time.",
      "Ah, {name}. Mind the telescope, it's older than both of us. Well, older than you."],
    idle: ["Sunlight takes about eight minutes to reach us. When you look at the Sun, you see it as it was a few minutes ago. Please don't look at the Sun.",
      "Earth's axis wobbles in a slow circle about 26,000 years long. Polaris is our pole star now; in about 12,000 years it'll be Vega.",
      "Babylonian astronomers kept records of planets on clay tablets. Some of those tablets track Venus over about 21 years.",
      "Nearly every star you can see without a telescope is within a few thousand light-years. The Milky Way is about 100,000 across.",
      "The dome is quiet. I'll just stare meaningfully at Saturn."],
    joke: ["Why did the astronomer bump her head? She was star-struck. Fine, she walked into the telescope.", "I tried to tell a joke about the Moon, but it went through phases.",
      "Astronomers never get lost. We just discover new places.", "My feathers are rated for cold nights, dew and bad puns. Mostly bad puns.",
      "Pluto isn't a planet anymore, but it's still a planet in my heart. And a dwarf planet on paper. Both, really."],
  },
  banter: {
    stars: G("Turn the sky slowly. Constellations hate being rushed.", "Follow the bright ones first. The faint ones are shy.", "Found and drawn! The ancient sky-watchers would nod. Slowly. They were tired.", "Lost among the stars. It happens to the best navigators."),
    rummy: G("A star from Orion? Bold. He's always showing off.", "I'm holding three of the Plough. Or am I?", "You went out first! Well played, {name}. The sky is yours tonight.", "My constellation is complete! The night favours the patient."),
    calendar: G("The Maya counted a 260-day ritual calendar. Count with me.", "Every calendar is a way of chasing the Sun, the Moon, or both.", "Gears aligned! You'd make a fine keeper of days.", "The cycle slipped by a day. Calendars are fussy about that."),
  },
  poke: ["Careful! The orrery's planets are fragile.", "My feathers, {name}. They're very precise.", "Poke me again and I'll name a faint star after you."],
  perfect: ["A perfect night's work, {name}. Not a cloud in it."],
};
