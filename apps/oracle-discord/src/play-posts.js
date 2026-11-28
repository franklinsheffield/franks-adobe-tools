// One-tap entry to the Houses (Frank 2026-11-28 03:10Z: "make it very easy"). Each House's game channel and
// #🚪-choose-your-house get one pinned card with a big button; the button (custom_id PLAY_ID) answers with
// LAUNCH_ACTIVITY, so the Activity opens in that channel and hostFor() picks its House. Built by
// scripts/play-posts.js; the worker answers the button (worker/index.js).
export const PLAY_ID = "house:play";
export const CHOOSE_CHANNEL = "1576066769657798767"; // #🚪-choose-your-house
const WHAT = {
  oracle: "readings, card games and the history of real magic",
  alchemist: "flame tests, minerals and real chemistry",
  observatory: "comets, eclipses, constellations and the real sky tonight",
  parlour: "case files, stage tricks and how the mediums did it",
  scriptorium: "codes, ciphers, forgeries and the Bombe",
};
const low = (s) => s.replace(/^The /, "the "); // mid-sentence: "keeps the Observatory"
const hex = (c) => parseInt(String(c).replace("#", ""), 16);
const button = (label, emoji, style = 1) => ({ type: 1, components: [{ type: 2, style, custom_id: PLAY_ID, label, emoji: { name: emoji } }] });

/** The pinned card for one House's game channel. h: a host pack ({ id, name, house, emoji, accent }). */
export function housePost(h) {
  const desc = [
    `${h.name} keeps ${low(h.house)}: ${WHAT[h.id]}.`,
    "",
    "**Press the button below** and the game opens right here, on a computer or a phone.",
    "• No House yet? You meet the Five Doors first and pick your home.",
    "• Not your House yet? Come in anyway: you can look round and try a taster game.",
    "",
    "You can also type `/play` in this channel.",
  ].join("\n");
  return { embeds: [{ title: `${h.emoji} ${h.house}`, description: desc, color: hex(h.accent) }],
    components: [button(`Enter ${low(h.house)}`, h.emoji)], allowed_mentions: { parse: [] } };
}

/** The Threshold card in #🚪-choose-your-house: the Five Doors, and how to get in on each device. */
export function doorsPost(houses) {
  const list = houses.map((h) => `${h.emoji} **${h.house}** with ${low(h.name)}`).join("\n");
  const desc = [
    "Five Houses, and every one of them is a game.",
    "",
    list,
    "",
    "**Press 🚪 Knock below.** The Five Doors open: tap a door to meet its host, then pick the House that calls you. It becomes your home for good, and the others open as you level up.",
    "",
    "**On a computer:** press the button. The first time, Discord asks you to authorise **Science is Magic**: press Authorise and you're in.",
    "**On a phone:** the same button works. If nothing opens, update the Discord app, then try again.",
    "",
    "**After you pick:** your House's channel has its own **Enter** button pinned at the top, and `/play` works in any House channel.",
  ].join("\n");
  return { embeds: [{ title: "🚪 The Five Doors", description: desc, color: hex("#D9B35B") }],
    components: [button("Knock on the Five Doors", "🚪", 3)], allowed_mentions: { parse: [] } };
}

/** Every card to post: [{ channelId, label, body }]. Game channels come from the host packs. */
export function playPosts(houses) {
  return [{ channelId: CHOOSE_CHANNEL, label: "#🚪-choose-your-house", body: doorsPost(houses) },
    ...houses.map((h) => ({ channelId: h.channelIds[0], label: `${h.house} game channel`, body: housePost(h) }))];
}
/** Is this message one of our play cards? (so re-runs edit it instead of posting a second one) */
export const isPlayCard = (m, botId) => m.author && m.author.id === botId &&
  (m.components || []).some((r) => (r.components || []).some((c) => c.custom_id === PLAY_ID));
