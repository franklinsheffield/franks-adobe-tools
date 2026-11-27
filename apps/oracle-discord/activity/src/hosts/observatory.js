// House 3: the Observatory (#🔭-observatory). Host: Keeper Altair (he), a calm astronomer named after Altair, the
// brightest star in Aquila. He reuses the Oracle's figure rig (moods, hands, eye tracking and emotes all work) with a
// midnight-blue hood stitched with a star chart, a brass telescope eyepiece over the eye and a small astrolabe badge.
// Brand brief: brand/houses/README.md (House 3). Lines are original; every fact in them is real.
import { vinylSvg } from "../player.js";
import { menuBg as OBS_MENU_BG } from "../watch/menubg.js";
import { secrets as DARK_SKY } from "../watch/darksky.js";
import { domeSceneHtml, astrolabeSvg, propsSvg, headSvg, react, SKY_EMOTES, DOME_CSS, obsCoatOf, obsCoatShop } from "./observatory-dome.js";
import { coatOverlay } from "./alchemist-lab.js";
import { harmonyDone } from "../obsprog.js";

const NS = "http://www.w3.org/2000/svg";

/** Star maps from different skies. The chosen map is stitched on Altair's hood. pts: [x, y] in a 120x40 patch; ln: index pairs. */
export const STAR_MAPS = [
  { id: "map-greek", name: "The Greek sky: Orion", price: 0, pts: [[22, 6], [92, 8], [50, 20], [58, 21], [66, 22], [30, 36], [96, 34]], ln: [[0, 2], [1, 4], [2, 3], [3, 4], [2, 5], [4, 6]],
    note: "Ptolemy's Almagest (about 150 AD) listed 48 constellations. Most of the ones we use today come from it." },
  { id: "map-chinese", name: "The Chinese sky: the Northern Dipper", price: 30, pts: [[8, 10], [26, 6], [42, 10], [56, 16], [62, 30], [88, 32], [92, 16]], ln: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 3]],
    note: "Chinese astronomers called the Plough Beidou, the Northern Dipper, and split the sky into 28 lunar mansions." },
  { id: "map-arabic", name: "The Arabic sky: star names", price: 30, pts: [[20, 20], [44, 12], [60, 26], [84, 14], [104, 22]], ln: [[0, 1], [1, 2], [2, 3], [3, 4]],
    note: "Many star names are Arabic. Aldebaran means 'the follower', because it rises after the Pleiades." },
  { id: "map-lakota", name: "The Lakota sky: the Hand", price: 40, pts: [[40, 6], [52, 10], [64, 14], [30, 34], [92, 32], [60, 30]], ln: [[0, 1], [1, 2], [0, 3], [2, 4], [5, 1]],
    note: "Lakota star knowledge sees a hand in the stars Europeans call Orion: the belt is the wrist." },
  { id: "map-emu", name: "The Emu in the Sky", price: 40, pts: [[12, 8], [30, 14], [50, 22], [72, 24], [96, 18], [108, 32]], ln: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]],
    note: "Many Aboriginal Australian peoples see an emu in the Milky Way's dark dust lanes, its head at the Coalsack." },
  { id: "map-hawaii", name: "The Hawaiian sky: Maui's fishhook", price: 40, pts: [[14, 6], [24, 10], [34, 16], [46, 24], [60, 30], [76, 32], [90, 28], [96, 18]], ln: [[0, 1], [1, 2], [2, 3], [3, 4], [4, 5], [5, 6], [6, 7]],
    note: "In Hawaii, the stars of Scorpius are Manaiakalani, the fishhook Maui used to pull islands from the sea." },
  { id: "map-egypt", name: "The Egyptian sky: Sah and Sopdet", price: 50, pts: [[30, 8], [46, 18], [54, 20], [62, 22], [40, 34], [98, 30]], ln: [[0, 1], [1, 2], [2, 3], [1, 4]],
    note: "Egyptians linked Orion (Sah) with Osiris. Sirius (Sopdet) rising before dawn came near the Nile flood." },
  { id: "map-inca", name: "The Inca sky: the llama", price: 60, pts: [[16, 30], [30, 18], [50, 14], [70, 16], [84, 24], [92, 8], [98, 10]], ln: [[0, 1], [1, 2], [2, 3], [3, 4], [3, 5]],
    note: "The Inca saw dark shapes in the Milky Way too. Yacana, the llama, has Alpha and Beta Centauri for eyes." },
];
export const starMapOf = (id) => STAR_MAPS.find((m) => m.id === id) || STAR_MAPS[0];

