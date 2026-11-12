import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

import { artifacts, run } from './generate-design-tokens.mjs';
import { variablesPayload } from './lib/tokens/build.mjs';
import { TOKEN_LADDER } from './lib/tokens/plan.mjs';
import { tokenDeclarationPattern } from '../design-system/src/lib/tokens.mjs';

test('the committed token ladder files match the plan', () => {
  assert.deepEqual(run(), []);
});

test('drift: a missing or hand-edited file is a finding, and --check writes nothing', () => {
  const root = mkdtempSync(join(tmpdir(), 'design-tokens-'));
  try {
    assert.equal(run({ repoRoot: root }).length, artifacts().length);
    for (const { path, content } of artifacts()) {
      mkdirSync(join(root, path, '..'), { recursive: true });
      writeFileSync(join(root, path), content);
    }
    assert.deepEqual(run({ repoRoot: root }), []);
    const [first] = artifacts();
    writeFileSync(join(root, first.path), `${first.content}/* edited */\n`);
    assert.deepEqual(run({ repoRoot: root }).map((f) => f.file), [first.path]);
  } finally {
    rmSync(root, { recursive: true, force: true });
  }
});

test('no ladder token is declared twice', () => {
  const names = new Set();
  for (const { path, content } of artifacts().filter(({ path }) => path.endsWith('.scss'))) {
    const rootBlock = content.split('@media')[0].split('[data-motion')[0];
    for (const [, name] of rootBlock.matchAll(tokenDeclarationPattern())) {
      assert.ok(!names.has(name), `${name} is declared twice (again in ${path})`);
      names.add(name);
    }
  }
  assert.ok(names.size > 0);
});

test('motion durations are zeroed under reduced motion, exactly the set declared at :root', () => {
  const { content: motion } = artifacts().find(({ path }) => path.endsWith('_motion.scss'));
  const [rootBlock, reducedBlock] = motion.split('@media (prefers-reduced-motion: reduce)');
  const rootDurations = [...rootBlock.matchAll(/--motion-duration-[a-z]+(?=:)/g)].map((m) => m[0]);
  const reducedDurations = [...reducedBlock.matchAll(/--motion-duration-[a-z]+(?=:)/g)].map((m) => m[0]);
  assert.ok(rootDurations.length > 0);
  assert.deepEqual([...reducedDurations].sort(), [...rootDurations].sort());
  assert.match(reducedBlock, /0ms/);
});

test('the payload has exactly the collections the ladder names, motion among them', () => {
  assert.deepEqual(
    variablesPayload().collections.map((c) => c.name),
    ['spacing / semantics', 'spacing / patterns', 'spacing / components', 'layers', 'motion'],
  );
});

test('no collection, Figma variable or code name carries the spec name, "roles" or "element"', () => {
  const banned = /deep|roles|element/i;
  const { collections } = variablesPayload();
  for (const { name, variables } of collections) {
    assert.doesNotMatch(name, banned, `collection ${name}`);
    for (const { name: variable, codeSyntax } of variables) {
      assert.doesNotMatch(variable, banned, `variable ${variable} in ${name}`);
      assert.doesNotMatch(codeSyntax.WEB, banned, `code name ${codeSyntax.WEB} in ${name}`);
    }
  }
  for (const { path, content } of artifacts().filter(({ path }) => path.endsWith('.scss'))) {
    assert.doesNotMatch(path, /deep|roles/i, path);
    for (const [, name] of content.matchAll(tokenDeclarationPattern())) assert.doesNotMatch(name, banned, `${name} in ${path}`);
  }
});

test('a COLOR row is typed COLOR and a code-only row stays out of the payload', () => {
  const variables = variablesPayload().collections.flatMap((c) => c.variables);
  assert.equal(variables.find((v) => v.name === 'Blanket/fill')?.resolvedType, 'COLOR');
  assert.equal(variables.find((v) => v.name === 'Blanket/max-height-modal'), undefined);
  for (const row of TOKEN_LADDER.filter((r) => r.codeOnly)) {
    assert.equal(variables.find((v) => v.codeSyntax.WEB === `var(${row.new})`), undefined, `${row.new} is code only`);
  }
});

