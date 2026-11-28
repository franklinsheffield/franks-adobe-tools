// Pixel Scape web build: Surveyor Flint, the guide. He pops in now and then to talk a little trash about what you
// build (Chatty / Quiet / Off), and tapping him (or pressing ?) opens the help menu: ask anything in your own words and
// he answers from Pixel Scape's help text and FAQ (seer-brain.js), then points at the control ("Show me").
// His look exists only here: hard hat, survey visor, hi-vis vest, measuring staff (and a ring and a quill he'd rather
// you didn't notice). Animated in CSS, chiptune voice blips via WebAudio.
import { PACK, ask, line, slip, kindName, TOPICS, TEACH } from "./seer-brain.js";
import { isPhone } from "./phone.js";

const store = { get: (k) => { try { return localStorage.getItem(k); } catch (e) { return null; } }, set: (k, v) => { try { localStorage.setItem(k, v); } catch (e) { /* private window */ } } };
const h = (tag, attrs, kids) => { const e = document.createElement(tag); for (const k in attrs || {}) { if (k === "text") e.textContent = attrs[k]; else if (k === "on") e.onclick = attrs[k]; else e.setAttribute(k, attrs[k]); } for (const c of kids || []) e.append(c); return e; };
export const MODES = { chatty: { gap: 40000, chance: 0.7 }, quiet: { gap: 180000, chance: 0.25 }, off: { gap: Infinity, chance: 0 } };

// ---- his look (SVG; moods: smug, talk, wow, bored)
export const FLINT_SVG = `<svg viewBox="0 0 120 140" class="flint-svg" aria-hidden="true">
  <ellipse class="f-shadow" cx="60" cy="134" rx="30" ry="4"/>
  <g class="f-body">
    <rect class="f-staff" x="98" y="40" width="4" height="92" rx="1"/>
    <g class="f-staff-ticks"><rect x="98" y="50" width="4" height="6"/><rect x="98" y="66" width="4" height="6"/><rect x="98" y="82" width="4" height="6"/><rect x="98" y="98" width="4" height="6"/><rect x="98" y="114" width="4" height="6"/></g>
    <path class="f-coat" d="M30 132 L34 84 Q60 72 86 84 L90 132 Z"/>
    <path class="f-vest" d="M38 132 L41 86 Q60 79 79 86 L82 132 Z"/>
    <rect class="f-stripe" x="40" y="104" width="40" height="4"/><rect class="f-stripe" x="40" y="116" width="40" height="4"/>
    <rect class="f-pocket" x="66" y="92" width="10" height="9"/><path class="f-chart" d="M67 92 L71 85 L75 92" />
    <g class="f-arm f-armR"><path d="M84 88 Q96 92 99 76" class="f-sleeve"/><circle cx="100" cy="74" r="5" class="f-hand"/></g>
    <g class="f-arm f-armL"><path d="M36 88 Q22 98 26 112" class="f-sleeve"/><circle cx="27" cy="113" r="5.5" class="f-hand"/>
      <rect x="22" y="110" width="9" height="2.6" rx="1.3" class="f-ring"/><circle cx="26.5" cy="110" r="1.9" class="f-gem"/></g>
    <g class="f-head">
      <rect class="f-face" x="38" y="38" width="44" height="40" rx="12"/>
      <path class="f-quill" d="M81 46 L96 22 L92 40 Z"/><path class="f-quill-line" d="M82 45 L94 26"/>
      <rect class="f-visor" x="36" y="48" width="48" height="13" rx="5"/>
      <g class="f-reticle"><circle cx="50" cy="54.5" r="3.6"/><path d="M50 49.5 V59.5 M45 54.5 H55"/><circle cx="70" cy="54.5" r="3.6"/><path d="M70 49.5 V59.5 M65 54.5 H75"/></g>
      <rect class="f-scan" x="37" y="49" width="3" height="11"/>
      <path class="f-mouth f-m-smug" d="M50 69 Q60 73 70 67"/>
      <path class="f-mouth f-m-talk" d="M52 67 Q60 75 68 67 Z"/>
      <ellipse class="f-mouth f-m-wow" cx="60" cy="69" rx="4" ry="4.5"/>
      <path class="f-mouth f-m-bored" d="M51 69 H69"/>
      <path class="f-hat" d="M33 40 Q34 18 60 16 Q86 18 87 40 Z"/><rect class="f-brim" x="28" y="37" width="64" height="7" rx="3.5"/>
      <rect class="f-hat-ridge" x="57" y="16" width="6" height="22" rx="2"/><circle class="f-lamp" cx="60" cy="28" r="4"/>
    </g>
  </g>
</svg>`;

