#!/usr/bin/env node
/**
 * `npm run snapshot:figma-components` — refresh
 * `scripts/figma-component-snapshot.json` from the live Figma library, and do
 * nothing else.
 *
 * WHY THIS EXISTS WHEN `figma:poll` ALREADY FETCHES THE SAME LIST.
 * `poll-figma-library.js` is a NOTIFIER that happens to leave a snapshot
 * behind: a real run opens a Notion PRD and posts a Slack card before it
 * writes, and `--dry-run` (made honestly dry in #340) writes nothing at all. So
 * there was no way to say "just re-record what the library contains" — the two
 * available answers were "publish to two other systems" and "publish nothing,
 * including the file". That is why the snapshot sat at 2026-07-09 while the
 * poller itself moved into the Worker on 2026-07-16 (agents/uno-bot/src/
 * figma-poll.ts, snapshot in KV): the file's writer left, and the only
 * remaining way to rewrite it had side effects nobody wanted to trigger by
 * hand. This script is the missing half — same read, no publishing.
 *
 * WHAT IT CAPTURES, AND WHY IT MUST BE THIS ROUTE. `GET /v1/files/:key/
 * components` returns the components PUBLISHED to the file's library, which is
 * exactly what the snapshot holds and what the poller diffs. The Plugin API
 * (`use_figma`) can enumerate the file but not that set: it sees the canvas,
 * which on 2026-09-06 held 1,977 COMPONENT nodes and 171 COMPONENT_SETs against
 * the snapshot's 1,311 published variants, because the canvas includes
 * unpublished work, `_`-prefixed internals, the Archive page and a proposals
 * page. `node.getPublishStatusAsync()` does not close the gap either — a
 * variant inside a published set reports UNPUBLISHED, since the SET is the
 * published thing. And the one MCP tool that does list the published library,
 * `list_file_components_for_code_connect`, answers "You need a Dev or Full seat
 * on an Organization or Enterprise plan to use Code Connect." So a canvas dump
 * written into this file would not be a refresh; it would replace the poller's
 * baseline with a different population and make the next poll report several
 * hundred phantom additions, each one a Notion PRD and a Slack card.
 *
 * WHICH IS WHY IT REFUSES RATHER THAN IMPROVISES. With no `FIGMA_ACCESS_TOKEN`
 * it names what is missing and exits 1. A refresher that quietly wrote
 * something else would be worse than one that cannot run.
 *
 * A RATE LIMIT IS WAITED OUT, NOT A FAILURE (#898). The refresh runs itself
 * once per library publish, on the same Figma budget Bill's own tools use, so
 * a 429 is expected sooner or later. Each call waits out a 429 or a 5xx —
 * Figma's `Retry-After` when it sends one, else 5 s doubling — up to six tries
 * and half an hour of waiting across the run, and the ~27 node fetches (Tier 1,
 * the scarce tier) are paced at uno-bot's half of it, one every 12 s. A run
 * that still cannot finish writes nothing, as before, and exits 75
 * (EX_TEMPFAIL) rather than 1, so its workflow can say "Figma was busy" rather
 * than "something broke".
 *
 * Usage:
 *   npm run snapshot:figma-components               fetch and write the snapshot
 *   npm run snapshot:figma-components -- --dry-run  fetch, print the delta, write nothing
 *
 * Environment:
 *   FIGMA_ACCESS_TOKEN  a Figma REST personal token (required)
 *   FIGMA_FILE_KEY      defaults to the BS4 Foundation library key below
 */
import fs from 'node:fs';
import path from 'node:path';
import crypto from 'node:crypto';
import { fileURLToPath } from 'node:url';

import { ageInDays } from './figma-snapshots.mjs';
import { isEntry } from './lib/findings.mjs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(__dirname, '..');
const SNAPSHOT = 'scripts/figma-component-snapshot.json';

