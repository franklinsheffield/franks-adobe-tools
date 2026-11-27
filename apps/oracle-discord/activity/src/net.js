// Oracle Chamber multiplayer, client side: join the call's shared table for a game room (server: activity/tables.mjs).
// The host's client runs the game; everyone else sends their moves up to the host and gets what the host deals out.
//   const t = await joinTable("rummy", state);           // throws when multiplayer can't start (not in a call, no sign-in)
//   t.me {id, name}, t.members [{id, name}], t.host (id), t.isHost()
//   t.on("members", fn) ({members, host})   t.on("msg", fn) ({from, m})   t.on("host", fn) (snap: you became the host)
//   t.on("close", fn)   t.to(ids | "*", m)  (host)   t.up(m)  (to the host)   t.snap(s)  (host: save the game)   t.leave()
// Local testing without Discord: run the Worker with DEV_ROOMS=1 and open the page with ?table=Name (each tab its own name).
import { inDiscord } from "./discord.js";

/** Can this page join a table? In Discord: signed in and in a call. Locally: ?table=Name. */
export const devName = () => new URLSearchParams(location.search).get("table");
export const canJoin = (state) => !!((inDiscord() && state.token && state.instance) || devName());

export function joinTable(game, state) {
  return new Promise((resolve, reject) => {
    if (!canJoin(state)) return reject(new Error("Play together inside a Discord call."));
    const dev = !inDiscord() && devName(), inst = dev ? "dev" : state.instance;
    const url = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + (inDiscord() ? "/.proxy" : "") + "/api/tables?game=" + encodeURIComponent(game) + "&instance=" + encodeURIComponent(inst);
    let ws; try { ws = new WebSocket(url); } catch (e) { return reject(e); }
    const fns = {}, emit = (k, x) => (fns[k] || []).forEach((f) => { try { f(x); } catch (e) { console.error("table " + k, e); } });
    let open = false, left = false;
    const t = {
      me: null, members: [], host: null,
      isHost: () => !!t.me && t.host === t.me.id,
      on(k, f) { (fns[k] ||= []).push(f); return t; },
      to(to, m) { if (ws.readyState === 1) ws.send(JSON.stringify({ t: "to", to, m })); },
      up(m) { if (ws.readyState === 1) ws.send(JSON.stringify({ t: "up", m })); },
      snap(s) { if (ws.readyState === 1) ws.send(JSON.stringify({ t: "snap", s })); },
      leave() { left = true; try { ws.close(1000, "bye"); } catch (e) { /* closed */ } },
      nameOf: (id) => (t.members.find((m) => m.id === id) || {}).name || "a stargazer",
    };
    ws.onopen = () => ws.send(JSON.stringify(dev ? { t: "hello", dev: true, name: dev } : { t: "hello", token: state.token }));
    ws.onmessage = (e) => {
      let x; try { x = JSON.parse(e.data); } catch (err) { return; }
      if (x.t === "welcome") { open = true; Object.assign(t, { me: x.you, members: x.members, host: x.host }); resolve(t); if (x.snap && t.isHost()) emit("host", x.snap); }
      else if (x.t === "members") { t.members = x.members; t.host = x.host; emit("members", x); }
      else if (x.t === "msg") emit("msg", x);
      else if (x.t === "host") { t.host = t.me.id; emit("host", x.snap); }
      else if (x.t === "error") { if (!open) reject(new Error(x.error)); else emit("error", x.error); }
    };
    ws.onerror = () => { if (!open) reject(new Error("Couldn't reach the table.")); };
    ws.onclose = () => { if (!open) reject(new Error("Couldn't reach the table.")); else if (!left) emit("close"); };
  });
}
