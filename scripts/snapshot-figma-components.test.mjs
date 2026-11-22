/**
 * Tests for `npm run snapshot:figma-components`.
 *
 * The thing worth testing is that it writes a stable population: a snapshot
 * built from a slightly different set of rows is not a stale snapshot, it is a
 * snapshot that reports every difference as a change, once, loudly, in the
 * refresh PR.
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
  buildRefreshPrBody,
  buildRefreshPrOutput,
  changedComponents,
  changedSets,
  diff,
  hashNodeDocument,
  isIgnored,
  projectNode,
  refreshVerdict,
  rowsFrom,
  setsIn,
  snapshotFrom,
  versionsFrom, fetchNodeHashes,
  figmaGet, backoffMs, waitBudget, FigmaBusyError,
  MAX_ATTEMPTS, NODES_SPACING_MS, EXIT_BUSY } from './snapshot-figma-components.mjs';

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
      { key: 'k2', name: 'size=lg', description: '', node_id: '1:2', containing_frame: { name: 'StatusTag' } },
      // Dropped by the shared ignore list, exactly as the ignore list drops them.
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

test('the ignore list drops internals and docs, so the population is only the library’s components', () => {
  const rows = rowsFrom(componentsResponse);
  assert.deepEqual(rows.map((r) => r.key), ['k1', 'k2']);
  assert.equal(isIgnored({ name: '_Tooltip Arrow', containingFrame: 'Tooltip' }), true);
  assert.equal(isIgnored({ name: 'x', containingFrame: 'layout-blocks/y' }), true);
  assert.equal(isIgnored({ name: 'Spacing Token Guidelines', containingFrame: 'Docs' }), true);
  assert.equal(isIgnored({ name: 'draft', containingFrame: 'Docs' }), true);
  assert.equal(isIgnored({ name: '', containingFrame: '' }), true);
  assert.equal(isIgnored({ name: 'size=lg', containingFrame: 'StatusTag' }), false);
});

test('a missing description becomes an empty string, never undefined', () => {
  const [, statusTag] = rowsFrom(componentsResponse);
  assert.equal(statusTag.description, '');
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
    { key: 'k2', name: 'fresh', containingFrame: 'StatusTag' },
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
    { key: 'b1', name: 'size=lg', containingFrame: 'StatusTag' },
  ];
  const after = [
    { key: 'd1', name: 'size=sm', containingFrame: 'Divider' },
    { key: 'd2', name: 'size=lg', containingFrame: 'Divider' },
    { key: 't1', name: 'state=default', containingFrame: 'Tag' },
    { key: 'c1', name: 'size=md', containingFrame: 'CountTag' },
  ];
  assert.deepEqual(changedSets(before, after), ['CountTag', 'Divider', 'StatusTag']);
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

test('any component or hash difference is a change, while publish-history-only is unchanged', () => {
  const before = snap('2026-09-20T00:00:00.000Z');
  const edits = [
    { components: [{ ...before.components[0], description: 'new' }, before.components[1]] },
    { components: [{ ...before.components[0], nodeId: '9:9' }, before.components[1]] },
    { nodeHashes: { '1:1': 'h1', '1:2': 'changed' } },
  ];
  for (const edit of edits) {
    assert.equal(
      refreshVerdict(before, snap(NOW.toISOString(), edit), { now: NOW, maxAgeDays: 180 }).verdict,
      'changed',
      JSON.stringify(edit),
    );
  }
  assert.equal(
    refreshVerdict(before, snap(NOW.toISOString(), { versionIds: [{ id: 'v1' }] }), { now: NOW, maxAgeDays: 180 }).verdict,
    'unchanged',
  );
});

test('an unchanged library opens no PR even past half the age ceiling or with an unreadable/future date', () => {
  const at = (days) => snap(new Date(NOW.getTime() - days * 86400000).toISOString());
  const after = snap(NOW.toISOString());
  assert.equal(refreshVerdict(at(90), after, { now: NOW, maxAgeDays: 180 }).verdict, 'unchanged');
  assert.deepEqual(refreshVerdict(at(91), after, { now: NOW, maxAgeDays: 180 }), {
    verdict: 'unchanged',
    ageDays: 91,
  });
  assert.equal(refreshVerdict(snap('not a date'), after, { now: NOW, maxAgeDays: 180 }).verdict, 'unchanged');
  const ahead = snap(new Date(NOW.getTime() + 3 * 86400000).toISOString());
  assert.deepEqual(refreshVerdict(ahead, after, { now: NOW, maxAgeDays: 180 }), {
    verdict: 'unchanged',
    ageDays: -3,
  });
});

test('the verdict command prints GITHUB_OUTPUT lines, and fails on a file that is not JSON', () => {
  const cli = path.join(REPO_ROOT, 'scripts/figma-snapshot-verdict.mjs');
  const live = path.join(REPO_ROOT, 'scripts/figma-component-snapshot.json');
  const out = execFileSync('node', [cli, live, live], { encoding: 'utf8' });
  assert.match(out, /^verdict=unchanged\nage_days=\d+\n$/);

  const bad = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'verdict-')), 'bad.json');
  fs.writeFileSync(bad, '{not json');
  assert.throws(() => execFileSync('node', [cli, live, bad], { stdio: 'pipe' }), (e) => e.status !== 0);
});

test('the written document keeps the shape the refresh diffs, plus the file key', () => {
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
// fetch and a sleep that only records how long it was asked to wait. The
// policy is the Worker's Figma client's (agents/uno-bot/src/figma/rest.ts).

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

test('each wait is at least Retry-After and at least 1 s doubling, as the Worker waits', async () => {
  const { fetchImpl } = scriptedFetch([{ status: 429 }, { status: 429, retryAfter: '0' }, { status: 200, body: {} }]);
  const { waits, sleep } = recordedSleep();
  await figmaGet('/files/K/versions', 't', { fetchImpl, sleep, log: quiet });
  assert.deepEqual(waits, [1_000, 2_000]);
  assert.equal(backoffMs(1, '600'), 600_000, 'a long Retry-After is honored, not cut short');
});

test('a Retry-After the run cannot afford fails now, without sleeping or trying again', async () => {
  const { fetchImpl, calls } = scriptedFetch([{ status: 429, retryAfter: '3600' }]);
  const { waits, sleep } = recordedSleep();
  await assert.rejects(figmaGet('/files/K/components', 't', { fetchImpl, sleep, log: quiet }), FigmaBusyError);
  assert.deepEqual(waits, []);
  assert.equal(calls.length, 1);
});

test('a 5xx is waited out too; any other refusal throws at once', async () => {
  const ok = scriptedFetch([{ status: 503 }, { status: 200, body: { ok: 1 } }]);
  assert.deepEqual(await figmaGet('/files/K/components', 't', { ...ok, ...recordedSleep(), log: quiet }), { ok: 1 });

  const gone = scriptedFetch([{ status: 404, body: { err: 'Not found' } }]);
  const { waits, sleep } = recordedSleep();
  await assert.rejects(figmaGet('/files/K/components', 't', { fetchImpl: gone.fetchImpl, sleep, log: quiet }), /Figma API 404/);
  assert.deepEqual(waits, [], 'a 404 is not waited on');
});

test('it gives up after three tries, or once the run has waited its budget, as busy', async () => {
  const always = scriptedFetch(Array.from({ length: 10 }, () => ({ status: 429, retryAfter: '1' })));
  const tries = recordedSleep();
  await assert.rejects(figmaGet('/x', 't', { fetchImpl: always.fetchImpl, sleep: tries.sleep, log: quiet }), FigmaBusyError);
  assert.equal(MAX_ATTEMPTS, 3, "rest.ts's try count");
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

test("node fetches are paced at uno-bot's half of Tier 1, and a chunk 429'd once is not a failure", async () => {
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
});

test('the first chunk Figma kept refusing ends the node fetches, reported as busy', async () => {
  const rows = Array.from({ length: 150 }, (_, i) => ({ nodeId: `1:${i}`, name: `C${i}` }));
  const seen = [];
  const get = async (url) => {
    seen.push(url);
    if (url.includes('1:50')) throw new FigmaBusyError(url, 429, 600_000);
    const ids = new URL(`https://x${url}`).searchParams.get('ids').split(',');
    return { nodes: Object.fromEntries(ids.map((id) => [id, { document: { id } }])) };
  };
  const { failed } = await fetchNodeHashes(rows, 'KEY', 'token', get, 0);
  assert.equal(seen.length, 2, 'no second round for the busy chunk, and no Tier 1 call after it');
  assert.deepEqual(
    failed.map(({ from, count, busy }) => ({ from, count, busy })),
    [
      { from: 50, count: 50, busy: true },
      { from: 100, count: 50, busy: true },
    ],
    'the chunks never fetched are named too',
  );
});

/**
 * Run the CLI with Figma behind a fetch stub, preloaded so `main()` itself is
 * what meets it. `busyOn` is the endpoint that answers 429 with an hour's
 * Retry-After; every other endpoint answers an empty library.
 */
