// House kit emoji, v4 style: thick dark outline, glossy flat fills, transparent background.
// Each entry: name -> (t) => inner SVG for a 128x128 viewBox. t in [0,1) for animated ones.
const O = "#120a24";          // outline
const SW = 5;                 // outline width
const G = "#E2B04A", GL = "#FADE8C", GD = "#B8893A"; // gold
const s = (o = {}) => Object.entries(o).map(([k, v]) => `${k.replace(/[A-Z]/g, (m) => "-" + m.toLowerCase())}="${v}"`).join(" ");
const ol = (extra = {}) => s({ stroke: O, strokeWidth: SW, strokeLinejoin: "round", strokeLinecap: "round", ...extra });
const gloss = (cx, cy, rx, ry, rot = -25, op = 0.45) => `<ellipse cx="${cx}" cy="${cy}" rx="${rx}" ry="${ry}" fill="#fff" opacity="${op}" transform="rotate(${rot} ${cx} ${cy})"/>`;
const sp = (x, y, r, c = "#fff", op = 1) => `<path d="M${x} ${y - r}Q${x} ${y} ${x + r} ${y}Q${x} ${y} ${x} ${y + r}Q${x} ${y} ${x - r} ${y}Q${x} ${y} ${x} ${y - r}Z" fill="${c}" opacity="${op}"/>`;
const ease = (x) => 0.5 - 0.5 * Math.cos(Math.PI * Math.max(0, Math.min(1, x)));
const pulse = (t, a, b) => (t < a || t > b ? 0 : Math.sin(Math.PI * (t - a) / (b - a)));

