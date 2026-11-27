// The evidence layer of an oracle bone reading: the date, the paired charges, each crack as measured,
// how the two compare, the odds, and what a Shang diviner's method lets one conclude (and not conclude).
import { insight, odds } from "../../insight.js";

export function analyse(r, OMENS, who) {
  const total = OMENS.reduce((a, o) => a + o.w, 0), p = (o) => o.w / total;
  const d = r.pos.omen.score - r.neg.omen.score;
  // Chance of each verdict class, by enumerating every pair of cracks.
  const cls = (x) => (x >= 1.5 ? "yes" : x > 0 ? "lean-yes" : x === 0 ? "even" : x > -1.5 ? "lean-no" : "no");
  let pv = 0; for (const a of OMENS) for (const b of OMENS) if (cls(a.score - b.score) === r.verdict) pv += p(a) * p(b);
  const crack = (c) => `${c.omen.hz} ${c.omen.py} (${c.omen.en}), branch at ${c.angle}° and ${Math.round(c.len * 100)}% of full length`;
  const both = r.pos.omen.score >= 1 && r.neg.omen.score >= 1 ? "good" : r.pos.omen.score < 0 && r.neg.omen.score < 0 ? "bad" : "";
  const charge = r.charge || "In the next ten days there will be no misfortune.";

  const data = [
    ["Day", `${r.day.stem.hz}${r.day.branch.hz} ${r.day.stem.py} ${r.day.branch.py}, day ${r.day.index + 1} of the 60-day cycle`],
    ["The charge", `"${charge}"`],
    ["Crack for the charge", crack(r.pos)],
    ["Crack for its opposite", crack(r.neg)],
    ["Margin", d === 0 ? "none: both cracks carry the same notation" : `the ${d > 0 ? "charge" : "opposite"} is stronger by ${Math.abs(d)} on a scale that runs from -1 (harm) to 3 (great auspice)`],
  ];

  const patterns = [
    `The charge drew ${r.pos.omen.en}; its opposite drew ${r.neg.omen.en}.`,
    r.pos.angle !== r.neg.angle ? `The ${r.pos.angle > r.neg.angle ? "charge's" : "opposite's"} branch rose more steeply (${Math.max(r.pos.angle, r.neg.angle)}° against ${Math.min(r.pos.angle, r.neg.angle)}°). In this reading a steeper, cleaner branch goes with a more favourable notation.` : "Both branches rose at the same angle.",
    both === "good" ? "Both cracks are favourable." : both === "bad" ? "Both cracks are troubled." : d === 0 ? "The two cracks are equal." : "The two cracks disagree, which is what a paired charge is designed to show.",
  ];

  const conclusions = [
    "Shang diviners put a matter to the bone twice, once as stated and once as its opposite, and compared the cracks. The result is the comparison, not either crack alone.",
    Math.abs(d) >= 1.5 ? `The margin is wide. By the diviners' own logic the bone may be read as speaking clearly ${d > 0 ? "for" : "against"} the charge as worded.`
      : d !== 0 ? `The margin is narrow. The bone may be read as leaning ${d > 0 ? "toward" : "away from"} the charge, but a reading this close would often have been cracked again on a fresh hollow before anything was carved.`
      : "With equal cracks the bone gives no preference. On surviving bones such charges were often repeated, sometimes several times, so an even result may simply mean the question is not yet ripe.",
    both === "good" ? "When the charge and its opposite both come up favourable, the matter may turn out acceptably either way. The stakes of the choice may be lower than they feel." : "",
    both === "bad" ? "When both sides come up troubled, the difficulty may not lie in choosing between them. It may lie in something the charge does not mention." : "",
    r.pos.omen.score < 0 ? "有祟 marks a harmful influence. For the Shang this pointed to a displeased ancestor to be identified, which is a statement about cause as much as outcome: something specific may be working against the matter." : "",
    r.routine ? "This was the routine ten-day charge, asked at the end of every Shang week whether or not anything was wrong. Its answer describes the general weather of the days ahead, not a particular matter." : "",
  ];

  const questions = [
    `Is "${charge}" the real matter, or a safer version of it?`,
    d === 0 ? "What would have to become clearer before the bone could tell the two sides apart?" : `What is already known that fits the bone leaning ${d > 0 ? "toward" : "away from"} the charge, and what does not fit?`,
    "A complete inscription ends with the verification: what actually happened. What would count as the verification here, and when could it be checked?",
  ];

  const method = [
    `Each crack is drawn by weighted chance from six notations found on Shang bones: ${OMENS.map((o) => `${o.hz} ${o.w}/${total}`).join(", ")}.`,
    `A result in this class (${r.verdict.replace("-", " ")}): ${odds(pv)}.`,
    "The day is the real one in the 60-day cycle, which has run unbroken since the Shang and still dates the surviving bones. The crack itself is random: this is a modern reflection in the old format, not a reconstruction of how diviners read real cracks, which is only partly understood.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
