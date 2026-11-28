// Step 2 emoji: server levels, hybrid class crests, the Common Grounds and the Conch of Dignity. Same v4 style as art.mjs.
// Each entry: name -> (t) => inner SVG for a 128x128 viewBox; animated ones take t in [0,1).
import { KITS } from "./art.mjs";

const O = "#120a24", SW = 5;
const G = "#E2B04A", GL = "#FADE8C", GD = "#B8893A", HONEY = "#F2B63C";
const s = (o = {}) => Object.entries(o).map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}="${v}"`).join(" ");
const ol = (extra = {}) => s({ stroke: O, strokeWidth: SW, strokeLinejoin: "round", strokeLinecap: "round", ...extra });
const gloss = (cx, cy, rx, ry, rot = -25, op = 0.45) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;
const sp = (x, y, r, c = "#fff", op = 1) => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${c}" opacity="${op}"/>`;
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
const pulse = (t, a, b) => (t < a || t > b ? 0 : Math.sin(Math.PI * (t - a) / (b - a)));
const num = (x, y, txt, size, fill = "#fff", sw = 5) =>
  `<text x="${x}" y="${y}" font-family="DejaVu Serif,Georgia,serif" font-weight="bold" font-size="${size}" text-anchor="middle" fill="${fill}" stroke="${O}" stroke-width="${sw}" paint-order="stroke" stroke-linejoin="round">${txt}</text>`;

// House accents in canonical order (house-tokens.json) and their small tokens from the step 1 kits.
const H = { oracle: "#FF4FB3", alchemist: "#E89A55", observatory: "#8FB8FF", parlour: "#C3A6FF", scriptorium: "#E8483B" };
const HD = { oracle: "#2E1E68", alchemist: "#26130A", observatory: "#0B1530", parlour: "#2A0F24", scriptorium: "#1C1710" };
const kit = Object.fromEntries(KITS.map((k) => [k.p, k.items]));
const TOK = { oracle: kit.or.moon, alchemist: kit.al.stone, observatory: kit.ob.shard, parlour: kit.pa.key, scriptorium: kit.sc.scroll };
const ORDER = Object.keys(H);
const mini = (fn, cx, cy, k) => `<g transform="translate(${cx} ${cy}) scale(${k}) translate(-64 -64)">${fn(0)}</g>`;

