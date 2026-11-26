// Pixel Scape web build: pathToFileURL gives a blob: URL of the file in the web file system.
"use strict";
const VFS = require("./vfs.js");
module.exports = { pathToFileURL: (p) => ({ href: VFS.objectURL(p), toString() { return this.href; } }), URL: globalThis.URL };
