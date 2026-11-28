// The Five Doors (House pick screen) and visitor mode. Shown only while the House gate is on (levels.js).
// First launch: all five Houses side by side; tap one to hear its host and see its 3 best games, then confirm.
// Later level-ups that owe a pick reopen the same screen with the Houses already opened marked. The pick is permanent.
// Not "Hall of Doors": that name belongs to home.js's tabs.
import { pathOf, choosable, levelOf, levelName, unlockHint, classOf, subclassOf, orderOf, HOUSE_IDS } from "./levels.js";

/** houses: the host packs ({ id, name, house, emoji, accent }); games(h) -> up to 3 { emoji, label }. */
export function doorsHtml({ houses, p, esc, games = () => [] }) {
  const path = pathOf(p), can = choosable(p), first = !path.length, n = levelOf(p);
  const door = (h, i) => {
    const opened = path.includes(h.id), free = can.includes(h.id), order = path.indexOf(h.id);
    return `<button class="fd-door${opened ? " opened" : ""}${free ? "" : " shut"}" type="button" data-door="${h.id}" style="--acc:${h.accent};--i:${i}" ${free ? "" : 'aria-disabled="true"'} aria-label="${esc(h.house)}${opened ? ", opened" : free ? "" : ", locked"}">
      <span class="fd-arch" aria-hidden="true"><i class="fd-leaf l"></i><i class="fd-leaf r"></i><span class="fd-e">${h.emoji}</span></span>
      <b>${esc(h.house)}</b><small>${esc(h.name)}</small>${opened ? `<em class="fd-tag">${order === 0 ? "Home" : `Door ${order + 1}`}</em>` : free ? "" : `<em class="fd-tag">🔒</em>`}</button>`;
  };
  const title = first ? "The Five Doors" : "A door opens";
  const sub = first ? "Five Houses, one wallet, one Codex. Pick the House that calls you: it becomes your home, for good. The others open as you level up."
    : `Level ${n}, ${esc(levelName(n))}. Pick your next House. Your pick order becomes your path.`;
  return `<div class="fd" role="dialog" aria-label="${title}"><p class="fd-eye">Science is Magic</p><h2 class="fd-title">${title}</h2><p class="fd-sub">${sub}</p>
  <div class="fd-row">${houses.map(door).join("")}</div>
  <div class="fd-pick" id="fd-pick" hidden>${houses.map((h) => `<div class="fd-card" data-card="${h.id}" hidden style="--acc:${h.accent}">
    <p class="fd-host">${h.emoji} ${esc(h.name)} keeps ${esc(h.house)}.</p>
    <ul class="fd-games">${games(h).slice(0, 3).map((g) => `<li>${g.emoji} ${esc(g.label)}</li>`).join("")}</ul>
    ${previewTitle(path, h.id, esc)}
    <button class="c main fd-go" type="button" data-go="${h.id}">${first ? `✦ Make ${esc(h.house)} my home` : `✦ Open ${esc(h.house)}`}</button></div>`).join("")}
    <p class="fd-note">No switching later: your pick order is your path.</p></div>
</div>`;
}
/** What this pick would make you ("Astrochemist", "+ Royal Society Fellow", "Order of the Lamp"). */
function previewTitle(path, id, esc) {
  const next = [...path, id], c = path.length === 1 ? classOf(next) : null, s = path.length === 2 ? subclassOf(next) : null;
  const o = path.length === 3 ? orderOf(next) : null;
  const t = c ? `You'll be a <b>${esc(c.name)}</b>.` : s ? `Your subclass: <b>${esc(s.name)}</b>.` : o ? `Your Order: <b>${esc(o.name)}</b>, and the last House becomes your Capstone.` : "";
  return t ? `<p class="fd-becomes">${t}</p>` : "";
}

/** Tap a door to preview it (onPreview plays the host's sting); its button picks it (onPick). */
export function wireDoors(root, { onPreview = () => {}, onPick = () => {} } = {}) {
  const pick = root.querySelector("#fd-pick");
  root.querySelectorAll("[data-door]").forEach((b) => (b.onclick = () => {
    const id = b.dataset.door; if (b.getAttribute("aria-disabled") === "true") return onPreview(id, false);
    root.querySelectorAll("[data-door]").forEach((x) => x.classList.toggle("on", x === b));
    pick.hidden = false; pick.querySelectorAll("[data-card]").forEach((c) => { c.hidden = c.dataset.card !== id; });
    onPreview(id, true); pick.querySelector(`[data-go="${id}"]`)?.focus();
  }));
  root.querySelectorAll("[data-go]").forEach((b) => (b.onclick = () => { b.disabled = true; onPick(b.dataset.go); }));
}