// ---------- host heads (shared hood + face) ----------
function hood({ hood, trim, inner = "#1a1030", face = "#F3E3C3", eyes, extra = "", top = "", under = "" }) {
  return `${under}
  <path d="M64 8C30 8 14 40 14 74C14 96 18 112 22 120H106C110 112 114 96 114 74C114 40 98 8 64 8Z" fill="${hood}" ${ol()}/>
  <path d="M64 24C40 24 30 48 30 70C30 90 36 104 40 112H88C92 104 98 90 98 70C98 48 88 24 64 24Z" fill="${inner}"/>
  <ellipse cx="64" cy="74" rx="25" ry="29" fill="${face}" ${ol({ strokeWidth: 3 })}/>
  <path d="M22 120H106" ${ol()} fill="none"/>
  <path d="M30 112Q64 124 98 112" stroke="${trim}" stroke-width="5" fill="none" stroke-linecap="round"/>
  ${eyes}${extra}
  ${gloss(40, 30, 12, 5, -40, 0.3)}${top}`;
}
const eyeOpen = (x, y, iris = "#2a1a40") => `<ellipse cx="${x}" cy="${y}" rx="5" ry="6" fill="${iris}"/><circle cx="${x + 1.6}" cy="${y - 2}" r="1.8" fill="#fff"/>`;
const eyeShut = (x, y) => `<path d="M${x - 6} ${y}Q${x} ${y + 5} ${x + 6} ${y}" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
const smile = `<path d="M55 90Q64 97 73 90" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`;
const cheeks = (c = "#FF8FB8") => `<ellipse cx="47" cy="86" rx="5" ry="3" fill="${c}" opacity=".55"/><ellipse cx="81" cy="86" rx="5" ry="3" fill="${c}" opacity=".55"/>`;

// ---------- ORACLE ----------
function orCrest() {
  const rows = [34, 52, 70, 88];
  const clip = `<clipPath id="pc"><path d="M64 12L116 112H12Z"/></clipPath>`;
  let bricks = rows.map((y) => `<path d="M0 ${y}H128" stroke="${GD}" stroke-width="3"/>`).join("");
  const vs = [[52, [64]], [70, [50, 78]], [88, [40, 64, 88]], [106, [28, 52, 76, 100]], [34, []]];
  vs.forEach(([y, xs]) => xs.forEach((x) => (bricks += `<path d="M${x} ${y - 18}V${y}" stroke="${GD}" stroke-width="3"/>`)));
  return `<defs>${clip}</defs>
  <path d="M64 12L116 112H12Z" fill="${G}"/>
  <g clip-path="url(#pc)">${bricks}<path d="M64 12L116 112H64Z" fill="#000" opacity=".12"/></g>
  <path d="M64 12L116 112H12Z" fill="none" ${ol()}/>
  <path d="M38 80Q64 58 90 80Q64 102 38 80Z" fill="#fff" ${ol({ strokeWidth: 4 })}/>
  <circle cx="64" cy="80" r="10" fill="#FF4FB3" ${ol({ strokeWidth: 3 })}/><circle cx="64" cy="80" r="4.5" fill="${O}"/><circle cx="67" cy="77" r="2" fill="#fff"/>
  ${gloss(54, 40, 5, 12, 25, 0.45)}${sp(104, 24, 7, "#FF4FB3")}${sp(22, 34, 5, GL)}`;
}
function orHost(t) {
  const shut = pulse(t, 0.42, 0.56) > 0.35;
  const eyes = shut ? eyeShut(54, 76) + eyeShut(74, 76) : eyeOpen(54, 76, "#5a2a7a") + eyeOpen(74, 76, "#5a2a7a");
  const gem = 0.6 + 0.4 * Math.sin(t * Math.PI * 2);
  return hood({ hood: "#2E1E68", trim: G, face: "#F3E3C3", eyes: eyes + smile + cheeks(),
    extra: `<path d="M40 56Q64 44 88 56" stroke="${G}" stroke-width="5" fill="none" stroke-linecap="round"/>
    <path d="M64 44L71 53L64 62L57 53Z" fill="#FF4FB3" ${ol({ strokeWidth: 3 })}/><circle cx="64" cy="53" r="${10 * gem}" fill="#FF4FB3" opacity=".25"/>
    ${sp(24, 22, 5 * gem + 2, GL)}${sp(108, 34, 4 * (1 - gem) + 2, "#66E0C8")}` });
}
function orMoon() {
  return `<path d="M78 14A52 52 0 1 0 114 84A42 42 0 1 1 78 14Z" fill="${GL}" ${ol()}/>
  <path d="M78 14A52 52 0 1 0 114 84A42 42 0 0 1 60 112A50 50 0 0 0 78 14Z" fill="${G}" opacity=".7"/>
  <circle cx="44" cy="52" r="6" fill="${G}" opacity=".7"/><circle cx="40" cy="80" r="4" fill="${G}" opacity=".7"/>
  ${gloss(40, 36, 6, 14, 30, 0.55)}${sp(98, 36, 8, "#FF4FB3")}${sp(108, 58, 5, "#fff")}`;
}
function orOrb() {
  return `<path d="M34 104H94L102 120H26Z" fill="${G}" ${ol()}/><path d="M44 96H84L90 106H38Z" fill="${GD}" ${ol({ strokeWidth: 4 })}/>
  <circle cx="64" cy="56" r="44" fill="#2E1E68" ${ol()}/>
  <circle cx="64" cy="56" r="40" fill="#5a3ab0" opacity=".6"/>
  <path d="M30 62Q48 34 72 52T100 46" stroke="#FF4FB3" stroke-width="6" fill="none" stroke-linecap="round" opacity=".9"/>
  <path d="M34 74Q60 58 80 72T98 66" stroke="#66E0C8" stroke-width="5" fill="none" stroke-linecap="round" opacity=".85"/>
  ${sp(60, 56, 9, "#fff")}${gloss(44, 32, 14, 7, -35, 0.55)}`;
}
function orCheer(t) {
  const open = ease(t < 0.5 ? t / 0.3 : (1 - t) / 0.2 > 1 ? 1 : (1 - t) / 0.2); // open, hold, close at end
  const h = 2 + 22 * open, rays = 0.5 + 0.5 * open;
  let r = "";
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + t * 0.6, r1 = 46, r2 = 46 + 12 * rays;
    r += `<path d="M${64 + r1 * Math.cos(a)} ${64 + r1 * Math.sin(a)}L${64 + r2 * Math.cos(a)} ${64 + r2 * Math.sin(a)}" stroke="${i % 2 ? "#FF4FB3" : G}" stroke-width="6" stroke-linecap="round" opacity="${rays}"/>`;
  }
  return `${r}<circle cx="64" cy="64" r="42" fill="#2E1E68" ${ol()}/>
  <path d="M26 64Q64 ${64 - h * 1.5} 102 64Q64 ${64 + h * 1.5} 26 64Z" fill="#fff" ${ol({ strokeWidth: 4 })}/>
  ${open > 0.25 ? `<circle cx="64" cy="64" r="${6 + 10 * open}" fill="#FF4FB3" ${ol({ strokeWidth: 3 })}/><circle cx="64" cy="64" r="${3 + 4 * open}" fill="${O}"/><circle cx="${68 + 2 * open}" cy="${60 - 2 * open}" r="${1 + 2 * open}" fill="#fff"/>` : ""}
  ${gloss(46, 36, 10, 5, -35, 0.35)}`;
}