// ---------- levels ----------
// lv1..lv6: honey-gold medal with the number; one notch ring per level around the rim.
function medal(n) {
  let dots = "";
  for (let i = 0; i < n; i++) {
    const a = (-90 + (i - (n - 1) / 2) * 26) * Math.PI / 180;
    dots += `<circle cx="${64 + 50 * Math.cos(a)}" cy="${70 + 50 * Math.sin(a)}" r="6" fill="${GL}" ${ol({ strokeWidth: 3 })}/>`;
  }
  const rim = n >= 6 ? ORDER.map((h, i) => { const a0 = (-90 + i * 72) * Math.PI / 180, a1 = (-90 + (i + 1) * 72) * Math.PI / 180;
    return `<path d="M${64 + 40 * Math.cos(a0)} ${70 + 40 * Math.sin(a0)}A40 40 0 0 1 ${64 + 40 * Math.cos(a1)} ${70 + 40 * Math.sin(a1)}" stroke="${H[h]}" stroke-width="7" fill="none"/>`; }).join("") : `<circle cx="64" cy="70" r="40" fill="none" stroke="${GD}" stroke-width="6"/>`;
  return `<path d="M44 96L34 124L50 116L58 126L64 100Z" fill="#7a3aa8" ${ol({ strokeWidth: 4 })}/><path d="M84 96L94 124L78 116L70 126L64 100Z" fill="#5a2a8a" ${ol({ strokeWidth: 4 })}/>
  <circle cx="64" cy="70" r="44" fill="${HONEY}" ${ol()}/>${rim}<circle cx="64" cy="70" r="33" fill="#C8902A" ${ol({ strokeWidth: 3 })}/>
  ${num(64, 90, String(n), 56, "#FFF6D8", 6)}${dots}${gloss(46, 48, 12, 6, -35, 0.5)}`;
}
// lv_half: the hidden half-step, a cracked half mask with a small ".5".
function lvHalf() {
  return `<path d="M64 16C34 16 18 36 18 62C18 92 40 114 64 116Z" fill="#F4F1FF" ${ol()}/>
  <path d="M64 16C94 16 110 36 110 62C110 92 88 114 64 116Z" fill="#2a1a40" ${ol()}/>
  <path d="M64 16L58 34L68 48L56 64L66 80L58 98L64 116" stroke="${O}" stroke-width="4" fill="none" stroke-linejoin="round"/>
  <path d="M30 56Q40 48 50 56Q40 62 30 56Z" fill="${O}"/><path d="M78 56Q88 48 98 56Q88 62 78 56Z" fill="${HONEY}" ${ol({ strokeWidth: 2.5 })}/>
  <path d="M36 86Q44 92 52 88" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/><path d="M76 88Q84 84 92 86" stroke="${HONEY}" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${gloss(36, 34, 10, 5, -35, 0.6)}<circle cx="104" cy="104" r="20" fill="${HONEY}" ${ol({ strokeWidth: 4 })}/>${num(104, 113, ".5", 24, "#fff", 4)}`;
}
// level_up: a door swings open and light pours out, then it closes again.
function levelUp(t) {
  const open = ease(t < 0.55 ? t / 0.4 : (1 - t) / 0.4);
  const rays = Array.from({ length: 7 }, (_, i) => { const a = (-150 + i * 20) * Math.PI / 180; return `<path d="M64 76L${64 + 70 * Math.cos(a)} ${76 + 70 * Math.sin(a)}" stroke="${GL}" stroke-width="5" opacity="${0.8 * open}" stroke-linecap="round"/>`; }).join("");
  return `${rays}<path d="M22 122V54A42 42 0 0 1 106 54V122Z" fill="#3a2258" ${ol()}/>
  <path d="M32 122V56A32 32 0 0 1 96 56V122Z" fill="${GL}"/><path d="M32 122V56A32 32 0 0 1 96 56V122Z" fill="#fff" opacity="${0.6 * open}"/>
  <g transform="translate(32 0) scale(${1 - 0.85 * open} 1) translate(-32 0)"><path d="M32 122V56A32 32 0 0 1 96 56V122Z" fill="#7a4a2a" ${ol({ strokeWidth: 4 })}/>
  <path d="M44 70H84M44 96H84" stroke="#5a3418" stroke-width="4"/><circle cx="86" cy="88" r="5" fill="${G}" ${ol({ strokeWidth: 2 })}/></g>
  ${sp(110, 22, 4 + 6 * open, "#fff")}${sp(18, 30, 3 + 4 * open, HONEY)}<path d="M64 8L72 20H56Z" fill="${HONEY}" ${ol({ strokeWidth: 3 })}/>`;
}
// path_sealed: five House sparks spiral in, then the gold seal stamps.
function pathSealed(t) {
  const p = ease(t / 0.5), seal = t > 0.5 ? ease((t - 0.5) / 0.15) : 0;
  const sparks = ORDER.map((h, i) => { const a = (i * 72 - 90 + 200 * (1 - p)) * Math.PI / 180, r = 52 * (1 - p) + 22;
    return `<circle cx="${64 + r * Math.cos(a)}" cy="${64 + r * Math.sin(a)}" r="${9 - 2 * seal}" fill="${H[h]}" ${ol({ strokeWidth: 3 })} opacity="${1 - 0.3 * seal}"/>`; }).join("");
  const sealG = seal > 0 ? `<g transform="translate(64 64) scale(${0.4 + 0.6 * seal}) translate(-64 -64)"><circle cx="64" cy="64" r="34" fill="${HONEY}" ${ol()}/>
    ${ORDER.map((h, i) => { const a = (i * 72 - 90) * Math.PI / 180; return `<circle cx="${64 + 22 * Math.cos(a)}" cy="${64 + 22 * Math.sin(a)}" r="6" fill="${H[h]}" ${ol({ strokeWidth: 2 })}/>`; }).join("")}
    <circle cx="64" cy="64" r="9" fill="#FFF6D8" ${ol({ strokeWidth: 3 })}/>${gloss(52, 48, 9, 4, -35, 0.5)}</g>` : "";
  const ring = t > 0.62 ? `<circle cx="64" cy="64" r="${36 + 40 * ease((t - 0.62) / 0.3)}" fill="none" stroke="${GL}" stroke-width="${5 * (1 - ease((t - 0.62) / 0.3))}"/>` : "";
  return `${ring}${sparks}${sealG}`;
}