const chartG = (m, k = 1) => `${m.ln.map(([a, b]) => `<path d="M${m.pts[a][0] * k} ${m.pts[a][1] * k}L${m.pts[b][0] * k} ${m.pts[b][1] * k}" stroke="#DCE6FF" stroke-opacity=".55" stroke-width="${0.8 * k}"/>`).join("")}${m.pts.map(([x, y], i) => `<circle class="hk-star" style="--d:${(i * 0.37).toFixed(2)}s" cx="${x * k}" cy="${y * k}" r="${1.6 * k}" fill="#DCE6FF"/>`).join("")}`;
const mapCard = (m) => `<svg viewBox="0 0 200 200" aria-hidden="true"><rect width="200" height="200" rx="16" fill="#0B1530" stroke="#2A3F6E" stroke-width="3"/>
  ${Array.from({ length: 26 }, (_, i) => `<circle cx="${(i * 47) % 200}" cy="${(i * 83) % 200}" r="${0.5 + (i % 3) * 0.4}" fill="#fff" opacity=".5"/>`).join("")}
  <circle cx="100" cy="100" r="88" fill="none" stroke="#E2B04A" stroke-width="1.4" stroke-dasharray="2 5"/><g transform="translate(10 60)">${chartG(m, 1.5)}</g></svg>`;