// ---------- ALCHEMIST ----------
const CU = "#E89A55", BR = "#C88A3A", TEAL = "#66E0C8";
function gear(cx, cy, r, teeth, fill) {
  let d = "";
  for (let i = 0; i < teeth * 2; i++) {
    const a = (i / (teeth * 2)) * Math.PI * 2, rr = i % 2 ? r : r * 1.28;
    const a2 = ((i + 1) / (teeth * 2)) * Math.PI * 2;
    d += `${i ? "L" : "M"}${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}L${cx + rr * Math.cos(a2)} ${cy + rr * Math.sin(a2)}`;
  }
  return `<path d="${d}Z" fill="${fill}" ${ol({ strokeWidth: 4 })}/><circle cx="${cx}" cy="${cy}" r="${r * 0.42}" fill="${O}"/>`;
}
function alCrest() {
  let rivets = "";
  for (let i = 0; i < 8; i++) { const a = (i / 8) * Math.PI * 2; rivets += `<circle cx="${64 + 40 * Math.cos(a)}" cy="${76 + 40 * Math.sin(a)}" r="3.4" fill="${GL}" ${ol({ strokeWidth: 2 })}/>`; }
  return `${gear(64, 22, 13, 8, BR)}
  <circle cx="64" cy="76" r="47" fill="${CU}" ${ol()}/><circle cx="64" cy="76" r="34" fill="#1f8f84" ${ol({ strokeWidth: 4 })}/>
  <circle cx="64" cy="76" r="30" fill="${TEAL}"/><circle cx="70" cy="84" r="22" fill="#1f8f84" opacity=".35"/>
  ${rivets}${gloss(52, 64, 12, 7, -35, 0.6)}${gloss(40, 48, 10, 4, -45, 0.35)}`;
}
function alHost(t) {
  const sweep = -20 + 70 * ((t * 1.25) % 1);
  const goggle = (x) => `<circle cx="${x}" cy="72" r="11" fill="${TEAL}" ${ol({ strokeWidth: 4 })}/><circle cx="${x}" cy="72" r="11" fill="none" stroke="${BR}" stroke-width="3"/>`;
  return hood({ hood: "#5a2e14", trim: CU, inner: "#26130A", face: "#F0CFA8",
    eyes: `<path d="M36 70H92" stroke="#3a2010" stroke-width="5"/>${goggle(52)}${goggle(76)}
    <clipPath id="gl"><circle cx="52" cy="72" r="10"/><circle cx="76" cy="72" r="10"/></clipPath>
    <g clip-path="url(#gl)"><path d="M${30 + sweep} 100L${46 + sweep} 50L${54 + sweep} 50L${38 + sweep} 100Z" fill="#fff" opacity=".85"/></g>
    <circle cx="52" cy="74" r="3.5" fill="${O}"/><circle cx="76" cy="74" r="3.5" fill="${O}"/>
    <path d="M54 92Q64 99 74 92" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>${cheeks("#E8906A")}`,
    extra: `<path d="M44 46Q64 38 84 46" stroke="${CU}" stroke-width="4" fill="none" stroke-linecap="round"/>` });
}
function alStone() {
  return `<path d="M22 86L30 46L60 24L96 32L112 64L100 100L58 110L28 104Z" fill="#7a6a5c" ${ol()}/>
  <path d="M30 46L60 56L96 32M60 56L58 110M60 56L112 64" stroke="#5a4c40" stroke-width="3" fill="none"/>
  <path d="M60 56L96 32L112 64Z" fill="#9a8a78"/><path d="M22 86L30 46L60 56L58 110L28 104Z" fill="#665848"/>
  <path d="M66 70L80 62L90 74L78 88L66 82Z" fill="#E8483B" ${ol({ strokeWidth: 3 })}/><path d="M70 70L80 64L84 70Z" fill="#FF9A8A"/>
  ${sp(98, 22, 7, "#FF6A50")}${gloss(54, 40, 10, 4, -30, 0.35)}`;
}
function flask(liquid, extra = "") {
  return `<path d="M52 12H76V40C98 48 110 64 110 82C110 104 90 120 64 120C38 120 18 104 18 82C18 64 30 48 52 40Z" fill="#dff6f2" opacity=".55"/>
  <clipPath id="fl"><path d="M52 12H76V40C98 48 110 64 110 82C110 104 90 120 64 120C38 120 18 104 18 82C18 64 30 48 52 40Z"/></clipPath>
  <g clip-path="url(#fl)"><rect x="0" y="${liquid}" width="128" height="128" fill="${TEAL}"/><rect x="0" y="${liquid}" width="128" height="6" fill="#a8fff0"/>${extra}</g>
  <path d="M52 12H76V40C98 48 110 64 110 82C110 104 90 120 64 120C38 120 18 104 18 82C18 64 30 48 52 40Z" fill="none" ${ol()}/>
  <rect x="46" y="6" width="36" height="10" rx="4" fill="${CU}" ${ol({ strokeWidth: 4 })}/>${gloss(38, 78, 6, 16, 20, 0.55)}`;
}
const bubbles = (t, n, y0) => Array.from({ length: n }, (_, i) => { const p = (t + i / n) % 1; return `<circle cx="${40 + ((i * 37) % 48)}" cy="${y0 + 40 - p * 40}" r="${3 + (i % 3)}" fill="#fff" opacity="${0.8 * (1 - p)}"/>`; }).join("");
function alFlask() { return flask(66, bubbles(0.3, 6, 74)); }
function alCheer(t) {
  const g = 0.75 + 0.25 * Math.sin(t * Math.PI * 2);
  const blobs = [[64, 8, 13], [50, 12, 10], [78, 12, 10], [58, -2, 9], [72, -2, 9], [40, 20, 7], [88, 20, 7]];
  let foam = blobs.map(([x, y, r], i) => `<circle cx="${x + Math.sin(t * 6.28 + i) * 2}" cy="${y + 4 - 6 * g}" r="${r * g}" fill="#c9fff6" ${ol({ strokeWidth: 3.5 })}/>`).join("");
  foam += blobs.map(([x, y, r], i) => `<circle cx="${x + Math.sin(t * 6.28 + i) * 2}" cy="${y + 4 - 6 * g}" r="${r * g - 2.5}" fill="#c9fff6"/>`).join("");
  const pops = Array.from({ length: 5 }, (_, i) => { const p = (t * 2 + i / 5) % 1; const a = -Math.PI / 2 + (i - 2) * 0.55; return `<circle cx="${64 + Math.cos(a) * (18 + 30 * p)}" cy="${4 + Math.sin(a) * (14 + 26 * p)}" r="${3.5 * (1 - p) + 1}" fill="#a8fff0" ${ol({ strokeWidth: 2 })} opacity="${1 - p}"/>`; }).join("");
  const drip = (x, ph) => { const p = (t + ph) % 1; return `<path d="M${x} 14Q${x - 5} ${20 + p * 34} ${x} ${26 + p * 34}Q${x + 5} ${20 + p * 34} ${x} 14Z" fill="#c9fff6" ${ol({ strokeWidth: 2.5 })}/>`; };
  return flask(54 + 4 * Math.sin(t * Math.PI * 4), bubbles(t, 8, 66)) + drip(46, 0) + drip(82, 0.5) + foam + pops + sp(112, 40, 6 * g, GL);
}