/** Design System - BS4 Foundation (Component Library). */
export const DEFAULT_FILE_KEY = 'zAecJNRdvJzAUOcjV32tRX';

/**
 * Non-DS component patterns to ignore — the same list `poll-figma-library.js`
 * filters by, because the two write the same file and a snapshot that includes
 * rows the poller drops reads to the poller as a mass deletion.
 */
export const IGNORED = [
  /^layout-blocks\//i,
  /^_/,
  /guidelines$/i,
  /^colors,/i,
  /^draft$/i,
];

export function isIgnored({ name = '', containingFrame = '' } = {}) {
  if (!containingFrame && !name) return true;
  return IGNORED.some((p) => p.test(name)) || IGNORED.some((p) => p.test(containingFrame));
}

/** Rows in published-key order, the one order the snapshot is written and compared in. */
const byKey = (a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0);

/**
 * `meta.components` from the REST response, in the snapshot's row shape,
 * sorted by published key. The API promises no order, and a snapshot written in
 * whatever order it answered would read as changed with nothing changed.
 */
export function rowsFrom(componentsResponse) {
  const components = componentsResponse?.meta?.components ?? [];
  return components
    .map((c) => ({
      key: c.key,
      name: c.name,
      description: c.description || '',
      nodeId: c.node_id,
      containingFrame: c.containing_frame?.name || '',
    }))
    .filter((c) => !isIgnored(c))
    .sort(byKey);
}

/**
 * Published versions only. Figma writes an autosave version every few minutes
 * with a null label; keeping those would make `versionIds` a clock rather than
 * a publish history.
 */
export function versionsFrom(versionsResponse) {
  return (versionsResponse?.versions ?? [])
    .slice(0, 30)
    .filter((v) => v.label || v.description)
    .slice(0, 10)
    .map((v) => ({
      id: v.id,
      label: v.label || '',
      description: v.description || '',
      createdAt: v.created_at,
      user: v.user?.handle || 'Unknown',
    }));
}

/** `{created, deleted, renamed}` between two row lists, by published key. */
export function diff(before = [], after = []) {
  const was = new Map(before.map((c) => [c.key, c]));
  const now = new Map(after.map((c) => [c.key, c]));
  const created = [...now.values()].filter((c) => !was.has(c.key));
  const deleted = [...was.values()].filter((c) => !now.has(c.key));
  const renamed = [...now.values()].filter((c) => {
    const old = was.get(c.key);
    return old && (old.name !== c.name || old.containingFrame !== c.containingFrame);
  });
  return { created, deleted, renamed };
}

/** Distinct `containingFrame` values — the library's component SETS. */
export function setsIn(rows) {
  return new Set(rows.map((c) => c.containingFrame).filter(Boolean)).size;
}

/**
 * The component SETS the delta touched, by name, sorted — what a reviewer of a
 * refresh reads first, since a variant rename arrives as dozens of rows but is
 * one set's change. A component that moved between sets names both. A
 * standalone component, with no containing frame, is named by itself.
 */
export function changedSets(before, after) {
  const { created, deleted, renamed } = diff(before, after);
  const was = new Map(before.map((c) => [c.key, c]));
  const setOf = (c) => c.containingFrame || c.name;
  const sets = new Set([...created, ...deleted, ...renamed].map(setOf));
  for (const c of renamed) sets.add(setOf(was.get(c.key)));
  return [...sets].sort();
}

/** A snapshot as a comparable string: `lastChecked` dropped, rows by key, object keys sorted. */
function comparable(snapshot) {
  const rest = { ...snapshot };
  delete rest.lastChecked;
  const rows = [...(rest.components ?? [])].sort(byKey);
  const sortKeys = (v) =>
    Array.isArray(v)
      ? v.map(sortKeys)
      : v && typeof v === 'object'
        ? Object.fromEntries(Object.keys(v).sort().map((k) => [k, sortKeys(v[k])]))
        : v;
  return JSON.stringify(sortKeys({ ...rest, components: rows }));
}

