// Figma library poll — the v1 `scripts/poll-figma-library.js` automation,
// ported into the Worker as a cron feature (the `figma-library-poll.yml`
// GitHub Action was removed 2026-07-09 with PR #38; restored here 2026-07-16).
//
// Every firing: fetch the DS file's components + published versions from the
// Figma REST API, diff against the snapshot in KV, and when something changed
// post the same "🎨 Figma Design System Updated" card to #uno-bot that v1
// posted — PRD link included — so designers can reply `implement <component>`
// in the thread (extractPrdFromThreadRoot walks back to this message).
//
// Free-tier subrequest math (50/invocation — see wrangler.toml):
//   quiet run: KV get + components + versions + KV put            = 4
//   change run: + images (1) + Notion PRD (1) + Slack post (1)    = 7
//   visual-hash check (version published, zero metadata diff):
//     ceil(1311 components / 50 ids per call) ≈ 27 node fetches   ≈ 33
//   The v1 "no stored hashes → fetch a baseline from the previous version"
//   path would DOUBLE the node fetches (~60 > 50), so that path is replaced:
//   missing hashes → store current hashes now, diff on the NEXT publish.

import type { Env } from "./types";
import { fetchWithTimeout } from "./http";
import { postMessage } from "./slack/api";
import { notionCreate, type CreatedPrd } from "./integrations/notion";

const FIGMA_API = "https://api.figma.com";
const FETCH_TIMEOUT_MS = 15000;
const RETRIES = 2;
const RETRY_DELAY_MS = 1000;
/** Node-ids per /nodes request (URL-length bound, same as v1). */
const HASH_CHUNK_SIZE = 50;
/** Hard cap on /nodes calls per run so one poll can never blow the 50-subrequest budget. */
const MAX_HASH_REQUESTS = 32;
/** Simultaneous Figma fetches (Workers allow 6 open connections; leave headroom). */
const HASH_CONCURRENCY = 4;
/** Snapshot lives in HARNESS_KV under its own prefix — no dedicated namespace
 *  needed for one ~400KB value (25MB KV cap; 96 writes/day vs 1000/day free). */
const SNAPSHOT_KV_KEY = "figma-poll:snapshot";

// ─── Snapshot shapes (KV mirror of v1's scripts/figma-component-snapshot.json) ──

interface SnapshotComponent {
  key: string;
  name: string;
  description: string;
  nodeId: string;
  containingFrame: string;
}

interface Snapshot {
  lastChecked: string;
  components: SnapshotComponent[];
  versionIds: string[];
  nodeHashes: Record<string, string>;
}

interface VersionInfo {
  id: string;
  label: string;
  description: string;
  createdAt: string;
  user: string;
}

interface ComponentDiff {
  created: SnapshotComponent[];
  modified: { old: SnapshotComponent; new: SnapshotComponent }[];
  deleted: SnapshotComponent[];
}

export interface PollResult {
  ran: boolean;
  summary: string;
  created?: number;
  modified?: number;
  deleted?: number;
  newVersions?: number;
  prdUrl?: string;
  slackPosted?: boolean;
}

// ─── Figma REST (retry on 429/5xx, same policy as v1) ───────────────────────

async function figmaGet<T>(env: Env, endpoint: string): Promise<T> {
  let lastErr = "";
  for (let attempt = 0; attempt <= RETRIES; attempt++) {
    if (attempt > 0) await new Promise((r) => setTimeout(r, RETRY_DELAY_MS));
    try {
      const res = await fetchWithTimeout(`${FIGMA_API}/v1${endpoint}`, {
        headers: { "X-Figma-Token": env.FIGMA_ACCESS_TOKEN },
      }, FETCH_TIMEOUT_MS);
      if (res.ok) return (await res.json()) as T;
      lastErr = `Figma API ${res.status}: ${(await res.text()).slice(0, 200)}`;
      if (res.status !== 429 && res.status < 500) break; // non-retryable
    } catch (err) {
      lastErr = err instanceof Error ? err.message : String(err);
    }
  }
  throw new Error(lastErr || "Figma API request failed");
}

