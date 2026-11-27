// The evidence layer of a Maya calendar reading: the interlocking counts as numbers, how the cycles mesh,
// when they next return, how common each position is, and what the day may mean.
import { SIGNS, HAAB } from "./calendar.js";
import { SIGN_TEXT, TONE_TEXT } from "./text.js";
import { insight, plural } from "../../insight.js";
import { momentRows, momentMethod, DATE_ONLY_ROW, ord } from "../../moment.js";

const n = (x) => x.toLocaleString("en-US");

export function analyse(m, today, ret, who, { moment = null, reck = null, detail = false, alt = null } = {}) {
  const other = alt && (alt.sunset || alt.sunrise), nm = (x) => `${x.tone} ${x.signName}`;
  const T = SIGN_TEXT[m.sign], [tn, tt] = TONE_TEXT[m.tone], lived = today.days - m.days;
  const rounds = Math.floor(lived / 260), crLeft = 18980 - (lived % 18980), crAge = Math.round((lived + crLeft) / 365.2425);
  const katunLeft = 7200 - (today.days % 7200), signGap = (today.sign - m.sign + 20) % 20, toneGap = today.tone - m.tone;
  const wayeb = m.haab.month === 18;

  const data = [
    ...(moment ? momentRows(moment, { detail }).filter(([k]) => k !== "True solar time") : [DATE_ONLY_ROW]),
    reck ? ["Day boundary", `born ${reck.part} · ${other ? (alt.sunset ? `counted from sunset, the birth belongs to the next day, ${nm(alt.sunset)}` : `counted from sunrise, the birth still belongs to the previous day, ${nm(alt.sunrise)}`) : "midnight, sunrise and sunset counting all give the same day"}`] : null,
    ["Tzolk'in", `tone ${m.tone} of 13 · sign ${m.sign + 1} of 20 (${m.signName}) · kin ${m.kin} of 260`],
    ["Haab'", `${m.haabName}: day ${m.haab.month * 20 + m.haab.day + 1} of 365${wayeb ? ", in the 5-day Wayeb'" : `, month ${m.haab.month + 1} of 18`}`],
    ["Long Count", `${m.longCount.join(".")} = ${n(m.days)} days after the era date (11 August 3114 BCE)`],
    ["Other cycles", `Lord of the Night G${m.lord} of 9 · day ${m.dayInTrecena} of the trecena that opened on 1 ${SIGNS[m.trecenaSign]} · direction ${m.direction[0]} (${m.direction[1]})`],
    ["Days lived", `${n(lived)} days = ${rounds} full Tzolk'in rounds plus ${lived % 260} days`],
    ["Today", `${today.tone} ${today.signName}, kin ${today.kin}; ${ret === 0 ? "the birth kin returns today" : `the birth kin returns in ${plural(ret, "day")}`}`],
  ].filter(Boolean);

  const patterns = [
    `Kin ${m.kin} is the only day in the 260 where tone ${m.tone} meets ${m.signName}: 13 and 20 share no factor, so every pairing occurs exactly once.`,
    `The Tzolk'in (260) and Haab' (365) realign every 18,980 days, the Calendar Round. This one next returns in ${n(crLeft)} days, at about age ${crAge}.`,
    `Tone ${m.tone} sits in the ${m.tone <= 4 ? "opening" : m.tone <= 9 ? "middle" : "closing"} part of its 13-day week; the week belongs to ${SIGNS[m.trecenaSign]}.`,
    `${m.signName} is one of five signs assigned to the ${m.direction[0]} (${[0, 1, 2, 3, 4].map((k) => SIGNS[(m.sign % 4) + k * 4]).join(", ")}).`,
    signGap === 0 ? `Today carries the same day sign, ${m.signName}${toneGap ? "" : ", and the same tone"}.` : `Today's sign, ${today.signName}, is ${plural(signGap, "sign")} on from ${m.signName} in the cycle of 20.`,
    `The current k'atun (a 7,200-day period) ends in ${n(katunLeft)} days.`,
    other ? `The birth was ${reck.part}, so the day sign depends on when a day is taken to begin: ${nm(m)} by the civil date, ${nm(other)} if the day turns at ${alt.sunset ? "sunset" : "sunrise"}.` : reck ? "The birth was in daylight, so the day sign is the same whichever way the day is counted." : "",
    moment && !moment.timeKnown ? "With no birth time, the civil date is used. A night birth could belong to the neighbouring day sign under sunrise or sunset counting." : "",
  ];

  const conclusions = [
    `${m.signName} means "${T.meaning}" and is associated with ${T.kw.join(", ")}. Daykeepers read the birth sign as a temperament, so these may be the themes a person meets most easily.`,
    `Tone ${m.tone} (${tn}) is ${tt}. The tone is read as the manner in which the sign acts: here, ${T.kw[0]} that may show itself through ${tn.toLowerCase()}.`,
    m.trecenaSign === m.sign ? `The birth day opens its own trecena, so sign and week agree: tradition reads this as an undiluted ${m.signName}.` : `The birth week belongs to ${SIGNS[m.trecenaSign]} (${SIGN_TEXT[m.trecenaSign].kw.join(", ")}), which may add a background theme behind the day sign.`,
    wayeb ? "A Wayeb' birth falls in the five days outside the eighteen named months. These days were treated as a threshold, which later readers take as a mark of an unusual or in-between character." : `In the solar year the birth falls in ${HAAB[m.haab.month]}, which fixes the season. The Haab' is a farming and civic calendar and carries less personal meaning than the Tzolk'in.`,
    `The ${m.direction[0]} (${m.direction[1]}) is ${{ East: "the direction of sunrise and beginnings", North: "the direction of ancestors and clarity", West: "the direction of sunset and transformation", South: "the direction of growth and abundance" }[m.direction[0]]}, which may tint how the sign's themes are read.`,
    ret === 0 ? "Today is the Tzolk'in birthday. It is traditionally marked as a day of renewal for the person." : `${today.tone} ${today.signName} today brings ${SIGN_TEXT[today.sign].kw[0]} themes; against a ${m.signName} birth that may read as ${signGap % 4 === 0 ? "a familiar register (same direction)" : "a contrasting register (different direction)"}.`,
  ];

  if (other) conclusions.push(`A night birth sits between two day signs. ${other.signName} ("${SIGN_TEXT[other.sign].meaning}": ${SIGN_TEXT[other.sign].kw.join(", ")}) may be worth reading beside ${m.signName}, to see which description fits better.`);

  const questions = [
    `Where does "${T.kw[0]}" show up without effort, and where does it take work?`,
    `Does ${tn.toLowerCase()} describe the way things usually get done here, or the way they could be?`,
    "A 260-day count gives the same sign to one person in 20. What in this description would not fit most people?",
  ];

  const method = [
    "Every figure is counted in whole days from the Julian Day Number using the GMT correlation (584283), which matches the count still kept by K'iche' daykeepers in Guatemala.",
    `Sharing a Tzolk'in day: 1 in 260. Sharing sign only: 1 in 20. Sharing tone only: 1 in 13. Sharing the full Calendar Round day: 1 in 18,980.`,
    "260 = 13 × 20. Proposed origins include the length of human pregnancy, the interval between zenith passages of the Sun near 15° N, and the maize cycle; scholars have not settled it.",
    ...(moment ? ["When the Maya day began is not settled: sunrise, sunset and midnight have each been argued, and practice may have differed by period and place. The reading uses the civil date and names the alternative for a night birth.", momentMethod(moment)] : []),
    "The Long Count and Tzolk'in dates are historically secure. Personality readings of the signs are living tradition and modern interpretation, not something the Classic inscriptions spell out.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
