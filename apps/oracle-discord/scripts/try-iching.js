// Local preview: node scripts/try-iching.js "question" [outdir] [seed]
import { writeFileSync } from 'node:fs';
import { run } from '../src/modules/iching/index.js';
const [q = 'What should I focus on this week?', out = '.', seed] = process.argv.slice(2);
let s = Number(seed) || 0; const rand = seed ? () => (s = (s * 16807) % 2147483647) / 2147483647 : undefined;
const res = await run({ question: q }, { rand });
writeFileSync(`${out}/iching.png`, res.files[0].data);
writeFileSync(`${out}/iching-embed.json`, JSON.stringify(res.embeds, null, 2));
const len = JSON.stringify(res.embeds[0]).length; console.log('embed chars', len, 'fields', res.embeds[0].fields.length);
