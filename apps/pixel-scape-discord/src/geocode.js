// Place name -> { lat, lon, name } using OpenStreetMap Nominatim (1 request/s policy; we send 1 per job).
"use strict";
const { parseCoords } = require("./geo");
async function geocode(q) {
  const c = parseCoords(q); if (c) return c;
  const r = await fetch("https://nominatim.openstreetmap.org/search?format=jsonv2&limit=1&q=" + encodeURIComponent(q), { headers: { "user-agent": "PixelScapeBot/1.0 (Discord terrain bot)", "accept-language": "en" } });
  if (!r.ok) throw new Error("Place lookup failed (HTTP " + r.status + ").");
  const j = await r.json(); if (!j.length) throw new Error(`Couldn't find "${q}". Try a bigger place name or lat,lon.`);
  return { lat: +j[0].lat, lon: +j[0].lon, name: j[0].name || q, full: j[0].display_name };
}
module.exports = { geocode };
