// Cards: ONE set of card backs for every deck in the Chamber. The equipped id is prog.cardback and it dresses the
// tarot, Lenormand and Science is Magic decks on the reading table, Grimoire Memory and Constellation Rummy.
// "cb-deck" keeps each deck's own back. Every design is one animated SVG (60 x 84) so it looks the same everywhere.
// Animation classes (cbk-*) live in chamber.css.

const R = (fill, edge) => `<rect width="60" height="84" rx="5" fill="${fill}"/><rect x="1.2" y="1.2" width="57.6" height="81.6" rx="4.2" fill="none" stroke="${edge}" stroke-width="2"/><rect x="5" y="5" width="50" height="74" rx="2.5" fill="none" stroke="${edge}" stroke-width=".7" opacity=".6"/>`;
const grad = (id, a, b, cy = 40) => `<defs><radialGradient id="${id}" cx="50%" cy="${cy}%" r="75%"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></radialGradient></defs>`;
const dots = (n, fn) => Array.from({ length: n }, (_, i) => fn(i)).join("");

/** id -> { name, note, price, art(uid) }. Prices rise with how much the back moves. */
export const CARD_BACK = {
  "cb-starfield": { name: "Starfield", note: "A night sky that twinkles, with one slow shooting star", price: 60,
    art: (u) => `${grad(u, "#1b2a6e", "#05051a")}${R(`url(#${u})`, "#9fb8ff")}${dots(16, (i) => `<circle class="cbk-twk" style="--d:${(i * 0.37 % 3).toFixed(2)}s" cx="${8 + (i * 23) % 44}" cy="${9 + (i * 31) % 66}" r="${i % 4 ? 0.8 : 1.5}" fill="#fff"/>`)}<path class="cbk-shoot" d="M10 16 L22 22" stroke="#fff" stroke-width="1.2" stroke-linecap="round"/><path d="M30 34 L32 40 L38 42 L32 44 L30 50 L28 44 L22 42 L28 40Z" class="cbk-pulse" fill="#FADE8C"/>` },
  "cb-moonphase": { name: "Moon phases", note: "The Moon waxes and wanes down the card, glowing in turn", price: 70,
    art: (u) => `${grad(u, "#22305e", "#0a1024")}${R(`url(#${u})`, "#c9b8ff")}${[14, 28, 42, 56, 70].map((y, k) => `<g class="cbk-twk" style="--d:${k * 0.5}s"><circle cx="30" cy="${y}" r="${k === 2 ? 8 : 5.5}" fill="#e9e4ff"/>${k === 2 ? "" : `<circle cx="${30 + (k < 2 ? -1 : 1) * (k === 0 || k === 4 ? 1.5 : 4.5)}" cy="${y}" r="5.5" fill="#101836"/>`}</g>`).join("")}` },
  "cb-seal": { name: "Alchemist's seal", note: "Gold on oxblood: the circle and dot that meant both gold and the Sun", price: 80,
    art: (u) => `${grad(u, "#8a2226", "#2a0708")}${R(`url(#${u})`, "#f4c869")}<g class="cbk-spin" fill="none" stroke="#f4c869"><circle cx="30" cy="42" r="19" stroke-width="1" stroke-dasharray="2 4"/></g><circle cx="30" cy="42" r="13" fill="none" stroke="#f4c869" stroke-width="2.4"/><circle class="cbk-pulse" cx="30" cy="42" r="3.4" fill="#f4c869"/>${[[9, 10], [51, 10], [9, 74], [51, 74]].map(([x, y]) => `<path d="M${x} ${y - 3} L${x + 3} ${y} L${x} ${y + 3} L${x - 3} ${y}Z" fill="#f4c869"/>`).join("")}` },
  "cb-runestone": { name: "Runestone", note: "Granite with red-painted runes that light up one by one, as carvers painted them", price: 80,
    art: (u) => `<defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#7b8088"/><stop offset="1" stop-color="#34373c"/></linearGradient></defs>${R(`url(#${u})`, "#a9afb8")}<g fill="none" stroke="#d8362c" stroke-width="2.6" stroke-linecap="round"><path class="cbk-glow" style="--d:0s" d="M30 12 V30 M30 20 L23 13 M30 20 L37 13"/><path class="cbk-glow" style="--d:.8s" d="M24 36 V54 M24 36 L36 45 L24 54"/><path class="cbk-glow" style="--d:1.6s" d="M22 60 L38 74 M38 60 L22 74"/></g>` },
  "cb-circuit": { name: "Circuit board", note: "Science is Magic: teal traces with a signal running along them", price: 90,
    art: (u) => `${grad(u, "#0b3a2e", "#03110d")}${R(`url(#${u})`, "#66E0C8")}<g fill="none" stroke="#2a8f7c" stroke-width="1.4"><path d="M12 14 H30 V30 H48 M12 70 H26 V54 H48 M30 30 V54 M12 42 H22 M38 42 H48"/></g><path class="cbk-dash" d="M12 14 H30 V30 H48 M12 70 H26 V54 H48 M30 30 V54" fill="none" stroke="#b8fff0" stroke-width="1.6" stroke-linecap="round"/>${[[12, 14], [48, 30], [12, 70], [48, 54], [12, 42], [48, 42]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2.2" fill="#66E0C8"/>`).join("")}<g class="cbk-spin"><ellipse cx="30" cy="42" rx="9" ry="3.4" fill="none" stroke="#FADE8C" stroke-width="1"/><ellipse cx="30" cy="42" rx="9" ry="3.4" fill="none" stroke="#FADE8C" stroke-width="1" transform="rotate(60 30 42)"/><ellipse cx="30" cy="42" rx="9" ry="3.4" fill="none" stroke="#FADE8C" stroke-width="1" transform="rotate(-60 30 42)"/></g><circle class="cbk-pulse" cx="30" cy="42" r="2.4" fill="#FADE8C"/>` },
  "cb-lapis": { name: "Lapis and gold", note: "Lapis lazuli and the Eye of Horus, an Egyptian amulet of protection. It blinks", price: 100,
    art: (u) => `${grad(u, "#3566e0", "#0c1c5c", 35)}${R(`url(#${u})`, "#f1c75b")}${dots(9, (i) => `<circle cx="${10 + (i * 19) % 40}" cy="${10 + (i * 29) % 64}" r=".9" fill="#f1c75b" opacity=".7"/>`)}<g fill="none" stroke="#f1c75b" stroke-width="2.2" stroke-linecap="round"><path d="M12 40 Q30 26 48 40 Q30 52 12 40Z"/><path d="M24 49 L21 62 M36 49 Q43 62 49 56"/><path d="M12 31 Q30 20 48 31"/></g><g class="cbk-blink"><circle cx="30" cy="39.5" r="5.4" fill="#f1c75b"/><circle cx="30" cy="39.5" r="2.2" fill="#0c1c5c"/></g>` },
  "cb-zodiac": { name: "Zodiac wheel", note: "The twelve signs the Sun passes through, turning around it", price: 110,
    art: (u) => `${grad(u, "#4a2a8a", "#150a30")}${R(`url(#${u})`, "#d8b0ff")}<g class="cbk-spin"><circle cx="30" cy="42" r="21" fill="none" stroke="#d8b0ff" stroke-width="1"/>${dots(12, (i) => { const a = i * Math.PI / 6; return `<path d="M${(30 + Math.cos(a) * 14).toFixed(1)} ${(42 + Math.sin(a) * 14).toFixed(1)} L${(30 + Math.cos(a) * 21).toFixed(1)} ${(42 + Math.sin(a) * 21).toFixed(1)}" stroke="#d8b0ff" stroke-width=".8"/><circle cx="${(30 + Math.cos(a + 0.26) * 17.5).toFixed(1)}" cy="${(42 + Math.sin(a + 0.26) * 17.5).toFixed(1)}" r="1.3" fill="#ffd56a"/>`; })}<circle cx="30" cy="42" r="14" fill="none" stroke="#d8b0ff" stroke-width=".8"/></g><circle class="cbk-pulse" cx="30" cy="42" r="6" fill="#ffd56a"/>${dots(8, (i) => { const a = i * Math.PI / 4; return `<path d="M${(30 + Math.cos(a) * 7.5).toFixed(1)} ${(42 + Math.sin(a) * 7.5).toFixed(1)} L${(30 + Math.cos(a) * 10.5).toFixed(1)} ${(42 + Math.sin(a) * 10.5).toFixed(1)}" stroke="#ffd56a" stroke-width="1.2" stroke-linecap="round"/>`; })}` },
  "cb-nebula": { name: "Orion Nebula", note: "The glowing star nursery in Orion's sword, drifting slowly", price: 120,
    art: (u) => `<defs><radialGradient id="${u}a"><stop offset="0" stop-color="#ff5fa8"/><stop offset="1" stop-color="#ff5fa8" stop-opacity="0"/></radialGradient><radialGradient id="${u}b"><stop offset="0" stop-color="#3fd0e0"/><stop offset="1" stop-color="#3fd0e0" stop-opacity="0"/></radialGradient><radialGradient id="${u}c"><stop offset="0" stop-color="#a070ff"/><stop offset="1" stop-color="#a070ff" stop-opacity="0"/></radialGradient><clipPath id="${u}k"><rect width="60" height="84" rx="5"/></clipPath></defs>${R("#0a0620", "#ffb3e2")}<g clip-path="url(#${u}k)"><circle class="cbk-drift" cx="22" cy="32" r="24" fill="url(#${u}a)" opacity=".8"/><circle class="cbk-drift" style="--d:-3s" cx="40" cy="54" r="26" fill="url(#${u}b)" opacity=".7"/><circle class="cbk-drift" style="--d:-6s" cx="30" cy="42" r="18" fill="url(#${u}c)" opacity=".8"/></g>${dots(10, (i) => `<circle class="cbk-twk" style="--d:${(i * 0.41 % 3).toFixed(2)}s" cx="${9 + (i * 17) % 42}" cy="${10 + (i * 37) % 64}" r="${i % 3 ? 0.7 : 1.3}" fill="#fff"/>`)}` },
  "cb-ouroboros": { name: "Ouroboros", note: "The serpent eating its tail, from Greek alchemy: all is one. It circles forever", price: 130,
    art: (u) => `${grad(u, "#17382a", "#030806", 50)}${R(`url(#${u})`, "#6fe39a")}<g class="cbk-spin"><circle cx="30" cy="42" r="16" fill="none" stroke="#6fe39a" stroke-width="5"/><circle cx="30" cy="42" r="16" fill="none" stroke="#0d2a1c" stroke-width="1" stroke-dasharray="1.5 3"/><path d="M40 28 L49 24 L46 34Z" fill="#6fe39a"/><circle cx="45" cy="28" r="1.1" fill="#030806"/></g><path class="cbk-pulse" d="M30 34 L36 42 L30 50 L24 42Z" fill="none" stroke="#FADE8C" stroke-width="1.4"/>` },
  "cb-pulsar": { name: "Pulsar", note: "A spinning neutron star sweeping its beams past you, flash after flash", price: 140,
    art: (u) => `${grad(u, "#12224a", "#02040c", 50)}${R(`url(#${u})`, "#bfe3ff")}<g class="cbk-spin fast"><path d="M30 42 L8 14 L14 10Z M30 42 L52 70 L46 74Z" fill="#bfe3ff" opacity=".55"/></g><circle class="cbk-ring" cx="30" cy="42" r="8" fill="none" stroke="#bfe3ff" stroke-width="1"/><circle class="cbk-ring" style="--d:-1s" cx="30" cy="42" r="8" fill="none" stroke="#bfe3ff" stroke-width="1"/><circle class="cbk-pulse" cx="30" cy="42" r="4.5" fill="#fff"/>` },
  "cb-gilded": { name: "Solid gold", note: "Gold leaf with a light that sweeps across it. Very subtle. Not subtle", price: 160,
    art: (u) => `<defs><linearGradient id="${u}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff3c4"/><stop offset=".45" stop-color="#E2B04A"/><stop offset="1" stop-color="#8C5E17"/></linearGradient><clipPath id="${u}k"><rect width="60" height="84" rx="5"/></clipPath></defs>${R(`url(#${u})`, "#8C5E17")}<g fill="none" stroke="#8C5E17" stroke-width="1"><path d="M30 14 L48 42 L30 70 L12 42Z"/><path d="M30 24 L41 42 L30 60 L19 42Z"/></g><path class="cbk-pulse" d="M30 33 L35.5 42 L30 51 L24.5 42Z" fill="#8C5E17"/><g clip-path="url(#${u}k)"><g transform="rotate(18 30 42)"><rect class="cbk-sweep" x="-20" y="-10" width="12" height="110" fill="#fff" opacity=".55"/></g></g>` },
};

/** Items for the Essence store, cheapest first. */
export const CARD_BACK_ITEMS = [
  { id: "cb-deck", kind: "cardback", name: "Each deck's own", note: "Tarot violet, Lenormand green, the Science is Magic atom, starlit Memory, midnight Rummy", price: 0 },
  ...Object.entries(CARD_BACK).map(([id, b]) => ({ id, kind: "cardback", name: b.name, note: b.note, price: b.price })),
];

/** Old per-game backs (Memory "gm-*", Rummy "cb-*", the first table set) map onto the one set, so nothing bought is lost. */
export const OLD_BACKS = { "gm-starlit": "cb-deck", "gm-seal": "cb-seal", "gm-runestone": "cb-runestone", "gm-birch": "cb-runestone", "gm-lapis": "cb-lapis", "gm-jade": "cb-ouroboros",
  "gm-ouroboros": "cb-ouroboros", "gm-moonlit": "cb-moonphase", "cb-midnight": "cb-deck", "cb-astrolabe": "cb-zodiac", "cb-aurora": "cb-nebula", "cb-atlas": "cb-zodiac", "cb-rose": "cb-seal" };
export function migrateBacks(p) {
  const to = (v) => OLD_BACKS[v] || (v === "cb-deck" || CARD_BACK[v] ? v : null);
  p.owned = [...new Set((p.owned || []).map((id) => OLD_BACKS[id] || id))];
  const mine = to(p.cardback), rummy = to(p.rummyback);
  p.cardback = mine && mine !== "cb-deck" ? mine : rummy || mine || "cb-deck";
  delete p.rummyback;
  return p;
}

let n = 0;
/** The chosen back as a standalone <svg> that fills its box, or "" for "each deck's own". */
export function cardBackSvg(id, attrs = `preserveAspectRatio="none" style="position:absolute;inset:0;width:100%;height:100%;display:block"`) {
  const b = CARD_BACK[id]; if (!b) return "";
  return `<svg class="cbk" viewBox="0 0 60 84" ${attrs} aria-hidden="true">${b.art("cbk" + (++n))}</svg>`;
}
/** The equipped unified back id, or "" when each deck keeps its own. */
export const equippedBack = (p) => (p && CARD_BACK[p.cardback] ? p.cardback : "");
