// The evidence layer of a Celtic tree reading: the position inside the 28-day tree month, the ogham letter's place
// in its alphabet, the distance from the fire festivals, and what may be concluded.
import { TREES, NAMELESS, FESTIVALS } from "./data.js";
import { insight, plural } from "../../insight.js";
import { momentRows, momentMethod, DATE_ONLY_ROW, ord } from "../../moment.js";

const doy = (m, d) => Math.round((Date.UTC(2001, m - 1, d) - Date.UTC(2001, 0, 1)) / 86400000);
// Ogham groups (aicmí) and stroke counts for the thirteen consonants Graves used.
const OGHAM = { Beith: ["B", 1], Luis: ["B", 2], Fearn: ["B", 3], Saille: ["B", 4], Nion: ["B", 5], Huath: ["H", 1], Duir: ["H", 2], Tinne: ["H", 3], Coll: ["H", 4], Muin: ["M", 1], Gort: ["M", 2], "nGéadal": ["M", 3], Ruis: ["M", 5] };
const SIDE = { B: "to the right of the stem line", H: "to the left of the stem line", M: "diagonally across the stem line" };

export function analyse(tr, fest, today, b, who, { moment = null, reck = null, detail = false, alt = null } = {}) {
  const moved = alt && alt !== tr ? alt : null;
  const nameless = tr === NAMELESS, i = TREES.indexOf(tr);
  const day = nameless ? 0 : ((doy(b.month, b.day) - doy(tr.start[0], tr.start[1]) + 365) % 365) + 1;
  const sinceFest = (doy(b.month, b.day) - doy(fest.date[0], fest.date[1]) + 365) % 365;
  const next = FESTIVALS[(FESTIVALS.indexOf(fest) + 1) % 4], toNext = (doy(next.date[0], next.date[1]) - doy(b.month, b.day) + 365) % 365;
  const og = OGHAM[tr.letter], gap = nameless ? 0 : (TREES.indexOf(today) - i + 13) % 13;
  const prev = TREES[(i + 12) % 13], nxt = TREES[(i + 1) % 13];

  const data = [
    ...(moment ? momentRows(moment, { detail }).filter(([k]) => k !== "True solar time") : [DATE_ONLY_ROW]),
    reck ? ["Day boundary", `born ${reck.part} · ${reck.afterSunset ? `the Gauls counted a day from nightfall, so the birth belongs to the next day${moved ? `, which falls in ${moved.tree}` : ", which is in the same tree month"}` : "nightfall counting and midnight counting give the same day"}`] : null,
    ["Tree", nameless ? "The Nameless Day (23 December), the one day outside the thirteen months" : `${tr.tree}, month ${i + 1} of 13 · day ${day} of 28`],
    ["Ogham", nameless ? "no letter is assigned to this day" : `${tr.ogham} ${tr.letter}${og ? `: ${plural(og[1], "stroke")} ${SIDE[og[0]]}, in the ${og[0]} group of the alphabet` : ""}`],
    ["Neighbours", nameless ? "between Elder (ends 22 December) and Birch (starts 24 December)" : `${prev.tree} before, ${nxt.tree} after`],
    ["Fire festivals", `${plural(sinceFest, "day")} after ${fest.name} · ${plural(toNext, "day")} before ${next.name}`],
    ["Calendar arithmetic", "13 months × 28 days = 364, plus 1 nameless day = 365"],
    ["Now", `the tree month today is ${today.tree}${nameless ? "" : gap === 0 ? ", the birth tree" : `, ${plural(gap, "month")} on from ${tr.tree}`}`],
  ].filter(Boolean);

  const patterns = [
    nameless ? "One birthday in 365 falls on the nameless day." : `Day ${day} of 28 falls in the ${day <= 7 ? "first" : day <= 14 ? "second" : day <= 21 ? "third" : "last"} week of the tree month${day <= 2 ? `, right after ${prev.tree}` : day >= 27 ? `, right before ${nxt.tree}` : ""}.`,
    og ? `${tr.letter} is letter ${og[1]} of the ${og[0]} group. Ogham letters are tallies: one to five strokes, in four groups of five.` : "",
    `The birthday lies ${sinceFest < 23 ? "close after" : toNext < 23 ? "close before" : "in the middle of the quarter after"} ${sinceFest < 23 || toNext >= 23 ? fest.name : next.name}. The four fire festivals sit roughly midway between solstices and equinoxes.`,
    moved ? `Born after sunset on the last day of ${tr.tree}: counted from nightfall, the birth falls in ${moved.tree}.` : "",
    moment && moment.timeKnown ? `The Moon was ${/Moon$/.test(moment.moon.phase) ? moment.moon.phase.split(" ")[0].toLowerCase() : "a " + moment.moon.phase.toLowerCase()} at the birth (${Math.round(moment.moon.lit * 100)}% lit). Graves called his months lunar, but they are fixed dates; the real Moon that night is separate data.` : "",
    moment && !moment.timeKnown ? "With no birth time, the civil date is used. A birth after sunset would count as the following day under nightfall reckoning." : "",
    `Tree keywords: ${tr.kw.join(", ")}. Festival themes: ${fest.about}.`,
  ];

  const conclusions = [
    `${nameless ? "The nameless day" : tr.tree} is associated with ${tr.kw.join(", ")}. The link is drawn from the tree's lore: ${tr.lore.split(". ")[0]}. Read as a symbol, that may describe a temperament.`,
    nameless ? "Standing outside the months, the day may be read as pure threshold: neither ending nor beginning." : day <= 2 || day >= 27 ? `A birthday on the edge of a tree month may carry some of the neighbouring tree, ${day <= 2 ? prev.tree : nxt.tree} (${(day <= 2 ? prev : nxt).kw[0]}), as well.` : `A birthday well inside the month is read as a clear ${tr.tree}, with little borrowed from ${prev.tree} or ${nxt.tree}.`,
    `The ${fest.name} quarter is ${{ Imbolc: "late winter turning to spring", Beltane: "the bright half's beginning", Lughnasadh: "the harvest quarter", Samhain: "the dark half's beginning" }[fest.name]}. The season may add ${{ Imbolc: "a theme of first light and quiet starts", Beltane: "a theme of vitality and growth", Lughnasadh: "a theme of skill and reward", Samhain: "a theme of depth and endings" }[fest.name]} to the tree's meaning.`,
    `The shadow given for this tree is: ${tr.shadow.replace(/\.$/, "")}. Tradition offers it as the strength overdone, not as a flaw.`,
    nameless || gap === 0 ? "" : `The current tree month, ${today.tree} (${today.kw.join(", ")}), may be read as the season's mood set against the ${tr.tree} nature.`,
  ];

  if (moved) conclusions.push(`Under nightfall counting the tree would be ${moved.tree} (${moved.kw.join(", ")}). The two descriptions may be read side by side to see which fits better.`);
  if (moment && moment.timeKnown) conclusions.push(`A ${moment.moon.phase.toLowerCase()} birth: the surviving Celtic calendar (Coligny) followed the Moon, so the phase is nearer to how a birth would have been placed than the tree month is. ${/^Full/.test(moment.moon.phase) ? "A full Moon is widely read as fullness and things coming to light" : /^New/.test(moment.moon.phase) ? "A new Moon is widely read as a blank page and beginnings" : moment.moon.elong < 180 ? "A waxing Moon is widely read as growth and beginnings" : "A waning Moon is widely read as release and completion"}, though that reading is general folklore, not a Celtic source.`);

  const questions = [
    `Which of "${tr.kw.join(", ")}" would people who know the person well agree with?`,
    `Does the real tree (how ${nameless ? "midwinter" : tr.tree.toLowerCase()} actually grows and behaves) suggest anything the keywords leave out?`,
    "With thirteen signs, about one person in 13 shares this tree. What here is specific?",
  ];

  const method = [
    "The tree month comes from fixed dates: thirteen 28-day months starting 24 December, plus one extra day.",
    "This calendar is Robert Graves's 1948 proposal in The White Goddess. No ancient Celtic source uses it; the Coligny calendar (Gaul, 2nd century) is the real surviving one and is lunisolar.",
    ...(moment ? ["Caesar wrote that the Gauls reckoned time by nights, with each day following its night (Gallic War 6.18), so a birth after sunset is counted with the next day.", momentMethod(moment)] : []),
    "Ogham is genuine: about 400 inscriptions survive from 4th to 6th century Ireland and Britain. The tree names for letters come from medieval glosses, and not every letter was originally a tree.",
    `Sharing a tree sign: 28 in 365, about 1 in 13 (7.7%).`,
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
