#!/usr/bin/env node
/**
 * `npm run snapshot:figma-components` — refresh
 * `scripts/figma-component-snapshot.json` from the live Figma library, and do
 * nothing else: it reads Figma REST and publishes nowhere. The CI refresh
 * (`.github/workflows/figma-snapshot-refresh.yml`) runs it and opens a draft PR
 * with the result.
 *
 * WHAT IT CAPTURES, AND WHY IT MUST BE THIS ROUTE. `GET /v1/files/:key/
 * components` returns the components PUBLISHED to the file's library, which is
 * exactly what the snapshot holds. The Plugin API
 * (`use_figma`) can enumerate the file but not that set: it sees the canvas,
 * which on 2026-09-06 held 1,977 COMPONENT nodes and 171 COMPONENT_SETs against
 * the snapshot's 1,311 published variants, because the canvas includes
 * unpublished work, `_`-prefixed internals, the Archive page and a proposals
 * page. `node.getPublishStatusAsync()` does not close the gap either — a
 * variant inside a published set reports UNPUBLISHED, since the SET is the
 * published thing. And the one MCP tool that does list the published library,
 * `list_file_components_for_code_connect`, answers "You need a Dev or Full seat
 * on an Organization or Enterprise plan to use Code Connect." So a canvas dump
 * written into this file would not be a refresh; it would replace the baseline
 * with a different population and make the next refresh report several hundred
 * phantom additions.
 *
 * WHICH IS WHY IT REFUSES RATHER THAN IMPROVISES. With no `FIGMA_ACCESS_TOKEN`
 * it names what is missing and exits 1. A refresher that quietly wrote
 * something else would be worse than one that cannot run.
 *
 * A RATE LIMIT IS WAITED OUT, NOT A FAILURE (#898). The refresh runs itself
 * once per library publish, on the same Figma budget Bill's own tools use, so
 * a 429 is expected sooner or later. Each call retries a 429 or a 5xx the way
 * the Worker's Figma client does (agents/uno-bot/src/figma/rest.ts): three
 * tries, each wait at least Figma's `Retry-After` and at least 1 s doubling,
 * and a wait the run cannot afford — half an hour across every call — fails
 * at once rather than retrying early into the same limit. The 38 node fetches
 * (1,891 components in chunks of 50; Tier 1, the scarce tier) are paced at
 * uno-bot's half of it, one every 12 s, and the first chunk Figma keeps
 * refusing ends them. A run that cannot finish writes nothing, as before, and
 * exits 75 (EX_TEMPFAIL) rather than 1, so its workflow can say "Figma was
 * busy" rather than "something broke".
 *
 * WHY NOT IMPORT rest.ts. It is TypeScript in the Worker's own package, its
 * imports are extensionless, and it meters every call against a Worker
 * invocation's subrequest budget (`countedFetch`). The workflow runs this file
 * on bare Node with no install, so the policy is restated here and its pace is
 * held to the Worker's `SNAPSHOT_REFRESH_PER_MINUTE` by a test.
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
 * Non-DS component patterns to ignore: a snapshot that includes rows the
 * library's own components list leaves out reads as a mass deletion on the next
 * refresh.
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

/** Sort object keys recursively at every depth so key order never affects diffs or hashes. */
export function sortKeys(value) {
  if (Array.isArray(value)) return value.map(sortKeys);
  if (value && typeof value === 'object') {
    const out = {};
    for (const key of Object.keys(value).sort()) {
      if (value[key] !== undefined) out[key] = sortKeys(value[key]);
    }
    return out;
  }
  return value;
}

export function canonicalJson(value) {
  return JSON.stringify(sortKeys(value));
}

/** Round coordinates/transforms to 4 decimals and normalize -0 to 0 to suppress float noise. */
function roundNumber(value) {
  if (typeof value !== 'number' || !Number.isFinite(value)) return value;
  const rounded = Math.round(value * 1e4) / 1e4;
  return rounded === 0 ? 0 : rounded;
}

function projectTransform(matrix) {
  if (!Array.isArray(matrix)) return undefined;
  return matrix.map((row) => (Array.isArray(row) ? row.map(roundNumber) : row));
}

