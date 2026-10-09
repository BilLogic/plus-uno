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
import { countedFetch, subrequestBudgetSpent, rethrowIfBudget } from "../net";
import { attributionBlock } from "./notion-attribution";
import { isPlainRichText, RICH_TEXT_TYPES, richTextLinks, type RichTextRun } from "./notion-rich-text";
import {
  chunkBlocks,
  markdownToNotionBlocks,
  parseInline,
  MAX_BLOCKS_PER_REQUEST,
  type NotionBlock,
} from "./notion-blocks";

const NOTION_API = "https://api.notion.com/v1";
const NOTION_VERSION = "2022-06-28";
const TEAM_QUERY_PAGE_SIZE = 100;
const TEAM_MAX = 200;
/** Hard page cap. TEAM_MAX alone doesn't bound the loop: rows without a Name
 *  title are skipped without incrementing members.length, so a DB with many
 *  untitled rows paginated unbounded — the one paginated reader that predates
 *  queryDatabaseRows and so never got a maxPages. */
export const TEAM_MAX_PAGES = 3;
const DESIGN_STATUS_NEED_PRD = "Need PRD / Under Playground";

/**
 * The Design Status a `notion_create` on this surface writes, or null when it
 * writes none. `planSurface` sets it from here, and the Review pop-up and the
 * card's summary show it from here, so what a confirmer reads is what lands.
 */
export function createdDesignStatus(surface: string): string | null {
  return surface.trim().toLowerCase() === "prd" ? DESIGN_STATUS_NEED_PRD : null;
}
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

function heading(content: string) {
  return { object: "block", type: "heading_2", heading_2: { rich_text: richText(content) } };
}

function todo(content: string) {
  // Inline-parsed: an acceptance criterion routinely carries a `code` term or a
  // **bold** subject, and that is the same Markdown as everywhere else.
  return { object: "block", type: "to_do", to_do: { checked: false, rich_text: parseInline(content) } };
}

/**
 * A body written by the model → Notion blocks.
 *
 * Was `bodyToParagraphs`: split on blank lines, one `paragraph` block each, no
 * markup parsing at all. The model writes standard Markdown (`AGENT.md`, and
 * `notion.md` § Decisions shows a body as `**Decision:** one sentence`), so
 * bullets arrived as literal hyphens, bold as literal asterisks, and links as
 * literal `[label](url)`. See `notion-blocks.ts` for the mapping.
 */
function bodyToBlocks(body: string): unknown[] {
  return markdownToNotionBlocks(body);
}

function buildChildren(input: PrdInput): unknown[] {
  const children: unknown[] = [];

  if (input.summary?.trim()) {
    children.push(heading("Summary"));
    children.push(...bodyToBlocks(input.summary));
  }

  for (const section of input.sections ?? []) {
    if (!section?.heading?.trim()) continue;
    children.push(heading(section.heading.trim()));
    if (section.body?.trim()) children.push(...bodyToBlocks(section.body));
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
// "Figma User ID" (rich_text) is optional and filled in by each member: the
// daily role-map sync (`usage/team-roles-sync.ts`) maps it to the member's
// Slack person, so a Figma commenter can be known to be a teammate.

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
  "Figma User ID"?: { rich_text?: NotionRichText };
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
  /** The member's Figma User ID cell as they filled it in; `usage/roles.ts`
   *  `normaliseFigmaId` reads the id out of it. */
  figmaUserId?: string;
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
 * matches a topic against the bios itself; this just returns the people.
 * Paginates up to TEAM_MAX rows / TEAM_MAX_PAGES pages, reporting `truncated`
 * so the caller never presents a partial roster as the whole team. Throws on
 * failure (caller surfaces it).
 */
export async function findTeamMembers(
  env: Env,
): Promise<{ members: TeamMember[]; truncated: boolean }> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  if (!env.NOTION_TEAM_DB_ID) throw new Error("NOTION_TEAM_DB_ID not configured");

  const headers = notionHeaders(env, { write: true });
  const members: TeamMember[] = [];
  let pages = 0;
  let cursor: string | undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    do {
      const body: Record<string, unknown> = { page_size: TEAM_QUERY_PAGE_SIZE };
      if (cursor) body.start_cursor = cursor;
      const res = await countedFetch(`${NOTION_API}/databases/${env.NOTION_TEAM_DB_ID}/query`, {
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
          figmaUserId: plain(p["Figma User ID"]?.rich_text) || undefined,
        });
      }
      pages++;
      cursor = data.has_more ? data.next_cursor : undefined;
    } while (cursor && members.length < TEAM_MAX && pages < TEAM_MAX_PAGES);
    return { members, truncated: cursor != null };
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
export const APPS_MAX_PAGES = 2;

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
): Promise<{ rows: T[]; truncated: boolean }> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  if (!databaseId) throw new Error("database id is empty");
  const out: T[] = [];
  let cursor: string | undefined;
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    for (let page = 0; page < opts.maxPages; page++) {
      // A budget stop here is not a failure and not an absence: it's a partial
      // read, which is precisely what `truncated` exists to say.
      if (subrequestBudgetSpent()) return { rows: out, truncated: true };
      const res = await countedFetch(`${NOTION_API}/databases/${databaseId}/query`, {
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
      if (!data.has_more || !data.next_cursor) return { rows: out, truncated: false };
      cursor = data.next_cursor;
    }
    // Fell out of the loop = page budget exhausted with rows still unread. The
    // caller MUST be told, or it reports a partial window as a complete scan
    // (live miss 2026-07-29 — a card past row 200 came back as "not on the
    // board"). Structural, so a future edit can't drift an index comparison.
    return { rows: out, truncated: true };
  } finally {
    clearTimeout(timer);
  }
}

export async function queryThirdPartyApps(
  env: Env,
): Promise<{ apps: ThirdPartyApp[]; truncated: boolean }> {
  if (!env.NOTION_APPS_DB_ID) throw new Error("NOTION_APPS_DB_ID not configured");
  const { rows, truncated } = await queryDatabaseRows(
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
        url: canonicalNotionUrl(r.url, r.id),
        admins: (p["Application Admin"]?.people ?? []).map((u) => u.name ?? "").filter(Boolean),
        powerUserPageIds: (p["Power User(s)"]?.relation ?? []).map((rel) => rel.id ?? "").filter(Boolean),
        usageStatus: p["Usage Status"]?.status?.name ?? undefined,
        licenseTypes: (p["License Type"]?.multi_select ?? []).map((o) => o.name ?? "").filter(Boolean),
      };
    },
  );
  return { apps: rows, truncated };
}

