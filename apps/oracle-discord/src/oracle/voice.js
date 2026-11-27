// The Oracle's voice: short in-character lines spoken around each reading. Written text, no AI service.
// Lines are picked at random; {name} is the member's display name, {result} the reading's headline.

const pick = (xs, rand = Math.random) => xs[Math.floor(rand() * xs.length) % xs.length];
const fill = (s, v) => s.replace(/\{(\w+)\}/g, (_, k) => v[k] ?? "");

export const GREETINGS = [
  "Ah, {name}. The stars said you would come tonight. Which door shall we open?",
  "Welcome back to the chamber, {name}. The ball is warm. What would you know?",
  "Sit, {name}. Science and magic are the same river. Choose where we dip our hands.",
  "{name}… I felt you on the stairs. Choose your oracle, and we begin.",
];

const ASK = {
  cast: ["Hold your question in your mind, {name}, then speak it to me.", "Name what troubles you. The {system} will answer."],
  birth: ["Tell me when and where you first drew breath, {name}.", "Your first breath set the pattern. Give me its hour and place."],
};

const OPEN = {
  iching: ["The coins are falling, {name}… sun, moon, sun…", "Six times the coins have turned. The lines are drawn."],
  runes: ["I reach into the bag, {name}. The staves are cold tonight…", "The runes have left the bag. Let us see how they lie."],
  oraclebones: ["The shell is heating. Listen… there, the crack.", "Fire has written on the bone, {name}."],
  ifa: ["The chain falls, {name}. Eight seeds, open and closed…", "Orunmila's chain has spoken its pattern."],
  astrology: ["I raise the sky as it stood at your first breath, {name}…", "The planets are where they were when you arrived."],
  humandesign: ["Your bodygraph is drawing itself in the mist, {name}…", "Gates and channels, lit and open. Your design appears."],
  numerology: ["The numbers in your name and day are adding up, {name}…", "Every number reduces to a truth. Here is yours."],
  chinesezodiac: ["The pillars of your year, month, day and hour are rising…", "The great wheel of animals turns to you, {name}."],
  mayan: ["The sacred count rolls back to your day, {name}…", "Two hundred and sixty days, and one of them is yours."],
  egyptian: ["The gods of the river turn to look at you, {name}…", "Your patron steps out of the temple shadow."],
  celtic: ["The old grove rustles, {name}. One tree leans toward you…", "Among the thirteen moons, your tree is clear."],
};

const REVEAL = [
  "The mist parts, {name}… **{result}**.",
  "There. Do you see it? **{result}**.",
  "It is written in the glass: **{result}**.",
  "The oracle has spoken, {name}: **{result}**.",
];

const CLOSE = [
  "Sit with it. The meaning ripens slowly.",
  "Take what serves you and leave the rest on the table.",
  "Return when the question changes.",
  "This is a mirror, not a prophecy. Look kindly at what it shows.",
];

export const greeting = (name, rand) => fill(pick(GREETINGS, rand), { name });
export const askLine = (sys, name, rand) => fill(pick(ASK[sys.kind], rand), { name, system: sys.label });

/** Headline of a reading. A module may return `headline` itself; otherwise it comes from the first embed:
 *  "🪙 I Ching · 24 · 復 Fù · Return" -> "24 · 復 Fù · Return"; a natal chart -> "Sun in Aries · Moon in Leo · Libra Rising". */
export function headline(embed, given) {
  if (given) return String(given).trim().replace(/[.。]+$/, "");
  const big3 = ((embed && embed.fields) || []).map((f) => f.name).filter((n) => /^[☉☽↑]/.test(n)).map((n) => n.replace(/^\S+\s+/, "").replace(/,\s*house \d+$/, ""));
  if (big3.length >= 2) return big3.join(" · ");
  const t = String((embed && embed.title) || "").replace(/^\P{L}+/u, "").trim();
  const i = t.indexOf(" · ");
  return (i > 0 ? t.slice(i + 3) : t).trim() || "your reading";
}

/** The spoken lines placed above a reading: opening, reveal and a closing word. */
export function speech(command, name, embed, rand = Math.random, given) {
  const v = { name, result: headline(embed, given) };
  const open = OPEN[command] ? fill(pick(OPEN[command], rand), v) : "";
  return [open, fill(pick(REVEAL, rand), v), pick(CLOSE, rand)].filter(Boolean).join(" ");
}