// ─── Component filtering (v1's non-DS ignore list, verbatim) ────────────────

const IGNORED_COMPONENT_PATTERNS = [
  /^layout-blocks\//i, // Figma grid helper components
  /^_/, //                 internal/deprecated (e.g. _Obsoleted Input)
  /guidelines$/i, //       documentation frames (e.g. Spacing Token Guidelines)
  /^colors,/i, //          color documentation
  /^draft$/i, //           work-in-progress items
];

function isIgnoredComponent(c: SnapshotComponent): boolean {
  if (!c.containingFrame && !c.name) return true;
  if (IGNORED_COMPONENT_PATTERNS.some((p) => p.test(c.name))) return true;
  if (IGNORED_COMPONENT_PATTERNS.some((p) => p.test(c.containingFrame))) return true;
  return false;
}

interface FigmaComponentsResponse {
  meta?: {
    components?: {
      key: string;
      name: string;
      description?: string;
      node_id: string;
      containing_frame?: { name?: string };
    }[];
  };
}

async function fetchComponents(env: Env): Promise<SnapshotComponent[]> {
  const result = await figmaGet<FigmaComponentsResponse>(env, `/files/${env.FIGMA_FILE_KEY}/components`);
  const mapped = (result.meta?.components ?? []).map((c) => ({
    key: c.key,
    name: c.name,
    description: c.description ?? "",
    nodeId: c.node_id,
    containingFrame: c.containing_frame?.name ?? "",
  }));
  return mapped.filter((c) => !isIgnoredComponent(c));
}

interface FigmaVersionsResponse {
  versions?: {
    id: string;
    label?: string | null;
    description?: string | null;
    created_at: string;
    user?: { handle?: string };
  }[];
}

/** Recent intentional publishes only — Figma autosaves have null label AND description. */
async function fetchVersions(env: Env): Promise<VersionInfo[]> {
  const result = await figmaGet<FigmaVersionsResponse>(env, `/files/${env.FIGMA_FILE_KEY}/versions`);
  return (result.versions ?? [])
    .slice(0, 30)
    .filter((v) => v.label || v.description)
    .slice(0, 10)
    .map((v) => ({
      id: v.id,
      label: v.label ?? "",
      description: v.description ?? "",
      createdAt: v.created_at,
      user: v.user?.handle ?? "Unknown",
    }));
}

// ─── Node hashes (visual-change detection when metadata alone is silent) ────
// v1 hashed with MD5; here it's SHA-256 via WebCrypto (no node:crypto needed).
// Only internal consistency matters — the KV snapshot is seeded fresh.

async function sha256Hex(text: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(text));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

interface FigmaNodesResponse {
  nodes?: Record<string, { document?: unknown } | undefined>;
}

async function fetchNodeHashes(env: Env, components: SnapshotComponent[]): Promise<Record<string, string>> {
  const hashes: Record<string, string> = {};
  const chunks: SnapshotComponent[][] = [];
  for (let i = 0; i < components.length; i += HASH_CHUNK_SIZE) {
    chunks.push(components.slice(i, i + HASH_CHUNK_SIZE));
  }
  if (chunks.length > MAX_HASH_REQUESTS) {
    console.warn(`[figma-poll] ${chunks.length} hash chunks exceeds cap ${MAX_HASH_REQUESTS} — hashing the first ${MAX_HASH_REQUESTS * HASH_CHUNK_SIZE} components only`);
    chunks.length = MAX_HASH_REQUESTS;
  }

  // Batched concurrency: HASH_CONCURRENCY chunks in flight at a time.
  for (let i = 0; i < chunks.length; i += HASH_CONCURRENCY) {
    await Promise.all(chunks.slice(i, i + HASH_CONCURRENCY).map(async (chunk) => {
      // ids stay RAW (colons + commas are query-legal) — %2C-encoding the commas
      // risks Figma reading the batch as one malformed id (v1 sent them raw).
      const ids = chunk.map((c) => c.nodeId).filter(Boolean).join(",");
      if (!ids) return;
      try {
        const result = await figmaGet<FigmaNodesResponse>(
          env,
          `/files/${env.FIGMA_FILE_KEY}/nodes?ids=${ids}&geometry=paths`,
        );
        for (const [nodeId, nodeData] of Object.entries(result.nodes ?? {})) {
          if (nodeData?.document) hashes[nodeId] = await sha256Hex(JSON.stringify(nodeData.document));
        }
      } catch (err) {
        console.warn(`[figma-poll] node-hash chunk failed: ${err instanceof Error ? err.message : String(err)}`);
      }
    }));
  }
  return hashes;
}

