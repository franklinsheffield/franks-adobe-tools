// Pixel Scape web build: building together (Discord D4). Everyone in a call shares one scene through the Activity
// Worker's room (apps/pixel-scape-discord/activity/rooms.mjs). Each device renders on its own; only scene edits travel.
//  - every object gets a network id (o._nid); after each committed edit we send what changed (light fields as JSON,
//    big fields - meshes, photos, sculpt grids - as content-addressed blobs, uploaded once, gzip, 512 KB chunks)
//  - selecting an object locks it for the others (their outline + name shows on it); a drag streams live at ~12 Hz
//  - changes from others are applied in place and folded into the undo history, so Undo only undoes your own edits
//  - the camera stays your own, but where each builder is looking is shared (a marker; tap their name to follow them)
//  - long-press the ground to ping a spot for everyone (a pulsing marker for 4 seconds)
import { inDiscord } from "./discord.js";
import { mark } from "./marks.js";
import { weekTheme, themeCaption } from "./theme.js";

const HEAVY = ["mesh", "img", "hmap", "sculpt"], LHEAVY = ["img", "mimg"], LIVE = ["x", "y", "z", "ry", "s", "sx", "sy", "sz", "h"];
const NOT_ENV = new Set(["objs", "cam", "name"]);
const enc = new TextEncoder(), dec = new TextDecoder();

export const wantsRoom = () => inDiscord() || new URLSearchParams(location.search).has("room");

