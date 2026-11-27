// /ifa: an Ifá-inspired reflection. The divining chain (ọ̀pẹ̀lẹ̀) has 8 half-pods, 4 per leg; each lands open or
// closed, giving one of 16 principal Odù per leg and 16 x 16 = 256 Odù in all. Respectfully labelled: this is not
// a consultation with a babaláwo, and it never prescribes offerings (ẹbọ).
import { ODU, REFLECT } from "./data.js";
import { cardPng, PAL, esc, para, GOLD, TEAL, FOOTER, cut } from "../../card.js";

export const command = {
  name: "ifa",
  description: "An Ifá-inspired reflection: cast the divining chain and see which of the 256 Odù appears",
  options: [
    { type: 3, name: "question", description: "What you want to reflect on (optional)", max_length: 200 },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

function rng() { const a = new Uint32Array(1); globalThis.crypto.getRandomValues(a); return a[0] / 2 ** 32; }
const BY_MARKS = new Map(ODU.map((o, i) => [o.marks.join(""), i]));
export const oduOf = (marks) => BY_MARKS.get(marks.join(""));

/** Cast the chain: 8 pods, each open (1, single mark) or closed (2, double mark). Right leg is read first. */
export function cast(rand = rng) {
  const pods = Array.from({ length: 8 }, () => (rand() < 0.5 ? 1 : 2));
  const right = pods.slice(0, 4), left = pods.slice(4);
  const r = oduOf(right), l = oduOf(left);
  return { pods, right, left, r, l, number: r * 16 + l + 1, name: oduName(r, l) };
}
export const oduName = (r, l) => (r === l ? ODU[r].alt : `${ODU[r].name} ${ODU[l].name}`);

function marks(x, y, m, col) {
  let s = "";
  m.forEach((v, i) => {
    const yy = y + i * 56;
    if (v === 1) s += `<rect x="${x - 6}" y="${yy}" width="12" height="40" rx="5" fill="${col}"/>`;
    else s += `<rect x="${x - 22}" y="${yy}" width="12" height="40" rx="5" fill="${col}"/><rect x="${x + 10}" y="${yy}" width="12" height="40" rx="5" fill="${col}"/>`;
  });
  return s;
}

function body(c, question) {
  const R = ODU[c.r], L = ODU[c.l];
  // tray (opọ́n) with marks
  let s = `<circle cx="330" cy="330" r="300" fill="url(#halo)"/>
  <circle cx="330" cy="320" r="250" fill="url(#tray)" stroke="${PAL.gold}" stroke-width="3"/>
  <circle cx="330" cy="320" r="214" fill="none" stroke="${PAL.gold}" stroke-opacity="0.5" stroke-width="2" stroke-dasharray="14 8"/>`;
  for (let i = 0; i < 24; i++) { const a = (i / 24) * Math.PI * 2, x = 330 + Math.cos(a) * 232, y = 320 + Math.sin(a) * 232; s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="3" fill="${PAL.gold}" fill-opacity="0.7"/>`; }
  s += marks(400, 214, c.right, PAL.light) + marks(260, 214, c.left, PAL.teal) +
    `<text x="400" y="200" font-size="14" letter-spacing="2" fill="${PAL.light}" text-anchor="middle">RIGHT</text><text x="260" y="200" font-size="14" letter-spacing="2" fill="${PAL.teal}" text-anchor="middle">LEFT</text>`;
  s += `<text x="330" y="630" font-family="Cinzel" font-weight="900" font-size="${c.name.length > 16 ? 36 : 46}" fill="${PAL.light}" text-anchor="middle">${esc(c.name)}</text>
  <text x="330" y="664" font-size="19" fill="${PAL.teal}" text-anchor="middle">one of the 256 Odù · ${esc(R.theme)}</text>`;
  // the chain (ọ̀pẹ̀lẹ̀): two legs hanging from a centre link
  const leg = (x0, pods, col) => {
    let p = `<path d="M${x0},40 C${x0},140 ${x0},300 ${x0},540" stroke="${PAL.gold}" stroke-opacity="0.55" stroke-width="3" fill="none" stroke-dasharray="6 6"/>`;
    pods.forEach((v, i) => {
      const y = 110 + i * 128;
      p += v === 1
        ? `<ellipse cx="${x0}" cy="${y}" rx="36" ry="52" fill="#3b2a18" stroke="${col}" stroke-width="3"/><ellipse cx="${x0}" cy="${y}" rx="22" ry="38" fill="#E9D3A8"/><line x1="${x0}" y1="${y - 30}" x2="${x0}" y2="${y + 30}" stroke="#a5835a" stroke-width="2"/>`
        : `<ellipse cx="${x0}" cy="${y}" rx="36" ry="52" fill="url(#pod)" stroke="${col}" stroke-width="3"/><path d="M${x0 - 20},${y - 30} q20,30 0,60 M${x0 + 18},${y - 32} q-14,32 0,64" stroke="#2a1d10" stroke-opacity="0.6" stroke-width="2" fill="none"/>`;
      p += `<text x="${x0 + (x0 > 1100 ? 70 : -70)}" y="${y + 10}" font-size="26" font-weight="700" fill="${col}" text-anchor="middle">${v === 1 ? "I" : "II"}</text>`;
    });
    return p;
  };
  s += `<path d="M960,40 Q1050,0 1140,40" stroke="${PAL.gold}" stroke-width="3" fill="none"/><circle cx="1050" cy="18" r="10" fill="none" stroke="${PAL.gold}" stroke-width="3"/>
  <text x="1050" y="-12" font-size="14" letter-spacing="2" fill="${PAL.mute}" text-anchor="middle">THE DIVINING CHAIN</text>
  ${leg(960, c.left, PAL.teal)}${leg(1140, c.right, PAL.light)}
  <text x="1300" y="140" font-size="16" letter-spacing="2" fill="${PAL.teal}">OPEN FACE = I</text><text x="1300" y="166" font-size="16" letter-spacing="2" fill="${PAL.teal}">CLOSED FACE = II</text>`;
  if (question) s += para(1260, 260, `“${question}”`, { n: 24, size: 19, fill: PAL.mute, max: 6, style: 'font-style="italic"' });
  return s;
}

export function readingEmbeds(c, question, { who = "you" } = {}) {
  const R = ODU[c.r], L = ODU[c.l], meji = c.r === c.l;
  const sym = (m) => m.map((v) => (v === 1 ? "I" : "II")).join(" · ");
  const main = {
    title: `🌰 Ifá-inspired reflection · ${c.name}`, color: GOLD,
    description: `${question ? `**Question:** ${cut(question, 200)}\n` : ""}One of the 256 Odù. *An Ifá-inspired reflection for self-inquiry, not a consultation with a babaláwo.*`,
    fields: [
      { name: `➡️ Right leg · ${R.name} (${sym(c.right)})`, value: `The right leg is read first and leads. **${R.name}** speaks of ${R.gist}.` },
      { name: `⬅️ Left leg · ${L.name} (${sym(c.left)})`, value: meji ? `The left leg mirrors the right: a **Méjì** (doubled) Odù, one of the sixteen principal Odù, where a single theme speaks with its full strength.` : `The left leg supports and colours it. **${L.name}** brings ${L.gist}.` },
      { name: "🔗 Together", value: meji ? `${R.name} twice over: the whole cast turns on **${R.theme}**. Sit with that one theme rather than looking elsewhere.` : `**${R.theme}** carried by **${L.theme}**. Read the right leg as the matter at hand and the left as the way it moves.` },
      { name: "🪞 Questions to sit with", value: `• ${REFLECT[c.r]}${meji ? "" : `\n• ${REFLECT[c.l]}`}` },
    ],
    image: { url: "attachment://ifa.png" }, footer: FOOTER,
  };
  const about = {
    title: "📿 About Ifá", color: TEAL,
    fields: [
      { name: "A living tradition", value: "Ifá is the divination system of the Yoruba people, practised in Nigeria, Benin and across the diaspora, from Cuba and Brazil to the US. It is associated with Ọ̀rúnmìlà, the orisha of wisdom, and is carried by trained priests, babaláwo, through a vast body of oral verses. UNESCO recognises it as part of humanity's intangible cultural heritage." },
      { name: "How a real consultation works", value: "A babaláwo casts sixteen palm nuts (ikin) or the divining chain (ọ̀pẹ̀lẹ̀) and marks the result on a tray dusted with powder. The Odù that appears opens many verses; the priest recites them, asks further questions, and may recommend an offering (ẹbọ). That knowledge takes years of training, and this bot does none of it." },
      { name: "What this reading is", value: "A respectful, **inspired-by** exercise: the chain's 8 pods, the 16 principal Odù and their marks, and short original reflections on their widely known themes. It quotes no verses and prescribes nothing. If Ifá speaks to you, seek out a qualified babaláwo or an established community." },
    ],
    footer: { text: `${FOOTER.text} · cast for ${who}` },
  };
  return [main, about];
}

export async function run(o = {}, ctx = {}) {
  const question = (o.question || "").trim(), c = cast(ctx.rand);
  const who = ctx.user ? `@${ctx.user}` : "you";
  const defs = `<radialGradient id="tray" cx="0.5" cy="0.4" r="0.7"><stop offset="0" stop-color="#3a2690"/><stop offset="1" stop-color="#1a1238"/></radialGradient>
  <radialGradient id="pod" cx="0.4" cy="0.35" r="0.8"><stop offset="0" stop-color="#8a6236"/><stop offset="1" stop-color="#3b2a18"/></radialGradient>`;
  const png = await cardPng({ title: "Ifá-inspired", subtitle: `${c.name} · cast for ${who}`, tag: "the 256 Odù · not a babaláwo consultation", body: body(c, question), defs, H: 880 });
  return { embeds: readingEmbeds(c, question, { who }), files: [{ name: "ifa.png", data: png }], ephemeral: !!o.private,
    reading: { odu: c.name, number: c.number, right: ODU[c.r].name, left: ODU[c.l].name }, headline: c.name };
}
