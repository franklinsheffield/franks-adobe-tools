// The evidence layer of the Ifá-inspired reflection: the eight pods as data, how the two legs relate as figures,
// and what their themes may suggest side by side. It stays inside what the marks themselves show: a babaláwo
// concludes from verses and further casts, which this bot does not have and does not imitate.
import { ODU } from "./data.js";
import { insight, binom, odds, plural } from "../../insight.js";

const same = (a, b) => a.every((v, i) => v === b[i]);
const word = (v) => (v === 1 ? "open" : "closed");

export function analyse(c, who) {
  const R = ODU[c.r], L = ODU[c.l], meji = c.r === c.l;
  const open = c.pods.filter((v) => v === 1).length;
  const complement = same(c.right.map((v) => 3 - v), c.left), flip = same([...c.right].reverse(), c.left);
  const shared = c.right.filter((v, i) => v === c.left[i]).length;

  const data = [
    ["Right leg, top to bottom", `${c.right.map(word).join(", ")} = ${R.name}, ${c.r + 1} of 16 in the order of seniority`],
    ["Left leg, top to bottom", `${c.left.map(word).join(", ")} = ${L.name}, ${c.l + 1} of 16 in the order of seniority`],
    ["Figure", `${c.name}${meji ? ", a Méjì (both legs the same)" : ""}`],
    ["Pods", `${open} open, ${8 - open} closed`],
    ["Themes", `${R.name}: ${R.theme} · ${L.name}: ${L.theme}`],
  ];

  const patterns = [
    meji ? "Both legs fell identically, which happens in 16 of the 256 figures." : `The legs agree in ${shared} of 4 positions.`,
    complement && !meji ? "The left leg is the exact opposite of the right: every open pod faces a closed one." : "",
    flip && !meji && !complement ? "The left leg is the right leg turned upside down." : "",
    !meji ? `${c.r < c.l ? R.name : L.name} is the senior of the two figures, and it fell on the ${c.r < c.l ? "right, the leg read first" : "left, the leg read second"}.` : "",
    open === 8 || open === 0 ? `All eight pods fell ${open ? "open" : "closed"}: the figure at the very ${open ? "beginning" : "start of the second place"} of the order.` : `${open} of 8 pods open: ${open > 4 ? "more open than closed" : open < 4 ? "more closed than open" : "an even split"}.`,
  ];

  const conclusions = [
    "In this reflection the right leg names the matter and the left leg describes how it moves. That is a reading convention of this bot, kept simple on purpose.",
    meji ? `A doubled figure states one theme twice. ${R.name} Méjì may mean the question is about ${R.theme} and little else: ${R.gist}.`
      : `Side by side, the themes are "${R.theme}" and "${L.theme}". One possible reading: the matter concerns ${R.gist.split(":").pop().trim()}, and it is coloured by ${L.gist.split(":").pop().trim()}.`,
    complement && !meji ? "Two figures that are exact opposites may describe a matter with two faces: what is open on one side is closed on the other." : "",
    !meji && shared >= 3 ? "The legs differ in only one position, so the two themes sit close together. They may be two views of the same thing." : "",
    !meji && shared <= 1 && !complement ? "The legs share almost nothing, so the two themes pull apart. The matter and the way it moves may not be naturally aligned." : "",
    "What cannot be concluded here: which verses apply, or what a priest would recommend. Those come from years of training and from further casting, and no pattern in eight pods replaces them.",
  ];

  const questions = [
    `Where does "${R.theme}" show up in the matter being asked about?`,
    meji ? "If only one theme is speaking, what has been crowding it out?" : `How might "${L.theme}" change the way that matter unfolds?`,
  ];

  const method = [
    "Eight half-pods each fall open or closed with equal chance, giving 2 x 2 x 2 x 2 = 16 figures per leg and 16 x 16 = 256 in all.",
    `Any one figure, including ${c.name}: about 1 in 256 (0.39%). A Méjì of any kind: 1 in 16.`,
    `${plural(open, "open pod")} of 8: ${odds(binom(8, open, 0.5))}.`,
    "The names and marks of the sixteen principal Odù follow a widely published order; lineages differ slightly in the ranking. The themes are short summaries, not verses.",
  ];
  return insight({ data, patterns, conclusions, questions, method, who });
}
