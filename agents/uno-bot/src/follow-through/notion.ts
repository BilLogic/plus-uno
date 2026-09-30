// The Roadmap and Notion-user reads card follow-ups make, on `Env`. Every
// request is the integration's own (`../integrations/notion.ts`), the same
// reads the end-of-day capture sweep uses; this file only puts them together
// and turns a Roadmap row into an `ActiveCard`.
//
//   • the active cards: `queryRowsWithStatus` over the three active Design
//     Status values, pages of 100 up to `ACTIVE_MAX_PAGES`;
//   • one card: `readPageRow`;
//   • a card's newest comment: `listPageComments` — one page, oldest first, so
//     a card with a full page of comments reads as commented just now, which
//     never flags it;
//   • a Notion user's name, and the one Notion person with a given name;
//   • the Roadmap's `Product Pillar` and `Design Status` options
//     (`databaseOptions`), for the exact match a drafted card's pillar and a
//     stuck card's new status need (hard rule 4).
//
// Card titles and option names come back as Notion wrote them; whoever renders
// one to Slack escapes it.

import type { Env } from "../types";
import {
  databaseOptions,
  listPageComments,
  notionUserIdForName,
  queryRoadmapCards,
  queryRowsWithStatus,
  readPageRow,
  type EditedRow,
} from "../integrations/notion";
import { normalisePersonName } from "../usage/roles";
import { ACTIVE_DESIGN_STATUSES, type ActiveCard } from "./rules";

export { notionBotUserId, notionUserName } from "../integrations/notion";

export const ACTIVE_MAX_PAGES = 3;
/** `listPageComments` reads one page of this many. */
const COMMENT_PAGE = 100;

/** A Roadmap row as a card follow-up reads it. */
export function toActiveCard(row: EditedRow): ActiveCard {
  return {
    pageId: row.id,
    url: row.url,
    title: row.title,
    designStatus: row.values["Design Status"]?.[0] ?? null,
    pillars: row.values["Product Pillar"] ?? [],
    contributors: row.persons.Contributor ?? [],
    creatorId: row.createdById,
    lastEditedAt: Date.parse(row.lastEditedTime) || 0,
    archived: false,
  };
}

function roadmapId(env: Env): string {
  if (!env.NOTION_ROADMAP_DB_ID) throw new Error("NOTION_ROADMAP_DB_ID not configured");
  return env.NOTION_ROADMAP_DB_ID;
}

/** Every Roadmap card in an active Design Status, and whether the read stopped short. */
export async function queryActiveCards(env: Env): Promise<{ cards: ActiveCard[]; truncated: boolean }> {
  const cards: ActiveCard[] = [];
  let after: string | undefined;
  for (let page = 0; page < ACTIVE_MAX_PAGES; page++) {
    const { rows, more, next } = await queryRowsWithStatus(env, roadmapId(env), "Design Status", ACTIVE_DESIGN_STATUSES, 100, after);
    cards.push(...rows.map(toActiveCard));
    if (!more || !next) return { cards, truncated: false };
    after = next;
  }
  return { cards, truncated: true };
}

/** One card as it is now; null when it is gone, archived or no longer shared. */
export async function readCard(env: Env, pageId: string): Promise<ActiveCard | null> {
  const row = await readPageRow(env, pageId);
  return row ? toActiveCard(row) : null;
}

/** A page's newest comment, epoch ms, or null for none. */
export async function lastCommentAt(env: Env, pageId: string, now: number): Promise<number | null> {
  const comments = await listPageComments(env, pageId);
  // A full page may hide newer ones past it: read as commented now.
  if (comments.length >= COMMENT_PAGE) return now;
  const times = comments.map((c) => Date.parse(c.createdTime)).filter(Number.isFinite);
  return times.length ? Math.max(...times) : null;
}

/** The one Notion person with this name, as an id; null for none or several. */
export function notionUserForName(env: Env, name: string): Promise<string | null> {
  return notionUserIdForName(env, name, normalisePersonName);
}

/** Titles of Roadmap cards holding any of these words — the title search
 *  roadmap_query uses, filtered server-side. */
export async function roadmapTitlesMatching(env: Env, words: string[]): Promise<string[]> {
  const { rows } = await queryRoadmapCards(env, { titleTokens: words });
  return rows.map((r) => r.title);
}

/** One Roadmap property's options, exactly as the schema has them and in its
 *  order; none when the property is gone from the schema. */
export async function roadmapOptions(env: Env, property: "Product Pillar" | "Design Status"): Promise<string[]> {
  return (await databaseOptions(env, roadmapId(env), property)) ?? [];
}