// ---------- class crests: a shield split in the two Houses' colours, one token from each ----------
const CLASSES = [
  ["hermeticist", "oracle", "alchemist", "#F47584"], ["astrologer_astronomer", "oracle", "observatory", "#B58CFF"],
  ["mentalist", "oracle", "parlour", "#E17AD9"], ["sibyllist", "oracle", "scriptorium", "#F44C77"],
  ["astrochemist", "alchemist", "observatory", "#7FD6C2"], ["showman_chemist", "alchemist", "parlour", "#FFB347"],
  ["cipher_alchemist", "alchemist", "scriptorium", "#D9663F"], ["sky_skeptic", "observatory", "parlour", "#A9C4FF"],
  ["almanac_maker", "observatory", "scriptorium", "#C9D96A"], ["document_examiner", "parlour", "scriptorium", "#E0A3A0"],
];
const SHIELD = "M64 8L112 22V60C112 92 92 112 64 122C36 112 16 92 16 60V22Z";
function classCrest(a, b, rim) {
  return `<defs><clipPath id="sh"><path d="${SHIELD}"/></clipPath></defs>
  <path d="${SHIELD}" fill="${rim}" ${ol({ strokeWidth: 8 })}/><path d="${SHIELD}" fill="${rim}"/>
  <g clip-path="url(#sh)" transform="translate(64 66) scale(.84) translate(-64 -66)">
    <rect x="0" y="0" width="64" height="128" fill="${H[a]}"/><rect x="64" y="0" width="64" height="128" fill="${H[b]}"/>
    <rect x="0" y="0" width="64" height="128" fill="${HD[a]}" opacity=".35"/><rect x="64" y="0" width="64" height="128" fill="${HD[b]}" opacity=".35"/>
    <path d="M64 0V128" stroke="${O}" stroke-width="4"/></g>
  <path d="${SHIELD}" fill="none" stroke="${O}" stroke-width="3" transform="translate(64 66) scale(.84) translate(-64 -66)"/>
  ${mini(TOK[a], 42, 64, 0.36)}${mini(TOK[b], 86, 64, 0.36)}
  ${gloss(36, 28, 10, 4, -20, 0.45)}`;
}

