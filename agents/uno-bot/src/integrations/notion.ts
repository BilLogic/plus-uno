// Worker-safe Notion client: notionCreate (PRD/intake on Roadmap; decision rows
// on Decisions DB), notionUpdate (any shared page), archive, search helpers.
// database, placed in "Need PRD / Under Playground"), notionUpdate,
// archiveCard, notionSearch, readNotionPage, findTeamMembers, queryRoadmapCards.
//
// Schema (introspected from the live Roadmap DB):
//   title property:        "Name"
//   board status property: "Design Status" (status) — option "Need PRD / Under Playground"
//   optional:              "Product Pillar" (multi_select)
//
// The card body mirrors the existing PRD shape (Acceptance Criteria as to_do
// checkboxes + an Implementation Notes heading) so the downstream implement /
// implement_design flows' fetchNotionPRD can read it.

import type { Env } from "../types";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const TEAM_QUERY_PAGE_SIZE = 100;
const TEAM_MAX = 200;
const DESIGN_STATUS_NEED_PRD = "Need PRD / Under Playground";
const REQUEST_TIMEOUT_MS = 10000;
const MAX_RICH_TEXT = 1900; // Notion caps a single rich_text content at 2000

// Shared auth headers for every Notion REST call — one definition so the token
// header and API version can't drift between endpoints. `write:true` adds the
// JSON content-type needed by POST/PATCH.
function notionHeaders(env: Env, opts?: { write?: boolean }): Record<string, string> {
  const h: Record<string, string> = {
    Authorization: `Bearer ${env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
  };
  if (opts?.write) h["Content-Type"] = "application/json";
  return h;
}

// One error-string format for every Notion endpoint (was hand-built ~7×, and
// drifted). `fallback` names the operation for the message tail.
function notionError(status: number, data: { code?: string; message?: string }, fallback: string): Error {
  return new Error(`Notion ${status}${data.code ? ` ${data.code}` : ""}: ${data.message ?? fallback}`);
}

export interface PrdSection {
  heading: string;
  body: string;
}

export interface PrdInput {
  title: string;
  summary?: string;
  sections?: PrdSection[];
  acceptanceCriteria?: string[];
  productPillar?: string;
  sourceUrl?: string;
}

export interface CreatedPrd {
  id: string;
  url: string;
}

function richText(content: string) {
  return [{ type: "text", text: { content: content.slice(0, MAX_RICH_TEXT) } }];
}

function paragraph(content: string) {
  return { object: "block", type: "paragraph", paragraph: { rich_text: richText(content) } };
}

function heading(content: string) {
  return { object: "block", type: "heading_2", heading_2: { rich_text: richText(content) } };
}

function todo(content: string) {
  return { object: "block", type: "to_do", to_do: { checked: false, rich_text: richText(content) } };
}

function bodyToParagraphs(body: string): unknown[] {
  // Split on blank lines into separate paragraph blocks; chunk anything that
  // would exceed Notion's per-block text cap.
  const blocks: unknown[] = [];
  for (const para of body.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean)) {
    for (let i = 0; i < para.length; i += MAX_RICH_TEXT) {
      blocks.push(paragraph(para.slice(i, i + MAX_RICH_TEXT)));
    }
  }
  return blocks;
}

function buildChildren(input: PrdInput): unknown[] {
  const children: unknown[] = [];

  if (input.summary?.trim()) {
    children.push(heading("Summary"));
    children.push(...bodyToParagraphs(input.summary));
  }

  for (const section of input.sections ?? []) {
    if (!section?.heading?.trim()) continue;
    children.push(heading(section.heading.trim()));
    if (section.body?.trim()) children.push(...bodyToParagraphs(section.body));
  }

  // Acceptance Criteria as checkboxes (read by fetchNotionPRD downstream).
  if (input.acceptanceCriteria?.length) {
    children.push(heading("Acceptance Criteria"));
    for (const item of input.acceptanceCriteria) {
      if (item?.trim()) children.push(todo(item.trim()));
    }
  }

  // Implementation Notes heading (read by fetchNotionPRD downstream).
  children.push(heading("Implementation Notes"));
  children.push({
    object: "block",
    type: "paragraph",
    paragraph: {
      rich_text: [{
        type: "text",
        text: { content: "Add implementation guidance, edge cases, or design decisions here before implementing." },
        annotations: { italic: true, color: "gray" },
      }],
    },
  });

  if (input.sourceUrl?.trim()) {
    children.push(heading("Source"));
    children.push({
      object: "block",
      type: "paragraph",
      paragraph: { rich_text: [{ type: "text", text: { content: input.sourceUrl.trim(), link: { url: input.sourceUrl.trim() } } }] },
    });
  }

  return children;
}

// ─── Team Member Database (read-only, for find_experts) ─────────────────────
// Schema (verified): Name (title), Group (select), Primary Role (rich_text),
// Short Bio (rich_text), Affiliation (select), LinkedIn / Personal Website /
// Google Scholar (url). Historically no Slack id — so the bot suggested people
// by name. If a "Slack ID" text property is later added to the DB, we read it
// here so find_experts can @-mention the right person (D5 "right person"); when
// absent we fall back to name-only suggestions (unchanged behavior).

type NotionRichText = { plain_text?: string }[];
interface TeamMemberProps {
  Name?: { title?: NotionRichText };
  Group?: { select?: { name?: string } | null };
  "Primary Role"?: { rich_text?: NotionRichText };
  "Short Bio"?: { rich_text?: NotionRichText };
  Affiliation?: { select?: { name?: string } | null };
  LinkedIn?: { url?: string | null };
  "Personal Website"?: { url?: string | null };
  "Google Scholar"?: { url?: string | null };
  "Slack ID"?: { rich_text?: NotionRichText };
}

export interface TeamMember {
  name: string;
  group?: string;
  role?: string;
  bio?: string;
  affiliation?: string;
  linkedin?: string;
  website?: string;
  /** Slack user id (e.g. "U0123ABC"), if the DB carries one — enables @-mention. */
  slackUserId?: string;
}

/** Normalize a raw "Slack ID" cell to a bare user id: strip <@…>, leading @. */
function normalizeSlackId(raw: string): string | undefined {
  const m = raw.match(/[UW][A-Z0-9]{6,}/);
  return m ? m[0] : undefined;
}

const plain = (rt?: NotionRichText): string =>
  (rt ?? []).map((t) => t.plain_text ?? "").join("").trim();

/**
 * Read the Team Member Database roster (name, group, role, bio, links). The bot
 * matches a topic against the bios itself; this just returns the people. Paginates
 * up to TEAM_MAX. Throws on failure (caller surfaces it).
 */
export async function findTeamMembers(env: Env): Promise<TeamMember[]> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  if (!env.NOTION_TEAM_DB_ID) throw new Error("NOTION_TEAM_DB_ID not configured");

  const headers = notionHeaders(env, { write: true });
  const members: TeamMember[] = [];
  let cursor: string | undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    do {
      const body: Record<string, unknown> = { page_size: TEAM_QUERY_PAGE_SIZE };
      if (cursor) body.start_cursor = cursor;
      const res = await fetch(`${NOTION_API}/databases/${env.NOTION_TEAM_DB_ID}/query`, {
        method: "POST", headers, body: JSON.stringify(body), signal: controller.signal,
      });
      const data = (await res.json()) as {
        results?: { properties?: TeamMemberProps }[];
        has_more?: boolean; next_cursor?: string; message?: string; code?: string;
      };
      if (!res.ok) {
        throw notionError(res.status, data, "team query failed");
      }
      for (const row of data.results ?? []) {
        const p = row.properties ?? {};
        const name = plain(p.Name?.title);
        if (!name) continue;
        members.push({
          name,
          group: p.Group?.select?.name ?? undefined,
          role: plain(p["Primary Role"]?.rich_text) || undefined,
          bio: plain(p["Short Bio"]?.rich_text) || undefined,
          affiliation: p.Affiliation?.select?.name ?? undefined,
          linkedin: p.LinkedIn?.url ?? undefined,
          website: p["Personal Website"]?.url ?? p["Google Scholar"]?.url ?? undefined,
          slackUserId: normalizeSlackId(plain(p["Slack ID"]?.rich_text)) ?? undefined,
        });
      }
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor && members.length < TEAM_MAX);
    return members;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Third Party Applications DB (read-only — access-request routing) ────────
// Ground truth for "who do I ask for access to X" (approved 2026-07-12):
// Application Name (title) · Application Admin (people — the GRANTOR) ·
// Power User(s) (relation → people-directory pages; day-to-day experts) ·
// Usage Status (status). The bot only ROUTES the request; the grant stays
// human. Relation values are page ids — resolve names with fetchPageTitles.

interface ThirdPartyAppProps {
  "Application Name"?: { title?: NotionRichText };
  "Application Admin"?: { people?: { name?: string; id?: string }[] };
  "Power User(s)"?: { relation?: { id?: string }[] };
  "Usage Status"?: { status?: { name?: string } | null };
  "License Type"?: { multi_select?: { name?: string }[] };
}

export interface ThirdPartyApp {
  name: string;
  url: string;
  /** Application Admin people — the humans who can actually grant access. */
  admins: string[];
  /** Power User(s) relation page ids (resolve names via fetchPageTitles). */
  powerUserPageIds: string[];
  usageStatus?: string;
  licenseTypes: string[];
}

const APPS_PAGE_SIZE = 100;
const APPS_MAX_PAGES = 2;

/**
 * Read the Third Party Applications directory (name, admins, power-user page
 * ids, status). Classic databases/{id}/query — one page of 100 rows ≈ one
 * subrequest. Throws on failure (caller surfaces it honestly).
 */
// A raw row from databases/{id}/query. The property intersection carries the
// extras individual readers need (unique_id for Roadmap card numbers, relation
// for Power Users) on top of the shared NotionProperty shape.
interface DbQueryRow {
  id?: string;
  url?: string;
  archived?: boolean;
  properties?: Record<string, NotionProperty & {
    unique_id?: { number?: number | null };
    relation?: { id?: string }[];
  }>;
}

// Shared paginated database read: the API-key guard, AbortController/timer,
// fixed-page loop, POST databases/{id}/query, error + has_more handling that
// every catalog reader (apps / catalog scopes / roadmap) had copied verbatim.
// Each caller supplies only its per-row `mapRow` (return null to drop a row).
async function queryDatabaseRows<T>(
  env: Env,
  databaseId: string,
  opts: { maxPages: number; pageSize?: number; filter?: unknown; errorLabel: string },
  mapRow: (row: DbQueryRow) => T | null,
): Promise<T[]> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  if (!databaseId) throw new Error("database id is empty");
  const out: T[] = [];
  let cursor: string | undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    for (let page = 0; page < opts.maxPages; page++) {
      const res = await fetch(`${NOTION_API}/databases/${databaseId}/query`, {
        method: "POST",
        headers: notionHeaders(env, { write: true }),
        body: JSON.stringify({
          page_size: opts.pageSize ?? 100,
          ...(cursor ? { start_cursor: cursor } : {}),
          ...(opts.filter ? { filter: opts.filter } : {}),
        }),
        signal: controller.signal,
      });
      const data = (await res.json()) as {
        results?: DbQueryRow[]; has_more?: boolean; next_cursor?: string | null; message?: string; code?: string;
      };
      if (!res.ok) throw notionError(res.status, data, opts.errorLabel);
      for (const r of data.results ?? []) {
        const mapped = mapRow(r);
        if (mapped != null) out.push(mapped);
      }
      if (!data.has_more || !data.next_cursor) break;
      cursor = data.next_cursor;
    }
    return out;
  } finally {
    clearTimeout(timer);
  }
}

export async function queryThirdPartyApps(env: Env): Promise<ThirdPartyApp[]> {
  if (!env.NOTION_APPS_DB_ID) throw new Error("NOTION_APPS_DB_ID not configured");
  return queryDatabaseRows(
    env,
    env.NOTION_APPS_DB_ID,
    { maxPages: APPS_MAX_PAGES, pageSize: APPS_PAGE_SIZE, errorLabel: "third-party apps query failed" },
    (r): ThirdPartyApp | null => {
      if (!r.id || r.archived) return null;
      const p = (r.properties ?? {}) as ThirdPartyAppProps;
      const name = plain(p["Application Name"]?.title);
      if (!name) return null;
      return {
        name,
        url: r.url ?? `https://www.notion.so/${r.id.replace(/-/g, "")}`,
        admins: (p["Application Admin"]?.people ?? []).map((u) => u.name ?? "").filter(Boolean),
        powerUserPageIds: (p["Power User(s)"]?.relation ?? []).map((rel) => rel.id ?? "").filter(Boolean),
        usageStatus: p["Usage Status"]?.status?.name ?? undefined,
        licenseTypes: (p["License Type"]?.multi_select ?? []).map((o) => o.name ?? "").filter(Boolean),
      };
    },
  );
}

