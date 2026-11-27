// The evidence layer of a Human Design reading: the 26 activations as numbers, which centres and channels they
// define, why the type and authority follow from that wiring, how common each result is, and what it may mean.
import { CENTERS, CHANNELS, MOTORS, GATE_CENTER, PLANETS } from "./data.js";
import { LINES, GATES } from "./text.js";
import { insight, plural, list } from "../insight.js";

const SHARE = { Generator: "about 37%", "Manifesting Generator": "about 33%", Projector: "about 20%", Manifestor: "about 9%", Reflector: "about 1%" };
const KIND = { "motor+awareness": "energy and feeling (a motor)", "pressure+motor": "pressure and drive (a motor)", pressure: "pressure (the urge to think or act)", awareness: "awareness (thinking, instinct, feeling)", expression: "expression and action", identity: "identity and direction", motor: "energy (a motor)" };

export function analyse(chart, { timeKnown = true, who } = {}) {
  const acts = [...PLANETS.map((p) => ["conscious", p, chart.personality[p.key]]), ...PLANETS.map((p) => ["unconscious", p, chart.design[p.key]])].filter(([, , a]) => a);
  const pG = new Set(acts.filter(([s]) => s === "conscious").map(([, , a]) => a.gate)), dG = new Set(acts.filter(([s]) => s === "unconscious").map(([, , a]) => a.gate));
  const gates = new Set([...pG, ...dG]), both = [...pG].filter((g) => dG.has(g));
  const defined = Object.keys(CENTERS).filter((c) => chart.centers[c]), open = Object.keys(CENTERS).filter((c) => !chart.centers[c]);
  const motors = MOTORS.filter((c) => chart.centers[c]);
  const inChannel = new Set(chart.channels.flatMap((c) => c.gates)), hanging = [...gates].filter((g) => !inChannel.has(g));
  const lines = [1, 2, 3, 4, 5, 6].map((l) => acts.filter(([, , a]) => a.line === l).length), lMax = Math.max(...lines), lTop = lines.map((c, i) => (c === lMax ? i + 1 : 0)).filter(Boolean);
  const src = chart.channels.map((c) => { const s = c.gates.map((g) => (pG.has(g) && dG.has(g) ? "both" : pG.has(g) ? "conscious" : "unconscious")); return [c, s[0] === s[1] && s[0] !== "both" ? s[0] : "mixed"]; });
  const mixed = src.filter(([, s]) => s === "mixed").length, days = Math.round((new Date(chart.birthUtc) - new Date(chart.designUtc)) / 864e5);
  const perCentre = Object.keys(CENTERS).map((c) => [c, [...gates].filter((g) => GATE_CENTER[g] === c).length]).sort((a, b) => b[1] - a[1]);
  const sacral = !!chart.centers.sacral, [pl, dl] = chart.profile.split("/").map(Number);
  const cn = (c) => CENTERS[c].name;

  const data = [
    ["Two moments", `birth, and the "design" moment ${days} days earlier, when the Sun stood exactly 88° before its birth position`],
    ["Activations", `26 (13 bodies × 2 moments) landing on ${gates.size} of 64 gates${both.length ? `; ${plural(both.length, "gate")} hit from both moments (${both.join(", ")})` : ""}`],
    ["Centres", `${defined.length} of 9 defined (${defined.map(cn).join(", ") || "none"}) · ${open.length} open (${open.map(cn).join(", ") || "none"})`],
    ["Channels", chart.channels.length ? `${chart.channels.length} of 36 complete: ${chart.channels.map((c) => `${c.key} ${c.name} (${c.centers.map(cn).join(" to ")})`).join(" · ")}` : "0 of 36 complete"],
    ["Unpaired gates", `${hanging.length} of ${gates.size} active gates have no partner at the other end of their channel`],
    ["Lines", lines.map((c, i) => `line ${i + 1}×${c}`).join(" · ")],
    ["Gates per centre", perCentre.filter(([, c]) => c).map(([c, k]) => `${cn(c)} ${k}`).join(" · ")],
    ["Sun and Earth", `conscious ${chart.personality.sun.gate}.${chart.personality.sun.line} / ${chart.personality.earth.gate}.${chart.personality.earth.line} · unconscious ${chart.design.sun.gate}.${chart.design.sun.line} / ${chart.design.earth.gate}.${chart.design.earth.line}`],
  ];

  const patterns = [
    `Type is derived, not assigned: the Sacral is ${sacral ? "defined" : "open"}${defined.length ? ` and ${chart.type === "Manifestor" || chart.type === "Manifesting Generator" ? "a motor reaches the Throat through defined channels" : "no motor reaches the Throat through defined channels"}` : " and no centre at all is defined"}, which is the definition of a ${chart.type}.`,
    `Authority is the highest defined centre in a fixed order (Solar Plexus, Sacral, Spleen, Heart, G). Here that gives ${chart.authority}.`,
    `${plural(motors.length, "motor")} of 4 ${motors.length === 1 ? "is" : "are"} defined${motors.length ? ` (${motors.map(cn).join(", ")})` : ""}.`,
    chart.channels.length ? `${chart.definition} definition: the defined centres form ${{ Single: "one connected group", Split: "two separate groups", "Triple Split": "three separate groups", "Quadruple Split": "four separate groups" }[chart.definition] || "no group"}.` : "No definition: every centre is open.",
    chart.channels.length ? `${mixed} of ${plural(chart.channels.length, "channel")} ${mixed === 1 ? "is" : "are"} completed by one conscious and one unconscious gate; ${src.filter(([, s]) => s === "conscious").length} purely conscious, ${src.filter(([, s]) => s === "unconscious").length} purely unconscious.` : "",
    `${lTop.length > 1 ? "Lines" : "Line"} ${list(lTop.map(String))} ${lTop.length > 1 ? "are" : "is"} the most frequent (${lMax} of 26 activations): ${lTop.map((l) => LINES[l][0]).join(", ")}.`,
    `The profile ${chart.profile} is simply the line of the conscious Sun (${pl}) and of the unconscious Sun (${dl}).`,
    `${cn(perCentre[0][0])} holds the most active gates (${perCentre[0][1]}).`,
  ];

  const conclusions = [
    `As a ${chart.type}, the system describes an energy pattern that is ${sacral ? "self-sustaining when engaged (defined Sacral)" : "not built for sustained output (open Sacral)"}. The strategy "${chart.strategy}" is the system's own inference from that wiring, offered as something to test rather than a rule.`,
    `${chart.authority} authority means the system locates reliable decisions in ${{ Emotional: "the emotional wave over time, not in the moment", Sacral: "the immediate gut response", Splenic: "a quiet instinct in the moment", "Ego Manifested": "what is truly wanted and voiced", "Ego Projected": "what the will is behind", "Self-Projected": "what is heard when talking it through", "Mental (Outer)": "talking it through in the right surroundings", Lunar: "a full lunar cycle of sampling" }[chart.authority] || "the body rather than the mind"}. That may or may not match how decisions actually feel.`,
    defined.length ? `Defined centres are read as consistent traits: ${defined.map((c) => `${cn(c)} (${KIND[CENTERS[c].kind].split(" (")[0]})`).join(", ")}. These may be the qualities others experience as reliable.` : "With no centre defined, the system reads the person as a mirror of their surroundings, sampling rather than fixed.",
    open.length ? `Open centres (${open.map(cn).join(", ")}) are read as where outside influence is taken in and amplified. The system treats these as places of learning, and of conditioning when unexamined.` : "",
    chart.definition.includes("Split") ? `A ${chart.definition.toLowerCase()} definition is read as parts of the self that do not talk to each other directly, so other people or time may act as the bridge.` : chart.channels.length ? "Single definition is read as a self-contained way of processing: information moves through the whole chart without needing a bridge." : "",
    mixed && chart.channels.length ? `Channels built from one conscious and one unconscious gate are read as traits a person half-recognises: one end familiar, the other more visible to others.` : "",
    hanging.length ? `The ${plural(hanging.length, "unpaired gate")} are read as open-ended traits that switch on when someone else, or a transit, supplies the other end.` : "",
    `Lines ${pl} and ${dl} give the profile ${LINES[pl][0]} / ${LINES[dl][0]}: a conscious style of ${LINES[pl][0].toLowerCase()} and an unconscious one of ${LINES[dl][0].toLowerCase()}, which may show as two different modes in the same person.`,
  ];

  const questions = [
    `Does "${chart.signature[0].toLowerCase()}" versus "${chart.signature[1].toLowerCase()}" track real decisions made well and badly, or is it too general to check?`,
    open.length ? `In the ${cn(open[0])} centre (open), what is personal and what is picked up from the room?` : "With every centre defined, where does outside influence get in at all?",
    chart.channels.length ? `Is ${chart.channels[0].name} (${chart.channels[0].key}) a trait others would name unprompted?` : "Does the reading change noticeably from one group of people to another?",
    timeKnown ? "Which statement here would be easiest to prove wrong over the next month?" : "The birth time is unknown. Which parts above would move if it shifted by a few hours?",
  ];

  const method = [
    "Each gate is 5.625° of the zodiac (360° ÷ 64) and each line 0.9375°. Positions come from real planetary ephemeris for the birth instant and for the moment the Sun was 88° earlier.",
    `Commonly quoted shares of the population: ${Object.entries(SHARE).map(([k, v]) => `${k} ${v.replace("about ", "")}`).join(", ")}. A ${chart.type} is ${SHARE[chart.type]}. These figures come from Human Design schools, not from a census.`,
    "Human Design dates from 1987 (Ra Uru Hu) and combines the I Ching's 64 hexagrams, the zodiac, the Kabbalistic Tree of Life and the chakra system. The astronomy is exact; the meanings are the system's own and have not been validated experimentally.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
