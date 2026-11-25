"use strict";
// Lab Console for Premiere Pro (UXP) - host adapter.
// The console UI (ae/console/js/main.js, shared with After Effects) calls host functions by name;
// in After Effects they run as ExtendScript (ae/console/jsx/host.jsx). Here the same calls run on
// Premiere's UXP API (require("premierepro"), Premiere 25.6+).
//
// Premiere reaches an effect's params by position (Component.getParam(i)). ppro-map.js (generated
// by ae/tools/gen-ppro-map.js) gives each AE param id its Effect Controls position and name;
// paramIndex() finds Premiere's offset from the names, so the map survives Premiere counting the
// input layer or topic ends differently from After Effects.
(function () {
  const MAP = window.LAB_PPRO;
  let ppro = null, uxp = null;
  try { ppro = require("premierepro"); uxp = require("uxp"); } catch (e) { /* browser preview / tests */ }
  if (window.__LAB_PPRO_FAKE__) { ppro = window.__LAB_PPRO_FAKE__.ppro; uxp = window.__LAB_PPRO_FAKE__.uxp; }

  // Premiere's value for an AE popup item. Premiere 2027 (27.0) numbers AE popup items from 0
  // (After Effects from 1), checked on the Mac 2026-11-25. Re-checked on a freshly added effect
  // (see popupBase()), which always starts on the first item, and kept for the session.
  const DEFAULT_POPUP_BASE = 0;
  let POPUP_BASE = null;
  const freshComps = new WeakSet();
  const AE_PREFIX = "AE.";

  const ok = (o) => Object.assign({ ok: true }, o || {});
  const err = (m) => ({ ok: false, error: String(m && m.message || m) });
  const toolOf = (match) => { for (const id of Object.keys(MAP)) if (MAP[id].match === match) return Object.assign({ id }, MAP[id]); return null; };
  const sameMatch = (prName, match) => prName === AE_PREFIX + match || prName === match || String(prName).endsWith("." + match);

  // ---------------------------------------------------------------- project, sequence, selection
  async function context() {
    const project = await ppro.Project.getActiveProject();
    if (!project) return {};
    const sequence = await project.getActiveSequence();
    return { project, sequence };
  }
  function isVideo(item) {
    if (ppro.VideoClipTrackItem && typeof ppro.VideoClipTrackItem === "function") { try { return item instanceof ppro.VideoClipTrackItem; } catch (e) { /* fall through */ } }
    return !!(item && typeof item.getComponentChain === "function" && (!ppro.AudioClipTrackItem || !(item instanceof ppro.AudioClipTrackItem)));
  }
  async function selectedClips(sequence) {
    if (!sequence) return [];
    const sel = await sequence.getSelection();
    const items = sel ? await sel.getTrackItems() : [];
    return (items || []).filter(isVideo);
  }
  async function clipName(c) { try { return await c.getName(); } catch (e) { return "clip"; } }

  // ---------------------------------------------------------------- components on a clip
  async function components(project, clip) {
    const chain = await clip.getComponentChain();
    const list = [];
    project.lockedAccess(() => { const n = chain.getComponentCount(); for (let i = 0; i < n; i++) list.push(chain.getComponentAtIndex(i)); });
    const out = [];
    for (const c of list) out.push({ c, match: await c.getMatchName() });
    return { chain, list: out };
  }
  async function labComponents(project, clip, match) {
    const { chain, list } = await components(project, clip);
    return { chain, fx: list.filter((x) => sameMatch(x.match, match)).map((x) => x.c) };
  }
  function transact(project, label, fill) {
    let done = false, thrown = null;
    project.lockedAccess(() => {
      try { done = project.executeTransaction((ca) => fill(ca), "Lab Console: " + label); } catch (e) { thrown = e; }
    });
    if (thrown) throw thrown;
    return done !== false;
  }
  async function addLab(project, clip, match) {
    const comp = await ppro.VideoFilterFactory.createComponent(AE_PREFIX + match);
    const { chain } = await components(project, clip);
    transact(project, "add effect", (ca) => ca.addAction(chain.createAppendComponentAction(comp)));
    const again = await labComponents(project, clip, match);
    return again.fx[again.fx.length - 1] || comp;
  }
  async function target(project, clip, match, addNew) {
    if (!addNew) { const { fx } = await labComponents(project, clip, match); if (fx.length) return fx[fx.length - 1]; }
    const comp = await addLab(project, clip, match);
    if (comp) freshComps.add(comp);
    return comp;
  }

  // ---------------------------------------------------------------- AE param id -> Premiere param index
  const indexCache = new Map();
  function paramIndex(project, tool, comp) {
    let names = [];
    project.lockedAccess(() => { const n = comp.getParamCount(); for (let i = 0; i < n; i++) { let d = ""; try { d = comp.getParam(i).displayName || ""; } catch (e) { /* unnamed */ } names.push(String(d).trim()); } });
    const key = tool.id + ":" + names.join("|");
    if (indexCache.has(key)) return indexCache.get(key);
    // 1) one fixed offset (Premiere counts every AE param, with or without the input layer)
    const named = Object.entries(tool.names).map(([p, nm]) => [Number(p), nm]);
    let best = { off: 0, score: -1 };
    for (let off = -2; off <= 2; off++) {
      const score = named.reduce((s, [p, nm]) => s + (names[p + off] === nm ? 1 : 0), 0);
      if (score > best.score) best = { off, score };
    }
    const idx = {};
    if (best.score >= named.length * 0.9) {
      for (const [id, p] of Object.entries(tool.pos)) if (p + best.off >= 0 && p + best.off < names.length) idx[id] = p + best.off;
    } else {
      // 2) walk both lists in order (Premiere may leave out topic ends or hidden params)
      const byPos = Object.entries(tool.pos).map(([id, p]) => [Number(id), p]).sort((a, b) => a[1] - b[1]);
      let cur = 0;
      for (const [id, p] of byPos) {
        const want = tool.names[p], kind = tool.kinds[id];
        if (want) {
          let f = -1; for (let j = cur; j < Math.min(names.length, cur + 4); j++) if (names[j] === want) { f = j; break; }
          if (f >= 0) { idx[id] = f; cur = f + 1; }
        } else if (kind === "end") {
          if (cur < names.length && names[cur] === "") { idx[id] = cur; cur++; }
        } else if (cur < names.length) { idx[id] = cur; cur++; }      // loop-built name (Stop 3 colour...)
      }
    }
    const res = { idx, names, offset: best.score >= named.length * 0.9 ? best.off : null, score: best.score, named: named.length };
    indexCache.set(key, res);
    return res;
  }

  // ---------------------------------------------------------------- values
  function kindOf(tool, id, v) {
    const k = tool.kinds[id];
    if (k) return k;
    if (Array.isArray(v)) return "color";
    if (typeof v === "boolean") return "bool";
    return "num";
  }
  function toPr(tool, id, v) {
    const k = kindOf(tool, id, v);
    if (k === "color") { const c = Array.isArray(v) ? v : [0, 0, 0, 1]; return new ppro.Color(c[0], c[1], c[2], c.length > 3 ? c[3] : 1); }
    if (k === "bool") return !!v;
    if (k === "popup") return Number(v) - 1 + (POPUP_BASE == null ? DEFAULT_POPUP_BASE : POPUP_BASE);
    return Number(v);
  }
  function fromPr(tool, id, v) {
    const k = kindOf(tool, id, v);
    if (v && typeof v === "object" && "value" in v && !Array.isArray(v)) v = v.value;
    if (k === "color") {
      if (Array.isArray(v)) return v.slice(0, 4);
      if (v && typeof v === "object") { const r = v.red != null ? v.red : v.r, g = v.green != null ? v.green : v.g, b = v.blue != null ? v.blue : v.b, a = v.alpha != null ? v.alpha : v.a; return [r, g, b, a == null ? 1 : a]; }
      return [0, 0, 0, 1];
    }
    if (k === "bool") return v ? 1 : 0;
    if (k === "popup") return Number(v) + 1 - (POPUP_BASE == null ? DEFAULT_POPUP_BASE : POPUP_BASE);
    return Number(v);
  }
  async function clipTime(clip, sequence, dt) {
    // keyframe times are in the clip's media time: playhead - clip start + clip in point
    const pos = await sequence.getPlayerPosition();
    let start = 0, inPt = 0;
    try { start = (await clip.getStartTime()).seconds; } catch (e) { /* 0 */ }
    try { inPt = (await clip.getInPoint()).seconds; } catch (e) { /* 0 */ }
    return ppro.TickTime.createWithSeconds(Math.max(0, pos.seconds - start + inPt + (dt || 0)));
  }
  // Learn Premiere's popup numbering from the Look popup: a new effect starts on the first look.
  // Only a freshly added effect tells us anything: its Look menu sits on the first item.
  async function popupBase(project, tool, comp, map, sequence, clip) {
    if (POPUP_BASE != null || !freshComps.has(comp)) return POPUP_BASE == null ? DEFAULT_POPUP_BASE : POPUP_BASE;
    const i = map.idx[tool.look != null ? tool.look : 2];
    if (i == null) return 1;
    try {
      let p; project.lockedAccess(() => { p = comp.getParam(i); });
      const r = await p.getValueAtTime(await clipTime(clip, sequence, 0));
      const v = Number(r && typeof r === "object" ? r.value : r);
      if (v === 0) POPUP_BASE = 0; else if (v === 1) POPUP_BASE = 1;
    } catch (e) { /* keep default */ }
    return POPUP_BASE == null ? DEFAULT_POPUP_BASE : POPUP_BASE;
  }

  // Set many params on one component: values = { aeId: value | { keys: [[seconds from playhead, value], ...] } }
  async function setValues(project, sequence, clip, tool, comp, values, order, label) {
    const map = paramIndex(project, tool, comp);
    const missing = [], ids = (order || []).filter((id) => id in values).concat(Object.keys(values).filter((id) => !(order || []).map(String).includes(String(id))));
    const t0 = await clipTime(clip, sequence, 0);
    const plan = [];
    for (const id of ids) {
      const i = map.idx[id];
      if (i == null) { missing.push(id); continue; }
      const v = values[id];
      if (v && !Array.isArray(v) && Array.isArray(v.keys)) {
        const times = []; for (const [dt] of v.keys) times.push(await clipTime(clip, sequence, dt));
        plan.push({ id, i, keys: v.keys.map(([, val], n) => [times[n], val]) });
      } else plan.push({ id, i, v });
    }
    transact(project, label || "set", (ca) => {
      for (const s of plan) {
        let p; try { p = comp.getParam(s.i); } catch (e) { missing.push(s.id); continue; }
        try {
          if (s.keys) {
            if (!p.isTimeVarying()) ca.addAction(p.createSetTimeVaryingAction(true));
            for (const [t, val] of s.keys) { const kf = p.createKeyframe(toPr(tool, s.id, val)); kf.position = t; ca.addAction(p.createAddKeyframeAction(kf)); }
          } else if (p.isTimeVarying()) {
            const kf = p.createKeyframe(toPr(tool, s.id, s.v)); kf.position = t0; ca.addAction(p.createAddKeyframeAction(kf));
          } else {
            ca.addAction(p.createSetValueAction(p.createKeyframe(toPr(tool, s.id, s.v)), true));
          }
        } catch (e) { missing.push(s.id); }
      }
    });
    return { missing, map };
  }

  // ---------------------------------------------------------------- the console's host calls
  let installed = null;
  async function installedMap(matches) {
    if (installed) return installed;
    let names = [];
    try { names = await ppro.VideoFilterFactory.getMatchNames(); } catch (e) { return null; }
    installed = {};
    for (const m of matches) installed[m] = names.some((n) => sameMatch(n, m));
    return installed;
  }
  const calls = {
    async brew_status(matches) {
      const { project, sequence } = await context();
      if (!project || !sequence) return ok({ comp: null, layers: [] });
      const layers = [];
      for (const clip of await selectedClips(sequence)) {
        const { list } = await components(project, clip);
        layers.push({ name: await clipName(clip), fx: matches.filter((m) => list.some((x) => sameMatch(x.match, m))) });
      }
      return ok({ comp: sequence.name, layers, installed: await installedMap(matches) });
    },
    async brew_applyLook(match, which, index, addNew) {
      const tool = toolOf(match); if (!tool) return err("Unknown Lab effect.");
      const { project, sequence } = await context();
      const clips = await selectedClips(sequence);
      if (!clips.length) return err("Select one or more clips in the timeline first.");
      let n = 0, missing = [];
      for (const clip of clips) {
        const comp = await target(project, clip, match, addNew);
        const map = paramIndex(project, tool, comp);
        await popupBase(project, tool, comp, map, sequence, clip);
        let values;
        if (which.look === tool.look || which.look === undefined) {
          // set the Look menu and every control it fills (Premiere may not run the effect's own fill)
          values = Object.assign({}, tool.lookVals[index - 1] || {}); values[which.look] = index;
        } else {
          values = { [which.look]: index + 2 };      // Look B menu: None, separator, then the looks
          if (which.morph) values[which.morph] = 50;
        }
        const r = await setValues(project, sequence, clip, tool, comp, values, [which.look], "apply look");
        missing = missing.concat(r.missing); n++;
      }
      return ok({ count: n, missing: [...new Set(missing)] });
    },
    async brew_setParams(match, values, order, undoName) {
      const tool = toolOf(match); if (!tool) return err("Unknown Lab effect.");
      const { project, sequence } = await context();
      const clips = await selectedClips(sequence);
      if (!clips.length) return err("Select one or more clips in the timeline first.");
      let n = 0, missing = [];
      for (const clip of clips) {
        const comp = await target(project, clip, match, false);
        const map = paramIndex(project, tool, comp);
        await popupBase(project, tool, comp, map, sequence, clip);
        const r = await setValues(project, sequence, clip, tool, comp, values, order, undoName);
        missing = missing.concat(r.missing); n++;
      }
      return ok({ count: n, missing: [...new Set(missing)] });
    },
    async brew_getParams(match, ids) {
      const tool = toolOf(match); if (!tool) return err("Unknown Lab effect.");
      const { project, sequence } = await context();
      for (const clip of await selectedClips(sequence)) {
        const { fx } = await labComponents(project, clip, match);
        if (!fx.length) continue;
        const comp = fx[fx.length - 1], map = paramIndex(project, tool, comp);
        await popupBase(project, tool, comp, map, sequence, clip);
        const t = await clipTime(clip, sequence, 0), values = {};
        for (const id of ids) {
          const i = map.idx[id]; if (i == null) continue;
          let p; project.lockedAccess(() => { p = comp.getParam(i); });
          try { const r = await p.getValueAtTime(t); values[id] = fromPr(tool, id, r && typeof r === "object" && "value" in r ? r.value : r); } catch (e) { /* skip */ }
        }
        return ok({ values, layer: await clipName(clip) });
      }
      return err("Select a clip that has the " + tool.id + " Lab effect.");
    },
    async brew_linkAudio() { return err("Audio links are After Effects only."); },
    async brew_unlinkAudio() { return err("Audio links are After Effects only."); },
    async brew_loadSaved() {
      const f = await looksFile(false);
      if (!f) return ok({ text: "[]" });
      return ok({ text: await f.read() });
    },
    async brew_storeSaved(text) { const f = await looksFile(true); await f.write(text); return ok(); },
    async brew_exportLooks(text, name) {
      const fs = uxp.storage.localFileSystem;
      const f = await fs.getFileForSaving(name, { types: ["json"] });
      if (!f) return ok({ cancelled: true });
      await f.write(text); return ok({ path: f.nativePath || f.name });
    },
    async brew_importLooks() {
      const fs = uxp.storage.localFileSystem;
      const f = await fs.getFileForOpening({ types: ["json"] });
      if (!f) return ok({ cancelled: true });
      return ok({ text: await f.read(), path: f.nativePath || f.name });
    }
  };
  async function looksFile(create) {
    const dir = await uxp.storage.localFileSystem.getDataFolder();
    try { return await dir.getEntry("saved-looks.json"); } catch (e) { return create ? dir.createFile("saved-looks.json", { overwrite: true }) : null; }
  }

  window.LabHost = {
    words: { app: "PR", comp: "SEQUENCE", layer: "clip", openComp: "Open a sequence and select clips", start: "Select clips in the timeline, then click a look." },
    noAudio: true,
    call(fn, args) {
      if (!ppro) return { ok: false, error: "Premiere Pro API not available." };
      const f = calls[fn]; if (!f) return { ok: false, error: "Not available in Premiere: " + fn };
      return f.apply(null, args);
    },
    // for tests and the Mac smoke test
    _debug: { paramIndex, toolOf, setPopupBase: (b) => { POPUP_BASE = b; }, getPopupBase: () => POPUP_BASE, clearCache: () => { indexCache.clear(); installed = null; } }
  };
})();
