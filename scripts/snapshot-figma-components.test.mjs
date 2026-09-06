/**
 * Tests for `npm run snapshot:figma-components`.
 *
 * This script writes the file `poll-figma-library.js` diffs, so the thing worth
 * testing is that it writes the SAME population the poller does. A snapshot
 * built from a slightly different set of rows is not a stale snapshot — it is a
 * snapshot that reports every difference as a change, once, loudly, into Notion
 * and Slack.
 *
 * The network is never touched here; the REST shapes are fixtures.
 *
 * Run: npm run test:scripts
 */

import { test } from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_FILE_KEY,
  MISSING_TOKEN,
  diff,
  isIgnored,
  rowsFrom,
  setsIn,
  snapshotFrom,
  versionsFrom, fetchNodeHashes } from './snapshot-figma-components.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');

const componentsResponse = {
  meta: {
    components: [
      {
        key: 'k1',
        name: 'direction=top',
        description: 'a tooltip',
        node_id: '42:6019',
        containing_frame: { name: 'Tooltip' },
      },
      { key: 'k2', name: 'size=lg', description: '', node_id: '1:2', containing_frame: { name: 'Badge' } },
      // Dropped by the shared ignore list, exactly as the poller drops them.
      { key: 'k3', name: '_Tooltip Arrow', description: '', node_id: '1:3', containing_frame: { name: 'Tooltip' } },
      { key: 'k4', name: 'grid', description: '', node_id: '1:4', containing_frame: { name: 'layout-blocks/x' } },
      { key: 'k5', name: 'Spacing Token Guidelines', description: '', node_id: '1:5', containing_frame: { name: 'Docs' } },
    ],
  },
};

test('rows carry the five fields the snapshot has always held', () => {
  const rows = rowsFrom(componentsResponse);
  assert.deepEqual(rows[0], {
    key: 'k1',
    name: 'direction=top',
    description: 'a tooltip',
    nodeId: '42:6019',
    containingFrame: 'Tooltip',
  });
});

test('the ignore list is the poller’s, so the two writers agree on the population', () => {
  const rows = rowsFrom(componentsResponse);
  assert.deepEqual(rows.map((r) => r.key), ['k1', 'k2']);
  assert.equal(isIgnored({ name: '_Tooltip Arrow', containingFrame: 'Tooltip' }), true);
  assert.equal(isIgnored({ name: 'x', containingFrame: 'layout-blocks/y' }), true);
  assert.equal(isIgnored({ name: 'Spacing Token Guidelines', containingFrame: 'Docs' }), true);
  assert.equal(isIgnored({ name: 'draft', containingFrame: 'Docs' }), true);
  assert.equal(isIgnored({ name: '', containingFrame: '' }), true);
  assert.equal(isIgnored({ name: 'size=lg', containingFrame: 'Badge' }), false);
});

test('a missing description becomes an empty string, never undefined', () => {
  const [, badge] = rowsFrom(componentsResponse);
  assert.equal(badge.description, '');
});

test('autosave versions are dropped — versionIds is a publish history, not a clock', () => {
  const versions = versionsFrom({
    versions: [
      { id: 'v1', label: 'Components published', description: '', created_at: 't1', user: { handle: 'bill' } },
      { id: 'v2', label: null, description: null, created_at: 't2', user: { handle: 'bill' } },
      { id: 'v3', label: '', description: 'note only', created_at: 't3', user: {} },
    ],
  });
  assert.deepEqual(versions.map((v) => v.id), ['v1', 'v3']);
  assert.equal(versions[1].user, 'Unknown');
});

test('at most ten published versions are kept', () => {
  const many = { versions: Array.from({ length: 25 }, (_, i) => ({ id: `v${i}`, label: 'published' })) };
  assert.equal(versionsFrom(many).length, 10);
});

test('the diff is by published key, so a rename is a rename and not a delete plus an add', () => {
  const before = [{ key: 'k1', name: 'old', containingFrame: 'Tooltip' }];
  const after = [
    { key: 'k1', name: 'new', containingFrame: 'Tooltip' },
    { key: 'k2', name: 'fresh', containingFrame: 'Badge' },
  ];
  const { created, deleted, renamed } = diff(before, after);
  assert.deepEqual(created.map((c) => c.key), ['k2']);
  assert.deepEqual(deleted, []);
  assert.deepEqual(renamed.map((c) => c.key), ['k1']);
});

test('sets are the distinct containing frames, and the blank one is not a set', () => {
  assert.equal(setsIn([{ containingFrame: 'A' }, { containingFrame: 'A' }, { containingFrame: 'B' }]), 2);
  assert.equal(setsIn([{ containingFrame: '' }]), 0);
});