function normalizeSvgPath(pathStr) {
  const tokens = String(pathStr).match(/[a-zA-Z]|-?(?:\d+\.?\d*|\.\d+)(?:e[+-]?\d+)?/g);
  if (!tokens) return '';
  return tokens
    .map((tok) => {
      if (/^[a-zA-Z]$/.test(tok)) return tok;
      const n = Number(tok);
      return Number.isFinite(n) ? String(roundNumber(n)) : tok;
    })
    .join(' ');
}

function projectGeometry(geometryList) {
  if (!Array.isArray(geometryList) || geometryList.length === 0) return undefined;
  return geometryList.map((item) => {
    const out = {};
    if (item?.path !== undefined) out.path = normalizeSvgPath(item.path);
    if (item?.windingRule !== undefined) out.windingRule = item.windingRule;
    return out;
  });
}

/**
 * Design-relevant fields on a Figma REST node document. Everything outside this
 * allowlist — `id`, `pluginData`, `sharedPluginData`, `devStatus`, `annotations`,
 * canvas `absoluteBoundingBox` x/y, `absoluteRenderBounds`, `overrideID`,
 * `componentId`, `overrides`, and any future volatile keys — is dropped so
 * unchanged components hash identically across fetches.
 */
const DESIGN_NODE_FIELDS = [
  // structure & identity
  'type',
  'name',
  'clipsContent',
  'isMask',
  'maskType',
  'booleanOperation',
  'blendMode',
  'opacity',
  'arcData',
  // component properties & variant values
  'componentPropertyDefinitions',
  'componentProperties',
  'componentPropertyReferences',
  'variantProperties',
  // layout & sizing
  'constraints',
  'layoutMode',
  'layoutWrap',
  'primaryAxisSizingMode',
  'counterAxisSizingMode',
  'primaryAxisAlignItems',
  'counterAxisAlignItems',
  'counterAxisAlignContent',
  'paddingLeft',
  'paddingRight',
  'paddingTop',
  'paddingBottom',
  'itemSpacing',
  'counterAxisSpacing',
  'itemReverseZIndex',
  'strokesIncludedInLayout',
  'layoutAlign',
  'layoutGrow',
  'layoutPositioning',
  'layoutSizingHorizontal',
  'layoutSizingVertical',
  'minWidth',
  'maxWidth',
  'minHeight',
  'maxHeight',
  'gridRowCount',
  'gridColumnCount',
  'gridRowGap',
  'gridColumnGap',
  'gridRowSizing',
  'gridColumnSizing',
  'cornerRadius',
  'rectangleCornerRadii',
  'cornerSmoothing',
  'topLeftRadius',
  'topRightRadius',
  'bottomLeftRadius',
  'bottomRightRadius',
  // fills & strokes
  'fills',
  'background',
  'strokes',
  'strokeWeight',
  'strokeAlign',
  'strokeCap',
  'strokeJoin',
  'strokeDashes',
  'strokeMiterAngle',
  'individualStrokeWeights',
  // effects
  'effects',
  // text
  'characters',
  'style',
  'characterStyleOverrides',
  'styleOverrideTable',
  'lineTypes',
  'lineIndentations',
  'textAutoResize',
  'textTruncation',
  'maxLines',
  // style & variable bindings
  'styles',
  'boundVariables',
  'explicitVariableModes',
];

/**
 * Canonical projection of a Figma node document, recursing through `children`.
 * Root canvas placement (`absoluteBoundingBox` x/y, root `relativeTransform`)
 * is ignored, while child placement relative to its parent and canonical local
 * vector geometry (`fillGeometry` / `strokeGeometry`) are preserved.
 */
