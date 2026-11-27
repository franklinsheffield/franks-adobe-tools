// The table crystal: the stone that floats on the reading table between readings (the menu screen's top-right box).
// Crystals and occult relics (ankh, skull, hourglass…). A store shelf of its own ("💠 Crystals & relics", Chamber department). Each crystal is drawn in the table's 400 x 300
// SVG around x 200, and animated by the gm-* classes in chamber.css (float, glints, spins, orbits).
const f1 = (n) => Number(n.toFixed(1));

/** One faceted point: a left (shade), middle (light) and right (mid) face. top = tip y, h = height, w = half width. */
function point(x, top, w, h, [dark, mid, light], tilt = 0) {
  const sy = top + h * 0.28, by = top + h, bw = w * 0.82, t = tilt ? ` transform="rotate(${tilt} ${x} ${by})"` : "";
  return `<g${t}><path d="M${x} ${top} L${x - w} ${f1(sy)} L${f1(x - bw)} ${by} L${x} ${by + 4}Z" fill="${dark}"/><path d="M${x} ${top} L${x + w} ${f1(sy)} L${f1(x + bw)} ${by} L${x} ${by + 4}Z" fill="${mid}"/>
<path d="M${x} ${top} L${f1(x - w * 0.35)} ${f1(sy)} L${f1(x - bw * 0.3)} ${by} L${x} ${by + 4} L${f1(x + bw * 0.3)} ${by} L${f1(x + w * 0.35)} ${f1(sy)}Z" fill="${light}" opacity=".85"/>
<path d="M${x} ${top} L${f1(x - w * 0.35)} ${f1(sy)} M${x} ${top} L${f1(x + w * 0.35)} ${f1(sy)} M${x - w} ${f1(sy)} H${x + w}" stroke="#fff" stroke-width=".8" opacity=".45" fill="none"/></g>`;
}
const glints = (pts) => pts.map(([x, y, s], i) => `<path class="gm-glint" style="--d:${f1(i * 0.7)}s" d="M${x} ${y - s}L${f1(x + s * 0.25)} ${f1(y - s * 0.25)}L${x + s} ${y}L${f1(x + s * 0.25)} ${f1(y + s * 0.25)}L${x} ${y + s}L${f1(x - s * 0.25)} ${f1(y + s * 0.25)}L${x - s} ${y}L${f1(x - s * 0.25)} ${f1(y - s * 0.25)}Z" fill="#fff"/>`).join("");
const aura = (col, r = 46, cy = 196) => `<ellipse class="gm-aura" cx="200" cy="${cy}" rx="${r}" ry="${f1(r * 1.1)}" fill="${col}" opacity=".22" filter="url(#gm-blur)"/>`;
const motes = (col, n = 6) => Array.from({ length: n }, (_, i) => `<circle class="gm-mote" style="--d:${f1(i * 0.55)}s;--x:${f1(Math.cos(i * 1.05) * 38)}px" cx="200" cy="236" r="${f1(1.2 + (i % 3) * 0.5)}" fill="${col}"/>`).join("");
const plinth = (glow) => `<ellipse cx="200" cy="248" rx="38" ry="7" fill="#000" opacity=".45" filter="url(#gm-blur)"/><ellipse class="gm-pool" cx="200" cy="246" rx="30" ry="5" fill="${glow}" opacity=".35"/>`;
const DEFS = `<defs><filter id="gm-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="6"/></filter></defs>`;