// ─── Generic catalog DB query (notion_search scoped catalogs) ────────────────
// Same lesson as apps / roadmap_query: /v1/search misses literal titles inside
// known DBs. Query databases/{id} directly (1–2 subrequests) and match in-Worker.

const CATALOG_PAGE_SIZE = 100;
const CATALOG_MAX_PAGES = 2;
/** Cap how many select/status/url/rich_text fields we surface per row. */
const CATALOG_META_CAP = 6;

export interface CatalogRow {
  id: string;
  title: string;
  url: string;
  /** Compact property bag (status/select/url/short text) for the model. */
  meta: Record<string, string>;
}

/**
 * Pull a title from a property bag, skipping named title props (e.g. "Task name"
 * on the Help Center Content multi-source parent so Tasks Tracker rows drop out).
 */
function catalogTitle(
  props: Record<string, NotionProperty>,
  skipTitleNames: string[] = [],
): string | null {
  const skip = new Set(skipTitleNames.map((n) => n.toLowerCase()));
  for (const [name, prop] of Object.entries(props)) {
    if (prop.type !== "title") continue;
    if (skip.has(name.toLowerCase())) continue;
    const t = plain(prop.title);
    if (t) return t;
  }
  return null;
}

/**
 * Compact non-title properties into a small string map for search results.
 */
