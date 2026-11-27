// The store's ✨ Featured department: a weekly rotating shelf (with a rare item some weeks), full sets with a set aura,
// and mystery boxes. Everything is bought with Essence, which is only earned by playing. Box odds are shown in full.
import { STORE, item } from "./store.js";
import { onSale } from "./character.js";

// ---- the week ----
/** Weeks since Monday 5 Jan 1970 (UTC), so every member sees the same shelf and it turns over Monday 00:00 UTC. */
export const weekOf = (at = Date.now()) => Math.floor((at - Date.UTC(1970, 0, 5)) / (7 * 864e5));
export const weekEnds = (at = Date.now()) => Date.UTC(1970, 0, 5) + (weekOf(at) + 1) * 7 * 864e5;
export const FEATURED_OFF = 0.2;
const hash = (n) => { let x = (n * 2654435761) >>> 0; x ^= x >>> 15; x = Math.imul(x, 2246822519) >>> 0; x ^= x >>> 13; return x >>> 0; };
/** Items the weekly shelf may pick: sold items with a price, not rare, not a set piece. */
const pool = () => STORE.filter((s) => s.price > 0 && !s.rare && !s.set && !s.secret && !s.season);
/** This week's 4 featured items (20% off), the same for everyone. */
export function featured(at = Date.now()) {
  const P = pool().sort((a, b) => a.id.localeCompare(b.id)), w = weekOf(at), out = [];
  for (let k = 0; out.length < Math.min(4, P.length); k++) { const it = P[hash(w * 31 + k) % P.length]; if (!out.includes(it)) out.push(it); }
  return out;
}
export const RARES = () => STORE.filter((s) => s.rare);
/** The rare item on sale this week, or null: two weeks in three carry one, taking turns. */
export function rareOf(at = Date.now()) { const w = weekOf(at), R = RARES(); return R.length && w % 3 !== 2 ? R[hash(w) % R.length] : null; }
export const salePrice = (it) => Math.round(it.price * (1 - FEATURED_OFF) / 5) * 5;
/** What an item costs right now (featured items are discounted), or null when it can't be bought this week. */
export function priceNow(id, at = Date.now()) {
  const it = item(id); if (!it) return null;
  if (it.season) return onSale(it, at) ? it.price : null;
  if (it.rare) return rareOf(at) && rareOf(at).id === id ? it.price : null;
  return featured(at).some((x) => x.id === id) ? salePrice(it) : it.price;
}
export function buyNow(p, id, at = Date.now()) {
  const price = priceNow(id, at); p.owned = p.owned || [];
  if (price == null || p.owned.includes(id) || (p.essence || 0) < price) return false;
  p.essence -= price; p.owned.push(id); return true;
}

// ---- full sets ----
export const SETS = [
  { id: "deepsea", name: "Deep Sea", e: "🐙", blurb: "Bubbles rise around the Oracle and jellyfish drift past", kinds: { outfit: "set-abyss-robe", cloth: "set-abyss-cloth", flame: "set-abyss-flame", book: "bk-abyss" } },
  { id: "clockwork", name: "Clockwork", e: "⚙️", blurb: "Brass gears turn behind the Oracle and the hood ticks", kinds: { outfit: "set-clock-robe", cloth: "set-clock-cloth", flame: "set-clock-flame", book: "bk-clock" } },
  { id: "aurora", name: "Aurora", e: "🌌", blurb: "Northern lights ripple across the sky behind the Oracle", kinds: { outfit: "set-aurora-robe", cloth: "set-aurora-cloth", flame: "set-aurora-flame", book: "bk-aurora" } },
];
/** The set the member is wearing in full, or null. */
export const wornSet = (p) => SETS.find((s) => Object.entries(s.kinds).every(([k, id]) => p[k] === id)) || null;
export const setProgress = (p, s) => { const ids = Object.values(s.kinds), own = ids.filter((id) => (p.owned || []).includes(id)).length; return { own, of: ids.length, worn: Object.entries(s.kinds).filter(([k, id]) => p[k] === id).length }; };

// ---- mystery boxes ----
export const TIERS = [{ id: "common", name: "Common", max: 100 }, { id: "rare", name: "Rare", max: 200 }, { id: "epic", name: "Epic", max: Infinity }];
export const BOXES = [
  { id: "box-curio", name: "Curio box", e: "📦", price: 90, odds: { common: 75, rare: 22, epic: 3 } },
  { id: "box-grand", name: "Grand box", e: "🎁", price: 200, odds: { common: 40, rare: 45, epic: 15 } },
];
export const REFUND = 0.5;
const tierOf = (it) => TIERS.find((t) => it.price <= t.max).id;
/** Everything a box can hold, by tier (sold items; no rare, secret or free items). */
export function boxPool() { const P = { common: [], rare: [], epic: [] }; for (const it of STORE.filter((s) => s.price > 0 && !s.rare && !s.secret && !s.season)) P[tierOf(it)].push(it); return P; }
/** Open a box: roll the tier by its shown odds, then an item in that tier. A duplicate refunds half the box. */
export function openBox(p, boxId, rnd = Math.random) {
  const b = BOXES.find((x) => x.id === boxId); if (!b || (p.essence || 0) < b.price) return null;
  const P = boxPool(); let roll = rnd() * 100, tier = "common";
  for (const t of TIERS) { const o = b.odds[t.id] || 0; if (roll < o) { tier = t.id; break; } roll -= o; }
  const list = P[tier].length ? P[tier] : P.common, it = list[Math.floor(rnd() * list.length)];
  p.essence -= b.price; p.owned = p.owned || [];
  const dupe = p.owned.includes(it.id), refund = dupe ? Math.round(b.price * REFUND) : 0;
  if (dupe) p.essence += refund; else p.owned.push(it.id);
  return { item: it, tier, dupe, refund };
}
