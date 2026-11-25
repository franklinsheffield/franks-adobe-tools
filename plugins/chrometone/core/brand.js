"use strict";
// Suite-wide naming (Lab rename, Frank 2026-11-24). Each plugin's own name is in
// plugins/<tool>/brand.js. SUITE is the line under every panel; the suite's final
// name is still open, so change it here only.
const SUITE = "Lab suite";
const LABS = ["Chroma", "Depth", "Halo", "Scanline", "Dithers", "Decompressor", "Paint", "Batch Mock", "Font", "Worlds"];
// A result group is "<layer> - <Tool> Lab - <look>" (3.0) or "<layer> - Frank's <Tool> Brew - <look>" (older docs).
const RESULT_RE = new RegExp("(Frank's .+ Brew|\\b(" + LABS.join("|") + ") Lab) - ");
function isResult(name) { return RESULT_RE.test(String(name || "")); }
module.exports = { SUITE, LABS, isResult };
