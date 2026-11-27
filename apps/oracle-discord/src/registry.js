// Slash commands served by the oracle bot. Each name maps to src/modules/<name>/index.js, which exports
// `command` (Discord command JSON) and `async run(options, ctx)` -> { embeds, files: [{ name, data }], ephemeral? }.
export const MODULES = ["humandesign", "astrology", "iching", "numerology", "chinesezodiac", "mayan", "egyptian", "celtic", "runes", "oraclebones", "ifa", "tarot", "lenormand", "magicdeck"];
// Commands whose options are personal (birth data): always encrypted end to end, never logged.
export const PERSONAL = new Set(["humandesign", "astrology", "numerology", "chinesezodiac", "mayan", "egyptian", "celtic"]);

/** Should the reply be private (ephemeral)? The user's `private` option wins; otherwise each module's default. */
export function isPrivate(name, options) {
  if (typeof options.private === "boolean") return options.private;
  if (name === "astrology") return options.subcommand === "chart" || !!(options.date || options.birth_date);
  return false;
}

/** Discord interaction options -> flat object; a subcommand becomes { subcommand, ...its options }. */
export function flatten(list = []) {
  const sub = list.find((o) => o.type === 1 || o.type === 2);
  if (sub) return { subcommand: sub.name, ...flatten(sub.options || []) };
  return Object.fromEntries(list.map((o) => [o.name, o.value]));
}
