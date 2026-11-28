// Discord side of the Oracle Chamber: start the Embedded App SDK, sign the member in (the Worker swaps the
// code for a token and holds the client secret) and route OpenStreetMap lookups through Discord's proxy.
import { DiscordSDK, patchUrlMappings } from "@discord/embedded-app-sdk";

export const CLIENT_ID = "1575582995878772789"; // Discord app "Science is Magic Oracle" (public id)
// Developer Portal > Activities > URL Mappings must hold this same prefix (root "/" maps to the Chamber Worker).
export const MAPPINGS = [{ prefix: "/osm", target: "nominatim.openstreetmap.org" }];
export const inDiscord = () => new URLSearchParams(location.search).has("frame_id");
/** Discord's mobile app floats its title bar and Leave button over the top of the Activity: mark the page so CSS can keep clear of it. */
export const onDiscordPhone = () => inDiscord() && new URLSearchParams(location.search).get("platform") === "mobile";
export const api = (p) => (inDiscord() ? "/.proxy" : "") + p;

/** -> { sdk, user, token } (user/token null when sign-in isn't set up). Throws only if the SDK can't start. */
export async function startDiscord() {
  patchUrlMappings(MAPPINGS);
  const sdk = new DiscordSDK(CLIENT_ID);
  await sdk.ready();
  // Phones: let the member turn the phone sideways (the Developer Portal's default lock still applies until this lands).
  if (sdk.platform === "mobile") sdk.commands.setOrientationLockState({ lock_state: 1, picture_in_picture_lock_state: 1, grid_lock_state: 1 }).catch((e) => console.warn("Oracle Chamber: orientation stays locked:", e.message));
  try {
    const { code } = await sdk.commands.authorize({ client_id: CLIENT_ID, response_type: "code", state: "", prompt: "none", scope: ["identify"] });
    const r = await fetch(api("/api/token"), { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ code }) });
    if (!r.ok) throw new Error("sign-in " + r.status);
    const { access_token } = await r.json();
    const auth = await sdk.commands.authenticate({ access_token });
    return { sdk, user: auth && auth.user, token: access_token, guildId: sdk.guildId || null };
  } catch (e) {
    console.warn("Oracle Chamber: continuing without sign-in:", e.message);
    return { sdk, user: null, token: null, guildId: sdk.guildId || null };
  }
}
