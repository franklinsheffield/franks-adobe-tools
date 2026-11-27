// /mayan: Tzolk'in day sign and tone, Haab', Long Count and Lord of the Night (GMT 584283 correlation).
import { parseBirth } from "../../birthplace.js";
import { mayaDate, nextKinReturn, SIGNS, HAAB } from "./calendar.js";
import { SIGN_TEXT, TONE_TEXT, LORDS } from "./text.js";
import { cardPng, PAL, esc, GOLD, TEAL, FOOTER, cut, MONTHS } from "../../card.js";

export const command = {
  name: "mayan",
  description: "Your Maya day sign and tone (Tzolk'in), Haab' and Long Count from your birth date",
  options: [
    { type: 3, name: "date", description: "Birth date as year-month-day (uses your /profile if left out)", min_length: 8, max_length: 10 },
    { type: 5, name: "private", description: "Only you see the reading (default: posted to the channel)" },
  ],
};

/** Maya bar-and-dot numeral (0..19) centred on x, bottom at y. */
export function barDot(n, x, y, s = 1, fill = PAL.gold) {
  if (n === 0) return `<ellipse cx="${x}" cy="${y - 14 * s}" rx="${26 * s}" ry="${13 * s}" fill="none" stroke="${fill}" stroke-width="${3 * s}"/><path d="M${x - 18 * s},${y - 14 * s} q${18 * s},${-10 * s} ${36 * s},0" fill="none" stroke="${fill}" stroke-width="${2 * s}"/>`;
  let out = "", yy = y; const bars = Math.floor(n / 5), dots = n % 5;
  for (let i = 0; i < bars; i++) { out += `<rect x="${x - 40 * s}" y="${yy - 14 * s}" width="${80 * s}" height="${14 * s}" rx="${5 * s}" fill="${fill}"/>`; yy -= 22 * s; }
  for (let i = 0; i < dots; i++) out += `<circle cx="${x + (i - (dots - 1) / 2) * 20 * s}" cy="${yy - 8 * s}" r="${7 * s}" fill="${fill}"/>`;
  return out;
}