function catalogMeta(props: Record<string, NotionProperty>): Record<string, string> {
  const meta: Record<string, string> = {};
  for (const [name, prop] of Object.entries(props)) {
    if (Object.keys(meta).length >= CATALOG_META_CAP) break;
    if (prop.type === "title") continue;
    if (!["status", "select", "multi_select", "url", "rich_text", "date", "checkbox", "number", "people"].includes(prop.type)) {
      continue;
    }
    const v = renderProperty(prop);
    if (v && v.length <= 200) meta[name] = v;
  }
  return meta;
}

/**
 * Read rows from any Notion database the integration can see. Generic title +
 * meta extraction — used by notion_search catalog scopes. Throws on failure.
 *
 * @param databaseId - Notion DATABASE id (not data-source id)
 * @param opts.skipTitleNames - title property names to ignore (multi-source DBs)
 */
export async function queryCatalogDatabase(
  env: Env,
  databaseId: string,
  opts: { skipTitleNames?: string[] } = {},
): Promise<CatalogRow[]> {
  return queryDatabaseRows(
    env,
    databaseId,
    { maxPages: CATALOG_MAX_PAGES, pageSize: CATALOG_PAGE_SIZE, errorLabel: "catalog query failed" },
    (r): CatalogRow | null => {
      if (!r.id || r.archived) return null;
      const props = r.properties ?? {};
      const title = catalogTitle(props, opts.skipTitleNames);
      if (!title) return null;
      return {
        id: r.id.replace(/-/g, ""),
        title,
        url: r.url ?? `https://www.notion.so/${r.id.replace(/-/g, "")}`,
        meta: catalogMeta(props),
      };
    },
  );
}

/**
 * Resolve Notion page ids to their titles (for relation properties like
 * Power User(s)). Capped — each id is one subrequest. Unresolvable ids are
 * skipped, never fabricated.
 */
export async function fetchPageTitles(env: Env, pageIds: string[], cap = 4): Promise<string[]> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const headers = notionHeaders(env);
  const titles: string[] = [];
  for (const id of pageIds.slice(0, cap)) {
    try {
      const res = await fetch(`${NOTION_API}/pages/${id}`, { headers });
      if (!res.ok) continue;
      const page = (await res.json()) as { properties?: Record<string, NotionProperty> };
      for (const prop of Object.values(page.properties ?? {})) {
        if (prop.type === "title") {
          const t = plain(prop.title);
          if (t) titles.push(t);
          break;
        }
      }
    } catch {
      // skip — the caller reports who it could resolve
    }
  }
  return titles;
}

const NOTION_ID_RE = /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/i;

/** Extract a Notion page id (32-hex, dashes stripped) from a URL or raw id. */
export function parseNotionPageId(input: string): string | null {
  if (typeof input !== "string") return null;
  const m = input.match(NOTION_ID_RE);
  return m ? m[0].replace(/-/g, "").toLowerCase() : null;
}

export interface ArchivedCard {
  id: string;
  title: string;
}


// ─── Read a Notion page (for read_source / linked-source grounding) ──────────
// Returns the page title, its properties rendered to strings (so the model can
// read an Owner/Assignee/Status field), and the page's block text. Read-only.

const READ_BLOCK_PAGES = 3; // cap pagination so a huge page can't blow the budget
const READ_TEXT_CAP = 8000;

// In-memory read cache: a back-and-forth thread re-reads the SAME page every
// turn (1 page GET + up to 3 block-children GETs ≈ 4 subrequests each), and the
// free tier caps an invocation at 50 subrequests. Caching successful reads for a
// short window makes a repeat read cost 0. Per-isolate + best-effort by design
// (no KV — dodges KV write limits); a cold isolate just re-fetches.
const READ_CACHE_TTL_MS = 180_000; // 3 min
const READ_CACHE_MAX = 50; // cap growth in a long-lived isolate
const readCache = new Map<string, { at: number; value: NotionPageContent }>();

// Drop a page's cached read so a subsequent read reflects a write we just made
// (notionUpdate/archiveCard) instead of serving a stale copy.
export function evictReadCache(pageId: string): void {
  readCache.delete(pageId);
}

export interface NotionPageContent {
  id: string;
  title: string;
  /** Property name → rendered value (people joined by ", "; select/status by name). */
  properties: Record<string, string>;
  /** People-typed property values, keyed by property name (e.g. Owner → ["Jane"]). */
  people: Record<string, string[]>;
  /** Flattened block text. */
  text: string;
}