export function projectNode(node, parent = null) {
  if (!node || typeof node !== 'object') return node;
  const projected = {};
  for (const field of DESIGN_NODE_FIELDS) {
    if (node[field] !== undefined) projected[field] = node[field];
  }
  if (typeof node.rotation === 'number') {
    projected.rotation = roundNumber(node.rotation);
  }
  if (node.visible === false) projected.visible = false;
  if (node.size && typeof node.size.x === 'number' && typeof node.size.y === 'number') {
    projected.size = { x: roundNumber(node.size.x), y: roundNumber(node.size.y) };
  } else if (
    node.absoluteBoundingBox &&
    typeof node.absoluteBoundingBox.width === 'number' &&
    typeof node.absoluteBoundingBox.height === 'number'
  ) {
    projected.size = {
      x: roundNumber(node.absoluteBoundingBox.width),
      y: roundNumber(node.absoluteBoundingBox.height),
    };
  }
  if (parent !== null) {
    if (Array.isArray(node.relativeTransform)) {
      projected.relativeTransform = projectTransform(node.relativeTransform);
    }
    if (
      node.absoluteBoundingBox &&
      parent.absoluteBoundingBox &&
      typeof node.absoluteBoundingBox.x === 'number' &&
      typeof node.absoluteBoundingBox.y === 'number' &&
      typeof parent.absoluteBoundingBox.x === 'number' &&
      typeof parent.absoluteBoundingBox.y === 'number'
    ) {
      projected.relativePosition = {
        x: roundNumber(node.absoluteBoundingBox.x - parent.absoluteBoundingBox.x),
        y: roundNumber(node.absoluteBoundingBox.y - parent.absoluteBoundingBox.y),
      };
    }
  }
  const fillGeom = projectGeometry(node.fillGeometry);
  if (fillGeom) projected.fillGeometry = fillGeom;
  const strokeGeom = projectGeometry(node.strokeGeometry);
  if (strokeGeom) projected.strokeGeometry = strokeGeom;
  if (Array.isArray(node.children)) {
    projected.children = node.children.map((child) => projectNode(child, node));
  }
  return sortKeys(projected);
}

/** Deterministic MD5 over the canonical projection of a Figma node document. */
export function hashNodeDocument(doc) {
  return crypto.createHash('md5').update(canonicalJson(projectNode(doc))).digest('hex');
}

/** Readable display name for a snapshot component row. */
export function componentLabel(component) {
  if (!component) return '';
  if (component.containingFrame && component.containingFrame !== component.name) {
    return component.name ? `${component.containingFrame} / ${component.name}` : component.containingFrame;
  }
  return component.name || component.containingFrame || component.nodeId || component.key || '';
}

/**
 * Every component that changed between `before` and `after` — added, removed,
 * renamed, metadata-edited, or visually/property-edited via `nodeHashes`.
 */
export function changedComponents(before = {}, after = {}) {
  const beforeRows = before?.components ?? [];
  const afterRows = after?.components ?? [];
  const beforeHashes = before?.nodeHashes ?? {};
  const afterHashes = after?.nodeHashes ?? {};

  const was = new Map(beforeRows.map((c) => [c.key, c]));
  const now = new Map(afterRows.map((c) => [c.key, c]));

  const added = afterRows.filter((c) => !was.has(c.key));
  const removed = beforeRows.filter((c) => !now.has(c.key));
  const renamed = [];
  const metadata = [];
  const hashed = [];
  const coveredNodeIds = new Set([...added, ...removed].map((c) => c.nodeId).filter(Boolean));

  for (const cur of afterRows) {
    const old = was.get(cur.key);
    if (!old) continue;
    if (old.nodeId) coveredNodeIds.add(old.nodeId);
    if (cur.nodeId) coveredNodeIds.add(cur.nodeId);

    const isRenamed = old.name !== cur.name || old.containingFrame !== cur.containingFrame;
    const isMeta = old.description !== cur.description || old.nodeId !== cur.nodeId;
    const isHashChanged = beforeHashes[old.nodeId] !== afterHashes[cur.nodeId];

    if (isRenamed) renamed.push({ old, current: cur });
    else if (isMeta) metadata.push({ old, current: cur });
    if (isHashChanged) hashed.push(cur);
  }

  const allHashNodeIds = new Set([...Object.keys(beforeHashes), ...Object.keys(afterHashes)]);
  for (const nodeId of allHashNodeIds) {
    if (coveredNodeIds.has(nodeId)) continue;
    if (beforeHashes[nodeId] !== afterHashes[nodeId]) {
      hashed.push({ nodeId, name: nodeId, containingFrame: '' });
    }
  }

  const names = new Set([
    ...added.map(componentLabel),
    ...removed.map(componentLabel),
    ...renamed.map((r) => componentLabel(r.current)),
    ...metadata.map((m) => componentLabel(m.current)),
    ...hashed.map(componentLabel),
  ]);
  names.delete('');

  return {
    added,
    removed,
    renamed,
    metadata,
    hashed,
    names: [...names].sort(),
  };
}