// ─── Diffing (straight port of v1) ──────────────────────────────────────────

function diffComponents(oldComponents: SnapshotComponent[], newComponents: SnapshotComponent[]): ComponentDiff {
  const oldMap = new Map(oldComponents.map((c) => [c.key, c]));
  const newMap = new Map(newComponents.map((c) => [c.key, c]));
  const diff: ComponentDiff = { created: [], modified: [], deleted: [] };

  for (const [key, comp] of newMap) {
    const old = oldMap.get(key);
    if (!old) diff.created.push(comp);
    else if (old.name !== comp.name || old.description !== comp.description) {
      diff.modified.push({ old, new: comp });
    }
  }
  for (const [key, comp] of oldMap) {
    if (!newMap.has(key)) diff.deleted.push(comp);
  }
  return diff;
}

function diffVersions(oldVersionIds: string[], newVersions: VersionInfo[]): VersionInfo[] {
  const oldSet = new Set(oldVersionIds);
  return newVersions.filter((v) => !oldSet.has(v.id));
}

// ─── Slack message (v1's buildSlackMessage, block-for-block) ────────────────
// One deliberate change: the CTA says "reply … in this thread" instead of v1's
// "type … in this channel" — v2's engagement gate ignores top-level channel
// messages with no @mention, but a reply under this (bot-authored) message
// engages without one (slack/events.ts shouldHandleMessage).

function groupVariantNames(
  items: { frame: string; name: string }[],
): string[] {
  const groups: Record<string, number> = {};
  for (const item of items) {
    const frame = item.frame || item.name || "Unknown";
    groups[frame] = (groups[frame] ?? 0) + 1;
  }
  return Object.entries(groups).map(([name, count]) => (count > 1 ? `${name} (${count} variants)` : name));
}

function formatNames(names: string[]): string {
  return names.length > 5 ? `${names.slice(0, 5).join(", ")} (+${names.length - 5} more)` : names.join(", ");
}

