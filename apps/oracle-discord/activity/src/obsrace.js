// Observatory races and co-op, shared by the House's game rooms (Comet Hunter race, Celestial Navigator crew race,
// co-op Eclipse Chaser). Everyone in the Discord call gets the same seed; each plays the room's normal run; the host
// collects scores and deals out the result. Built on net.js joinTable (the host's client runs it; the server relays).
//   const race = makeRace(C, { game: "comet", title: "Plate race", emoji: "☄️", unit: "★", coop: false,
//     play: (seed, done) => run(1, false, { seed, onDone: (r) => done({ n: r.stars, t: Date.now() - t0 }) }), back: () => lobby(false) });
//   race.open();
// Co-op mode adds everyone's score and wins together if the team reaches goal(members).
import { joinTable } from "./net.js";

export const RACE_WIN = 20, COOP_WIN = 15, LIMIT_SECS = 240;

/** Rank race results: higher n first, then faster t. results = { id: { n, t, name } } */
export function rankRace(results) {
  return Object.entries(results).map(([id, x]) => ({ id, ...x })).sort((a, b) => b.n - a.n || a.t - b.t).map((x, i) => ({ ...x, place: i + 1 }));
}
/** Co-op: the team total and whether it reached the goal. */
export function coopTotal(rows, goal) { const total = rows.reduce((a, r) => a + r.n, 0); return { total, goal, won: total >= goal }; }
/** Clean a result sent up by a member. */
export const cleanResult = (r, max = 100) => ({ n: Math.max(0, Math.min(max, Math.round(+((r || {}).n) || 0))), t: Math.max(0, Math.round(+((r || {}).t) || 0)) });

export function makeRace(C, o) {
  const { $, esc, say, ui, state, award, saveProgress, showStats } = C;
  let table = null, race = null;
  const top = () => `<div class="cx-top">${o.emoji} ${esc(o.title)} · ${table ? table.members.length : 0} in the call${table && table.host ? ` · host ${esc(table.nameOf(table.host))}` : ""}</div>`;
  const leave = () => { if (table) table.leave(); table = null; race = null; };
  const backBtn = (id) => `<button class="c" type="button" id="${id}">↩ Back</button>`;

  async function open(line) {
    if (!table) {
      say(o.joining || "Gathering the observers in the call…"); ui(`<div class="note">Joining the call's table…</div>`);
      try { table = await joinTable(o.game, state); wire(); }
      catch (e) { say(e.message || "Playing together needs a Discord voice call."); ui(`<div class="choices">${backBtn("or-back")}</div>`); $("or-back").onclick = () => o.back(); return; }
    }
    const host = table.isHost();
    say(line || (host ? `You're hosting, ${state.name}. Start when everyone is in. ${o.intro || ""}` : `Waiting for ${table.nameOf(table.host)} to start.`));
    ui(`${top()}<div class="chips">${table.members.map((m) => `<span>${m.id === table.me.id ? "🔭 " : ""}${esc(m.name)}</span>`).join("")}</div>
      ${o.coop ? `<div class="note">Co-op: your scores add up. Reach ${o.goal(table.members.length)} ${esc(o.unit)} together and everyone wins.</div>` : `<div class="note">Same sky for everyone. Most ${esc(o.unit)} wins; ties go to the fastest.</div>`}
      <div class="choices">${host ? `<button class="c main" type="button" id="or-go" ${table.members.length < 2 ? "disabled" : ""}>${o.emoji} Start</button>` : ""}<button class="c" type="button" id="or-leave">Leave</button></div>`);
    if ($("or-go")) $("or-go").onclick = () => { const seed = (Math.random() * 2 ** 31) >>> 0; table.to("*", { k: "go", seed }); start(seed); };
    $("or-leave").onclick = () => { leave(); o.back(); };
  }
  function wire() {
    table.on("members", () => { if (race && !race.over) { if (table.isHost()) maybeEnd(); } else if ($("or-leave")) open(); });
    table.on("host", () => { if (race && !race.over) maybeEnd(); else if ($("or-leave")) open(); });
    table.on("msg", ({ from, m }) => {
      if (!m || typeof m !== "object") return;
      if (m.k === "go" && from === table.host && (!race || race.over)) start(m.seed >>> 0);
      else if (m.k === "done" && table.isHost() && race) record(from, m.r);
      else if (m.k === "result" && from === table.host) show(m.rows);
    });
    table.on("close", () => { table = null; if (race && !race.over) { race.over = true; say("The table closed."); } });
  }
  function start(seed) {
    race = { seed, results: {}, over: false };
    o.play(seed, (res) => {
      if (!table) return o.back();
      say("Done! Waiting for the others…"); ui(`${top()}<div class="note">You scored ${res.n} ${esc(o.unit)}. Waiting for everyone to finish…</div>`);
      if (table.isHost()) record(table.me.id, res); else table.up({ k: "done", r: res });
    });
    if (table && table.isHost()) setTimeout(() => { if (race && !race.over) finish(); }, (o.limit || LIMIT_SECS) * 1000);
  }
  function record(id, r) { if (!race || race.over || !r) return; race.results[id] = { ...cleanResult(r, o.max || 100), name: table.nameOf(id) }; maybeEnd(); }
  function maybeEnd() { if (!table || !race) return; if (table.members.map((m) => m.id).every((id) => race.results[id])) finish(); }
  function finish() { if (!race || race.over || !table) return; const rows = rankRace(race.results); table.to("*", { k: "result", rows }); show(rows); }
  function show(rows) {
    if (!race) race = { over: false }; if (race.over) return; race.over = true;
    const me = table && rows.find((r) => r.id === table.me.id), team = o.coop ? coopTotal(rows, o.goal(rows.length)) : null;
    const win = o.coop ? team.won && !!me : me && me.place === 1 && rows.length >= 2, pay = win ? (o.coop ? COOP_WIN : RACE_WIN) : 0;
    if (pay) { award(pay, pay); try { saveProgress(); } catch {} showStats(); }
    if (o.sfx) o.sfx(win);
    say(o.coop ? (team.won ? `Together you made ${team.total} ${o.unit}. ${o.coopWin || "Prediction confirmed!"}` : `${team.total} of ${team.goal}. So close. Try again together.`)
      : win ? `You won, ${state.name}!` : me ? `You placed ${me.place} of ${rows.length}.` : "It's over.");
    ui(`${top()}${o.coop ? `<div class="reward"><div>${team.won ? "✓" : "✗"} Team: ${team.total} / ${team.goal} ${esc(o.unit)}</div></div>` : ""}
      <ol class="or-rank">${rows.map((r) => `<li>${esc(r.name)} · ${r.n} ${esc(o.unit)}${!o.coop && r.place === 1 ? " 🏆" : ""}</li>`).join("")}</ol>
      ${pay ? `<div class="reward"><div><b>+${pay} ✦ · +${pay} 💎</b> ${o.coop ? "for the team" : "for the win"}</div></div>` : ""}
      <div class="choices"><button class="c main" type="button" id="or-again">${o.emoji} Again</button>${backBtn("or-back")}</div>`);
    $("or-again").onclick = () => { race = null; open(); }; $("or-back").onclick = () => { leave(); o.back(); };
  }
  return { open, leave, get table() { return table; } };
}
