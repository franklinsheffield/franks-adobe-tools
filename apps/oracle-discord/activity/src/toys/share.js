// Post a toy's result to the Discord channel as a page from the bot (the Activity Worker's /api/share), or copy it
// to the clipboard outside Discord. Calls back with a short status line for the player.
import { api } from "../discord.js";

export function shareToy(state, { title, lines, color = "#E2B04A" }, done = () => {}) {
  if (state.token && state.channelId) {
    fetch(api("/api/share"), { method: "POST", headers: { authorization: "Bearer " + state.token, "content-type": "application/json" }, body: JSON.stringify({ channelId: state.channelId, title, lines, color }) })
      .then((r) => r.json()).then((r) => done(r.ok ? "📤 Posted in the channel" : `Not posted: ${r.error || "try again"}`)).catch(() => done("Not posted: offline"));
    return;
  }
  try { navigator.clipboard.writeText(`${title}\n${lines.join("\n")}`).then(() => done("📋 Copied. Paste it in the chat."), () => done("Posting works inside Discord")); } catch { done("Posting works inside Discord"); }
}
