"use strict";
// ======================================================================
// Shared "Library" card: built-in presets, the user's saved looks, and
// Export / Import of a JSON file so a whole team shares the same looks.
// The file format is the same for every tool: [{ name, p: {...settings} }].
//
//   const lib = createLibrary(ui, {
//     builtins: [{ cat, name, p }], applyPatch(p), getSaveable(),
//     io: PS, setStatus(msg, isErr)
//   });
//   root.appendChild(lib.card); await lib.load();
// ======================================================================

function createLibrary(ui, o) {
  const { el, clear } = ui;
  let userPresets = [];

  const presetSel = el("select", {});
  const userSel = el("select", {});
  const nameIn = el("input", { type: "text", placeholder: "Name your look" });

  function allPresets() {
    return o.builtins.map((p) => ({ label: p.cat + " - " + p.name, p: p.p, user: false }))
      .concat(userPresets.map((u) => ({ label: "Mine - " + u.name, p: u.p, user: true, name: u.name })));
  }
  function fillSelect(sel, labels, placeholder) {
    clear(sel);
    sel.appendChild(el("option", { value: "", text: placeholder }));
    labels.forEach((l, i) => sel.appendChild(el("option", { value: String(i), text: l })));
    sel.selectedIndex = 0;
  }
  function refill() {
    fillSelect(presetSel, allPresets().map((x) => x.label), "Choose a preset...");
    fillSelect(userSel, userPresets.map((u) => u.name), "My saved looks...");
  }

  presetSel.addEventListener("change", () => {
    const i = parseInt(presetSel.value, 10);
    if (isNaN(i)) return;
    o.applyPatch(allPresets()[i].p);
  });
  userSel.addEventListener("change", () => {
    const i = parseInt(userSel.value, 10);
    if (isNaN(i)) return;
    nameIn.value = userPresets[i].name;
    o.applyPatch(userPresets[i].p);
  });

  const saveBtn = el("button", { class: "btn small", text: "Save look" });
  saveBtn.addEventListener("click", async () => {
    const name = nameIn.value.trim();
    if (!name) { o.setStatus("Type a name for your look first.", true); return; }
    userPresets = userPresets.filter((u) => u.name !== name);
    userPresets.push({ name, p: o.getSaveable() });
    try { await o.io.saveUserPresets(userPresets); o.setStatus("Saved look: " + name); } catch (e) { o.setStatus("Could not save: " + e.message, true); }
    refill();
  });
  const delBtn = el("button", { class: "btn small", text: "Delete" });
  delBtn.addEventListener("click", async () => {
    const i = parseInt(userSel.value, 10);
    if (isNaN(i)) return;
    const nm = userPresets[i].name;
    userPresets.splice(i, 1);
    try { await o.io.saveUserPresets(userPresets); o.setStatus("Deleted: " + nm); } catch (e) { o.setStatus("Could not delete: " + e.message, true); }
    refill();
  });
  const expBtn = el("button", { class: "btn small", text: "Export all" });
  expBtn.addEventListener("click", async () => {
    try { const ok = await o.io.exportPresets(userPresets); if (ok) o.setStatus("Exported " + userPresets.length + " looks."); } catch (e) { o.setStatus("Export failed: " + e.message, true); }
  });
  const impBtn = el("button", { class: "btn small", text: "Import" });
  impBtn.addEventListener("click", async () => {
    try {
      const list = await o.io.importPresets();
      if (!list) return;
      list.forEach((u) => { if (u && u.name && u.p) { userPresets = userPresets.filter((x) => x.name !== u.name); userPresets.push(u); } });
      await o.io.saveUserPresets(userPresets);
      refill();
      o.setStatus("Imported looks. Share the exported file with your team.");
    } catch (e) { o.setStatus("Import failed: " + e.message, true); }
  });

  const card = ui.card("Library", [
    ui.row("Preset", presetSel),
    ui.row("Mine", userSel, delBtn),
    ui.row("", nameIn, saveBtn),
    el("div", { class: "row" }, [expBtn, impBtn])
  ]);

  async function load() {
    try { userPresets = await o.io.loadUserPresets(); } catch (e) { /* no saved looks yet */ }
    refill();
  }

  refill();
  return { card, load, refill, get userPresets() { return userPresets; } };
}

module.exports = { createLibrary };
