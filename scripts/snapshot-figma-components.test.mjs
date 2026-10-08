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
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

import {
  DEFAULT_FILE_KEY,
  MISSING_TOKEN,
  changedSets,
  diff,
  isIgnored,
  refreshVerdict,
  rowsFrom,
  setsIn,
  snapshotFrom,
  versionsFrom, fetchNodeHashes,
  figmaGet, backoffMs, waitBudget, FigmaBusyError,
  MAX_ATTEMPTS, MAX_WAIT_MS, NODES_SPACING_MS, EXIT_BUSY } from './snapshot-figma-components.mjs';

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

test('the changed sets name every set an add, a removal or a rename touched, once each and sorted', () => {
  const before = [
    { key: 'd1', name: 'size=1px', containingFrame: 'Divider' },
    { key: 'd2', name: 'size=2px', containingFrame: 'Divider' },
    { key: 't1', name: 'state=default', containingFrame: 'Tag' },
    { key: 'b1', name: 'size=lg', containingFrame: 'Badge' },
  ];
  const after = [
    { key: 'd1', name: 'size=sm', containingFrame: 'Divider' },
    { key: 'd2', name: 'size=lg', containingFrame: 'Divider' },
    { key: 't1', name: 'state=default', containingFrame: 'Tag' },
    { key: 'c1', name: 'size=md', containingFrame: 'Count' },
  ];
  assert.deepEqual(changedSets(before, after), ['Badge', 'Count', 'Divider']);
});

test('a component moved between sets names both the set it left and the one it joined', () => {
  const before = [{ key: 'k1', name: 'x', containingFrame: 'Old' }];
  const after = [{ key: 'k1', name: 'x', containingFrame: 'New' }];
  assert.deepEqual(changedSets(before, after), ['New', 'Old']);
});

test('no change names no set', () => {
  const rows = [{ key: 'k1', name: 'x', containingFrame: 'A' }];
  assert.deepEqual(changedSets(rows, rows), []);
});

test('rows are sorted by published key, so the API’s order cannot read as a change', () => {
  const shuffled = { meta: { components: [...componentsResponse.meta.components].reverse() } };
  assert.deepEqual(rowsFrom(shuffled).map((r) => r.key), ['k1', 'k2']);
  const unsorted = {
    meta: {
      components: [
        { key: 'kz', name: 'a', node_id: '1:9', containing_frame: { name: 'A' } },
        { key: 'ka', name: 'b', node_id: '1:8', containing_frame: { name: 'B' } },
      ],
    },
  };
  assert.deepEqual(rowsFrom(unsorted).map((r) => r.key), ['ka', 'kz']);
});

// ── the refresh workflow's verdict ──────────────────────────────────────────────

const NOW = new Date('2026-09-30T00:00:00.000Z');
const snap = (lastChecked, extra = {}) => ({
  lastChecked,
  figmaFileKey: DEFAULT_FILE_KEY,
  components: [
    { key: 'k1', name: 'a', description: '', nodeId: '1:1', containingFrame: 'A' },
    { key: 'k2', name: 'b', description: '', nodeId: '1:2', containingFrame: 'B' },
  ],
  versionIds: [],
  nodeHashes: { '1:1': 'h1', '1:2': 'h2' },
  ...extra,
});

test('a recent snapshot that differs only in lastChecked is unchanged', () => {
  const before = snap('2026-09-20T00:00:00.000Z');
  const after = snap(NOW.toISOString());
  assert.equal(refreshVerdict(before, after, { now: NOW, maxAgeDays: 180 }).verdict, 'unchanged');
});

test('component order and hash key order are not changes', () => {
  const before = snap('2026-09-20T00:00:00.000Z');
  const after = snap(NOW.toISOString(), {
    components: [...before.components].reverse(),
    nodeHashes: { '1:2': 'h2', '1:1': 'h1' },
  });
  assert.equal(refreshVerdict(before, after, { now: NOW, maxAgeDays: 180 }).verdict, 'unchanged');
});

test('any other difference is a change — a description, a node id, a hash, a version', () => {
  const before = snap('2026-09-20T00:00:00.000Z');
  const edits = [
    { components: [{ ...before.components[0], description: 'new' }, before.components[1]] },
    { components: [{ ...before.components[0], nodeId: '9:9' }, before.components[1]] },
    { nodeHashes: { '1:1': 'h1', '1:2': 'changed' } },
    { versionIds: [{ id: 'v1' }] },
  ];
  for (const edit of edits) {
    assert.equal(
      refreshVerdict(before, snap(NOW.toISOString(), edit), { now: NOW, maxAgeDays: 180 }).verdict,
      'changed',
      JSON.stringify(edit),
    );
  }
});