interface NotionProperty {
  type: string;
  title?: NotionRichText;
  rich_text?: NotionRichText;
  people?: { name?: string; id?: string }[];
  select?: { name?: string } | null;
  status?: { name?: string } | null;
  multi_select?: { name?: string }[];
  relation?: { id?: string }[];
  date?: { start?: string; end?: string | null } | null;
  url?: string | null;
  email?: string | null;
  checkbox?: boolean;
  number?: number | null;
}

function renderProperty(p: NotionProperty): string {
  switch (p.type) {
    case "title": return plain(p.title);
    case "rich_text": return plain(p.rich_text);
    case "people": return (p.people ?? []).map((u) => u.name ?? u.id ?? "").filter(Boolean).join(", ");
    case "select": return p.select?.name ?? "";
    case "status": return p.status?.name ?? "";
    case "multi_select": return (p.multi_select ?? []).map((o) => o.name ?? "").filter(Boolean).join(", ");
    case "date": return p.date?.start ? (p.date.end ? `${p.date.start} → ${p.date.end}` : p.date.start) : "";
    case "url": return p.url ?? "";
    case "email": return p.email ?? "";
    case "checkbox": return p.checkbox ? "true" : "false";
    case "number": return p.number != null ? String(p.number) : "";
    default: return "";
  }
}

function blockText(block: Record<string, unknown>): string {
  const type = block.type as string;
  const body = block[type] as { rich_text?: NotionRichText } | undefined;
  const txt = plain(body?.rich_text);
  if (!txt) return "";
  if (type === "bulleted_list_item" || type === "numbered_list_item") return `• ${txt}`;
  if (type === "to_do") return `☐ ${txt}`;
  if (type.startsWith("heading")) return `\n${txt}`;
  return txt;
}

/**
 * Read a Notion page: title + rendered properties (incl. people/Owner) + block
 * text. Throws on failure so read_source can report it honestly. Read-only.
 */
export async function readNotionPage(env: Env, pageId: string): Promise<NotionPageContent> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");

  // Serve a fresh cached read (0 subrequests) if we read this page recently.
  const cached = readCache.get(pageId);
  if (cached && Date.now() - cached.at < READ_CACHE_TTL_MS) return cached.value;

  const headers = notionHeaders(env, { write: true });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const pageRes = await fetch(`${NOTION_API}/pages/${pageId}`, { headers, signal: controller.signal });
    const page = (await pageRes.json()) as {
      id?: string; message?: string; code?: string;
      properties?: Record<string, NotionProperty>;
    };
    if (!pageRes.ok || !page.id) {
      throw notionError(pageRes.status, page, "page not found");
    }

    const properties: Record<string, string> = {};
    const people: Record<string, string[]> = {};
    let title = "(untitled)";
    for (const [name, prop] of Object.entries(page.properties ?? {})) {
      const rendered = renderProperty(prop);
      if (prop.type === "title" && rendered) title = rendered;
      if (rendered) properties[name] = rendered;
      if (prop.type === "people") {
        people[name] = (prop.people ?? []).map((u) => u.name ?? u.id ?? "").filter(Boolean);
      }
    }

    // Block text — paginate a few pages of top-level children.
    const lines: string[] = [];
    let cursor: string | undefined;
    for (let i = 0; i < READ_BLOCK_PAGES; i++) {
      const qs = new URLSearchParams({ page_size: "100" });
      if (cursor) qs.set("start_cursor", cursor);
      const bRes = await fetch(`${NOTION_API}/blocks/${pageId}/children?${qs.toString()}`, { headers, signal: controller.signal });
      if (!bRes.ok) break;
      const bData = (await bRes.json()) as {
        results?: Record<string, unknown>[]; has_more?: boolean; next_cursor?: string;
      };
      for (const block of bData.results ?? []) {
        const line = blockText(block);
        if (line) lines.push(line);
      }
      if (!bData.has_more || !bData.next_cursor) break;
      cursor = bData.next_cursor;
    }

    const result: NotionPageContent = { id: pageId, title, properties, people, text: lines.join("\n").slice(0, READ_TEXT_CAP) };
    // Cache only successful reads (never a throw). Clear when full — a long-lived
    // isolate shouldn't grow this unbounded; simple beats an LRU here.
    if (readCache.size >= READ_CACHE_MAX) readCache.clear();
    readCache.set(pageId, { at: Date.now(), value: result });
    return result;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Notion workspace search (for notion_search grounding) ───────────────────
// Keyword search via /v1/search when the bot has no URL to read. Only pages the
// integration is CONNECTED to are visible — an empty result usually means the
// page isn't shared with the uno-bot integration, not that it doesn't exist.
// Read-only. Notion's search is title-weighted, so results are candidates to
// then source_read, not authoritative content.

export interface NotionSearchHit {
  id: string;
  title: string;
  url: string;
}

export async function notionSearch(
  env: Env,
  query: string,
  limit = 12,
): Promise<NotionSearchHit[]> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // No object filter — Notion only allows page OR database per call; omitting
    // the filter returns both. Prefer a scoped catalog query when the surface
    // is known (help_tutors / marketplace / decisions / …).
    const res = await fetch(`${NOTION_API}/search`, {
      method: "POST",
      headers: notionHeaders(env, { write: true }),
      body: JSON.stringify({
        query,
        page_size: Math.min(Math.max(limit, 1), 20),
      }),
      signal: controller.signal,
    });
    const data = (await res.json()) as {
      results?: Array<{
        object?: string;
        id?: string;
        url?: string;
        title?: NotionRichText;
        properties?: Record<string, NotionProperty>;
      }>;
      message?: string;
      code?: string;
    };
    if (!res.ok) {
      throw notionError(res.status, data, "search failed");
    }
    const hits: NotionSearchHit[] = [];
    for (const r of data.results ?? []) {
      if (!r.id) continue;
      let title = "(untitled)";
      if (r.object === "database" && r.title) {
        const t = plain(r.title);
        if (t) title = t;
      } else {
        for (const prop of Object.values(r.properties ?? {})) {
          if (prop.type === "title") {
            const t = plain(prop.title);
            if (t) title = t;
            break;
          }
        }
      }
      const bareId = r.id.replace(/-/g, "");
      hits.push({ id: bareId, title, url: r.url ?? `https://www.notion.so/${bareId}` });
    }
    return hits;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Generic create across convention surfaces (for notion_create) ───────────
