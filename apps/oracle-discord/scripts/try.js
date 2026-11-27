// Local preview: node scripts/try.js humandesign 1990-04-09 "14:30" "Phoenix, USA"  -> out/<name>.png + out/<name>.json
import fs from "node:fs";
const [mod, date, time, ...place] = process.argv.slice(2);
const m = await import(`../src/modules/${mod}/index.js`);
const r = await m.run({ date, time, place: place.join(" "), show_birth_details: true }, { user: "preview" });
fs.mkdirSync("out", { recursive: true });
for (const f of r.files) fs.writeFileSync("out/" + f.name, f.data);
fs.writeFileSync("out/embeds.json", JSON.stringify(r.embeds, null, 2));
const chars = r.embeds.reduce((n, e) => n + JSON.stringify([e.title, e.description, e.fields, e.footer]).length, 0);
console.log(`${r.embeds.length} embeds, ~${chars} chars, files: ${r.files.map((f) => f.name + " " + f.data.length + " B").join(", ")}`);