// ---- small helpers (exported for tests)
export function lightOf(o) {
  const c = {};
  for (const k of Object.keys(o)) if (k[0] !== "_" && k !== "id" && k !== "layers" && !HEAVY.includes(k)) c[k] = o[k];
  if (o.layers) c.layers = o.layers.map((L) => { const l = {}; for (const k of Object.keys(L)) if (k[0] !== "_" && k !== "id" && !LHEAVY.includes(k)) l[k] = L[k]; return l; });
  return c;
}
export function envOf(sc) { const e = {}; for (const k of Object.keys(sc)) if (k[0] !== "_" && !NOT_ENV.has(k)) e[k] = sc[k]; return e; }
export function hashesIn(w) {
  const out = []; const add = (m) => { if (m) for (const k in m) if (m[k]) out.push(m[k]); };
  add(w.$h); if (w.layers) w.layers.forEach((L) => add(L.$h)); return out;
}
const hex = (buf) => [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
export async function sha(bytes) { return hex(await crypto.subtle.digest("SHA-256", bytes)); }
async function pipe(bytes, stream) { return new Uint8Array(await new Response(new Blob([bytes]).stream().pipeThrough(stream)).arrayBuffer()); }
export const gzip = (b) => (typeof CompressionStream === "function" ? pipe(b, new CompressionStream("gzip")) : Promise.resolve(b));
export const gunzip = (b) => (b[0] === 0x1f && b[1] === 0x8b ? pipe(b, new DecompressionStream("gzip")) : Promise.resolve(b));
export function packChunk(head, bytes) {
  const h = enc.encode(JSON.stringify(head)), out = new Uint8Array(4 + h.length + bytes.length);
  new DataView(out.buffer).setUint32(0, h.length, true); out.set(h, 4); out.set(bytes, 4 + h.length); return out;
}
function unpackChunk(buf) { const u = new Uint8Array(buf), n = new DataView(buf).getUint32(0, true); return { head: JSON.parse(dec.decode(u.subarray(4, 4 + n))), bytes: u.subarray(4 + n) }; }
const newNid = () => Math.random().toString(36).slice(2, 9) + Date.now().toString(36).slice(-5);

export class Net {
  constructor(W, who, url) {
    this.W = W; this.S = W.S; this.who = who; this.url = url;
    this.peers = new Map(); this.me = null; this.ready = false; this.applying = false; this.closed = false;
    this.byNid = new Map(); this.sent = new Map(); this.envSent = {};
    this.refHash = new WeakMap(); this.hashRef = new Map(); this.onServer = new Set(); this.texts = new Map(); this.pend = new Map();
    this.wait = new Map(); this.inbox = Promise.resolve(); this.outbox = Promise.resolve();
    this.myLock = null; this.liveT = 0; this.liveLast = ""; this.chunk = 512 * 1024; this.retry = 0; this.lib = []; this.pendingReplace = 0;
    this.ui = null; this.say = (m, err) => { try { W.setStatus(m, err); } catch (e) { /* UI not up */ } };
  }

  // ---- connection
  connect() {
    const ws = this.ws = new WebSocket(this.url); ws.binaryType = "arraybuffer";
    ws.onopen = () => { this.retry = 0; this.pendingReplace = 0; ws.send(JSON.stringify(Object.assign({ t: "hello" }, this.who.hello))); };
    ws.onmessage = (ev) => { if (typeof ev.data !== "string") return this.onChunk(ev.data); let x; try { x = JSON.parse(ev.data); } catch (e) { return; } this.inbox = this.inbox.then(() => this.handle(x)).catch((e) => console.error("[multi]", e)); };
    ws.onclose = (ev) => {
      this.ready = false; for (const sid of this.peers.keys()) mark("cam:" + sid, null); this.peers.clear(); this.follow = null; this.drawPeers(); this.renderBar();
      if (this.closed || ev.code === 4001 || ev.code === 4002) return;
      const d = Math.min(15000, 1000 * Math.pow(2, this.retry++)); this.say("Building together: reconnecting...", true); setTimeout(() => this.connect(), d);
    };
  }
  rejoin() { if (this.ws && this.ws.readyState <= 1) return; this.closed = false; this.retry = 0; this.say("Building together: rejoining..."); this.connect(); }
  send(o) { if (this.ws && this.ws.readyState === 1) this.ws.send(o instanceof Uint8Array ? o : JSON.stringify(o)); }
  hook() {
    const n = this.W.net;
    n.commit = () => this.queueDiff(); n.loaded = () => this.queueReplace(); n.sel = () => this.syncLock(); n.drag = () => this.drag();
    n.canSelect = (o) => this.canSelect(o); n.draw = () => {};
    if (!this.camTimer) this.camTimer = setInterval(() => this.sendCam(), 250);
  }
  // ---- presence: my camera, the others' cameras, following, pings
  sendCam() {
    if (!this.ready) return;
    const c = this.W.st.scene.cam, r = (v) => +(+v).toFixed(2), o = { tx: r(c.tx), ty: r(c.ty), tz: r(c.tz), dist: r(c.dist), yaw: r(c.yaw), pitch: r(c.pitch), fov: r(c.fov) };
    const s = JSON.stringify(o); if (s === this.camLast) return; this.camLast = s; this.send({ t: "cam", c: o });
  }
  applyCam(sid, c) {
    const p = this.peers.get(sid); if (!p || !c || typeof c !== "object") return; p.cam = c;
    if ([c.tx, c.ty, c.tz].every(Number.isFinite)) mark("cam:" + sid, { x: c.tx, y: c.ty, z: c.tz, label: p.name, color: p.color, cls: "eye" + (this.follow === sid ? " on" : "") });
    if (this.follow === sid) { const cam = this.W.st.scene.cam; for (const k of ["tx", "ty", "tz", "dist", "yaw", "pitch", "fov"]) if (Number.isFinite(c[k])) cam[k] = c[k]; this.refresh("view"); }
  }
  setFollow(sid) {
    const was = this.follow; this.follow = sid && sid !== was ? sid : null;
    for (const id of [was, this.follow]) { const p = id && this.peers.get(id); if (p && p.cam) this.applyCam(id, p.cam); }
    const p = this.follow && this.peers.get(this.follow);
    this.say(p ? "Following " + p.name + ". Touch the view to stop." : "Stopped following"); this.renderBar();
  }
  ping(p) {
    if (!this.ready) return false;
    this.send({ t: "ping", x: +p.x.toFixed(2), y: +p.y.toFixed(2), z: +p.z.toFixed(2) });
    this.showPing(this.me, [p.x, p.y, p.z]); this.say("Pinged a spot for everyone in the call"); return true;
  }
  showPing(who, p) { mark("ping:" + who.sid, { x: p[0], y: p[1], z: p[2], label: who.name, color: who.color, cls: "ping", ttl: 4000 }); }

  // ---- incoming
  async handle(x) {
    const W = this.W;
    switch (x.t) {
      case "welcome": {
        this.me = x.you; this.chunk = x.chunk || this.chunk; this.peers = new Map(x.peers.map((p) => [p.sid, p])); this.hook();
        if (x.scene) { await this.applyScene(x.scene, true); this.ready = true; this.say("Building together: joined " + (x.peers.length ? "with " + x.peers.map((p) => p.name).join(", ") : "the room")); }
        else { this.ready = true; await this.replaceNow(); this.say("Building together: you started the room, others in the call will see this scene"); }
        this.syncLock(); this.drawPeers(); this.renderBar(); this.send({ t: "lib" }); return;
      }
      case "join": this.peers.set(x.peer.sid, x.peer); this.say(x.peer.name + " joined"); break;
      case "left": { const p = this.peers.get(x.sid); this.peers.delete(x.sid); mark("cam:" + x.sid, null); if (this.follow === x.sid) this.follow = null; if (p) this.say(p.name + " left"); break; }
      case "cam": this.applyCam(x.sid, x.c); break;
      case "ping": { const p = this.peers.get(x.sid) || { sid: x.sid, name: x.name, color: x.color }; if (Array.isArray(x.p)) { this.showPing(p, x.p); this.say(p.name + " pinged a spot"); } break; }
      case "lock": { const p = this.peers.get(x.sid); if (p) p.sel = x.nid; break; }
      case "nack": {
        if (x.lock) { this.myLock = null; const o = x.nid && this.byNid.get(x.nid); if (o && W.st.sel === o) { this.applying = true; try { W.select(null); } finally { this.applying = false; } } }
        else { this.sent.delete(x.nid); }   // an edit to something locked: the room keeps theirs; their next update brings it back
        this.say("Being edited by " + x.by, true); break;
      }
      case "put": await this.applyPut(x.nid, x.o); break;
      case "del": this.applyDel(x.nid); break;
      case "env": this.applyEnv(x.e); break;
      case "live": this.applyLive(x.nid, x.p); break;
      case "replaced": this.pendingReplace = Math.max(0, this.pendingReplace - 1); break;
      case "scene": {
        if (!x.opened && this.pendingReplace > 0) break;   // two scenes loaded at once: ours reached the room later, so ours stands
        for (const p of this.peers.values()) p.sel = null; this.myLock = null; await this.applyScene(x.scene, true); const p = this.peers.get(x.by); this.say(x.opened ? (p ? p.name : "Someone") + " opened " + x.opened + " from the server library" : (p ? p.name : "Someone") + " loaded a new scene"); break; }
      case "lib": this.lib = x.items || []; if (this.ui && this.ui.libOpen) this.renderLib(); break;
      case "saved": this.say(x.by + " saved " + x.name + " to the server library"); break;
      case "posted": this.say(x.ok ? "Render posted to the channel" : "Post failed: " + x.error, !x.ok); if (this.postDone) this.postDone(x); break;
      case "missing": { const w = this.wait.get(x.h); if (w) { this.wait.delete(x.h); w.reject(new Error("a shared piece is missing")); } break; }
      case "full": this.closed = true; this.say("This call's room is full (" + x.max + " builders). You can still build on your own.", true); break;
      case "error": this.say("Building together: " + x.error, true); if (x.fatal) this.closed = true; break;
    }
    if (["join", "left", "lock", "scene", "del"].includes(x.t)) { this.drawPeers(); this.renderBar(); }
  }
  onChunk(buf) {
    const { head, bytes } = unpackChunk(buf), w = this.wait.get(head.h); if (!w) return;
    w.parts[head.i] = bytes.slice(); w.got++;
    if (w.got === head.n) { this.wait.delete(head.h); const all = new Uint8Array(w.parts.reduce((a, b) => a + b.length, 0)); let o = 0; for (const p of w.parts) { all.set(p, o); o += p.length; } w.resolve(all); }
  }
  getBlob(h) {
    if (this.texts.has(h)) return Promise.resolve(this.texts.get(h));
    return new Promise((resolve, reject) => { this.wait.set(h, { parts: [], got: 0, resolve, reject }); this.send({ t: "get", h }); })
      .then(gunzip).then((b) => { const t = dec.decode(b); this.onServer.add(h); return t; });
  }
  async fetchAll(hs, progress) {
    const need = [...new Set(hs)].filter((h) => !this.hashRef.has(h) && !this.texts.has(h)); let k = 0;
    for (const h of need) { if (progress) progress(++k, need.length); this.texts.set(h, await this.getBlob(h)); }
  }

  // wire object -> app object (big fields shared by hash, so the same photo is one picture in memory)
  decode(w) {
    const c = Object.assign({}, w); delete c.$h; const later = [];
    for (const f of HEAVY) { const h = w.$h && w.$h[f]; if (!h) c[f] = null; else if (this.hashRef.has(h)) later.push([c, f, h]); else c[f] = JSON.parse(this.texts.get(h)); }
    if (w.layers) c.layers = w.layers.map((L) => { const l = Object.assign({}, L); delete l.$h; for (const f of LHEAVY) { const h = L.$h && L.$h[f]; if (!h) l[f] = null; else if (this.hashRef.has(h)) later.push([l, f, h]); else l[f] = JSON.parse(this.texts.get(h)); } return l; });
    const o = this.S.fromJSON(JSON.stringify({ objs: [c] })).objs[0];
    const ls = o.layers || [];
    for (const [holder, f, h] of later) { const tgt = holder === c ? o : ls[c.layers.indexOf(holder)]; tgt[f] = this.hashRef.get(h); }
    for (const f of HEAVY) { const h = w.$h && w.$h[f]; if (h && o[f]) { this.hashRef.set(h, o[f]); this.refHash.set(o[f], h); this.texts.delete(h); } }
    if (w.layers) w.layers.forEach((L, i) => { const l = ls[i]; if (!l) return; l.id = 1e6 + (Net.lid = (Net.lid || 0) + 1); for (const f of LHEAVY) { const h = L.$h && L.$h[f]; if (h && l[f]) { this.hashRef.set(h, l[f]); this.refHash.set(l[f], h); this.texts.delete(h); } } });
    return o;
  }
  async sig(o) { return JSON.stringify(await this.wire(o)); }
  heavyKey(x) { const k = (p) => (p ? this.refHash.get(p) || "?" : 0); return JSON.stringify([HEAVY.map((f) => k(x[f])), (x.layers || []).map((L) => [k(L.img), k(L.mimg)])]); }

  // fold a remote change into every undo snapshot, so Undo never reverts someone else's work
  rebase(fn) { for (const sn of this.W.hist.list) fn(sn.scene); }
  copy(o) { return Object.assign({}, o, o.layers ? { layers: o.layers.map((L) => Object.assign({}, L)) } : null); }

  async applyPut(nid, w) {
    await this.fetchAll(hashesIn(w));
    const W = this.W, sc = W.st.scene, d = this.decode(w); let o = this.byNid.get(nid);
    if (o && sc.objs.includes(o)) {
      const heavy = this.heavyKey(o) !== this.heavyKey(d);
      const id = o.id; for (const k of Object.keys(o)) if (k[0] !== "_" && !(k in d)) delete o[k];
      if (heavy) for (const k of Object.keys(o)) if (k[0] === "_" && k !== "_nid") delete o[k];
      Object.assign(o, d, { id, _nid: nid });
    } else { o = d; o._nid = nid; sc.objs.push(o); }
    this.byNid.set(nid, o); this.sent.set(nid, await this.sig(o));
    const cp = this.copy(o);
    this.rebase((s) => { const i = s.objs.findIndex((c) => c._nid === nid); if (i >= 0) s.objs[i] = Object.assign({}, cp); else s.objs.push(Object.assign({}, cp)); });
    this.refresh("val");
  }
  applyDel(nid) {
    const W = this.W, sc = W.st.scene, o = this.byNid.get(nid); this.byNid.delete(nid); this.sent.delete(nid);
    if (o) { const i = sc.objs.indexOf(o); if (i >= 0) sc.objs.splice(i, 1); if (W.st.sel === o) W.st.sel = W.NONE; }
    this.rebase((s) => { s.objs = s.objs.filter((c) => c._nid !== nid); });
    this.refresh("sel");
  }
  applyEnv(e) {
    Object.assign(this.W.st.scene, e); for (const k in e) this.envSent[k] = JSON.stringify(e[k]);
    this.rebase((s) => Object.assign(s, e)); this.refresh("val");
  }
  applyLive(nid, p) {
    const o = this.byNid.get(nid); if (!o) return;
    for (const k of LIVE) if (typeof p[k] === "number") o[k] = p[k];
    this.refresh("drag");
  }
  async applyScene(s, adoptCam) {
    const all = []; s.objs.forEach((x) => all.push(...hashesIn(x.o)));
    await this.fetchAll(all, (k, n) => this.say("Building together: loading the shared scene (" + k + " of " + n + ")"));
    const W = this.W, objs = s.objs.map((x) => { const o = this.decode(x.o); o._nid = x.nid; return o; });
    const sc = this.S.withDefaults(Object.assign({}, s.env, { objs, name: s.name || "Shared scene", cam: Object.assign({}, (adoptCam && s.cam) || W.st.scene.cam) }));
    this.byNid = new Map(objs.map((o) => [o._nid, o])); this.sent = new Map(); this.envSent = {};
    for (const o of objs) this.sent.set(o._nid, await this.sig(o));
    for (const k in envOf(sc)) this.envSent[k] = JSON.stringify(sc[k]);
    this.applying = true; try { W.loadScene(sc); } finally { this.applying = false; }
  }
  refresh(kind) { this.applying = true; try { this.W.changed(kind); } finally { this.applying = false; } this.drawPeers(); }

  // ---- outgoing
  async heavyText(field, v, layer) {
    if (layer || field === "img") return JSON.stringify(this.S.pic(v));
    return JSON.stringify(JSON.parse(this.S.toJSON({ objs: [{ [field]: v }] })).objs[0][field]);
  }
  // a big field's hash (computed once per picture / mesh / grid); its bytes wait in pend until uploaded
  async hashOf(field, v, layer) {
    let h = this.refHash.get(v); if (h) return h;
    const bytes = enc.encode(await this.heavyText(field, v, layer)); h = await sha(bytes);
    this.refHash.set(v, h); this.hashRef.set(h, v); if (!this.onServer.has(h)) this.pend.set(h, bytes); return h;
  }
  async wire(o) {
    const w = lightOf(o);
    const hs = {}; for (const f of HEAVY) if (o[f]) hs[f] = await this.hashOf(f, o[f], false);
    if (Object.keys(hs).length) w.$h = hs;
    if (o.layers) for (let i = 0; i < o.layers.length; i++) { const L = o.layers[i], lh = {}; for (const f of LHEAVY) if (L[f]) lh[f] = await this.hashOf(f, L[f], true); if (Object.keys(lh).length) w.layers[i].$h = lh; }
    return w;
  }
  async upload(h, raw, zip) {
    if (this.onServer.has(h)) return;
    const b = zip === false ? raw : await gzip(raw), n = Math.max(1, Math.ceil(b.length / this.chunk));
    for (let i = 0; i < n; i++) { this.send(packChunk({ t: "chunk", h, i, n }, b.subarray(i * this.chunk, (i + 1) * this.chunk))); if (this.ws.bufferedAmount > 4e6) await new Promise((r) => setTimeout(r, 50)); }
    this.onServer.add(h);
  }
  async uploadAll(w) { for (const h of hashesIn(w)) { const b = this.pend.get(h); if (b && !this.onServer.has(h)) await this.upload(h, b); this.pend.delete(h); } }
  nidFor(o, seen) {
    let nid = o._nid; const other = nid && this.byNid.get(nid);
    if (!nid || seen.has(nid) || (other && other !== o && this.W.st.scene.objs.includes(other))) nid = o._nid = newNid();
    seen.add(nid); this.byNid.set(nid, o); return nid;
  }
  queueDiff() { if (!this.ready || this.applying) return; this.outbox = this.outbox.then(() => this.diff()).catch((e) => console.error("[multi]", e)); }
  queueReplace() { if (!this.ready || this.applying) return; this.outbox = this.outbox.then(() => this.replaceNow()).catch((e) => console.error("[multi]", e)); }
  async diff() {
    const sc = this.W.st.scene, seen = new Set();
    for (const o of sc.objs.slice()) {
      const nid = this.nidFor(o, seen); const w = await this.wire(o), s = JSON.stringify(w);
      if (this.sent.get(nid) === s) continue;
      this.sent.set(nid, s); await this.uploadAll(w); this.send({ t: "put", nid, o: w });
    }
    for (const nid of [...this.sent.keys()]) if (!seen.has(nid)) { this.sent.delete(nid); this.byNid.delete(nid); this.send({ t: "del", nid }); }
    const e = envOf(sc), ch = {}; let any = false;
    for (const k in e) { const v = JSON.stringify(e[k]); if (this.envSent[k] !== v) { this.envSent[k] = v; ch[k] = e[k]; any = true; } }
    if (any) this.send({ t: "env", e: ch });
    this.syncLock();
  }
  async replaceNow() {
    const sc = this.W.st.scene, seen = new Set(), objs = [];
    this.sent = new Map(); this.byNid = new Map();
    for (const o of sc.objs) { const nid = this.nidFor(o, seen); const w = await this.wire(o); this.sent.set(nid, JSON.stringify(w)); await this.uploadAll(w); objs.push({ nid, o: w }); }
    const env = envOf(sc); this.envSent = {}; for (const k in env) this.envSent[k] = JSON.stringify(env[k]);
    this.pendingReplace++; this.send({ t: "replace", objs, env, cam: sc.cam, name: sc.name || "" }); this.myLock = null; this.syncLock();
  }
  holder(o) { const nid = o && o._nid; if (!nid || this.byNid.get(nid) !== o) return null; for (const p of this.peers.values()) if (p.sel === nid) return p; return null; }
  canSelect(o) { if (this.applying || !this.ready) return true; const p = this.holder(o); if (p) { this.say("Being edited by " + p.name, true); return false; } return true; }
  syncLock() {
    if (!this.ready || this.applying) return;
    const s = this.W.st.sel, nid = s && s !== this.W.NONE && s._nid && this.byNid.get(s._nid) === s ? s._nid : null;
    if (nid !== this.myLock) { this.myLock = nid; this.send({ t: "lock", nid }); }
  }
  drag() {
    if (!this.ready || this.applying || !this.myLock) return;
    const now = performance.now(); if (now - this.liveT < 80) { if (!this.liveTimer) this.liveTimer = setTimeout(() => { this.liveTimer = null; this.drag(); }, 90); return; }
    const o = this.byNid.get(this.myLock); if (!o) return;
    const p = {}; for (const k of LIVE) if (typeof o[k] === "number") p[k] = o[k];
    const s = JSON.stringify(p); if (s === this.liveLast) return;
    this.liveT = now; this.liveLast = s; this.send({ t: "live", nid: this.myLock, p });
  }

  // ---- presence: the others' selections as outlines with names, and the room bar
  drawPeers() {
    const list = []; for (const p of this.peers.values()) { const o = p.sel && this.byNid.get(p.sel); if (o && this.W.st.scene.objs.includes(o)) list.push({ obj: o, color: p.color, name: p.name }); }
    try { this.W.vp.setPeers(list); } catch (e) { /* viewport not up */ }
  }
  renderBar() {
    const wrap = document.getElementById("vpwrap"); if (!wrap) return;
    if (!this.ui) {
      const bar = document.createElement("div"); bar.className = "ps-room"; wrap.appendChild(bar);
      const people = document.createElement("div"); people.className = "ps-room-people"; bar.appendChild(people);
      people.addEventListener("click", (e) => { const c = e.target.closest("[data-sid]"); if (c) this.setFollow(c.dataset.sid); else if (e.target.closest("[data-rejoin]")) this.rejoin(); });
      const th = weekTheme(), theme = document.createElement("div"); theme.className = "ps-room-theme"; bar.appendChild(theme);
      theme.innerHTML = "This week's build theme: <b>" + esc(th.name) + "</b>"; theme.title = "Post a render this week and it is tagged with the theme, so the server can spot theme builds";
      const row = document.createElement("div"); row.className = "ps-room-row"; bar.appendChild(row);
      const b = (label, fn) => { const x = document.createElement("button"); x.textContent = label; x.onclick = fn; row.appendChild(x); return x; };
      b("Save", () => this.saveToServer()).title = "Save the shared scene to this server's library"; b("Library", () => this.toggleLib()).title = "Scenes saved by this server"; this.postBtn = b("Post render", () => this.postRender());
      const lib = document.createElement("div"); lib.className = "ps-room-lib"; lib.hidden = true; bar.appendChild(lib);
      this.ui = { bar, people, lib, libOpen: false };
    }
    const chip = (p, me) => me ? '<span class="ps-chip" style="--c:' + p.color + '"><i></i>' + esc(p.name) + " (you)</span>"
      : '<button type="button" class="ps-chip' + (this.follow === p.sid ? " on" : "") + '" data-sid="' + esc(p.sid) + '" style="--c:' + p.color + '" title="' + (this.follow === p.sid ? "Stop following " : "Follow ") + esc(p.name) + "'s view\"><i></i>" + esc(p.name) + (this.follow === p.sid ? " (following)" : "") + "</button>";
    this.ui.people.innerHTML = !this.ready ? '<span class="ps-chip off">Building together: offline</span><button type="button" class="ps-chip" data-rejoin="1" title="Connect to the call\'s shared scene again">Rejoin</button>' : chip(this.me, true) + [...this.peers.values()].map((p) => chip(p)).join("");
  }
  toggleLib() { this.ui.libOpen = !this.ui.libOpen; this.ui.lib.hidden = !this.ui.libOpen; if (this.ui.libOpen) { this.send({ t: "lib" }); this.renderLib(); } }
  renderLib() {
    const L = this.ui.lib; L.innerHTML = "";
    if (!this.lib.length) { L.innerHTML = '<div class="ps-room-empty">No saved scenes yet. Save to server keeps the shared scene here for everyone in this server.</div>'; return; }
    for (const it of this.lib) {
      const r = document.createElement("div"); r.className = "ps-room-item";
      r.innerHTML = "<b>" + esc(it.name) + "</b><span>" + esc(it.by) + ", " + new Date(it.at).toLocaleDateString() + "</span>";
      const o = document.createElement("button"); o.textContent = "Open"; o.onclick = () => { if (confirmOpen(it.name)) { this.send({ t: "open", id: it.id }); this.toggleLib(); } };
      const x = document.createElement("button"); x.textContent = "Remove"; x.onclick = () => this.send({ t: "unsave", id: it.id });
      r.append(o, x); L.appendChild(r);
    }
  }
  saveToServer() {
    const name = (prompt("Save the shared scene to this server's library as:", this.W.st.scene.name || "Untitled") || "").trim();
    if (name) this.outbox = this.outbox.then(() => this.send({ t: "save", name }));
  }
  async postRender() {
    if (!this.ready || this.posting) return; this.posting = true; this.postBtn.disabled = true;
    try {
      this.say("Rendering to post..."); await this.W.renderNow();
      const png = this.W.refs.lastPng; if (!png) throw new Error("no render");
      const bytes = png instanceof Uint8Array ? png : new Uint8Array(png), h = await sha(bytes);
      this.onServer.delete(h); await this.upload(h, bytes, false); this.onServer.delete(h);
      const done = new Promise((r) => { this.postDone = r; setTimeout(r, 30000); });
      this.send({ t: "post", h, caption: themeCaption(this.W.st.scene.name || "") }); await done;
    } catch (e) { this.say("Post failed: " + e.message, true); }
    finally { this.posting = false; this.postDone = null; this.postBtn.disabled = false; }
  }
}
const esc = (s) => String(s).replace(/[&<>"']/g, (c) => "&#" + c.charCodeAt(0) + ";");
const confirmOpen = (n) => { try { return confirm("Open " + n + " for everyone in the call? It replaces the shared scene."); } catch (e) { return true; } };

// start: in Discord after sign-in (the call's room), or in a browser with ?room=NAME&name=YOU against `wrangler dev`
export async function startMulti() {
  const W = window.__wb, q = new URLSearchParams(location.search); let who, base;
  if (inDiscord()) {
    const d = await window.__psDiscord; if (!d) return null;
    if (!d.guildId) { W.setStatus("Building together works in a server's call, not in DMs"); return null; }
    who = { hello: { token: d.access_token, instance: d.instanceId, channel: d.channelId }, guild: d.guildId, room: d.instanceId };
    base = "/.proxy/api/room";
  } else { who = { hello: { dev: true, name: q.get("name") || "Guest" }, guild: "dev", room: q.get("room") }; base = "/api/room"; }
  const url = (location.protocol === "https:" ? "wss://" : "ws://") + location.host + base + "?guild=" + encodeURIComponent(who.guild) + "&room=" + encodeURIComponent(who.room);
  const net = new Net(W, who, url); window.__psNet = net; net.renderBar(); net.connect();
  // touching the view yourself stops following someone
  const wrap = document.getElementById("vpwrap"); if (wrap) { const stop = (e) => { if (net.follow && !(e.target.closest && e.target.closest("button, .ps-room"))) net.setFollow(null); }; wrap.addEventListener("pointerdown", stop, true); wrap.addEventListener("wheel", stop, { capture: true, passive: true }); }
  return net;
}
