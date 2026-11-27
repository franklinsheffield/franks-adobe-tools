// The evidence layer of an astrology reading: the positions as numbers, the element, mode and polarity tallies,
// aspects and orbs, retrogrades and house emphasis, how common each feature is, and what the pattern may mean.
import { PLANETS, NAMES } from "./chart.js";
import { SIGNS } from "../../ephemeris.js";
import { insight, plural, list } from "../../insight.js";

const EL = ["fire", "earth", "air", "water"], MODE = ["cardinal", "fixed", "mutable"];
const EL_M = { fire: "initiative and enthusiasm", earth: "the practical and the tangible", air: "ideas and exchange", water: "feeling and intuition" };
const MODE_M = { cardinal: "starting things", fixed: "sustaining and holding", mutable: "adapting and changing course" };
const RULER = { Aries: "mars", Taurus: "venus", Gemini: "mercury", Cancer: "moon", Leo: "sun", Virgo: "mercury", Libra: "venus", Scorpio: "mars", Sagittarius: "jupiter", Capricorn: "saturn", Aquarius: "saturn", Pisces: "jupiter" };
const RETRO = { mercury: 19, venus: 7, mars: 9, jupiter: 30, saturn: 36, uranus: 41, neptune: 43, pluto: 44 };
const PHASES = ["New Moon", "Waxing Crescent", "First Quarter", "Waxing Gibbous", "Full Moon", "Waning Gibbous", "Last Quarter", "Waning Crescent"];
const PHASE_M = ["beginnings made by instinct", "pushing forward against inertia", "action under tension", "refining and perfecting", "awareness through relationship and contrast", "sharing what has been learned", "re-evaluation and turning inward", "closure before a new cycle"];
const cap = (s) => s[0].toUpperCase() + s.slice(1), dm = (p) => `${Math.floor(p.deg)}°${String(Math.floor((p.deg % 1) * 60)).padStart(2, "0")}'`;