test('an unchanged library past half the age ceiling is a date refresh, so the age check can clear', () => {
  const at = (days) => snap(new Date(NOW.getTime() - days * 86400000).toISOString());
  const after = snap(NOW.toISOString());
  assert.equal(refreshVerdict(at(90), after, { now: NOW, maxAgeDays: 180 }).verdict, 'unchanged');
  assert.deepEqual(refreshVerdict(at(91), after, { now: NOW, maxAgeDays: 180 }), {
    verdict: 'date-only',
    ageDays: 91,
  });
});

test('a lastChecked that cannot be read is treated as old', () => {
  const after = snap(NOW.toISOString());
  assert.equal(refreshVerdict(snap('not a date'), after, { now: NOW, maxAgeDays: 180 }).verdict, 'date-only');
});

test('a lastChecked in the future is treated as old, like an unreadable one', () => {
  const after = snap(NOW.toISOString());
  const ahead = snap(new Date(NOW.getTime() + 3 * 86400000).toISOString());
  assert.deepEqual(refreshVerdict(ahead, after, { now: NOW, maxAgeDays: 180 }), {
    verdict: 'date-only',
    ageDays: -3,
  });
});

test('the verdict command prints GITHUB_OUTPUT lines, and fails on a file that is not JSON', () => {
  const cli = path.join(REPO_ROOT, 'scripts/figma-snapshot-verdict.mjs');
  const live = path.join(REPO_ROOT, 'scripts/figma-component-snapshot.json');
  const out = execFileSync('node', [cli, live, live], { encoding: 'utf8' });
  assert.match(out, /^verdict=(unchanged|date-only)\nage_days=\d+\n$/);

  const bad = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'verdict-')), 'bad.json');
  fs.writeFileSync(bad, '{not json');
  assert.throws(() => execFileSync('node', [cli, live, bad], { stdio: 'pipe' }), (e) => e.status !== 0);
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

// ── a rate limit is waited out, not a failure (#898) ────────────────────────
//
// The refresh now runs itself once per publish, on the budget Bill's own tools
// share, so a 429 is an ordinary answer. These drive `figmaGet` over a fake
// fetch and a sleep that only records how long it was asked to wait.

/** A fetch that answers from a script: each entry a status, an optional Retry-After and a body. */
function scriptedFetch(answers) {
  const calls = [];
  const fetchImpl = async (url) => {
    calls.push(url);
    const a = answers.shift() ?? { status: 200, body: {} };
    return {
      ok: a.status >= 200 && a.status < 300,
      status: a.status,
      headers: { get: (h) => (h.toLowerCase() === 'retry-after' ? (a.retryAfter ?? null) : null) },
      json: async () => a.body ?? {},
      text: async () => JSON.stringify(a.body ?? {}),
    };
  };
  return { fetchImpl, calls };
}

/** A sleep that waits for nothing and keeps the waits it was asked for. */
function recordedSleep() {
  const waits = [];
  return { waits, sleep: async (ms) => void waits.push(ms) };
}

const quiet = () => {};

test('a 429 with Retry-After waits that long, then returns the answer', async () => {
  const { fetchImpl, calls } = scriptedFetch([{ status: 429, retryAfter: '60' }, { status: 200, body: { ok: 1 } }]);
  const { waits, sleep } = recordedSleep();
  const body = await figmaGet('/files/K/components', 't', { fetchImpl, sleep, log: quiet });
  assert.deepEqual(body, { ok: 1 });
  assert.deepEqual(waits, [60_000]);
  assert.equal(calls.length, 2);
});

test('a 429 with no Retry-After waits 5 s, then 10 s, doubling', async () => {
  const { fetchImpl } = scriptedFetch([{ status: 429 }, { status: 429 }, { status: 200, body: {} }]);
  const { waits, sleep } = recordedSleep();
  await figmaGet('/files/K/versions', 't', { fetchImpl, sleep, log: quiet });
  assert.deepEqual(waits, [5_000, 10_000]);
  assert.equal(backoffMs(9, null), MAX_WAIT_MS, 'never more than five minutes at once');
  assert.equal(backoffMs(1, '86400'), MAX_WAIT_MS, 'whatever Retry-After asks');
});