// The mechanical half of a Notion create: resolve the destination DB + the
// surface's base properties, build the body, POST. The editorial half (what a
// good PRD says, which pillar) lives in the conventions the bot loads. Marketplace
// is intentionally NOT here — its relation + rollup + dual-write shape is an
// in-IDE writers/notion operation, not a one-shot Worker write.

export type NotionCreateSurface = "prd" | "intake" | "decision";

export interface NotionCreateInput {
  title: string;
  summary?: string;
  sections?: PrdSection[];
  acceptanceCriteria?: string[];
  productPillar?: string;
  sourceUrl?: string;
  /** Surface-specific extras rendered into the body (e.g. evidence link, tier). */
  extras?: Record<string, string>;
  /** Decisions DB: Roadmap card page URL/id for the Roadmap Card relation. */
  roadmapCard?: string;
  /** Decisions DB: Status select — Proposed | Accepted | Rejected | Superseded. */
  decisionStatus?: string;
}

interface SurfacePlan {
  databaseId?: string;
  properties: Record<string, unknown>;
  label: string;
}

function planSurface(env: Env, surface: NotionCreateSurface, input: NotionCreateInput): SurfacePlan {
  switch (surface) {
    case "prd": {
      const properties: Record<string, unknown> = {
        "Design Status": { status: { name: DESIGN_STATUS_NEED_PRD } },
        "Current Team": { multi_select: [{ name: "Design" }] },
      };
      if (input.productPillar?.trim()) {
        properties["Product Pillar"] = { multi_select: [{ name: input.productPillar.trim() }] };
      }
      return { databaseId: env.NOTION_ROADMAP_DB_ID, properties, label: "Design HQ → Product (Roadmap)" };
    }
    case "intake":
      // Maintenance intake card on the Roadmap board — the single command board
      // (no separate maintenance DB). Universal pillar + the "Maintenance"
      // Product Tag mark it for the filtered maintenance view.
      // ⚠️ Both option names ("Universal", "Maintenance") MUST already exist on
      // the Roadmap schema — writing an unknown name trips Notion's silent select
      // auto-create (notion.md footgun). "Maintenance" is a Product Tag option
      // added in the Notion UI; if you rename it, update this string.
      return {
        databaseId: env.NOTION_ROADMAP_DB_ID,
        properties: {
          "Product Pillar": { multi_select: [{ name: "Universal" }] },
          "Product Tag": { multi_select: [{ name: "Maintenance" }] },
        },
        label: "Roadmap (maintenance intake)",
      };
    case "decision": {
      const status = (input.decisionStatus?.trim() || "Proposed");
      const properties: Record<string, unknown> = {
        Status: { select: { name: status } },
        Date: { date: { start: new Date().toISOString().slice(0, 10) } },
      };
      const cardIds = input.roadmapCard ? extractNotionIds(input.roadmapCard) : [];
      if (cardIds.length) {
        properties["Roadmap Card"] = { relation: cardIds.map((id) => ({ id })) };
      }
      const evidence = input.sourceUrl?.trim() || input.extras?.evidence?.trim();
      if (evidence) properties.Evidence = { url: evidence };
      return {
        databaseId: env.NOTION_DECISIONS_DB_ID,
        properties,
        label: "Design HQ → Decisions DB",
      };
    }
  }
}

export async function notionCreate(
  env: Env,
  surface: NotionCreateSurface,
  input: NotionCreateInput,
): Promise<CreatedPrd & { label: string }> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  if (!input.title?.trim()) throw new Error("a title is required");

  const plan = planSurface(env, surface, input);
  if (!plan.databaseId) {
    throw new Error(`${surface}: destination database not configured on the Worker`);
  }
  if (surface === "decision") {
    // Require an EXTRACTABLE Roadmap id, not just a non-empty string — a bare
    // name ("the onboarding card") or a view-only link yields zero ids, so the
    // relation would be silently dropped and the decision filed UNLINKED, which
    // defeats the whole point of the surface (review 2026-07-13).
    if (!extractNotionIds(input.roadmapCard ?? "").length) {
      throw new Error("decision: properties.roadmap_card must be a Roadmap page URL or id (a link carrying the card's id) — a bare name won't link the decision");
    }
    const status = input.decisionStatus?.trim() || "Proposed";
    const allowed = new Set(["Proposed", "Accepted", "Rejected", "Superseded"]);
    if (!allowed.has(status)) {
      throw new Error(`decision: Status "${status}" is not an existing option`);
    }
  }

  // Fold surface-specific extras into a body section so nothing is silently lost.
  const sections = [...(input.sections ?? [])];
  if (input.extras && Object.keys(input.extras).length) {
    const body = Object.entries(input.extras)
      .filter(([, v]) => v?.trim())
      .map(([k, v]) => `${k}: ${v.trim()}`)
      .join("\n");
    if (body) sections.push({ heading: "Details", body });
  }

  // PRD-shaped surfaces get the Acceptance Criteria + Implementation Notes body
  // that fetchNotionPRD reads downstream; intake/research get a plain body.
  const isPrdShaped = surface === "prd";
  const children = buildChildren({
    title: input.title.trim(),
    summary: input.summary,
    sections,
    acceptanceCriteria: isPrdShaped ? input.acceptanceCriteria : undefined,
    sourceUrl: input.sourceUrl,
  });

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: notionHeaders(env, { write: true }),
      body: JSON.stringify({
        parent: { database_id: plan.databaseId },
        properties: { Name: { title: richText(input.title.trim()) }, ...plan.properties },
        children,
      }),
      signal: controller.signal,
    });
    const data = (await res.json()) as { id?: string; url?: string; message?: string; code?: string };
    if (!res.ok || !data.id) {
      throw notionError(res.status, data, "create failed");
    }
    return {
      id: data.id,
      url: data.url ?? `https://www.notion.so/${data.id.replace(/-/g, "")}`,
      label: plan.label,
    };
  } finally {
    clearTimeout(timer);
  }
}