function buildSlackMessage(
  env: Env,
  componentDiff: ComponentDiff,
  newVersions: VersionInfo[],
  prdResult: CreatedPrd | null,
  prdTitle: string,
): { blocks: unknown[]; text: string } {
  const figmaUrl = `https://www.figma.com/design/${env.FIGMA_FILE_KEY}`;

  const now = new Date();
  const timeStr =
    now.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" }) +
    " at " +
    now.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" });

  const blocks: unknown[] = [];

  blocks.push({
    type: "header",
    text: { type: "plain_text", text: "🎨 Figma Design System Updated" },
  });

  // Version info (who published + description).
  if (newVersions.length) {
    for (const v of newVersions) {
      const publishedBy = `*Published by ${v.user}*`;
      // Dynamic label from change types instead of Figma's generic "Components published".
      const changeVerbs: string[] = [];
      if (componentDiff.created.length) changeVerbs.push("added");
      if (componentDiff.modified.length) changeVerbs.push("updated");
      if (componentDiff.deleted.length) changeVerbs.push("deleted");
      const dynamicLabel = changeVerbs.length
        ? `Components ${changeVerbs.join(", ")}`
        : v.label || "Components published";
      const label = ` · _${dynamicLabel}_`;
      const versionUrl = `${figmaUrl}?version-id=${v.id}`;
      const versionBlock = v.description
        ? `${publishedBy}${label}\n\n> ${v.description}\n\n<${versionUrl}|View this version>`
        : `${publishedBy}${label}\n<${versionUrl}|View this version>`;
      blocks.push({ type: "section", text: { type: "mrkdwn", text: versionBlock } });
    }
  } else {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: "_Component metadata changed (no published version detected)_" },
    });
  }

  // Component changes, grouped by parent frame.
  const componentLines: string[] = [];
  if (componentDiff.created.length) {
    const names = groupVariantNames(componentDiff.created.map((c) => ({ frame: c.containingFrame, name: c.name })));
    componentLines.push(`📦  *New:*  ${formatNames(names)}`);
  }
  if (componentDiff.modified.length) {
    const names = groupVariantNames(componentDiff.modified.map((m) => ({ frame: m.new.containingFrame, name: m.new.name })));
    componentLines.push(`✏️  *Modified:*  ${formatNames(names)}`);
  }
  if (componentDiff.deleted.length) {
    const names = groupVariantNames(componentDiff.deleted.map((c) => ({ frame: c.containingFrame, name: c.name })));
    componentLines.push(`🗑️  *Deleted:*  ${formatNames(names)}`);
  }
  // Version published but nothing itemizable — surface the publish text.
  if (!componentLines.length && newVersions.length) {
    const rawText = newVersions.map((v) => [v.label, v.description].filter(Boolean).join(" — ")).join(", ");
    componentLines.push(`✏️  *Updated:*  ${rawText || "Visual changes published"}`);
  }
  if (componentLines.length) {
    blocks.push({ type: "divider" });
    blocks.push({ type: "section", text: { type: "mrkdwn", text: componentLines.join("\n") } });
  }

  // PRD link (when the Notion PRD was created).
  if (prdResult?.url) {
    blocks.push({ type: "divider" });
    blocks.push({
      type: "section",
      text: {
        type: "mrkdwn",
        text: `:clipboard: *PRD Created:* <${prdResult.url}|${prdTitle}>\nReview the PRD, then reply \`implement ${prdTitle.replace("DS Update: ", "")}\` in this thread when ready.`,
      },
    });
  }

  blocks.push({ type: "divider" });
  blocks.push({
    type: "context",
    elements: [{ type: "mrkdwn", text: `<${figmaUrl}|Open Figma file>  ·  ${timeStr}  ·  Automated poll` }],
  });

  const summary: string[] = [];
  if (newVersions.length) summary.push(`Published by ${newVersions[0]!.user}`);
  if (componentDiff.created.length) summary.push(`${componentDiff.created.length} new`);
  if (componentDiff.modified.length) summary.push(`${componentDiff.modified.length} modified`);
  if (componentDiff.deleted.length) summary.push(`${componentDiff.deleted.length} deleted`);
  return { blocks, text: `Figma DS Update: ${summary.join(", ")}` };
}

// ─── Notion PRD (v1's createNotionPRD, re-homed on the Roadmap board) ───────
// v1 filed into a dedicated "DS Component PRDs" DB; that DB retired with the
// board consolidation, so the poll files through notionCreate's "prd" surface —
// the SAME card shape the implement flows' fetchNotionPRD reads downstream.

function groupCount(items: { frame: string }[]): Record<string, number> {
  const groups: Record<string, number> = {};
  for (const item of items) {
    const frame = item.frame || "Unknown";
    groups[frame] = (groups[frame] ?? 0) + 1;
  }
  return groups;
}

function buildPrdTitle(componentDiff: ComponentDiff, newVersions: VersionInfo[]): string {
  const allFrames = new Set([
    ...Object.keys(groupCount(componentDiff.created.map((c) => ({ frame: c.containingFrame })))),
    ...Object.keys(groupCount(componentDiff.modified.map((m) => ({ frame: m.new.containingFrame })))),
    ...Object.keys(groupCount(componentDiff.deleted.map((c) => ({ frame: c.containingFrame })))),
  ]);
  if (allFrames.size) {
    const names = [...allFrames].slice(0, 3).join(", ");
    const extra = allFrames.size > 3 ? ` +${allFrames.size - 3} more` : "";
    return `DS Update: ${names}${extra}`;
  }
  return `DS Update: ${newVersions.map((v) => v.label || v.description || "Published changes").join(", ")}`;
}

