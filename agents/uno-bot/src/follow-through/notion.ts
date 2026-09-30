// The Roadmap and Notion-user reads card follow-ups make, on `Env`, over the
// integration's REST helpers (`../integrations/notion.ts`). Every call goes
// through `countedFetch`, so the meter sees it.
//
//   • the active cards: one `databases/{roadmap}/query` filtered to the three
//     active Design Status values, pages of 100 up to `ACTIVE_MAX_PAGES`;
//   • one card: `pages/{id}`;
//   • a card's comments: `comments?block_id=` — oldest first, so a card with
//     more than `COMMENT_MAX_PAGES` pages of them reads as commented just now,
//     which never flags it;
//   • a Notion user's name (`users/{id}`), and the Notion user with a given
//     name (`users`, a few pages);
//   • the Roadmap's `Product Pillar` options (`databases/{roadmap}`), for the
//     exact match a drafted card's pillar needs (hard rule 4).
//
// Card titles and pillar names come back as Notion wrote them; whoever renders
// one to Slack escapes it.

import type { Env } from "../types";
import { countedFetch } from "../net";
import { canonicalNotionUrl, NOTION_API, notionError, notionHeaders, queryRoadmapCards } from "../integrations/notion";
import { normalisePersonName } from "../usage/roles";
import { ACTIVE_DESIGN_STATUSES, type ActiveCard } from "./rules";

export const ACTIVE_MAX_PAGES = 3;
const COMMENT_MAX_PAGES = 2;
const USER_MAX_PAGES = 3;
const TIMEOUT_MS = 10_000;

interface RawPage {
  id?: string;
  url?: string;
  archived?: boolean;
  in_trash?: boolean;
  last_edited_time?: string;
  created_by?: { id?: string };
  properties?: Record<string, {
    type?: string;
    title?: { plain_text?: string }[];
    status?: { name?: string } | null;
    multi_select?: { name?: string }[];
    people?: { id?: string; name?: string }[];
  }>;
}

/** A Roadmap page as a card follow-up reads it. */
export function toActiveCard(page: RawPage): ActiveCard | null {
  if (!page.id) return null;
  const props = page.properties ?? {};
  const title = (props.Name?.title ?? []).map((t) => t.plain_text ?? "").join("").trim()
    || Object.values(props).find((p) => p.type === "title")?.title?.map((t) => t.plain_text ?? "").join("").trim()
    || "(untitled)";
  return {
    pageId: page.id.replace(/-/g, ""),
    url: canonicalNotionUrl(page.url, page.id),
    title,
    designStatus: props["Design Status"]?.status?.name ?? null,
    pillars: (props["Product Pillar"]?.multi_select ?? []).map((o) => o.name ?? "").filter(Boolean),
    contributors: (props.Contributor?.people ?? [])
      .filter((p): p is { id: string; name?: string } => !!p.id)
      .map((p) => ({ id: p.id, name: p.name ?? "" })),
    creatorId: page.created_by?.id ?? null,
    lastEditedAt: Date.parse(page.last_edited_time ?? "") || 0,
    archived: !!(page.archived || page.in_trash),
  };
}

async function notionJson<T>(env: Env, path: string, init: { method?: string; body?: unknown } = {}): Promise<{ status: number; data: T }> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT_MS);
  try {
    const res = await countedFetch(`${NOTION_API}${path}`, {
      method: init.method ?? "GET",
      headers: notionHeaders(env, { write: init.body !== undefined }),
      ...(init.body !== undefined ? { body: JSON.stringify(init.body) } : {}),
      signal: controller.signal,
    });
    return { status: res.status, data: (await res.json()) as T };
  } finally {
    clearTimeout(timer);
  }
}

/** Every Roadmap card in an active Design Status, and whether the read stopped short. */
export async function queryActiveCards(env: Env): Promise<{ cards: ActiveCard[]; truncated: boolean }> {
  if (!env.NOTION_ROADMAP_DB_ID) throw new Error("NOTION_ROADMAP_DB_ID not configured");
  const cards: ActiveCard[] = [];
  let cursor: string | undefined;
  for (let page = 0; page < ACTIVE_MAX_PAGES; page++) {
    const { status, data } = await notionJson<{ results?: RawPage[]; has_more?: boolean; next_cursor?: string | null; message?: string; code?: string }>(
      env,
      `/databases/${env.NOTION_ROADMAP_DB_ID}/query`,
      {
        method: "POST",
        body: {
          page_size: 100,
          filter: { or: ACTIVE_DESIGN_STATUSES.map((s) => ({ property: "Design Status", status: { equals: s } })) },
          ...(cursor ? { start_cursor: cursor } : {}),
        },
      },
    );
    if (status >= 300) throw notionError(status, data, "active card query failed");
    for (const raw of data.results ?? []) {
      const card = toActiveCard(raw);
      if (card) cards.push(card);
    }
    if (!data.has_more || !data.next_cursor) return { cards, truncated: false };
    cursor = data.next_cursor;
  }
  return { cards, truncated: true };
}