test('the written document keeps the shape the poller reads, plus the file key', () => {
  const now = new Date('2026-09-06T00:00:00.000Z');
  const doc = snapshotFrom({
    rows: rowsFrom(componentsResponse),
    versions: [],
    nodeHashes: { '42:6019': 'abc' },
    fileKey: DEFAULT_FILE_KEY,
    now,
  });
  assert.deepEqual(Object.keys(doc), [
    'lastChecked',
    'figmaFileKey',
    'components',
    'versionIds',
    'nodeHashes',
  ]);
  assert.equal(doc.lastChecked, '2026-09-06T00:00:00.000Z');
  assert.equal(doc.figmaFileKey, DEFAULT_FILE_KEY);
});

test('the same inputs produce the same document — the write is idempotent', () => {
  const args = { rows: rowsFrom(componentsResponse), versions: [], nodeHashes: {}, fileKey: DEFAULT_FILE_KEY };
  const now = new Date('2026-09-06T00:00:00.000Z');
  assert.equal(
    JSON.stringify(snapshotFrom({ ...args, now })),
    JSON.stringify(snapshotFrom({ ...args, now })),
  );
});

test('with no credential it refuses by name and writes nothing', () => {
  const live = path.join(REPO_ROOT, 'scripts/figma-component-snapshot.json');
  const before = fs.readFileSync(live, 'utf8');
  let stderr = '';
  try {
    execFileSync('node', [path.join(REPO_ROOT, 'scripts/snapshot-figma-components.mjs')], {
      cwd: REPO_ROOT,
      encoding: 'utf8',
      stdio: 'pipe',
      env: { ...process.env, FIGMA_ACCESS_TOKEN: '' },
    });
    assert.fail('expected a non-zero exit with no FIGMA_ACCESS_TOKEN');
  } catch (e) {
    stderr = e.stderr ?? '';
    assert.equal(e.status, 1);
  }
  assert.match(stderr, /FIGMA_ACCESS_TOKEN is not set/);
  assert.match(stderr, /Nothing was written/);
  assert.equal(fs.readFileSync(live, 'utf8'), before);
});

test('the refusal names the variable, so the reader does not have to read the source', () => {
  assert.match(MISSING_TOKEN, /FIGMA_ACCESS_TOKEN/);
});

// ── a partial hash map never becomes the baseline ──────────────────────────

test('a chunk that fails twice is REPORTED, not quietly dropped', async () => {
  // The regression: a failed chunk was a console.warn and nothing else, and the
  // caller wrote the partial map straight to disk. One rate-limited request
  // produced a snapshot that looks current and is missing up to 50 hashes,
  // which then becomes the baseline every later drift comparison reads.
  const rows = Array.from({ length: 120 }, (_, i) => ({ nodeId: `1:${i}`, name: `C${i}` }));
  const seen = [];
  const get = async (url) => {
    seen.push(url);
    // The second chunk is down, permanently — both the call and its retry.
    if (url.includes('1:50')) throw new Error('429 rate limited');
    const ids = new URL(`https://x${url}`).searchParams.get('ids').split(',');
    return { nodes: Object.fromEntries(ids.map((id) => [id, { document: { id } }])) };
  };

  const { hashes, failed } = await fetchNodeHashes(rows, 'KEY', 'token', get, 0);
  assert.equal(failed.length, 1, 'the failing chunk is reported');
  assert.equal(failed[0].count, 50);
  assert.match(failed[0].message, /429/);
  assert.equal(Object.keys(hashes).length, 70, 'the chunks that worked are still hashed');
  assert.equal(seen.filter((u) => u.includes('1:50')).length, 2, 'it retried once before giving up');
});

test('a chunk that fails once and then succeeds is not a failure', async () => {
  const rows = Array.from({ length: 60 }, (_, i) => ({ nodeId: `1:${i}`, name: `C${i}` }));
  let attempts = 0;
  const get = async (url) => {
    const ids = new URL(`https://x${url}`).searchParams.get('ids').split(',');
    if (ids[0] === '1:50') {
      attempts += 1;
      if (attempts === 1) throw new Error('ETIMEDOUT');
    }
    return { nodes: Object.fromEntries(ids.map((id) => [id, { document: { id } }])) };
  };

  const { hashes, failed } = await fetchNodeHashes(rows, 'KEY', 'token', get, 0);
  assert.deepEqual(failed, [], 'the retry is what the retry is for');
  assert.equal(Object.keys(hashes).length, 60);
});