async function createPollPrd(
  env: Env,
  componentDiff: ComponentDiff,
  newVersions: VersionInfo[],
  title: string,
): Promise<CreatedPrd | null> {
  if (!env.NOTION_API_KEY || !env.NOTION_ROADMAP_DB_ID) {
    console.log("[figma-poll] Notion not configured — skipping PRD creation");
    return null;
  }

  const figmaUrl = `https://www.figma.com/design/${env.FIGMA_FILE_KEY}`;
  const publishedBy = newVersions.length ? newVersions[0]!.user : "Unknown";
  const publishDescription = newVersions.length
    ? newVersions[0]!.description || newVersions[0]!.label || "No description"
    : "Metadata change (no version published)";

  const changeLines: string[] = [];
  const section = (label: string, groups: Record<string, number>) => {
    for (const [frame, count] of Object.entries(groups)) {
      changeLines.push(`${label} ${frame} — ${count} variant${count > 1 ? "s" : ""}`);
    }
  };
  section("📦 New:", groupCount(componentDiff.created.map((c) => ({ frame: c.containingFrame }))));
  section("✏️ Modified:", groupCount(componentDiff.modified.map((m) => ({ frame: m.new.containingFrame }))));
  section("🗑️ Deleted:", groupCount(componentDiff.deleted.map((c) => ({ frame: c.containingFrame }))));
  if (!changeLines.length && newVersions.length) {
    changeLines.push(`✏️ ${newVersions.map((v) => [v.label, v.description].filter(Boolean).join(" — ")).join(", ") || "Visual changes published"}`);
  }

  const created = await notionCreate(env, "prd", {
    title,
    summary: `Published by ${publishedBy} — ${publishDescription}`,
    sections: [{ heading: "Change Summary", body: changeLines.join("\n\n") }],
    // v1's action items, so downstream review has the same checklist.
    acceptanceCriteria: [
      "Review Figma changes",
      "Update component code to match Figma",
      "Run `npm run sync:tokens && npm run generate:tokens` for token changes",
      "Verify visual parity in Storybook",
    ],
    sourceUrl: figmaUrl,
  });
  return created;
}

// ─── Snapshot in KV ──────────────────────────────────────────────────────────

async function loadSnapshot(env: Env): Promise<Snapshot | null> {
  if (!env.HARNESS_KV) return null;
  return env.HARNESS_KV.get<Snapshot>(SNAPSHOT_KV_KEY, "json");
}

async function saveSnapshot(env: Env, snapshot: Snapshot): Promise<void> {
  if (!env.HARNESS_KV) return;
  await env.HARNESS_KV.put(SNAPSHOT_KV_KEY, JSON.stringify(snapshot));
}

// ─── Main (mirrors v1's main(): fetch → diff → PRD → Slack → snapshot) ──────

