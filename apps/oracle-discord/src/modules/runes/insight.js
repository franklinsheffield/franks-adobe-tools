// The evidence layer of a rune reading: what was drawn, how it landed, how the three aettir are represented,
// how likely that was, and what the pattern may mean.
import { RUNES, AETTIR } from "./data.js";
import { insight, binom, odds, plural } from "../../insight.js";

const AETT_THEME = ["the material and the growing: resources, strength, travel, exchange, joy", "forces outside personal control: weather, need, time, chance, the turning year", "people and principle: justice, growth, partnership, the self, inheritance"];
const FIXED = RUNES.filter((r) => !r.rev).length;

export function analyse(cast, sp, who) {
  const n = cast.length, rev = cast.filter((d) => d.rune.rev), merk = cast.filter((d) => d.merk), fixed = cast.filter((d) => !d.rune.rev);
  const counts = [0, 1, 2].map((a) => cast.filter((d) => d.aett === a).length);
  const lead = counts.indexOf(Math.max(...counts)), tie = counts.filter((c) => c === counts[lead]).length > 1;
  const absent = [0, 1, 2].filter((a) => !counts[a]);
  const first = cast[0], last = cast[n - 1];
  const order = cast.map((d) => d.i).sort((a, b) => a - b), neighbours = order.filter((v, k) => k && v - order[k - 1] === 1).map((v) => `${RUNES[v - 1].n} and ${RUNES[v].n}`);

  const data = [
    ["Drawn", cast.map((d, k) => `${sp.positions[k][0].split(" · ")[0]}: ${d.rune.ch} ${d.rune.n} (rune ${d.i + 1} of 24, sound "${d.rune.sound}", ${d.rune.rev ? (d.merk ? "merkstave" : "upright") : "reads the same either way"})`).join(" · ")],
    ["Aettir", [0, 1, 2].map((a) => `${AETTIR[a]} ${counts[a]}`).join(" · ")],
    ["Orientation", rev.length ? `${merk.length} of ${plural(rev.length, "reversible rune")} landed merkstave${fixed.length ? `; ${plural(fixed.length, "rune")} cannot reverse` : ""}` : "no reversible runes in this draw"],
    ["Meanings in one line", cast.map((d) => `${d.rune.n}: ${d.rune.gloss}`).join(" · ")],
  ];

  const patterns = [];
  if (n > 1) patterns.push(tie ? `No aett leads (${counts.join("/")}).` : `${AETTIR[lead]} holds ${counts[lead]} of ${n} runes.${absent.length ? ` ${absent.map((a) => AETTIR[a]).join(" and ")} ${absent.length > 1 ? "are" : "is"} absent.` : ""}`);
  if (rev.length) patterns.push(`An even split would be ${rev.length / 2} merkstave; this draw has ${merk.length}.`);
  if (fixed.length) patterns.push(`${fixed.map((d) => d.rune.n).join(", ")} ${fixed.length > 1 ? "are" : "is"} among the ${FIXED} runes with no reversed form, so ${fixed.length > 1 ? "their" : "its"} meaning does not bend with the fall.`);
  if (neighbours.length) patterns.push(`Neighbours in the futhark row were drawn together: ${neighbours.join("; ")}.`);
  if (n > 1) patterns.push(`The reading opens on "${first.rune.kw[0]}" (${first.rune.n}${first.merk ? ", merkstave" : ""}) and closes on "${last.rune.kw[0]}" (${last.rune.n}${last.merk ? ", merkstave" : ""}).`);

  const conclusions = [];
  if (n > 1 && !tie) conclusions.push(`${AETTIR[lead]} is associated with ${AETT_THEME[lead]}. With ${counts[lead]} of ${n} runes there, the question may turn mostly on that side of life.`);
  if (n > 1 && tie) conclusions.push("With the aettir evenly represented, no single side of life dominates. The question may be broader than it first looks.");
  if (absent.length && n >= 3) conclusions.push(`Nothing came from ${absent.map((a) => AETTIR[a]).join(" or ")} (${absent.map((a) => AETT_THEME[a].split(":")[0]).join("; ")}). That side may simply not be in play, or it may be the part not being looked at.`);
  if (rev.length) conclusions.push(merk.length === 0 ? "Every reversible rune fell upright. Read plainly, the qualities named here may be available as they are, without much standing in their way."
    : merk.length === rev.length ? "Every reversible rune fell merkstave. Tradition reads a merkstave rune as its quality blocked, delayed or turned inward, so the picture may be one of several things held up at once rather than absent."
    : `${merk.map((d) => d.rune.n).join(" and ")} fell merkstave while ${rev.filter((d) => !d.merk).map((d) => d.rune.n).join(" and ")} stayed upright. The contrast may mark where things flow (${rev.filter((d) => !d.merk).map((d) => d.rune.kw[0]).join(", ")}) and where they catch (${merk.map((d) => d.rune.kw[0]).join(", ")}).`);
  if (n > 1) conclusions.push(last.merk ? `The final position holds ${last.rune.n} merkstave. A reversed rune at the end is usually taken as an outcome still unsettled, not a fixed one.` : `The final position holds ${last.rune.n} upright. If nothing in the earlier positions shifts, "${last.rune.kw[0]}" may be where the current course tends.`);
  if (n === 1) conclusions.push(`A single rune concentrates everything on one idea: ${first.rune.gloss}. ${first.merk ? "Merkstave, it may point to that quality being obstructed or misdirected at the moment." : first.rune.rev ? "Upright, it may describe a quality that is present and usable." : "As a rune with no reversed form, it reads as a constant rather than a tendency."}`);

  const questions = [
    `What in the question looks like "${first.rune.kw[0]}"${n > 1 ? `, and what would "${last.rune.kw[0]}" look like if it arrived` : ""}?`,
    merk.length ? `Is ${merk[0].rune.n}'s theme (${merk[0].rune.kw[0]}) missing here, or present but turned the wrong way?` : "Does the picture feel as unobstructed as the runes show it?",
    n > 1 ? "Which rune fits least well? The misfit is often the most informative part of a draw." : "Would a second rune change the reading, or only decorate it?",
  ];

  const method = [
    `${plural(n, "rune")} drawn without replacement from a bag of 24. Any one rune appears in this draw ${odds(n / 24)}.`,
    rev.length ? `Each reversible rune lands merkstave half the time: ${merk.length} of ${rev.length} happens ${odds(binom(rev.length, merk.length, 0.5))}.` : "",
    "Meanings come from the Norwegian, Icelandic and Old English rune poems (9th to 15th centuries) and modern practice. Reading reversed runes is a modern convention; no early source describes it.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