/** The store shelf (department "House hosts"). prog.starmap = the star map stitched on Altair's hood. */
export const starMapShop = {
  kind: "starmap", label: "🔭 Altair's star maps",
  items: STAR_MAPS.map(({ id, name, note, price }) => ({ id, name, note, price })),
  talk: {
    open: ["Every culture drew its own pictures in the same stars. Pick a sky and I'll stitch it on my hood.", "Star maps from around the world. Same stars, different stories.", "People everywhere looked up and saw something. These are some of the things they saw."],
    tryon: ["{item}. Look at that. Same stars, new picture.", "{item}. It suits the hood, I think.", "{item}. I could look at that all night. I usually do."],
    buy: ["{item}, stitched on. Thank you, {name}.", "{item}. Now I carry that sky with me.", "{item}, in silver thread. Quietly amazing."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(mapCard(starMapOf(id))); ctx.cap("🔭 " + starMapOf(id).name); },
};

/** Observatory relics: permanent fixtures in Altair's House, bought only with ☄️ comet shards. Notes are real history. */
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
  // Phase 4 relics (2026-11-27): six instruments that changed what we could see.
  { id: "sk-nebra", e: "🌕", name: "Nebra sky disc", price: 12, note: "A bronze disc from about 1600 BC, found in Germany in 1999: the oldest known picture of the sky, with Sun, Moon and Pleiades in gold.", x: 17, y: 64, w: 8, vb: "0 0 100 100",
    art: () => `<defs>${AU}</defs><circle cx="50" cy="50" r="46" fill="#2f6b5a" stroke="#1d4438" stroke-width="2"/><circle cx="34" cy="38" r="12" fill="url(#hrg)"/><path d="M62 30a14 14 0 1 0 8 26a11 11 0 1 1 -8 -26z" fill="url(#hrg)"/>${[[58, 70], [62, 66], [66, 72], [60, 76], [55, 74], [64, 78], [57, 64]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="2" fill="#FADE8C"/>`).join("")}<path d="M10 64a46 46 0 0 0 16 26" stroke="url(#hrg)" stroke-width="4" fill="none"/><path d="M28 92q22 6 44 0" stroke="url(#hrg)" stroke-width="3" fill="none"/>` },
  { id: "sk-ulughbeg", e: "📐", name: "Ulugh Beg's sextant", price: 16, note: "Ulugh Beg's observatory in Samarkand (1420s) had a meridian arc about 40 m in radius. His catalogue listed 1,018 stars.", x: 93, y: 72, w: 7, vb: "0 0 70 110",
    art: () => `<defs>${AU}</defs><path d="M8 104 L8 10 A94 94 0 0 1 62 104 Z" fill="#c9a47a" stroke="#6b4a2a" stroke-width="2"/><path d="M14 104 A88 88 0 0 0 14 16" fill="none" stroke="url(#hrg)" stroke-width="4"/>${Array.from({ length: 9 }, (_, i) => { const a = Math.PI / 2 - (i / 8) * (Math.PI / 2.4); return `<path d="M${(8 + 90 * Math.cos(a)).toFixed(1)} ${(104 - 90 * Math.sin(a)).toFixed(1)}l-4 2" stroke="#3a2a1a" stroke-width="1.4"/>`; }).join("")}<rect x="8" y="104" width="56" height="4" fill="#6b4a2a"/>` },
  { id: "sk-h4", e: "⌚", name: "Harrison's H4", price: 18, note: "John Harrison's sea watch H4 lost only about 5 seconds on a 1761-62 voyage to Jamaica, solving longitude at sea.", x: 85, y: 84, w: 5, vb: "0 0 70 80",
    art: () => `<defs>${AU}</defs><circle cx="35" cy="10" r="6" fill="none" stroke="url(#hrg)" stroke-width="3"/><circle cx="35" cy="46" r="31" fill="url(#hrg)"/><circle cx="35" cy="46" r="25" fill="#f6efe0"/>${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<circle cx="${(35 + 21 * Math.sin(a)).toFixed(1)}" cy="${(46 - 21 * Math.cos(a)).toFixed(1)}" r="1.3" fill="#2a1a0a"/>`; }).join("")}<g class="hr-spin" style="transform-origin:35px 46px"><path d="M35 46V28" stroke="#2a1a0a" stroke-width="1.6"/></g><path d="M35 46l9 6" stroke="#2a1a0a" stroke-width="2.2"/>` },
  { id: "sk-herschel", e: "🔭", name: "Herschel's 40-foot", price: 22, note: "William Herschel's 40-foot telescope, finished in 1789, was the world's largest for over 50 years. He found Saturn's moon Enceladus with it that year.", x: 0, y: 26, w: 13, vb: "0 0 120 120",
    art: () => `<defs>${AU}</defs><path d="M10 116L40 20M110 116L80 20M40 20H80M22 76H98" stroke="#6b4a2a" stroke-width="3" fill="none"/><g transform="rotate(-50 60 80)"><rect x="18" y="70" width="96" height="20" rx="4" fill="#3a3f4a" stroke="#1a1d24" stroke-width="1.5"/><rect x="108" y="66" width="8" height="28" rx="2" fill="url(#hrg)"/>${[40, 62, 84].map((x) => `<path d="M${x} 70v20" stroke="#6b7180" stroke-width="1.5"/>`).join("")}</g><path d="M4 116H116" stroke="#6b4a2a" stroke-width="4"/>` },
  { id: "sk-leavitt", e: "🎞️", name: "Leavitt's plate", price: 24, note: "Henrietta Swan Leavitt found in 1912 that a Cepheid star's brightness follows its pulse period: a yardstick for distances across the universe.", x: 88, y: 2, w: 10, vb: "0 0 100 80",
    art: () => `<rect x="4" y="4" width="92" height="72" rx="3" fill="#cfd6dc" stroke="#7a838c" stroke-width="2"/><rect x="10" y="10" width="80" height="60" fill="#f4f6f2"/>${Array.from({ length: 40 }, (_, i) => `<circle cx="${(14 + ((i * 37) % 72)).toFixed(0)}" cy="${(14 + ((i * 53) % 52)).toFixed(0)}" r="${(0.6 + (i % 3) * 0.5).toFixed(1)}" fill="#1a1a1a"/>`).join("")}<g class="hr-twinkle"><circle cx="62" cy="34" r="3" fill="#1a1a1a"/></g><circle cx="62" cy="34" r="7" fill="none" stroke="#c0392b" stroke-width="1.2"/><path d="M12 66h30" stroke="#5b4b9a" stroke-width="1.4"/>` },
  { id: "sk-blink", e: "🪞", name: "Tombaugh's blink comparator", price: 26, note: "Clyde Tombaugh flicked between two photo plates of the same sky in a blink comparator and found Pluto in February 1930.", x: 36, y: 2, w: 9, vb: "0 0 110 80",
    art: () => `<rect x="10" y="40" width="90" height="34" rx="4" fill="#3a3f4a" stroke="#1a1d24" stroke-width="2"/><rect x="18" y="46" width="32" height="22" fill="#0b1033"/><rect x="60" y="46" width="32" height="22" fill="#0b1033"/>${[[26, 52], [34, 60], [42, 54], [68, 52], [76, 60], [84, 54]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="1" fill="#DCE6FF"/>`).join("")}<g class="hr-twinkle"><circle cx="40" cy="62" r="1.6" fill="#FADE8C"/></g><circle cx="85" cy="63" r="1.6" fill="#FADE8C"/><path d="M50 40V20h10v20" fill="#6b7180" stroke="#1a1d24"/><circle cx="55" cy="16" r="8" fill="#2a2d36" stroke="#9AA6C9" stroke-width="1.5"/>` },
];

/** The orrery music box: Altair's own player for the shared music pool. Same classes as the turntable (tt, tt-disc). */
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
body[data-house="observatory"] .speaker{color:#8FB8FF;font-family:"Cormorant Garamond",Georgia,serif;letter-spacing:.22em}
body[data-house="observatory"] .gate-title{color:#8FB8FF;font-family:"Cormorant Garamond",Georgia,serif;letter-spacing:.18em;text-transform:uppercase}
.or.playing .or-sun{animation:hr-pulse 2.4s ease-in-out infinite;transform-origin:206px 66px}
.h-altair .hk-rete{animation:hr-spin 40s linear infinite}
.h-altair .hk-glint{animation:hk-tw 5s ease-in-out infinite}.h-altair .hk-star{animation:hk-tw 3s ease-in-out infinite;animation-delay:var(--d,0s)}
.hr-twinkle circle{animation:hk-tw 2.6s ease-in-out infinite;animation-delay:var(--d,0s)}
.hr-wave{animation:hk-wave 6s ease-in-out infinite alternate;animation-delay:var(--d,0s);transform-origin:70px 60px}
.hr-shadow{animation:hk-sweep 20s linear infinite}
.hr-spin-r{animation:hr-spin 16s linear infinite reverse}
@keyframes hk-tw{0%,100%{opacity:.35}50%{opacity:1}}
@keyframes hk-wave{to{transform:skewX(-8deg) scaleY(1.08)}}
@keyframes hk-sweep{from{transform:rotate(0)}to{transform:rotate(180deg)}}
.hr-spin{animation:hr-spin 24s linear infinite}@keyframes hr-spin{to{transform:rotate(360deg)}}
.hr-glint{animation:hk-tw 3s ease-in-out infinite}@keyframes hr-pulse{50%{transform:scale(1.08)}}
@media (prefers-reduced-motion: reduce){.or.playing .or-sun,.h-altair .hk-rete,.h-altair .hk-glint,.h-altair .hk-star,[class^="hr-"],[class*=" hr-"],.hr-twinkle circle{animation:none}}`;

