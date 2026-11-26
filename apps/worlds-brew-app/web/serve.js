#!/usr/bin/env node
"use strict";
// Serves web/dist on http://localhost:<port> (default 8787) for local testing.
const http = require("http"), fs = require("fs"), path = require("path");
const ROOT = path.join(__dirname, "dist"), PORT = +(process.argv[2] || process.env.PORT || 8787);
const TYPES = { ".html": "text/html", ".js": "text/javascript", ".css": "text/css", ".png": "image/png", ".map": "application/json", ".json": "application/json" };
const server = http.createServer((req, res) => {
  const p = path.join(ROOT, decodeURIComponent(req.url.split("?")[0]).replace(/\.\.+/g, "")), f = fs.existsSync(p) && fs.statSync(p).isDirectory() ? path.join(p, "index.html") : p;
  if (!fs.existsSync(f)) { res.writeHead(404); return res.end("not found"); }
  res.writeHead(200, { "content-type": TYPES[path.extname(f)] || "application/octet-stream" }); fs.createReadStream(f).pipe(res);
});
if (require.main === module) server.listen(PORT, () => console.log("Pixel Scape web: http://localhost:" + PORT));
module.exports = { server };
