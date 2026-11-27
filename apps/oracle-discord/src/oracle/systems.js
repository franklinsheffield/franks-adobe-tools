// The systems the Oracle offers. Each maps to a slash-command module in src/modules/<command>/.
// kind "cast": the member asks a question and the Oracle casts (coins, runes, bones, chain).
// kind "birth": the reading comes from birth details (saved /profile or the birth form).
// emoji must be standard Unicode emoji (Discord select menus reject other symbols).
// Entries whose module isn't in MODULES yet are hidden, so new systems appear as soon as they're registered.
import { MODULES } from "../registry.js";

export const SYSTEMS = [
  { key: "iching", command: "iching", label: "I Ching", emoji: "🪙", kind: "cast", hint: "Six coins, one question", ask: "question" },
  { key: "runes", command: "runes", label: "Runes", emoji: "🪨", kind: "cast", hint: "Draw from the Elder Futhark", ask: "question" },
  { key: "oraclebones", command: "oraclebones", label: "Oracle bones", emoji: "🦴", kind: "cast", hint: "Heat the shell, read the crack", ask: "question" },
  { key: "ifa", command: "ifa", label: "Ifá", emoji: "📿", kind: "cast", hint: "Cast the divining chain", ask: "question" },
  { key: "astrology", command: "astrology", sub: "chart", label: "Astrology", emoji: "🌌", kind: "birth", hint: "Your birth chart" },
  { key: "humandesign", command: "humandesign", label: "Human Design", emoji: "🧬", kind: "birth", hint: "Your bodygraph" },
  { key: "numerology", command: "numerology", label: "Numerology", emoji: "🔢", kind: "birth", hint: "Your core numbers" },
  { key: "chinesezodiac", command: "chinesezodiac", label: "Chinese zodiac", emoji: "🐉", kind: "birth", hint: "Animal, element, four pillars" },
  { key: "mayan", command: "mayan", label: "Mayan day sign", emoji: "☀️", kind: "birth", hint: "Your Tzolk'in day" },
  { key: "egyptian", command: "egyptian", label: "Egyptian zodiac", emoji: "🏺", kind: "birth", hint: "Your patron deity" },
  { key: "celtic", command: "celtic", label: "Celtic tree sign", emoji: "🌳", kind: "birth", hint: "Your tree of the year" },
];

export const available = (modules = MODULES) => SYSTEMS.filter((s) => modules.includes(s.command));
export const systemByKey = (key, modules = MODULES) => available(modules).find((s) => s.key === key) || null;

/** Slash-command options for a system chosen in the Oracle menu. */
export function optionsFor(sys, extra = {}) {
  return { ...(sys.sub ? { subcommand: sys.sub } : {}), ...extra, via_oracle: true };
}