// ---------- OBSERVATORY ----------
const PB = "#8FB8FF", SS = "#DCE6FF", DS = "#0B1530", CN = "#2A3F6E";
const star8 = (cx, cy, r, fill) => {
  let d = "";
  for (let i = 0; i < 16; i++) { const a = (i / 16) * Math.PI * 2 - Math.PI / 2, rr = i % 2 ? r * 0.32 : i % 4 ? r * 0.62 : r; d += `${i ? "L" : "M"}${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`; }
  return `<path d="${d}Z" fill="${fill}" ${ol({ strokeWidth: 3.5 })}/>`;
};
function obCrest() {
  return `<ellipse cx="64" cy="64" rx="58" ry="18" fill="none" stroke="${O}" stroke-width="9" transform="rotate(-18 64 64)"/>
  <ellipse cx="64" cy="64" rx="58" ry="18" fill="none" stroke="${PB}" stroke-width="4" transform="rotate(-18 64 64)"/>
  <circle cx="64" cy="64" r="42" fill="${DS}" ${ol()}/><circle cx="64" cy="64" r="42" fill="none" stroke="${G}" stroke-width="9"/>
  <circle cx="64" cy="64" r="46.5" fill="none" stroke="${O}" stroke-width="3"/><circle cx="64" cy="64" r="37" fill="none" stroke="${O}" stroke-width="2.5"/>
  ${star8(64, 64, 30, SS)}<path d="M64 34V94M34 64H94" stroke="${PB}" stroke-width="1.5" opacity=".7"/>
  <path d="M112 46A58 18 -18 0 1 120 52" stroke="${PB}" stroke-width="4" fill="none"/>
  <circle cx="113" cy="44" r="6" fill="${G}" ${ol({ strokeWidth: 3 })}/>${gloss(44, 42, 10, 5, -40, 0.4)}`;
}
function obHost(t) {
  const z = 1 + 0.18 * Math.sin(t * Math.PI * 2), rot = t * 360;
  let ticks = "";
  for (let i = 0; i < 8; i++) { const a = ((i / 8) * 360 + rot) * Math.PI / 180; ticks += `<path d="M${76 + 12 * z * Math.cos(a)} ${74 + 12 * z * Math.sin(a)}L${76 + 15 * z * Math.cos(a)} ${74 + 15 * z * Math.sin(a)}" stroke="${O}" stroke-width="2"/>`; }
  const stars = [[30, 40], [96, 30], [100, 92], [26, 96], [50, 18]].map(([x, y], i) => `<circle cx="${x}" cy="${y}" r="${1.6 + (i % 2)}" fill="${SS}" opacity="${0.5 + 0.5 * Math.sin(t * 6.28 + i)}"/>`).join("");
  return hood({ hood: "#16244a", trim: PB, inner: DS, face: "#E9D3B8",
    eyes: `${eyeOpen(52, 76, "#2a3f6e")}<circle cx="76" cy="74" r="${15 * z}" fill="${G}" ${ol({ strokeWidth: 4 })}/>${ticks}<circle cx="76" cy="74" r="${9 * z}" fill="${PB}" ${ol({ strokeWidth: 3 })}/>
    <path d="M${76 - 6 * z} 74H${76 + 6 * z}M76 ${74 - 6 * z}V${74 + 6 * z}" stroke="${O}" stroke-width="1.5"/>${gloss(72, 70, 3, 1.6, -35, 0.8)}
    <path d="M56 93Q63 97 70 93" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>`,
    extra: stars + `<path d="M40 46L44 50M86 42L82 47" stroke="${SS}" stroke-width="2"/>` });
}
function obShard() {
  return `<path d="M20 108L60 64" stroke="${PB}" stroke-width="10" stroke-linecap="round" opacity=".35"/><path d="M30 112L64 76M14 94L52 60" stroke="${SS}" stroke-width="5" stroke-linecap="round" opacity=".5"/>
  <path d="M56 70L74 22L110 14L104 52L72 84Z" fill="${PB}" ${ol()}/><path d="M74 22L84 50L110 14M84 50L72 84M84 50L104 52" stroke="#5a7ac8" stroke-width="3" fill="none"/>
  <path d="M74 22L84 50L56 70Z" fill="${SS}"/>${sp(96, 30, 7, "#fff")}${sp(30, 30, 5, G)}`;
}
function obAstrolabe() {
  let ticks = "";
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2; ticks += `<path d="M${64 + 36 * Math.cos(a)} ${70 + 36 * Math.sin(a)}L${64 + (i % 2 ? 40 : 42) * Math.cos(a)} ${70 + (i % 2 ? 40 : 42) * Math.sin(a)}" stroke="${O}" stroke-width="2"/>`; }
  return `<circle cx="64" cy="16" r="9" fill="none" ${ol({ strokeWidth: 9 })}/><circle cx="64" cy="16" r="9" fill="none" stroke="${G}" stroke-width="4"/>
  <circle cx="64" cy="70" r="48" fill="${G}" ${ol()}/><circle cx="64" cy="70" r="34" fill="${CN}" ${ol({ strokeWidth: 3 })}/>${ticks}
  <circle cx="64" cy="80" r="22" fill="none" stroke="${GL}" stroke-width="4"/><path d="M64 70L92 52M64 70L44 50M64 70L50 96" stroke="${GL}" stroke-width="4" stroke-linecap="round"/>
  <path d="M22 70H106" stroke="${GD}" stroke-width="5" stroke-linecap="round" transform="rotate(-30 64 70)"/><circle cx="64" cy="70" r="5" fill="${O}"/>
  ${sp(92, 52, 4, "#fff")}${gloss(40, 42, 10, 5, -40, 0.45)}`;
}
function obCheer(t) {
  const p = (t * 1.0) % 1, mx = -10 + p * 150, my = 20 + p * 50, op = Math.sin(Math.PI * p);
  const stars = [[36, 52, 2.5], [56, 34, 2], [86, 40, 3], [100, 64, 2], [30, 78, 2], [70, 60, 1.8], [52, 70, 1.6]].map(([x, y, r], i) => `<circle cx="${x}" cy="${y}" r="${r}" fill="${SS}" opacity="${0.55 + 0.45 * Math.sin(t * 12.56 + i * 1.7)}"/>`).join("");
  return `<clipPath id="dm"><path d="M12 100V70A52 52 0 0 1 116 70V100Z"/></clipPath>
  <path d="M12 100V70A52 52 0 0 1 116 70V100Z" fill="${DS}"/>
  <g clip-path="url(#dm)">${stars}
   <path d="M${mx - 56} ${my - 22}L${mx} ${my}" stroke="${PB}" stroke-width="9" stroke-linecap="round" opacity="${0.45 * op}"/>
   <path d="M${mx - 34} ${my - 13}L${mx} ${my}" stroke="#fff" stroke-width="6" stroke-linecap="round" opacity="${op}"/>
   <circle cx="${mx}" cy="${my}" r="7" fill="#fff" opacity="${op}"/>${sp(mx, my, 13 * op, "#fff", op)}
   </g>
  <path d="M12 100V70A52 52 0 0 1 116 70V100Z" fill="none" ${ol()}/>
  <rect x="6" y="98" width="116" height="20" rx="5" fill="${G}" ${ol()}/><rect x="16" y="104" width="10" height="8" rx="2" fill="${GD}"/><rect x="102" y="104" width="10" height="8" rx="2" fill="${GD}"/>
  ${gloss(34, 52, 10, 4, -50, 0.3)}`;
}