/**
 * What a refresh found, for the workflow that opens its PR.
 *
 * `changed` when anything but `lastChecked` differs. `date-only` when nothing
 * did but the snapshot on main is past half the age ceiling: `check:figma-
 * snapshots` fails at the ceiling, and a refresh that always discarded an
 * unchanged run's date could never clear it. `unchanged` otherwise. A date
 * that cannot be read, or that lies in the future, counts as old.
 */
export function refreshVerdict(before, after, { now, maxAgeDays }) {
  const ageDays = ageInDays(before.lastChecked, now);
  if (comparable(before) !== comparable(after)) return { verdict: 'changed', ageDays };
  if (ageDays === null || ageDays < 0 || ageDays > maxAgeDays / 2) return { verdict: 'date-only', ageDays };
  return { verdict: 'unchanged', ageDays };
}

/**
 * The snapshot document.
 *
 * `nodeHashes` is carried in the shape the poller wrote it — one md5 per node
 * document — so a visual change with no metadata change is still visible. It is
 * optional: with no hashes fetched, the previous ones are dropped rather than
 * left to describe nodes that have moved on.
 */
export function snapshotFrom({ rows, versions, nodeHashes, fileKey, now }) {
  return {
    lastChecked: now.toISOString(),
    figmaFileKey: fileKey,
    components: rows,
    versionIds: versions,
    nodeHashes: nodeHashes ?? {},
  };
}

/* ------------------------------------------------------------------ fetch */

/** Tries per call, the first included. */
export const MAX_ATTEMPTS = 6;
/** The first wait when Figma names none; each later one doubles. */
export const BASE_WAIT_MS = 5_000;
/** The longest single wait, whatever `Retry-After` asks. */
export const MAX_WAIT_MS = 5 * 60_000;
/** All the waiting one run may do, every call together. */
export const WAIT_BUDGET_MS = 30 * 60_000;
/** The gap between node fetches: uno-bot's half of Figma's Tier 1, five a
 *  minute (agents/uno-bot/src/figma/rest.ts `UNO_SHARE_PER_MINUTE`). */
export const NODES_SPACING_MS = 12_000;
/** The exit code for "Figma kept refusing": a temporary failure (EX_TEMPFAIL). */
export const EXIT_BUSY = 75;

/** Figma kept answering 429 or 5xx past the tries or the run's wait budget. */
export class FigmaBusyError extends Error {
  constructor(endpoint, status, waitedMs) {
    super(`Figma kept answering ${status} on ${endpoint}, after ${Math.round(waitedMs / 1000)} s of waiting this run`);
    this.name = 'FigmaBusyError';
    this.status = status;
    this.waitedMs = waitedMs;
  }
}

const sleepFor = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * How long to wait before the next try: Figma's `Retry-After` (seconds) when
 * it sends one, else 5 s doubling with each try; never more than five minutes.
 *
 * @param {number} attempt - The try that was refused, from 1
 * @param {string|null} retryAfter - The header, as sent
 */
export function backoffMs(attempt, retryAfter) {
  const seconds = retryAfter === null || retryAfter === undefined || retryAfter === '' ? NaN : Number(retryAfter);
  const ms = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : BASE_WAIT_MS * 2 ** (attempt - 1);
  return Math.min(ms, MAX_WAIT_MS);
}

/** A run's shared wait budget: what every call has waited so far, and the cap. */
export function waitBudget(maxMs = WAIT_BUDGET_MS) {
  return { waitedMs: 0, maxMs };
}

/**
 * One Figma REST read that waits out a 429 or a 5xx rather than failing on it.
 * Any other refusal throws at once, as it always did.
 *
 * @param {string} endpoint - The path after /v1
 * @param {string} token - The Figma token
 * @param {object} [opts]
 * @param {typeof fetch} [opts.fetchImpl]
 * @param {(ms: number) => Promise<void>} [opts.sleep]
 * @param {{waitedMs: number, maxMs: number}} [opts.budget] - Shared across a run's calls
 * @param {(line: string) => void} [opts.log]
 * @throws {FigmaBusyError} When the tries or the budget run out
 */