function runCliWithFigmaBusyOn(busyOn) {
  const stub = `
    globalThis.fetch = async (url) => {
      if (String(url).includes(${JSON.stringify(busyOn)})) {
        return new Response('{"status":429}', { status: 429, headers: { 'retry-after': '3600' } });
      }
      return new Response(JSON.stringify({ meta: { components: [] }, versions: [] }), { status: 200 });
    };`;
  try {
    execFileSync(
      'node',
      ['--import', `data:text/javascript,${encodeURIComponent(stub)}`, path.join(REPO_ROOT, 'scripts/snapshot-figma-components.mjs')],
      { cwd: REPO_ROOT, encoding: 'utf8', stdio: 'pipe', env: { ...process.env, FIGMA_ACCESS_TOKEN: 'test-token' } },
    );
    return { status: 0, stderr: '' };
  } catch (e) {
    return { status: e.status, stderr: e.stderr ?? '' };
  }
}

for (const endpoint of ['/components', '/versions']) {
  test(`a ${endpoint} call Figma keeps refusing exits 75 through main() and writes nothing`, () => {
    const live = path.join(REPO_ROOT, 'scripts/figma-component-snapshot.json');
    const before = fs.readFileSync(live, 'utf8');
    const { status, stderr } = runCliWithFigmaBusyOn(endpoint);
    assert.equal(status, EXIT_BUSY);
    assert.match(stderr, /Figma kept answering 429 on \/files\/[^ ]+\/(components|versions)/);
    assert.match(stderr, /Nothing was written/);
    assert.equal(fs.readFileSync(live, 'utf8'), before);
  });
}

