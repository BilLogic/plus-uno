/**
 * Tests for the registry-vs-measurement comparison.
 *
 * #191's rule: a guard nobody has watched fail is a guard nobody knows works.
 * Each case below is one of the five ways the two files can disagree, and the
 * first one is the defect this pass actually found — seven entries whose node
 * is not a component set, in a field called `componentSetNodeId`, with nothing
 * in the repo reading the flag that would have said so.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { failures, mappings } from './figma-node-types.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const read = (p) => JSON.parse(fs.readFileSync(path.join(REPO_ROOT, p), 'utf8'));
const REGISTRY = () => read('design-system/figma/component-registry.json');
const RECORDING = () => read('design-system/figma/node-types.json');

const registryOf = (sets) => ({
  figmaFile: { fileKey: 'FILE' },
  components: { Widget: { figma: { fileKey: 'FILE', sets } } },
});

test('the tree as it stands agrees with the measurement', () => {
  assert.deepEqual(failures(REGISTRY(), RECORDING()), []);
});

test('a missing flag defaults to the claim the field name makes', () => {
  const [only] = mappings(registryOf([{ name: 'W', componentSetNodeId: '1:1' }]));
  assert.equal(only.claimsSet, true, '`componentSetNodeId` with no flag asserts a set');
});

test('the seven-entry defect: a COMPONENT in a componentSetNodeId field fails', () => {
  const found = failures(
    registryOf([{ name: 'W', componentSetNodeId: '1:1' }]),
    { nodes: { '1:1': { file: 'FILE', type: 'COMPONENT' } } },
  );
  assert.equal(found.length, 1);
  assert.match(found[0], /the node is a COMPONENT\. Add "isComponentSet": false/);
});

test('the flag is checked in both directions', () => {
  const found = failures(
    registryOf([{ name: 'W', componentSetNodeId: '1:1', isComponentSet: false }]),
    { nodes: { '1:1': { file: 'FILE', type: 'COMPONENT_SET' } } },
  );
  assert.equal(found.length, 1);
  assert.match(found[0], /IS a COMPONENT_SET\. Remove the flag/);
});

test('a mapping nobody measured is a finding, not a pass by default', () => {
  const found = failures(registryOf([{ name: 'W', componentSetNodeId: '9:9' }]), { nodes: {} });
  assert.equal(found.length, 1);
  assert.match(found[0], /no recorded node type/);
});

test('a link that opens on nothing is a finding — four of these shipped as verified', () => {
  const found = failures(
    registryOf([{ name: 'W', componentSetNodeId: '1:1' }]),
    { nodes: { '1:1': { file: 'FILE', type: 'MISSING' } } },
  );
  assert.equal(found.length, 1);
  assert.match(found[0], /MISSING/);
});

test('the file the id was read in is compared — the audit got this wrong once', () => {
  const found = failures(
    registryOf([{ name: 'W', componentSetNodeId: '1:1' }]),
    { nodes: { '1:1': { file: 'OTHER', type: 'COMPONENT_SET' } } },
  );
  assert.equal(found.length, 1);
  assert.match(found[0], /recorded against file OTHER/);
});

test('a recording for something no longer mapped is stale, and says so', () => {
  const found = failures(
    registryOf([{ name: 'W', componentSetNodeId: '1:1' }]),
    { nodes: { '1:1': { file: 'FILE', type: 'COMPONENT_SET' }, '2:2': { file: 'FILE', type: 'COMPONENT' } } },
  );
  assert.equal(found.length, 1);
  assert.match(found[0], /^2:2: recorded, but no registry entry maps it/);
});

test('patterns are mapped too, not only components', () => {
  const found = mappings({
    figmaFile: { fileKey: 'FILE' },
    patterns: { 'Pattern/Card': { componentSetNodeId: '3:3' } },
  });
  assert.deepEqual(found.map((m) => m.component), ['pattern:Pattern/Card']);
  assert.equal(found[0].fileKey, 'FILE');
});

test('the recording covers every mapped id, in both Figma files', () => {
  const recording = RECORDING();
  const files = new Set(Object.values(recording.nodes).map((n) => n.file));
  assert.equal(files.size, 2, 'the registry spans two files and both must be represented');
  for (const m of mappings(REGISTRY())) {
    assert.ok(recording.nodes[m.nodeId], `${m.nodeId} (${m.component}) has no recorded type`);
  }
});
