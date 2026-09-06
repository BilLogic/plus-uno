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

/** `meta.components` from the REST response, in the snapshot's row shape. */
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
    .filter((c) => !isIgnored(c));
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

async function figmaGet(endpoint, token) {
  const res = await fetch(`https://api.figma.com/v1${endpoint}`, {
    headers: { 'X-Figma-Token': token },
  });
  if (!res.ok) {
    throw new Error(`Figma API ${res.status} on ${endpoint}: ${(await res.text()).slice(0, 200)}`);
  }
  return res.json();
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
 * caller decides, and it refuses to write.
 */
export async function fetchNodeHashes(rows, fileKey, token, get = figmaGet, pauseMs = 2000) {
  const hashes = {};
  const failed = [];
  for (let i = 0; i < rows.length; i += 50) {
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
        if (attempt === 0) {
          console.warn(`  ! node hashes for one chunk failed (${e.message}) — retrying once`);
          if (pauseMs > 0) await new Promise((r) => setTimeout(r, pauseMs));
        }
      }
    }
    if (lastError) {
      failed.push({ from: i, count: chunk.length, message: lastError.message });
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

  const rows = rowsFrom(await figmaGet(`/files/${fileKey}/components`, token));
  const versions = versionsFrom(await figmaGet(`/files/${fileKey}/versions`, token));
  const { created, deleted, renamed } = diff(previous.components, rows);

  console.log(
    `[snapshot:figma-components] ${rows.length} published components in ${setsIn(rows)} sets ` +
      `(on disk: ${previous.components.length} in ${setsIn(previous.components)}, ` +
      `last checked ${previous.lastChecked}).`,
  );
  console.log(`  +${created.length} added · -${deleted.length} removed · ~${renamed.length} renamed`);

  if (dryRun) {
    console.log('\n--dry-run: nothing written.');
    return;
  }

  const { hashes: nodeHashes, failed } = await fetchNodeHashes(rows, fileKey, token);
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
    process.exit(1);
  }
  const snapshot = snapshotFrom({ rows, versions, nodeHashes, fileKey, now: new Date() });
  fs.writeFileSync(snapshotPath, JSON.stringify(snapshot, null, 2) + '\n');
  console.log(`\nWrote ${SNAPSHOT}. Next: npm run check:figma-snapshots`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  await main();
}