// ─── Update an existing page: schema-aware property writes + narrative append ──
// (notion_update). Property writes introspect the page's PARENT DATABASE schema,
// so the tool can set ANY property by its real Notion type — no hardcoded
// name/type allowlist. The requested name is matched to the live schema case/
// space/underscore-insensitively, so "Dev_Status" resolves to "Dev Status"
// (live 2026-07-13: an underscore name was silently skipped as "unknown prop").
// select/status/multi_select values are validated against the schema's existing
// options, so a mismatch is REPORTED rather than tripping Notion's silent option
// auto-create. Names with no schema match — and types we can't safely set from a
// plain string (people/relation without an id) — are skipped WITH A REASON.
// Writes are no longer limited to the Roadmap board: the ✅ confirmation gate +
// requester identity are the safety, not a DB allowlist, so the bot can manage
// any page/DB it's shared on. `append` adds body blocks.

// A property from a database's live schema: its real (correctly-cased) name, its
// Notion type, and — for option-typed props — a lower→real option-name map used
// to echo the exact stored casing (Notion auto-creates an option on any mismatch).
interface NotionSchemaProp {
  name: string;
  type: string;
  options?: Map<string, string>;
}

// Match a requested property name to a schema name ignoring case, spaces, and
// underscores ("dev status" == "Dev_Status" == "DevStatus"). Exported so the
// proposal card can line up a requested field against the page's real property.
export function normalizeName(s: string): string {
  return s.toLowerCase().replace(/[\s_]+/g, "").trim();
}

// Pull Notion ids (uuid form, dashes optional) out of a value — for relation /
// people writes where the model passes a page/user id or a Notion URL. Strips
// the query string FIRST: a "copy link to view" URL carries the VIEW id in
// ?v=<id>, which would otherwise be captured alongside the page id and rejected
// as an unknown relation target (live review 2026-07-13). De-duped.
function extractNotionIds(v: string): string[] {
  const base = v.split("?")[0] ?? v;
  const out: string[] = [];
  const seen = new Set<string>();
  const re = /[0-9a-f]{8}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{4}-?[0-9a-f]{12}/gi;
  let m: RegExpExecArray | null;
  while ((m = re.exec(base))) {
    const id = m[0].replace(/-/g, "").toLowerCase();
    if (!seen.has(id)) { seen.add(id); out.push(id); }
  }
  return out;
}

// A date/datetime Notion's API will accept: YYYY-MM-DD, optionally with a time.
// Anything else (e.g. "next Monday") is rejected — and a bad date in a PATCH
// fails the WHOLE properties write, so we skip-on-unparseable like number/select.
function isIsoDate(s: string): boolean {
  return /^\d{4}-\d{2}-\d{2}([T ]\d{2}:\d{2}(:\d{2})?(\.\d+)?(Z|[+-]\d{2}:?\d{2})?)?$/.test(s);
}

// Format a single value for the property's REAL Notion type. Returns either a
// ready-to-PATCH value (with an optional note), or a skip reason the caller
// surfaces — it never guesses an option name or a type it can't set safely.
function formatPropByType(prop: NotionSchemaProp, raw: string): { value?: unknown; note?: string; skip?: string } {
  const v = raw.trim();
  if (!v) return { skip: "empty value" };
  switch (prop.type) {
    case "title": return { value: { title: richText(v) } };
    case "rich_text": return { value: { rich_text: richText(v) } };
    case "url": return { value: { url: v } };
    case "email": return { value: { email: v } };
    case "phone_number": return { value: { phone_number: v } };
    case "number": {
      const n = Number(v);
      return Number.isNaN(n) ? { skip: `"${v}" isn't a number` } : { value: { number: n } };
    }
    case "checkbox":
      return { value: { checkbox: /^(true|yes|y|1|checked|done|✅)$/i.test(v) } };
    case "date": {
      const [start, end] = v.split(/\s*(?:→|-->|\.\.|\bto\b|\s-\s)\s*/i);
      const s = (start ?? v).trim();
      if (!isIsoDate(s)) return { skip: `"${v}" isn't an ISO date (use YYYY-MM-DD)` };
      const e = end?.trim();
      if (e && !isIsoDate(e)) return { skip: `end date "${e}" isn't ISO (use YYYY-MM-DD)` };
      return { value: { date: { start: s, ...(e ? { end: e } : {}) } } };
    }
    case "select": {
      const real = prop.options?.get(v.toLowerCase());
      return real ? { value: { select: { name: real } } } : { skip: `"${v}" isn't an existing option for ${prop.name}` };
    }
    case "status": {
      const real = prop.options?.get(v.toLowerCase());
      return real ? { value: { status: { name: real } } } : { skip: `"${v}" isn't an existing status for ${prop.name}` };
    }
    case "multi_select": {
      const reals: { name: string }[] = [];
      const bad: string[] = [];
      for (const part of v.split(",").map((s) => s.trim()).filter(Boolean)) {
        const real = prop.options?.get(part.toLowerCase());
        if (real) reals.push({ name: real }); else bad.push(part);
      }
      if (!reals.length) return { skip: `no existing ${prop.name} options matched (${bad.join(", ")})` };
      return { value: { multi_select: reals }, note: bad.length ? `ignored unknown: ${bad.join(", ")}` : undefined };
    }
    case "people": {
      const ids = extractNotionIds(v);
      return ids.length
        ? { value: { people: ids.map((id) => ({ id })) } }
        : { skip: `${prop.name} is a People property — needs Notion user id(s), not a name` };
    }
    case "relation": {
      const ids = extractNotionIds(v);
      return ids.length
        ? { value: { relation: ids.map((id) => ({ id })) } }
        : { skip: `${prop.name} is a Relation — needs a Notion page id/URL` };
    }
    default:
      return { skip: `can't set "${prop.name}" (${prop.type}) from Slack` };
  }
}

export interface NotionUpdateInput {
  properties?: Record<string, string>;
  append?: { sections?: PrdSection[]; text?: string };
}

export interface NotionUpdateResult {
  id: string;
  updated: string[];
  skipped: string[];
  appended: number;
}

// Fetch a page's title + its PARENT DATABASE property schema (real names, types,
// and option lists). Any page the integration can read is fair game — the ✅ gate
// is the safety, not a DB allowlist. `schema` is empty when the page isn't
// parented by a database (a page-in-page has no property schema; only append
// applies). Uses the caller's signal to share the request-timeout budget.
interface PageSchema {
  title: string;
  inDatabase: boolean;
  schema: Map<string, NotionSchemaProp>; // keyed by normalizeName(realName)
}

