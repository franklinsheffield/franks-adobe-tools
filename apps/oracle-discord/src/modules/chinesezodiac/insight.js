// The evidence layer of a Chinese zodiac reading: the eight characters themselves, yin and yang, the five-element
// tally, how the branches relate (clash, harmony, trine), the Day Master's support, and what that may mean.
import { ELEMENTS, TRINES, HARMONY, ORDER, clashOf, trineOf } from "./text.js";
import { insight, plural, list } from "../../insight.js";
import { momentRows, momentMethod, span, hm } from "../../moment.js";

const GEN = ["Wood", "Fire", "Earth", "Metal", "Water"]; // each generates the next; each controls the one after that
const gen = (e) => GEN[(GEN.indexOf(e) + 1) % 5], ctl = (e) => GEN[(GEN.indexOf(e) + 2) % 5];
const mother = (e) => GEN[(GEN.indexOf(e) + 4) % 5], master = (e) => GEN[(GEN.indexOf(e) + 3) % 5];
const TERMS = ["Lichun (start of spring)", "Yushui (rain water)", "Jingzhe (insects wake)", "Chunfen (spring equinox)", "Qingming (clear and bright)", "Guyu (grain rain)", "Lixia (start of summer)", "Xiaoman (grain buds)", "Mangzhong (grain in ear)", "Xiazhi (summer solstice)", "Xiaoshu (minor heat)", "Dashu (major heat)", "Liqiu (start of autumn)", "Chushu (end of heat)", "Bailu (white dew)", "Qiufen (autumn equinox)", "Hanlu (cold dew)", "Shuangjiang (frost descends)", "Lidong (start of winter)", "Xiaoxue (minor snow)", "Daxue (major snow)", "Dongzhi (winter solstice)", "Xiaohan (minor cold)", "Dahan (major cold)"];
const num = (v) => (v % 1 ? v.toFixed(1) : String(v));