/** Visitor mode: launched from a House this member hasn't opened. The host greets, says what opens it, offers a taster. */
export function visitorHtml({ h, p, esc, home = null, homeUrl = "", taster = null }) {
  const hint = unlockHint(p, h.id);
  const how = hint.now ? `You can open it now: your next pick is waiting at the Five Doors.`
    : hint.level ? `It opens with your pick at level ${hint.level} (${esc(hint.name)}), ${hint.toNext.toLocaleString("en")} ✦ from here.`
    : `It is not on your path yet.`;
  return `<div class="vs" style="--acc:${h.accent}"><p class="vs-eye">Visiting</p><h2 class="vs-title">${h.emoji} ${esc(h.house)}</h2>
  <p class="vs-say">${esc(h.name)} lets you look round. ${how}</p>
  <div class="choices">${taster ? `<button class="c main" type="button" id="vs-taster">${taster.emoji} Try ${esc(taster.label)}</button>` : ""}
  ${hint.now ? `<button class="c" type="button" id="vs-doors">🚪 Go to the Five Doors</button>` : ""}
  ${home && homeUrl ? `<a class="c" href="${esc(homeUrl)}" target="_blank" rel="noopener">${home.emoji} Back to ${esc(home.house)}</a>` : ""}</div></div>`;
}

/** The home channel link for "Back to your House" (Discord channel URL). */
export const channelUrl = (guildId, channelId) => (guildId && channelId ? `https://discord.com/channels/${guildId}/${channelId}` : "");
export { HOUSE_IDS };

export const DOORS_CSS = `
.fd{max-width:980px;margin:0 auto;padding:8px 4px 16px;text-align:center}
.fd-eye,.vs-eye{letter-spacing:.3em;text-transform:uppercase;font-size:.72rem;opacity:.7;margin:0}
.fd-title,.vs-title{margin:.2em 0 .1em;font-size:clamp(1.5rem,4vw,2.3rem)}
.fd-sub{opacity:.85;max-width:640px;margin:0 auto 14px}
.fd-row{display:grid;grid-template-columns:repeat(5,minmax(0,1fr));gap:10px}
@media (max-width:700px){.fd-row{grid-template-columns:repeat(3,minmax(0,1fr))}}
@media (max-width:420px){.fd-row{grid-template-columns:repeat(2,minmax(0,1fr))}}
.fd-door{position:relative;display:flex;flex-direction:column;align-items:center;gap:4px;padding:10px 6px 12px;border-radius:14px;border:1px solid color-mix(in srgb,var(--acc) 55%,transparent);background:linear-gradient(180deg,color-mix(in srgb,var(--acc) 18%,#07050F),#07050F);color:inherit;cursor:pointer;animation:fd-in .5s ease both;animation-delay:calc(var(--i)*70ms)}
.fd-door b{font-size:.9rem}.fd-door small{opacity:.7;font-size:.74rem}
.fd-door.on{box-shadow:0 0 0 2px var(--acc),0 0 24px color-mix(in srgb,var(--acc) 60%,transparent)}
.fd-door.shut{opacity:.5;cursor:default}.fd-door.opened{opacity:.8}
.fd-arch{position:relative;width:64px;height:84px;border-radius:32px 32px 4px 4px;border:2px solid var(--acc);overflow:hidden;display:grid;place-items:center;background:color-mix(in srgb,var(--acc) 30%,#000)}
.fd-leaf{position:absolute;top:0;bottom:0;width:50%;background:color-mix(in srgb,var(--acc) 22%,#120c22);transition:transform .6s ease}
.fd-leaf.l{left:0;transform-origin:left}.fd-leaf.r{right:0;transform-origin:right}
.fd-door.on .fd-leaf.l,.fd-door.opened .fd-leaf.l{transform:perspective(200px) rotateY(70deg)}
.fd-door.on .fd-leaf.r,.fd-door.opened .fd-leaf.r{transform:perspective(200px) rotateY(-70deg)}
.fd-e{font-size:1.8rem;position:relative}
.fd-tag{position:absolute;top:6px;right:6px;font-style:normal;font-size:.66rem;padding:1px 6px;border-radius:8px;background:var(--acc);color:#07050F}
.fd-pick{margin-top:14px}.fd-card{border:1px solid var(--acc);border-radius:14px;padding:12px;max-width:560px;margin:0 auto}
.fd-games{list-style:none;padding:0;margin:6px 0;display:flex;flex-wrap:wrap;gap:6px;justify-content:center}
.fd-games li{padding:3px 10px;border-radius:10px;background:color-mix(in srgb,var(--acc) 16%,transparent)}
.fd-note,.vs-note{opacity:.65;font-size:.78rem}
.vs{max-width:620px;margin:0 auto;text-align:center;border:1px solid color-mix(in srgb,var(--acc) 60%,transparent);border-radius:16px;padding:14px}
@keyframes fd-in{from{opacity:0;transform:translateY(10px)}to{opacity:1;transform:none}}
@media (prefers-reduced-motion:reduce){.fd-door{animation:none}.fd-leaf{transition:none}}
`;