// ── canonical node hashing & PR body (#2799) ────────────────────────────────

function recordedLibraryRestFetch1() {
  return {
    componentsResponse: {
      status: 200,
      error: false,
      meta: {
        components: [
          {
            key: 'k1',
            file_key: DEFAULT_FILE_KEY,
            node_id: '10:1',
            thumbnail_url: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/thumb-run-1-a',
            name: 'appearance=primary, state=default',
            description: 'Primary button',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-11-16T00:00:00Z',
            user: { id: 'u1', handle: 'bill' },
            containing_frame: { name: 'Button', nodeId: '10:0', pageName: 'Components' },
          },
          {
            key: 'k2',
            file_key: DEFAULT_FILE_KEY,
            node_id: '10:2',
            thumbnail_url: 'https://figma-alpha-api.s3.us-west-2.amazonaws.com/images/thumb-run-1-b',
            name: 'tone=neutral, size=sm',
            description: 'Neutral tag',
            created_at: '2026-01-01T00:00:00Z',
            updated_at: '2026-11-16T00:00:00Z',
            user: { id: 'u1', handle: 'bill' },
            containing_frame: { name: 'Tag', nodeId: '20:0', pageName: 'Components' },
          },
        ],
      },
    },
    versionsResponse: {
      versions: [
        {
          id: '5001',
          created_at: '2026-11-16T00:00:00Z',
          label: 'v1.0.0',
          description: 'Initial library release',
          user: { handle: 'bill' },
        },
        {
          id: '5000',
          created_at: '2026-11-15T23:55:00Z',
          label: null,
          description: null,
          user: { handle: 'bill' },
        },
      ],
    },
    nodesResponse: {
      name: 'Design System - BS4 Foundation',
      lastModified: '2026-11-16T00:00:00Z',
      version: '5001',
      nodes: {
        '10:1': {
          document: {
            id: '10:1',
            name: 'appearance=primary, state=default',
            type: 'COMPONENT',
            layoutMode: 'HORIZONTAL',
            paddingLeft: 16,
            paddingRight: 16,
            itemSpacing: 8,
            cornerRadius: 8,
            size: { x: 120, y: 40 },
            rotation: 0,
            relativeTransform: [
              [1, 0, 100],
              [0, 1, 200],
            ],
            absoluteBoundingBox: { x: 100, y: 200, width: 120, height: 40 },
            absoluteRenderBounds: { x: 100, y: 200, width: 120, height: 40 },
            fills: [
              {
                type: 'SOLID',
                color: { r: 0.1, g: 0.2, b: 0.8, a: 1 },
                boundVariables: { color: { type: 'VARIABLE_ALIAS', id: 'VariableID:1:10' } },
              },
            ],
            strokes: [],
            effects: [{ type: 'DROP_SHADOW', visible: true, radius: 4, offset: { x: 0, y: 2 } }],
            styles: { fill: 'S:fill-primary' },
            componentPropertyDefinitions: {
              'Label#10:0': { type: 'TEXT', defaultValue: 'Save' },
            },
            pluginData: { figmaTokens: { syncedAt: '2026-11-16T00:00:00Z' } },
            sharedPluginData: { codeConnect: { stamp: 'run-1' } },
            devStatus: { type: 'READY_FOR_DEV' },
            fillGeometry: [{ path: 'M0 0L120 0L120 40L0 40Z', windingRule: 'NONZERO', overrideID: 1 }],
            strokeGeometry: [],
            children: [
              {
                id: 'I10:1;10:2',
                name: 'Label',
                type: 'TEXT',
                characters: 'Save',
                visible: true,
                size: { x: 40, y: 20 },
                rotation: 0,
                relativeTransform: [
                  [1, 0, 16],
                  [0, 1, 10],
                ],
                absoluteBoundingBox: { x: 116, y: 210, width: 40, height: 20 },
                style: { fontFamily: 'Inter', fontSize: 14, fontWeight: 600 },
                componentPropertyReferences: { characters: 'Label#10:0' },
                pluginData: { noise: 'a' },
              },
            ],
          },
        },
        '10:2': {
          document: {
            id: '10:2',
            name: 'tone=neutral, size=sm',
            type: 'COMPONENT',
            layoutMode: 'HORIZONTAL',
            size: { x: 64, y: 24 },
            rotation: 0,
            relativeTransform: [
              [1, 0, 300],
              [0, 1, 200],
            ],
            absoluteBoundingBox: { x: 300, y: 200, width: 64, height: 24 },
            fills: [{ type: 'SOLID', color: { r: 0.9, g: 0.9, b: 0.9, a: 1 } }],
            strokes: [{ type: 'SOLID', color: { r: 0.7, g: 0.7, b: 0.7, a: 1 } }],
            strokeWeight: 1,
            boundVariables: { topLeftRadius: { type: 'VARIABLE_ALIAS', id: 'VariableID:2:5' } },
            children: [
              {
                id: '10:3',
                name: 'Icon',
                type: 'INSTANCE',
                componentId: '99:1',
                size: { x: 16, y: 16 },
                rotation: 0,
                relativeTransform: [
                  [1, 0, 8],
                  [0, 1, 4],
                ],
                absoluteBoundingBox: { x: 308, y: 204, width: 16, height: 16 },
                fillGeometry: [{ path: 'M0 0L16 0L8 16Z', windingRule: 'NONZERO', overrideID: 2 }],
                componentProperties: {
                  'Show#99:0': { type: 'BOOLEAN', value: true },
                },
                overrides: [{ id: 'I10:3;99:2', overriddenFields: ['fills'] }],
              },
            ],
          },
        },
      },
    },
  };
}

