// Worker-safe Notion client for create_prd. Creates a new PRD card on the
// "Roadmap" database (the Design HQ board), placed in the
// "Need PRD / Under Playground" Design Status column.
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

/**
 * Create a PRD card on the Roadmap board in the "Need PRD / Under Playground"
 * column. Throws on failure (caller surfaces the error to Slack).
 */
export async function createRoadmapPrdCard(env: Env, input: PrdInput): Promise<CreatedPrd> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  if (!env.NOTION_ROADMAP_DB_ID) throw new Error("NOTION_ROADMAP_DB_ID not configured");
  if (!input.title?.trim()) throw new Error("PRD title is required");

  const properties: Record<string, unknown> = {
    Name: { title: richText(input.title.trim()) },
    "Design Status": { status: { name: DESIGN_STATUS_NEED_PRD } },
    // Current Team = "Design" is what the Design HQ -> Product view filters on;
    // without it the card only shows in the unfiltered Product HQ -> Roadmap home.
    "Current Team": { multi_select: [{ name: "Design" }] },
  };
  if (input.productPillar?.trim()) {
    properties["Product Pillar"] = { multi_select: [{ name: input.productPillar.trim() }] };
  }

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    const res = await fetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.NOTION_API_KEY}`,
        "Notion-Version": NOTION_VERSION,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        parent: { database_id: env.NOTION_ROADMAP_DB_ID },
        properties,
        children: buildChildren(input),
      }),
      signal: controller.signal,
    });
    const data = (await res.json()) as { id?: string; url?: string; message?: string; code?: string };
    if (!res.ok || !data.id) {
      throw new Error(`Notion ${res.status}${data.code ? ` ${data.code}` : ""}: ${data.message ?? "create failed"}`);
    }
    return { id: data.id, url: data.url ?? `https://www.notion.so/${data.id.replace(/-/g, "")}` };
  } finally {
    clearTimeout(timer);
  }
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

  const headers = {
    Authorization: `Bearer ${env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
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
        throw new Error(`Notion ${res.status}${data.code ? ` ${data.code}` : ""}: ${data.message ?? "team query failed"}`);
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

/**
 * Archive (soft-delete) a PRD card on the Roadmap board. Safety: refuses to
 * touch a page that isn't a card in the Roadmap database, so the bot can only
 * remove Roadmap cards — not arbitrary Notion pages. Archiving is recoverable
 * from Notion's trash. Throws on failure.
 */
export async function archiveRoadmapCard(env: Env, pageId: string): Promise<ArchivedCard> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const headers = {
    Authorization: `Bearer ${env.NOTION_API_KEY}`,
    "Notion-Version": NOTION_VERSION,
    "Content-Type": "application/json",
  };
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    // Verify the page is a card in the Roadmap DB before archiving.
    const getRes = await fetch(`${NOTION_API}/pages/${pageId}`, { headers, signal: controller.signal });
    const page = (await getRes.json()) as {
      id?: string; message?: string; code?: string;
      parent?: { database_id?: string };
      properties?: { Name?: { title?: { plain_text?: string }[] } };
    };
    if (!getRes.ok || !page.id) {
      throw new Error(`Notion ${getRes.status}${page.code ? ` ${page.code}` : ""}: ${page.message ?? "page not found"}`);
    }
    const parentDb = (page.parent?.database_id ?? "").replace(/-/g, "").toLowerCase();
    const roadmapDb = env.NOTION_ROADMAP_DB_ID.replace(/-/g, "").toLowerCase();
    if (parentDb !== roadmapDb) {
      throw new Error("that page isn't a card on the Roadmap board — refusing to archive it");
    }
    const title = page.properties?.Name?.title?.[0]?.plain_text ?? "(untitled)";

    const patchRes = await fetch(`${NOTION_API}/pages/${pageId}`, {
      method: "PATCH",
      headers,
      body: JSON.stringify({ archived: true }),
      signal: controller.signal,
    });
    if (!patchRes.ok) {
      const err = (await patchRes.json().catch(() => ({}))) as { message?: string };
      throw new Error(`Notion ${patchRes.status}: ${err.message ?? "archive failed"}`);
    }
    return { id: pageId, title };
  } finally {
    clearTimeout(timer);
  }
}