/** Dress the shared figure as Keeper Altair: midnight hood with a stitched star chart, brass eyepiece, astrolabe badge. */
function paint(svg, prog, id = "t") {
  if (!svg) return;
  const stops = (gid, cols) => svg.querySelectorAll(`#${id}-${gid} stop`).forEach((s, i) => cols[i] && s.setAttribute("stop-color", cols[i]));
  const C = prog && prog.obscoat ? obsCoatOf(prog.obscoat) : null;
  stops("face", ["#DCE6FF", "#8FB8FF", "#2A3F6E"]); stops("hood", C ? C.hood : ["#1c2f5e", "#0B1530", "#03060f"]); stops("iris", ["#FFFFFF", "#8FB8FF", "#2A3F6E"]);
  svg.querySelectorAll('.o-body [stroke="#E2B04A"], .o-body [data-trim], .o-sleeves, .o-sleeves [data-trim]').forEach((e) => { if (!e.closest(".o-hands")) e.setAttribute("stroke", C ? C.trim : "#8FB8FF"); });
  const body = svg.querySelector(".o-body"), eye = svg.querySelector(".o-eye"); if (!body || !eye) return;
  svg.querySelector(".h-altair")?.remove();
  const M = starMapOf(prog && prog.starmap), g = document.createElementNS(NS, "g"); g.setAttribute("class", "h-altair");
  const ticks = Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * Math.PI * 2; return `<path d="M${(200 + 44 * Math.cos(a)).toFixed(1)} ${(152 + 33 * Math.sin(a)).toFixed(1)}L${(200 + 49 * Math.cos(a)).toFixed(1)} ${(152 + 37 * Math.sin(a)).toFixed(1)}" stroke="#6b3f12" stroke-width="1.4"/>`; }).join("");
  g.innerHTML = `${headSvg()}<g class="ha-piece"><ellipse cx="200" cy="152" rx="47" ry="35" fill="none" stroke="#E2B04A" stroke-width="7"/>${ticks}
    <ellipse cx="200" cy="152" rx="52" ry="40" fill="none" stroke="#2A3F6E" stroke-width="1.6"/>
    <path d="M200 120V132M200 172V184M156 152H168M232 152H244" stroke="#E2B04A" stroke-width="1.6" opacity=".85"/>
    <ellipse class="hk-glint" cx="200" cy="152" rx="40" ry="29" fill="#8FB8FF" opacity=".1"/>
    <path d="M170 136 A36 26 0 0 1 196 124" stroke="#fff" stroke-opacity=".55" stroke-width="3" fill="none" stroke-linecap="round"/>${harmonyDone(prog || {}) ? `<path class="ha-star" d="M226 126 L228.2 131.8 L234 134 L228.2 136.2 L226 142 L223.8 136.2 L218 134 L223.8 131.8Z" fill="#FADE8C"><title>The Harmony of the Spheres: complete</title></path>` : ""}</g>
    <g transform="translate(200 92)"><circle r="12" fill="#C88A3A" stroke="#6b3f12"/><circle r="8.5" fill="#0B1530"/><g class="hk-rete"><path d="M0 -8V8M-8 0H8" stroke="#E2B04A" stroke-width="1"/><circle cx="0" cy="-2" r="4.5" fill="none" stroke="#E2B04A" stroke-width="1"/></g><circle cx="0" cy="-14" r="2.6" fill="none" stroke="#C88A3A" stroke-width="1.4"/></g>
    <g class="hk-chart" transform="translate(140 204)">${chartG(M)}</g>`;
  eye.after(g);
  svg.querySelector(".hv-coat")?.remove(); if (C && body.children[4]) body.children[4].insertAdjacentHTML("afterend", coatOverlay(C)); // his observing coat, over the robe
  const ball = svg.querySelector(".o-ball"), hands = svg.querySelector(".o-hands"); // the astrolabe stands where the crystal ball was
  if (ball) { ball.querySelector(".ao-astro")?.remove(); ball.insertAdjacentHTML("beforeend", astrolabeSvg(id)); }
  if (hands) { hands.querySelector(".ao-props")?.remove(); hands.insertAdjacentHTML("beforeend", propsSvg()); }
  for (const side of ["L", "R"]) { const h = svg.querySelector(".o-hand" + side); if (h) { h.querySelectorAll(".hg").forEach((e) => e.remove()); h.insertAdjacentHTML("beforeend", altairHand(side)); } }
}
/** Altair's hands (left-hand coordinates; the right hand is mirrored). At rest his left hand holds up a red observing torch (red light keeps night vision)
 *  and his right hangs open; his gestures: snap = a star twinkles at his fingertips, point = he traces a dotted star-hop,
 *  swat = a little comet streaks off his palm. */
