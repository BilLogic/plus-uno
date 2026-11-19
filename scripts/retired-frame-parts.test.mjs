// The Frame has no top bar and no focused type. This sweep keeps both words out of every
// live doc and source file; history (decisions, plans, archives, Figma measurements) keeps them.
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const REPO_ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const RETIRED = /(?<![a-z])top[ _-]?bar|focused[ _-](view|frame|type|page)|frame-focused|focusedFrame/i;

const SELF = 'scripts/retired-frame-parts.test.mjs';

const ROOTS = ['design-system', 'docs', 'scripts', 'agents', 'GLOSSARY.md'];

/** Left as written: records of what was decided or measured, and pages another change owns. */
const HISTORY = [
  'docs/adr/',
  'docs/plans/',
  'docs/evals/',
  'docs/knowledge/archive/',
  'scripts/figma-component-snapshot.json',
  'scripts/baselines/figma-node-types.json',
  'design-system/figma/node-types.json',
  'design-system/figma/registry-audit.md',
  'design-system/src/styles/Grid.mdx',
  'design-system/agent-views/foundations/Grid.md',
  'design-system/agent-views/ds-index.json', // embeds the Grid guide until its rewrite regenerates it
  'docs/knowledge/figma-clipping-audit-2026-11-12.md',
];

const trackedFiles = () =>
  execFileSync('git', ['ls-files', '-z', '--', ...ROOTS], { cwd: REPO_ROOT, maxBuffer: 1 << 28 })
    .toString()
    .split('\0')
    .filter(Boolean)
    .filter((f) => !HISTORY.some((h) => f === h || (h.endsWith('/') && f.startsWith(h))))
    .filter((f) => f !== SELF)
    .filter((f) => !/\.(png|jpe?g|webp|svg|woff2?|mp3|wav|ogg|ico|gif)$/i.test(f));

test('no live doc or source file names a top bar or the Frame focused type', () => {
  const hits = [];
  for (const file of trackedFiles()) {
    const full = path.join(REPO_ROOT, file);
    if (!fs.existsSync(full)) continue;
    fs.readFileSync(full, 'utf8').split('\n').forEach((line, i) => {
      if (RETIRED.test(line)) hits.push(`${file}:${i + 1}`);
    });
  }
  assert.deepEqual(hits, [], `retired Frame parts are back:\n${hits.join('\n')}`);
});

test('the pattern catches each retired shape', () => {
  for (const s of ['the top bar', 'Topbar', 'plus-frame__topbar', 'Frame focused type', 'focused view', 'frame-focused', 'focused-page-pad-x', 'focusedFrame']) {
    assert.match(s, RETIRED, s);
  }
  for (const s of ['focused search', 'border-focused', 'a view bar', 'desktop bar']) assert.doesNotMatch(s, RETIRED, s);
});

test('every exemption still names a file or folder that exists and still earns its place', () => {
  for (const h of HISTORY) {
    const full = path.join(REPO_ROOT, h);
    assert.ok(fs.existsSync(full), `${h} is exempt but does not exist`);
    if (h.endsWith('/')) continue;
    assert.match(fs.readFileSync(full, 'utf8'), RETIRED, `${h} no longer needs its exemption`);
  }
});