// ---------- PARLOUR ----------
const LIL = "#C3A6FF", PL = "#2A0F24", CG = "#FFE3A3", RO = "#E7A0B4", SM = "#8A7F99";
const flame = (x, y, k = 1, w = 0) => `<path d="M${x} ${y}C${x - 9 * k} ${y - 10 * k} ${x - 4 * k + w} ${y - 22 * k} ${x + w} ${y - 30 * k}C${x + 6 * k + w} ${y - 20 * k} ${x + 9 * k} ${y - 10 * k} ${x} ${y}Z" fill="${CG}" ${ol({ strokeWidth: 3 })}/><path d="M${x} ${y - 3}C${x - 4 * k} ${y - 8 * k} ${x - 1} ${y - 14 * k} ${x + w * 0.5} ${y - 18 * k}C${x + 3 * k} ${y - 12 * k} ${x + 4 * k} ${y - 8 * k} ${x} ${y - 3}Z" fill="#FF9A3C"/>`;
function paCrest() {
  return `<path d="M64 8A30 30 0 0 1 82 62L96 120H32L46 62A30 30 0 0 1 64 8Z" fill="${PL}" ${ol()}/>
  <path d="M64 8A30 30 0 0 1 82 62L96 120H32L46 62A30 30 0 0 1 64 8Z" fill="none" stroke="${LIL}" stroke-width="3" transform="translate(64 64) scale(.9) translate(-64 -64)"/>
  <circle cx="64" cy="40" r="20" fill="${CG}" opacity=".25"/>
  <rect x="55" y="54" width="18" height="52" rx="4" fill="#F3E3C3" ${ol({ strokeWidth: 3.5 })}/><path d="M58 58Q60 66 58 72" stroke="#fff" stroke-width="3" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M64 54V48" stroke="${O}" stroke-width="2.5"/>${flame(64, 50, 0.9)}
  ${sp(22, 30, 6, LIL)}${sp(108, 40, 5, RO)}${gloss(50, 24, 6, 3, -40, 0.35)}`;
}
function paHost(t) {
  const lift = ease(t < 0.5 ? t / 0.35 : (1 - t) / 0.35); // veil lifts then falls
  const vy = -40 * lift;
  const lace = Array.from({ length: 7 }, (_, i) => `<circle cx="${42 + i * 7.3}" cy="${96 + vy}" r="3" fill="none" stroke="${LIL}" stroke-width="1.5"/>`).join("");
  return hood({ hood: "#4a1a40", trim: LIL, inner: PL, face: "#EBD6D0",
    eyes: `<path d="M48 74Q54 70 60 74M68 74Q74 70 80 74" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>${lift > 0.5 ? eyeOpen(54, 77, "#3a1a3a") + eyeOpen(74, 77, "#3a1a3a") : eyeShut(54, 77) + eyeShut(74, 77)}
    <path d="M57 92Q64 ${96 + 3 * lift} 71 92" stroke="#8a2a4a" stroke-width="3.5" fill="none" stroke-linecap="round"/>${cheeks(RO)}`,
    extra: `<path d="M38 ${52 + vy}Q64 ${44 + vy} 90 ${52 + vy}L88 ${96 + vy}Q64 ${102 + vy} 40 ${96 + vy}Z" fill="${LIL}" opacity=".42" stroke="${LIL}" stroke-width="2"/>${lace}
    <ellipse cx="64" cy="112" rx="8" ry="6" fill="${RO}" ${ol({ strokeWidth: 2.5 })}/>` });
}
function paKey() {
  return `<g transform="rotate(-35 64 64)">
  <circle cx="34" cy="64" r="20" fill="${G}" ${ol()}/><circle cx="34" cy="64" r="9" fill="${LIL}" ${ol({ strokeWidth: 3 })}/>
  <rect x="50" y="58" width="64" height="12" rx="4" fill="${G}" ${ol()}/>
  <path d="M94 70V86H104V70M108 70V80H114V70" fill="${G}" ${ol({ strokeWidth: 4 })}/>
  <rect x="58" y="54" width="6" height="20" rx="2" fill="${GD}" ${ol({ strokeWidth: 3 })}/>
  ${gloss(28, 54, 6, 3, 0, 0.6)}<rect x="66" y="60" width="40" height="3" fill="#fff" opacity=".5"/></g>${sp(102, 24, 7, LIL)}`;
}
function paPlanchette() {
  return `<ellipse cx="64" cy="112" rx="40" ry="7" fill="${O}" opacity=".25"/>
  <path d="M64 12C38 30 16 54 16 80C16 98 30 108 46 108H82C98 108 112 98 112 80C112 54 90 30 64 12Z" fill="#B07A4A" ${ol()}/>
  <path d="M64 22C42 38 26 58 26 80C26 92 34 98 46 98H82C94 98 102 92 102 80C102 58 86 38 64 22Z" fill="none" stroke="${G}" stroke-width="3"/>
  <circle cx="64" cy="66" r="16" fill="${LIL}" ${ol({ strokeWidth: 4 })}/><circle cx="64" cy="66" r="16" fill="#fff" opacity=".25"/>${gloss(58, 60, 5, 3, -35, 0.8)}
  <path d="M40 82Q44 86 48 82M80 82Q84 86 88 82" stroke="${G}" stroke-width="3" fill="none" stroke-linecap="round"/>
  ${gloss(44, 46, 10, 4, -50, 0.35)}${sp(104, 26, 6, LIL)}`;
}
function paCheer(t) {
  // flame: on, snuffs (0.30-0.40), smoke rises (0.38-0.75), relights with a pop (0.75-0.85)
  const k = t < 0.3 ? 1 : t < 0.4 ? 1 - (t - 0.3) / 0.1 : t < 0.75 ? 0 : t < 0.85 ? ((t - 0.75) / 0.1) * 1.25 : 1.25 - 0.25 * ((t - 0.85) / 0.15);
  const w = Math.sin(t * 25) * 2;
  const smoke = t > 0.36 && t < 0.82 ? (() => { const p = (t - 0.36) / 0.46; return `<path d="M64 46Q${56 + 6 * Math.sin(p * 9)} ${38 - 20 * p} 64 ${30 - 26 * p}T64 ${10 - 30 * p}" stroke="${SM}" stroke-width="${6 - 3 * p}" fill="none" stroke-linecap="round" opacity="${0.9 * (1 - p)}"/>`; })() : "";
  const pop = t > 0.75 && t < 0.95 ? (() => { const p = (t - 0.75) / 0.2; return [0, 1, 2, 3, 4, 5].map((i) => { const a = i / 6 * 6.28; return sp(64 + 26 * p * Math.cos(a), 34 + 26 * p * Math.sin(a), 5 * (1 - p) + 1, i % 2 ? LIL : CG, 1 - p); }).join(""); })() : "";
  return `<ellipse cx="64" cy="114" rx="34" ry="8" fill="${G}" ${ol()}/><path d="M40 112Q64 100 88 112" fill="${GD}"/>
  ${k > 0 ? `<circle cx="64" cy="36" r="${22 * k}" fill="${CG}" opacity=".25"/>` : ""}
  <rect x="50" y="50" width="28" height="60" rx="5" fill="#F3E3C3" ${ol()}/><path d="M56 56Q58 66 56 74" stroke="#fff" stroke-width="4" fill="none" stroke-linecap="round" opacity=".7"/>
  <path d="M70 50Q74 60 70 66" fill="#F3E3C3" stroke="${O}" stroke-width="2.5"/>
  <path d="M64 50V44" stroke="${O}" stroke-width="3"/>${k > 0.02 ? flame(64, 46, k, w) : ""}${smoke}${pop}`;
}

