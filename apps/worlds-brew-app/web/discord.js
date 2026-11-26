// Pixel Scape web build: running as a Discord Activity (D3). Discord loads the app in a frame with ?frame_id=...;
// then we start the Embedded App SDK, sign the member in (our Worker swaps the code for a token, it holds the secret),
// and route outside downloads through Discord's proxy (URL mappings set in the Developer Portal, same prefixes).
import { DiscordSDK, patchUrlMappings } from "@discord/embedded-app-sdk";

export const CLIENT_ID = "1575319071283617842";   // Discord app "Pixel Scape" (public)
// Developer Portal > Activities > URL Mappings must hold these same prefixes
export const MAPPINGS = [
  { prefix: "/aws", target: "s3.amazonaws.com" },
  { prefix: "/s2", target: "sentinel-cogs.s3.us-west-2.amazonaws.com" },
  { prefix: "/overture", target: "overturemaps-extras-us-west-2.s3.us-west-2.amazonaws.com" },
  { prefix: "/osm", target: "nominatim.openstreetmap.org" }
];
export const inDiscord = () => new URLSearchParams(location.search).has("frame_id");

export async function startDiscord(say) {
  patchUrlMappings(MAPPINGS);
  const sdk = new DiscordSDK(CLIENT_ID);
  await sdk.ready();
  const { code } = await sdk.commands.authorize({ client_id: CLIENT_ID, response_type: "code", state: "", prompt: "none", scope: ["identify", "guilds"] });
  const r = await fetch("/.proxy/api/token", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
  if (!r.ok) throw new Error("sign-in failed (" + r.status + ")");
  const { access_token } = await r.json();
  const auth = await sdk.commands.authenticate({ access_token });
  const user = auth && auth.user;
  if (say) say("Signed in to Discord as " + (user && (user.global_name || user.username)));
  return { sdk, user, channelId: sdk.channelId, guildId: sdk.guildId };
}