export async function figmaGet(endpoint, token, { fetchImpl = fetch, sleep = sleepFor, budget = waitBudget(), log = console.warn } = {}) {
  for (let attempt = 1; ; attempt += 1) {
    const res = await fetchImpl(`https://api.figma.com/v1${endpoint}`, {
      headers: { 'X-Figma-Token': token },
    });
    if (res.ok) return res.json();
    const detail = (await res.text().catch(() => '')).slice(0, 200);
    if (res.status !== 429 && res.status < 500) {
      throw new Error(`Figma API ${res.status} on ${endpoint}: ${detail}`);
    }
    const wait = backoffMs(attempt, res.headers.get('retry-after'));
    if (attempt >= MAX_ATTEMPTS || budget.waitedMs + wait > budget.maxMs) {
      throw new FigmaBusyError(endpoint, res.status, budget.waitedMs);
    }
    log(`  … Figma said ${res.status} on ${endpoint}; waiting ${Math.round(wait / 1000)} s (try ${attempt + 1} of ${MAX_ATTEMPTS})`);
    budget.waitedMs += wait;
    await sleep(wait);
  }
}

/**
 * Hash every component's node, in chunks.
 *
 * Returns the hashes AND the chunks that failed. A failed chunk used to be a
 * warning and nothing else, and the caller wrote the partial map as the
 * snapshot — so one rate-limited request produced a file that is structurally
 * valid, dated today, and missing up to 50 hashes, which then BECOMES the
 * baseline every later drift comparison reads. The components in it afterwards
 * compare as having no recorded hash, from a run whose only symptom was one
 * line in scrollback.
 *
 * A retry first, because the failure this guards is usually transient; then the
 * caller decides, and it refuses to write. A rate limit is waited out inside
 * `get` (`figmaGet`), so a chunk it gave up on is not tried a second time.
 * `paceMs` spaces the chunks, Tier 1 calls all of them.
 */
export async function fetchNodeHashes(rows, fileKey, token, get = figmaGet, pauseMs = 2000, { paceMs = 0, sleep = sleepFor } = {}) {
  const hashes = {};
  const failed = [];
  for (let i = 0; i < rows.length; i += 50) {
    if (i > 0 && paceMs > 0) await sleep(paceMs);
    const chunk = rows.slice(i, i + 50);
    const ids = chunk.map((c) => c.nodeId).filter(Boolean).join(',');
    if (!ids) continue;
    let lastError;
    for (let attempt = 0; attempt < 2; attempt += 1) {
      try {
        const result = await get(`/files/${fileKey}/nodes?ids=${ids}&geometry=paths`, token);
        for (const [nodeId, node] of Object.entries(result.nodes ?? {})) {
          if (!node?.document) continue;
          hashes[nodeId] = crypto.createHash('md5').update(JSON.stringify(node.document)).digest('hex');
        }
        lastError = undefined;
        break;
      } catch (e) {
        lastError = e;
        // The backoff already spent its tries on a rate limit; a second round
        // would only spend the run's budget again.
        if (e instanceof FigmaBusyError) break;
        if (attempt === 0) {
          console.warn(`  ! node hashes for one chunk failed (${e.message}) — retrying once`);
          if (pauseMs > 0) await sleep(pauseMs);
        }
      }
    }
    if (lastError) {
      failed.push({ from: i, count: chunk.length, message: lastError.message, busy: lastError instanceof FigmaBusyError });
      console.warn(`  ! node hashes for components ${i}-${i + chunk.length - 1} failed: ${lastError.message}`);
    }
  }
  return { hashes, failed };
}

/* -------------------------------------------------------------------- cli */