// ---------- SCRIPTORIUM ----------
const VI = "#E8483B", VL = "#F1E4C6", LP = "#3D6BE0", IG = "#4A3A2C";
const quill = (x1, y1, x2, y2) => `<g transform="translate(${x1} ${y1}) rotate(${Math.atan2(y2 - y1, x2 - x1) * 180 / Math.PI})"><path d="M0 0L${Math.hypot(x2 - x1, y2 - y1)} 0" stroke="${O}" stroke-width="7" stroke-linecap="round"/>
  <path d="M10 0C30 -16 70 -18 ${Math.hypot(x2 - x1, y2 - y1)} -4C70 4 30 8 10 0Z" fill="#FFFFFF" ${ol({ strokeWidth: 3.5 })}/><path d="M14 0L${Math.hypot(x2 - x1, y2 - y1) - 4} -3" stroke="#bbb" stroke-width="2"/>
  <path d="M0 0L${Math.hypot(x2 - x1, y2 - y1)} 0" stroke="${VL}" stroke-width="2.5" stroke-linecap="round"/></g>`;
const sealBlob = (cx, cy, r) => { let d = ""; for (let i = 0; i < 14; i++) { const a = (i / 14) * 6.28, rr = r * (i % 2 ? 0.9 : 1.04); d += `${i ? "L" : "M"}${cx + rr * Math.cos(a)} ${cy + rr * Math.sin(a)}`; } return d + "Z"; };
const sealS = (cx, cy, r) => `<path d="${sealBlob(cx, cy, r)}" fill="${VI}" ${ol()}/><circle cx="${cx}" cy="${cy}" r="${r * 0.68}" fill="#c8302a" ${ol({ strokeWidth: 2.5 })}/>
  <text x="${cx}" y="${cy + r * 0.3}" font-family="Georgia,serif" font-weight="bold" font-size="${r * 0.9}" text-anchor="middle" fill="${VL}" stroke="${O}" stroke-width="1.2">S</text>${gloss(cx - r * 0.4, cy - r * 0.45, r * 0.3, r * 0.14, -35, 0.5)}`;
