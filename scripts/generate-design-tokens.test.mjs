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
    const rootBlock = content.split('@media')[0];
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