function shuffleKeys(value) {
  if (Array.isArray(value)) return value.map(shuffleKeys);
  if (value && typeof value === 'object') {
    const entries = Object.entries(value).reverse().map(([k, v]) => [k, shuffleKeys(v)]);
    return Object.fromEntries(entries);
  }
  return value;
}

function recordedLibraryRestFetch2() {
  const base = shuffleKeys(recordedLibraryRestFetch1());
  // Reverse /components order & mutate volatile REST metadata
  base.componentsResponse.meta.components = [...base.componentsResponse.meta.components].reverse().map((c) => ({
    ...c,
    thumbnail_url: `${c.thumbnail_url}-reissued`,
    updated_at: '2026-11-18T12:00:00Z',
    user: { id: 'u2', handle: 'bot' },
  }));
  // Add a publish-history version without changing any component
  base.versionsResponse.versions.unshift({
    id: '5002',
    created_at: '2026-11-18T12:00:00Z',
    label: 'v1.0.1',
    description: 'Re-published without component edits',
    user: { handle: 'bot' },
  });
  // Mutate volatile / canvas-position / reissued fields on /nodes response
  base.nodesResponse.lastModified = '2026-11-18T12:00:00Z';
  base.nodesResponse.version = '5002';
  const n1 = base.nodesResponse.nodes['10:1'].document;
  n1.id = '999:1';
  n1.pluginData = { figmaTokens: { syncedAt: '2026-11-18T00:00:00Z' } };
  n1.sharedPluginData = { codeConnect: { stamp: 'run-2' }, extra: true };
  n1.devStatus = { type: 'NONE' };
  // Whole component moved on canvas by (+700, +1000) and float jitter in child transform
  n1.relativeTransform = [
    [1, 0, 800],
    [0, 1, 1200],
  ];
  n1.absoluteBoundingBox = { x: 800, y: 1200, width: 120, height: 40 };
  n1.absoluteRenderBounds = { x: 800, y: 1200, width: 120, height: 40 };
  n1.fillGeometry = [{ path: 'M 0.00001 0 L 120 0 L 120 40 L 0 40 Z', windingRule: 'NONZERO', overrideID: 99 }];
  n1.children[0].id = 'I999:1;888:2';
  n1.children[0].pluginData = { noise: 'b' };
  n1.children[0].rotation = 0.00001;
  n1.children[0].relativeTransform = [
    [1, 0, 16.00001],
    [0, 1, 9.99999],
  ];
  n1.children[0].absoluteBoundingBox = { x: 816, y: 1210, width: 40, height: 20 };

  const n2 = base.nodesResponse.nodes['10:2'].document;
  n2.children[0].id = '777:3';
  n2.children[0].componentId = '99:999';
  n2.children[0].overrides = [{ id: 'I777:3;99:99', overriddenFields: ['fills'] }];
  n2.children[0].fillGeometry = [{ path: 'M0 0L16 0L8 16Z', windingRule: 'NONZERO', overrideID: 88 }];
  return base;
}

