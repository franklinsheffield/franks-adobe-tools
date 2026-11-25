"use strict";
// The ONE place this plugin's display name lives (Lab rename, Frank 2026-11-24).
// tools/sync-brand.js copies NAME into manifest.json; tests/brand.js checks it.
// LEGACY is the old name: it stays the storage key so saved settings, looks and
// panel layout survive the rename. Plugin id and folder name never change.
module.exports = { NAME: "Batch Mock Lab", LEGACY: "Frank's Batch Mock Brew" };