/** One card as it is now; null when it is gone or no longer shared. */
export async function readCard(env: Env, pageId: string): Promise<ActiveCard | null> {
  const { status, data } = await notionJson<RawPage & { message?: string; code?: string }>(env, `/pages/${pageId}`);
  if (status === 404) return null;
  if (status >= 300) throw notionError(status, data, "card read failed");
  return toActiveCard(data);
}

/** A page's newest comment, epoch ms, or null for none. */
export async function lastCommentAt(env: Env, pageId: string, now: number): Promise<number | null> {
  let newest: number | null = null;
  let cursor: string | undefined;
  for (let page = 0; page < COMMENT_MAX_PAGES; page++) {
    const q = new URLSearchParams({ block_id: pageId, page_size: "100", ...(cursor ? { start_cursor: cursor } : {}) });
    const { status, data } = await notionJson<{ results?: { created_time?: string }[]; has_more?: boolean; next_cursor?: string | null; message?: string; code?: string }>(
      env,
      `/comments?${q}`,
    );
    if (status >= 300) throw notionError(status, data, "comment read failed");
    for (const c of data.results ?? []) {
      const at = Date.parse(c.created_time ?? "");
      if (Number.isFinite(at) && (newest === null || at > newest)) newest = at;
    }
    if (!data.has_more || !data.next_cursor) return newest;
    cursor = data.next_cursor;
  }
  // More comments than read, newest last: treat the card as commented now.
  return now;
}

/** A Notion user's name, or null. */
export async function notionUserName(env: Env, userId: string): Promise<string | null> {
  const { status, data } = await notionJson<{ name?: string | null; type?: string }>(env, `/users/${userId}`);
  if (status >= 300 || data.type === "bot") return null;
  return data.name?.trim() || null;
}

/** The one Notion person with this name, as an id; null for none or several. */
export async function notionUserIdForName(env: Env, name: string): Promise<string | null> {
  const wanted = normalisePersonName(name);
  if (!wanted) return null;
  const hits = new Set<string>();
  let cursor: string | undefined;
  for (let page = 0; page < USER_MAX_PAGES; page++) {
    const q = new URLSearchParams({ page_size: "100", ...(cursor ? { start_cursor: cursor } : {}) });
    const { status, data } = await notionJson<{ results?: { id?: string; name?: string; type?: string }[]; has_more?: boolean; next_cursor?: string | null; message?: string; code?: string }>(
      env,
      `/users?${q}`,
    );
    if (status >= 300) throw notionError(status, data, "user list failed");
    for (const u of data.results ?? []) {
      if (u.id && u.type === "person" && u.name && normalisePersonName(u.name) === wanted) hits.add(u.id);
    }
    if (!data.has_more || !data.next_cursor) break;
    cursor = data.next_cursor;
  }
  return hits.size === 1 ? [...hits][0]! : null;
}

/** Titles of Roadmap cards holding any of these words — the title search
 *  roadmap_query uses, filtered server-side. */
export async function roadmapTitlesMatching(env: Env, words: string[]): Promise<string[]> {
  const { rows } = await queryRoadmapCards(env, { titleTokens: words });
  return rows.map((r) => r.title);
}

/** The Roadmap's `Product Pillar` options, exactly as the database has them. */
export async function roadmapPillarOptions(env: Env): Promise<string[]> {
  if (!env.NOTION_ROADMAP_DB_ID) throw new Error("NOTION_ROADMAP_DB_ID not configured");
  const { status, data } = await notionJson<{ properties?: Record<string, { multi_select?: { options?: { name?: string }[] } }>; message?: string; code?: string }>(
    env,
    `/databases/${env.NOTION_ROADMAP_DB_ID}`,
  );
  if (status >= 300) throw notionError(status, data, "roadmap schema read failed");
  return (data.properties?.["Product Pillar"]?.multi_select?.options ?? []).map((o) => o.name ?? "").filter(Boolean);
}