export const MISSING_TOKEN =
  'FIGMA_ACCESS_TOKEN is not set. This snapshot records the components PUBLISHED to the\n' +
  'library, and only the REST API reports that set — the Figma MCP sees the canvas, and\n' +
  "Code Connect's listing needs an Organization/Enterprise seat this account does not have.\n" +
  'Set FIGMA_ACCESS_TOKEN (a Figma REST personal token; see docs/connectors/figma.md) and\n' +
  're-run. Nothing was written.';

async function main() {
  const dryRun = process.argv.slice(2).includes('--dry-run');
  const token = process.env.FIGMA_ACCESS_TOKEN;
  const fileKey = process.env.FIGMA_FILE_KEY || DEFAULT_FILE_KEY;
  const snapshotPath = path.join(REPO_ROOT, SNAPSHOT);
  const previous = JSON.parse(fs.readFileSync(snapshotPath, 'utf8'));

  if (!token) {
    console.error(`[snapshot:figma-components] ${MISSING_TOKEN}`);
    console.error(
      `\nThe file on disk holds ${previous.components.length} components in ` +
        `${setsIn(previous.components)} sets, last checked ${previous.lastChecked}.`,
    );
    process.exit(1);
  }

  // One wait budget for the whole run: every call's backoff draws on it.
  const budget = waitBudget();
  const get = (endpoint, tok) => figmaGet(endpoint, tok, { budget });
  let rows;
  let versions;
  try {
    rows = rowsFrom(await get(`/files/${fileKey}/components`, token));
    versions = versionsFrom(await get(`/files/${fileKey}/versions`, token));
  } catch (e) {
    if (!(e instanceof FigmaBusyError)) throw e;
    console.error(`[snapshot:figma-components] ${e.message}. Nothing was written; re-run when Figma answers.`);
    process.exit(EXIT_BUSY);
  }
  const { created, deleted, renamed } = diff(previous.components, rows);

  console.log(
    `[snapshot:figma-components] ${rows.length} published components in ${setsIn(rows)} sets ` +
      `(on disk: ${previous.components.length} in ${setsIn(previous.components)}, ` +
      `last checked ${previous.lastChecked}).`,
  );
  console.log(`  +${created.length} added · -${deleted.length} removed · ~${renamed.length} renamed`);
  const sets = changedSets(previous.components, rows);
  console.log(`  sets changed: ${sets.length ? sets.join(', ') : 'none'}`);

  if (dryRun) {
    console.log('\n--dry-run: nothing written.');
    return;
  }

  const { hashes: nodeHashes, failed } = await fetchNodeHashes(rows, fileKey, token, get, 2000, { paceMs: NODES_SPACING_MS });
  if (failed.length) {
    // NOTHING IS WRITTEN. A snapshot is the baseline, so a partial one is worse
    // than an old one: the old file is visibly out of date and says so, while a
    // partial file looks current and silently drops the components it lost.
    const missing = failed.reduce((n, f) => n + f.count, 0);
    console.error(
      `\n[snapshot:figma-components] ${failed.length} chunk(s) covering up to ${missing} ` +
        'component(s) could not be hashed, after a retry each:',
    );
    for (const f of failed) console.error(`  components ${f.from}-${f.from + f.count - 1}: ${f.message}`);
    console.error(
      'Nothing was written. A snapshot missing hashes becomes a baseline that reads those\n' +
        'components as having none, so it is refused rather than recorded. Re-run when the\n' +
        'API is answering; the file on disk is unchanged and still says when it was captured.',
    );
    process.exit(failed.some((f) => f.busy) ? EXIT_BUSY : 1);
  }
  const snapshot = snapshotFrom({ rows, versions, nodeHashes, fileKey, now: new Date() });
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`\nWrote ${SNAPSHOT}. Next: npm run check:figma-snapshots`);
}

if (isEntry(import.meta.url)) {
  await main();
}
