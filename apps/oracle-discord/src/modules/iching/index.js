// /iching: six sun/moon coins, one per line, cast with the classic three-coin odds.
import { read, TRIGRAMS } from './engine.js';
import { HEXAGRAMS } from './hexagrams.js';
import { renderPng } from './render.js';
import { analyse } from './insight.js';

export const command = {
  name: 'iching',
  description: 'Flip six Science is Magic coins and receive an I Ching reading',
  options: [{ type: 3, name: 'question', description: 'What you want to explore (optional)', required: false, max_length: 200 }],
};

const GOLD = 0xE2B04A, TEAL = 0x66E0C8;
const cut = (s, n = 1024) => (s.length > n ? s.slice(0, n - 1) + '…' : s);
const title = h => `${h.number} · ${h.text.hz} ${h.text.py} · ${h.text.en}`;
const lineName = (v, i) => `${v === 9 ? 'Nine' : 'Six'} in the ${['first', 'second', 'third', 'fourth', 'fifth', 'top'][i]} place`;

function textFor(key, hex) {
  if (key === 'judgment') return hex.text.j;
  if (key === 'allChange') return hex.text.all;
  return hex.text.l[Number(key.slice(4)) - 1];
}

export function buildReading(question, rand) {
  const r = read(question, HEXAGRAMS, rand);
  const { primary: p, relating: rel, nuclear: nu, values, focus } = r;
  const up = TRIGRAMS[p.upper], lo = TRIGRAMS[p.lower];
  const fields = [
    { name: '☯ The situation', value: cut(p.text.j) },
    { name: '🜁 The image', value: cut(`*${p.text.i}*`) },
    { name: '☰ The trigrams', value: cut(`**Above:** ${up.hz} ${up.name} (${up.py}): ${up.quality}.\n**Below:** ${lo.hz} ${lo.name} (${lo.py}): ${lo.quality}.\n**Keywords:** ${p.text.kw.join(', ')}`) },
  ];
  if (r.changing.length) {
    fields.push({ name: `✦ Changing lines (${r.changing.length})`, value: cut(r.changing.map(n => `**${lineName(values[n - 1], n - 1)}:** ${p.text.l[n - 1]}`).join('\n')) });
  }
  const core = [
    ...focus.primary.map(k => `> ${textFor(k, p)}`),
    ...focus.relating.map(k => `> ${textFor(k, rel)}${k.startsWith('line') ? ` *(${rel.text.en}, line ${k.slice(4)})*` : ''}`),
  ];
  fields.push({ name: '🔮 Core message', value: cut(`${focus.rule}\n${core.join('\n')}`) });
  if (rel) fields.push({ name: `➜ Where it is heading: ${title(rel)}`, value: cut(`${rel.text.j}\n**Keywords:** ${rel.text.kw.join(', ')}`) });
  fields.push({ name: `🜃 Hidden undercurrent: ${title(nu)}`, value: cut(`Beneath the surface: ${nu.text.kw.join(', ')}. ${nu.text.a}`) });
  fields.push({ name: '🕯 What the text counsels', value: cut(`*The classical counsel attached to ${rel ? 'these hexagrams' : 'this hexagram'}, as the tradition gives it:* ${rel ? `${p.text.a} Then: ${rel.text.a.charAt(0).toLowerCase()}${rel.text.a.slice(1)}` : p.text.a}`) });

  const embed = {
    title: `🪙 I Ching · ${title(p)}`,
    description: question ? `**Question:** ${cut(question, 200)}` : '*An open reading.*',
    color: rel ? TEAL : GOLD,
    image: { url: 'attachment://iching.png' },
    fields,
    footer: { text: 'Science is Magic · for reflection, not prediction' },
  };
  return { reading: r, embed };
}

export async function run(options = {}, ctx = {}) {
  const question = options.question?.trim() || '';
  const { reading, embed } = buildReading(question, ctx.rand);
  const ins = analyse(reading, TRIGRAMS, ctx.user ? `@${ctx.user}` : '');
  const p = reading.primary, rel = reading.relating;
  return { embeds: [embed, ins.embed], files: [{ name: 'iching.png', data: new Uint8Array(renderPng(reading)) }], analysis: ins.analysis,
    headline: `${p.number} ${p.text.en}${rel ? ` changing to ${rel.number} ${rel.text.en}` : ''}` };
}
