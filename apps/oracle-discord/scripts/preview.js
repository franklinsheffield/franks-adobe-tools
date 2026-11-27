// Local preview for any module: node scripts/preview.js numerology '{"name":"Ada Lovelace","date":"1815-12-10","show_name":true}'
// Writes out/<file>.png and out/<module>.json.
import fs from "node:fs";
const [mod, json = "{}"] = process.argv.slice(2);
const m = await import(`../src/modules/${mod}/index.js`);
const ctx = { user: "preview", ...JSON.parse(process.argv[4] || "{}") };
const r = await m.run(JSON.parse(json), ctx);
fs.mkdirSync("out", { recursive: true });
for (const f of r.files || []) fs.writeFileSync("out/" + f.name, f.data);
fs.writeFileSync(`out/${mod}.json`, JSON.stringify(r.embeds, null, 2));
const chars = r.embeds.map((e) => JSON.stringify([e.title, e.description, (e.fields || []).map((f) => [f.name, f.value]), e.footer?.text]).length);
console.log(`${r.embeds.length} embeds, chars ${chars.join("/")}, files: ${(r.files || []).map((f) => f.name + " " + f.data.length + " B").join(", ")}`);