export function analyse({ z, p, bal, cur, pClock = null, solar = null }, { timeKnown = true, who, moment = null, detail = false } = {}) {
  // What the exact time and place decide: which two-hour watch the birth falls in by the Sun, and how close it sits to a boundary.
  const sm = solar ? solar.hour * 60 + solar.minute : null, inWatch = sm === null ? null : (sm + 60) % 120, watchEdge = inWatch === null ? null : Math.min(inWatch, 120 - inWatch);
  const hourDiffers = !!(pClock && pClock.hour.b !== p.hour.b), dayDiffers = !!(pClock && pClock.day.index !== p.day.index);
  const intoTerm = (((p.sunLon - 315) % 30) + 30) % 30, termEdge = Math.min(intoTerm, 30 - intoTerm) / 0.9856; // days to the nearest month boundary
  const P = [["Year", p.year], ["Month", p.month], ["Day", p.day], ["Hour", p.hour]].filter(([, c]) => c);
  const stems = P.map(([, c]) => c.stem), animals = P.map(([k, c]) => [k, c.branch.animal]);
  const yin = stems.filter((s) => s.yin).length, dm = p.day.stem, total = Object.values(bal).reduce((a, b) => a + b, 0);
  const sorted = Object.entries(bal).sort((a, b) => b[1] - a[1]), zero = sorted.filter(([, v]) => !v).map(([k]) => k);
  const support = bal[dm.el] + bal[mother(dm.el)], share = support / total;
  const pairs = animals.flatMap(([ka, a], i) => animals.slice(i + 1).map(([kb, b]) => [ka, a, kb, b]));
  const clash = pairs.filter(([, a, , b]) => clashOf(a) === b), harm = pairs.filter(([, a, , b]) => HARMONY[a] === b);
  const trine = pairs.filter(([, a, , b]) => a !== b && trineOf(a) === trineOf(b)), same = pairs.filter(([, a, , b]) => a === b);
  const term = TERMS[Math.floor((((p.sunLon - 315) % 360) + 360) % 360 / 15)];
  const a = z.branch.animal, curA = cur.branch.animal, steps = (ORDER.indexOf(curA) - ORDER.indexOf(a) + 12) % 12;
  const rel = (e) => (e === dm.el ? "the Day Master's own element (companions)" : e === mother(dm.el) ? "the element that feeds the Day Master (resource)" : e === gen(dm.el) ? "the element the Day Master feeds (output)" : e === ctl(dm.el) ? "the element the Day Master controls (wealth)" : "the element that controls the Day Master (authority)");
  const pr = (x) => x.map(([ka, a, kb, b]) => `${ka} ${a} and ${kb} ${b}`);

  const data = [
    ...(moment ? momentRows(moment, { detail }) : [["Birth moment", "no birthplace given, so the clock time is read as China Standard Time and true solar time cannot be worked out"]]),
    solar ? ["Hour pillar basis", `true solar time${detail ? ` ${hm(solar)}` : ""} falls in the ${p.hour.branch.animal} hour (${p.hour.branch.hours}), ${span(inWatch)} after it began and ${span(120 - inWatch)} before the next · ${hourDiffers ? `the clock time alone would give the ${pClock.hour.branch.animal} hour` : "the clock time gives the same hour"}${dayDiffers ? " and a different day pillar" : ""}`] : null,
    ["Month pillar basis", `the Sun was ${intoTerm.toFixed(1)}° into the ${p.month.branch.animal} month (it changes every 30°), about ${termEdge.toFixed(1)} days from the nearest boundary`],
    ["The characters", P.map(([k, c]) => `${k} ${c.stem.hz}${c.branch.hz} (${c.stem.yin ? "yin" : "yang"} ${c.stem.el} over ${c.branch.animal}, ${c.branch.el})`).join(" · ") + (timeKnown ? "" : " · hour unknown")],
    ["Cycle position", `year ${z.index + 1} of 60 · day ${p.day.index + 1} of 60 · Sun at ${p.sunLon.toFixed(1)}° of the ecliptic, in the solar term ${term}`],
    ["Yin and yang (stems)", `${yin} yin · ${stems.length - yin} yang`],
    ["Five elements", sorted.map(([k, v]) => `${k} ${num(v)} (${Math.round((v / total) * 100)}%)`).join(" · ")],
    ["Day Master", `${dm.hz} ${dm.yin ? "yin" : "yang"} ${dm.el}; supported by ${num(support)} of ${num(total)} points (${Math.round(share * 100)}%: ${dm.el} plus ${mother(dm.el)})`],
    null,
    ["This year", `${cur.lunarYear} is a ${cur.stem.el} ${curA} year, ${steps === 0 ? "the same animal as the birth year" : `${plural(steps, "sign")} on from the ${a}`}; ${cur.stem.el} is ${rel(cur.stem.el)}`],
  ].filter(Boolean);

  const patterns = [
    yin === stems.length || yin === 0 ? `All ${stems.length} stems are ${yin ? "yin" : "yang"}.` : `Stems split ${yin} yin to ${stems.length - yin} yang.`,
    `${sorted[0][0]} is the heaviest element and ${zero.length ? `${list(zero)} ${zero.length > 1 ? "are" : "is"} absent` : `${sorted[4][0]} the lightest`}. An even chart would give each element 20%.`,
    `In the five-element cycle ${mother(dm.el)} feeds ${dm.el}, ${dm.el} feeds ${gen(dm.el)}, ${dm.el} controls ${ctl(dm.el)}, and ${master(dm.el)} controls ${dm.el}.`,
    clash.length ? `Clash (signs six apart): ${pr(clash).join("; ")}.` : "No two branches in the chart clash.",
    harm.length ? `Six-harmony pair: ${pr(harm).join("; ")}.` : "",
    trine.length ? `Same trine: ${pr(trine).join("; ")}.` : "",
    same.length ? `Repeated animal: ${pr(same).join("; ")}.` : "",
    p.year.b !== z.b ? `Born between the solar new year (Lichun) and the lunar new year: the popular animal is the ${a}, the pillar animal is the ${p.year.branch.animal}.` : "",
    solar ? (hourDiffers || dayDiffers ? `Clock time and true solar time disagree here: by the Sun the hour is ${p.hour.branch.animal}, by the clock ${pClock.hour.branch.animal}${dayDiffers ? ", and the day pillar changes too" : ""}. The chart above uses the Sun.` : "Clock time and true solar time give the same hour and day pillars, so the chart does not depend on which convention is used.") : "",
    watchEdge !== null && watchEdge <= 15 ? `The birth is ${span(watchEdge)} from the edge of its two-hour watch. Birth times are often rounded to the quarter hour, so the hour pillar is uncertain.` : "",
    termEdge < 1 ? `The birth falls within a day of a solar term, where the month pillar changes. The exact time decides which month it belongs to.` : "",
    !timeKnown ? "With no birth time there is no hour pillar: six characters instead of eight, and the element balance leaves out a quarter of the chart. Year, month and day pillars stand, unless the birth was near 23:00, when the day changes." : "",
  ];

  const conclusions = [
    `The Day Master is ${dm.yin ? "yin" : "yang"} ${dm.el} (${ELEMENTS[dm.el].kw}). BaZi treats this stem as the person and reads everything else in relation to it.`,
    share >= 0.5 ? `Support for the Day Master is high (${Math.round(share * 100)}%). Classical readers would call this a strong ${dm.el} chart, which may show as self-reliance and persistence, and tradition says such charts are balanced by ${gen(dm.el)} and ${ctl(dm.el)} (output and wealth).`
      : share <= 0.3 ? `Support for the Day Master is low (${Math.round(share * 100)}%). Classical readers would call this a weak ${dm.el} chart, which may show as adaptability and sensitivity to surroundings, and tradition says such charts are balanced by ${mother(dm.el)} and ${dm.el} (resource and companions).`
      : `Support for the Day Master is moderate (${Math.round(share * 100)}%), neither clearly strong nor weak. Classical readers treat such charts as flexible, with timing mattering more than the natal balance.`,
    `${sorted[0][0]} dominates (${ELEMENTS[sorted[0][0]].kw}) and is ${rel(sorted[0][0])}, so those qualities may be the most available.`,
    zero.length ? `${list(zero)} is absent (${zero.map((k) => ELEMENTS[k].kw).join("; ")}). Tradition reads an absent element as a quality that is sought from outside: from people, places or work.` : `${sorted[4][0]} is the lightest element (${ELEMENTS[sorted[4][0]].kw}); tradition reads that as the quality least automatic in the chart.`,
    clash.length ? `A clash between ${pr(clash)[0]} is read as tension between those areas of life (year: family and background; month: work and parents; day: self and partner; hour: later life and children). Tension here means movement, not misfortune.` : harm.length || trine.length ? "Harmonies and trines between pillars are read as areas of life that cooperate with little effort." : "With no clash, harmony or trine among the branches, the pillars may operate fairly independently of each other.",
    steps === 6 ? `${cur.lunarYear} is the clash year for the ${a}. Tradition reads a clash year as one of change and relocation rather than of harm.` : steps === 0 ? `${cur.lunarYear} is the ${a}'s own year (ben ming nian), traditionally treated as a year of heightened sensitivity.` : `The ${cur.stem.el} ${curA} year brings ${rel(cur.stem.el).split(" (")[0]}, which may colour the year toward ${rel(cur.stem.el).match(/\((.+)\)/)[1]} themes.`,
  ];

  const questions = [
    `Does "${ELEMENTS[dm.el].kw.split(", ")[0]}" describe the way decisions actually get made here?`,
    `Where does ${zero[0] || sorted[4][0]} (${ELEMENTS[zero[0] || sorted[4][0]].kw.split(", ")[0]}) come from at the moment: self, other people, or nowhere?`,
    timeKnown ? "Which pillar feels most accurate, and which least? Disagreement with the chart is data too." : "Would knowing the birth hour change the element balance enough to change the reading?",
  ];

  const method = [
    "Year, month and hour pillars follow the Sun (solar terms, computed from real ephemeris); the day pillar is a continuous 60-day count unbroken for over 2,000 years. The day changes at 23:00.",
    "The element tally counts each stem as 1 and each branch by its hidden stems. Other schools weight the month branch more heavily, which can change the strong or weak verdict.",
    "There are 60 × 12 × 60 × 12 = 518,400 possible four-pillar charts. One person in 12 shares the year animal; about one in 60 shares the same year stem and animal.",
    ...(moment ? [momentMethod(moment), "Here the two-hour watches are counted in true solar time at the birthplace (a common practice; some schools keep clock time), so the longitude and the date both matter: a clock can run more than an hour away from the Sun under daylight time or in a wide time zone."] : []),
    "No controlled study supports BaZi as a predictor of character or events. It is a symbolic language with an internally consistent grammar.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