const altairHand = (side) => (side === "L"
  ? `<g class="hg hg-rtorch"><rect x="153" y="236" width="14" height="40" rx="4" fill="#3a3a44" stroke="#111"/><rect x="150" y="226" width="20" height="13" rx="3" fill="#5a1414"/><circle class="ha-red" cx="160" cy="232" r="5" fill="#ff4a4a"/><circle cx="160" cy="232" r="12" fill="#ff3a3a" opacity=".18"/></g>`
  : `<g class="hg hg-star">${[[162, 252, 7], [176, 240, 4], [148, 238, 3.4]].map(([x, y, r], i) => `<path style="--d:${i * 0.08}s" d="M${x} ${y - r * 2} L${x + r * 0.5} ${y - r * 0.5} L${x + r * 2} ${y} L${x + r * 0.5} ${y + r * 0.5} L${x} ${y + r * 2} L${x - r * 0.5} ${y + r * 0.5} L${x - r * 2} ${y} L${x - r * 0.5} ${y - r * 0.5}Z" fill="#e9f0ff"/>`).join("")}</g>
    <g class="hg hg-hop" fill="none" stroke="#8FB8FF" stroke-width="2" stroke-dasharray="2 6" stroke-linecap="round"><path d="M162 256 Q150 200 120 176 T60 150"/><circle cx="120" cy="176" r="3" fill="#e9f0ff" stroke="none"/><circle cx="60" cy="150" r="4" fill="#e9f0ff" stroke="none"/></g>`)
  + `<g class="hg hg-comet"><path d="M150 250 L104 226" stroke="#8FB8FF" stroke-width="5" stroke-linecap="round" opacity=".5"/><circle cx="150" cy="250" r="5" fill="#e9f0ff"/></g>`;
