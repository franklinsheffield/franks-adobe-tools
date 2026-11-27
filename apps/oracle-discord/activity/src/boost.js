// Server boosts: a member who boosts the Science is Magic server gets a big Essence gift and the Oracle's thanks.
// The Chamber Worker (/api/boost) checks the boost with the bot (Discord's premium_since) and pays each boost once.

/** Essence for each new boost. */
export const BOOST_ESSENCE = 500;
/** What the Oracle says the first time she sees your boost ({name} = the member). */
export const BOOST_THANKS = [
  "{name}… you boosted the server? For me? The crystal ball is fogging up. Here: 💎 500 Essence, with all my thanks.",
  "A boost! {name}, the whole Chamber just got brighter, and so did my eye. Take 💎 500 Essence. Thank you, truly.",
  "The spirits are whispering your name, {name}. Something about a boost? Thank you. 💎 500 Essence is yours.",
];
/** A smaller hello when a booster comes back. */
export const BOOSTER_HELLO = ["Welcome back, {name}. Still boosting the server. I see you, and I'm grateful. 💜", "{name}, our booster! The candles burn a little taller when you walk in. 💜"];

/** Read a member's boost from their guild member record. Returns ISO time or null. */
export const boostSince = (member) => (member && typeof member.premium_since === "string" ? member.premium_since : null);
/** Decide the reward: ledger = { paid: [since, ...] } from storage. Returns { boosting, fresh, reward, since, ledger }. */
export function settleBoost(member, ledger) {
  const since = boostSince(member), L = { paid: Array.isArray(ledger && ledger.paid) ? ledger.paid.slice(-20) : [] };
  if (!since) return { boosting: false, fresh: false, reward: 0, since: null, ledger: L };
  if (L.paid.includes(since)) return { boosting: true, fresh: false, reward: 0, since, ledger: L };
  L.paid.push(since); return { boosting: true, fresh: true, reward: BOOST_ESSENCE, since, ledger: L };
}