export const MAX_PR_BODY_CHARS = 45_000;
export const DEFAULT_REPORT_PATH = 'scripts/figma-snapshot-changes.md';

/**
 * Build the refresh PR description and, when the full changed-component list
 * exceeds `maxChars`, a committed markdown report holding every changed name
 * without truncation.
 */
export function buildRefreshPrOutput({
  before,
  after,
  deltaLog = '',
  branch = 'chore/figma-snapshot-refresh',
  snapshotPath = SNAPSHOT,
  runUrl = '',
  maxChars = MAX_PR_BODY_CHARS,
  reportPath = DEFAULT_REPORT_PATH,
  reportUrl = '',
}) {
  const changes = changedComponents(before, after);

  const assembleBody = (componentLines) => {
    const lines = [`Refreshes \`${snapshotPath}\` from the published Figma library.`, ''];
    lines.push('## Changed components', '');
    lines.push(...componentLines, '');

    if (deltaLog.trim()) {
      const trimmed = deltaLog.trim();
      lines.push('## Delta', '');
      if (trimmed.startsWith('```')) {
        lines.push(trimmed);
      } else {
        lines.push('```', trimmed, '```');
      }
      lines.push('');
    }

    lines.push(
      '## Before merging',
      '',
      'This PR was opened by the workflow\'s `GITHUB_TOKEN`, and GitHub starts no other workflow from that token\'s events, so **the pull_request checks have not run**. To run them, close this PR and reopen it. Mark it ready for review once they pass.',
      '',
      `Each later run force-pushes \`${branch}\` and rewrites this description, and its checks need another close and reopen. A later run that finds no change closes this PR.`,
    );

    if (runUrl) {
      lines.push('', `Opened by [Refresh Figma Component Snapshot](${runUrl}).`);
    }

    return `${lines.join('\n')}\n`;
  };

  const inlineLines = changes.names.length
    ? changes.names.map((name) => `- \`${name}\``)
    : ['No component changes.'];
  const fullBody = assembleBody(inlineLines);

  if (fullBody.length <= maxChars || changes.names.length === 0) {
    return { body: fullBody, report: null };
  }

  const target = reportUrl || reportPath;
  const linkedLines = [
    `${changes.names.length} changed component(s) exceed the PR description limit; see the [full changed-component report](${target}).`,
  ];
  const reportContent = [
    '# Figma Component Snapshot — Changed Components',
    '',
    `${changes.names.length} changed component(s) in \`${snapshotPath}\`:`,
    '',
    ...changes.names.map((name) => `- \`${name}\``),
    '',
  ].join('\n');

  return {
    body: assembleBody(linkedLines),
    report: { path: reportPath, content: reportContent },
  };
}

/** Build the refresh PR description string. */
export function buildRefreshPrBody(opts) {
  return buildRefreshPrOutput(opts).body;
}

/**
 * A snapshot as a comparable string: `lastChecked` and `versionIds` dropped,
 * rows by key, object keys sorted. Neither timestamp moves nor publish-history
 * additions without component/hash changes open a PR.
 */
function comparable(snapshot) {
  const rest = { ...snapshot };
  delete rest.lastChecked;
  delete rest.versionIds;
  const rows = [...(rest.components ?? [])].sort(byKey);
  return canonicalJson({ ...rest, components: rows });
}

/**
 * What a refresh found, for the workflow that opens its PR.
 *
 * `changed` only when component rows, `nodeHashes`, or `figmaFileKey` differ;
 * `unchanged` otherwise (including timestamp-only and publish-history-only runs).
 */