export async function runFigmaPoll(env: Env, opts: { dryRun?: boolean } = {}): Promise<PollResult> {
  if (!env.FIGMA_ACCESS_TOKEN || !env.FIGMA_FILE_KEY) {
    return { ran: false, summary: "FIGMA_ACCESS_TOKEN / FIGMA_FILE_KEY not configured — poll skipped" };
  }
  if (!env.HARNESS_KV) {
    return { ran: false, summary: "HARNESS_KV not bound — nowhere to keep the snapshot; poll skipped" };
  }

  const [components, versions] = await Promise.all([fetchComponents(env), fetchVersions(env)]);
  console.log(`[figma-poll] ${components.length} components, ${versions.length} recent published versions`);

  // First run: seed the snapshot, notify nothing (v1's CI auto-init).
  const snapshot = await loadSnapshot(env);
  if (!snapshot) {
    const nodeHashes = await fetchNodeHashes(env, components);
    if (!opts.dryRun) {
      await saveSnapshot(env, {
        lastChecked: new Date().toISOString(),
        components,
        versionIds: versions.map((v) => v.id),
        nodeHashes,
      });
    }
    return { ran: true, summary: `initialized snapshot: ${components.length} components, ${Object.keys(nodeHashes).length} node hashes` };
  }

  const componentDiff = diffComponents(snapshot.components, components);
  const newVersions = diffVersions(snapshot.versionIds, versions);

  // Version published but metadata silent → check visual properties via node
  // hashes. No stored hashes → store a baseline now and diff from the NEXT
  // publish (v1's fetch-previous-version baseline costs ~27 extra subrequests,
  // which doesn't fit the free-tier budget alongside the current-hash fetch).
  let refreshedHashes: Record<string, string> | null = null;
  const hasMetadataChanges =
    componentDiff.created.length > 0 || componentDiff.modified.length > 0 || componentDiff.deleted.length > 0;
  if (!hasMetadataChanges && newVersions.length > 0) {
    refreshedHashes = await fetchNodeHashes(env, components);
    const oldHashes = snapshot.nodeHashes ?? {};
    if (Object.keys(oldHashes).length) {
      for (const comp of components) {
        const id = comp.nodeId;
        if (!id || !refreshedHashes[id]) continue;
        if (oldHashes[id] && oldHashes[id] !== refreshedHashes[id]) {
          const oldComp = snapshot.components.find((c) => c.nodeId === id) ?? comp;
          componentDiff.modified.push({ old: oldComp, new: comp });
        }
      }
      console.log(`[figma-poll] visual check: ${componentDiff.modified.length} changed component(s)`);
    } else {
      console.log("[figma-poll] no stored node hashes — baseline stored, visual diff resumes next publish");
    }
  }

  const hasChanges =
    componentDiff.created.length > 0 ||
    componentDiff.modified.length > 0 ||
    componentDiff.deleted.length > 0 ||
    newVersions.length > 0;

  if (!hasChanges) {
    if (!opts.dryRun) {
      snapshot.lastChecked = new Date().toISOString();
      await saveSnapshot(env, snapshot);
    }
    return { ran: true, summary: "no changes since last check" };
  }

  // Notion PRD first (its URL rides in the Slack card), Slack second, snapshot
  // last. Each step degrades alone (a failed PRD still posts to Slack; a failed
  // post is logged) and the snapshot advances regardless — v1 semantics; NOT
  // advancing would re-file a duplicate PRD on the next firing, which is worse
  // than one missed card.
  const prdTitle = buildPrdTitle(componentDiff, newVersions);
  let prdResult: CreatedPrd | null = null;
  if (!opts.dryRun) {
    try {
      prdResult = await createPollPrd(env, componentDiff, newVersions, prdTitle);
    } catch (err) {
      console.warn(`[figma-poll] Notion PRD creation failed: ${err instanceof Error ? err.message : String(err)}`);
    }
  }

  let slackPosted = false;
  const channel = env.UNO_BOT_CHANNEL_ID?.trim();
  if (!channel) {
    console.log("[figma-poll] UNO_BOT_CHANNEL_ID not set — skipping Slack notification");
  } else if (!opts.dryRun) {
    const { blocks, text } = buildSlackMessage(env, componentDiff, newVersions, prdResult, prdTitle);
    const res = await postMessage(env, { channel, text, blocks });
    slackPosted = res.ok;
    if (!res.ok) console.warn(`[figma-poll] Slack post failed: ${(res as { error?: string }).error ?? "unknown"}`);
  }

  if (!opts.dryRun) {
    await saveSnapshot(env, {
      lastChecked: new Date().toISOString(),
      components,
      versionIds: versions.map((v) => v.id),
      nodeHashes: refreshedHashes ?? snapshot.nodeHashes ?? {},
    });
  }

  return {
    ran: true,
    summary: `changes detected — created:${componentDiff.created.length} modified:${componentDiff.modified.length} deleted:${componentDiff.deleted.length} versions:${newVersions.length}`,
    created: componentDiff.created.length,
    modified: componentDiff.modified.length,
    deleted: componentDiff.deleted.length,
    newVersions: newVersions.length,
    ...(prdResult ? { prdUrl: prdResult.url } : {}),
    slackPosted,
  };
}
