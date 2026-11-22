"use strict";
// Frank's Brew Console for After Effects (CEP panel).
// Picks a Brew effect, applies its looks to the selected layers, adds motion, links a
// control to the music, and keeps saved looks in the same file format as the Photoshop Brews.
(function () {
  const B = window.BREW, $ = (id) => document.getElementById(id);
  const CEP = window.__adobe_cep__;
  const MATCHES = B.tools.map((t) => t.match);

  // ------------------------------------------------------------ host bridge
  function q(s) { return JSON.stringify(String(s)); }
  function host(fn, ...args) {
    const call = fn + "(" + args.map((a) => typeof a === "number" || typeof a === "boolean" ? String(a) : q(typeof a === "string" ? a : JSON.stringify(a))).join(",") + ")";
    return new Promise((res) => {
      if (!CEP) return res(mock(fn, args));
      CEP.evalScript(call, (r) => { try { res(JSON.parse(r)); } catch (e) { res({ ok: false, error: "Host script error: " + r }); } });
    });
  }
  // browser preview (outside After Effects): canned answers so the panel can be looked at
  function mock(fn) {
    if (fn === "brew_status") return { ok: true, comp: "Preview comp", layers: [{ name: "Group photo", fx: ["com.franks.mobglow.ae"] }], installed: Object.fromEntries(MATCHES.map((m) => [m, true])) };
    if (fn === "brew_loadSaved") return { ok: true, text: JSON.stringify([{ name: "Club Night", tool: "mobglow", p: { glow: { radius: 300 } } }]) };
    return { ok: true, count: 1 };
  }

  // ------------------------------------------------------------ status line + LED
  let ledTimer = 0;
  function status(msg, kind) {
    const s = $("status"); s.textContent = msg || ""; s.className = "status" + (kind === "err" ? " err" : "");
    const led = $("led"); led.className = "led" + (kind === "err" ? " err" : kind === "busy" ? " busy" : "");
    $("ledtxt").textContent = kind === "err" ? "ERROR" : kind === "busy" ? "BUSY" : "READY";
    clearTimeout(ledTimer);
    if (kind === "err") ledTimer = setTimeout(() => { $("led").className = "led"; $("ledtxt").textContent = "READY"; }, 6000);
  }
  async function run(label, p) {
    status(label + "...", "busy");
    const r = await p;
    if (!r.ok) status(r.error, "err");
    return r;
  }
  function flash(node) { node.classList.add("flash"); setTimeout(() => node.classList.remove("flash"), 350); }

  // ------------------------------------------------------------ tool rack
  let tool = B.tools[0], cat = "All";
  try { const s = localStorage.getItem("brewconsole.tool"); const f = B.tools.find((t) => t.id === s); if (f) tool = f; } catch (e) { /* no storage */ }
  const toolNodes = {};
  function shortName(t) { return t.title.replace(/^Frank's\s+/, "").replace(/\s+Brew$/, "").toUpperCase(); }
  function buildTools() {
    const box = $("tools");
    B.tools.concat(B.coming).forEach((t) => {
      const live = !!t.match;
      const n = document.createElement("div");
      n.className = "tool" + (live ? "" : " soon");
      n.style.setProperty("--c", t.glow);
      n.title = t.title + (live ? "" : " - After Effects version coming next");
      n.innerHTML = `<img src="icons/${t.id}.png"><div class="tn">${shortName(t)}</div><div class="tc">${t.code}</div>` + (live ? "" : `<div class="badge">SOON</div>`);
      if (live) n.addEventListener("click", () => selectTool(t));
      box.appendChild(n); toolNodes[t.id] = n;
    });
  }
  function selectTool(t) {
    tool = t; cat = "All";
    try { localStorage.setItem("brewconsole.tool", t.id); } catch (e) { /* no storage */ }
    Object.values(toolNodes).forEach((n) => n.classList.remove("on"));
    toolNodes[t.id].classList.add("on");
    document.documentElement.style.setProperty("--tool", t.glow);
    document.querySelector(".title").textContent = shortName(t) + " BREW";
    document.querySelector(".rackcode").textContent = "FRANK'S · " + t.code + " · AE";
    buildCats(); buildLooks(); buildMotion(); buildAudio(); refillMine();
  }

  // ------------------------------------------------------------ looks
  let lookMode = "look";
  $("lookMode").addEventListener("click", (e) => {
    const b = e.target.closest("button"); if (!b) return;
    lookMode = b.dataset.v;
    [...$("lookMode").children].forEach((c) => c.classList.toggle("on", c === b));
  });
  function buildCats() {
    const box = $("cats"); box.innerHTML = "";
    const cats = ["All"].concat([...new Set(tool.looks.map((l) => l.cat))]);
    if (cats.length <= 2) return;
    cats.forEach((c) => {
      const b = document.createElement("button"); b.textContent = c.toUpperCase(); if (c === cat) b.className = "on";
      b.addEventListener("click", () => { cat = c; buildCats(); buildLooks(); });
      box.appendChild(b);
    });
  }
  function buildLooks() {
    const box = $("looks"); box.innerHTML = "";
    tool.looks.filter((l) => cat === "All" || l.cat === cat).forEach((l) => {
      const n = document.createElement("div"); n.className = "look"; n.title = l.cat + " - " + l.name + ": click to apply to the selected layers";
      n.innerHTML = `<img loading="lazy" src="thumbs/${tool.id}-${l.i}.jpg"><div class="ln">${l.name.toUpperCase()}</div>`;
      n.addEventListener("click", async () => {
        flash(n);
        const which = lookMode === "look" ? { look: tool.look } : { look: tool.lookB, morph: tool.morph };
        const r = await run("Applying " + l.name, host("brew_applyLook", tool.match, which, l.i, $("addNew").checked));
        if (r.ok) status(`${lookMode === "look" ? "Look" : "Look B"}: ${l.name} on ${r.count} layer${r.count === 1 ? "" : "s"}.` + (lookMode === "lookB" ? " Animate 'Morph to Look B' to blend." : ""));
      });
      box.appendChild(n);
    });
  }

  // ------------------------------------------------------------ motion presets (shared Motion group)
  const MOTION = [
    { name: "DRIFT", tip: "Slow drift", v: { animate: 1, driftx: 40, drifty: -15 } },
    { name: "SPIN", tip: "Spin", v: { animate: 1, spin: 45 } },
    { name: "PULSE", tip: "Pulse once a second", v: { animate: 1, pulse: 40, pulser: 1 } },
    { name: "FLICKER", tip: "Flicker", v: { animate: 1, flick: 30, flickr: 12 } },
    { name: "JITTER", tip: "Jitter", v: { animate: 1, jit: 2, jitr: 12 } },
    { name: "BOIL 2S", tip: "Boil on 2s", v: { animate: 1, boil: 3 } },
    { name: "REVEAL", tip: "Wipe the effect in over 1 s from the playhead", v: { animate: 1, revmode: 2, reveal: { keys: [[0, 0], [1, 100]] } } },
    { name: "MORPH A>B", tip: "Morph from Look to Look B over 2 s from the playhead", v: { morph: { keys: [[0, 0], [2, 100]] } } },
    { name: "CLEAR", tip: "Turn motion off and reset it", v: { animate: 0, speed: 100, driftx: 0, drifty: 0, spin: 0, pulse: 0, flick: 0, jit: 0, boil: 1, reveal: 100 } }
  ];
  function buildMotion() {
    const box = $("motion"); box.innerHTML = "";
    MOTION.forEach((m) => {
      const b = document.createElement("button"); b.textContent = m.name;
      const spinName = tool.params[tool.motion.spin];
      b.title = m.name === "SPIN" ? spinName : m.tip;
      b.addEventListener("click", async () => {
        const vals = {};
        for (const [k, v] of Object.entries(m.v)) vals[k === "morph" ? tool.morph : tool.motion[k]] = v;
        const r = await run("Adding motion", host("brew_setParams", tool.match, vals, [], "motion " + m.name.toLowerCase()));
        if (r.ok) status(`${m.tip} on ${r.count} layer${r.count === 1 ? "" : "s"}.`);
      });
      box.appendChild(b);
    });
  }

  // ------------------------------------------------------------ audio link
  const AUDIO = {
    "crt-phaser": ["phase.amp", "tube.bloom", "phase.glow", "signal.noise"],
    "mobglow": ["glow.strength", "glow.radius", "finish.grain"],
    "depthtone": ["light.strength", "look.fog", "lines.width"],
    "decompressor": ["mosh.amount", "glitch.offset", "glitch.slices", "finish.mix"]
  };
  function audioIds() { return (AUDIO[tool.id] || []).map((k) => tool.keys[k].id).concat([tool.motion.pulse, tool.morph]); }
  function buildAudio() {
    const sel = $("audTarget"); sel.innerHTML = "";
    audioIds().forEach((id) => { const o = document.createElement("option"); o.value = id; o.textContent = tool.params[id]; sel.appendChild(o); });
  }
  $("audAmt").addEventListener("input", () => { $("audAmtN").value = $("audAmt").value; });
  $("audAmtN").addEventListener("change", () => { $("audAmt").value = $("audAmtN").value; });
  $("audLink").addEventListener("click", async (e) => {
    flash(e.target);
    const id = Number($("audTarget").value), amt = Number($("audAmtN").value) || 0;
    const r = await run("Linking to audio", host("brew_linkAudio", tool.match, id, amt));
    if (r.ok) status(`${tool.params[id]} now follows "${r.layer}" on ${r.count} layer${r.count === 1 ? "" : "s"}.`);
  });
  $("audUnlink").addEventListener("click", async () => {
    const r = await run("Unlinking", host("brew_unlinkAudio", tool.match, audioIds()));
    if (r.ok) status(`Removed ${r.count} audio link${r.count === 1 ? "" : "s"}.`);
  });

  // ------------------------------------------------------------ Photoshop look <-> AE values
  const isObj = (v) => v && typeof v === "object" && !Array.isArray(v);
  function merge(base, patch) {
    const out = JSON.parse(JSON.stringify(base));
    (function rec(d, s) { for (const k of Object.keys(s || {})) { if (isObj(s[k]) && isObj(d[k])) rec(d[k], s[k]); else d[k] = JSON.parse(JSON.stringify(s[k])); } })(out, patch);
    return out;
  }
  const getPath = (o, k) => k.split(".").reduce((a, s) => (a == null ? a : a[s]), o);
  function setPath(o, k, v) { const s = k.split("."); let a = o; for (let i = 0; i < s.length - 1; i++) a = a[s[i]] = isObj(a[s[i]]) ? a[s[i]] : {}; a[s[s.length - 1]] = v; }
  function hexToAE(h) { const n = parseInt(String(h || "#000000").replace("#", ""), 16) || 0; return [((n >> 16) & 255) / 255, ((n >> 8) & 255) / 255, (n & 255) / 255, 1]; }
  function aeToHex(c) { return "#" + c.slice(0, 3).map((x) => Math.round(Math.max(0, Math.min(1, x)) * 255).toString(16).padStart(2, "0")).join("").toUpperCase(); }
  function psToAE(t, p) {
    const full = merge(t.defaults, p), out = {};
    for (const [k, e] of Object.entries(t.keys)) {
      const v = getPath(full, k); if (v === undefined) continue;
      if (e.kind === "num") out[e.id] = Number(v);
      else if (e.kind === "bool") out[e.id] = v === true || v === "true" ? 1 : 0;
      else if (e.kind === "color") out[e.id] = hexToAE(v);
      else if (e.kind === "popup") out[e.id] = e.values ? Math.max(1, e.values.indexOf(String(v)) + 1) : (e.map[String(v)] || e.other);
      else if (e.kind === "stops" && Array.isArray(v)) {
        const n = Math.max(e.min, Math.min(e.max, v.length)); out[e.stops] = n - 1;
        for (let s = 0; s < n && s < v.length; s++) { out[e.c + 2 * s] = hexToAE(v[s].c); out[e.p + 2 * s] = Number(v[s].p); }
      }
    }
    return out;
  }
  function aeToPS(t, vals) {
    const p = {};
    for (const [k, e] of Object.entries(t.keys)) {
      const id = e.kind === "stops" ? e.stops : e.id, v = vals[id]; if (v === undefined) continue;
      let o;
      if (e.kind === "num") o = Math.round(v * 1000) / 1000;
      else if (e.kind === "bool") o = !!v;
      else if (e.kind === "color") o = aeToHex(v);
      else if (e.kind === "popup") {
        if (e.values) o = e.values[v - 1] || e.values[0];
        else { o = Object.keys(e.map).find((x) => e.map[x] === v); if (o === undefined) o = getPath(t.defaults, k); if (/^\d+$/.test(o) && typeof getPath(t.defaults, k) === "number") o = Number(o); }
      } else if (e.kind === "stops") {
        o = []; for (let s = 0; s < v + 1; s++) if (vals[e.c + 2 * s]) o.push({ p: Math.round(vals[e.p + 2 * s]), c: aeToHex(vals[e.c + 2 * s]) });
      }
      setPath(p, k, o);
    }
    return p;
  }
  function snapIds(t) { return Object.keys(t.params).map(Number).filter((id) => id !== t.look && id !== t.lookB); }

  // ------------------------------------------------------------ my looks (file shared by every project on this computer)
  let mine = [];
  async function loadMine() {
    const r = await host("brew_loadSaved");
    try { mine = r.ok ? JSON.parse(r.text) : []; } catch (e) { mine = []; }
    if (!Array.isArray(mine)) mine = [];
    refillMine();
  }
  async function storeMine() { const r = await host("brew_storeSaved", JSON.stringify(mine, null, 1)); if (!r.ok) status(r.error, "err"); }
  function forTool() { return mine.filter((m) => (m.tool || tool.id) === tool.id); }
  function refillMine() {
    const sel = $("mine"); sel.innerHTML = "";
    const list = forTool();
    const o0 = document.createElement("option"); o0.value = ""; o0.textContent = list.length ? "My saved looks (" + list.length + ")..." : "No saved looks for this effect yet"; sel.appendChild(o0);
    list.forEach((m) => { const o = document.createElement("option"); o.value = m.name; o.textContent = m.name + (m.ae ? "" : "  (from Photoshop)"); sel.appendChild(o); });
  }
  $("saveBtn").addEventListener("click", async () => {
    const name = $("saveName").value.trim();
    if (!name) return status("Type a name for your look first.", "err");
    const r = await run("Reading the effect", host("brew_getParams", tool.match, snapIds(tool)));
    if (!r.ok) return;
    mine = mine.filter((m) => !(m.name === name && (m.tool || tool.id) === tool.id));
    mine.push({ name, tool: tool.id, p: aeToPS(tool, r.values), ae: r.values });
    await storeMine(); refillMine(); $("mine").value = name;
    status(`Saved "${name}" from ${r.layer}.`);
  });
  $("mineApply").addEventListener("click", async () => {
    const m = forTool().find((x) => x.name === $("mine").value);
    if (!m) return status("Choose one of your saved looks first.", "err");
    const vals = m.ae || psToAE(tool, m.p);
    const r = await run("Applying " + m.name, host("brew_setParams", tool.match, vals, [], "look " + m.name));
    if (r.ok) status(`Applied "${m.name}" to ${r.count} layer${r.count === 1 ? "" : "s"}.` + (r.missing && r.missing.length ? ` (${r.missing.length} controls not found)` : ""));
  });
  $("mineDel").addEventListener("click", async () => {
    const name = $("mine").value; if (!name) return status("Choose a saved look to delete.", "err");
    mine = mine.filter((m) => !(m.name === name && (m.tool || tool.id) === tool.id));
    await storeMine(); refillMine(); status(`Deleted "${name}".`);
  });
  $("exportBtn").addEventListener("click", async () => {
    const list = forTool();
    if (!list.length) return status("Save a look first, then export.", "err");
    // Photoshop reads [{ name, p }]; the extra fields are ignored there
    const r = await run("Exporting", host("brew_exportLooks", JSON.stringify(list, null, 1), shortName(tool).toLowerCase().replace(/\s+/g, "-") + "-looks.json"));
    if (r.ok) status(r.cancelled ? "" : `Exported ${list.length} look${list.length === 1 ? "" : "s"} to ${r.path}`);
  });
  $("importBtn").addEventListener("click", async () => {
    const r = await run("Importing", host("brew_importLooks"));
    if (!r.ok || r.cancelled) return status(r.ok ? "" : r.error, r.ok ? "" : "err");
    let list; try { list = JSON.parse(r.text); } catch (e) { return status("That file is not a Brew look file.", "err"); }
    if (!Array.isArray(list)) list = [list];
    let n = 0;
    for (const it of list) {
      if (!it || !it.name || !isObj(it.p)) continue;
      const t = it.tool || tool.id;
      if (!B.tools.find((x) => x.id === t)) continue;
      mine = mine.filter((m) => !(m.name === it.name && (m.tool || t) === t));
      mine.push({ name: it.name, tool: t, p: it.p, ae: it.tool && it.ae ? it.ae : undefined }); n++;
    }
    await storeMine(); refillMine();
    status(n ? `Imported ${n} look${n === 1 ? "" : "s"} into ${shortName(tool)}.` : "No looks found in that file.", n ? "" : "err");
  });

  // ------------------------------------------------------------ selection strip (polled)
  let polling = false;
  async function poll() {
    if (polling) return; polling = true;
    try {
      const r = await host("brew_status", MATCHES);
      if (r.ok) {
        const strip = $("selstrip");
        if (!r.comp) strip.textContent = "Open a composition and select layers";
        else {
          const n = r.layers.length, on = r.layers.filter((l) => l.fx.indexOf(tool.match) >= 0).length;
          strip.innerHTML = `COMP <b></b> · ${n ? n + " layer" + (n === 1 ? "" : "s") + " selected" : "no layers selected"}` + (n ? ` · ${shortName(tool)} on ${on}` : "");
          strip.querySelector("b").textContent = r.comp;
        }
        if (r.installed) for (const t of B.tools) {
          const nd = toolNodes[t.id], miss = r.installed[t.match] === false;
          nd.classList.toggle("missing", miss);
          let bd = nd.querySelector(".badge");
          if (miss && !bd) { bd = document.createElement("div"); bd.className = "badge"; bd.textContent = "NOT INSTALLED"; nd.appendChild(bd); }
          if (!miss && bd) bd.remove();
        }
      }
    } finally { polling = false; }
  }

  buildTools(); selectTool(tool); loadMine(); poll(); setInterval(poll, 1500);
  status("Select layers in a comp, then click a look.");
})();