export const ALTAIR_HANDS_CSS = `
body[data-house="observatory"] .teller:not([data-mood]):not([data-gesture]) .o-hands .o-handL{animation:a-hold 7s ease-in-out infinite}
body[data-house="observatory"] .teller:not([data-mood]):not([data-gesture]) .o-hands .o-handR{animation:a-rest 7s ease-in-out infinite}
body[data-house="observatory"] .teller:not([data-mood]) .o-handL .o-f{animation:none;transform:rotate(44deg)}
body[data-house="observatory"] .teller:not([data-mood]) .o-handR .o-f{animation-duration:6.5s}
body[data-house="observatory"] .teller:not([data-mood]):not([data-gesture]) .hg-rtorch{opacity:1}
.ha-red{animation:hk-tw 4s ease-in-out infinite}
@keyframes a-hold{0%,100%{transform:translate(18px,-58px) rotate(-6deg)}50%{transform:translate(18px,-62px) rotate(-8deg)}}
@keyframes a-rest{0%,100%{transform:translate(0,14px) rotate(-4deg)}50%{transform:translate(1px,11px) rotate(-5deg)}}
.hg{opacity:0;pointer-events:none}
body[data-house="observatory"] [data-gesture="snap"] .hg-star{opacity:1}body[data-house="observatory"] [data-gesture="snap"] .hg-star path{animation:a-twinkle .5s ease-out both;animation-delay:calc(.2s + var(--d));transform-box:fill-box;transform-origin:50% 50%}
body[data-house="observatory"] [data-gesture="point"] .hg-hop{opacity:1;animation:a-hop 1.3s ease-out both}
body[data-house="observatory"] [data-gesture="swatL"] .o-handL .hg-comet,body[data-house="observatory"] [data-gesture="swatR"] .o-handR .hg-comet{opacity:1;animation:a-comet .43s ease-out both}
@keyframes a-twinkle{0%{transform:scale(0) rotate(0)}60%{transform:scale(1.3) rotate(45deg)}100%{transform:scale(.8) rotate(90deg);opacity:0}}
@keyframes a-hop{from{stroke-dashoffset:60}to{stroke-dashoffset:0}}
@keyframes a-comet{from{transform:translate(0,0)}to{transform:translate(-40px,-20px);opacity:0}}
@media (prefers-reduced-motion: reduce){body[data-house="observatory"] .teller .o-hand,.ha-red{animation:none!important}}`;

