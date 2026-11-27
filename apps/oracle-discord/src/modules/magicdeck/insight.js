// The evidence layer of a Science is Magic deck reading: suits, numbers, Keepers, the odds of the deal,
// and what the pattern may mean.
import { SUITS } from "./data.js";
import { insight, hyper, odds, plural, list } from "../../insight.js";

const fix = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
const STAGE = [["early", "starting conditions and first signals", (v) => v <= 3], ["middle", "process, pressure and adjustment", (v) => v >= 4 && v <= 7], ["late", "outcomes, limits and transformation", (v) => v >= 8]];

export function analyse(cast, sp, who) {
  const cards = cast.map((d) => d.card), n = cards.length;
  const count = SUITS.map((s) => cards.filter((c) => c.suit === s.key).length), max = Math.max(...count), lead = SUITS[count.indexOf(max)], tie = count.filter((c) => c === max).length > 1;
  const absent = SUITS.filter((s, i) => !count[i]), keepers = cards.filter((c) => c.num === "K"), nums = cards.filter((c) => c.num !== "K");
  const stage = STAGE.map(([, , f]) => nums.filter((c) => f(+c.num)).length), sMax = Math.max(...stage), sLead = STAGE[stage.indexOf(sMax)], sTie = stage.filter((c) => c === sMax).length > 1;
  const byNum = {}; for (const c of nums) (byNum[c.num] ||= []).push(c.n);
  const repeats = Object.entries(byNum).filter(([, v]) => v.length > 1);
  const first = cards[0], last = cards[n - 1], suitOf = (c) => SUITS.find((s) => s.key === c.suit);

  const data = [
    ["Drawn", cards.map((c, k) => `${sp.positions[k][0]}: ${c.n} (${suitOf(c).n}, ${c.num === "K" ? "Keeper" : `number ${c.num}`})`).join(" · ")],
    ["Suits", SUITS.map((s, i) => `${s.n} ${count[i]}`).join(" · ") + ` (four suits of 11, so ${fix(n / 4)} each on average)`],
    ["Numbers", `${nums.length ? nums.map((c) => c.num).join(", ") : "none"}${keepers.length ? ` · ${plural(keepers.length, "Keeper")} (${list(keepers.map((c) => c.n))})` : " · no Keepers"}`],
    ["Keywords", cards.map((c) => `${c.n}: ${c.kw.join(", ")}`).join(" · ")],
    ["Science facts on the table", cards.map((c) => c.fact).join(" ")],
  ];

  const patterns = [
    n > 1 ? (tie ? `No suit leads (${count.join("/")}).` : `${lead.n} lead with ${max} of ${n}.${absent.length ? ` Absent: ${list(absent.map((s) => s.n))}.` : ""}`) : "",
    nums.length > 1 ? (sTie ? `Numbers are spread across the 1 to 10 run (${stage.join("/")}).` : `Numbers cluster ${sLead[0]} in the 1 to 10 run (${sMax} of ${nums.length}).`) : "",
    ...repeats.map(([num, names]) => `The number ${num} repeats across suits: ${list(names)}.`),
    keepers.length ? `${plural(keepers.length, "Keeper")} drawn. Each suit has one, so a random draw of ${n} averages ${fix((n * 4) / 44)}.` : "",
    n > 1 ? `The draw opens on "${first.kw[0]}" (${first.n}) and closes on "${last.kw[0]}" (${last.n}).` : "",
  ];

  const conclusions = [
    n > 1 && !tie ? `${lead.n} are this deck's suit of ${lead.theme}. Their weight may mean the question is mostly about that part of life.` : "",
    n > 2 && tie ? "With no suit leading, the draw does not place the question in one area. It may be a question about how several areas fit together." : "",
    absent.length && n >= 3 ? `No ${absent.map((s) => s.n).join(" or ")} appeared (${absent.map((s) => s.theme).join("; ")}). That side may be stable, or it may be the variable not being measured.` : "",
    nums.length > 1 && !sTie ? `${sLead[0][0].toUpperCase() + sLead[0].slice(1)} numbers are associated with ${sLead[1]}. The situation may be at that point in its run.` : "",
    keepers.length ? `Keepers stand for people who hold knowledge of their suit. ${list(keepers.map((c) => c.n))} may point to a mentor, an expert, or that role being taken up.` : "",
    n > 1 ? `Read as a lab report, the draw moves from "${first.kw[0]}" to "${last.kw[0]}". That is one possible account of where the present approach tends, not a forecast.` : `One card gives one variable: ${first.kw.join(", ")}. It may name what the question is really about.`,
    `Each card's science fact is true regardless of the reading. The link between ${last.n} and its fact is an analogy: it may be useful as a way of looking, not as evidence.`,
  ];

  const questions = [
    `Where does "${first.kw[0]}" already show up in the question?`,
    n > 1 ? `What would count as evidence that "${last.kw[0]}" is where this is heading, and what would count against it?` : "What observation would make this card look wrong?",
    absent.length && n >= 3 ? `What is happening with ${absent[0].theme}, the suit that stayed in the deck?` : "Which card fits least well? In a lab, the outlier is the interesting data point.",
  ];

  const method = [
    `${plural(n, "card")} drawn without replacement from 44 (four suits of 1 to 10 plus a Keeper). Any one card appears ${odds(n / 44)}.`,
    n > 1 ? `Chance of exactly ${max} ${lead.n} in ${n} cards: ${odds(hyper(44, 11, n, max))}. Chance of exactly ${plural(keepers.length, "Keeper")}: ${odds(hyper(44, 4, n, keepers.length))}.` : "",
    "This deck is original to Science is Magic (it is not a historical system). Card meanings are metaphors built on the science facts; the draw is random.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