// ─── Generic catalog DB query (notion_search scoped catalogs) ────────────────
// Same lesson as apps / roadmap_query: /v1/search misses literal titles inside
// known DBs. Query databases/{id} directly (1–2 subrequests) and match in-Worker.

const CATALOG_PAGE_SIZE = 100;
// 3, not 2 — one doubling of headroom over the largest catalog today (Design
// Running Notes, 105 rows). Not higher: the honest thing here is the truncated
// flag below, which makes a partial read say so at ANY page cap, and every
// extra page is real worst-case spend on the tool whose budget already sits
// closest to the edge. agent/run-agent.ts derives notion_search's bound from this.
export const CATALOG_MAX_PAGES = 3;
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
 * Returns `truncated` alongside the rows: the page budget can run out with rows
 * still unread, and a caller that doesn't know cannot tell "no such row" from
 * "didn't get that far". Discarding it here is what let notion_search advertise
 * a partial window as a "complete scan".
 *
 * @param databaseId - Notion DATABASE id (not data-source id)
 * @param opts.skipTitleNames - title property names to ignore (multi-source DBs)
 */
export async function queryCatalogDatabase(
  env: Env,
  databaseId: string,
  opts: { skipTitleNames?: string[] } = {},
): Promise<{ rows: CatalogRow[]; truncated: boolean }> {
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
        url: canonicalNotionUrl(r.url, r.id),
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
export async function fetchPageTitles(env: Env, pageIds: string[], cap = PAGE_TITLE_CAP): Promise<string[]> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const headers = notionHeaders(env);
  const titles: string[] = [];
  for (const id of pageIds.slice(0, cap)) {
    try {
      const res = await countedFetch(`${NOTION_API}/pages/${id}`, { headers });
      if (!res.ok) continue;
      const page = (await res.json()) as { properties?: Record<string, NotionProperty> };
      for (const prop of Object.values(page.properties ?? {})) {
        if (prop.type === "title") {
          const t = plain(prop.title);
          if (t) titles.push(t);
          break;
        }
      }
    } catch (e) {
      rethrowIfBudget(e);
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

/**
 * A Notion link a teammate can open. The API's `url` on a page or database now
 * comes back as `https://app.notion.com/p/<slug>-<id>`, and that host can 404
 * in an ordinary browser session (#729 — a proposal card's page link,
 * 2026-09-25). The same page at `https://www.notion.so/<slug>-<id>` opens.
 *
 * Every `url` read off a Notion API response goes through here. The rewrite
 * swaps the origin and drops the `/p` segment, and keeps the rest: a workspace
 * segment (`/p/plus-tutors/<id>`), a `?v=` view, a `#block` anchor. Any other
 * host passes through untouched. With no `url`, the page id alone is the link.
 */
export function canonicalNotionUrl(url: string | null | undefined, id?: string): string {
  if (!url) return id ? `https://www.notion.so/${id.replace(/-/g, "")}` : "";
  let u: URL;
  try {
    u = new URL(url);
  } catch {
    return url;
  }
  if (u.hostname !== "app.notion.com") return url;
  return `https://www.notion.so${u.pathname.replace(/^\/p(?=\/|$)/, "")}${u.search}${u.hash}`;
}

export interface ArchivedCard {
  id: string;
  title: string;
}


// ─── Read a Notion page (for read_source / linked-source grounding) ──────────
// Returns the page title, its properties rendered to strings (so the model can
// read an Owner/Assignee/Status field), and the page's block text. Read-only.

/** Max relation page-ids resolved to titles per call — each is one subrequest. */
export const PAGE_TITLE_CAP = 4;
export const READ_BLOCK_PAGES = 3; // cap pagination so a huge page can't blow the budget
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
// (notionUpdate/archiveCard) instead of serving a stale copy. Module-private:
// the cache is this module's own, and every write that invalidates it is in
// here — an exported handle would invite a caller to guess at when to clear a
// cache it cannot see.
function evictReadCache(pageId: string): void {
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
  /**
   * The same blocks `text` was rendered from, each keeping the identity a
   * later in-place replacement needs: its id and the `last_edited_time` seen
   * at THIS read. A replace cites both, and the write refuses when the stamp
   * has moved — so the body is never overwritten on top of an edit the bot
   * never saw (ADR-029). Same order as `text`, one entry per rendered line.
   */
  blocks: NotionPageBlock[];
  /** The pages nested in its body (`child_page` blocks), in order: how a
   *  Roadmap card's PRD subpage is found. They carry no text of their own. */
  subpages: Array<{ id: string; title: string }>;
  /** The database the page is a row of, dashes removed; null for a page that
   *  is no database's row. */
  parentDatabaseId: string | null;
  /** Notion's `parent.type`: `workspace` for a top-level page. */
  parentType: string | null;
  /** More top-level blocks follow the last one read: `blocks` stops short of
   *  the page's end. */
  truncated: boolean;
}

export interface NotionPageBlock {
  id: string;
  /** Notion's own block type: paragraph, heading_2, bulleted_list_item, … */
  type: string;
  /** ISO-8601, as Notion reports it. The token a replace has to match. */
  lastEditedTime: string;
  /** The block's rendered text — the line it contributed to `text`. */
  text: string;
  /** Words only: no link, mention, equation or formatting a text replace
   *  would drop (`isPlainRichText`). */
  plain: boolean;
  /** The URLs its rich text links or mentions (`richTextLinks`). */
  links: string[];
  /** Its last edit was an integration's — uno-bot's own write, as a rule. */
  byBot: boolean;
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

/** The mark a block's rendered line leads with, by type: what a reader of
 *  `text` sees, and never part of the block's own rich text. */
function displayPrefix(type: string): string {
  if (type === "bulleted_list_item" || type === "numbered_list_item") return "• ";
  if (type === "to_do") return "☐ ";
  return "";
}

/**
 * A block's text without the mark its rendered line leads with — the text an
 * in-place replacement writes back, so a fix drafted from `• Owner: Ade`
 * writes `Owner: Ade` into the list item rather than a second bullet.
 *
 * @param type - Notion's block type
 * @param text - The rendered line, or a replacement drafted from one
 */
export function stripBlockPrefix(type: string, text: string): string {
  const prefix = displayPrefix(type);
  return prefix && text.startsWith(prefix) ? text.slice(prefix.length) : text;
}

function blockText(block: Record<string, unknown>): string {
  const type = block.type as string;
  const body = block[type] as { rich_text?: NotionRichText } | undefined;
  const txt = plain(body?.rich_text);
  if (!txt) return "";
  if (type.startsWith("heading")) return `\n${txt}`;
  return `${displayPrefix(type)}${txt}`;
}

/**
 * Read a Notion page: title + rendered properties (incl. people/Owner) + block
 * text. Throws on failure so read_source can report it honestly. Read-only.
 *
 * A children page that fails, or a budget that runs out mid-read, leaves the
 * blocks already read — what `read_source` shows — and that partial read is
 * not cached. With `complete`, either throws instead (a failed page as
 * `Notion <status>`): the sweep reads a page to judge all of it, and a page
 * read as empty would pass its thread by.
 */
export async function readNotionPage(
  env: Env,
  pageId: string,
  opts: { complete?: boolean } = {},
): Promise<NotionPageContent> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");

  // Serve a fresh cached read (0 subrequests) if we read this page recently.
  const cached = readCache.get(pageId);
  if (cached && Date.now() - cached.at < READ_CACHE_TTL_MS) return cached.value;

  const headers = notionHeaders(env, { write: true });
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const pageRes = await countedFetch(`${NOTION_API}/pages/${pageId}`, { headers, signal: controller.signal });
    const page = (await pageRes.json()) as {
      id?: string; message?: string; code?: string;
      parent?: { type?: string; database_id?: string };
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
    const blocks: NotionPageBlock[] = [];
    const subpages: NotionPageContent["subpages"] = [];
    let cursor: string | undefined;
    let partial = false;
    let truncated = false;
    for (let i = 0; i < READ_BLOCK_PAGES; i++) {
      // Keep the blocks already read; a complete read lets the fetch below
      // throw the budget's own error instead.
      if (!opts.complete && subrequestBudgetSpent()) {
        partial = true;
        break;
      }
      const qs = new URLSearchParams({ page_size: "100" });
      if (cursor) qs.set("start_cursor", cursor);
      const bRes = await countedFetch(`${NOTION_API}/blocks/${pageId}/children?${qs.toString()}`, { headers, signal: controller.signal });
      if (!bRes.ok) {
        if (opts.complete) {
          const err = (await bRes.json().catch(() => ({}))) as { code?: string; message?: string };
          throw notionError(bRes.status, err, "the page's blocks could not be read");
        }
        partial = true;
        break;
      }
      const bData = (await bRes.json()) as {
        results?: Record<string, unknown>[]; has_more?: boolean; next_cursor?: string;
      };
      for (const block of bData.results ?? []) {
        if (block.type === "child_page") {
          const title = (block.child_page as { title?: string } | undefined)?.title?.trim();
          if (block.id && title) subpages.push({ id: String(block.id).replace(/-/g, ""), title });
          continue;
        }
        const line = blockText(block);
        if (!line) continue;
        lines.push(line);
        // Identity travels with the text, not beside it: the model can only
        // cite a block it was told the id of, and it can only be told here.
        const type = String(block.type ?? "");
        const runs = (block[type] as { rich_text?: RichTextRun[] } | undefined)?.rich_text;
        blocks.push({
          id: String(block.id ?? ""),
          type,
          lastEditedTime: String(block.last_edited_time ?? ""),
          text: line.trim(),
          plain: isPlainRichText(runs),
          links: richTextLinks(runs),
          byBot: (block.last_edited_by as { type?: string } | undefined)?.type === "bot",
        });
      }
      if (!bData.has_more || !bData.next_cursor) break;
      cursor = bData.next_cursor;
      if (i === READ_BLOCK_PAGES - 1) truncated = true;
    }

    const result: NotionPageContent = {
      id: pageId,
      title,
      properties,
      people,
      text: lines.join("\n").slice(0, READ_TEXT_CAP),
      blocks,
      subpages,
      parentDatabaseId: page.parent?.database_id?.replace(/-/g, "") ?? null,
      parentType: page.parent?.type ?? null,
      truncated: truncated || partial,
    };
    // Cache only whole reads (never a throw or a partial one). Clear when
    // full — a long-lived isolate shouldn't grow this unbounded; simple beats
    // an LRU here.
    if (partial) return result;
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
  /** The database a page hit is a row of, dashes removed; null for a page
   *  that is none's, or for a database hit. */
  parentDatabaseId: string | null;
  /** Notion's `parent.type`: `workspace`, `page_id`, `block_id`,
   *  `database_id`; null when Notion gave none. */
  parentType: string | null;
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
    const res = await countedFetch(`${NOTION_API}/search`, {
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
        parent?: { type?: string; database_id?: string };
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
      hits.push({
        id: bareId,
        title,
        url: canonicalNotionUrl(r.url, bareId),
        parentDatabaseId: r.object === "page" ? (r.parent?.database_id?.replace(/-/g, "") ?? null) : null,
        parentType: r.parent?.type ?? null,
      });
    }
    return hits;
  } finally {
    clearTimeout(timer);
  }
}

// ─── Rows edited since a time, and a page's comments (for the sweep) ─────────
// The end-of-day sweep reads the running notes and the Roadmap cards changed
// since its cursor. One query page, oldest edit first, so a job that stops
// part-way keeps its place by the last row it finished. Card follow-ups read
// the Roadmap's cards in its active Design Status values, and one card again,
// as the same row. Read-only.

/** A database row, as the sweep's and card follow-ups' reads return it. */
export interface EditedRow {
  /** Dashes removed. */
  id: string;
  url: string;
  title: string;
  /** ISO-8601, as Notion reports it. */
  lastEditedTime: string;
  /** The database the row belongs to, dashes removed — as Notion reports it
   *  on the row, never assumed from the query. */
  parentDatabaseId: string | null;
  /** Select, multi-select and status values by property name, joined by ", ". */
  properties: Record<string, string>;
  /** People-typed properties → names. */
  people: Record<string, string[]>;
  /** People-typed properties → each person's Notion user id and name, paired
   *  as Notion lists them (a name may be ""), those without an id left out. */
  persons: Record<string, Array<{ id: string; name: string }>>;
  /** Select, multi-select and status values by property name, one per option. */
  values: Record<string, string[]>;
  /** Who created the row, as a Notion user id. */
  createdById: string | null;
}

type RawRow = DbQueryRow & { last_edited_time?: string; parent?: { database_id?: string }; created_by?: { id?: string } };

/** One raw database row as an `EditedRow`, or null when it is archived. */
function toEditedRow(r: RawRow & { in_trash?: boolean }): EditedRow | null {
  if (!r.id || r.archived || r.in_trash) return null;
  const bareId = r.id.replace(/-/g, "");
  let title = "(untitled)";
  const properties: Record<string, string> = {};
  const people: Record<string, string[]> = {};
  const persons: Record<string, Array<{ id: string; name: string }>> = {};
  const values: Record<string, string[]> = {};
  for (const [name, prop] of Object.entries(r.properties ?? {})) {
    if (prop.type === "title") title = plain(prop.title) || title;
    else if (prop.type === "people") {
      people[name] = (prop.people ?? []).map((u) => u.name ?? "").filter(Boolean);
      persons[name] = (prop.people ?? []).filter((u) => u.id).map((u) => ({ id: u.id!, name: u.name ?? "" }));
    } else if (prop.type === "select" || prop.type === "multi_select" || prop.type === "status") {
      const value = renderProperty(prop);
      if (value) properties[name] = value;
      const list = prop.type === "multi_select" ? (prop.multi_select ?? []).map((o) => o.name ?? "") : [(prop.type === "status" ? prop.status : prop.select)?.name ?? ""];
      values[name] = list.filter(Boolean);
    }
  }
  return {
    id: bareId,
    url: canonicalNotionUrl(r.url, bareId),
    title,
    lastEditedTime: r.last_edited_time ?? "",
    parentDatabaseId: r.parent?.database_id?.replace(/-/g, "") ?? null,
    properties,
    people,
    persons,
    values,
    createdById: r.created_by?.id ?? null,
  };
}

/** One page of a database query, as `EditedRow`s. One subrequest. */
async function queryRowPage(
  env: Env,
  databaseId: string,
  body: Record<string, unknown>,
  label: string,
): Promise<{ rows: EditedRow[]; more: boolean; next: string | null }> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await countedFetch(`${NOTION_API}/databases/${databaseId.replace(/-/g, "")}/query`, {
      method: "POST",
      headers: notionHeaders(env, { write: true }),
      body: JSON.stringify(body),
      signal: controller.signal,
    });
    const data = (await res.json()) as { results?: RawRow[]; has_more?: boolean; next_cursor?: string | null; message?: string; code?: string };
    if (!res.ok) throw notionError(res.status, data, label);
    const rows = (data.results ?? []).map(toEditedRow).filter((r): r is EditedRow => r !== null);
    return { rows, more: data.has_more === true, next: data.next_cursor ?? null };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The rows of one database whose status property holds one of `statuses`:
 * one query page of at most `limit`, whether more wait past it, and where the
 * next page starts. One subrequest. Throws on failure.
 *
 * @param env - Carries NOTION_API_KEY
 * @param databaseId - The database to read
 * @param property - A status property, by its exact name
 * @param statuses - Its option names, exact
 * @param limit - Rows per read, 1–100
 * @param after - The `next` of the page before
 */
export async function queryRowsWithStatus(
  env: Env,
  databaseId: string,
  property: string,
  statuses: readonly string[],
  limit = 100,
  after?: string,
): Promise<{ rows: EditedRow[]; more: boolean; next: string | null }> {
  return queryRowPage(
    env,
    databaseId,
    {
      page_size: Math.min(Math.max(limit, 1), 100),
      filter: { or: statuses.map((s) => ({ property, status: { equals: s } })) },
      ...(after ? { start_cursor: after } : {}),
    },
    "status query failed",
  );
}

/** One database row read again, or null when it is gone or unshared. One
 *  subrequest. */
export async function readPageRow(env: Env, pageId: string): Promise<EditedRow | null> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await countedFetch(`${NOTION_API}/pages/${pageId}`, { headers: notionHeaders(env), signal: controller.signal });
    const data = (await res.json()) as RawRow & { in_trash?: boolean; message?: string; code?: string };
    if (res.status === 404) return null;
    if (!res.ok) throw notionError(res.status, data, "page read failed");
    return toEditedRow(data);
  } finally {
    clearTimeout(timer);
  }
}

/** The integration's own Notion bot user id — what `created_by` holds on a
 *  page uno-bot made — or null when Notion would not say. One subrequest. */
export async function notionBotUserId(env: Env): Promise<string | null> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const res = await countedFetch(`${NOTION_API}/users/me`, { headers: notionHeaders(env) });
  const data = (await res.json()) as { id?: string };
  return res.ok && data.id ? data.id : null;
}

/** A Notion person's name, or null for a bot or an unknown id. One subrequest. */
export async function notionUserName(env: Env, userId: string): Promise<string | null> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const res = await countedFetch(`${NOTION_API}/users/${userId}`, { headers: notionHeaders(env) });
  const data = (await res.json()) as { name?: string | null; type?: string };
  if (!res.ok || data.type !== "person") return null;
  return data.name?.trim() || null;
}