test('two full REST fetches of an unchanged library give identical hashes and verdict=unchanged', async () => {
  const fetch1 = recordedLibraryRestFetch1();
  const fetch2 = recordedLibraryRestFetch2();

  const makeGet = (rest) => async (endpoint) => {
    if (endpoint.endsWith('/components')) return rest.componentsResponse;
    if (endpoint.endsWith('/versions')) return rest.versionsResponse;
    if (endpoint.includes('/nodes?')) return rest.nodesResponse;
    throw new Error(`unexpected endpoint ${endpoint}`);
  };

  const rows1 = rowsFrom(await makeGet(fetch1)(`/files/${DEFAULT_FILE_KEY}/components`));
  const versions1 = versionsFrom(await makeGet(fetch1)(`/files/${DEFAULT_FILE_KEY}/versions`));
  const hashes1 = await fetchNodeHashes(rows1, DEFAULT_FILE_KEY, 'tok', makeGet(fetch1), 0);

  const rows2 = rowsFrom(await makeGet(fetch2)(`/files/${DEFAULT_FILE_KEY}/components`));
  const versions2 = versionsFrom(await makeGet(fetch2)(`/files/${DEFAULT_FILE_KEY}/versions`));
  const hashes2 = await fetchNodeHashes(rows2, DEFAULT_FILE_KEY, 'tok', makeGet(fetch2), 0);

  assert.deepEqual(hashes1.failed, []);
  assert.deepEqual(hashes2.failed, []);
  assert.deepEqual(hashes2.hashes, hashes1.hashes);
  assert.equal(projectNode(fetch1.nodesResponse.nodes['10:1'].document).pluginData, undefined);

  // Even past half the age ceiling and with a new publish version, no PR is opened.
  const snap1 = snapshotFrom({
    rows: rows1,
    versions: versions1,
    nodeHashes: hashes1.hashes,
    fileKey: DEFAULT_FILE_KEY,
    now: new Date('2026-01-01T00:00:00Z'),
  });
  const snap2 = snapshotFrom({
    rows: rows2,
    versions: versions2,
    nodeHashes: hashes2.hashes,
    fileKey: DEFAULT_FILE_KEY,
    now: new Date('2026-11-18T00:00:00Z'),
  });
  assert.equal(
    refreshVerdict(snap1, snap2, { now: new Date('2026-11-18T00:00:00Z'), maxAgeDays: 180 }).verdict,
    'unchanged',
  );
});

test('moving a child without resizing changes the hash, while moving the whole component does not', () => {
  const baseDoc = recordedLibraryRestFetch1().nodesResponse.nodes['10:1'].document;
  const baseHash = hashNodeDocument(baseDoc);

  // Moving the whole component on canvas (root + children shifted equally) keeps the hash identical.
  const movedWhole = structuredClone(baseDoc);
  movedWhole.relativeTransform = [
    [1, 0, 500],
    [0, 1, 700],
  ];
  movedWhole.absoluteBoundingBox = { x: 500, y: 700, width: 120, height: 40 };
  movedWhole.children[0].absoluteBoundingBox = { x: 516, y: 710, width: 40, height: 20 };
  assert.equal(hashNodeDocument(movedWhole), baseHash, 'whole-component canvas move must not change hash');

  // Moving the child relative to its parent without resizing MUST change the hash.
  const movedChildBounds = structuredClone(baseDoc);
  movedChildBounds.children[0].relativeTransform = [
    [1, 0, 32],
    [0, 1, 10],
  ];
  movedChildBounds.children[0].absoluteBoundingBox = { x: 132, y: 210, width: 40, height: 20 };
  assert.notEqual(hashNodeDocument(movedChildBounds), baseHash, 'child position change must change hash');

  // Moving a child that only updates absoluteBoundingBox (without relativeTransform) also changes hash.
  const boxOnlyBase = structuredClone(baseDoc);
  delete boxOnlyBase.relativeTransform;
  delete boxOnlyBase.children[0].relativeTransform;
  const boxOnlyMoved = structuredClone(boxOnlyBase);
  boxOnlyMoved.children[0].absoluteBoundingBox = { x: 132, y: 210, width: 40, height: 20 };
  assert.notEqual(hashNodeDocument(boxOnlyMoved), hashNodeDocument(boxOnlyBase));

  // Rotating a child without resizing MUST change the hash.
  const rotatedChild = structuredClone(baseDoc);
  rotatedChild.children[0].rotation = 15;
  assert.notEqual(hashNodeDocument(rotatedChild), baseHash, 'child rotation change must change hash');
});

test('editing vector path geometry with the same bounds, fills, and strokes changes the hash', () => {
  const baseDoc = recordedLibraryRestFetch1().nodesResponse.nodes['10:2'].document;
  const baseHash = hashNodeDocument(baseDoc);

  const editedPath = structuredClone(baseDoc);
  editedPath.children[0].fillGeometry = [{ path: 'M0 0L16 8L0 16Z', windingRule: 'NONZERO', overrideID: 2 }];
  assert.notEqual(hashNodeDocument(editedPath), baseHash, 'vector path edit with same bounds must change hash');

  const editedWinding = structuredClone(baseDoc);
  editedWinding.children[0].fillGeometry = [{ path: 'M0 0L16 0L8 16Z', windingRule: 'EVENODD', overrideID: 2 }];
  assert.notEqual(hashNodeDocument(editedWinding), baseHash, 'windingRule change must change hash');
});

