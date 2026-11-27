// The evidence layer of an Egyptian reading: where the birthday falls in the deity's date ranges and in the real
// Egyptian (Coptic) calendar, how much of the year the sign covers, and what may be concluded.
import { GODS, SEASONS } from "./data.js";
import { insight, plural, list } from "../../insight.js";

const MON = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
const SEASON_ABOUT = { Akhet: "the flood, when the Nile covered the fields", Peret: "the emergence, when the land reappeared and was sown", Shemu: "the harvest, the dry season of low water" };

export function analyse(name, c, b, who) {
  const g = GODS[name], days = g.ranges.reduce((a, [, x, y]) => a + y - x + 1, 0);
  const cur = g.ranges.find(([m, x, y]) => m === b.month && b.day >= x && b.day <= y) || g.ranges[0];
  const into = b.day - cur[1] + 1, len = cur[2] - cur[1] + 1, doy = c.month <= 12 ? (c.month - 1) * 30 + c.day : 360 + c.day;
  const decan = Math.min(36, Math.ceil(doy / 10)), inSeason = c.month <= 12 ? ((c.month - 1) % 4) + 1 : 0;
  const sizes = Object.entries(GODS).map(([k, v]) => [k, v.ranges.reduce((a, [, x, y]) => a + y - x + 1, 0)]).sort((x, y) => y[1] - x[1]);
  const rank = sizes.findIndex(([k]) => k === name) + 1;

  const data = [
    ["Deity", `${name}, ${g.title} · ${plural(g.ranges.length, "date range")} covering ${plural(days, "day")} of the year (${((days / 365) * 100).toFixed(1)}%)`],
    ["Position", `day ${into} of the ${len}-day range ${MON[cur[0] - 1]} ${cur[1]}${cur[1] === cur[2] ? "" : `–${cur[2]}`}`],
    ["Egyptian date", `${c.day} ${c.name}, year ${c.year} of the Coptic era · day ${doy} of 365${c.month <= 12 ? ` · month ${c.month} of 12` : " · in the five extra days"}`],
    ["Season", c.month <= 12 ? `${c.season} (${SEASON_ABOUT[c.season] || SEASONS[c.season]}), month ${inSeason} of its 4` : "the epagomenal days, outside the three seasons"],
    ["Decan", `${decan} of 36 (the ten-day star weeks by which Egyptian priests told the hours of the night)`],
    ["Kindred deities", g.allies.join(", ")],
  ];

  const patterns = [
    `${name}'s ranges are ${g.ranges.length > 1 ? "scattered across the year rather than continuous" : "a single block"}, which is typical of this system and unlike the Western zodiac.`,
    `By days covered, ${name} ranks ${rank} of ${sizes.length} (largest: ${sizes[0][0]} with ${sizes[0][1]} days; smallest: ${sizes[sizes.length - 1][0]} with ${sizes[sizes.length - 1][1]}).`,
    into <= 2 || into >= len - 1 ? `The birthday is at the ${into <= 2 ? "start" : "end"} of its range, next to another deity's dates.` : `The birthday sits ${into <= len / 2 ? "in the first half" : "in the second half"} of its range.`,
    c.month <= 12 ? `${c.name} is ${c.about}. It is month ${inSeason} of ${c.season}, so the birth falls ${inSeason <= 2 ? "early" : "late"} in that season.` : "The birth falls in the five days added to the 360-day year, which myth gives as the birthdays of Osiris, Horus, Set, Isis and Nephthys.",
    `The two calendars here are independent: the deity comes from the modern sign list, the ${c.name} date from the real Egyptian civil calendar.`,
  ];

  const conclusions = [
    `${name} is associated with ${g.kw.join(", ")}. As a sign, that may describe qualities a person recognises in themselves; as mythology, it describes what Egyptians asked of that god.`,
    `The myth supplies the reasoning: ${g.myth.split(". ")[0].replace(/\.$/, "")}. The traits assigned to the sign are read off that story.`,
    `The kindred deities (${list(g.allies)}) share ${g.allies.length > 1 ? "themes" : "a theme"} with ${name} in the myths (${g.allies.map((a) => GODS[a].kw[0]).join(", ")}), which is the basis for calling them compatible.`,
    c.month <= 12 ? `A birth in ${c.season} places it in ${SEASON_ABOUT[c.season] || SEASONS[c.season]}. Read symbolically, that may add a ${c.season === "Akhet" ? "theme of renewal and waiting" : c.season === "Peret" ? "theme of growth and tending" : "theme of gathering and completion"} to the picture.` : "A birth in the epagomenal days may be read as standing between years: an in-between, threshold theme.",
    `Because ${name} covers ${((days / 365) * 100).toFixed(1)}% of birthdays, the description is shared with roughly 1 person in ${Math.round(365 / days)}. What it says may be true and still not be distinctive.`,
  ];

  const questions = [
    `Which part of "${g.kw.join(", ")}" fits, and which part would friends dispute?`,
    `The shadow named for ${name} is: ${g.shadow.split(". ")[0].replace(/\.$/, "").toLowerCase()}. Is that recognisable, or would another deity's shadow fit better?`,
    "If the deity had been assigned at random, would the description still feel personal?",
  ];

  const method = [
    "The twelve-deity 'Egyptian zodiac' is a 20th-century invention with no ancient source. Egypt's own astrology arrived late, from Babylon and Greece (the Dendera zodiac dates to about 50 BCE).",
    "The Egyptian date is computed with the Coptic calendar: twelve 30-day months plus 5 or 6 extra days, a direct descendant of the pharaonic civil year with a leap day added.",
    "The 36 decans are genuinely ancient: star groups rising about ten days apart, painted on coffin lids from about 2100 BCE as night clocks.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