/** Notion users pages read looking for a name. */
const USER_LIST_PAGES = 3;

/**
 * The one Notion person whose name, compared by `normalise`, is this one; null
 * for none or several. Up to `USER_LIST_PAGES` subrequests.
 */
export async function notionUserIdForName(env: Env, name: string, normalise: (s: string) => string): Promise<string | null> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const wanted = normalise(name);
  if (!wanted) return null;
  const hits = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < USER_LIST_PAGES; page++) {
    const q = new URLSearchParams({ page_size: "100", ...(cursor ? { start_cursor: cursor } : {}) });
    const res = await countedFetch(`${NOTION_API}/users?${q.toString()}`, { headers: notionHeaders(env) });
    const data = (await res.json()) as { results?: { id?: string; name?: string; type?: string }[]; has_more?: boolean; next_cursor?: string | null; message?: string; code?: string };
    if (!res.ok) throw notionError(res.status, data, "user list failed");
    for (const u of data.results ?? []) if (u.id && u.type === "person" && u.name && normalise(u.name) === wanted) hits.add(u.id);
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return hits.size === 1 ? [...hits][0]! : null;
}

/**
 * The rows of one database edited at or after `since` — Notion rounds the
 * stamp to the minute, so the caller passes over what it already handled —
 * oldest edit first: one query page of at most `limit`, whether more wait past
 * it, and where the next page starts. One subrequest. Throws on failure.
 *
 * @param env - Carries NOTION_API_KEY
 * @param databaseId - The database to read
 * @param since - ISO-8601; rows edited before it are left out
 * @param limit - Rows per read, 1–100
 * @param after - The `next` of the page before, to read the one after it
 */