const DRAW = {
  quartz: () => `${aura("#66E0C8")}<g class="gm-float">${point(200, 140, 24, 96, ["#2f9c8c", "#66E0C8", "#c8fff4"])}${glints([[212, 166, 6], [190, 205, 4]])}</g>${motes("#c8fff4")}${plinth("#66E0C8")}`,
  amethyst: () => `${aura("#b45cff")}<g class="gm-float">${point(176, 176, 13, 58, ["#4a1f7a", "#8a4fd0", "#e2c8ff"], -18)}${point(224, 172, 14, 62, ["#4a1f7a", "#8a4fd0", "#e2c8ff"], 16)}${point(200, 146, 19, 90, ["#5a2490", "#a066e8", "#f0dcff"])}${glints([[208, 170, 6], [228, 196, 4], [172, 200, 3.5]])}</g>${motes("#e2c8ff")}${plinth("#b45cff")}`,
  rose: () => `${aura("#ff7ab8")}<g class="gm-float"><path d="M200 236 C150 200 150 156 178 154 C190 153 198 162 200 172 C202 162 210 153 222 154 C250 156 250 200 200 236Z" fill="#d94f8c"/><path d="M200 236 L178 154 C190 153 198 162 200 172Z" fill="#ff9cc8" opacity=".8"/><path d="M200 236 L222 154 C210 153 202 162 200 172Z" fill="#b8346e"/><path d="M200 172 L188 192 L200 236 L212 192Z" fill="#ffd0e6" opacity=".7"/>${glints([[184, 168, 5], [216, 188, 4]])}</g>${motes("#ffd0e6")}${plinth("#ff7ab8")}`,
  citrine: () => `${aura("#FADE8C")}<g class="gm-float"><path d="M200 132 L214 150 L214 236 L186 236 L186 150Z" fill="#c8901e"/><path d="M200 132 L214 150 L214 236 L200 240Z" fill="#E2B04A"/><path d="M200 132 L192 150 L192 236 L200 240 L206 236 L206 150Z" fill="#fff0b8" opacity=".75"/><path d="M186 150 H214" stroke="#fff" opacity=".5"/>${glints([[208, 146, 6], [192, 210, 4]])}</g>${motes("#FADE8C")}${plinth("#E2B04A")}`,
  geode: () => `${aura("#66b8ff", 50, 206)}<g class="gm-float"><ellipse cx="200" cy="200" rx="46" ry="38" fill="#5a4a3e"/><ellipse cx="200" cy="200" rx="40" ry="32" fill="#8a7a6a"/><ellipse cx="200" cy="200" rx="33" ry="26" fill="#1e3a6a"/>
${Array.from({ length: 14 }, (_, i) => { const a = (i / 14) * 6.283, x = 200 + Math.cos(a) * 26, y = 200 + Math.sin(a) * 20; return `<path d="M${f1(x)} ${f1(y)} L${f1(200 + Math.cos(a + 0.2) * 12)} ${f1(200 + Math.sin(a + 0.2) * 9)} L${f1(200 + Math.cos(a - 0.2) * 12)} ${f1(200 + Math.sin(a - 0.2) * 9)}Z" fill="${i % 2 ? "#9fd8ff" : "#5ea0e8"}" opacity=".9"/>`; }).join("")}<circle class="gm-core" cx="200" cy="200" r="7" fill="#e8f6ff"/>${glints([[214, 190, 5], [186, 210, 4], [200, 184, 3]])}</g>${motes("#9fd8ff")}${plinth("#66b8ff")}`,
  tesseract: () => `${aura("#66E0C8")}<g class="gm-float"><g class="gm-spin" style="transform-origin:200px 190px"><rect x="170" y="160" width="60" height="60" fill="none" stroke="#66E0C8" stroke-width="2"/><rect x="185" y="175" width="30" height="30" fill="#66E0C8" fill-opacity=".25" stroke="#c8fff4" stroke-width="1.5"/>
<path d="M170 160 L185 175 M230 160 L215 175 M170 220 L185 205 M230 220 L215 205" stroke="#66E0C8" stroke-width="1.5"/></g><g class="gm-spin r" style="transform-origin:200px 190px"><rect x="178" y="168" width="44" height="44" fill="none" stroke="#FF4FB3" stroke-width="1" opacity=".7" transform="rotate(45 200 190)"/></g>${glints([[200, 190, 6]])}</g>${motes("#66E0C8")}${plinth("#66E0C8")}`,
  atom: () => `${aura("#FADE8C")}<g class="gm-float">${point(200, 160, 16, 62, ["#8a6a1e", "#E2B04A", "#fff0b8"])}${[0, 60, 120].map((r, i) => `<g transform="rotate(${r} 200 192)"><ellipse cx="200" cy="192" rx="44" ry="13" fill="none" stroke="#66E0C8" stroke-width="1.2" opacity=".75"/><circle class="gm-e" style="--d:${f1(i * 0.5)}s" r="3.2" fill="#c8fff4"><animateMotion dur="${2 + i * 0.4}s" repeatCount="indefinite" path="M244 192 A44 13 0 1 1 156 192 A44 13 0 1 1 244 192"/></circle></g>`).join("")}</g>${motes("#FADE8C")}${plinth("#E2B04A")}`,
  ghost: () => `${aura("#cfe6ff")}<g class="gm-float gm-ghost">${point(200, 142, 23, 94, ["#6a8aa8", "#a8c8e8", "#f4faff"])}<g class="gm-blink"><path d="M190 196 q10 -8 20 0 q-10 8 -20 0Z" fill="#0d1a2a"/><circle cx="200" cy="196" r="3" fill="#cfe6ff"/></g>${glints([[214, 168, 5]])}</g>${motes("#cfe6ff")}${plinth("#cfe6ff")}`,
  star: () => `${aura("#fff6c8", 54)}<g class="gm-float"><g class="gm-spin" style="transform-origin:200px 190px"><path d="M200 136 L212 176 L254 190 L212 204 L200 244 L188 204 L146 190 L188 176Z" fill="#E2B04A"/><path d="M200 136 L212 176 L200 190Z M254 190 L212 204 L200 190Z M200 244 L188 204 L200 190Z M146 190 L188 176 L200 190Z" fill="#fff0b8"/></g><circle class="gm-core" cx="200" cy="190" r="8" fill="#fff"/>${glints([[230, 168, 5], [170, 214, 4]])}</g>${motes("#fff6c8", 9)}${plinth("#FADE8C")}`,
  ankh: () => `${aura("#FADE8C")}<g class="gm-float"><path d="M200 140 C176 140 178 176 196 184 L170 184 L170 196 L194 196 L194 240 L206 240 L206 196 L230 196 L230 184 L204 184 C222 176 224 140 200 140Z M200 152 C210 152 212 172 200 178 C188 172 190 152 200 152Z" fill="#E2B04A" fill-rule="evenodd" stroke="#fff0b8" stroke-width="1"/><path d="M206 196 V240" stroke="#8a6a1e" stroke-width="3"/><circle cx="200" cy="190" r="3" fill="#66E0C8"/>${glints([[214, 150, 5], [176, 190, 3.5]])}</g>${motes("#FADE8C")}${plinth("#E2B04A")}`,
  skull: () => `${aura("#66E0C8", 44, 204)}<g class="gm-float"><path d="M168 196 C164 156 236 156 232 196 C232 210 222 214 220 224 L180 224 C178 214 168 210 168 196Z" fill="#efe6d2" stroke="#8a7d62"/><path d="M180 224 v12 h40 v-12" fill="#e2d6bc" stroke="#8a7d62"/><path d="M188 224 v12 M196 224 v12 M204 224 v12 M212 224 v12" stroke="#8a7d62"/>
<ellipse cx="186" cy="196" rx="9" ry="10" fill="#1a1410"/><ellipse cx="214" cy="196" rx="9" ry="10" fill="#1a1410"/><circle class="gm-eyes" cx="186" cy="197" r="3.2" fill="#66E0C8"/><circle class="gm-eyes" cx="214" cy="197" r="3.2" fill="#66E0C8"/><path d="M200 206 l-5 9 h10Z" fill="#1a1410"/><path d="M178 172 q10 -8 22 -6" stroke="#fff" opacity=".5" fill="none"/></g>${motes("#66E0C8")}${plinth("#66E0C8")}`,
  hourglass: () => `${aura("#FADE8C")}<g class="gm-float"><rect x="172" y="142" width="56" height="7" rx="2" fill="#7a4f2a"/><rect x="172" y="233" width="56" height="7" rx="2" fill="#7a4f2a"/><path d="M178 149 V151 C178 176 196 184 196 191 C196 198 178 206 178 231 V233 M222 149 V151 C222 176 204 184 204 191 C204 198 222 206 222 231 V233" stroke="#5a3a1e" stroke-width="3" fill="none"/>
<path d="M181 151 H219 C219 172 203 182 200 191 C197 182 181 172 181 151Z" fill="#cfe6ff" opacity=".25"/><path class="gm-sand-top" d="M186 162 H214 C212 174 203 182 200 189 C197 182 188 174 186 162Z" fill="#E2B04A"/><path class="gm-stream" d="M200 189 V226" stroke="#E2B04A" stroke-width="1.5" stroke-dasharray="3 3"/><path class="gm-sand-bot" d="M182 231 C190 214 210 214 218 231Z" fill="#E2B04A"/>${glints([[216, 158, 4]])}</g>${motes("#FADE8C")}${plinth("#E2B04A")}`,
  eye: () => `${aura("#FF4FB3", 50)}<g class="gm-float"><g class="gm-rays">${Array.from({ length: 12 }, (_, i) => { const a = (i / 12) * 6.283; return `<path d="M${f1(200 + Math.cos(a) * 34)} ${f1(196 + Math.sin(a) * 34)} L${f1(200 + Math.cos(a) * 50)} ${f1(196 + Math.sin(a) * 50)}" stroke="#FADE8C" stroke-width="2" opacity=".6"/>`; }).join("")}</g><path d="M200 150 L240 226 L160 226Z" fill="#E2B04A" stroke="#fff0b8" stroke-width="1.2"/><path d="M200 150 L240 226 L200 226Z" fill="#c8901e"/>
<path d="M182 200 q18 -16 36 0 q-18 16 -36 0Z" fill="#fff6e8"/><circle cx="200" cy="200" r="6.5" fill="#FF4FB3"/><ellipse class="gm-slit" cx="200" cy="200" rx="1.6" ry="5" fill="#1a0614"/>${glints([[220, 178, 4]])}</g>${motes("#FF4FB3")}${plinth("#FF4FB3")}`,
  planchette: () => `${aura("#FADE8C", 50, 210)}<g class="gm-float gm-drift"><path d="M200 160 C236 168 246 214 232 228 C220 238 180 238 168 228 C154 214 164 168 200 160Z" fill="#8a5a32" stroke="#E2B04A" stroke-width="2"/><circle cx="200" cy="196" r="14" fill="#1a1020" stroke="#E2B04A" stroke-width="2"/><circle cx="200" cy="196" r="10" fill="#cfe6ff" opacity=".35"/><path d="M194 190 q6 -4 10 2" stroke="#fff" opacity=".6" fill="none"/>
<text x="200" y="224" font-size="9" text-anchor="middle" fill="#FADE8C" font-family="Cinzel,Georgia,serif">✦ ☽ ✦</text>${glints([[224, 178, 4]])}</g>${motes("#FADE8C")}${plinth("#E2B04A")}`,
  astrolabe: () => `${aura("#FADE8C", 52)}<g class="gm-float"><circle cx="200" cy="192" r="42" fill="#3a2a14" stroke="#E2B04A" stroke-width="3"/>${Array.from({ length: 24 }, (_, i) => { const a = (i / 24) * 6.283; return `<path d="M${f1(200 + Math.cos(a) * 36)} ${f1(192 + Math.sin(a) * 36)} L${f1(200 + Math.cos(a) * 41)} ${f1(192 + Math.sin(a) * 41)}" stroke="#FADE8C" stroke-width="1"/>`; }).join("")}
<g class="gm-spin" style="transform-origin:200px 192px"><circle cx="200" cy="186" r="22" fill="none" stroke="#FADE8C" stroke-width="1.5"/><path d="M200 162 L204 172 L196 172Z M178 192 L186 190 L186 194Z M222 192 L214 190 L214 194Z" fill="#FADE8C"/></g><g class="gm-spin r" style="transform-origin:200px 192px"><path d="M162 192 H238" stroke="#66E0C8" stroke-width="2"/><circle cx="200" cy="192" r="3" fill="#66E0C8"/></g><circle cx="200" cy="146" r="6" fill="none" stroke="#E2B04A" stroke-width="3"/>${glints([[226, 170, 4]])}</g>${motes("#FADE8C")}${plinth("#E2B04A")}`,
  ouroboros: () => `${aura("#66E0C8", 48)}<g class="gm-float"><g class="gm-spin" style="transform-origin:200px 192px"><circle cx="200" cy="192" r="34" fill="none" stroke="#2f7a5a" stroke-width="12"/><circle cx="200" cy="192" r="34" fill="none" stroke="#66E0C8" stroke-width="12" stroke-dasharray="4 5" opacity=".5"/><path d="M200 150 l14 6 l-6 8 l-10 -2Z" fill="#2f7a5a" stroke="#66E0C8"/><circle cx="208" cy="155" r="1.8" fill="#FF4FB3"/></g><circle cx="200" cy="192" r="6" fill="#FADE8C" opacity=".7"/>${glints([[226, 172, 4]])}</g>${motes("#66E0C8")}${plinth("#66E0C8")}`,
};

