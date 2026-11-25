// Frank's Brew Console - After Effects host script (ExtendScript, ES3).
// The panel (js/main.js) calls these through evalScript; every function returns a JSON string.
// Param ids are the effects' own parameter ids (see ae/tools/gen-console-map.js): a third-party
// effect's parameter has the match name "<effect match name>-<id as 4 digits>".

function brewJSON(v) {
  if (v === null || v === undefined) return "null";
  var t = typeof v;
  if (t === "number") return isFinite(v) ? String(v) : "null";
  if (t === "boolean") return v ? "true" : "false";
  if (t === "string") return '"' + v.replace(/\\/g, "\\\\").replace(/"/g, '\\"').replace(/\n/g, "\\n").replace(/\r/g, "\\r").replace(/\t/g, "\\t") + '"';
  if (v instanceof Array) { var a = []; for (var i = 0; i < v.length; i++) a.push(brewJSON(v[i])); return "[" + a.join(",") + "]"; }
  var o = []; for (var k in v) if (v.hasOwnProperty(k)) o.push(brewJSON(String(k)) + ":" + brewJSON(v[k])); return "{" + o.join(",") + "}";
}
function brewParse(s) { return eval("(" + s + ")"); }
function brewOk(o) { o = o || {}; o.ok = true; return brewJSON(o); }
function brewErr(msg) { return brewJSON({ ok: false, error: String(msg) }); }

function brewComp() {
  var c = app.project ? app.project.activeItem : null;
  return (c && c instanceof CompItem) ? c : null;
}
function brewPad4(n) { var s = String(n); while (s.length < 4) s = "0" + s; return s; }
// find a param inside an effect by id, searching topic groups too
function brewParam(fx, match, id) {
  var want = match + "-" + brewPad4(id);
  try { var p = fx.property(want); if (p) return p; } catch (e) {}
  function walk(g) {
    for (var i = 1; i <= g.numProperties; i++) {
      var q = g.property(i);
      if (q.matchName === want) return q;
      if (q.propertyType !== PropertyType.PROPERTY) { var r = walk(q); if (r) return r; }
    }
    return null;
  }
  return walk(fx);
}
function brewEffects(layer, match) {
  var out = [], fx = layer.property("ADBE Effect Parade");
  if (!fx) return out;
  for (var i = 1; i <= fx.numProperties; i++) if (fx.property(i).matchName === match) out.push(fx.property(i));
  return out;
}
function brewTarget(layer, match, addIfMissing) {
  var list = brewEffects(layer, match);
  if (list.length) return list[list.length - 1];
  if (!addIfMissing) return null;
  var fx = layer.property("ADBE Effect Parade");
  if (!fx || !fx.canAddProperty(match)) return null;
  return fx.addProperty(match);
}
function brewSelected() {
  var c = brewComp(); if (!c) return [];
  var out = [], s = c.selectedLayers;
  for (var i = 0; i < s.length; i++) if (s[i].property("ADBE Effect Parade")) out.push(s[i]);
  return out;
}
function brewSet(prop, v) {
  if (!prop) return false;
  if (prop.numKeys > 0 && prop.canVaryOverTime) { prop.setValueAtTime(brewComp().time, v); return true; }
  prop.setValue(v); return true;
}

// ---- panel status: active comp, selected layers and the Brew effects on them
function brew_status(matchesJSON) {
  try {
    var matches = brewParse(matchesJSON), c = brewComp();
    if (!c) return brewOk({ comp: null, layers: [] });
    var layers = [], s = c.selectedLayers;
    for (var i = 0; i < s.length; i++) {
      var L = s[i], fx = [];
      for (var m = 0; m < matches.length; m++) { var n = brewEffects(L, matches[m]).length; if (n) fx.push(matches[m]); }
      layers.push({ index: L.index, name: L.name, fx: fx, audio: !!(L.hasAudio && !L.hasVideo) });
    }
    return brewOk({ comp: c.name, time: c.time, layers: layers, installed: brewInstalled(matches) });
  } catch (e) { return brewErr(e); }
}
var brewInstalledCache = null;
function brewInstalled(matches) {
  if (brewInstalledCache) return brewInstalledCache;
  var have = {}, list = app.effects;
  for (var i = 0; i < list.length; i++) have[list[i].matchName] = true;
  var out = {}; for (var m = 0; m < matches.length; m++) out[matches[m]] = !!have[matches[m]];
  brewInstalledCache = out; return out;
}

// ---- apply a built-in look (Look popup or Look B popup) to every selected layer
function brew_applyLook(match, whichJSON, index, addNew) {
  try {
    var which = brewParse(whichJSON);
    var layers = brewSelected(); if (!layers.length) return brewErr("Select one or more layers first.");
    app.beginUndoGroup("Brew Console: apply look");
    var n = 0;
    for (var i = 0; i < layers.length; i++) {
      var fx = addNew ? null : brewTarget(layers[i], match, false);
      if (!fx) fx = brewTarget(layers[i], match, true);
      if (!fx) continue;
      var lookId = which.look;
      var p = brewParam(fx, match, lookId);
      // Look B menu is None, separator, then the looks, so look i sits at i + 2
      if (p) { brewSet(p, which.morph ? index + 2 : index); n++; }
      if (which.morph) { var mp = brewParam(fx, match, which.morph); if (mp && mp.numKeys === 0 && mp.value === 0) brewSet(mp, 50); }
    }
    app.endUndoGroup();
    return brewOk({ count: n });
  } catch (e) { try { app.endUndoGroup(); } catch (e2) {} return brewErr(e); }
}

// ---- set many params at once: values = { id: value }, order = [id...] (set first, e.g. the Look popup)
function brew_setParams(match, valuesJSON, orderJSON, undoName) {
  try {
    var values = brewParse(valuesJSON), order = brewParse(orderJSON || "[]");
    var layers = brewSelected(); if (!layers.length) return brewErr("Select one or more layers first.");
    app.beginUndoGroup("Brew Console: " + (undoName || "set"));
    var n = 0, missing = [];
    for (var i = 0; i < layers.length; i++) {
      var fx = brewTarget(layers[i], match, true); if (!fx) continue;
      var done = {};
      for (var o = 0; o < order.length; o++) if (values.hasOwnProperty(order[o])) { brewSet(brewParam(fx, match, order[o]), values[order[o]]); done[order[o]] = 1; }
      for (var k in values) if (values.hasOwnProperty(k) && !done[k]) {
        var p = brewParam(fx, match, k);
        if (!p) { missing.push(k); continue; }
        var v = values[k];
        if (v && v.keys) {           // keyframes: { keys: [[seconds from now, value], ...] }
          var t0 = brewComp().time;
          for (var q = 0; q < v.keys.length; q++) p.setValueAtTime(t0 + v.keys[q][0], v.keys[q][1]);
        } else brewSet(p, v);
      }
      n++;
    }
    app.endUndoGroup();
    return brewOk({ count: n, missing: missing });
  } catch (e) { try { app.endUndoGroup(); } catch (e2) {} return brewErr(e); }
}

// ---- read params from the Brew effect on the first selected layer that has one
function brew_getParams(match, idsJSON) {
  try {
    var ids = brewParse(idsJSON), layers = brewSelected();
    for (var i = 0; i < layers.length; i++) {
      var fx = brewTarget(layers[i], match, false); if (!fx) continue;
      var out = {};
      for (var k = 0; k < ids.length; k++) {
        var p = brewParam(fx, match, ids[k]);
        if (p && p.propertyValueType !== PropertyValueType.NO_VALUE) { try { out[ids[k]] = p.valueAtTime(brewComp().time, true); } catch (e) { out[ids[k]] = p.value; } }
      }
      return brewOk({ layer: layers[i].name, values: out });
    }
    return brewErr("Select a layer that has this Brew effect.");
  } catch (e) { return brewErr(e); }
}

// ---- link a param to the comp's audio: "Convert Audio to Keyframes", then an expression
function brew_linkAudio(match, id, amount) {
  try {
    var c = brewComp(); if (!c) return brewErr("Open a composition first.");
    var sel = c.selectedLayers, fxLayers = [], audio = [];
    for (var i = 0; i < sel.length; i++) {
      if (brewEffects(sel[i], match).length) fxLayers.push(sel[i]);
      else if (sel[i].hasAudio) audio.push(sel[i]);
    }
    if (!fxLayers.length) return brewErr("Select the layer with the Brew effect (and, optionally, the audio layer).");
    app.beginUndoGroup("Brew Console: link to audio");
    // reuse an existing Audio Amplitude layer if one is there
    var amp = null;
    for (var j = 1; j <= c.numLayers; j++) { var L = c.layer(j); if (L.comment === "brew-audio" || L.name === "Audio Amplitude") { amp = L; break; } }
    if (!amp) {
      for (var k = 1; k <= c.numLayers; k++) c.layer(k).selected = false;
      for (var a = 0; a < audio.length; a++) audio[a].selected = true;
      var before = c.numLayers;
      app.executeCommand(app.findMenuCommandId("Convert Audio to Keyframes"));
      if (c.numLayers === before) { app.endUndoGroup(); return brewErr("This comp has no audio to link (After Effects made no Audio Amplitude layer)."); }
      amp = c.layer(1); amp.comment = "brew-audio";
    }
    // loudest value, so full amount = double at the loudest beat
    var slider = amp.property("ADBE Effect Parade").property(3).property(1), peak = 0;
    for (var s = 1; s <= slider.numKeys; s++) peak = Math.max(peak, slider.keyValue(s));
    if (peak <= 0) peak = 1;
    var expr = "// Brew Console: audio link\nvar a = thisComp.layer(\"" + amp.name.replace(/"/g, '\\"') + "\").effect(3)(1);\nvalue * (1 + " + (amount / 100) + " * a / " + peak.toFixed(3) + ");";
    var n = 0;
    for (var f = 0; f < fxLayers.length; f++) {
      var fx = brewTarget(fxLayers[f], match, false), p = brewParam(fx, match, id);
      if (p && p.canSetExpression) { p.expression = expr; n++; }
      fxLayers[f].selected = true;
    }
    app.endUndoGroup();
    return brewOk({ count: n, layer: amp.name, peak: peak });
  } catch (e) { try { app.endUndoGroup(); } catch (e2) {} return brewErr(e); }
}
function brew_unlinkAudio(match, idsJSON) {
  try {
    var ids = brewParse(idsJSON), layers = brewSelected(), n = 0;
    app.beginUndoGroup("Brew Console: unlink audio");
    for (var i = 0; i < layers.length; i++) {
      var list = brewEffects(layers[i], match);
      for (var e = 0; e < list.length; e++) for (var k = 0; k < ids.length; k++) {
        var p = brewParam(list[e], match, ids[k]);
        if (p && p.expression && p.expression.indexOf("Brew Console: audio link") >= 0) { p.expression = ""; n++; }
      }
    }
    app.endUndoGroup();
    return brewOk({ count: n });
  } catch (e) { try { app.endUndoGroup(); } catch (e2) {} return brewErr(e); }
}

// ---- saved looks file (shared by every project on this computer) and Export / Import
function brewLooksFile() {
  var dir = new Folder(Folder.userData.fsName + "/Franks Brew");
  if (!dir.exists) dir.create();
  return new File(dir.fsName + "/ae-saved-looks.json");
}
function brewRead(f) { f.encoding = "UTF-8"; if (!f.open("r")) return null; var s = f.read(); f.close(); return s; }
function brewWrite(f, s) { f.encoding = "UTF-8"; if (!f.open("w")) return false; f.write(s); f.close(); return true; }
function brew_loadSaved() {
  try { var f = brewLooksFile(); var s = f.exists ? brewRead(f) : null; return brewOk({ text: s || "[]" }); } catch (e) { return brewErr(e); }
}
function brew_storeSaved(text) {
  try { return brewWrite(brewLooksFile(), text) ? brewOk() : brewErr("Could not write the saved looks file."); } catch (e) { return brewErr(e); }
}
function brew_exportLooks(text, name) {
  try {
    var f = new File(Folder.desktop.fsName + "/" + name).saveDlg("Export Brew looks", "JSON:*.json");
    if (!f) return brewOk({ cancelled: true });
    return brewWrite(f, text) ? brewOk({ path: f.fsName }) : brewErr("Could not write " + f.fsName);
  } catch (e) { return brewErr(e); }
}
function brew_importLooks() {
  try {
    var f = File.openDialog("Import Brew looks (Photoshop or After Effects look file)", "JSON:*.json");
    if (!f) return brewOk({ cancelled: true });
    return brewOk({ text: brewRead(f), path: f.fsName });
  } catch (e) { return brewErr(e); }
}