export async function queryEditedSince(
  env: Env,
  databaseId: string,
  since: string,
  limit = 25,
  after?: string,
): Promise<{ rows: EditedRow[]; more: boolean; next: string | null }> {
  return queryRowPage(
    env,
    databaseId,
    {
      page_size: Math.min(Math.max(limit, 1), 100),
      filter: { timestamp: "last_edited_time", last_edited_time: { on_or_after: since } },
      sorts: [{ timestamp: "last_edited_time", direction: "ascending" }],
      ...(after ? { start_cursor: after } : {}),
    },
    "edited-since query failed",
  );
}

/** One comment on a page. */
export interface PageComment {
  id: string;
  /** ISO-8601. */
  createdTime: string;
  text: string;
  /** The URLs it links or mentions. */
  links: string[];
  /** Made by an integration — uno-bot's own, as a rule. */
  byBot: boolean;
}

/**
 * A page's open comments, oldest first: one page of up to 100. One
 * subrequest. Throws on failure.
 *
 * @param env - Carries NOTION_API_KEY
 * @param pageId - The page
 */
export async function listPageComments(env: Env, pageId: string): Promise<PageComment[]> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const qs = new URLSearchParams({ block_id: pageId, page_size: "100" });
    const res = await countedFetch(`${NOTION_API}/comments?${qs.toString()}`, {
      headers: notionHeaders(env),
      signal: controller.signal,
    });
    const data = (await res.json()) as {
      results?: Array<{ id?: string; created_time?: string; created_by?: { type?: string }; rich_text?: RichTextRun[] & NotionRichText }>;
      message?: string;
      code?: string;
    };
    if (!res.ok) throw notionError(res.status, data, "comments could not be read");
    return (data.results ?? [])
      .filter((c) => c.id)
      .map((c) => ({
        id: String(c.id),
        createdTime: c.created_time ?? "",
        text: plain(c.rich_text),
        links: richTextLinks(c.rich_text),
        byBot: c.created_by?.type === "bot",
      }));
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
  /** Whom the page is written for: its body opens with the attribution line
   *  naming them (`notion-attribution.ts`). */
  onBehalfOf?: string;
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
        "Design Status": { status: { name: createdDesignStatus("prd")! } },
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
  if (input.onBehalfOf?.trim()) children.unshift(attributionBlock(input.onBehalfOf.trim()));

  // Notion accepts at most 100 blocks per request. A long PRD — summary, eight
  // sections of several paragraphs each, acceptance criteria, plus the two
  // fixed headings — crosses that, and before 2026-08-22 the whole create 400'd
  // and the card was never made. Create with the first batch, append the rest.
  const [firstBatch = [], ...restBatches] = chunkBlocks(children, MAX_BLOCKS_PER_REQUEST);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await countedFetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: notionHeaders(env, { write: true }),
      body: JSON.stringify({
        parent: { database_id: plan.databaseId },
        properties: { Name: { title: richText(input.title.trim()) }, ...plan.properties },
        children: firstBatch,
      }),
      signal: controller.signal,
    });
    const data = (await res.json()) as { id?: string; url?: string; message?: string; code?: string };
    if (!res.ok || !data.id) {
      throw notionError(res.status, data, "create failed");
    }

    // The page exists now. A failed continuation must NOT throw: the card is
    // real and linked, and reporting "create failed" would send someone
    // hunting for a page that is sitting there. Log the shortfall instead.
    for (const batch of restBatches) {
      const append = await countedFetch(`${NOTION_API}/blocks/${data.id}/children`, {
        method: "PATCH",
        headers: notionHeaders(env, { write: true }),
        body: JSON.stringify({ children: batch }),
        signal: controller.signal,
      }).catch(() => null);
      if (!append?.ok) {
        console.warn(
          `[notion] created ${data.id} but a ${batch.length}-block continuation did not append — the page is short`,
        );
        break;
      }
    }

    return {
      id: data.id,
      url: canonicalNotionUrl(data.url, data.id),
      label: plan.label,
    };
  } finally {
    clearTimeout(timer);
  }
}

