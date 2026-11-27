// Collect-everything rewards: each Codex system finished pays 💎 50, the whole Codex earns 💎 500 and the Archivist's
// tome binding, and finding all 7 Grimoire secrets pays 💎 150 (and the Keeper's sigil emote, in emotes.js). Paid once,
// tracked in prog.coll = { sys: [keys], codex, secrets }. Rules and markup only; main.js announces them.
import { CODEX } from "./game.js";
import { SECRETS } from "./secrets.js";

export const SYS_PAY = 50, CODEX_PAY = 500, SECRETS_PAY = 150;
export const sysDone = (p, key) => !!CODEX[key] && (p.codex?.[key] || []).length >= CODEX[key].total;
export const doneSystems = (p) => Object.keys(CODEX).filter((k) => sysDone(p, k));
export const codexDone = (p) => doneSystems(p).length === Object.keys(CODEX).length;
export const secretsDone = (p) => SECRETS.every((s) => (p.gs || []).includes(s.id));
/** Pay anything newly completed. Returns [{ kind: "sys"|"codex"|"secrets", key?, pay }] for what was paid just now. */
export function checkCollect(p) {
  const c = (p.coll ||= { sys: [], codex: false, secrets: false }), out = [];
  c.sys = Array.isArray(c.sys) ? c.sys : [];
  for (const k of doneSystems(p)) if (!c.sys.includes(k)) { c.sys.push(k); out.push({ kind: "sys", key: k, pay: SYS_PAY }); }
  if (!c.codex && codexDone(p)) { c.codex = true; p.owned = p.owned || []; if (!p.owned.includes("bk-archive")) p.owned.push("bk-archive"); out.push({ kind: "codex", pay: CODEX_PAY }); }
  if (!c.secrets && secretsDone(p)) { c.secrets = true; out.push({ kind: "secrets", pay: SECRETS_PAY }); }
  for (const x of out) p.essence = (p.essence || 0) + x.pay;
  return out;
}
/** The collections panel for the Secrets pages. */
export function collectHtml(p, esc, { codes = [0, 0], labels = {} } = {}) {
  const keys = Object.keys(CODEX), d = doneSystems(p).length, s = SECRETS.filter((x) => (p.gs || []).includes(x.id)).length;
  const row = (e, t, n, of, prize) => `<div class="co-row${n >= of ? " done" : ""}"><span class="co-e">${n >= of ? "✓" : e}</span><div><b>${t}</b><small>${prize}</small><i class="co-bar"><i style="--p:${Math.round((Math.min(n, of) / of) * 100)}%"></i></i></div><em>${n}/${of}</em></div>`;
  return `<h4>🏛️ Collections</h4><div class="co">${row("🗝️", "Every secret", s, SECRETS.length, `💎 ${SECRETS_PAY} and the Keeper's sigil emote`)}${row("🔐", "Every coded message", codes[0], codes[1], "The Codebreaker's folio binding")}${row("📜", "Codex systems finished", d, keys.length, `💎 ${SYS_PAY} each, and a gold plate on the page`)}${row("🏛️", "The whole Codex", d, keys.length, `💎 ${CODEX_PAY} and the Archivist's tome binding`)}</div>
  <p class="bk-note">Systems still open: ${keys.filter((k) => !sysDone(p, k)).map((k) => `${esc(labels[k] || k)} ${(p.codex?.[k] || []).length}/${CODEX[k].total}`).join(" · ") || "none. You finished the Codex."}</p>`;
}