/** c: a chart from castChart. now: true for the current sky (no person), false for a natal chart. */
export function analyse(c, { who, now = false } = {}) {
  const bodies = PLANETS.map((k) => c.get(k)), idx = (p) => SIGNS.indexOf(p.sign);
  const el = EL.map((_, i) => bodies.filter((p) => idx(p) % 4 === i)), mode = MODE.map((_, i) => bodies.filter((p) => idx(p) % 3 === i));
  const yang = bodies.filter((p) => idx(p) % 2 === 0).length;
  const top = (groups) => { const m = Math.max(...groups.map((g) => g.length)); return groups.map((g, i) => (g.length === m ? i : -1)).filter((i) => i >= 0); };
  const eTop = top(el), mTop = top(mode), eNone = EL.filter((_, i) => !el[i].length);
  const retro = bodies.filter((p) => p.retro), sun = c.get("sun"), moon = c.get("moon"), asc = c.cusps ? c.get("asc") : null;
  const bySign = {}; for (const p of bodies) (bySign[p.sign] ||= []).push(p.name);
  const stell = Object.entries(bySign).filter(([, v]) => v.length >= 3);
  const kinds = {}; for (const a of c.aspects) kinds[a.type] = (kinds[a.type] || 0) + 1;
  const hard = (kinds.square || 0) + (kinds.opposition || 0), soft = (kinds.trine || 0) + (kinds.sextile || 0);
  const tight = c.aspects.slice().sort((a, b) => a.orb - b.orb)[0];
  const elong = (((moon.lon - sun.lon) % 360) + 360) % 360, ph = Math.floor(((elong + 22.5) % 360) / 45);
  const byHouse = {}; if (c.cusps) for (const p of bodies) (byHouse[p.house] ||= []).push(p.name);
  const above = c.cusps ? bodies.filter((p) => p.house >= 7).length : 0, angular = c.cusps ? bodies.filter((p) => [1, 4, 7, 10].includes(p.house)).length : 0;
  const hStell = Object.entries(byHouse).filter(([, v]) => v.length >= 3), ruler = asc ? c.get(RULER[asc.sign]) : null;
  const S = now ? "sky" : "chart";

  const data = [
    ["Positions", bodies.map((p) => `${p.name} ${dm(p)} ${p.sign}${p.house ? ` (house ${p.house})` : ""}${p.retro ? " ℞" : ""}`).join(" · ")],
    asc ? ["Angles", `Ascendant ${dm(asc)} ${asc.sign} · Midheaven ${dm(c.get("mc"))} ${c.get("mc").sign} · ${c.system === "placidus" ? "Placidus" : "Whole Sign"} houses`] : null,
    ["Elements (10 bodies)", EL.map((e, i) => `${cap(e)} ${el[i].length}`).join(" · ")],
    ["Modes", MODE.map((m, i) => `${cap(m)} ${mode[i].length}`).join(" · ") + ` · polarity ${yang} outward (fire, air) to ${10 - yang} inward (earth, water)`],
    ["Sun to Moon", `${elong.toFixed(0)}° apart: ${PHASES[ph]}${!now && !c.timeKnown ? " (approximate without a birth time)" : ""}`],
    ["Aspects", c.aspects.length ? `${c.aspects.length} within orb: ${Object.entries(kinds).map(([k, v]) => `${v} ${k}${v > 1 ? "s" : ""}`).join(", ")}. Tightest: ${NAMES[tight.a]} ${tight.symbol} ${NAMES[tight.b]} at ${tight.orb.toFixed(1)}°` : "none within orb"],
    ["Retrograde", retro.length ? retro.map((p) => p.name).join(", ") : "none"],
    c.cusps ? ["Houses", `${above} of 10 bodies above the horizon (houses 7 to 12) · ${angular} in angular houses (1, 4, 7, 10)${ruler ? ` · chart ruler ${ruler.name} in ${ruler.sign}, house ${ruler.house}` : ""}`] : null,
  ].filter(Boolean);

  const patterns = [
    eTop.length === 1 ? `${cap(EL[eTop[0]])} leads the elements with ${el[eTop[0]].length} of 10 (${el[eTop[0]].map((p) => p.name).join(", ")}).${eNone.length ? ` No body is in ${list(eNone)}.` : ""}` : `No single element leads (${EL.map((_, i) => el[i].length).join("/")}).${eNone.length ? ` No body is in ${list(eNone)}.` : ""}`,
    mTop.length === 1 ? `${cap(MODE[mTop[0]])} signs hold ${mode[mTop[0]].length} of 10 bodies. An even spread would be 3 or 4 each.` : `The modes are close to even (${mode.map((g) => g.length).join("/")}).`,
    ...stell.map(([s, v]) => `Stellium: ${v.length} bodies in ${s} (${v.join(", ")}).`),
    ...hStell.map(([h, v]) => `House ${h} holds ${v.length} bodies (${v.join(", ")}).`),
    c.aspects.length ? `Tension aspects (squares, oppositions): ${hard}. Flowing aspects (trines, sextiles): ${soft}. Conjunctions: ${kinds.conjunction || 0}.` : "",
    retro.length ? `${plural(retro.length, "planet")} retrograde. As seen from Earth, ${retro.map((p) => `${p.name} is retrograde about ${RETRO[p.key]}% of the time`).join(", ")}.` : "No planet is retrograde, which is uncommon: each outer planet is retrograde for more than a third of the year.",
    c.cusps ? `${above >= 7 ? "Most bodies sit above the horizon" : above <= 3 ? "Most bodies sit below the horizon" : "Bodies are split between the two hemispheres"} (${above} above, ${10 - above} below).` : now ? "" : "No houses or Ascendant: they need a birth time.",
    `The Moon is ${elong.toFixed(0)}° ahead of the Sun, in the ${PHASES[ph]} part of its monthly cycle.`,
  ];

  const conclusions = [
    now ? `The Sun is in ${sun.sign} and the Moon in ${moon.sign}. Astrologers read that pairing as the day's public tone (${sun.sign}) and its private mood (${moon.sign}); it applies to everyone alive at once.` : `Sun in ${sun.sign}, Moon in ${moon.sign}${asc ? `, ${asc.sign} rising` : ""}: astrology reads these as core identity, emotional needs${asc ? " and outward manner" : ""}. Where the three differ, the person may seem different in public, in private and on first meeting.`,
    eTop.length === 1 ? `An emphasis on ${EL[eTop[0]]} is read as a leaning toward ${EL_M[EL[eTop[0]]]}.${eNone.length ? ` With nothing in ${list(eNone)}, ${list(eNone.map((e) => EL_M[e]))} may be less instinctive and more deliberately learned, or sought in other people.` : ""}` : `With no dominant element the ${S} is read as temperamentally mixed: no single mode of response is automatic.`,
    mTop.length === 1 ? `${cap(MODE[mTop[0]])} emphasis is associated with ${MODE_M[MODE[mTop[0]]]}, which may be the most natural phase of any project${now ? " at the moment" : ""}.` : "",
    stell.length ? `A stellium concentrates attention: ${stell[0][0]} themes may take up a disproportionate share of ${now ? "the moment" : "the life"}.` : "",
    c.aspects.length ? (hard > soft + 1 ? `Tension aspects outnumber flowing ones (${hard} to ${soft}). Astrologers read such ${S}s as dynamic: friction that produces effort and change.` : soft > hard + 1 ? `Flowing aspects outnumber tension ones (${soft} to ${hard}). Astrologers read such ${S}s as fluent: abilities that come easily and may go unexamined.` : `Tension and flow are balanced (${hard} to ${soft}), read as a mix of ease and effort.`) : "",
    tight ? `The tightest aspect, ${NAMES[tight.a]} ${tight.type} ${NAMES[tight.b]} (${tight.orb.toFixed(1)}°), is the one astrologers would weight most: the closer the orb, the louder the theme.` : "",
    retro.some((p) => ["mercury", "venus", "mars"].includes(p.key)) ? `${list(retro.filter((p) => ["mercury", "venus", "mars"].includes(p.key)).map((p) => p.name))} retrograde is read as that planet's function turned inward or working by revision. Retrograde outer planets are too common to say much.` : "",
    `A ${PHASES[ph]} ${now ? "sky" : "birth"} is associated with ${PHASE_M[ph]}.`,
    c.cusps && !now ? (above >= 7 ? "With most bodies above the horizon, the chart is read as oriented toward public and shared life." : above <= 3 ? "With most bodies below the horizon, the chart is read as oriented toward private and inner life." : "") : "",
    ruler && !now ? `The chart ruler, ${ruler.name} in house ${ruler.house}, is read as showing where the life's energy tends to be directed.` : "",
  ];

  const questions = now ? [
    `Does today actually feel like ${EL_M[EL[eTop[0]]]}, or is that only noticeable once it has been suggested?`,
    "The same sky is over everyone. What, if anything, makes this description specific to one person's day?",
    tight ? `What would ${NAMES[tight.a]} ${tight.type} ${NAMES[tight.b]} look like in ordinary events, if it looked like anything?` : "With no aspects in orb, is the day noticeably quieter?",
  ] : [
    `Sun in ${sun.sign} and Moon in ${moon.sign}: which one do close friends describe, and which do strangers?`,
    eNone.length ? `Is ${EL_M[eNone[0]]} really less instinctive, or just less visible?` : `Does the ${eTop.length === 1 ? EL[eTop[0]] : "mixed"} emphasis match how decisions actually get made?`,
    "Which statement above would be easiest to check against real events, and which could never be wrong?",
  ];

  const method = [
    "Positions are geocentric ecliptic longitudes from a real ephemeris (checked against Swiss Ephemeris to under 1 arcminute). Tropical zodiac: signs are 30° slices measured from the March equinox.",
    "Because of precession, tropical signs now sit about 24° away from the constellations they were named for.",
    now ? "Aspect orbs used: 8° for conjunctions and oppositions, 7° for trines and squares, 5° for sextiles, 2.5° for quincunxes (1° wider for Sun and Moon)." : `Sharing a Sun sign: 1 in 12. Sharing Sun, Moon and rising sign together: about 1 in 1,728.${c.timeKnown ? "" : " Without a birth time the Moon may be up to 7° off and houses are omitted."}`,
    "Controlled tests have not found that astrologers can match charts to people better than chance (Carlson, Nature, 1985). The chart is astronomy; the reading is a symbolic tradition.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