// Just the page title (one GET) — for callers that need the title but NOT the
// parent-DB schema (e.g. the archive confirmation echo), so they don't pay the
// extra /databases fetch fetchPageSchema does.
async function fetchPageTitle(
  env: Env,
  pageId: string,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<string> {
  const res = await fetch(`${NOTION_API}/pages/${pageId}`, { headers, signal });
  const page = (await res.json()) as {
    id?: string; message?: string; code?: string; properties?: Record<string, NotionProperty>;
  };
  if (!res.ok || !page.id) throw notionError(res.status, page, "page not found");
  for (const prop of Object.values(page.properties ?? {})) {
    if (prop.type === "title") { const t = plain(prop.title); if (t) return t; }
  }
  return "(untitled)";
}

async function fetchPageSchema(
  env: Env,
  pageId: string,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<PageSchema> {
  const getRes = await fetch(`${NOTION_API}/pages/${pageId}`, { headers, signal });
  const page = (await getRes.json()) as {
    id?: string; message?: string; code?: string;
    parent?: { type?: string; database_id?: string };
    properties?: Record<string, NotionProperty>;
  };
  if (!getRes.ok || !page.id) {
    throw notionError(getRes.status, page, "page not found");
  }
  let title = "(untitled)";
  for (const prop of Object.values(page.properties ?? {})) {
    if (prop.type === "title") { title = plain(prop.title) || title; break; }
  }
  const dbId = page.parent?.database_id;
  const schema = new Map<string, NotionSchemaProp>();
  if (!dbId) {
    return { title, inDatabase: false, schema };
  }
  const dbRes = await fetch(`${NOTION_API}/databases/${dbId.replace(/-/g, "")}`, { headers, signal });
  const db = (await dbRes.json()) as {
    message?: string; code?: string;
    properties?: Record<string, {
      type: string;
      select?: { options?: { name?: string }[] };
      status?: { options?: { name?: string }[] };
      multi_select?: { options?: { name?: string }[] };
    }>;
  };
  if (!dbRes.ok) {
    throw notionError(dbRes.status, db, "database schema fetch failed");
  }
  for (const [name, def] of Object.entries(db.properties ?? {})) {
    let options: Map<string, string> | undefined;
    const rawOpts = def.select?.options ?? def.status?.options ?? def.multi_select?.options;
    if (rawOpts) {
      options = new Map();
      for (const o of rawOpts) { if (o.name) options.set(o.name.toLowerCase(), o.name); }
    }
    schema.set(normalizeName(name), { name, type: def.type, options });
  }
  return { title, inDatabase: true, schema };
}

// A field's current value on the page, read back for a notion_update card's
// `current → new` diff. `label` is the property's REAL name (so the bullet reads
// "Dev Status", not the model's "dev_status"); `value` is empty when unset.
export interface CurrentFieldValue {
  label: string;
  value: string;
}

export interface NotionTargetDescription {
  title: string;
  parent: string;
  /** Canonical page URL, for the linked-card line (never a bare hex). */
  url: string;
  /** Current values of the changed fields, keyed by normalizeName(fieldName). */
  current: Record<string, CurrentFieldValue>;
}

// Resolve a page's human label + parent-database name for a PROPOSAL card, so an
// approver sees the CONCRETE target of a notion_update / notion_archive (title +
// which DB) instead of a bare id — the human read is the backstop now that writes
// aren't DB-allowlisted (review 2026-07-13). Also returns the canonical URL and,
// for any `changedFields` passed, each field's CURRENT value (so a notion_update
// card can show `current → new`). Best-effort: returns null on any failure so the
// proposal still posts.
export async function describeNotionTarget(
  env: Env,
  rawUrlOrId: string,
  changedFields: string[] = [],
): Promise<NotionTargetDescription | null> {
  const pageId = parseNotionPageId(rawUrlOrId);
  if (!pageId || !env.NOTION_API_KEY) return null;
  const headers = notionHeaders(env, { write: true });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${NOTION_API}/pages/${pageId}`, { headers, signal: controller.signal });
    const page = (await res.json()) as {
      id?: string;
      url?: string;
      parent?: { type?: string; database_id?: string };
      properties?: Record<string, NotionProperty>;
    };
    if (!res.ok || !page.id) return null;
    let title = "(untitled)";
    for (const prop of Object.values(page.properties ?? {})) {
      if (prop.type === "title") { title = plain(prop.title) || title; break; }
    }

    // Read back the current value of each field being changed. Relation values
    // render as page titles (not ids) via a best-effort title fetch.
    const current: Record<string, CurrentFieldValue> = {};
    if (changedFields.length) {
      const wanted = new Set(changedFields.map(normalizeName));
      for (const [name, prop] of Object.entries(page.properties ?? {})) {
        const key = normalizeName(name);
        if (!wanted.has(key)) continue;
        let value = renderProperty(prop);
        if (prop.type === "relation" && prop.relation?.length) {
          const ids = prop.relation.map((r) => r.id).filter((x): x is string => !!x);
          const titles = ids.length ? await fetchPageTitles(env, ids).catch(() => []) : [];
          if (titles.length) value = titles.join(", ");
        }
        current[key] = { label: name, value };
      }
    }

    const url = page.url || `https://www.notion.so/${pageId}`;
    const dbId = page.parent?.database_id;
    if (!dbId) {
      const parent = page.parent?.type === "page_id" ? "a sub-page" : "a standalone page";
      return { title, parent, url, current };
    }
    const dbRes = await fetch(`${NOTION_API}/databases/${dbId.replace(/-/g, "")}`, { headers, signal: controller.signal });
    if (!dbRes.ok) return { title, parent: "a database", url, current };
    const db = (await dbRes.json()) as { title?: NotionRichText };
    return { title, parent: plain(db.title) || "a database", url, current };
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

export async function notionUpdate(
  env: Env,
  pageId: string,
  input: NotionUpdateInput,
): Promise<NotionUpdateResult> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const headers = notionHeaders(env, { write: true });
  const updated: string[] = [];
  const skipped: string[] = [];
  let appended = 0;

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // 1) Property changes — matched to the live schema by real name/type. Only
    //    fetch the schema when there ARE properties to set (append-only skips the
    //    two extra reads). No DB allowlist: the ✅ gate already approved this write.
    if (input.properties && Object.keys(input.properties).length) {
      const { schema, inDatabase } = await fetchPageSchema(env, pageId, headers, controller.signal);
      const props: Record<string, unknown> = {};
      for (const [reqName, value] of Object.entries(input.properties)) {
        if (typeof value !== "string") { skipped.push(`${reqName} (non-text value)`); continue; }
        const match = schema.get(normalizeName(reqName));
        if (!match) {
          skipped.push(
            inDatabase
              ? `${reqName} (no such property on this database)`
              : `${reqName} (this page isn't in a database, so it has no editable properties)`,
          );
          continue;
        }
        const fmt = formatPropByType(match, value);
        if (fmt.value === undefined) { skipped.push(`${match.name} (${fmt.skip})`); continue; }
        props[match.name] = fmt.value;
        updated.push(fmt.note ? `${match.name} (${fmt.note})` : match.name);
      }
      if (Object.keys(props).length) {
        const res = await fetch(`${NOTION_API}/pages/${pageId}`, {
          method: "PATCH",
          headers,
          body: JSON.stringify({ properties: props }),
          signal: controller.signal,
        });
        if (!res.ok) {
          const err = (await res.json().catch(() => ({}))) as { message?: string };
          throw notionError(res.status, err, "property update failed");
        }
      }
    }

    // 2) Narrative append.
    const children: unknown[] = [];
    for (const s of input.append?.sections ?? []) {
      if (!s?.heading?.trim()) continue;
      children.push(heading(s.heading.trim()));
      if (s.body?.trim()) children.push(...bodyToParagraphs(s.body));
    }
    if (input.append?.text?.trim()) children.push(...bodyToParagraphs(input.append.text));
    if (children.length) {
      const res = await fetch(`${NOTION_API}/blocks/${pageId}/children`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ children }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        throw notionError(res.status, err, "append failed");
      }
      appended = children.length;
    }

    // Drop any cached read so the next read reflects this write, not a stale copy.
    if (updated.length || appended) evictReadCache(pageId);

    return { id: pageId, updated, skipped, appended };
  } finally {
    clearTimeout(timer);
  }
}

