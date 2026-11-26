// Registers the slash commands globally. Env: DISCORD_APP_ID, DISCORD_BOT_TOKEN.
// Uses the application id that the bot token belongs to, and warns if DISCORD_APP_ID differs.
"use strict";
(async () => {
  const { COMMANDS } = await import("../worker/index.mjs");
  const auth = { authorization: "Bot " + (process.env.DISCORD_BOT_TOKEN || "").trim() };
  const envId = (process.env.DISCORD_APP_ID || "").trim();
  const me = await fetch("https://discord.com/api/v10/oauth2/applications/@me", { headers: auth });
  if (!me.ok) { console.error("bot token check failed:", me.status, await me.text()); process.exit(1); }
  const app = await me.json();
  console.log(`bot token belongs to app "${app.name}" (id ${app.id.split("").join(" ")})`);
  if (envId !== app.id) console.warn(`::warning::DISCORD_APP_ID secret (length ${envId.length}) does not match the bot token's app id`);
  // keep the Activity's entry point command (type 4, made by Discord when Activities are turned on): a bulk PUT
  // without it would delete it and the Activity could not be launched
  const cur = await fetch(`https://discord.com/api/v10/applications/${app.id}/commands`, { headers: auth });
  const keep = cur.ok ? (await cur.json()).filter((c) => c.type === 4).map(({ id, name, description, type, handler, integration_types, contexts }) => ({ id, name, description, type, handler, integration_types, contexts })) : [];
  if (keep.length) console.log("keeping entry point command:", keep.map((c) => c.name).join(", "));
  const r = await fetch(`https://discord.com/api/v10/applications/${app.id}/commands`, {
    method: "PUT", headers: { ...auth, "content-type": "application/json" }, body: JSON.stringify(COMMANDS.concat(keep)),
  });
  console.log("register commands:", r.status); if (!r.ok) { console.error(await r.text()); process.exit(1); }
})();
