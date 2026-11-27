// Discovery Bench rules. Pick 1-3 ingredients and an operation; if they match a recipe you discover its product,
// which joins your shelf. Your shelf = base reagents + raw finds + minerals named in the Mineral Cabinet + products.
// prog.rooms.bench = { plays, made: [productIds], tries, last, look }. Milestones (10, 30, all) are the trophy levels.
import { BASE, RAW, RECIPES, PRODUCTS, OPS } from "./data.js";
import { MINERALS, mineral } from "../minerals/data.js";
import { foundMinerals } from "../minerals/logic.js";
import { dailySeed, todayKey } from "../daily.js";

export const MAKE_PAY = 6, MILESTONES = [10, 30, PRODUCTS.length];
export function room(p) { const r = ((p.rooms ||= {}).bench ||= { plays: 0 }); r.made ||= []; r.tries ||= 0; r.look ||= {}; return r; }
const key = (ids) => [...ids].sort().join("+");
const INDEX = new Map(); for (const r of RECIPES) INDEX.set(key(r.in) + "|" + r.op, r);

/** One shelf item, whatever kind it is: { id, name, f, kind: base|raw|mineral|product, c }. */
export function item(id) {
  const b = BASE.find((x) => x.id === id) || RAW.find((x) => x.id === id); if (b) return { ...b, kind: b.id.endsWith("-raw") ? "raw" : "base" };
  const m = mineral(id); if (m) return { id, name: m.name, f: m.f, kind: "mineral", c: m.c[0] };
  const pr = PRODUCTS.find((x) => x.id === id); if (pr) return { ...pr, kind: "product", c: "#d8c08a" };
  return null;
}
/** Everything on your shelf now. */
export const shelf = (p) => [...BASE.map((b) => b.id), ...RAW.map((r) => r.id), ...foundMinerals(p), ...room(p).made];
/** Every mineral any recipe uses: the ones not yet named show as locked jars with a hint. */
export const NEEDED_MINERALS = [...new Set(RECIPES.flatMap((r) => r.in).filter((id) => mineral(id)))];
export function hintFor(id) {
  const m = mineral(id); if (!m) return "";
  const bits = [m.lustre === "metallic" ? "a shiny metallic" : `a ${m.lustre}`, m.c ? "" : "", m.fizz === "yes" ? "stone that fizzes in acid" : m.mag === "yes" ? "stone a magnet grabs" : m.sg >= 6 ? "very heavy stone" : m.hard >= 7 ? "very hard stone" : m.hard <= 2 ? "very soft stone" : "stone"];
  return `${bits.filter(Boolean).join(" ")} (${m.cls}); name it in the Mineral Cabinet`;
}
/** Try a mix. Returns { recipe, fresh } or { none: true, why }. */
export function attempt(p, ids, op) {
  const r = room(p); r.tries++;
  if (!ids.length || !OPS[op]) return { none: true, why: "empty" };
  const rec = INDEX.get(key(ids) + "|" + op);
  if (!rec) return { none: true, why: RECIPES.some((x) => key(x.in) === key(ids)) ? "op" : RECIPES.some((x) => x.op === op && ids.every((i) => x.in.includes(i)) && x.in.length > ids.length) ? "more" : "nothing" };
  const fresh = !r.made.includes(rec.id); if (fresh) r.made.push(rec.id); r.plays++; r.last = rec.id;
  return { recipe: rec, fresh };
}
/** Which milestone level (1-3) a discovery count has just reached, or 0. */
export const milestoneAt = (n) => MILESTONES.indexOf(n) + 1;
export const madeCount = (p) => room(p).made.length;
/** Recipes whose ingredients you have all got but haven't made yet (for "what could I try?" hints). */
export function within(p) { const s = new Set(shelf(p)), made = room(p).made; return RECIPES.filter((r) => !made.includes(r.id) && r.in.every((i) => s.has(i))); }
/** The daily target: a product reachable from base reagents plus at most one mineral, the same for everyone. */
export function dailyOf(day = todayKey()) {
  const seed = dailySeed("bench", day), pool = RECIPES.filter((r) => r.in.filter((i) => mineral(i)).length <= 1);
  const rec = pool[seed % pool.length]; return { seed, day, target: rec.id, recipe: rec };
}
export { MINERALS };