test('a real edit (a fill or a property change) changes only that component hash', async () => {
  const fetch1 = recordedLibraryRestFetch1();
  const rows = rowsFrom(fetch1.componentsResponse);

  const base = await fetchNodeHashes(rows, 'KEY', 'tok', async () => fetch1.nodesResponse, 0);

  // Fill edit on 10:1 only
  const fillEditNodes = structuredClone(fetch1.nodesResponse);
  fillEditNodes.nodes['10:1'].document.fills[0].color.r = 0.5;
  const afterFill = await fetchNodeHashes(rows, 'KEY', 'tok', async () => fillEditNodes, 0);
  assert.notEqual(afterFill.hashes['10:1'], base.hashes['10:1'], 'fill change updates Button hash');
  assert.equal(afterFill.hashes['10:2'], base.hashes['10:2'], 'unchanged Tag hash stays identical');

  // Component property edit on 10:2 only
  const propEditNodes = structuredClone(fetch1.nodesResponse);
  propEditNodes.nodes['10:2'].document.children[0].componentProperties['Show#99:0'].value = false;
  const afterProp = await fetchNodeHashes(rows, 'KEY', 'tok', async () => propEditNodes, 0);
  assert.equal(afterProp.hashes['10:1'], base.hashes['10:1'], 'unchanged Button hash stays identical');
  assert.notEqual(afterProp.hashes['10:2'], base.hashes['10:2'], 'property change updates Tag hash');
});

test('hashNodeDocument detects changes across all design fields', () => {
  const doc = recordedLibraryRestFetch1().nodesResponse.nodes['10:1'].document;
  const baseHash = hashNodeDocument(doc);
  const mutate = (fn) => {
    const copy = structuredClone(doc);
    fn(copy);
    return hashNodeDocument(copy);
  };
  assert.notEqual(mutate((d) => { d.name = 'appearance=secondary'; }), baseHash);
  assert.notEqual(mutate((d) => { d.paddingLeft = 20; }), baseHash);
  assert.notEqual(mutate((d) => { d.strokes = [{ type: 'SOLID', color: { r: 0, g: 0, b: 0, a: 1 } }]; }), baseHash);
  assert.notEqual(mutate((d) => { d.effects = []; }), baseHash);
  assert.notEqual(mutate((d) => { d.styles.fill = 'S:other'; }), baseHash);
  assert.notEqual(mutate((d) => { d.children[0].characters = 'Cancel'; }), baseHash);
  assert.notEqual(mutate((d) => { d.children[0].visible = false; }), baseHash);
  assert.notEqual(mutate((d) => { d.componentPropertyDefinitions['Label#10:0'].defaultValue = 'Go'; }), baseHash);
});

test('no PR is opened when nothing changed, and the PR body names the changed components', () => {
  const fetch1 = recordedLibraryRestFetch1();
  const fetch2 = recordedLibraryRestFetch2();
  const rows = rowsFrom(fetch1.componentsResponse);
  const baseHashes = {
    '10:1': hashNodeDocument(fetch1.nodesResponse.nodes['10:1'].document),
    '10:2': hashNodeDocument(fetch1.nodesResponse.nodes['10:2'].document),
  };
  const before = snapshotFrom({
    rows,
    versions: versionsFrom(fetch1.versionsResponse),
    nodeHashes: baseHashes,
    fileKey: DEFAULT_FILE_KEY,
    now: new Date('2026-01-01T00:00:00Z'),
  });

  // Second fetch with volatile churn, new version, and old baseline -> verdict is unchanged (no PR)
  const afterUnchanged = snapshotFrom({
    rows: rowsFrom(fetch2.componentsResponse),
    versions: versionsFrom(fetch2.versionsResponse),
    nodeHashes: {
      '10:1': hashNodeDocument(fetch2.nodesResponse.nodes['10:1'].document),
      '10:2': hashNodeDocument(fetch2.nodesResponse.nodes['10:2'].document),
    },
    fileKey: DEFAULT_FILE_KEY,
    now: new Date('2026-11-18T00:00:00Z'),
  });
  assert.equal(
    refreshVerdict(before, afterUnchanged, { now: new Date('2026-11-18T00:00:00Z'), maxAgeDays: 180 }).verdict,
    'unchanged',
  );

  // Real edit on 10:1 only -> PR body lists Button / appearance=primary, state=default by name
  const editedNodes = structuredClone(fetch1.nodesResponse.nodes);
  editedNodes['10:1'].document.fills[0].color.r = 0.4;
  const afterEdited = snapshotFrom({
    rows,
    versions: versionsFrom(fetch1.versionsResponse),
    nodeHashes: {
      '10:1': hashNodeDocument(editedNodes['10:1'].document),
      '10:2': hashNodeDocument(editedNodes['10:2'].document),
    },
    fileKey: DEFAULT_FILE_KEY,
    now: new Date('2026-11-18T00:00:00Z'),
  });
  assert.equal(
    refreshVerdict(before, afterEdited, { now: new Date('2026-11-18T00:00:00Z'), maxAgeDays: 180 }).verdict,
    'changed',
  );

  const changes = changedComponents(before, afterEdited);
  assert.deepEqual(changes.names, ['Button / appearance=primary, state=default']);

  const body = buildRefreshPrBody({
    before,
    after: afterEdited,
    verdict: 'changed',
    ageDays: 2,
    deltaLog: '[snapshot:figma-components] 2 published components in 2 sets.',
    base: 'main',
    branch: 'chore/figma-snapshot-refresh',
    snapshotPath: 'scripts/figma-component-snapshot.json',
    runUrl: 'https://github.com/BilLogic/plus-uno/actions/runs/1',
  });
  assert.match(body, /Button \/ appearance=primary, state=default/);
  assert.doesNotMatch(body, /Tag \/ tone=neutral, size=sm/);
  assert.doesNotMatch(body, /\b1 hash(es)? changed\b/i);

  // Workflow check: unchanged verdict gates out PR creation, and Compare passes --pr-body and --report-file
  const workflow = fs.readFileSync(path.join(REPO_ROOT, '.github/workflows/figma-snapshot-refresh.yml'), 'utf8');
  assert.match(workflow, /--pr-body/);
  assert.match(workflow, /--report-file/);
  assert.match(workflow, /if:\s*steps\.compare\.outputs\.verdict\s*!=\s*'unchanged'/);
  assert.doesNotMatch(workflow, /date-only/);
});