function body(m, today) {
  const T = SIGN_TEXT[m.sign];
  let s = `<circle cx="310" cy="320" r="290" fill="url(#halo)"/>
  <circle cx="310" cy="320" r="190" fill="none" stroke="${PAL.gold}" stroke-width="3" filter="url(#glow)"/>`;
  SIGNS.forEach((name, i) => {
    const a = (i / 20) * Math.PI * 2 - Math.PI / 2, x = 310 + Math.cos(a) * 250, y = 320 + Math.sin(a) * 250, on = i === m.sign;
    s += `<text x="${x.toFixed(1)}" y="${(y + 6).toFixed(1)}" font-size="${on ? 22 : 15}" font-weight="${on ? 700 : 400}" fill="${on ? PAL.light : PAL.mute}" text-anchor="middle"${on ? ' filter="url(#glow)"' : ""}>${esc(name)}</text>`;
  });
  for (let i = 0; i < 13; i++) {
    const a = (i / 13) * Math.PI * 2 - Math.PI / 2, x = 310 + Math.cos(a) * 168, y = 320 + Math.sin(a) * 168, on = i + 1 === m.tone;
    s += `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${on ? 8 : 4}" fill="${on ? PAL.teal : PAL.dim}"${on ? ' filter="url(#glow)"' : ""}/>`;
  }
  s += barDot(m.tone, 310, 290, 1.4, "url(#goldfill)") +
    `<text x="310" y="372" font-family="Cinzel" font-weight="900" font-size="${m.signName.length > 7 ? 46 : 54}" fill="${PAL.light}" text-anchor="middle">${m.tone} ${esc(m.signName.toUpperCase())}</text>
    <text x="310" y="408" font-size="20" fill="${PAL.teal}" text-anchor="middle">${esc(T.kiche)} · ${esc(T.meaning.split(",")[0])}</text>
    <text x="310" y="436" font-size="17" fill="${m.direction[2]}" text-anchor="middle">${m.direction[0]} · ${m.direction[1]} · kin ${m.kin} of 260</text>`;
  // Long Count
  const units = ["BAK'TUN", "K'ATUN", "TUN", "WINAL", "K'IN"];
  s += `<text x="700" y="20" font-size="17" letter-spacing="3" fill="${PAL.teal}">LONG COUNT</text>`;
  m.longCount.forEach((v, i) => {
    const x = 700 + i * 166;
    s += `<rect x="${x}" y="38" width="150" height="230" rx="16" fill="${PAL.ink}" fill-opacity="0.55" stroke="${PAL.gold}" stroke-opacity="0.45"/>
    ${barDot(v, x + 75, 180, 1)}
    <text x="${x + 75}" y="222" font-family="Cinzel" font-weight="900" font-size="34" fill="${PAL.light}" text-anchor="middle">${v}</text>
    <text x="${x + 75}" y="252" font-size="14" letter-spacing="2" fill="${PAL.mute}" text-anchor="middle">${units[i]}</text>`;
  });
  s += `<text x="700" y="318" font-family="Cinzel" font-weight="900" font-size="28" fill="${PAL.light}">${m.longCount.join(".")}  ·  ${m.tone} ${esc(m.signName)}  ·  ${esc(m.haabName)}</text>
  <text x="700" y="356" font-size="18" fill="${PAL.mute}">Calendar Round: the same pairing returns every 52 years</text>`;
  // Haab and lord
  s += `<rect x="700" y="390" width="400" height="170" rx="16" fill="${PAL.ink}" fill-opacity="0.55" stroke="${PAL.gold}" stroke-opacity="0.45"/>
  <text x="724" y="424" font-size="16" letter-spacing="3" fill="${PAL.teal}">HAAB' · 365-DAY YEAR</text>
  ${barDot(m.haab.day, 790, 520, 0.9)}
  <text x="870" y="500" font-family="Cinzel" font-weight="900" font-size="38" fill="${PAL.light}">${m.haab.day} ${esc(HAAB[m.haab.month])}</text>
  <rect x="1124" y="390" width="400" height="170" rx="16" fill="${PAL.ink}" fill-opacity="0.55" stroke="${PAL.gold}" stroke-opacity="0.45"/>
  <text x="1148" y="424" font-size="16" letter-spacing="3" fill="${PAL.teal}">LORD OF THE NIGHT</text>
  <text x="1148" y="500" font-family="Cinzel" font-weight="900" font-size="56" fill="${PAL.light}">G${m.lord}</text>
  <text x="1260" y="490" font-size="17" fill="${PAL.mute}">of nine</text>`;
  // today
  s += `<text x="40" y="640" font-size="20" fill="${PAL.text}">Today is <tspan font-weight="700" fill="${PAL.light}">${today.tone} ${esc(today.signName)}</tspan> · ${esc(today.haabName)} · ${today.longCount.join(".")}</text>`;
  return s;
}