/**
 * The options a database's select, status or multi-select property offers, in
 * their stored spelling — what a write exact-matches against, since Notion
 * silently creates any option it is handed (`docs/connectors/notion.md`).
 * Null when the property is not one of those types or is not on the schema.
 *
 * @param env - Worker bindings
 * @param databaseId - The database, dashes optional
 * @param property - The property's exact name
 * @throws When the schema read fails
 */
export async function databaseOptions(env: Env, databaseId: string, property: string): Promise<string[] | null> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await countedFetch(`${NOTION_API}/databases/${databaseId.replace(/-/g, "")}`, {
      headers: notionHeaders(env),
      signal: controller.signal,
    });
    const db = (await res.json()) as {
      message?: string;
      code?: string;
      properties?: Record<string, { select?: OptionList; status?: OptionList; multi_select?: OptionList }>;
    };
    if (!res.ok) throw notionError(res.status, db, "database schema fetch failed");
    const def = db.properties?.[property];
    const list = def?.select ?? def?.status ?? def?.multi_select;
    if (!list) return null;
    return (list.options ?? []).map((o) => o.name ?? "").filter(Boolean);
  } finally {
    clearTimeout(timer);
  }
}

type OptionList = { options?: { name?: string }[] };

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
  /** In-place rewrites, each keyed to a block id + the stamp seen at read. */
  replace?: NotionBlockReplacement[];
  /** New blocks placed right after a named block, on the same stamp check. */
  insert?: NotionBlockInsertion[];
  /** Whom the append is written for: the appended blocks open with the
   *  attribution line naming them. A replace, an insert and a property change
   *  carry no line — they edit what is already there. */
  onBehalfOf?: string;
}