test('a Figma variable is FLOAT unless its value is a color or a string', () => {
  const variables = variablesPayload().collections.flatMap((c) => c.variables);
  assert.ok(variables.every((v) => ['FLOAT', 'COLOR', 'STRING'].includes(v.resolvedType)));
  for (const row of TOKEN_LADDER.filter((r) => /^(rgba?|#)/.test(r.ref ?? ''))) {
    assert.equal(row.type, 'COLOR', `${row.new} holds a color`);
  }
});

test('the primitive-named radius still reaches the payload and is not declared twice', () => {
  const variables = variablesPayload().collections.flatMap((c) => c.variables);
  assert.ok(variables.find((v) => v.name === 'Radius/full'), 'Radius/full is in the payload');
  const declarations = artifacts()
    .filter(({ path }) => path.endsWith('.scss'))
    .flatMap(({ content }) => [...content.matchAll(tokenDeclarationPattern())].map(([, name]) => name));
  assert.equal(declarations.filter((name) => name === '--radius-full').length, 0);
});

test('every ladder row owns a value', () => {
  for (const row of TOKEN_LADDER.filter((r) => r.old !== r.new)) {
    assert.ok(row.ref ?? row.value, `${row.new} has no ref or value`);
  }
});

/* ─── Motion springs (ADR-041) ─────────────────────────────────────────────── */

const springs = () => artifacts().find(({ path }) => path.endsWith('ladder/_springs.scss')).content;

/** Every `--name: value;` in a CSS block, in order. */
const declarations = (css) => new Map([...css.matchAll(/(--[a-z0-9-]+):\s*([^;]+);/g)].map(([, name, value]) => [name, value.trim()]));

/** The :root block, the expressive container block and the reduced-motion block of the springs file. */
function blocks() {
  const css = springs();
  const [beforeReduced, reduced] = css.split('@media (prefers-reduced-motion: reduce)');
  const [root, expressive] = beforeReduced.split("\n[data-motion='expressive']");
  return { root: declarations(root), expressive: declarations(expressive), reduced: declarations(reduced) };
}

/** Resolve a token through `var()` references, in a stack of blocks (later wins). */
function resolve(name, ...stack) {
  const table = new Map(stack.flatMap((m) => [...m]));
  let value = table.get(name);
  assert.ok(value !== undefined, `${name} is not declared`);
  for (let i = 0; i < 6 && /^var\(/.test(value); i++) value = table.get(value.match(/var\((--[a-z0-9-]+)\)/)[1]);
  return value;
}

/** Read a generated linear() easing at a fraction of its duration. */
function easingAt(easing, x) {
  const stops = easing.match(/^linear\((.*)\)$/)[1].split(',').map((s) => s.trim().split(/\s+/));
  const pts = stops.map(([y, pos], i) => ({ y: Number(y), x: pos ? parseFloat(pos) / 100 : i === 0 ? 0 : 1 }));
  const j = pts.findIndex((p) => p.x >= x);
  if (j <= 0) return pts[0].y;
  const [a, b] = [pts[j - 1], pts[j]];
  return a.y + ((b.y - a.y) * (x - a.x)) / (b.x - a.x);
}
const ms = (v) => parseFloat(v.replace('ms', ''));

/** [token, mode, 90% ms, settled ms, overshoot] straight from the motion table. */
const TABLE = [
  ['spatial-fast', 'productive', 131, 224, 0],
  ['spatial-fast', 'expressive', 83, 221, 0.095],
  ['spatial-default', 'productive', 185, 317, 0],
  ['spatial-default', 'expressive', 153, 325, 0.015],
  ['spatial-slow', 'productive', 282, 482, 0],
  ['spatial-slow', 'expressive', 211, 448, 0.015],
  ['appearance-fast', 'productive', 63, 108, 0],
  ['appearance-default', 'productive', 97, 166, 0],
  ['appearance-slow', 'productive', 138, 235, 0],
];

for (const [token, mode, t90, settle, overshoot] of TABLE) {
  test(`${token} in ${mode}: 90% at ${t90} ms, settled at ${settle} ms, overshoot ${overshoot * 100}%`, () => {
    const { root, expressive } = blocks();
    const stack = mode === 'expressive' ? [root, expressive] : [root];
    const easing = resolve(`--ds-motion-${token}`, ...stack);
    const duration = ms(resolve(`--ds-motion-${token}-duration`, ...stack));
    assert.ok(Math.abs(duration - settle) <= 10, `settles at ${duration} ms, want ${settle}`);
    let reached = null;
    let peak = 0;
    for (let x = 0; x <= 1; x += 0.0005) {
      const y = easingAt(easing, x);
      if (reached === null && y >= 0.9) reached = x * duration;
      peak = Math.max(peak, y);
    }
    assert.ok(Math.abs(reached - t90) <= 10, `90% at ${reached} ms, want ${t90}`);
    assert.ok(Math.abs(peak - 1 - overshoot) <= 0.006, `overshoot ${peak - 1}, want ${overshoot}`);
  });
}

test('each easing carries at most 40 points', () => {
  for (const value of [...blocks().root.values()].filter((v) => v.startsWith('linear('))) {
    assert.ok(value.split(',').length <= 40, value);
  }
});

test('spatial.exit is stiffness 25 aimed 3.8x past the edge and reaches it in about 200 ms', () => {
  const { root } = blocks();
  const easing = resolve('--ds-motion-spatial-exit', root);
  assert.ok(Math.abs(ms(resolve('--ds-motion-spatial-exit-duration', root)) - 200) <= 10);
  assert.ok(Math.abs(easingAt(easing, 1) - 1) < 0.01, 'ends on the edge');
  const speedEnd = (easingAt(easing, 1) - easingAt(easing, 0.95)) / 0.05;
  const speedStart = (easingAt(easing, 0.05) - easingAt(easing, 0)) / 0.05;
  assert.ok(speedEnd > speedStart * 5, 'still speeding up at the edge');
});

test('motion.loop is a sine half cycle over 600 ms, alternating', () => {
  const { root } = blocks();
  assert.equal(ms(resolve('--ds-motion-loop-duration', root)), 600);
  const easing = resolve('--ds-motion-loop', root);
  assert.ok(Math.abs(easingAt(easing, 0.5) - 0.5) < 0.01);
  assert.equal(resolve('--ds-motion-linear', root), 'linear');
});

test('Expressive re-declares the semantics that differ, and only semantics', () => {
  const { expressive } = blocks();
  const names = [...expressive.keys()];
  assert.deepEqual(
    names.filter((n) => !n.endsWith('-duration')).sort(),
    ['--ds-motion-spatial-default', '--ds-motion-spatial-fast', '--ds-motion-spatial-slow'],
  );
  assert.ok(names.every((n) => n.startsWith('--ds-motion-')), 'no primitive is re-declared');
});

test('Reduced turns every spatial semantic into the appearance.fast fade, never 0 ms', () => {
  const { root, reduced } = blocks();
  const fade = resolve('--ds-motion-appearance-fast', root);
  const fadeMs = ms(resolve('--ds-motion-appearance-fast-duration', root));
  assert.ok(fadeMs > 0);
  for (const name of ['fast', 'default', 'slow', 'exit']) {
    assert.equal(resolve(`--ds-motion-spatial-${name}`, root, reduced), fade, name);
    assert.equal(ms(resolve(`--ds-motion-spatial-${name}-duration`, root, reduced)), fadeMs, name);
  }
  assert.ok(![...reduced.values()].some((v) => /^0(ms)?$/.test(v)), 'no cut');
});

test('Reduced wins inside an Expressive container', () => {
  const reducedBlock = springs().split('@media (prefers-reduced-motion: reduce)')[1];
  assert.match(reducedBlock, /:root,\s*\[data-motion='expressive'\]/);
});

test('every primitive is a named spring: stiffness, ratio appended only when it is not 1', () => {
  const names = [...blocks().root.keys()].filter((n) => /^--motion-spring-[0-9a-r-]+$/.test(n));
  const springNames = names.filter((n) => !n.endsWith('-duration')).map((n) => n.replace('--motion-spring-', ''));
  assert.deepEqual(
    springNames.sort(),
    ['190', '200-r80', '25', '27-r0', '380-r80', '3800', '440', '800', '800-r60', '880', '1600'].sort(),
  );
});

test('a JS spring config per token comes from the same table', async () => {
  const { content } = artifacts().find(({ path }) => path.endsWith('ladder/springs.generated.js'));
  const mod = await import(`data:text/javascript,${encodeURIComponent(content)}`);
  assert.deepEqual(mod.SPRINGS['spatial.default'].productive, { type: 'spring', stiffness: 440, damping: 41.95, mass: 1 });
  assert.deepEqual(mod.SPRINGS['spatial.default'].reduced, mod.SPRINGS['appearance.fast'].productive);
  assert.equal(mod.SPRINGS['spatial.fast'].expressive.stiffness, 800);
  assert.equal(mod.SPRINGS['spatial.fast'].expressive.damping, 33.94);
});

test('the springs add no variable to the Figma payload', () => {
  const payload = JSON.stringify(variablesPayload());
  assert.doesNotMatch(payload, /spring|spatial|appearance/);
});

test('the old motion duration and easing tokens are untouched', () => {
  const { content } = artifacts().find(({ path }) => path.endsWith('ladder/_motion.scss'));
  assert.match(content, /--motion-duration-short: 100ms/);
  assert.match(content, /--motion-easing-standard: cubic-bezier/);
});
