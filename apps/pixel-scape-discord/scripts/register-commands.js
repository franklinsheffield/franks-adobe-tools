// Registers the slash commands globally. Env: DISCORD_APP_ID, DISCORD_BOT_TOKEN.
"use strict";
(async () => {
  const { COMMANDS } = await import("../worker/index.mjs");
  const r = await fetch(`https://discord.com/api/v10/applications/${process.env.DISCORD_APP_ID}/commands`, {
    method: "PUT", headers: { authorization: "Bot " + process.env.DISCORD_BOT_TOKEN, "content-type": "application/json" }, body: JSON.stringify(COMMANDS),
  });
  console.log("register commands:", r.status); if (!r.ok) { console.error(await r.text()); process.exit(1); }
})();