// Archive (soft-delete → Notion trash, recoverable) any page the integration can
// reach. No DB allowlist — the ✅ confirmation gate + requester identity are the
// safety. Fetches the title first for the confirmation echo (best-effort).
export async function archiveCard(env: Env, pageId: string): Promise<ArchivedCard> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const headers = notionHeaders(env, { write: true });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const title = await fetchPageTitle(env, pageId, headers, controller.signal);

    const patchRes = await fetch(`${NOTION_API}/pages/${pageId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archived: true }),
      signal: controller.signal,
    });
    if (!patchRes.ok) {
      const err = (await patchRes.json().catch(() => ({}))) as { message?: string };
      throw notionError(patchRes.status, err, "archive failed");
    }
    // Drop any cached read so a subsequent read reflects the archive.
    evictReadCache(pageId);
    return { id: pageId, title };
  } finally {
    clearTimeout(timer);
  }
}

// ----- Roadmap card query (exact + complete, unlike /v1/search) -----
//
// Notion's /v1/search endpoint is a weak title-keyword search: live 2026-07-10
// it repeatedly failed to surface an existing, integration-shared Roadmap card
// by its literal title. Status/title/person questions about the Roadmap need
// EXACT and COMPLETE answers, so this queries the Roadmap database directly
// (classic databases/{id}/query, version 2022-06-28) and matches in the Worker.
// One page of 100 cards ≈ one subrequest (two max) — far cheaper than a chain
// of search calls on the free-tier 50-subrequest budget.

export interface RoadmapCard {
  title: string;
  url: string;
  /** The card's numeric ID (the board's unique_id property), when present. */
  card_number: number | null;
  design_status: string | null;
  dev_status: string | null;
  pillars: string[];
  /** People-type properties → names, e.g. { "Contributor": ["Bill Guo"] }. */
  people: Record<string, string[]>;
}

const ROADMAP_PAGE_SIZE = 100;
const ROADMAP_MAX_PAGES = 2;

export async function queryRoadmapCards(
  env: Env,
  opts: { designStatus?: string } = {},
): Promise<RoadmapCard[]> {
  if (!env.NOTION_ROADMAP_DB_ID) throw new Error("NOTION_ROADMAP_DB_ID not configured");
  return queryDatabaseRows(
    env,
    env.NOTION_ROADMAP_DB_ID,
    {
      maxPages: ROADMAP_MAX_PAGES,
      pageSize: ROADMAP_PAGE_SIZE,
      errorLabel: "roadmap query failed",
      filter: opts.designStatus
        ? { property: "Design Status", status: { equals: opts.designStatus } }
        : undefined,
    },
    (r): RoadmapCard | null => {
      if (!r.id || r.archived) return null;
      const props = r.properties ?? {};
      let title = "(untitled)";
      let cardNumber: number | null = null;
      let designStatus: string | null = null;
      let devStatus: string | null = null;
      let pillars: string[] = [];
      const people: Record<string, string[]> = {};
      for (const [name, prop] of Object.entries(props)) {
        if (prop.type === "title") {
          const t = plain(prop.title);
          if (t) title = t;
        } else if (prop.type === "unique_id") {
          cardNumber = prop.unique_id?.number ?? null;
        } else if (prop.type === "status" && name === "Design Status") {
          designStatus = prop.status?.name ?? null;
        } else if (prop.type === "status" && name === "Dev Status") {
          devStatus = prop.status?.name ?? null;
        } else if (prop.type === "multi_select" && name === "Product Pillar") {
          pillars = (prop.multi_select ?? []).map((o) => o.name ?? "").filter(Boolean);
        } else if (prop.type === "people") {
          const names = (prop.people ?? []).map((u) => u.name ?? "").filter(Boolean);
          if (names.length) people[name] = names;
        }
      }
      return {
        title,
        url: r.url ?? "",
        card_number: cardNumber,
        design_status: designStatus,
        dev_status: devStatus,
        pillars,
        people,
      };
    },
  );
}