/** Swap the Oracle's name for Altair's in any line or menu. Rank names (Oracle-touched) and /oracle stay. */
const RENAME = [
  [/\bThe Oracle Chamber\b/g, "The Observatory"], [/\bthe Oracle Chamber\b/g, "the Observatory"], [/\bOracle Chamber\b/g, "Observatory"],
  [/\bTHE ORACLE\b/g, "KEEPER ALTAIR"], [/\b[Tt]he Oracle's\b/g, "Keeper Altair's"], [/\b[Tt]he Oracle\b/g, "Keeper Altair"],
  [/\bEnter the Chamber\b/g, "Enter the Observatory"], [/\b[Tt]he Chamber\b/g, (m) => (m[0] === "T" ? "The Observatory" : "the Observatory")],
  [/\b([Tt])he Record Player\b/g, "$1he Orrery Music Box"], [/\brecord player\b/g, "music box"], [/\bRecord player\b/g, "Music box"],
  [/\bDraw today's card\b/g, "Tonight's sky"], [/Readings, card games and real science, with a fortune teller who talks back/g, "Real stars, real calendars and the myths people told about them, with an astronomer who talks back"], [/(?<![\w/-])Oracle(?![\w-])/g, "Altair"],
];

const G = (mid1, mid2, win, lose) => ({ mid: [mid1, mid2], win: [win], lose: [lose] });

export const observatory = {
  id: "observatory", name: "Keeper Altair", house: "The Observatory", emoji: "🔭", accent: "#8FB8FF",
  channelIds: ["1575975395692642596"], // #🔭-observatory
  readings: false, rooms: ["watch", "comet", "eclipse", "navigator", "messier", "stars", "calendar", "rummy", "possession"], daily: "stars",
  // his voice is branded to the dome: a low bell-like sine with a fifth above it and a slow starlight shimmer (vibrato)
  voice: { type: "sine", base: 220, step: 22, vowel: 90, dur: 0.06, lp: 2600, harm: [1.5, 0.25], vib: 5, vibDepth: 6, brand: "starlight bell",
    sting: { type: "sine", notes: [[440, 0, 1.2, 0.25], [660, 0.18, 1.2, 0.2], [880, 0.36, 1.4, 0.16], [1320, 0.54, 1.6, 0.1]] } }, // door sting: a bell rising in fifths and octaves, like stars coming out
  css: OBSERVATORY_CSS + ALTAIR_HANDS_CSS + DOME_CSS, paint, scene: domeSceneHtml, react, emotes: SKY_EMOTES, rename: (s) => RENAME.reduce((t, [re, to]) => t.replace(re, to), s),
  player: { name: "The Orrery Music Box", deck: orrerySvg },
  shelves: [starMapShop, obsCoatShop],
  token: { id: "shard", emoji: "☄️", name: "comet shard", plural: "comet shards", purse: "Shard case" },
  relics: SKY_RELICS, relicLabel: "☄️ Observatory relics", relicBlurb: "Observatory relics stay up here for good. Earn shards with your first visit each day and by beating game levels here.",
  strayIntro: "Something just rolled out of the telescope tube:",
  lines: {
    greet: ["Give your eyes 20 minutes in the dark, {name}. The sky gets bigger.", "Welcome to the Observatory, {name}. Look up. Then look closer.",
      "Good evening, {name}. The dome is open and the stars are where we left them. Roughly."],
    idle: ["Sunlight takes about eight minutes to reach us, so we always see the Sun as it was a few minutes ago.",
      "Earth's axis wobbles in a slow circle about 26,000 years long. In about 12,000 years Vega will be our pole star.",
      "Babylonian astronomers recorded Venus on clay tablets. One set follows it for about 21 years.",
      "Altair spins so fast, about once every nine hours, that it bulges at the middle. The Sun takes nearly a month.",
      "Every culture drew its own pictures in the same stars. Ask me about the Lakota sky some time."],
    joke: ["I'd tell you a joke about the Sun, but it's too far out. About 150 million km, to be exact.", "The Moon is drifting away from us, about 3.8 cm a year. I try not to take it personally.",
      "Pluto has a heart. A real one: a pale heart-shaped plain that New Horizons photographed in 2015.", "Astronomers measure in light-years, which is a distance, not a time. We just like to confuse people.",
      "A day on Venus is longer than its year. Imagine the paperwork."],
  },
  banter: {
    possession: G("Ptolemy's Almagest listed 48 constellations. Tonight we add one more.", "Aratus wrote a whole poem on the constellations in the 3rd century BCE.", "Logged, {name}! The sky has had 88 official constellations since 1922. Plus yours.", "Clouds over the story tonight. Even Ptolemy had cloudy nights."),
    watch: G("Let your eyes settle. Faint things need a slow look.", "Hipparchus ranked star brightness by eye: 1st to 6th magnitude.", "Logged! Every plate needs a night someone stayed up for.", "Clouded out. Even Herschel lost nights. Try again, {name}."),
    eclipse: G("A Saros cycle is about 18 years 11 days. Eclipses repeat on it.", "Next big one: 2 August 2027, with totality over Luxor for over 6 minutes.", "Right in the shadow, {name}! Totality can last up to about 7.5 minutes.", "Clouded out. And never watch the partial phase without eclipse glasses."),
    navigator: G("Polaris sits about as high above the horizon as your latitude.", "Harrison's H4 watch solved longitude on a 1761 voyage to Jamaica.", "Landfall, {name}! A sextant and a good clock still get you home.", "Off course. The Southern Cross points toward the south celestial pole."),
    messier: G("M1 is the Crab Nebula, the wreck of a star seen exploding in 1054.", "M31, Andromeda, is about 2.5 million light-years away, and naked-eye too.", "Logged, {name}! Messier hunted comets; his list of nuisances became a classic.", "Missed it. Many Messier objects need dark skies, far from city lights."),
    comet: G("Sweep slowly. A new comet looks like a faint fuzzy star.", "Charles Messier listed 110 fuzzy things so comet hunters could skip them.", "A comet! Report it fast. Discoverers get their name on it.", "Just a smudge, {name}. Messier made that mistake too."),
    stars: G("No rush. Find a bright one first, then hop from there.", "Every culture saw something different here. Take your time.", "Found and drawn! The sky looks back, {name}.", "Lost among the stars. Happens to every navigator. Look again."),
    calendar: G("The Maya kept a 260-day count beside a 365-day one. Count with me.", "Every calendar chases the Sun, the Moon, or both.", "Gears aligned! You'd make a fine keeper of days.", "The cycle slipped by a day. Calendars are fussy about that."),
    rummy: G("A star from Orion? He's always showing off.", "I'm holding three of the Plough. Or am I?", "You went out first! The sky is yours tonight, {name}.", "My constellation is complete. The night favours the patient."),
  },
  poke: ["Careful, the eyepiece is brass and very old.", "Gently, {name}. I'm calibrated.", "Poke me again and I'll name a faint star after you. Unofficially."],
  perfect: ["A perfect night's work, {name}. Not a cloud in it."],
  menuBg: OBS_MENU_BG, // the dome at night: real meteor showers, Polaris, the Milky Way (watch/menubg.js)
  secrets: DARK_SKY, // "🌌 Dark Sky": 20 finds (watch/darksky.js)
};
