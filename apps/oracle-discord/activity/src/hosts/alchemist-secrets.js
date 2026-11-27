// The Alchemist's House: its animated menu background and its 13 hidden finds ("Hidden Lab"). See hosts/secrets.js.

/** The menu background: copper pipes with liquid pulsing through, a gear train, rising bubbles, a drip from a
 *  condenser and a faint periodic table where a few tiles glow. Two hotspots: the big gear, and one tile (Au). */
export const LAB_BG_CSS = `
.mb-lab .mbl-pipe{stroke-dasharray:14 22;animation:mbl-flow 2.4s linear infinite}.mb-lab .mbl-pipe.b{animation-duration:3.4s;animation-direction:reverse}
@keyframes mbl-flow{to{stroke-dashoffset:-72}}
.mb-lab .mbl-gear{transform-box:fill-box;transform-origin:50% 50%;animation:mbl-spin 14s linear infinite}.mb-lab .mbl-gear.r{animation-direction:reverse;animation-duration:9.3s}
@keyframes mbl-spin{to{transform:rotate(360deg)}}
.mb-lab .mbl-bub{animation:mbl-rise var(--t,7s) linear infinite;animation-delay:var(--d,0s)}@keyframes mbl-rise{0%{transform:translateY(0);opacity:0}10%{opacity:.8}100%{transform:translateY(-300px);opacity:0}}
.mb-lab .mbl-tile{animation:mbl-glow 6s ease-in-out infinite;animation-delay:var(--d,0s)}@keyframes mbl-glow{0%,70%,100%{opacity:.12}80%{opacity:.75}}
.mb-lab .mbl-drip{animation:mbl-drip 2.2s ease-in infinite}@keyframes mbl-drip{0%{transform:translateY(0);opacity:1}80%{opacity:1}100%{transform:translateY(46px);opacity:0}}
.mb-lab .mbl-hot-gear:hover,.mb-lab .mbl-au:hover{filter:brightness(1.3)}`;
const SYMS = ["H", "He", "Li", "C", "N", "O", "Na", "Mg", "Al", "S", "Cl", "K", "Ca", "Fe", "Cu", "Zn", "Ag", "Sn", "Hg", "Pb"];
export function labBgHtml(at = Date.now(), { rnd = Math.random } = {}) {
  const gear = (cx, cy, r, cls, extra = "") => `<g class="mbl-gear ${cls}" ${extra}><circle cx="${cx}" cy="${cy}" r="${r}" fill="#5E2D10" stroke="#C88A3A" stroke-width="3"/>${Array.from({ length: 10 }, (_, i) => `<rect x="${cx - 4}" y="${cy - r - 7}" width="8" height="10" fill="#C88A3A" transform="rotate(${i * 36} ${cx} ${cy})"/>`).join("")}<circle cx="${cx}" cy="${cy}" r="${r * 0.35}" fill="#2a160a" stroke="#FADE8C"/></g>`;
  const tiles = SYMS.map((s, i) => { const x = 250 + (i % 10) * 34, y = 30 + Math.floor(i / 10) * 38; return `<g class="mbl-tile" style="--d:${(i * 0.7) % 6}s"><rect x="${x}" y="${y}" width="30" height="34" rx="3" fill="none" stroke="#E89A55"/><text x="${x + 15}" y="${y + 22}" font-size="13" text-anchor="middle" fill="#FADE8C" font-family="Georgia,serif">${s}</text></g>`; }).join("");
  const bubs = Array.from({ length: 12 }, (_, i) => `<circle class="mbl-bub" style="--d:${(rnd() * 7).toFixed(1)}s;--t:${(6 + rnd() * 5).toFixed(1)}s" cx="${(30 + rnd() * 740).toFixed(0)}" cy="${300 + (i % 3) * 6}" r="${(2 + rnd() * 4).toFixed(1)}" fill="none" stroke="#66E0C8" stroke-width="1.4"/>`).join("");
  return `<div class="menu-bg mb-lab" aria-hidden="true"><svg viewBox="0 0 800 300" preserveAspectRatio="xMidYMid slice" width="100%" height="100%">
  <rect width="800" height="300" fill="#1a0d06"/>
  <path d="M0 40 H180 Q200 40 200 60 V250 Q200 270 220 270 H800" fill="none" stroke="#7a4f12" stroke-width="12"/><path class="mbl-pipe" d="M0 40 H180 Q200 40 200 60 V250 Q200 270 220 270 H800" fill="none" stroke="#66E0C8" stroke-width="4" opacity=".7"/>
  <path d="M800 120 H640 Q620 120 620 140 V300" fill="none" stroke="#7a4f12" stroke-width="10"/><path class="mbl-pipe b" d="M800 120 H640 Q620 120 620 140 V300" fill="none" stroke="#E3173E" stroke-width="3.5" opacity=".7"/>
  ${tiles}<g class="mb-hot mbl-au" data-tap="au"><rect x="590" y="68" width="30" height="34" rx="3" fill="#3a2a08" stroke="#FADE8C"/><text x="605" y="90" font-size="13" text-anchor="middle" fill="#FADE8C" font-family="Georgia,serif">Au</text></g>
  ${gear(90, 200, 46, "")}${gear(152, 150, 28, "r")}<g class="mb-hot mbl-hot-gear" data-tap="gear">${gear(720, 220, 52, "r")}</g>
  <path d="M470 150 h30 l-6 30 h-18z" fill="none" stroke="#e8f4ff" stroke-opacity=".5"/><circle class="mbl-drip" cx="485" cy="186" r="3" fill="#66E0C8"/>
  ${bubs}</svg></div>`;
}