/**
 * New blocks, written right after one block of the page — how the sweep adds
 * an answer under its section. `lastEditedTime` is that block's stamp at the
 * read: the text was placed against the section as read, so a block that
 * moved since is left alone and reported (ADR-029).
 */
export interface NotionBlockInsertion {
  afterBlockId: string;
  lastEditedTime: string;
  /** Markdown, the same authoring shape as an `append` section body. */
  content: string;
}

/**
 * One block, rewritten where it stands.
 *
 * `lastEditedTime` is the whole safety: it is the stamp the read handed over,
 * and the write compares it against the block's live one first. A body that
 * moved between the read and the ✅ is left alone and reported, because the
 * replacement was composed against text that no longer exists.
 */
export interface NotionBlockReplacement {
  blockId: string;
  lastEditedTime: string;
  /** Markdown, the same authoring shape as an `append` section body. */
  content: string;
}

export interface NotionUpdateResult {
  id: string;
  updated: string[];
  skipped: string[];
  appended: number;
  /** Blocks rewritten in place. */
  replaced: number;
  /** Blocks placed after a named block (`insert`). */
  inserted: number;
  /** Replacements that wrote NOTHING, each saying which block and why. */
  refused: string[];
  /** How many of `refused` were refused because the block's stamp had moved
   *  since it was read (ADR-029) — what the usage record counts as a stale
   *  write refused. */
  staleStamps: number;
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
  const res = await countedFetch(`${NOTION_API}/pages/${pageId}`, { headers, signal });
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
  const getRes = await countedFetch(`${NOTION_API}/pages/${pageId}`, { headers, signal });
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
  const dbRes = await countedFetch(`${NOTION_API}/databases/${dbId.replace(/-/g, "")}`, { headers, signal });
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
    const res = await countedFetch(`${NOTION_API}/pages/${pageId}`, { headers, signal: controller.signal });
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
          const titles = ids.length
            ? await fetchPageTitles(env, ids).catch((e) => { rethrowIfBudget(e); return [] as string[]; })
            : [];
          if (titles.length) value = titles.join(", ");
        }
        current[key] = { label: name, value };
      }
    }

    const url = canonicalNotionUrl(page.url, pageId);
    const dbId = page.parent?.database_id;
    if (!dbId) {
      const parent = page.parent?.type === "page_id" ? "a sub-page" : "a standalone page";
      return { title, parent, url, current };
    }
    const dbRes = await countedFetch(`${NOTION_API}/databases/${dbId.replace(/-/g, "")}`, { headers, signal: controller.signal });
    if (!dbRes.ok) return { title, parent: "a database", url, current };
    const db = (await dbRes.json()) as { title?: NotionRichText };
    return { title, parent: plain(db.title) || "a database", url, current };
  } catch (e) {
    rethrowIfBudget(e);
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** A block id, shortened for a message a human reads. Full uuids in a Slack
 *  line are noise; the first segment is enough to point at one. */
function shortBlockId(id: string): string {
  return id.replace(/-/g, "").slice(0, 8);
}

/**
 * Notion's block update takes ONE block's own payload — it cannot create
 * children. A replacement that renders to a table, or to a list item with a
 * nested child, therefore has no honest in-place write, and quietly dropping
 * the children would be the silent corruption this feature exists to avoid.
 */
function carriesChildren(block: NotionBlock): boolean {
  const payload = block[block.type] as { children?: unknown[] } | undefined;
  return Array.isArray(payload?.children) && payload.children.length > 0;
}

/**
 * Rewrite ONE block in place, after checking it is still the block that was
 * read. Returns how many blocks landed, plus a refusal line when something
 * did not.
 *
 * The GET is not an optimisation — it IS the check. `last_edited_time` is the
 * only thing Notion gives us that moves when a human edits the block, and the
 * API has no conditional write, so the compare has to happen here.
 *
 * A replacement that renders to SEVERAL blocks updates the first where it
 * stands and appends the rest immediately after it, via the parent's children
 * endpoint with `after` — so the page keeps its order. Nothing is ever
 * deleted: the bot has no path to remove a block a human wrote.
 */
async function replaceBlock(
  env: Env,
  op: NotionBlockReplacement,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<{ replaced: number; refusal?: string; stale?: true }> {
  const label = shortBlockId(op.blockId);
  const rendered = markdownToNotionBlocks(op.content);
  if (!rendered.length) {
    return { replaced: 0, refusal: `${label} (the replacement content is empty)` };
  }
  const first = rendered[0]!;
  if (carriesChildren(first)) {
    return {
      replaced: 0,
      refusal: `${label} (a replacement starting with a table or a nested list can't be written in place — append it instead)`,
    };
  }

  const getRes = await countedFetch(`${NOTION_API}/blocks/${op.blockId}`, { headers, signal });
  const live = (await getRes.json().catch(() => ({}))) as {
    id?: string; type?: string; last_edited_time?: string; message?: string; code?: string;
    parent?: { type?: string; page_id?: string; block_id?: string };
  } & Record<string, unknown>;
  if (!getRes.ok || !live.id) {
    throw notionError(getRes.status, live, `block ${label} not found`);
  }
  const seen = op.lastEditedTime.trim();
  const now = live.last_edited_time ?? "";
  // String compare, not date compare: Notion round-trips its own stamp, so a
  // difference in the text IS a difference in the block — and a stamp we
  // cannot parse has to fail closed rather than quietly compare equal.
  if (!seen || seen !== now) {
    return {
      replaced: 0,
      refusal: `${label} changed since read (read ${seen || "no stamp cited"}, now ${now || "unknown"})`,
      stale: true,
    };
  }

  // Notion refuses a PATCH that changes a block's type. A text block keeps
  // its own type and state — the list item stays a list item, the to-do its
  // tick, the heading its level — and only its rich text is rewritten, with
  // the line's display mark taken off the replacement first.
  const liveType = live.type ?? "";
  const keepType = RICH_TEXT_TYPES.has(liveType);
  // A text replace writes words only. A block whose rich text carries a link,
  // a mention, an equation or formatting would lose it, so it is refused —
  // unwritten, as a moved block is — rather than quietly flattened.
  const liveText = (live[liveType] as { rich_text?: RichTextRun[] } | undefined)?.rich_text;
  if (keepType && !isPlainRichText(liveText)) {
    return {
      replaced: 0,
      refusal: `${label} (this block has links, mentions or formatting that a text replace would drop — edit it in Notion)`,
    };
  }
  const written = keepType ? markdownToNotionBlocks(stripBlockPrefix(liveType, op.content)) : rendered;
  const head = written[0] ?? first;
  const headText = (head[head.type] as { rich_text?: unknown } | undefined)?.rich_text;
  const payload = keepType && Array.isArray(headText) ? { [liveType]: { rich_text: headText } } : { [head.type]: head[head.type] };
  const res = await countedFetch(`${NOTION_API}/blocks/${op.blockId}`, {
    method: "PATCH",
    headers,
    body: JSON.stringify(payload),
    signal,
  });
  if (!res.ok) {
    const err = (await res.json().catch(() => ({}))) as { message?: string };
    throw notionError(res.status, err, `block ${label} update failed`);
  }

  const rest = written.slice(1);
  if (!rest.length) return { replaced: 1 };

  const parentId = live.parent?.page_id ?? live.parent?.block_id;
  if (!parentId) {
    // The first block landed; say that, rather than claim the whole rewrite.
    return {
      replaced: 1,
      refusal: `${label} (rewritten, but the remaining ${rest.length} block(s) had nowhere to go — the block reports no parent)`,
    };
  }
  let placed = 0;
  let after = op.blockId;
  for (const batch of chunkBlocks(rest, MAX_BLOCKS_PER_REQUEST)) {
    const followRes = await countedFetch(`${NOTION_API}/blocks/${parentId}/children`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ children: batch, after }),
      signal,
    });
    if (!followRes.ok) {
      const err = (await followRes.json().catch(() => ({}))) as { message?: string };
      return {
        replaced: 1 + placed,
        refusal: `${label} (rewritten, but ${rest.length - placed} follow-on block(s) didn't land: ${err.message ?? followRes.status})`,
      };
    }
    const body = (await followRes.json().catch(() => ({}))) as { results?: { id?: string }[] };
    // Chain the next batch onto the LAST block just written. Anchoring every
    // batch to the original block would land them in reverse order.
    const lastId = body.results?.at(-1)?.id;
    if (lastId) after = lastId;
    placed += batch.length;
  }
  return { replaced: 1 + placed };
}

