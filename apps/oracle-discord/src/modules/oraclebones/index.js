// /oraclebones: a reflection in the format of Late Shang bone divination (c. 1250–1046 BCE).
// Format: preface (today's sexagenary day) -> the charge, made as a statement, paired with its opposite ->
// heat applied to drilled hollows -> 卜-shaped cracks read with Shang crack notations -> prognostication -> verification.
import { pillar, jdn } from "../chinesezodiac/calendar.js";
import { analyse } from "./insight.js";
import { withInsight } from "../../insight.js";
import { cardPng, PAL, esc, para, fit, GOLD, TEAL, FOOTER, cut } from "../../card.js";

export const command = {
  name: "oraclebones",
  description: "Make a charge, crack the bone and read the omen, in the format of Shang oracle bone divination",
  options: [
    { type: 3, name: "charge", description: "A statement about what you want to know, e.g. 'The new job will go well'", max_length: 160 },
    { type: 3, name: "bone", description: "What to crack (default: turtle plastron)", choices: [{ name: "Turtle plastron", value: "turtle" }, { name: "Ox shoulder blade", value: "ox" }] },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

// Crack notations carved beside Shang cracks, best to worst.
export const OMENS = [
  { hz: "大吉", py: "dà jí", en: "great auspice", w: 1, score: 3, text: "The crack ran clean and the branch rose sharply: the strongest favourable sign the diviners carved." },
  { hz: "弘吉", py: "hóng jí", en: "vast auspice", w: 2, score: 2.5, text: "A broad, clear branch: favour that spreads wider than the question itself." },
  { hz: "吉", py: "jí", en: "auspicious", w: 4, score: 2, text: "A good crack: the matter is favoured." },
  { hz: "小吉", py: "xiǎo jí", en: "slightly auspicious", w: 4, score: 1, text: "A modest crack: favour, but small." },
  { hz: "亡尤", py: "wáng yóu", en: "no trouble", w: 4, score: 0.5, text: "Neutral: nothing goes wrong, nothing special happens. The ordinary is protected." },
  { hz: "有祟", py: "yǒu suì", en: "there will be harm", w: 2, score: -1, text: "A troubled crack: something works against this. The Shang would have looked for the cause, made offerings and asked again." },
];
const TOTAL = OMENS.reduce((a, o) => a + o.w, 0);
function rng() { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] / 2 ** 32; }

/** One crack: an omen (weighted) plus the crack's shape for drawing. */
export function crack(rand = rng) {
  let x = rand() * TOTAL, omen = OMENS[OMENS.length - 1];
  for (const o of OMENS) { if (x < o.w) { omen = o; break; } x -= o.w; }
  const good = omen.score >= 2;
  return { omen, angle: Math.round(good ? 50 + rand() * 25 : 20 + rand() * 30), len: 0.55 + rand() * 0.4, side: rand() < 0.5 ? -1 : 1, jag: Math.round(rand() * 4 + (omen.score < 0 ? 4 : 0)) };
}

/** Today's day in the 60-day cycle, as Shang scribes dated each divination (China Standard Time). */
export function dayGanzhi(now = new Date()) {
  const c = new Date(now.getTime() + 8 * 3600000);
  return pillar(jdn(c.getUTCFullYear(), c.getUTCMonth() + 1, c.getUTCDate()) + 49);
}

export function divine(charge, rand = rng, now = new Date()) {
  const pos = crack(rand), neg = crack(rand), day = dayGanzhi(now);
  const d = pos.omen.score - neg.omen.score;
  const verdict = d >= 1.5 ? "yes" : d > 0 ? "lean-yes" : d === 0 ? "even" : d > -1.5 ? "lean-no" : "no";
  return { charge, day, pos, neg, verdict, routine: !charge };
}

const VERDICT = {
  yes: ["吉", "The bone favours the charge.", "The positive crack clearly outshines its opposite. Here a Shang scribe would carve the favourable notation and wait for the verification."],
  "lean-yes": ["小吉", "The bone leans toward the charge.", "The positive crack is a little stronger. Favourable, but not by a wide margin: a diviner might well have cracked again."],
  even: ["亡尤", "The bone is silent between the two.", "Both cracks read the same. The Shang often re-divined with a fresh hollow; an even result settles nothing by itself."],
  "lean-no": ["其", "The bone leans against the charge.", "The opposite crack is a little stronger. Not a refusal, but the bone does not side with the charge as worded."],
  no: ["有祟", "The bone does not favour the charge.", "The opposite crack clearly wins. The charge as stated is not supported; diviners took that as information about the matter."],
};

function plastron(r, bone) {
  // a turtle plastron (or ox scapula) outline with drilled hollows and two burnt cracks
  const cx = 360, top = 20;
  const shape = bone === "ox"
    ? `<path d="M${cx - 70},${top} L${cx + 70},${top} Q${cx + 90},${top + 60} ${cx + 210},${top + 520} Q${cx},${top + 600} ${cx - 210},${top + 520} Q${cx - 90},${top + 60} ${cx - 70},${top} Z" fill="url(#bone)" stroke="${PAL.gold}" stroke-opacity="0.7" stroke-width="2.5"/>`
    : `<path d="M${cx - 120},${top} Q${cx},${top - 26} ${cx + 120},${top} Q${cx + 230},${top + 90} ${cx + 250},${top + 260} Q${cx + 260},${top + 470} ${cx + 130},${top + 590} L${cx + 40},${top + 560} L${cx},${top + 600} L${cx - 40},${top + 560} L${cx - 130},${top + 590} Q${cx - 260},${top + 470} ${cx - 250},${top + 260} Q${cx - 230},${top + 90} ${cx - 120},${top} Z" fill="url(#bone)" stroke="${PAL.gold}" stroke-opacity="0.7" stroke-width="2.5"/>
       <path d="M${cx},${top + 10} V${top + 590} M${cx - 240},${top + 200} H${cx + 240} M${cx - 252},${top + 350} H${cx + 252} M${cx - 210},${top + 480} H${cx + 210}" stroke="#7a6a4a" stroke-opacity="0.5" stroke-width="2"/>`;
  let s = shape;
  // unused hollows
  for (const [dx, dy] of bone === "ox" ? [[-40, 110], [40, 110], [-150, 470], [150, 470], [-70, 540], [70, 540]] : [[-150, 130], [150, 130], [-170, 420], [170, 420], [-80, 520], [80, 520]]) s += `<ellipse cx="${cx + dx}" cy="${top + dy}" rx="12" ry="22" fill="#3b2f1f" fill-opacity="0.55"/>`;
  const drawCrack = (c, x, y, label, col) => {
    const L = 120 * c.len, a = (c.angle * Math.PI) / 180;
    let path = `M${x},${y - L}`;
    for (let i = 1; i <= 6; i++) path += ` L${(x + (i % 2 ? 1 : -1) * (c.jag * 0.6)).toFixed(1)},${(y - L + (2 * L * i) / 6).toFixed(1)}`;
    const bx = x + c.side * Math.cos(a) * L * 0.9, by = y - Math.sin(a) * L * 0.9;
    let br = `M${x},${y}`;
    for (let i = 1; i <= 4; i++) br += ` L${(x + (bx - x) * i / 4 + (i % 2 ? c.jag : -c.jag) * 0.5).toFixed(1)},${(y + (by - y) * i / 4).toFixed(1)}`;
    return `<ellipse cx="${x}" cy="${y}" rx="16" ry="30" fill="#2a1d10" fill-opacity="0.8"/><circle cx="${x + c.side * 14}" cy="${y}" r="9" fill="#1a1008"/>
      <path d="${path}" stroke="#1a1008" stroke-width="5" fill="none" stroke-linecap="round"/><path d="${br}" stroke="#1a1008" stroke-width="4" fill="none" stroke-linecap="round"/>
      <path d="${path} ${br}" stroke="${col}" stroke-opacity="0.55" stroke-width="1.5" fill="none" filter="url(#glow)"/>
      <text x="${x}" y="${y + 78}" font-family="Noto Serif SC" font-weight="700" font-size="40" fill="#2a1d10" text-anchor="middle">${c.omen.hz}</text>
      <text x="${x}" y="${y + 160}" font-size="16" fill="#3b2f1f" text-anchor="middle">${esc(label)}</text>`;
  };
  s += drawCrack(r.pos, cx - 110, top + 250, "the charge", PAL.gold) + drawCrack(r.neg, cx + 110, top + 250, "its opposite", PAL.teal);
  return s;
}

function body(r, bone) {
  const v = VERDICT[r.verdict];
  const ins = `${r.day.stem.hz}${r.day.branch.hz}卜貞`;
  let s = `<circle cx="360" cy="320" r="330" fill="url(#halo)"/>${plastron(r, bone)}`;
  // vertical inscription, read top to bottom
  [...ins].forEach((ch, i) => { s += `<text x="760" y="${40 + i * 62}" font-family="Noto Serif SC" font-weight="700" font-size="52" fill="${PAL.light}" text-anchor="middle">${ch}</text>`; });
  s += `<text x="760" y="${40 + ins.length * 62 + 10}" font-size="15" fill="${PAL.mute}" text-anchor="middle">${esc(r.day.stem.py)} ${esc(r.day.branch.py)}</text>`;
  s += `<text x="830" y="30" font-size="16" letter-spacing="3" fill="${PAL.teal}">PREFACE</text>
  <text x="830" y="64" font-size="22" fill="${PAL.text}">Cracking on day <tspan font-weight="700" fill="${PAL.light}">${r.day.stem.py} ${r.day.branch.py}</tspan>, ${r.day.index + 1} of 60, we divine:</text>
  <text x="830" y="122" font-size="16" letter-spacing="3" fill="${PAL.teal}">CHARGE</text>
  ${para(830, 158, `“${r.charge || "In the next ten days there will be no misfortune."}”`, { n: 52, size: 24, fill: PAL.light, max: 3, style: 'font-style="italic"' })}
  <text x="830" y="290" font-size="16" letter-spacing="3" fill="${PAL.teal}">CRACKS</text>
  <text x="830" y="328" font-size="21" fill="${PAL.text}">The charge: <tspan font-family="Noto Serif SC" font-weight="700" fill="${PAL.gold}">${r.pos.omen.hz}</tspan> ${esc(r.pos.omen.py)}, ${esc(r.pos.omen.en)}</text>
  <text x="830" y="362" font-size="21" fill="${PAL.text}">Its opposite: <tspan font-family="Noto Serif SC" font-weight="700" fill="${PAL.teal}">${r.neg.omen.hz}</tspan> ${esc(r.neg.omen.py)}, ${esc(r.neg.omen.en)}</text>
  <text x="830" y="420" font-size="16" letter-spacing="3" fill="${PAL.teal}">PROGNOSTICATION · 占曰</text>
  <text x="830" y="468" font-family="Cinzel" font-weight="900" font-size="${fit(v[1], 34, 680, 0.74)}" fill="${PAL.light}">${esc(v[1])}</text>
  ${para(830, 506, v[2], { n: 60, size: 19, fill: PAL.mute, max: 3 })}
  <text x="830" y="610" font-size="16" letter-spacing="3" fill="${PAL.teal}">VERIFICATION</text>
  <text x="830" y="642" font-size="19" fill="${PAL.mute}">Left blank, as the scribes did, until the outcome is known.</text>`;
  return s;
}

export function readingEmbeds(r, { who = "you" } = {}) {
  const v = VERDICT[r.verdict], c = r.charge || "In the next ten days there will be no misfortune.";
  const main = {
    title: `🐢 Oracle Bones · ${v[1]}`, color: GOLD,
    description: `**${r.day.stem.hz}${r.day.branch.hz}卜，貞：** *${cut(c, 200)}*\nCracking on day ${r.day.stem.py} ${r.day.branch.py} (${r.day.index + 1} of the 60-day cycle).${r.routine ? "\n*No charge given, so the diviner made the routine one: the Shang asked this at the end of every ten-day week.*" : ""}`,
    fields: [
      { name: `🔥 The charge · ${r.pos.omen.hz} ${r.pos.omen.py} (${r.pos.omen.en})`, value: r.pos.omen.text },
      { name: `🔥 Its opposite · ${r.neg.omen.hz} ${r.neg.omen.py} (${r.neg.omen.en})`, value: `Shang diviners often cracked both sides of a question: "it will" and "it may not". ${r.neg.omen.text.replace("the matter is favoured", "the opposite outcome is favoured")}` },
      { name: "📜 Prognostication · 占曰", value: `**${v[1]}** ${v[2]}` },
      { name: "✍️ Verification · 驗辭", value: "On many bones a scribe later added what actually happened. A finished inscription is therefore a small record of prediction set against result: the oldest feedback loop in Chinese writing." },
    ],
    image: { url: "attachment://oraclebones.png" }, footer: FOOTER,
  };
  const about = {
    title: "🦴 How the Shang read the bones", color: TEAL,
    fields: [
      { name: "The method", value: "Diviners at the Late Shang court at Anyang (c. 1250–1046 BCE) prepared turtle plastrons and ox shoulder blades by carving rows of hollows into the back. A hot rod applied to a hollow made the bone crack with a sharp report, in a shape like 卜, which is still the Chinese character for divination." },
      { name: "The record", value: "The question, the cracks and sometimes the king's reading and the result were carved beside the cracks. About 150,000 fragments survive. They are the earliest substantial body of Chinese writing, and they record rain, harvests, hunts, childbirth, illness, war and dreams." },
      { name: "This reading", value: "This is a **modern reflection in the Shang format**, not a recreation of a royal rite: there are no ancestors addressed and no offerings asked. The day count is the real 60-day cycle the Shang used, computed for today." },
      { name: "🧩 Why a statement, not a question", value: "The Shang put matters to the bone as plain statements (\"It will rain\"), then as their opposites (\"It will not rain\"). Wording a matter both ways tends to show which version the asker was hoping for, which is data too." },
    ],
    footer: { text: `${FOOTER.text} · divined for ${who}` },
  };
  return [main, about];
}

export async function run(o = {}, ctx = {}) {
  const charge = (o.charge || o.question || "").trim(), bone = o.bone === "ox" ? "ox" : "turtle";
  const r = divine(charge, ctx.rand, ctx.now || new Date());
  const who = ctx.user ? `@${ctx.user}` : "you";
  const defs = `<radialGradient id="bone" cx="0.45" cy="0.35" r="0.8"><stop offset="0" stop-color="#F3E4C0"/><stop offset="0.7" stop-color="#D9C08E"/><stop offset="1" stop-color="#A8895A"/></radialGradient>`;
  const png = await cardPng({ title: "Oracle Bones", subtitle: `${bone === "ox" ? "ox shoulder blade" : "turtle plastron"} · divined for ${who}`, tag: "in the format of Late Shang divination", body: body(r, bone), defs, H: 860 });
  const ins = analyse(r, OMENS, who);
  return { embeds: withInsight(readingEmbeds(r, { who }), ins), analysis: ins.analysis, files: [{ name: "oraclebones.png", data: png }], ephemeral: !!o.private,
    reading: { day: `${r.day.stem.py} ${r.day.branch.py}`, charge: r.charge, charged: r.pos.omen.en, opposite: r.neg.omen.en, verdict: r.verdict }, headline: VERDICT[r.verdict][1] };
}
