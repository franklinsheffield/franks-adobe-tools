// The evidence layer of a Chinese zodiac reading: the eight characters themselves, yin and yang, the five-element
// tally, how the branches relate (clash, harmony, trine), the Day Master's support, and what that may mean.
import { ELEMENTS, TRINES, HARMONY, ORDER, clashOf, trineOf } from "./text.js";
import { insight, plural, list } from "../../insight.js";

const GEN = ["Wood", "Fire", "Earth", "Metal", "Water"]; // each generates the next; each controls the one after that
const gen = (e) => GEN[(GEN.indexOf(e) + 1) % 5], ctl = (e) => GEN[(GEN.indexOf(e) + 2) % 5];
const mother = (e) => GEN[(GEN.indexOf(e) + 4) % 5], master = (e) => GEN[(GEN.indexOf(e) + 3) % 5];
const TERMS = ["Lichun (start of spring)", "Yushui (rain water)", "Jingzhe (insects wake)", "Chunfen (spring equinox)", "Qingming (clear and bright)", "Guyu (grain rain)", "Lixia (start of summer)", "Xiaoman (grain buds)", "Mangzhong (grain in ear)", "Xiazhi (summer solstice)", "Xiaoshu (minor heat)", "Dashu (major heat)", "Liqiu (start of autumn)", "Chushu (end of heat)", "Bailu (white dew)", "Qiufen (autumn equinox)", "Hanlu (cold dew)", "Shuangjiang (frost descends)", "Lidong (start of winter)", "Xiaoxue (minor snow)", "Daxue (major snow)", "Dongzhi (winter solstice)", "Xiaohan (minor cold)", "Dahan (major cold)"];
const num = (v) => (v % 1 ? v.toFixed(1) : String(v));

export function analyse({ z, p, bal, cur }, { timeKnown = true, who } = {}) {
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
    ["The characters", P.map(([k, c]) => `${k} ${c.stem.hz}${c.branch.hz} (${c.stem.yin ? "yin" : "yang"} ${c.stem.el} over ${c.branch.animal}, ${c.branch.el})`).join(" · ") + (timeKnown ? "" : " · hour unknown")],
    ["Cycle position", `year ${z.index + 1} of 60 · day ${p.day.index + 1} of 60 · Sun at ${p.sunLon.toFixed(1)}° of the ecliptic, in the solar term ${term}`],
    ["Yin and yang (stems)", `${yin} yin · ${stems.length - yin} yang`],
    ["Five elements", sorted.map(([k, v]) => `${k} ${num(v)} (${Math.round((v / total) * 100)}%)`).join(" · ")],
    ["Day Master", `${dm.hz} ${dm.yin ? "yin" : "yang"} ${dm.el}; supported by ${num(support)} of ${num(total)} points (${Math.round(share * 100)}%: ${dm.el} plus ${mother(dm.el)})`],
    ["This year", `${cur.lunarYear} is a ${cur.stem.el} ${curA} year, ${steps === 0 ? "the same animal as the birth year" : `${plural(steps, "sign")} on from the ${a}`}; ${cur.stem.el} is ${rel(cur.stem.el)}`],
  ];

  const patterns = [
    yin === stems.length || yin === 0 ? `All ${stems.length} stems are ${yin ? "yin" : "yang"}.` : `Stems split ${yin} yin to ${stems.length - yin} yang.`,
    `${sorted[0][0]} is the heaviest element and ${zero.length ? `${list(zero)} ${zero.length > 1 ? "are" : "is"} absent` : `${sorted[4][0]} the lightest`}. An even chart would give each element 20%.`,
    `In the five-element cycle ${mother(dm.el)} feeds ${dm.el}, ${dm.el} feeds ${gen(dm.el)}, ${dm.el} controls ${ctl(dm.el)}, and ${master(dm.el)} controls ${dm.el}.`,
    clash.length ? `Clash (signs six apart): ${pr(clash).join("; ")}.` : "No two branches in the chart clash.",
    harm.length ? `Six-harmony pair: ${pr(harm).join("; ")}.` : "",
    trine.length ? `Same trine: ${pr(trine).join("; ")}.` : "",
    same.length ? `Repeated animal: ${pr(same).join("; ")}.` : "",
    p.year.b !== z.b ? `Born between the solar new year (Lichun) and the lunar new year: the popular animal is the ${a}, the pillar animal is the ${p.year.branch.animal}.` : "",
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
    "No controlled study supports BaZi as a predictor of character or events. It is a symbolic language with an internally consistent grammar.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
