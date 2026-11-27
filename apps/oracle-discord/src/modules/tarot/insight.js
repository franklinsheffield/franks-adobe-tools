// The evidence layer of a tarot reading: what was dealt, how the deck's structure shows up in it (arcana, suits,
// ranks, reversals), how likely that was, and what the pattern may mean.
import { SUITS } from "./data.js";
import { insight, binom, hyper, odds, plural, list } from "../../insight.js";

const STAGE = [["opening", "beginnings, first steps and raw potential", (v) => v <= 3], ["middle", "effort, testing and adjustment", (v) => v >= 4 && v <= 7], ["closing", "results, limits and completion", (v) => v >= 8 && v <= 10]];
const fix = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));
const atLeast = (f, k, n) => { let p = 0; for (let i = k; i <= n; i++) p += f(i); return p; };

export function analyse(cast, sp, who) {
  const n = cast.length, cards = cast.map((d) => d.card);
  const majors = cast.filter((d) => d.card.arcana === "major"), minors = cast.filter((d) => d.card.arcana === "minor"), revs = cast.filter((d) => d.rev);
  const count = SUITS.map((s) => cards.filter((c) => c.suit === s.key).length);
  const max = Math.max(...count), lead = SUITS[count.indexOf(max)], tie = count.filter((c) => c === max).length > 1;
  const absent = SUITS.filter((s, i) => !count[i]);
  const pips = minors.filter((d) => /^\d+$/.test(d.card.num)), courts = minors.filter((d) => !/^\d+$/.test(d.card.num));
  const stage = STAGE.map(([, , f]) => pips.filter((d) => f(+d.card.num)).length);
  const sMax = Math.max(...stage), sLead = STAGE[stage.indexOf(sMax)], sTie = stage.filter((c) => c === sMax).length > 1;
  const byRank = {}; for (const d of minors) (byRank[d.card.rank] ||= []).push(d.card.n);
  const repeats = Object.entries(byRank).filter(([, v]) => v.length > 1);
  const first = cast[0], last = cast[n - 1];
  const expMaj = (n * 22) / 78, expRev = n / 3;

  const data = [
    ["Dealt", cast.map((d, k) => `${sp.positions[k][0]}: ${d.card.n} (${d.card.arcana === "major" ? `Major ${d.card.num}` : `${SUITS.find((s) => s.key === d.card.suit).el}, ${/^\d+$/.test(d.card.num) ? `number ${d.card.num}` : "court"}`}, ${d.rev ? "reversed" : "upright"})`).join(" · ")],
    ["Arcana", `${majors.length} Major · ${minors.length} Minor (a random deal of ${n} averages ${fix(expMaj)} Major)`],
    n > 1 || minors.length ? ["Suits", SUITS.map((s, i) => `${s.n} (${s.el}) ${count[i]}`).join(" · ")] : null,
    minors.length ? ["Ranks", `${plural(pips.length, "number card")}${pips.length ? ` (${pips.map((d) => d.card.num).join(", ")})` : ""} · ${plural(courts.length, "court card")}${courts.length ? ` (${courts.map((d) => d.card.n).join(", ")})` : ""}`] : null,
    ["Orientation", `${revs.length} of ${n} reversed (this deck reverses 1 card in 3, so about ${fix(expRev)} expected)`],
    ["Keywords", cast.map((d) => `${d.card.n}: ${d.card.kw.join(", ")}`).join(" · ")],
  ].filter(Boolean);

  const patterns = [];
  if (n > 1) patterns.push(majors.length > expMaj + 0.5 ? `Major Arcana are over-represented: ${majors.length} dealt against ${fix(expMaj)} expected.` : majors.length < expMaj - 0.5 ? `Major Arcana are under-represented: ${majors.length} dealt against ${fix(expMaj)} expected.` : `Major Arcana appear about as often as chance predicts (${majors.length} against ${fix(expMaj)}).`);
  if (minors.length > 1) patterns.push(tie ? `No suit leads among the Minor cards (${count.join("/")}).` : `${lead.n} lead with ${max} of ${plural(minors.length, "Minor card")}.${absent.length ? ` Absent: ${absent.map((s) => `${s.n} (${s.el})`).join(", ")}.` : ""}`);
  if (pips.length > 1) patterns.push(sTie ? `Number cards are spread across the sequence (1 to 3: ${stage[0]}, 4 to 7: ${stage[1]}, 8 to 10: ${stage[2]}).` : `Number cards cluster in the ${sLead[0]} third of the 1 to 10 sequence (${sMax} of ${pips.length}).`);
  for (const [rank, names] of repeats) patterns.push(`The rank ${rank} repeats: ${names.join(" and ")}.`);
  if (courts.length > 1) patterns.push(`${courts.length} court cards were dealt. Courts are traditionally read as people or as roles being played.`);
  if (n > 1) patterns.push(`The spread opens on "${first.card.kw[0]}" (${first.card.n}${first.rev ? ", reversed" : ""}) and closes on "${last.card.kw[0]}" (${last.card.n}${last.rev ? ", reversed" : ""}).`);
  if (n > 2 && revs.length && revs.length < n) patterns.push(`Reversed cards sit in: ${cast.map((d, k) => (d.rev ? sp.positions[k][0] : "")).filter(Boolean).join(", ")}.`);

  const conclusions = [];
  if (n > 1) conclusions.push(majors.length === 0 ? "With no Major Arcana, tradition reads the matter as everyday in scale: circumstances, habits and choices rather than turning points."
    : majors.length >= Math.ceil(n / 2) ? `Half or more of the spread is Major Arcana (${majors.map((d) => d.card.n).join(", ")}). Tradition reads Majors as larger themes and life chapters, so the question may be about more than the immediate situation.`
    : `${list(majors.map((d) => d.card.n))} ${majors.length > 1 ? "carry" : "carries"} the larger theme, while the Minor cards describe how it plays out day to day.`);
  if (minors.length > 1 && !tie) conclusions.push(`${lead.n} belong to ${lead.el} and are associated with ${lead.theme}. Their weight here may mean the question is being lived mostly on that level.`);
  if (minors.length > 1 && tie && n > 2) conclusions.push("With no suit in the lead, the reading does not locate the question in one area of life. It may touch several at once.");
  if (absent.length && minors.length >= 3) conclusions.push(`No ${absent.map((s) => s.n).join(" or ")} appeared (${absent.map((s) => s.theme).join("; ")}). That may mean this side is settled, or that it is the part of the picture getting least attention.`);
  if (pips.length > 1 && !sTie) conclusions.push(`Numbers in the ${sLead[0]} third are associated with ${sLead[1]}. The situation may be at that stage of its cycle.`);
  conclusions.push(revs.length === 0 ? "Every card landed upright. Read traditionally, the qualities shown are expressed outwardly and without much obstruction."
    : revs.length === n ? (n === 1 ? `${last.card.n} landed reversed. Tradition reads a reversal as the card's quality blocked, delayed or turned inward: here, "${last.card.kw[0]}" may be present but not flowing.` : "Every card landed reversed. Tradition reads reversals as qualities blocked, delayed or turned inward, so the picture may be one of energy held in rather than absent.")
    : `${list(revs.map((d) => d.card.n))} landed reversed. Those themes (${revs.map((d) => d.card.kw[0]).join(", ")}) may be where things are internal, delayed or meeting resistance, while the upright cards show what is moving openly.`);
  if (n > 1) conclusions.push(last.rev ? `The final position (${sp.positions[n - 1][0]}) holds a reversed card. Tradition tends to read that as an outcome not yet settled rather than a fixed one.` : `The final position (${sp.positions[n - 1][0]}) holds ${last.card.n} upright. If the earlier positions hold, "${last.card.kw[0]}" may describe where the present course tends.`);

  const questions = [
    n > 1 ? `What connects "${first.card.kw[0]}" at the start to "${last.card.kw[0]}" at the end?` : `Where does "${first.card.kw[0]}" already show up in the question?`,
    revs.length ? `Is ${revs[0].card.n}'s theme (${revs[0].card.kw[0]}) missing, or present but turned inward?` : absent.length && minors.length >= 3 ? `What role do ${absent[0].theme} play here, given that no ${absent[0].n} appeared?` : "Does the situation feel as unobstructed as the cards show it?",
    n > 1 ? "Which card fits least well? The misfit is often the most informative part of a spread." : "Would a second card change the picture, or only add detail?",
  ];

  const method = [
    `${plural(n, "card")} dealt without replacement from a shuffled deck of 78 (22 Major, 56 Minor). Any one card appears in this spread ${odds(n / 78)}.`,
    n > 1 ? `Chance of ${majors.length} or more Major Arcana in ${n} cards: ${odds(atLeast((i) => hyper(78, 22, n, i), majors.length, Math.min(n, 22)))}.` : "",
    `Each card reverses with probability 1/3: exactly ${revs.length} of ${n} happens ${odds(binom(n, revs.length, 1 / 3))}.`,
    "Meanings follow the Rider-Waite-Smith tradition (1909) as usually taught. The cards are a prompt for reflection; the deal is random and carries no information about the future.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