test('when changed components exceed the PR body limit, a linked committed report holds every name without truncation', () => {
  const manyRows = Array.from({ length: 40 }, (_, i) => ({
    key: `k${String(i).padStart(3, '0')}`,
    name: `variant=${String(i).padStart(3, '0')}`,
    description: '',
    nodeId: `100:${i}`,
    containingFrame: 'LargeSet',
  }));
  const beforeHashes = Object.fromEntries(manyRows.map((r) => [r.nodeId, 'old']));
  const afterHashes = Object.fromEntries(manyRows.map((r) => [r.nodeId, 'new']));
  const before = snapshotFrom({ rows: manyRows, versions: [], nodeHashes: beforeHashes, fileKey: DEFAULT_FILE_KEY, now: new Date('2026-11-16T00:00:00Z') });
  const after = snapshotFrom({ rows: manyRows, versions: [], nodeHashes: afterHashes, fileKey: DEFAULT_FILE_KEY, now: new Date('2026-11-18T00:00:00Z') });

  const { body, report } = buildRefreshPrOutput({
    before,
    after,
    verdict: 'changed',
    maxChars: 900,
    reportPath: 'scripts/figma-snapshot-changes.md',
    reportUrl: 'https://github.com/BilLogic/plus-uno/blob/chore/figma-snapshot-refresh/scripts/figma-snapshot-changes.md',
  });

  assert.ok(report, 'overflow produces a report file');
  assert.equal(report.path, 'scripts/figma-snapshot-changes.md');
  assert.ok(body.length <= 900, `PR body (${body.length}) fits within limit`);
  assert.match(body, /https:\/\/github\.com\/BilLogic\/plus-uno\/blob\/chore\/figma-snapshot-refresh\/scripts\/figma-snapshot-changes\.md/);
  assert.doesNotMatch(body, /and \d+ more/i);
  for (const row of manyRows) {
    assert.ok(report.content.includes(`LargeSet / ${row.name}`), `report includes ${row.name}`);
  }
});

test('the verdict CLI writes a PR body naming changed components, writes a report only on overflow, and skips both when unchanged', () => {
  const cli = path.join(REPO_ROOT, 'scripts/figma-snapshot-verdict.mjs');
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'verdict-pr-'));
  const beforePath = path.join(dir, 'before.json');
  const unchangedPath = path.join(dir, 'unchanged.json');
  const editedPath = path.join(dir, 'edited.json');
  const prBodyPath = path.join(dir, 'pr-body.md');
  const reportPath = path.join(dir, 'report.md');

  const today = new Date().toISOString();
  const baseSnap = snap(today);
  fs.writeFileSync(beforePath, JSON.stringify(baseSnap));
  fs.writeFileSync(
    unchangedPath,
    JSON.stringify({ ...baseSnap, lastChecked: new Date().toISOString(), versionIds: [{ id: 'v2' }] }),
  );
  fs.writeFileSync(editedPath, JSON.stringify({ ...baseSnap, nodeHashes: { '1:1': 'edited', '1:2': 'h2' } }));

  const outUnchanged = execFileSync('node', [cli, beforePath, unchangedPath, '--pr-body', prBodyPath, '--report-file', reportPath], {
    encoding: 'utf8',
  });
  assert.match(outUnchanged, /^verdict=unchanged\n/);
  assert.equal(fs.existsSync(prBodyPath), false, 'no PR body written when unchanged');
  assert.equal(fs.existsSync(reportPath), false, 'no report written when unchanged');

  // Overflow run writes both PR body (linked) and full report
  const manyRows = Array.from({ length: 30 }, (_, i) => ({
    key: `k${String(i).padStart(3, '0')}`,
    name: `variant=${String(i).padStart(3, '0')}`,
    description: '',
    nodeId: `200:${i}`,
    containingFrame: 'BigSet',
  }));
  const bigBefore = path.join(dir, 'big-before.json');
  const bigAfter = path.join(dir, 'big-after.json');
  fs.writeFileSync(bigBefore, JSON.stringify({ ...baseSnap, components: manyRows, nodeHashes: Object.fromEntries(manyRows.map((r) => [r.nodeId, 'a'])) }));
  fs.writeFileSync(bigAfter, JSON.stringify({ ...baseSnap, components: manyRows, nodeHashes: Object.fromEntries(manyRows.map((r) => [r.nodeId, 'b'])) }));

  const outBig = execFileSync(
    'node',
    [cli, bigBefore, bigAfter, '--pr-body', prBodyPath, '--report-file', reportPath, '--max-body-chars', '800'],
    { encoding: 'utf8' },
  );
  assert.match(outBig, /^verdict=changed\n/);
  assert.equal(fs.existsSync(reportPath), true, 'overflow writes report file');
  const bigReport = fs.readFileSync(reportPath, 'utf8');
  for (const row of manyRows) assert.ok(bigReport.includes(`BigSet / ${row.name}`));

  // Subsequent small edit removes stale reportPath and puts names inline
  const outChanged = execFileSync(
    'node',
    [cli, beforePath, editedPath, '--pr-body', prBodyPath, '--report-file', reportPath],
    { encoding: 'utf8' },
  );
  assert.match(outChanged, /^verdict=changed\n/);
  const body = fs.readFileSync(prBodyPath, 'utf8');
  assert.match(body, /A \/ a/);
  assert.doesNotMatch(body, /B \/ b/);
  assert.equal(fs.existsSync(reportPath), false, 'stale report file is removed when PR body fits inline');
});

