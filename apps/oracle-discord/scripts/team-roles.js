// Team roles (Frank 2026-11-28 03:04Z): create "Dev" and "Teacher" (no permissions, reused by name) and give both to dev.n.
// Run by .github/workflows/server-layout.yml mode "team". Re-runnable.
const GUILD = process.env.GUILD_ID || "1530029383404884069", token = process.env.DISCORD_BOT_TOKEN;
if (!token) { console.error("DISCORD_BOT_TOKEN missing"); process.exit(1); }
const REASON = { "x-audit-log-reason": "Team roles for dev.n (Frank)" };
const api = async (path, o = {}) => {
  for (let i = 0; i < 5; i++) {
    const r = await fetch("https://discord.com/api/v10" + path, { ...o, headers: { authorization: "Bot " + token, ...(o.body ? { "content-type": "application/json" } : {}), ...(o.headers || {}) } });
    if (r.status === 429) { const j = await r.json().catch(() => ({})); await new Promise((ok) => setTimeout(ok, Math.ceil((j.retry_after || 1) * 1000))); continue; }
    if (!r.ok) throw new Error(`${o.method || "GET"} ${path}: ${r.status} ${await r.text()}`);
    return r.status === 204 ? null : r.json();
  }
  throw new Error("rate limited: " + path);
};
const ROLES = [{ name: "Dev", color: 0x5effc8, hoist: true }, { name: "Teacher", color: 0xe2b04a, hoist: false }];
const roles = await api(`/guilds/${GUILD}/roles`);
const found = await api(`/guilds/${GUILD}/members/search?query=${encodeURIComponent("dev.n")}&limit=10`);
const dev = found.find((m) => [m.user.username, m.user.global_name, m.nick].some((n) => String(n || "").toLowerCase() === "dev.n"));
if (!dev) { console.error("dev.n not found; nothing changed"); process.exit(1); }
for (const spec of ROLES) {
  let r = roles.find((x) => x.name === spec.name);
  if (!r) { r = await api(`/guilds/${GUILD}/roles`, { method: "POST", headers: REASON, body: JSON.stringify({ ...spec, permissions: "0", mentionable: false }) }); console.log("created role:", spec.name, r.id); }
  else console.log("role exists:", spec.name, r.id);
  if (!dev.roles.includes(r.id)) { await api(`/guilds/${GUILD}/members/${dev.user.id}/roles/${r.id}`, { method: "PUT", headers: REASON }); console.log("given to dev.n:", spec.name); }
  else console.log("dev.n already has:", spec.name);
}