export function refreshVerdict(before, after, { now } = {}) {
  const ageDays = ageInDays(before.lastChecked, now);
  if (comparable(before) !== comparable(after)) return { verdict: 'changed', ageDays };
  return { verdict: 'unchanged', ageDays };
}

/**
 * The snapshot document.
 *
 * `nodeHashes` is carried in the shape the earlier snapshots carry — one md5 per node
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

/** Tries per call, the first included: rest.ts `DEFAULT_ATTEMPTS`. */
export const MAX_ATTEMPTS = 3;
/** The first retry's least wait; each later one doubles (rest.ts `BACKOFF_MS`). */
export const BASE_WAIT_MS = 1_000;
/** All the waiting one run may do, every call together. */
export const WAIT_BUDGET_MS = 30 * 60_000;
/** The gap between node fetches: five a minute, uno-bot's half of Figma's
 *  Tier 1 (rest.ts `SNAPSHOT_REFRESH_PER_MINUTE`, held equal by a test). */
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
 * How long to wait before the next try: at least Figma's `Retry-After`
 * (seconds) and at least 1 s doubling with each try, as rest.ts waits. Never
 * capped: a long `Retry-After` is what Figma needs, and retrying before it
 * only spends a try on the same refusal.
 *
 * @param {number} attempt - The try that was refused, from 1
 * @param {string|null} retryAfter - The header, as sent
 */
export function backoffMs(attempt, retryAfter) {
  const seconds = retryAfter === null || retryAfter === undefined || retryAfter === '' ? NaN : Number(retryAfter);
  const asked = Number.isFinite(seconds) && seconds >= 0 ? seconds * 1000 : 0;
  return Math.max(asked, BASE_WAIT_MS * 2 ** (attempt - 1));
}

/** A run's shared wait budget: what every call has waited so far, and the cap. */
export function waitBudget(maxMs = WAIT_BUDGET_MS) {
  return { waitedMs: 0, maxMs };
}

/**
 * One Figma REST read that waits out a 429 or a 5xx rather than failing on it.
 * Any other refusal throws at once, as it always did. A wait past the tries or
 * past what the run's budget has left throws now, without sleeping: a
 * `Retry-After` of an hour fails now, not in an hour.
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
 * `get` (`figmaGet`), so a chunk it gave up on is not tried a second time, and
 * no later chunk is tried at all. `paceMs` spaces the chunks, Tier 1 calls all
 * of them.
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
          hashes[nodeId] = hashNodeDocument(node.document);
        }
        lastError = undefined;
        break;
      } catch (e) {
        lastError = e;
        // `get` already spent its tries on a rate limit; a second round would
        // only spend the run's budget again.
        if (e instanceof FigmaBusyError) break;
        if (attempt === 0) {
          console.warn(`  ! node hashes for one chunk failed (${e.message}) — retrying once`);
          if (pauseMs > 0) await sleep(pauseMs);
        }
      }
    }
    if (lastError) {
      const busy = lastError instanceof FigmaBusyError;
      failed.push({ from: i, count: chunk.length, message: lastError.message, busy });
      console.warn(`  ! node hashes for components ${i}-${i + chunk.length - 1} failed: ${lastError.message}`);
      // Figma is rate-limiting this token: every chunk after this one would
      // be one more Tier 1 call into the same limit, and the run writes
      // nothing whatever they return.
      if (busy) {
        const rest = rows.length - (i + chunk.length);
        if (rest > 0) failed.push({ from: i + chunk.length, count: rest, message: 'not fetched: Figma was rate-limiting', busy });
        break;
      }
    }
  }
  return { hashes, failed };
}

/* -------------------------------------------------------------------- cli */

export const MISSING_TOKEN =
  'FIGMA_ACCESS_TOKEN is not set. This snapshot records the components PUBLISHED to the\n' +
  'library, and only the REST API reports that set — the Figma MCP sees the canvas, and\n' +
  "Code Connect's listing needs an Organization/Enterprise seat this account does not have.\n" +
  'Set FIGMA_ACCESS_TOKEN (a Figma REST personal token; see docs/connectors/figma/overview.md) and\n' +
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