// ---------- Common Grounds ----------
// cg_coin: the resource coin, five House pips around a crossroads.
function cgCoin() {
  const pips = ORDER.map((h, i) => { const a = (i * 72 - 90) * Math.PI / 180; return `<circle cx="${64 + 30 * Math.cos(a)}" cy="${64 + 30 * Math.sin(a)}" r="7" fill="${H[h]}" ${ol({ strokeWidth: 3 })}/>`; }).join("");
  return `<circle cx="64" cy="68" r="52" fill="${GD}" ${ol()}/><circle cx="64" cy="64" r="52" fill="${HONEY}" ${ol()}/>
  <circle cx="64" cy="64" r="42" fill="none" stroke="${GD}" stroke-width="4"/>
  <path d="M64 46V82M46 64H82" stroke="${O}" stroke-width="9" stroke-linecap="round"/><path d="M64 46V82M46 64H82" stroke="#FFF6D8" stroke-width="4" stroke-linecap="round"/>${pips}
  ${gloss(44, 38, 14, 6, -35, 0.5)}`;
}
// cg_portal: the level 4 door, a swirling arch.
function cgPortal(t) {
  let swirl = "";
  for (let i = 0; i < 5; i++) { const r = 8 + i * 7, a = t * 360 * (i % 2 ? -1 : 1) + i * 40;
    swirl += `<ellipse cx="64" cy="74" rx="${r}" ry="${r * 1.25}" fill="none" stroke="${H[ORDER[i]]}" stroke-width="4" stroke-dasharray="${r * 2} ${r * 1.5}" transform="rotate(${a} 64 74)" opacity=".9"/>`; }
  return `<path d="M18 124V60A46 46 0 0 1 110 60V124Z" fill="#5a4a6a" ${ol()}/><path d="M28 124V62A36 36 0 0 1 100 62V124Z" fill="#160c2c"/>
  <clipPath id="pt"><path d="M28 124V62A36 36 0 0 1 100 62V124Z"/></clipPath><g clip-path="url(#pt)">${swirl}<circle cx="64" cy="76" r="${6 + 3 * Math.sin(t * 6.28)}" fill="#fff"/></g>
  <path d="M28 124V62A36 36 0 0 1 100 62V124" fill="none" ${ol({ strokeWidth: 4 })}/>
  <path d="M56 14H72L64 26Z" fill="${HONEY}" ${ol({ strokeWidth: 3 })}/>${num(64, 54, "4", 22, HONEY, 4)}`;
}
// cg_merchant: the greedy merchant (hooded, gold eyes, crescent ring) flips a coin.
function cgMerchant(t) {
  const h = Math.sin(t * Math.PI) * 30, sx = Math.cos(t * Math.PI * 4);
  return `<path d="M64 14C32 14 18 44 18 78C18 98 22 112 26 122H102C106 112 110 98 110 78C110 44 96 14 64 14Z" fill="#3f4a3a" ${ol()}/>
  <path d="M64 30C42 30 32 52 32 74C32 92 38 106 42 114H86C90 106 96 92 96 74C96 52 86 30 64 30Z" fill="#141a12"/>
  <path d="M44 70Q52 64 60 70M68 70Q76 64 84 70" stroke="${HONEY}" stroke-width="5" fill="none" stroke-linecap="round"/>
  <path d="M46 88Q64 100 82 86" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M80 82L84 88" stroke="#fff" stroke-width="3"/>
  <path d="M20 112Q28 100 40 108" fill="none" ${ol({ strokeWidth: 6 })}/><circle cx="30" cy="106" r="6" fill="none" stroke="${HONEY}" stroke-width="3"/><path d="M27 101A6 6 0 0 0 33 111A4.5 4.5 0 0 1 27 101Z" fill="${HONEY}"/>
  <ellipse cx="30" cy="${84 - h}" rx="${11 * Math.abs(sx) + 1}" ry="11" fill="${HONEY}" ${ol({ strokeWidth: 3 })}/>
  ${gloss(46, 30, 10, 4, -35, 0.25)}`;
}
// house_cup: the gold cup with five House gems and a shine sweep.
function houseCup(t) {
  const sw = -40 + 200 * ((t * 1.2) % 1);
  const gems = ORDER.map((h, i) => `<circle cx="${40 + i * 12}" cy="58" r="5" fill="${H[h]}" ${ol({ strokeWidth: 2.5 })}/>`).join("");
  return `<path d="M30 34C10 34 10 66 34 70M98 34C118 34 118 66 94 70" stroke="${O}" stroke-width="12" fill="none"/><path d="M30 34C10 34 10 66 34 70M98 34C118 34 118 66 94 70" stroke="${G}" stroke-width="6" fill="none"/>
  <path d="M26 22H102V44C102 70 86 86 64 86C42 86 26 70 26 44Z" fill="${G}" ${ol()}/>
  <clipPath id="cp"><path d="M26 22H102V44C102 70 86 86 64 86C42 86 26 70 26 44Z"/></clipPath>
  <g clip-path="url(#cp)"><path d="M${sw} 0L${sw + 16} 0L${sw - 24} 128L${sw - 40} 128Z" fill="#fff" opacity=".6"/></g>${gems}
  <rect x="56" y="86" width="16" height="14" fill="${GD}" ${ol({ strokeWidth: 4 })}/><path d="M36 122H92L86 100H42Z" fill="${G}" ${ol()}/>
  <rect x="22" y="16" width="84" height="10" rx="4" fill="${GL}" ${ol({ strokeWidth: 4 })}/>${sp(108, 14, 4 + 4 * pulse(t, 0, 0.5), "#fff")}${sp(18, 90, 3 + 4 * pulse(t, 0.5, 1), GL)}`;
}
// table_code: a table-code ticket whose four glyphs flip.
function tableCode(t) {
  const GLY = "A7K2Q9M4X3";
  const boxes = [0, 1, 2, 3].map((i) => { const k = Math.floor(t * 8 + i * 3) % GLY.length, flip = Math.abs(Math.cos((t * 8 + i * 3) % 1 * Math.PI));
    return `<rect x="${20 + i * 23}" y="46" width="19" height="34" rx="4" fill="#FFF6D8" ${ol({ strokeWidth: 3 })}/>
    <g transform="translate(${29.5 + i * 23} 63) scale(1 ${flip}) translate(${-29.5 - i * 23} -63)">${num(29.5 + i * 23, 72, GLY[k], 22, H[ORDER[(i + k) % 5]], 3)}</g>`; }).join("");
  return `<path d="M10 30H118V54A10 10 0 0 0 118 74V98H10V74A10 10 0 0 0 10 54Z" fill="#3a2258" ${ol()}/>
  <path d="M10 30H118V40H10Z" fill="${HONEY}" ${ol({ strokeWidth: 3 })}/>${boxes}
  <path d="M20 90H108" stroke="${GL}" stroke-width="2" stroke-dasharray="4 4"/>${gloss(26, 36, 8, 2.5, 0, 0.5)}`;
}
// great_work: a shared jar fills with five House colours, layer by layer.
function greatWork(t) {
  const fill = ease(Math.min(1, t / 0.8));
  const layers = ORDER.map((h, i) => { const top = 118 - (i + 1) * 15 * fill; return `<rect x="0" y="${top}" width="128" height="${15 * fill + 1}" fill="${H[h]}"/>`; }).join("");
  const glow = t > 0.8 ? `<circle cx="64" cy="70" r="${40 + 20 * pulse(t, 0.8, 1)}" fill="${GL}" opacity="${0.35 * pulse(t, 0.8, 1)}"/>` : "";
  return `${glow}<path d="M40 14H88V28C104 34 112 48 112 66V108C112 116 106 122 98 122H30C22 122 16 116 16 108V66C16 48 24 34 40 28Z" fill="#e8e4f8" opacity=".55"/>
  <clipPath id="gw"><path d="M40 14H88V28C104 34 112 48 112 66V108C112 116 106 122 98 122H30C22 122 16 116 16 108V66C16 48 24 34 40 28Z"/></clipPath>
  <g clip-path="url(#gw)">${layers}</g>
  <path d="M40 14H88V28C104 34 112 48 112 66V108C112 116 106 122 98 122H30C22 122 16 116 16 108V66C16 48 24 34 40 28Z" fill="none" ${ol()}/>
  <rect x="34" y="6" width="60" height="12" rx="4" fill="${HONEY}" ${ol({ strokeWidth: 4 })}/>${gloss(30, 70, 5, 18, 8, 0.5)}${sp(102, 30, 3 + 5 * fill, "#fff")}`;
}
// stray_token: a stray token arcs home through a small door.
function strayToken(t) {
  const p = ease(t / 0.75), x = 18 + 80 * p, y = 92 - 70 * Math.sin(p * Math.PI) + 4 * p;
  const trail = [0.08, 0.16, 0.24].map((d, i) => { const q = ease(Math.max(0, t - d) / 0.75), tx = 18 + 80 * q, ty = 92 - 70 * Math.sin(q * Math.PI) + 4 * q; return `<circle cx="${tx}" cy="${ty}" r="${7 - i * 2}" fill="${GL}" opacity="${0.6 - i * 0.18}"/>`; }).join("");
  const shown = t < 0.78;
  const flash = t >= 0.75 ? `<circle cx="100" cy="98" r="${10 + 24 * ease((t - 0.75) / 0.25)}" fill="none" stroke="${GL}" stroke-width="${5 * (1 - ease((t - 0.75) / 0.25))}"/>` : "";
  return `<path d="M82 122V90A18 18 0 0 1 118 90V122Z" fill="#5a3a8a" ${ol()}/><path d="M89 122V92A11 11 0 0 1 111 92V122Z" fill="${GL}"/>${flash}
  ${shown ? trail + `<circle cx="${x}" cy="${y}" r="12" fill="${HONEY}" ${ol({ strokeWidth: 3.5 })}/><circle cx="${x}" cy="${y}" r="5" fill="${H[ORDER[Math.floor(t * 10) % 5]]}" ${ol({ strokeWidth: 2 })}/>${gloss(x - 4, y - 5, 4, 2, -35, 0.6)}` : ""}`;
}