function scCrest() { return `${quill(30, 122, 118, 14)}${sealS(50, 78, 36)}${sp(24, 30, 6, LP)}${sp(108, 70, 5, VL)}`; }
function scHost(t) {
  const wink = pulse(t, 0.4, 0.62) > 0.3;
  const feathers = [[30, 26, -40], [40, 16, -20], [96, 22, 30]].map(([x, y, r]) => `<g transform="translate(${x} ${y}) rotate(${r})"><path d="M0 0C-6 -10 -4 -22 0 -28C4 -22 6 -10 0 0Z" fill="#fff" ${ol({ strokeWidth: 3 })}/></g>`).join("");
  return hood({ hood: "#6a1e18", trim: VI, inner: "#1C1710", face: "#EEDCC0", under: feathers,
    eyes: `${eyeOpen(52, 76, "#3a2a1a")}${wink ? eyeShut(76, 76) : eyeOpen(76, 76, "#3a2a1a")}
    <path d="M68 82C72 80 78 82 76 86C74 88 70 86 68 82Z" fill="#1a1440"/>
    <path d="M56 91Q64 ${wink ? 98 : 95} 72 91" stroke="${O}" stroke-width="3" fill="none" stroke-linecap="round"/>${cheeks("#E8907A")}`,
    extra: `<circle cx="64" cy="112" r="7" fill="${VI}" ${ol({ strokeWidth: 2.5 })}/>` });
}
function scScroll() {
  return `<path d="M26 34H102V94H26Z" fill="${VL}" ${ol()}/>
  <path d="M38 50H90M38 62H90M38 74H76" stroke="${IG}" stroke-width="3" stroke-linecap="round"/><path d="M38 50H48" stroke="${VI}" stroke-width="4" stroke-linecap="round"/>
  <rect x="14" y="24" width="20" height="80" rx="10" fill="#E0CCA0" ${ol()}/><rect x="94" y="24" width="20" height="80" rx="10" fill="#E0CCA0" ${ol()}/>
  <path d="M60 94L54 118L64 112L74 118L68 94Z" fill="${VI}" ${ol({ strokeWidth: 3.5 })}/>
  ${gloss(22, 40, 3, 10, 0, 0.6)}${gloss(102, 40, 3, 10, 0, 0.6)}${sp(110, 14, 6, LP)}`;
}
function scInkpot() {
  return `<path d="M30 70Q30 56 46 54H82Q98 56 98 70V108Q98 118 86 118H42Q30 118 30 108Z" fill="#1a1440" ${ol()}/>
  <rect x="46" y="44" width="36" height="14" rx="4" fill="${IG}" ${ol({ strokeWidth: 4 })}/><path d="M38 84H90" stroke="${LP}" stroke-width="5"/>
  ${gloss(42, 78, 5, 14, 10, 0.4)}${quill(56, 50, 112, 4)}${sp(22, 40, 6, VI)}<circle cx="64" cy="51" r="6" fill="#0a0820"/>`;
}
function scCheer(t) {
  // stamp descends (0-0.35), hits (0.35-0.45 squash + ring), lifts showing seal (0.45-0.8), seal shines, loop
  const down = t < 0.35 ? ease(t / 0.35) : t < 0.45 ? 1 : t < 0.8 ? 1 - ease((t - 0.45) / 0.35) : 0;
  const shown = t >= 0.4 && t < 0.98;
  const sy = -40 + 62 * down;
  const ring = t > 0.35 && t < 0.6 ? (() => { const p = (t - 0.35) / 0.25; return `<ellipse cx="64" cy="96" rx="${30 + 30 * p}" ry="${8 + 8 * p}" fill="none" stroke="${VI}" stroke-width="${4 * (1 - p) + 0.5}" opacity="${1 - p}"/>`; })() : "";
  return `<path d="M10 92L118 92L112 122H16Z" fill="${VL}" ${ol()}/><path d="M24 104H104M30 114H96" stroke="${IG}" stroke-width="2.5" opacity=".5"/>
  ${shown ? `<g transform="translate(0 ${-2 + (t > 0.9 ? 0 : 0)})">${sealS(64, 96, 22 * (t < 0.45 ? 1.15 - (t - 0.4) * 3 : 1))}</g>` : ""}${ring}
  <g transform="translate(0 ${sy})">
   <rect x="52" y="26" width="24" height="36" rx="10" fill="#7a4a2a" ${ol()}/><circle cx="64" cy="22" r="12" fill="#9a6a3a" ${ol()}/>
   <rect x="42" y="60" width="44" height="16" rx="4" fill="${G}" ${ol()}/>${gloss(58, 18, 4, 2, -30, 0.6)}</g>
  ${shown && t > 0.55 ? sp(94, 72, 6 * Math.sin(Math.PI * (t - 0.55) / 0.43) + 0.5, "#fff") : ""}`;
}

export const KITS = [
  { house: "Oracle", p: "or", items: { crest: orCrest, host: orHost, moon: orMoon, orb: orOrb, cheer: orCheer }, still: 0.35 },
  { house: "Alchemist", p: "al", items: { crest: alCrest, host: alHost, stone: alStone, flask: alFlask, cheer: alCheer }, still: 0.2 },
  { house: "Observatory", p: "ob", items: { crest: obCrest, host: obHost, shard: obShard, astrolabe: obAstrolabe, cheer: obCheer }, still: 0.45 },
  { house: "Parlour", p: "pa", items: { crest: paCrest, host: paHost, key: paKey, planchette: paPlanchette, cheer: paCheer }, still: 0.9 },
  { house: "Scriptorium", p: "sc", items: { crest: scCrest, host: scHost, scroll: scScroll, inkpot: scInkpot, cheer: scCheer }, still: 0.6 },
];
export const ANIM = new Set(["host", "cheer"]);