test('a 5xx is waited out too; any other refusal throws at once', async () => {
  const ok = scriptedFetch([{ status: 503 }, { status: 200, body: { ok: 1 } }]);
  assert.deepEqual(await figmaGet('/files/K/components', 't', { ...ok, ...recordedSleep(), log: quiet }), { ok: 1 });

  const gone = scriptedFetch([{ status: 404, body: { err: 'Not found' } }]);
  const { waits, sleep } = recordedSleep();
  await assert.rejects(figmaGet('/files/K/components', 't', { fetchImpl: gone.fetchImpl, sleep, log: quiet }), /Figma API 404/);
  assert.deepEqual(waits, [], 'a 404 is not waited on');
});

test('it gives up after six tries, or once the run has waited its budget, as busy', async () => {
  const always = scriptedFetch(Array.from({ length: 10 }, () => ({ status: 429, retryAfter: '1' })));
  const tries = recordedSleep();
  await assert.rejects(figmaGet('/x', 't', { fetchImpl: always.fetchImpl, sleep: tries.sleep, log: quiet }), FigmaBusyError);
  assert.equal(always.calls.length, MAX_ATTEMPTS);
  assert.equal(tries.waits.length, MAX_ATTEMPTS - 1);

  // The budget is the run's, shared across calls: what one spent, the next cannot.
  const budget = waitBudget(90_000);
  const first = scriptedFetch([{ status: 429, retryAfter: '60' }, { status: 200, body: {} }]);
  await figmaGet('/a', 't', { fetchImpl: first.fetchImpl, sleep: recordedSleep().sleep, budget, log: quiet });
  const second = scriptedFetch([{ status: 429, retryAfter: '60' }]);
  await assert.rejects(
    figmaGet('/b', 't', { fetchImpl: second.fetchImpl, sleep: recordedSleep().sleep, budget, log: quiet }),
    (e) => e instanceof FigmaBusyError && /after 60 s of waiting this run/.test(e.message),
  );
  assert.equal(EXIT_BUSY, 75, 'EX_TEMPFAIL, so the workflow can tell busy from broken');
});

test('node fetches are paced at uno-bot\'s half of Tier 1, and a chunk 429\'d once is not a failure', async () => {
  const rows = Array.from({ length: 150 }, (_, i) => ({ nodeId: `1:${i}`, name: `C${i}` }));
  const answers = [];
  for (let chunk = 0; chunk < 3; chunk += 1) {
    if (chunk === 1) answers.push({ status: 429, retryAfter: '30' });
    answers.push({ status: 200, body: null });
  }
  const { waits, sleep } = recordedSleep();
  let n = 0;
  const fetchImpl = async (url) => {
    const a = answers[n++];
    const ids = new URL(url).searchParams.get('ids').split(',');
    return {
      ok: a.status === 200,
      status: a.status,
      headers: { get: (h) => (h.toLowerCase() === 'retry-after' ? (a.retryAfter ?? null) : null) },
      json: async () => ({ nodes: Object.fromEntries(ids.map((id) => [id, { document: { id } }])) }),
      text: async () => '',
    };
  };
  const budget = waitBudget();
  const get = (endpoint, token) => figmaGet(endpoint, token, { fetchImpl, sleep, budget, log: quiet });
  const { hashes, failed } = await fetchNodeHashes(rows, 'KEY', 'token', get, 0, { paceMs: NODES_SPACING_MS, sleep });
  assert.deepEqual(failed, []);
  assert.equal(Object.keys(hashes).length, 150);
  assert.deepEqual(waits, [NODES_SPACING_MS, 30_000, NODES_SPACING_MS], 'a gap between chunks, and the 429 waited out');
  assert.equal(NODES_SPACING_MS, 12_000, 'five a minute');
});

test('a chunk Figma kept refusing is reported as busy, so the CLI writes nothing and exits 75', async () => {
  const rows = Array.from({ length: 60 }, (_, i) => ({ nodeId: `1:${i}`, name: `C${i}` }));
  let calls = 0;
  const get = async (url) => {
    calls += 1;
    if (url.includes('1:50')) throw new FigmaBusyError(url, 429, 600_000);
    const ids = new URL(`https://x${url}`).searchParams.get('ids').split(',');
    return { nodes: Object.fromEntries(ids.map((id) => [id, { document: { id } }])) };
  };
  const { failed } = await fetchNodeHashes(rows, 'KEY', 'token', get, 0);
  assert.equal(failed.length, 1);
  assert.equal(failed[0].busy, true);
  assert.equal(calls, 2, 'the backoff spent its tries already: no second round');
});
