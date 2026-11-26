import test from 'node:test';
import assert from 'node:assert';
import { KW, castLine, hexFromBits, focus } from '../src/modules/iching/engine.js';
import { HEXAGRAMS } from '../src/modules/iching/hexagrams.js';
import { buildReading, command, run } from '../src/modules/iching/index.js';

const seeded = s => () => (s = (s * 16807) % 2147483647) / 2147483647;

test('King Wen table covers all 64 hexagrams once', () => {
  const nums = Object.values(KW).flatMap(r => Object.values(r));
  assert.strictEqual(new Set(nums).size, 64);
  assert.strictEqual(hexFromBits('111111').number, 1);
  assert.strictEqual(hexFromBits('000000').number, 2);
  assert.strictEqual(hexFromBits('101010').number, 63);
  assert.strictEqual(hexFromBits('010101').number, 64);
  assert.strictEqual(hexFromBits('100010').number, 3);
});

test('data has 64 complete hexagrams in order', () => {
  assert.strictEqual(HEXAGRAMS.length, 64);
  HEXAGRAMS.forEach((h, i) => { assert.strictEqual(h.n, i + 1); assert.strictEqual(h.l.length, 6); assert.ok(h.j && h.i && h.a && h.kw.length); });
  assert.ok(HEXAGRAMS[0].all && HEXAGRAMS[1].all);
});

test('three-coin odds: 6 and 9 at 1/8, 7 and 8 at 3/8', () => {
  const c = { 6: 0, 7: 0, 8: 0, 9: 0 }, r = seeded(5), N = 80000;
  for (let i = 0; i < N; i++) c[castLine(r).value]++;
  for (const [v, p] of [[6, 1 / 8], [7, 3 / 8], [8, 3 / 8], [9, 1 / 8]]) assert.ok(Math.abs(c[v] / N - p) < 0.01, `${v}: ${c[v] / N}`);
});

test('focus rules by number of changing lines', () => {
  assert.deepStrictEqual(focus([7, 7, 7, 7, 7, 7], 1).primary, ['judgment']);
  assert.deepStrictEqual(focus([7, 9, 7, 7, 7, 7], 1).primary, ['line2']);
  assert.deepStrictEqual(focus([9, 7, 6, 7, 7, 7], 1).primary, ['line3', 'line1']);
  assert.deepStrictEqual(focus([9, 9, 9, 9, 7, 8], 5).relating, ['line5', 'line6']);
  assert.deepStrictEqual(focus([9, 9, 9, 9, 9, 9], 1).primary, ['allChange']);
});

test('relating hexagram flips only changing lines; embed fits Discord limits', () => {
  for (let s = 1; s < 300; s++) {
    const { reading: r, embed } = buildReading('q', seeded(s));
    if (r.changing.length) {
      const flipped = r.values.map(v => (v === 9 ? '0' : v === 6 ? '1' : v === 7 ? '1' : '0')).join('');
      assert.strictEqual(r.relating.bits, flipped);
    } else assert.strictEqual(r.relating, null);
    assert.ok(JSON.stringify(embed).length < 6000);
    assert.ok(embed.fields.length <= 25 && embed.fields.every(f => f.value.length <= 1024 && f.name.length <= 256));
  }
});

test('run returns embed + PNG attachment', async () => {
  assert.strictEqual(command.name, 'iching');
  const res = await run({ question: 'test' }, { rand: seeded(9) });
  assert.strictEqual(res.files[0].name, 'iching.png');
  assert.deepStrictEqual([...res.files[0].data.slice(0, 4)], [0x89, 0x50, 0x4e, 0x47]);
  assert.strictEqual(res.embeds[0].image.url, 'attachment://iching.png');
});