/** id, name, note, price, look (a DRAW key). Quartz is free and worn from the start. */
export const GEMS = [
  { id: "gem-quartz", name: "Clear quartz point", note: "The Chamber's own stone. Silicon dioxide, grown slowly in rock", price: 0, look: "quartz" },
  { id: "gem-amethyst", name: "Amethyst cluster", note: "Purple quartz: traces of iron, coloured by natural radiation", price: 90, look: "amethyst" },
  { id: "gem-rose", name: "Rose heart", note: "Pink quartz cut as a heart. It floats a little higher when you win", price: 110, look: "rose" },
  { id: "gem-citrine", name: "Citrine obelisk", note: "A golden tower of quartz, glints running up its faces", price: 120, look: "citrine" },
  { id: "gem-geode", name: "Split geode", note: "A plain rock outside, a cave of blue crystal within", price: 150, look: "geode" },
  { id: "gem-atom", name: "Atom crystal", note: "Electrons orbit a golden point. Not to scale, by a lot", price: 160, look: "atom" },
  { id: "gem-tesseract", name: "Tesseract", note: "A shadow of a four-dimensional cube, turning in three", price: 180, look: "tesseract" },
  { id: "gem-star", name: "Fallen star", note: "An eight-pointed star that never stops turning", price: 220, look: "star" },
  { id: "gem-ghost", ghost: true, name: "Ghost quartz", note: "Pale and cold. Look closely: it blinks", price: 130, look: "ghost" },
  { id: "gem-ankh", name: "Golden ankh", note: "The Egyptian sign for life, carried by gods in tomb paintings", price: 120, look: "ankh" },
  { id: "gem-skull", name: "Seer's skull", note: "Bone-white, eyes lit teal. A memento mori: remember you will die", price: 140, look: "skull" },
  { id: "gem-hourglass", name: "Hourglass", note: "Sand really falls. Ships timed watches with these for centuries", price: 110, look: "hourglass" },
  { id: "gem-eye", name: "Eye of Providence", note: "An eye in a triangle of rays, here with my pink slit", price: 170, look: "eye" },
  { id: "gem-planchette", name: "Planchette", note: "The pointer from a talking board. Studies credit the ideomotor effect", price: 130, ghost: true, look: "planchette" },
  { id: "gem-astrolabe", name: "Astrolabe", note: "A brass star calculator used for over a thousand years", price: 200, look: "astrolabe" },
  { id: "gem-ouroboros", name: "Ouroboros", note: "The snake eating its own tail, from Egyptian and Greek texts", price: 150, look: "ouroboros" },
];
export const gemOf = (id) => GEMS.find((g) => g.id === id) || GEMS[0];
/** The crystal's SVG for the table (inner markup of the 400 x 300 table SVG). */
export const gemSvg = (id) => DEFS + `<g class="gm gm-${gemOf(id).look}">${DRAW[gemOf(id).look]()}</g>`;

export const gemShop = {
  kind: "gem",
  label: "💠 Crystals & relics",
  items: GEMS.map(({ id, name, note, price, ghost }) => ({ id, name, note, price, ...(ghost ? { ghost } : {}) })),
  talk: {
    open: ["Crystals and relics for my table. An ankh, a skull, a working hourglass… pick what watches over the readings.", "The stone on my table. It does nothing, scientifically. It looks fantastic doing it.", "Crystals! Grown atom by atom over thousands of years, now sold for Essence."],
    tryon: ["{item}. See how it catches the candlelight?", "{item}. Lovely. Don't tap the glass, it's not an aquarium."],
    buy: ["{item} takes its place on the table.", "{item} is yours. I'll polish it between readings."],
  },
  preview: (id, ctx) => { ctx.tableEl.className = "table idle gm-show"; ctx.table.idle(gemSvg(id)); ctx.cap("💠 " + gemOf(id).name); },
};
