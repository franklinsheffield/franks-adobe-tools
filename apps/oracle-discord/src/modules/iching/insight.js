// The evidence layer of an I Ching reading: the six casts as data, the structural patterns the commentaries look at
// (line correctness, resonance between the trigrams, where the movement sits), and what those may mean.
import { insight, binom, odds, plural } from "../../insight.js";

const KIND = { 6: "old yin, changing", 7: "young yang", 8: "young yin", 9: "old yang, changing" };
const P = { 6: 1 / 8, 7: 3 / 8, 8: 3 / 8, 9: 1 / 8 };
const PLACE = ["1st", "2nd", "3rd", "4th", "5th", "top"];
const list = (a) => (a.length > 1 ? a.slice(0, -1).join(", ") + " and " + a[a.length - 1] : a[0] || "");

export function analyse(r, TRIGRAMS, who) {
  const { values, lines, primary: p, relating: rel, nuclear: nu, changing } = r;
  const yang = values.filter((v) => v === 7 || v === 9).length, yin = 6 - yang;
  const isYang = (v) => v === 7 || v === 9;
  const up = TRIGRAMS[p.upper], lo = TRIGRAMS[p.lower];
  const name = (h) => `${h.number} ${h.text.en}`;
  // Line correctness: yang belongs in places 1, 3, 5 and yin in 2, 4, 6.
  const correct = values.map((v, i) => isYang(v) === (i % 2 === 0));
  const nCorrect = correct.filter(Boolean).length;
  // Resonance: lines 1-4, 2-5, 3-6 answer each other when one is yin and the other yang.
  const pairs = [[0, 3], [1, 4], [2, 5]].filter(([a, b]) => isYang(values[a]) !== isYang(values[b])).map(([a, b]) => `${a + 1}–${b + 1}`);
  const inner = changing.filter((n) => n <= 3).length, outer = changing.length - inner;
  const pExact = values.reduce((a, v) => a * P[v], 1);

  const data = [
    ["Six casts, bottom to top", lines.map((l, i) => `${PLACE[i]} ${l.tosses.map((t) => (t === 3 ? "☀" : "☾")).join("")} = ${l.value} (${KIND[l.value]})`).join(" · ")],
    ["Balance", `${plural(yang, "yang line")}, ${plural(yin, "yin line")}`],
    ["Primary hexagram", `${name(p)}: ${lo.name} (${lo.quality}) below, ${up.name} (${up.quality}) above`],
    ["Changing lines", changing.length ? `${changing.length} of 6: ${list(changing.map((n) => PLACE[n - 1]))}` : "none"],
    ...(rel ? [["Relating hexagram", `${name(rel)} (${rel.text.kw.join(", ")})`]] : []),
    ["Nuclear hexagram", `${name(nu)}, built from lines 2 to 5 (${nu.text.kw.join(", ")})`],
  ];

  const patterns = [
    `${nCorrect} of 6 lines sit in their "correct" place (yang in the 1st, 3rd and 5th, yin in the 2nd, 4th and top).${nCorrect === 6 ? " Only hexagram 63 has all six." : nCorrect === 0 ? " Only hexagram 64 has none." : ""}`,
    pairs.length ? `Resonance between the trigrams: line pair${pairs.length > 1 ? "s" : ""} ${list(pairs)} ${pairs.length > 1 ? "are" : "is"} yin answering yang.` : "No resonance between the trigrams: each lower line meets a line of the same kind above it.",
    `The two central lines: the 2nd is ${isYang(values[1]) ? "yang" : "yin"} and the 5th, the ruler's place, is ${isYang(values[4]) ? "yang" : "yin"}.`,
    p.lower === p.upper ? `The same trigram, ${lo.name}, is doubled: its quality is stated twice.` : `${lo.name} below meets ${up.name} above: ${lo.quality.split(",")[0]} underneath, ${up.quality.split(",")[0]} on top.`,
    changing.length ? `Of the changing lines, ${inner} sit in the lower (inner) trigram and ${outer} in the upper (outer) trigram.` : "With no changing lines there is no second hexagram: the cast shows one picture only.",
  ];

  const conclusions = [];
  if (!changing.length) conclusions.push("A cast with no changing lines is traditionally read as a settled picture. The situation may be holding its shape for now rather than moving.");
  else if (changing.length >= 4) conclusions.push(`${changing.length} of 6 lines are changing, which is uncommon. Tradition reads this as a situation already most of the way to becoming something else, so the relating hexagram may describe it better than the primary one.`);
  else conclusions.push(`With ${plural(changing.length, "changing line")}, most of the picture is stable and the movement is concentrated in ${changing.length === 1 ? "one place" : "a few places"}. Those lines may mark where the question is actually alive.`);
  if (changing.length && inner !== outer) conclusions.push(inner > outer
    ? "The movement sits mostly in the lower trigram, which the commentaries link to the inner side: motives, foundations, early stages. The change may be beginning out of sight."
    : "The movement sits mostly in the upper trigram, which the commentaries link to the outer side: circumstances, other people, later stages. The change may be arriving from outside.");
  conclusions.push(nCorrect >= 5 ? "Nearly every line is in its proper place. That is classically read as roles and natures fitting each other, which may point to a situation that is orderly, perhaps even close to complete."
    : nCorrect <= 1 ? "Almost no line is in its proper place. That is classically read as people or forces standing where they do not naturally belong, which may show up as friction or as unfinished business."
    : `${nCorrect} of 6 lines are in place: a mixed fit. Some parts of the situation may be where they belong while others strain against their position.`);
  if (pairs.includes("2–5")) conclusions.push("Lines 2 and 5 answer each other. The commentaries treat this as the most valuable resonance: understanding between the one doing the work and the one deciding. Support of that kind may be present here.");
  else if (!pairs.length) conclusions.push("Nothing in the lower trigram is answered from above. This may suggest effort that goes unacknowledged for now, or two sides that are not yet in conversation.");
  if (yang >= 5 || yin >= 5) conclusions.push(yang >= 5 ? `${yang} yang lines make this a strongly active figure. The ${plural(yin, "yin line")} may carry unusual weight, as the one receptive point in a field of force.` : `${yin} yin lines make this a strongly receptive figure. The ${plural(yang, "yang line")} may carry unusual weight, as the one firm point everything else gathers around.`);
  if (rel) conclusions.push(`The cast moves from "${p.text.kw[0]}" toward "${rel.text.kw[0]}". One way to read it: the first describes how things stand, the second how they may develop if the changing lines play out.`);
  conclusions.push(`Underneath runs the nuclear hexagram, ${nu.text.en}. Its theme (${nu.text.kw.join(", ")}) may be the less visible driver of the situation.`);

  const questions = [
    `Where in the question does "${p.text.kw[0]}" already describe what is happening?`,
    rel ? `If things are moving toward "${rel.text.kw[0]}", what would the first sign of that look like?` : "If nothing is changing, what is keeping the situation in this shape?",
    `What in the background matches the undercurrent of "${nu.text.kw[0]}"?`,
  ];

  const method = [
    "Each line is three coin tosses. Sun counts 3, moon counts 2, and the total (6 to 9) gives the line: 6 and 9 each come up 1 time in 8, 7 and 8 each 3 times in 8.",
    `This exact cast of six lines: ${odds(pExact)}. Any given primary hexagram: 1 in 64.`,
    `${changing.length ? plural(changing.length, "changing line") : "No changing lines"} in a cast: ${odds(binom(6, changing.length, 1 / 4))}.`,
    `Which text carries the weight follows the rule attributed to Zhu Xi (12th century). ${r.focus.rule}`,
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
