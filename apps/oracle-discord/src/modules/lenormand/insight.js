// The evidence layer of a Lenormand reading: the cards and their numbers, the playing-card insets, the balance of
// kind and hard cards, how likely that was, and what the sentence may mean.
import { CARDS } from "./data.js";
import { insight, hyper, odds, plural, list } from "../../insight.js";

const SUIT = { h: ["Hearts", "feeling, home and relationships"], d: ["Diamonds", "luck, money and risk"], s: ["Spades", "plans, distance and formal matters"], c: ["Clubs", "trouble, work and effort"] };
const ALL = { pos: CARDS.filter((c) => c.tone > 0).length, neg: CARDS.filter((c) => c.tone < 0).length };
const fix = (x) => (Number.isInteger(x) ? String(x) : x.toFixed(1));

export function analyse(cast, key, sp, who) {
  const cards = cast.map((d) => d.card), n = cards.length;
  const pos = cards.filter((c) => c.tone > 0), neg = cards.filter((c) => c.tone < 0), neu = cards.filter((c) => c.tone === 0), net = pos.length - neg.length;
  const suits = Object.keys(SUIT).map((k) => [k, cards.filter((c) => c.pc[1] === k).length]);
  const max = Math.max(...suits.map((s) => s[1])), lead = suits.find((s) => s[1] === max)[0], tie = suits.filter((s) => s[1] === max).length > 1;
  const courts = cards.filter((c) => "JQK".includes(c.pc[0])), aces = cards.filter((c) => c.pc[0] === "A");
  const core = key === "square" ? cards[4] : cards[key === "line" ? 1 : 0], first = cards[0], last = cards[n - 1];
  const runs = cards.slice(0, -1).map((c, i) => [c, cards[i + 1]]).filter(([a, b]) => Math.abs(a.num - b.num) === 1);
  const expPos = (n * ALL.pos) / 36, expNeg = (n * ALL.neg) / 36;

  const data = [
    ["Dealt", cards.map((c, k) => `${key === "square" ? k + 1 : sp.positions[k][0]}: ${c.n} (card ${c.num} of 36, inset ${c.pc[0]} of ${SUIT[c.pc[1]][0]}, ${c.tone > 0 ? "kind" : c.tone < 0 ? "hard" : "neutral"})`).join(" · ")],
    ["Tone", `${pos.length} kind · ${neu.length} neutral · ${neg.length} hard (net ${net > 0 ? "+" : ""}${net}; a random deal of ${n} averages ${fix(expPos)} kind and ${fix(expNeg)} hard)`],
    ["Playing-card insets", suits.map(([k, c]) => `${SUIT[k][0]} ${c}`).join(" · ") + (courts.length ? ` · ${plural(courts.length, "court card")}` : "") + (aces.length ? ` · ${plural(aces.length, "ace")}` : "")],
    ["As a sentence", cards.slice(0, -1).map((c, i) => `${c.noun} ${cards[i + 1].mod}`).slice(0, key === "square" ? 0 : 4).join("; ") || `rows read left to right; centre card ${core.n}`],
  ];

  const patterns = [
    `The deck holds ${ALL.pos} kind, ${36 - ALL.pos - ALL.neg} neutral and ${ALL.neg} hard cards. This deal is ${net > expPos - expNeg + 0.75 ? "kinder than" : net < expPos - expNeg - 0.75 ? "harder than" : "close to"} the average draw.`,
    n > 2 ? (tie ? "No inset suit leads." : `${SUIT[lead][0]} insets lead with ${max} of ${n}.`) : "",
    courts.length ? `Court insets (${list(courts.map((c) => `${c.n}: ${c.pc[0]} of ${SUIT[c.pc[1]][0]}`))}) are traditionally read as people in the story.` : "",
    runs.length ? `Consecutive deck numbers sit side by side: ${list(runs.map(([a, b]) => `${a.n} (${a.num}) and ${b.n} (${b.num})`))}.` : "",
    key === "square" ? `${core.n} sits in the centre of the square, touching every row and column. The corners are ${list([0, 2, 6, 8].map((i) => cards[i].n))}.` : n > 2 ? `${core.n} is the middle card, so both neighbours modify it.` : `${first.n} is the subject and ${last.n} describes it.`,
    neg.length && pos.length ? `Hard cards (${list(neg.map((c) => c.n))}) sit ${neg.includes(last) ? "at the end of the line" : neg.includes(first) ? "at the start of the line" : "inside the line"}; kind cards: ${list(pos.map((c) => c.n))}.` : "",
  ];

  const conclusions = [
    net >= 2 ? `Kind cards outnumber hard ones by ${net}. Tradition would call this a favourable line, with the hard notes${neg.length ? ` (${list(neg.map((c) => c.kw[0]))})` : ""} read as conditions rather than obstacles.`
      : net <= -2 ? `Hard cards outnumber kind ones by ${-net}. Tradition would read the line as describing difficulty (${list(neg.map((c) => c.kw[0]))}) as part of the picture; it describes, it does not forbid.`
      : "Kind and hard cards are roughly balanced. Tradition reads a mixed line as an outcome that depends on which card's theme ends up carrying more weight.",
    `${core.n} (${core.kw.join(", ")}) is the grammatical centre. Whatever else the cards say, they may be saying it about ${core.noun}.`,
    !tie && n > 2 ? `${SUIT[lead][0]} are associated with ${SUIT[lead][1]}, which may be the register the story is told in.` : "",
    n > 1 ? `Lenormand reads left to right, so the last card colours the whole: ending on ${last.n} may mean the story tends toward "${last.kw[0]}".` : "",
    neg.includes(last) && pos.length ? "A hard card in the last position after kinder ones is traditionally read as a complication arriving late, not as the earlier cards being cancelled." : pos.includes(last) && neg.length ? "A kind card in the last position after harder ones is traditionally read as the difficulty resolving rather than lasting." : "",
  ];

  const questions = [
    `If the sentence is about ${core.noun}, what in the question does that describe?`,
    neg.length ? `Is ${neg[0].n} (${neg[0].kw[0]}) describing something already known, or something not yet noticed?` : "The line shows no hard cards. Does that match the situation, or is something being left out?",
    courts.length ? `Does ${courts[0].n}'s court inset stand for a person here, and if so, who?` : "Which pair of neighbouring cards reads most like the real situation?",
  ];

  const method = [
    `${plural(n, "card")} dealt without replacement from 36. Lenormand cards are never reversed. Any one card appears in this spread ${odds(n / 36)}.`,
    `Chance of exactly ${plural(neg.length, "hard card")} in ${n}: ${odds(hyper(36, ALL.neg, n, neg.length))}. Chance of exactly ${pos.length} kind: ${odds(hyper(36, ALL.pos, n, pos.length))}.`,
    "The kind, neutral and hard labels are this deck's own simplification of 19th-century card lists. Reading in pairs (first card the subject, second the description) is the standard Lenormand method.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