// ---- voice: square-wave blips (his "survey beacon"), plus the door sting
let AC = null;
const audio = () => { try { if (!AC) AC = new (window.AudioContext || window.webkitAudioContext)(); if (AC.state === "suspended") AC.resume(); return AC; } catch (e) { return null; } };
function tone(f, dur, at, vol) {
  const ac = audio(); if (!ac) return; const t = ac.currentTime + (at || 0), o = ac.createOscillator(), g = ac.createGain(), lp = ac.createBiquadFilter();
  o.type = PACK.voice.type; o.frequency.value = f; lp.type = "lowpass"; lp.frequency.value = PACK.voice.lp;
  g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(vol || 0.05, t + 0.005); g.gain.exponentialRampToValueAtTime(0.0001, t + dur);
  o.connect(lp); lp.connect(g); g.connect(ac.destination); o.start(t); o.stop(t + dur + 0.02);
}
export const sting = () => PACK.voice.sting.forEach(([f, d], i) => tone(f, d, i * 0.11, 0.06));
const blip = (ch) => { const v = PACK.voice, c = ch.toLowerCase(), n = c.charCodeAt(0) % 7; tone(v.base + n * v.step + ("aeiou".includes(c) ? v.vowel : 0), v.dur, 0, 0.035); };

export function startSeer(W, phone, opt = {}) {
  const wrap = document.getElementById("vpwrap"); if (!wrap || !W) return null;
  let mode = opt.mode || store.get("ps.flint.mode") || "chatty", sound = store.get("ps.flint.sound") !== "off", lastPop = 0, hideT = null, typeT = null;
  const root = h("div", { class: "ps-flint", "data-mood": "smug" });
  const av = h("button", { type: "button", class: "ps-flint-av", title: PACK.name + ": tap to ask how to do anything (or press ?)", "aria-label": "Ask " + PACK.name });
  av.innerHTML = FLINT_SVG;
  const text = h("div", { class: "ps-flint-text" }), bubble = h("div", { class: "ps-flint-bubble", hidden: "" }, [h("b", { text: PACK.name }), text,
    h("div", { class: "ps-flint-brow" }, [h("button", { type: "button", on: () => { hide(); openPanel(); } }, ["Ask me"]), h("button", { type: "button", class: "ghost", on: () => hide() }, ["×"])])]);
  root.append(bubble, av); wrap.appendChild(root);
  const mood = (m) => root.setAttribute("data-mood", m);

  function typeOut(el, s, done) {
    clearInterval(typeT); el.textContent = ""; let i = 0; const t0 = performance.now(); mood("talk");   // pace by the clock, so a busy page still finishes on time
    typeT = setInterval(() => { const was = i; i = Math.min(s.length, Math.max(i + 1, Math.floor((performance.now() - t0) / 14))); el.textContent = s.slice(0, i); if (sound && i - was <= 3 && /[a-z]/i.test(s[i - 1] || "")) blip(s[i - 1]); if (i >= s.length) { clearInterval(typeT); mood("smug"); if (done) done(); } }, 28);
  }
  function hide() { clearTimeout(hideT); bubble.setAttribute("hidden", ""); root.classList.remove("ps-flint-in"); const tr = bubble.querySelector(".ps-flint-try"); if (tr) tr.setAttribute("hidden", ""); bubble.querySelector("b").textContent = PACK.name; }
  // pop in with a line (force skips the mode's chance and gap)
  function pop(kind, vars, force) {
    const M = MODES[mode] || MODES.chatty, now = Date.now();
    if (!force && (now - lastPop < M.gap || Math.random() > M.chance || !panel.hasAttribute("hidden"))) return null;
    let s = Math.random() < 0.15 && !force ? slip() : line(kind, vars); if (!s) return null;
    if (teach && !force) return null;
    lastPop = now; bubble.removeAttribute("hidden"); root.classList.add("ps-flint-in"); if (sound) sting();
    mood(kind === "place" || kind === "render" ? "wow" : kind === "idle" || kind === "empty" ? "bored" : "smug");
    setTimeout(() => typeOut(text, s), 220);
    clearTimeout(hideT); hideT = setTimeout(hide, 4000 + s.length * 45);
    return s;
  }

  // ---- the help menu
  const input = h("input", { type: "text", class: "ps-flint-q", placeholder: "Ask me: how do I rotate things?", "aria-label": "Your question", maxlength: "160" });
  const answer = h("div", { class: "ps-flint-ans" }), actions = h("div", { class: "ps-flint-acts" });
  const modeRow = h("div", { class: "ps-flint-modes" }, ["Pop-ins:"].concat(["chatty", "quiet", "off"].map((m) => h("button", { type: "button", "data-mode": m, on: () => setMode(m) }, [m[0].toUpperCase() + m.slice(1)]))));
  const snd = h("button", { type: "button", class: "ps-flint-snd", on: () => { sound = !sound; store.set("ps.flint.sound", sound ? "on" : "off"); paintModes(); } });
  const teachBtn = h("button", { type: "button", class: "ps-flint-teachbtn", on: () => { setTeach(!teach); if (teach) closePanel(); } });
  modeRow.append(snd);
  const panel = h("div", { class: "ps-flint-panel", hidden: "", role: "dialog", "aria-label": PACK.name + " help" }, [
    h("div", { class: "ps-flint-head" }, [h("span", { class: "ps-flint-mini" }), h("b", { text: PACK.name }), h("span", { class: "ps-flint-role", text: "guide, critic, maps" }), h("button", { type: "button", class: "ps-flint-x", title: "Close", on: () => closePanel() }, ["×"])]),
    h("div", { class: "ps-flint-askrow" }, [input, h("button", { type: "button", class: "ps-flint-go", on: () => doAsk(input.value) }, ["Ask"])]),
    h("div", { class: "ps-flint-topics" }, TOPICS.map((t) => h("button", { type: "button", on: () => { input.value = "How do I " + t.toLowerCase() + "?"; doAsk(input.value); } }, [t]))),
    answer, actions, teachBtn, modeRow]);
  panel.querySelector(".ps-flint-mini").innerHTML = FLINT_SVG;
  (document.getElementById("app") || document.body).appendChild(panel);
  input.addEventListener("keydown", (e) => { if (e.key === "Enter") { e.preventDefault(); doAsk(input.value); } e.stopPropagation(); });
  function paintModes() { teachBtn.textContent = teach ? "Teach mode: ON (tap to stop)" : "Teach mode: click anything and I explain it"; teachBtn.setAttribute("aria-pressed", String(teach)); for (const b of modeRow.querySelectorAll("[data-mode]")) b.setAttribute("aria-pressed", String(b.dataset.mode === mode)); snd.textContent = sound ? "Sound on" : "Sound off"; snd.setAttribute("aria-pressed", String(sound)); }
  function setMode(m) { mode = m; store.set("ps.flint.mode", m); paintModes(); }
  let results = [], ri = 0;
  function showAnswer() {
    const r = results[ri]; actions.innerHTML = "";
    if (!r) { typeOut(answer, "No idea, and I've surveyed everything. Try other words, like 'move', 'render' or 'real place'."); mood("bored"); return; }
    typeOut(answer, r.a);
    if (r.show && findTarget(r.show)) actions.append(h("button", { type: "button", class: "ps-flint-show", on: () => showMe(r.show) }, ["Show me"]));
    if (results.length > 1) actions.append(h("button", { type: "button", class: "ghost", on: () => { ri = (ri + 1) % results.length; showAnswer(); } }, ["Another answer"]));
  }
  function doAsk(q) { results = ask(q, W.HELP); ri = 0; showAnswer(); return results; }
  function openPanel() {
    hide(); if (phone && phone.open && phone.open !== "pad") phone.show(phone.open);
    panel.removeAttribute("hidden"); av.setAttribute("aria-pressed", "true"); paintModes();
    if (!answer.textContent) typeOut(answer, "Lost already? Ask me how to do anything. I'll even point at it."); else mood("smug");
    if (sound) sting(); setTimeout(() => { try { input.focus(); } catch (e) { /* ok */ } }, 50);
  }
  function closePanel() { panel.setAttribute("hidden", ""); av.setAttribute("aria-pressed", "false"); }
  av.onclick = () => (panel.hasAttribute("hidden") ? openPanel() : closePanel());

  // "Show me": find the control, open its drawer or tab, glow it
  function findTarget(s) {
    if (s.sel) return document.querySelector(s.sel);
    const k = s.key || ""; let el = document.querySelector('[data-key="' + k.replace(/"/g, "") + '"]'); if (el) return el;
    const m = /^(btn|card|tab):(.*)$/.exec(k); if (!m) return null; const t = m[2].trim();
    const pool = m[1] === "btn" ? "button, .btn" : m[1] === "tab" ? ".tabbtn" : ".ctitle, .card > .title, .card .ctitle";
    return [...document.querySelectorAll(pool)].find((x) => x.textContent.trim().toLowerCase() === t.toLowerCase()) || null;
  }
  function showMe(s) {
    const el = findTarget(s); if (!el) return false;
    closePanel();
    const host = el.closest("#lib, #insp, #bar, #top .menu, #pad");
    if (phone && isPhone() && host) { const id = host.id || (host.classList.contains("menu") ? "menu" : null); if (id && phone.open !== id) phone.show(id); }
    if (/^tab:/.test(s.key || "")) el.click();
    setTimeout(() => { try { el.scrollIntoView({ block: "center", behavior: "smooth" }); } catch (e) { el.scrollIntoView(); } el.classList.add("ps-flint-hi"); setTimeout(() => el.classList.remove("ps-flint-hi"), 2600); }, isPhone() ? 320 : 30);
    return true;
  }
  // ---- Teach mode: click (or tap) any control and Flint explains it instead of it happening; "Try it" then does it
  let teach = false, pass = null, taught = null, vpTaught = false;
  const badge = h("button", { type: "button", class: "ps-flint-badge", hidden: "", title: "Teach mode is on: click anything and Flint explains it. Click here to stop.", on: () => setTeach(false) }, ["📐 TEACH MODE · tap to stop"]);
  (document.getElementById("app") || document.body).appendChild(badge);
  function setTeach(v) {
    teach = !!v; vpTaught = false; document.body.classList.toggle("ps-teach", teach); if (teach) badge.removeAttribute("hidden"); else badge.setAttribute("hidden", "");
    paintModes(); if (teach) say("Teach mode. Click anything and I'll tell you what it does. Nothing happens until you press Try it.", "talk", 9000); else hide();
  }
  // what is this control? the app's hover-help info (its help text + how to use it), or a web control from TEACH
  function lesson(target) { const L = lesson0(target); if (L) L.press = (target.closest && target.closest("button, .btn, [data-tab], .tabbtn, a, .assist, [role=button], [role=tab], [role=switch], .segbtn")) || L.node; return L; }
  function lesson0(target) {
    const node = target.closest && target.closest("[data-help]");
    if (node && node.__help) {
      const info = node.__help; let t = "";
      for (const u of W.uis || []) { try { t = u.help.text ? u.help.text(info) : ""; } catch (e) { t = ""; } if (t) break; }
      t = t || W.HELP[info.key] || info.fallback || "";
      const how = info.keys || (W.uis && W.uis[0] && W.uis[0].help.KEYS && W.uis[0].help.KEYS[info.kind]) || "";
      const range = info.min != null && info.max != null ? "Range " + info.min + " to " + info.max + (info.unit ? " " + String(info.unit).trim() : "") + "." : "";
      if (t) return { node, name: String(info.name || info.key).replace(/^(btn|card|tab):/, ""), a: t, how: [how, range].filter(Boolean).join(" ") };
    }
    for (const x of TEACH) { const n = target.closest && target.closest(x.sel); if (n) return { node: n, name: x.name, a: x.a, how: "" }; }
    return null;
  }
  function say(s, m, ms) { bubble.removeAttribute("hidden"); root.classList.add("ps-flint-in"); bubble.querySelector("b").textContent = PACK.name; mood(m || "talk"); typeOut(text, s); clearTimeout(hideT); hideT = setTimeout(hide, ms || 4000 + s.length * 45); }
  const tryRow = h("div", { class: "ps-flint-try", hidden: "" });
  bubble.insertBefore(tryRow, bubble.querySelector(".ps-flint-brow"));
  function teachOn(L) {
    taught = L; for (const x of document.querySelectorAll(".ps-flint-hi")) x.classList.remove("ps-flint-hi"); L.node.classList.add("ps-flint-hi");
    bubble.querySelector("b").textContent = PACK.name + " on: " + L.name;
    say(L.a + (L.how ? "  How: " + L.how : ""), "talk", 20000); bubble.querySelector("b").textContent = PACK.name + " on: " + L.name;
    tryRow.innerHTML = ""; tryRow.removeAttribute("hidden");
    tryRow.append(h("button", { type: "button", class: "ps-flint-show", on: () => { const n = L.press || L.node; pass = n; hide(); n.classList.remove("ps-flint-hi"); if (n.id === "vp") { pass = null; say("Go on then, drag it. Teach mode is still on for the buttons.", "smug", 4000); return; }
      if (n.matches("button, .btn, [data-tab], .tabbtn, a, .assist, [role=button], [role=tab], [role=switch], .segbtn")) {   // a real press: some controls act on pointer/mouse down, others on click
        const r = n.getBoundingClientRect(), o = { bubbles: true, cancelable: true, clientX: r.left + r.width / 2, clientY: r.top + r.height / 2, button: 0 };
        n.dispatchEvent(new PointerEvent("pointerdown", o)); n.dispatchEvent(new MouseEvent("mousedown", o)); n.dispatchEvent(new PointerEvent("pointerup", o)); n.dispatchEvent(new MouseEvent("mouseup", o)); n.click();
        setTimeout(() => { pass = null; }, 50); } else { say("Your turn. Go ahead and use it, I'll wait.", "smug", 3500); setTimeout(() => { if (pass === n) pass = null; }, 10000); } } }, ["Try it"]));
    if (sound) blip("a");
  }
  const stopper = (e) => {
    if (!teach) return; const t = e.target;
    if (!t || !t.closest || t.closest(".ps-flint, .ps-flint-panel, .ps-flint-badge, .ps-start, .ps-tip")) return;
    if (pass && (t === pass || pass.contains(t))) return;
    if (!t.closest("#app, #vpwrap, .ps-make")) return;
    const L = lesson(t); if (!L) return;
    if (L.node.id === "vp") { if (e.type === "pointerdown" && !vpTaught) { vpTaught = true; teachOn(L); } return; }   // the view still turns; it gets one explanation   // the view still turns; it gets one explanation
    e.preventDefault(); e.stopImmediatePropagation();
    if (e.type === "click" || (e.type === "pointerdown" && !L.node.matches("button, .btn, [data-tab], .tabbtn, a"))) teachOn(L);
  };
  for (const ev of ["pointerdown", "mousedown", "touchstart", "click", "dblclick", "input", "change"]) document.addEventListener(ev, stopper, { capture: true, passive: false });
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && teach && panel.hasAttribute("hidden")) { e.stopImmediatePropagation(); setTeach(false); return; }
    if (e.key === "Escape" && !panel.hasAttribute("hidden")) { e.stopImmediatePropagation(); closePanel(); return; }
    if (e.key === "?" && !/INPUT|SELECT|TEXTAREA/.test((e.target && e.target.tagName) || "") && !e.metaKey && !e.ctrlKey) { e.preventDefault(); openPanel(); }
  }, true);

  // ---- watching the build (every 1.5 s): what changed since last time
  const seen = { n: 0, kinds: {}, sky: null, water: null, png: null, histI: null, explore: false, place: "", peers: new Set(), quietSince: Date.now(), sig: "", warned: new Set() };
  function watch() {
    const sc = W.st.scene, objs = sc.objs.filter((o) => o.type !== "light"), kinds = {}; objs.forEach((o) => { const k = kindName(o); kinds[k] = (kinds[k] || 0) + 1; });
    const sig = JSON.stringify([objs.length, sc.sky, sc.water]) + (W.hist ? W.hist.i : ""); if (sig !== seen.sig) { seen.sig = sig; seen.quietSince = Date.now(); }
    let said = null;
    const added = Object.keys(kinds).find((k) => (kinds[k] || 0) > (seen.kinds[k] || 0));
    if (W.hist && seen.histI != null && W.hist.i < seen.histI - 1) said = pop("undo");
    else if (objs.length < seen.n - 2) said = pop("deleted");
    else if (added) {
      const k = added, n = kinds[k];
      if (k === "terrain") said = pop("terrain");
      else if (seen.n === 0 && objs.length === 1) said = pop("first", { kind: k });
      else if (n >= 4 && n % 2 === 0) said = pop("same", { kind: k, n });
      else if (objs.length >= 30 && !seen.warned.has("busy")) { said = pop("busy", { n: objs.length }); if (said) seen.warned.add("busy"); }
      const fl = objs.find((o) => o.type !== "terrain" && W.st.view && !W.st.view.stick && o.y > (o.s || 1) * 3 + 2);
      if (!said && fl) said = pop("floating", { kind: kindName(fl) });
    }
    if (!said && seen.water === false && sc.water) said = pop("water");
    if (!said && seen.sky && seen.sky !== sc.sky && sc.sky === "Night") said = pop("night");
    const png = W.refs && W.refs.lastPng; if (!said && png && png !== seen.png && seen.png !== null) said = pop("render");
    const ex = document.body.classList.contains("ps-explore"); if (!said && ex && !seen.explore) said = pop("explore");
    const TL = W.TL && W.TL(); const d = TL && TL.isOpen && TL.st.data;
    if (d && d.dem && d.box) { const key = [d.box.lat, d.box.lon, d.box.w].join(","); if (key !== seen.place) { seen.place = key; if (!said) said = pop("place", placeVars(TL, d), true); } }
    const net = window.__psNet; if (net && net.ready) for (const p of net.peers.values()) { if (!seen.peers.has(p.sid)) { seen.peers.add(p.sid); if (!said && seen.n !== null) said = pop("joined", { name: p.name }); } }
    if (!said && Date.now() - seen.quietSince > 180000) { seen.quietSince = Date.now(); said = pop(objs.length ? "idle" : "empty"); }
    Object.assign(seen, { n: objs.length, kinds, sky: sc.sky, water: !!sc.water, png: png || seen.png || 0, histI: W.hist ? W.hist.i : null, explore: ex });
    return said;
  }
  const placeVars = (TL, d) => ({ place: TL.tl.name || "This place", range: Math.round((d.dem.max - d.dem.min) * (TL.tl.exag ? 1 : 1)).toLocaleString("en-US"), km: (+(TL.tl.wKm || d.box.w / 1000 || 0)).toFixed(1).replace(/\.0$/, "") });
  watch(); const timer = setInterval(() => { try { watch(); } catch (e) { console.error("[flint]", e); } }, 1500);
  if (opt.hello !== false && !store.get("ps.flint.met")) setTimeout(() => { if (pop("hello", null, true)) store.set("ps.flint.met", "1"); }, opt.helloDelay || 6000);
  paintModes();
  const api = { setTeach, lesson, get teach() { return teach; }, get taught() { return taught; }, pop, ask: doAsk, openPanel, closePanel, showMe, findTarget, watch, setMode, get mode() { return mode; }, root, panel, bubble, stop: () => clearInterval(timer), _seen: seen };
  window.__psSeer = api; return api;
}
