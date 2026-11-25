"use strict";
// Lab Console for After Effects as a UXP panel (After Effects 27.x UXP, require("aftereffects")).
// The console UI (ae/console/js/main.js) is shared with the CEP panel and the Premiere panel; it
// calls host functions by name. In the CEP panel they run as ExtendScript (ae/console/jsx/host.jsx);
// here the same calls run on After Effects' UXP DOM, which mirrors the ExtendScript object model
// (app.project, CompItem.selectedLayers, PropertyGroup.addProperty, Property.setValueAtTime, undo
// groups). Param ids are the effects' own ids: param match name "<effect match name>-<id 4 digits>".
(function () {
  let ae = null, uxp = null;
  try { ae = require("aftereffects"); uxp = require("uxp"); } catch (e) { /* browser preview / tests */ }
  if (window.__LAB_AE_FAKE__) { ae = window.__LAB_AE_FAKE__.ae; uxp = window.__LAB_AE_FAKE__.uxp; }

  const ok = (o) => Object.assign({ ok: true }, o || {});
  const err = (m) => ({ ok: false, error: String(m && m.message || m) });
  const pad4 = (n) => String(n).padStart(4, "0");
  const app = () => ae;                      // require("aftereffects") is the Application object

  // ---------------------------------------------------------------- comp, layers, effects
  function comp() {
    const p = app().project; if (!p) return null;
    const c = p.activeItem;
    // CompItem: has selectedLayers and layer(); footage and folders do not
    return c && Array.isArray(c.selectedLayers) && typeof c.layer === "function" ? c : null;
  }
  const isGroup = (q) => q && typeof q.numProperties === "number" && typeof q.property === "function";
  function param(fx, match, id) {
    const want = match + "-" + pad4(id);
    try { const p = fx.property(want); if (p) return p; } catch (e) { /* walk instead */ }
    function walk(g) {
      for (let i = 1; i <= g.numProperties; i++) {
        const q = g.property(i);
        if (!q) continue;
        if (q.matchName === want) return q;
        if (isGroup(q)) { const r = walk(q); if (r) return r; }
      }
      return null;
    }
    return walk(fx);
  }
  function parade(layer) { try { return layer.property("ADBE Effect Parade"); } catch (e) { return null; } }
  function effects(layer, match) {
    const out = [], fx = parade(layer);
    if (!fx) return out;
    for (let i = 1; i <= fx.numProperties; i++) if (fx.property(i).matchName === match) out.push(fx.property(i));
    return out;
  }
  function target(layer, match, addIfMissing) {
    const list = effects(layer, match);
    if (list.length) return list[list.length - 1];
    if (!addIfMissing) return null;
    const fx = parade(layer);
    if (!fx || (typeof fx.canAddProperty === "function" && !fx.canAddProperty(match))) return null;
    fx.addProperty(match);
    // adding to an indexed group invalidates references: look the new effect up again
    const again = effects(layer, match);
    return again[again.length - 1] || null;
  }
  function selected() {
    const c = comp(); if (!c) return [];
    return c.selectedLayers.filter((L) => !!parade(L));
  }
  function set(prop, v) {
    if (!prop) return false;
    if (prop.numKeys > 0 && prop.canVaryOverTime) { prop.setValueAtTime(comp().time, v); return true; }
    prop.setValue(v); return true;
  }
  function undo(label, fn) {
    const a = app();
    a.beginUndoGroup("Lab Console: " + label);
    try { return fn(); } finally { try { a.endUndoGroup(); } catch (e) { /* already closed */ } }
  }

  // ---------------------------------------------------------------- the console's host calls
  let installed = null;
  function installedMap(matches) {
    if (installed) return installed;
    const have = new Set((app().effects || []).map((e) => e.matchName));
    installed = {}; for (const m of matches) installed[m] = have.has(m);
    return installed;
  }
  const calls = {
    brew_status(matches) {
      const c = comp();
      if (!c) return ok({ comp: null, layers: [] });
      const layers = c.selectedLayers.map((L) => ({ index: L.index, name: L.name,
        fx: matches.filter((m) => effects(L, m).length), audio: !!(L.hasAudio && !L.hasVideo) }));
      return ok({ comp: c.name, time: c.time, layers, installed: installedMap(matches) });
    },
    brew_applyLook(match, which, index, addNew) {
      const layers = selected(); if (!layers.length) return err("Select one or more layers first.");
      let n = 0;
      undo("apply look", () => {
        for (const L of layers) {
          let fx = addNew ? null : target(L, match, false);
          if (!fx) fx = target(L, match, true);
          if (!fx) continue;
          const p = param(fx, match, which.look);
          // Look B menu is None, separator, then the looks, so look i sits at i + 2
          if (p) { set(p, which.morph ? index + 2 : index); n++; }
          if (which.morph) { const mp = param(fx, match, which.morph); if (mp && mp.numKeys === 0 && mp.value === 0) set(mp, 50); }
        }
      });
      return ok({ count: n });
    },
    brew_setParams(match, values, order, undoName) {
      const layers = selected(); if (!layers.length) return err("Select one or more layers first.");
      order = order || [];
      let n = 0; const missing = [];
      undo(undoName || "set", () => {
        for (const L of layers) {
          const fx = target(L, match, true); if (!fx) continue;
          const done = {};
          for (const id of order) if (Object.prototype.hasOwnProperty.call(values, id)) { set(param(fx, match, id), values[id]); done[id] = 1; }
          for (const k of Object.keys(values)) {
            if (done[k]) continue;
            const p = param(fx, match, k);
            if (!p) { missing.push(k); continue; }
            const v = values[k];
            if (v && v.keys) {           // keyframes: { keys: [[seconds from now, value], ...] }
              const t0 = comp().time;
              for (const [dt, kv] of v.keys) p.setValueAtTime(t0 + dt, kv);
            } else set(p, v);
          }
          n++;
        }
      });
      return ok({ count: n, missing: [...new Set(missing)] });
    },
    brew_getParams(match, ids) {
      for (const L of selected()) {
        const fx = target(L, match, false); if (!fx) continue;
        const values = {};
        for (const id of ids) {
          const p = param(fx, match, id);
          if (!p || isGroup(p)) continue;
          try { values[id] = p.valueAtTime(comp().time, true); } catch (e) { try { values[id] = p.value; } catch (e2) { /* no value */ } }
        }
        return ok({ layer: L.name, values });
      }
      return err("Select a layer that has this Lab effect.");
    },
    brew_linkAudio(match, id, amount) {
      const a = app(), c = comp(); if (!c) return err("Open a composition first.");
      if (typeof a.executeCommand !== "function" || typeof a.findMenuCommandId !== "function") return err("Audio links need the CEP Lab Console in this After Effects version.");
      const fxLayers = [], audio = [];
      for (const L of c.selectedLayers) { if (effects(L, match).length) fxLayers.push(L); else if (L.hasAudio) audio.push(L); }
      if (!fxLayers.length) return err("Select the layer with the Lab effect (and, optionally, the audio layer).");
      return undo("link to audio", () => {
        let amp = null;
        for (let j = 1; j <= c.numLayers; j++) { const L = c.layer(j); if (L.comment === "brew-audio" || L.name === "Audio Amplitude") { amp = L; break; } }
        if (!amp) {
          for (let k = 1; k <= c.numLayers; k++) c.layer(k).selected = false;
          audio.forEach((L) => { L.selected = true; });
          const before = c.numLayers;
          a.executeCommand(a.findMenuCommandId("Convert Audio to Keyframes"));
          if (c.numLayers === before) return err("This comp has no audio to link (After Effects made no Audio Amplitude layer).");
          amp = c.layer(1); amp.comment = "brew-audio";
        }
        const slider = amp.property("ADBE Effect Parade").property(3).property(1);
        let peak = 0;
        for (let s = 1; s <= slider.numKeys; s++) peak = Math.max(peak, slider.keyValue(s));
        if (peak <= 0) peak = 1;
        const expr = "// Brew Console: audio link\nvar a = thisComp.layer(\"" + amp.name.replace(/"/g, '\\"') + "\").effect(3)(1);\nvalue * (1 + " + (amount / 100) + " * a / " + peak.toFixed(3) + ");";
        let n = 0;
        for (const L of fxLayers) {
          const p = param(target(L, match, false), match, id);
          if (p && p.canSetExpression) { p.expression = expr; n++; }
          L.selected = true;
        }
        return ok({ count: n, layer: amp.name, peak });
      });
    },
    brew_unlinkAudio(match, ids) {
      let n = 0;
      undo("unlink audio", () => {
        for (const L of selected()) for (const fx of effects(L, match)) for (const id of ids) {
          const p = param(fx, match, id);
          if (p && p.expression && p.expression.indexOf("Brew Console: audio link") >= 0) { p.expression = ""; n++; }
        }
      });
      return ok({ count: n });
    },
    async brew_loadSaved() {
      const f = await looksFile(false);
      if (!f) return ok({ text: "[]" });
      return ok({ text: await f.read() });
    },
    async brew_storeSaved(text) { const f = await looksFile(true); await f.write(text); return ok(); },
    async brew_exportLooks(text, name) {
      const f = await uxp.storage.localFileSystem.getFileForSaving(name, { types: ["json"] });
      if (!f) return ok({ cancelled: true });
      await f.write(text); return ok({ path: f.nativePath || f.name });
    },
    async brew_importLooks() {
      const f = await uxp.storage.localFileSystem.getFileForOpening({ types: ["json"] });
      if (!f) return ok({ cancelled: true });
      return ok({ text: await f.read(), path: f.nativePath || f.name });
    }
  };
  async function looksFile(create) {
    const dir = await uxp.storage.localFileSystem.getDataFolder();
    try { return await dir.getEntry("saved-looks.json"); } catch (e) { return create ? dir.createFile("saved-looks.json", { overwrite: true }) : null; }
  }

  window.LabHost = {
    words: { app: "AE" },
    call(fn, args) {
      if (!ae) return { ok: false, error: "After Effects API not available." };
      const f = calls[fn]; if (!f) return { ok: false, error: "Not available here: " + fn };
      try { return f.apply(null, args); } catch (e) { return err(e); }
    },
    _debug: { clearCache: () => { installed = null; } }
  };
})();
