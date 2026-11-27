// /commission: today's three Commissions (the same for everyone), step 3 of the Alchemist's House core loop.
// Each client asks for a real product made at the Discovery Bench, for the real job it did. Shared with the room.
import { jobsOf, productName } from "../../../activity/src/commissions/logic.js";
import { TIERS, tierOf } from "../../../activity/src/commissions/data.js";
import { todayKey } from "../../../activity/src/daily.js";
import { cut } from "../../card.js";

export const command = {
  name: "commission",
  description: "Today's three Commissions: real clients asking for real products from the Discovery Bench",
  options: [{ type: 5, name: "private", description: "Only you see the board (default: posted to the channel)" }],
};
const AMBER = 0xD8A838;

/** The board for a day: [{ job, tier, product }]. */
export const boardFor = (day = todayKey()) => jobsOf(day).map((j) => ({ job: j, tier: tierOf(j.tier), product: productName(j.wants) }));

export function readingEmbeds(board, day) {
  return [{
    title: `📋 Commissions · ${day.split("-").reverse().join("/")}`, color: AMBER,
    description: "Three letters on the board today, the same for every alchemist. Make the product at the **Discovery Bench**, then deliver it in **Commissions** for 💎, philosopher's stones and reputation.",
    fields: [
      ...board.map(({ job, tier, product }) => ({ name: `${job.e} ${job.who} · ${tier.emoji} ${tier.name}`, value: cut(`"${job.ask}"\nWants: **${product}** · pays 💎 ${tier.pay} + 🪨 ${tier.stones} + ${tier.rep} reputation\n${job.why}`) })),
      { name: "🏅 Reputation", value: TIERS.map((t) => `${t.emoji} ${t.name}: from ${t.at}`).join(" · ") },
      { name: "⚗️ Play it", value: "Run `/oracle` and open the Chamber: Discovery Bench, then Commissions. Vell's lab has both." },
    ],
    footer: { text: "Science is Magic · real chemistry, real history" },
  }];
}
export async function run(o = {}, ctx = {}) {
  const day = todayKey(ctx.now || new Date()), board = boardFor(day);
  return { embeds: readingEmbeds(board, day), files: [], ephemeral: !!o.private, headline: board.map((b) => b.product).join(" · ") };
}