// ---------- Conch of Dignity (neutral gold) ----------
function conchShell(extra = "") {
  // spire with stacked whorls at the upper left, knobbed shoulder, flared pink lip at the lower right
  const knobs = [[52, 30], [66, 26], [80, 28], [92, 34]].map(([x, y]) => `<path d="M${x - 6} ${y + 4}L${x} ${y - 8}L${x + 6} ${y + 4}Z" fill="${GL}" ${ol({ strokeWidth: 3 })}/>`).join("");
  return `${knobs}<path d="M30 46C44 30 78 24 100 36C116 46 118 66 110 82C102 98 84 108 64 114L20 120L28 96C18 80 18 60 30 46Z" fill="${GL}" ${ol()}/>
  <path d="M8 34L30 46L22 58Z" fill="${G}" ${ol({ strokeWidth: 4 })}/><path d="M14 30L36 38L32 50Z" fill="${GL}" ${ol({ strokeWidth: 3.5 })}/>
  <path d="M38 52C58 44 86 44 100 56M30 70C52 62 86 64 104 74" stroke="${GD}" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M64 114C80 100 98 92 110 82C112 98 100 116 80 120Z" fill="#FFB8A8" ${ol({ strokeWidth: 3.5 })}/><path d="M74 112C86 104 98 98 106 90" stroke="#E07A6A" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${gloss(48, 58, 14, 5, -15, 0.55)}${extra}`;
}
function conch() { return conchShell(`${sp(108, 22, 7, "#fff")}${sp(18, 104, 5, HONEY)}`); }
function conchHeld() {
  return `<path d="M10 104Q64 80 118 104L112 122H16Z" fill="#B0283C" ${ol()}/><path d="M16 106Q64 88 112 106" stroke="#E04A5E" stroke-width="3" fill="none"/>
  <circle cx="14" cy="112" r="5" fill="${HONEY}" ${ol({ strokeWidth: 2 })}/><circle cx="114" cy="112" r="5" fill="${HONEY}" ${ol({ strokeWidth: 2 })}/>
  <g transform="translate(64 66) scale(.72) rotate(-8) translate(-64 -66)">${conchShell()}</g>
  <path d="M46 24L52 8L64 18L76 8L82 24Z" fill="${HONEY}" ${ol({ strokeWidth: 3.5 })}/><circle cx="64" cy="18" r="3" fill="#FF4FB3"/>${sp(108, 30, 6, "#fff")}`;
}
function conchBlast(t) {
  const rings = [0, 0.33, 0.66].map((d) => { const q = (t + d) % 1; return `<path d="M${84 + 10 * q} ${30 - 4 * q}A${20 + 36 * q} ${20 + 36 * q} 0 0 1 ${84 + 10 * q} ${70 + 40 * q}" transform="translate(${20 * q} ${-14 * q})" stroke="${GL}" stroke-width="${7 * (1 - q)}" fill="none" stroke-linecap="round" opacity="${1 - q}"/>`; }).join("");
  const k = 1 + 0.04 * Math.sin(t * Math.PI * 6);
  return `${rings}<g transform="translate(46 70) scale(${0.78 * k}) rotate(-25) translate(-64 -66)">${conchShell()}</g>${sp(20, 24, 4 + 4 * pulse(t, 0, 0.5), "#fff")}`;
}

// name -> { fn, anim, still? }
export const STEP2 = {
  ...Object.fromEntries([1, 2, 3, 4, 5, 6].map((n) => [`lv${n}`, { fn: () => medal(n) }])),
  lv_half: { fn: lvHalf },
  level_up: { fn: levelUp, anim: true }, path_sealed: { fn: pathSealed, anim: true },
  ...Object.fromEntries(CLASSES.map(([id, a, b, c]) => [`cl_${id}`, { fn: () => classCrest(a, b, c) }])),
  cg_coin: { fn: cgCoin },
  cg_portal: { fn: cgPortal, anim: true }, cg_merchant: { fn: cgMerchant, anim: true }, house_cup: { fn: houseCup, anim: true },
  table_code: { fn: tableCode, anim: true }, great_work: { fn: greatWork, anim: true }, stray_token: { fn: strayToken, anim: true },
  conch: { fn: conch }, conch_held: { fn: conchHeld }, conch_blast: { fn: conchBlast, anim: true },
};