const inHour = (at, h) => new Date(at).getHours() === h;
const onDay = (at, m, d) => { const x = new Date(at); return x.getMonth() + 1 === m && x.getDate() === d; };
/** Hidden Lab: 13 finds. Pays 💎 Essence; the rare ones pay 🪨 philosopher's stones. Hints are riddles. */
export const LAB_SECRETS = {
  label: "🔬 Hidden Lab",
  items: [
    { id: "overflow", e: "🫧", name: "Overflow", hint: "Shake the flask. Then shake it again. And again. Five times, and see what happens.", pay: { gem: 20 } },
    { id: "peek", e: "🥽", name: "Behind the goggles", hint: "Three taps on the brass rim. She'll show you what's underneath.", pay: { gem: 15 } },
    { id: "hood", e: "🌫️", name: "Something in the hood", hint: "Knock three times on the glass cabinet where the fumes go.", pay: { gem: 15 } },
    { id: "labels", e: "🏷️", name: "Read every label", hint: "Eight jars on the shelf. Touch each one.", pay: { gem: 25 } },
    { id: "midnight", e: "🌙", name: "The midnight furnace", hint: "Visit when the athanor is banked lowest: the first hour of the day.", pay: { token: 1 }, rare: true },
    { id: "fullblast", e: "🔥", name: "Full blast", hint: "Visit when the furnace burns hottest, in the middle of the afternoon.", pay: { gem: 15 } },
    { id: "volcano", e: "🌋", name: "Volcano", hint: "Fizz first, then bang. Quickly.", pay: { gem: 20 } },
    { id: "overdressed", e: "🦺", name: "Overdressed", hint: "Wear the orange suit and shake the flask. Just to be sure.", pay: { gem: 15 } },
    { id: "gears", e: "⚙️", name: "The gear train", hint: "Behind the menu, the biggest gear will stop if you hold it three times.", pay: { gem: 15 } },
    { id: "aurum", e: "🟡", name: "Aurum", hint: "Behind the menu, one tile is not like the others. It's the one alchemists wanted most.", pay: { gem: 20 } },
    { id: "moleday", e: "🧪", name: "Mole Day", hint: "Visit on the day chemists celebrate Avogadro's number: 6.02 × 10²³.", pay: { token: 2 }, rare: true },
    { id: "mendeleev", e: "📜", name: "Mendeleev's birthday", hint: "Visit on the birthday of the man who left gaps in his table (born 1834).", pay: { token: 2 }, rare: true },
    { id: "clean", e: "✨", name: "A clean result", hint: "Win a game here without a single mistake.", pay: { gem: 25 } },
  ],
  event(kind, d, api) {
    const S = (LAB_SECRETS._s ||= { jars: new Set(), fizz: 0 });
    if (kind === "poke" && d.zone === "orb") { if (d.count >= 5) api.find("overflow", "It's foaming over! Too much agitation and every bubble of gas comes out at once."); if (api.prog.coat === "coat-hazmat") api.find("overdressed", "A hazmat suit for a flask of fizzy water. Level A protection, level zero danger. I approve."); }
    if (kind === "poke" && d.zone === "eye" && d.count >= 3) api.find("peek", "Fine, goggles up. The eye underneath is perfectly ordinary. Mostly.");
    if (kind === "tap" && d.tap === "hood" && d.count >= 3) api.find("hood", "Something was living in the fume hood: a very small, very offended cloud.");
    if (kind === "tap" && /^jar-\d$/.test(d.tap)) { S.jars.add(d.tap); if (S.jars.size >= 8) api.find("labels", "Every label read. Oil of vitriol to green vitriol: old names, real chemicals."); }
    if (kind === "tap" && d.tap === "gear" && d.count >= 3) api.find("gears", "You stopped the gear train. Every machine in here runs on gears and patience.");
    if (kind === "tap" && d.tap === "au") api.find("aurum", "Au, from the Latin aurum. Gold: what every alchemist wanted, and what none of them made.");
    if (kind === "emote" && d.id === "laugh") S.fizz = api.at;
    if (kind === "emote" && d.id === "gasp" && api.at - S.fizz < 3000) api.find("volcano", "Fizz, then bang: a baking-soda volcano. The classic science-fair eruption.");
    if (kind === "home") {
      if (inHour(api.at, 0)) api.find("midnight", "The midnight furnace. An athanor was built to keep an even heat for days, even now.");
      if (inHour(api.at, 15)) api.find("fullblast", "Full blast! The athanor is at its hottest this hour.");
      if (onDay(api.at, 10, 23)) api.find("moleday", "Happy Mole Day! 23 October, for 6.02 × 10²³, Avogadro's number.");
      if (onDay(api.at, 2, 8)) api.find("mendeleev", "Happy birthday, Dmitri Mendeleev, born 8 February 1834. He left gaps in his table for elements nobody had found yet.");
    }
    if (kind === "result" && d.won && d.perfect) api.find("clean", "A clean result: no errors, no spills. Write it in the lab book.");
  },
};
