// The pinned one-tap Play cards (src/play-posts.js) and the worker's answer to their button.
import test from "node:test";
import assert from "node:assert/strict";
import { HOSTS } from "../activity/src/hosts/index.js";
import { playPosts, housePost, doorsPost, isPlayCard, PLAY_ID, CHOOSE_CHANNEL } from "../src/play-posts.js";
import { readFileSync } from "node:fs";

test("one card per House game channel plus the Five Doors card", () => {
  const posts = playPosts(HOSTS);
  assert.equal(posts.length, HOSTS.length + 1);
  assert.equal(posts[0].channelId, CHOOSE_CHANNEL);
  HOSTS.forEach((h, i) => assert.equal(posts[i + 1].channelId, h.channelIds[0]));
});
test("every card fits Discord's limits and carries the launch button", () => {
  for (const { body } of playPosts(HOSTS)) {
    const e = body.embeds[0], b = body.components[0].components[0];
    assert.ok(e.title.length <= 256 && e.description.length <= 4096);
    assert.ok(!/undefined/.test(e.description), e.title);
    assert.equal(b.custom_id, PLAY_ID); assert.ok(b.label.length <= 80);
    assert.deepEqual(body.allowed_mentions, { parse: [] });
  }
  assert.match(doorsPost(HOSTS).embeds[0].description, /On a phone/);
  assert.match(housePost(HOSTS[1]).components[0].components[0].label, /Alchemist/);
});
test("re-runs find the card already posted", () => {
  const m = { author: { id: "bot" }, components: [{ components: [{ custom_id: PLAY_ID }] }] };
  assert.ok(isPlayCard(m, "bot")); assert.ok(!isPlayCard(m, "someone")); assert.ok(!isPlayCard({ author: { id: "bot" } }, "bot"));
});
test("the worker launches the Activity from the button", () => {
  const w = readFileSync(new URL("../worker/index.js", import.meta.url), "utf8");
  assert.match(w, /id === PLAY_ID\) return env\.ACTIVITY_READY === "true" \? json\(\{ type: 12 \}\)/);
});