/*
 * Real recorded REST captures (#2815). `scripts/fixtures/figma-snapshot-real/`
 * holds two captures of the published Core library, taken 75 s apart by the
 * script's own `figmaGet` (same endpoints, same 12 s node pacing, same 429
 * handling) from a temporary GitHub Actions workflow with the repo's
 * FIGMA_ACCESS_TOKEN, with no publish between them (the newest version id is
 * the same in both). Trimmed identically, offline:
 *   - `/components` keeps only the components of five sets (Page, AI message,
 *     the deprecated Jumbotron, AI sources, AI feedback): 19 of the library's
 *     components, every field as recorded.
 *   - `/nodes?geometry=paths` was fetched for those 19 nodes only, kept whole.
 *   - `/versions` is whole. Only personal or expiring fields were replaced with
 *     fixed placeholders: each `user` (handle, img_url, id; `/components` carries its creator too) and every
 *     `thumbnail_url` (signed, expiring CDN links), in `/versions` and
 *     `/components`. The script reads none of them besides `user.handle`.
 * Everything else, volatile values included, is as Figma answered. The
 * handwritten fixtures above stay as the unit cases.
 */
const realDir = path.join(path.dirname(fileURLToPath(import.meta.url)), 'fixtures', 'figma-snapshot-real');
const realCapture = (n) => {
  const read = (name) => JSON.parse(fs.readFileSync(path.join(realDir, `${name}-${n}.json`), 'utf8'));
  return { componentsResponse: read('components'), versionsResponse: read('versions'), nodesResponse: read('nodes') };
};

test('two real captures of the unchanged Core library come from one version and hash identically', async () => {
  const a = realCapture(1);
  const b = realCapture(2);

  // Same published library: the newest version is the same in both captures.
  assert.equal(a.versionsResponse.versions[0].id, b.versionsResponse.versions[0].id);
  assert.deepEqual(versionsFrom(a.versionsResponse), versionsFrom(b.versionsResponse));

  const rowsA = rowsFrom(a.componentsResponse);
  const rowsB = rowsFrom(b.componentsResponse);
  assert.ok(rowsA.length >= 15, 'the sample holds the five sets');
  assert.ok(setsIn(rowsA) >= 5);
  assert.deepEqual(rowsB, rowsA);

  const hashesFor = (rest, rows) =>
    fetchNodeHashes(rows, DEFAULT_FILE_KEY, 'tok', async () => rest.nodesResponse, 0);
  const hashA = await hashesFor(a, rowsA);
  const hashB = await hashesFor(b, rowsB);
  assert.deepEqual(hashA.failed, []);
  assert.deepEqual(hashB.failed, []);
  assert.equal(Object.keys(hashA.hashes).length, rowsA.length);
  assert.deepEqual(hashB.hashes, hashA.hashes);

  const now = new Date('2026-11-22T00:00:00Z');
  const snap = (rest, rows, hashes) =>
    snapshotFrom({ rows, versions: versionsFrom(rest.versionsResponse), nodeHashes: hashes, fileKey: DEFAULT_FILE_KEY, now });
  assert.equal(
    refreshVerdict(snap(a, rowsA, hashA.hashes), snap(b, rowsB, hashB.hashes), { now, maxAgeDays: 180 }).verdict,
    'unchanged',
  );
});
