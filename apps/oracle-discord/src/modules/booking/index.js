// /booking: today's 3 bookings from the Séance Parlour (Tonight's Bill), the same ones the Bookings room shows, for
// members who can't open Activities. It shows what each client wants, never the answers. Pure data: bookings/bill.js.
import { tonightsBill, venueOf, CLIENTS, utcDay } from "../../../activity/src/bookings/bill.js";
import { caseOf, method } from "../../../activity/src/casefiles/data.js";
import { GOLD } from "../../card.js";

export const command = {
  name: "booking",
  description: "Tonight's Bill from the Séance Parlour: today's 3 bookings, the same for everyone",
  options: [{ type: 5, name: "private", description: "Only you see it (default: posted to the channel)" }],
};

const PART = { expose: "📰 expose a claim", perform: "🎭 perform a trick", explain: "🔬 explain a method" };
/** One booking as an embed field: venue, client, the parts, and the case or moment they ask for (no answers). */
export function fieldOf(b) {
  const v = venueOf(b.venue), c = CLIENTS[b.client], lead = b.parts[0];
  const ask = lead.kind === "expose" ? `The claim: **${caseOf(lead.caseId).name}** (${caseOf(lead.caseId).year}).` : lead.kind === "perform" ? `The audience must see: “${lead.brief}”` : `Demonstrate: **${method(lead.method).name}**.`;
  return { name: `${"★".repeat(b.lv)} Level ${b.lv} · ${v.e} ${v.name}`, value: `${c.e} ${c.name} ${c.ask}. Parts: ${b.parts.map((p) => PART[p.kind]).join(" → ")}.\n${ask}\n*${v.fact}*` };
}
export function billEmbeds(bill) {
  return [{
    title: `🎟️ Tonight's Bill · ${bill.day}`, color: GOLD,
    description: "Three bookings, the same for everyone today. Every one is real history: no booking asks anyone to contact the dead.",
    fields: [...bill.bookings.map(fieldOf), { name: "🎩 Play it", value: "Take these bookings in the **Bookings** room: run `/oracle`, open the Oracle Chamber, or visit Madame Rook's Parlour." }],
    footer: { text: "Science is Magic · Séance Parlour · new bill every day at 00:00 UTC" },
  }];
}
export async function run(o = {}, ctx = {}) {
  const bill = tonightsBill(utcDay(ctx.now || new Date()));
  return { embeds: billEmbeds(bill), files: [], ephemeral: !!o.private, headline: `Tonight's Bill, ${bill.day}` };
}
