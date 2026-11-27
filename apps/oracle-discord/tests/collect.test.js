// Collect-everything rewards (activity/src/collect.js).
import { test } from "node:test";
import assert from "node:assert/strict";
import { checkCollect, collectHtml, SYS_PAY, CODEX_PAY, SECRETS_PAY } from "../activity/src/collect.js";
import { CODEX } from "../activity/src/game.js";
import { SECRETS } from "../activity/src/secrets.js";
import { BOOKS } from "../activity/src/book.js";
const fill = (k) => Array.from({ length: CODEX[k].total }, (_, i) => k + i);
test("a finished system pays once; the whole Codex pays and gives the Archivist's tome", () => {
  const p = { essence: 0, codex: { humandesign: fill("humandesign") } };
  assert.deepEqual(checkCollect(p).map((x) => x.kind), ["sys"]); assert.equal(p.essence, SYS_PAY); assert.equal(checkCollect(p).length, 0);
  for (const k of Object.keys(CODEX)) p.codex[k] = fill(k);
  const got = checkCollect(p); assert.ok(got.some((x) => x.kind === "codex")); assert.ok(p.owned.includes("bk-archive"));
  assert.equal(p.essence, SYS_PAY * Object.keys(CODEX).length + CODEX_PAY); assert.ok(BOOKS.some((b) => b.id === "bk-archive"));
});
test("all secrets pay once; the panel renders", () => {
  const p = { essence: 0, gs: SECRETS.map((s) => s.id) };
  assert.equal(checkCollect(p)[0].kind, "secrets"); assert.equal(p.essence, SECRETS_PAY); assert.equal(checkCollect(p).length, 0);
  assert.ok(collectHtml(p, String, { codes: [1, 16] }).includes("Every secret"));
});
