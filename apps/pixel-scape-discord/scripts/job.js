// GitHub Actions render job: build terrain for one /terrain request and post it to Discord.
// Env: TOKEN, PLACE, SIZE, VIEW, FORMAT, RELIEF, USER, DISCORD_APP_ID [, MAX_UPLOAD_MB=10, DRY_RUN=dir]
"use strict";
const fs = require("fs"), path = require("path");
const { geocode } = require("../src/geocode");
const { buildTerrain } = require("../src/terrain");
const { Renderer } = require("../src/render");
const E = process.env, LIMIT = (+(E.MAX_UPLOAD_MB || 10)) * 1e6 * 0.97;
const slug = (s) => String(s).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "").slice(0, 40) || "terrain";

async function post(payload, files) {
  if (E.DRY_RUN) { fs.mkdirSync(E.DRY_RUN, { recursive: true }); for (const f of files) fs.writeFileSync(path.join(E.DRY_RUN, f.name), f.data); fs.writeFileSync(path.join(E.DRY_RUN, "message.json"), JSON.stringify(payload, null, 1)); return; }
  const fd = new FormData();
  payload.attachments = files.map((f, i) => ({ id: i, filename: f.name }));
  fd.append("payload_json", JSON.stringify(payload));
  files.forEach((f, i) => fd.append(`files[${i}]`, new Blob([f.data], { type: f.type }), f.name));
  const r = await fetch(`https://discord.com/api/v10/webhooks/${E.DISCORD_APP_ID}/${E.TOKEN}/messages/@original`, { method: "PATCH", body: fd });
  if (!r.ok) throw new Error("Discord HTTP " + r.status + " " + (await r.text()).slice(0, 300));
}

(async () => {
  const t0 = Date.now(), size = Math.max(1, Math.min(40, +E.SIZE || 10)), fmt = E.FORMAT || "both";
  let place;
  try {
    place = await geocode(E.PLACE || "");
    let r = await buildTerrain({ lat: place.lat, lon: place.lon, sizeKm: size, name: place.name, log: console.log });
    if (fmt !== "image" && r.glb.length > LIMIT) { console.log("glb too big, retrying with a 1024 px texture"); r = await buildTerrain({ lat: place.lat, lon: place.lon, sizeKm: size, name: place.name, tex: 1024, quality: 85 }); }
    const info = Object.assign({}, r.info, { label: place.name });
    const files = [], base = "pixel-scape-" + slug(place.name);
    if (fmt !== "glb") {
      const rd = new Renderer();
      try { files.push({ name: base + ".png", type: "image/png", data: await rd.render(r.glb, info, { view: E.VIEW || "oblique", exaggeration: E.RELIEF && E.RELIEF !== "auto" ? +E.RELIEF : undefined }) }); }
      finally { await rd.close(); }
    }
    if (fmt !== "image") {
      if (r.glb.length <= LIMIT) files.push({ name: base + ".glb", type: "model/gltf-binary", data: r.glb });
      else console.log("glb still over the upload limit; image only");
    }
    const sat = info.scenes.length ? `Sentinel-2 ${info.scenes.map((s) => s.date).join(", ")}` : "no clear satellite scene, elevation colours";
    const secs = Math.round((Date.now() - t0) / 1000);
    const lines = [
      `**${place.name}** for ${E.USER || "you"}: ${(info.widthM / 1000).toFixed(1)} × ${(info.depthM / 1000).toFixed(1)} km, ${info.minElevationM} to ${info.maxElevationM} m`,
      `-# ${place.lat.toFixed(4)}, ${place.lon.toFixed(4)} · ${sat} · AWS Terrain Tiles · built in ${secs} s` + (files.some((f) => f.name.endsWith(".glb")) ? " · .glb opens in Pixel Scape, Blender and most 3D apps" : ""),
    ];
    await post({ content: lines.join("\n") }, files);
    console.log("posted", files.map((f) => f.name + " " + (f.data.length / 1e6).toFixed(2) + " MB").join(", "));
  } catch (e) {
    console.error(e);
    await post({ content: `Couldn't build **${E.PLACE}**: ${String(e.message || e).slice(0, 300)}` }, []).catch((x) => console.error(x));
    process.exitCode = 1;
  }
})();