export function readingEmbeds(m, today, ret, { who = "you", birth } = {}) {
  const T = SIGN_TEXT[m.sign], [tn, tt] = TONE_TEXT[m.tone], tr = SIGN_TEXT[m.trecenaSign];
  const main = {
    title: `🌽 Maya Calendar · ${m.tone} ${m.signName}`, color: GOLD,
    description: `Your Tzolk'in day: **${m.tone} ${m.signName}** (K'iche': ${m.tone} ${T.kiche}), kin **${m.kin}** of the 260-day sacred count. *${T.meaning}.*`,
    fields: [
      { name: `🌀 Day sign · ${m.signName} (${T.kw.join(", ")})`, value: T.about },
      { name: `🔢 Tone ${m.tone} · ${tn}`, value: `Your tone is ${tt}. It sets *how* your day sign acts: ${m.signName} energy expressed through ${tn.toLowerCase()}.` },
      { name: "🌑 Shadow", value: T.shadow },
      { name: `🧭 Direction · ${m.direction[0]}`, value: `${m.signName} belongs to the ${m.direction[0]}, colour ${m.direction[1]}. The four directions cycle through the twenty signs like the four quarters of the world.` },
    ],
    image: { url: "attachment://mayan.png" }, footer: FOOTER,
  };
  const cal = {
    title: "📜 Your place in the calendars", color: TEAL,
    fields: [
      { name: `🗓️ Trecena of ${SIGNS[m.trecenaSign]}`, value: `You were born on day ${m.dayInTrecena} of the 13-day week that opened with **1 ${SIGNS[m.trecenaSign]}**. That sign colours your whole birth week: ${tr.kw.join(", ")}.` },
      { name: `☀️ Haab' · ${m.haabName}`, value: m.haab.month === 18 ? "You were born in **Wayeb'**, the five nameless days at the end of the solar year, when the boundary between worlds was thought to be thin. A rare and liminal birth." : `The 365-day solar year: day ${m.haab.day} of **${HAAB[m.haab.month]}**, month ${m.haab.month + 1} of 18 (plus 5 Wayeb' days). Together with your Tzolk'in day it makes your **Calendar Round**, which only repeats every 52 years.` },
      { name: `🏛️ Long Count · ${m.longCount.join(".")}`, value: `Days since the Maya creation date (11 August 3114 BCE): **${m.days.toLocaleString("en-US")}**. Bak'tun ${m.longCount[0]}, k'atun ${m.longCount[1]}, tun ${m.longCount[2]}, winal ${m.longCount[3]}, k'in ${m.longCount[4]}.` },
      { name: `🌙 Lord of the Night · G${m.lord}`, value: `A cycle of nine night lords ran alongside the days; yours is G${m.lord}, ${LORDS[m.lord]}.` },
    ],
    footer: FOOTER,
  };
  const now = {
    title: "⏳ The count today", color: GOLD,
    fields: [
      { name: `Today: ${today.tone} ${today.signName}`, value: `${SIGN_TEXT[today.sign].kw[0][0].toUpperCase() + SIGN_TEXT[today.sign].kw[0].slice(1)} energy with tone ${today.tone} (${TONE_TEXT[today.tone][0].toLowerCase()}). ${today.sign === m.sign ? "It's your own day sign: a good day for things that matter to you." : ""}`.trim() },
      { name: "🎂 Your next Tzolk'in birthday", value: ret === 0 ? "**Today!** Your sacred-calendar birthday comes every 260 days. Traditionally a day for gratitude and intentions." : `In **${ret} day${ret === 1 ? "" : "s"}**. Your day ${m.tone} ${m.signName} comes round every 260 days, about the length of a human pregnancy, and many daykeepers mark it.` },
      { name: "🧪 Your experiment", value: `For one 13-day trecena, note each morning's Tzolk'in day and watch where **${m.signName}** themes (${T.kw[0]}) show up in your life. That's how daykeepers learn the count: by living it.` },
      { name: "📖 About this reading", value: "Dates use the GMT correlation (584283), the one most Maya scholars and highland daykeepers agree with. It follows the traditional count still kept in Guatemala, not the modern 'Dreamspell' calendar, so your sign can differ from Dreamspell sites." },
    ],
    footer: { text: `${FOOTER.text} · reading for ${who}` },
  };
  return [main, cal, now];
}

export async function run(o, ctx = {}) {
  if (!o.date) throw new Error("I need your birth date. Add it, or save it once with /profile set.");
  const b = parseBirth(o.date, "12:00");
  const m = mayaDate(b);
  const nowD = ctx.now || new Date(), t = { year: nowD.getUTCFullYear(), month: nowD.getUTCMonth() + 1, day: nowD.getUTCDate() };
  const today = mayaDate(t), ret = nextKinReturn(m.kin, t);
  const who = ctx.user ? `@${ctx.user}` : "you";
  const png = await cardPng({ title: "Maya Calendar", subtitle: `${m.tone} ${m.signName} · reading for ${who}`, tag: "Tzolk'in · Haab' · Long Count · GMT 584283", body: body(m, today),
    facts: [["Day sign", `${m.tone} ${m.signName}`], ["Kin", `${m.kin} of 260`], ["Haab'", m.haabName], ["Next Tzolk'in birthday", ret === 0 ? "today" : `in ${ret} days`]] });
  return { embeds: readingEmbeds(m, today, ret, { who, birth: b }), files: [{ name: "mayan.png", data: png }], ephemeral: !!o.private, reading: m, headline: `${m.tone} ${m.signName} · kin ${m.kin}` };
}
