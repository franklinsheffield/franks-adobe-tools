// What each Codex entry is traditionally read as, in a few words. Used when "Go deeper" compares a reading with
// the member's own Codex: the comparison is between themes, not between counts.
import { DECK as TAROT } from "../../src/modules/tarot/data.js";
import { CARDS as LENORMAND } from "../../src/modules/lenormand/data.js";
import { DECK as MAGIC } from "../../src/modules/magicdeck/data.js";
import { RUNES } from "../../src/modules/runes/data.js";
import { ODU } from "../../src/modules/ifa/data.js";
import { byNumber } from "../../src/modules/iching/hexagrams.js";
import { SIGNS } from "../../src/modules/mayan/calendar.js";
import { SIGN_TEXT } from "../../src/modules/mayan/text.js";
import { GODS } from "../../src/modules/egyptian/data.js";
import { TREES, NAMELESS } from "../../src/modules/celtic/data.js";
import { ANIMALS } from "../../src/modules/chinesezodiac/text.js";
import { N } from "../../src/modules/numerology/text.js";

const byN = (list, key = "n") => Object.fromEntries(list.map((c) => [c[key], c.kw]));
const SUN = { Aries: ["initiative", "directness", "courage"], Taurus: ["steadiness", "comfort", "persistence"], Gemini: ["curiosity", "communication", "variety"], Cancer: ["care", "memory", "protection"],
  Leo: ["warmth", "expression", "pride"], Virgo: ["precision", "service", "analysis"], Libra: ["balance", "partnership", "fairness"], Scorpio: ["intensity", "depth", "transformation"],
  Sagittarius: ["exploration", "meaning", "candour"], Capricorn: ["ambition", "structure", "patience"], Aquarius: ["independence", "ideas", "community"], Pisces: ["imagination", "empathy", "surrender"] };
const HD = { Manifestor: ["initiating", "independence", "impact"], Generator: ["sustained energy", "response", "satisfaction"], "Manifesting Generator": ["speed", "many interests", "response"],
  Projector: ["guiding", "insight into others", "recognition"], Reflector: ["mirroring", "sensitivity to place", "slow timing"] };
const T = {
  tarot: byN(TAROT), lenormand: byN(LENORMAND), magicdeck: byN(MAGIC), runes: byN(RUNES),
  celtic: { ...byN(TREES, "tree"), [NAMELESS.tree]: NAMELESS.kw },
  egyptian: Object.fromEntries(Object.entries(GODS).map(([k, g]) => [k, g.kw])),
  chinesezodiac: Object.fromEntries(Object.entries(ANIMALS).map(([k, a]) => [k, a.kw])),
  mayan: Object.fromEntries(SIGNS.map((s, i) => [s, SIGN_TEXT[i].kw])),
};

/** Keywords for one Codex entry of one system ([] when the system has none, such as an oracle-bone cycle day). */
export function themeOf(key, name) {
  const s = String(name || "");
  if (T[key]) return T[key][s] || [];
  if (key === "iching") { const m = /(\d+)/.exec(s), h = m && byNumber(+m[1]); return h ? h.kw : []; }
  if (key === "ifa") return ODU.filter((o) => s.split(" ").includes(o.name)).map((o) => o.theme);
  if (key === "numerology") { const m = /(\d+)/.exec(s); return (m && N[+m[1]] && N[+m[1]].kw) || []; }
  if (key === "astrology") return SUN[s.replace(/^Sun in /, "")] || [];
  if (key === "humandesign") return HD[s] || [];
  return [];
}