/**
 * Place new blocks right after one block, after checking that block is still
 * the one that was read — the same GET-and-compare `replaceBlock` does. The
 * anchor itself is never changed. Returns how many blocks landed, plus a
 * refusal line when something did not.
 */
async function insertAfter(
  pageId: string,
  op: NotionBlockInsertion,
  headers: Record<string, string>,
  signal: AbortSignal,
): Promise<{ inserted: number; refusal?: string; stale?: true }> {
  const label = shortBlockId(op.afterBlockId);
  const rendered = markdownToNotionBlocks(op.content);
  if (!rendered.length) return { inserted: 0, refusal: `after ${label} (the text to add is empty)` };
  const getRes = await countedFetch(`${NOTION_API}/blocks/${op.afterBlockId}`, { headers, signal });
  const live = (await getRes.json().catch(() => ({}))) as {
    id?: string; last_edited_time?: string; message?: string; code?: string;
    parent?: { page_id?: string; block_id?: string };
  };
  if (!getRes.ok || !live.id) throw notionError(getRes.status, live, `block ${label} not found`);
  const seen = op.lastEditedTime.trim();
  const now = live.last_edited_time ?? "";
  if (!seen || seen !== now) {
    return {
      inserted: 0,
      refusal: `after ${label}: it changed since read (read ${seen || "no stamp cited"}, now ${now || "unknown"})`,
      stale: true,
    };
  }
  // The anchor must sit on the page the card names, at its top level: a block
  // id from elsewhere never carries the text to another page.
  const parentId = live.parent?.page_id;
  if (!parentId || parentId.replace(/-/g, "") !== pageId.replace(/-/g, "")) {
    return { inserted: 0, refusal: `after ${label} (that block is not on this page)` };
  }
  let placed = 0;
  let after = op.afterBlockId;
  for (const batch of chunkBlocks(rendered, MAX_BLOCKS_PER_REQUEST)) {
    const res = await countedFetch(`${NOTION_API}/blocks/${parentId}/children`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ children: batch, after }),
      signal,
    });
    if (!res.ok) {
      const err = (await res.json().catch(() => ({}))) as { message?: string; code?: string };
      if (!placed) throw notionError(res.status, err, `adding after block ${label} failed`);
      return { inserted: placed, refusal: `after ${label} (${rendered.length - placed} block(s) didn't land: ${err.message ?? res.status})` };
    }
    const body = (await res.json().catch(() => ({}))) as { results?: { id?: string }[] };
    const lastId = body.results?.at(-1)?.id;
    if (lastId) after = lastId;
    placed += batch.length;
  }
  return { inserted: placed };
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
  const refused: string[] = [];
  let staleStamps = 0;
  let appended = 0;
  let replaced = 0;
  let inserted = 0;

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
        const res = await countedFetch(`${NOTION_API}/pages/${pageId}`, {
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

    // 2) In-place rewrites. Before the append, so a turn that both corrects a
    //    stale section and adds a note leaves the correction above the note.
    for (const op of input.replace ?? []) {
      if (!op?.blockId?.trim() || !op.content?.trim()) {
        refused.push(
          `${op?.blockId ? shortBlockId(op.blockId) : "(no block id)"} (a replace needs a block id and content)`,
        );
        continue;
      }
      const r = await replaceBlock(env, op, headers, controller.signal);
      replaced += r.replaced;
      if (r.refusal) refused.push(r.refusal);
      if (r.stale) staleStamps++;
    }

    // 2b) Insertions after a named block, on the same stamp check.
    for (const op of input.insert ?? []) {
      if (!op?.afterBlockId?.trim() || !op.content?.trim()) {
        refused.push("(an insert needs a block to follow and content)");
        continue;
      }
      const r = await insertAfter(pageId, op, headers, controller.signal);
      inserted += r.inserted;
      if (r.refusal) refused.push(r.refusal);
      if (r.stale) staleStamps++;
    }

    // 3) Narrative append.
    const children: unknown[] = [];
    for (const s of input.append?.sections ?? []) {
      if (!s?.heading?.trim()) continue;
      children.push(heading(s.heading.trim()));
      if (s.body?.trim()) children.push(...bodyToBlocks(s.body));
    }
    if (input.append?.text?.trim()) children.push(...bodyToBlocks(input.append.text));
    if (children.length && input.onBehalfOf?.trim()) children.unshift(attributionBlock(input.onBehalfOf.trim()));
    // Batched at Notion's 100-block-per-request limit. `appended` counts what
    // actually landed, so a partial failure reports the truth rather than the
    // total we hoped for.
    for (const batch of chunkBlocks(children, MAX_BLOCKS_PER_REQUEST)) {
      const res = await countedFetch(`${NOTION_API}/blocks/${pageId}/children`, {
        method: "PATCH",
        headers,
        body: JSON.stringify({ children: batch }),
        signal: controller.signal,
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { message?: string };
        if (appended) {
          // Some blocks are already on the page. Throwing here would report a
          // total failure of a partly-successful append.
          console.error(`[notion] append stopped after ${appended} blocks: ${err.message ?? res.status}`);
          break;
        }
        throw notionError(res.status, err, "append failed");
      }
      appended += batch.length;
    }

    // Drop any cached read so the next read reflects this write, not a stale copy.
    if (updated.length || appended || replaced || inserted) evictReadCache(pageId);

    return { id: pageId, updated, skipped, appended, replaced, inserted, refused, staleStamps };
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

    const patchRes = await countedFetch(`${NOTION_API}/pages/${pageId}`, {
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
// One page of 100 cards ≈ one subrequest, up to ROADMAP_MAX_PAGES — still far
// cheaper than a chain of search calls on the free-tier 50-subrequest budget.
// Title / card-number asks filter server-side, so they cost 1 page, not 5;
// keep roadmap_query's share of UNGATED_TOOL_BUDGET (agent/loop-policy.ts) in
// step with this.

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
// The board is >300 cards and grows. A blind window silently hides the tail —
// which is exactly how a real card ("TACT - Tutor Compliance Monitor", past row
// 300) got reported as "not on the board" on 2026-07-29. Title and card-number
// lookups now filter SERVER-side (below) so position stops mattering; this cap
// only bounds unfiltered enumeration, and truncation is reported, never hidden.
export const ROADMAP_MAX_PAGES = 5;
// A read the server filters to one Design Status goes further, so a count per
// status is exact: the board's largest status (Need PRD / Under Playground)
// holds more than 500 cards. Measured live 2026-10-09, one read per status for
// all seven cost 15 Notion subrequests with that status cut at five pages; ten
// pages adds at most five, about 25 of the 38-subrequest lookup ceiling with
// the model's round-trips. A read the ceiling stops still says `truncated`.
export const ROADMAP_STATUS_MAX_PAGES = 10;
const ROADMAP_TITLE_PROP = "Name";
const ROADMAP_ID_PROP = "ID";
export const ROADMAP_STATUS_PROP = "Design Status";

/**
 * Server-side prefilter. Notion can't fuzzy-rank, but it CAN find every row whose
 * title contains a token — so we hand it the tokens and rank what comes back in
 * the Worker. Falls back to an unfiltered scan if the property names ever drift.
 */
function roadmapFilter(opts: {
  designStatus?: string;
  titleTokens?: string[];
  titlePhrase?: string;
  cardNumber?: number | null;
}): unknown {
  const clauses: unknown[] = [];
  if (opts.designStatus) {
    clauses.push({ property: ROADMAP_STATUS_PROP, status: { equals: opts.designStatus } });
  }
  if (opts.cardNumber != null) {
    // A card number is a unique key — ANDing a half-remembered title against it
    // can only subtract, so it wins alone and scoreTitle ranks locally.
    clauses.push({ property: ROADMAP_ID_PROP, unique_id: { equals: opts.cardNumber } });
    return clauses.length === 1 ? clauses[0] : { and: clauses };
  }
  // Longest-first, NOT first-six: tokens() keeps every word ≥3 chars in the
  // user's word order, so slicing by position spends the budget on "the / one /
  // about" and drops the proper noun that actually discriminates — which left
  // the named card invisible while adjacent ones matched.
  const toks = [...(opts.titleTokens ?? [])].sort((a, b) => b.length - a.length).slice(0, 6);
  const phrase = opts.titlePhrase?.trim();
  if (toks.length) {
    clauses.push({
      or: toks.map((t) => ({ property: ROADMAP_TITLE_PROP, title: { contains: t } })),
    });
  } else if (phrase) {
    // A title made only of short words ("DS", "AI", "UX") yields no tokens, and
    // used to fall through to an UNFILTERED read: five pages of a board that no
    // longer fits in five, ranked against no words, so it came back empty every
    // time (2026-09-18). The phrase is a filter Notion can run itself — and with
    // tokens present it adds nothing, since a title holding the phrase holds
    // every one of its words.
    clauses.push({ property: ROADMAP_TITLE_PROP, title: { contains: phrase } });
  }
  if (!clauses.length) return undefined;
  return clauses.length === 1 ? clauses[0] : { and: clauses };
}

export async function queryRoadmapCards(
  env: Env,
  opts: { designStatus?: string; titleTokens?: string[]; titlePhrase?: string; cardNumber?: number | null } = {},
): Promise<{ rows: RoadmapCard[]; truncated: boolean }> {
  if (!env.NOTION_ROADMAP_DB_ID) throw new Error("NOTION_ROADMAP_DB_ID not configured");
  return queryDatabaseRows(
    env,
    env.NOTION_ROADMAP_DB_ID,
    {
      maxPages: opts.designStatus ? ROADMAP_STATUS_MAX_PAGES : ROADMAP_MAX_PAGES,
      pageSize: ROADMAP_PAGE_SIZE,
      errorLabel: "roadmap query failed",
      filter: roadmapFilter(opts),
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
        } else if (prop.type === "status" && name === ROADMAP_STATUS_PROP) {
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
        url: canonicalNotionUrl(r.url, r.id),
        card_number: cardNumber,
        design_status: designStatus,
        dev_status: devStatus,
        pillars,
        people,
      };
    },
  );
}
