// The Prototype Marketplace row: `notion_create` surface `marketplace`, one
// row per prototype, created or updated. Worker-safe; the Notion plumbing it
// shares is `./notion.ts`'s.

import type { Env } from "../types";
import { countedFetch } from "../net";
import { attributionBlock } from "./notion-attribution";
import {
  bodyToBlocks,
  canonicalNotionUrl,
  extractNotionIds,
  normalizeName,
  NOTION_API,
  notionError,
  notionHeaders,
  notionUserIdForName,
  queryDatabaseRows,
  queryRoadmapCards,
  readPageRow,
  REQUEST_TIMEOUT_MS,
  richText,
  type OptionList,
} from "./notion";

// ─── Prototype Marketplace row (notion_create surface "marketplace") ──────────
// One prototype, one row: a publish finds the row already carrying its name or
// deployment link and updates it, and creates one only when there is none.
// Stage and the Project card are exact-matched against what Notion holds — the
// Stage options on the live schema, the card on the Roadmap board — and a value
// with no match comes back as a question. The rollups (Product Pillar, Design
// status, Roadmap ID) follow the Project card, so the write never names them.
// Schema: `docs/connectors/notion/marketplace-db.md`.
//
// The rollups (Product Pillar, Design status, Roadmap ID) are `rollup` on the
// live schema, so the type filter in `set` keeps them out of every write.

/** A value the database cannot take as given: the question to put back to the
 *  requester. Thrown before any write. */
export class MarketplaceQuestion extends Error {}

export interface MarketplaceInput {
  name: string;
  description?: string;
  /** Low-fi · Mid-fi · High-fi, matched to the stored spelling. */
  stage?: string;
  deploymentUrl?: string;
  /** A Roadmap card's URL, id, card number or exact title. */
  projectCard?: string;
  /** Notion user ids or workspace members' names. */
  contributors?: string[];
  loom?: string;
  repoPath?: string;
  localPath?: string;
  figmaReplica?: string;
  onBehalfOf?: string;
}

export interface PublishedMarketplaceRow {
  id: string;
  url: string;
  label: string;
  status: "created" | "updated";
}

const MARKETPLACE_LABEL = "Design HQ → Prototype Marketplace";

type SchemaDef = { type?: string; select?: OptionList };

async function marketplaceSchema(env: Env, databaseId: string): Promise<Record<string, SchemaDef>> {
  const res = await countedFetch(`${NOTION_API}/databases/${databaseId}`, { headers: notionHeaders(env) });
  const db = (await res.json()) as { properties?: Record<string, SchemaDef>; message?: string; code?: string };
  if (!res.ok) throw notionError(res.status, db, "marketplace schema fetch failed");
  return db.properties ?? {};
}

/** A Stage value with case, dashes and the `fi` suffix set aside. */
const stageKey = (s: string) => normalizeName(s).replace(/-/g, "").replace(/fi$/, "");

/** The stored Stage option this value names: case-blind, and `mid` reads as `Mid-fi`. */
function matchStage(raw: string, options: string[]): string {
  const hit = options.find((o) => stageKey(o) === stageKey(raw));
  if (hit) return hit;
  throw new MarketplaceQuestion(
    `Stage "${raw}" is not an option on the Marketplace. Which is it: ${options.join(" · ")}?`,
  );
}

/** The Roadmap card a Project card value names, as its page id. */
async function matchRoadmapCard(env: Env, raw: string): Promise<string> {
  const roadmap = (env.NOTION_ROADMAP_DB_ID ?? "").replace(/-/g, "");
  if (!roadmap) throw new Error("NOTION_ROADMAP_DB_ID not configured");
  const [id] = extractNotionIds(raw);
  if (id) {
    const row = await readPageRow(env, id);
    if (row && row.parentDatabaseId === roadmap) return row.id;
    throw new MarketplaceQuestion(
      `The Project card link "${raw}" is not a Roadmap card I can see. Which Roadmap card is this prototype for?`,
    );
  }
  const number = raw.match(/^\s*(?:rm-?|#)?(\d+)\s*$/i);
  const { rows } = number
    ? await queryRoadmapCards(env, { cardNumber: Number(number[1]) })
    : await queryRoadmapCards(env, { titlePhrase: raw.trim() });
  const exact = number ? rows : rows.filter((r) => normalizeName(r.title) === normalizeName(raw));
  const ids = exact.flatMap((r) => extractNotionIds(r.url).slice(-1));
  if (ids.length === 1) return ids[0]!;
  throw new MarketplaceQuestion(
    ids.length
      ? `"${raw}" matches ${ids.length} Roadmap cards. Which one is the Project card? A link settles it.`
      : `No Roadmap card is called "${raw}". Which Roadmap card is this prototype for? A link settles it.`,
  );
}

async function matchContributors(env: Env, raw: string[]): Promise<string[]> {
  const ids: string[] = [];
  const unknown: string[] = [];
  for (const value of raw) {
    const [id] = extractNotionIds(value);
    const resolved = id ?? (await notionUserIdForName(env, value, normalizeName));
    if (resolved) ids.push(resolved);
    else unknown.push(value);
  }
  if (unknown.length) {
    throw new MarketplaceQuestion(
      `I can't find ${unknown.map((u) => `"${u}"`).join(", ")} among the Notion workspace members. Who should be listed as Contributors?`,
    );
  }
  return [...new Set(ids)];
}

/** The row already holding this prototype, by name or deployment link. */
async function existingMarketplaceRow(env: Env, databaseId: string, input: MarketplaceInput): Promise<string | null> {
  const clauses: unknown[] = [{ property: "Name", title: { equals: input.name.trim() } }];
  if (input.deploymentUrl?.trim()) {
    clauses.push({ property: "Deployment URL", url: { equals: input.deploymentUrl.trim() } });
  }
  const { rows } = await queryDatabaseRows(
    env,
    databaseId,
    {
      maxPages: 1,
      pageSize: 10,
      filter: clauses.length > 1 ? { or: clauses } : clauses[0],
      errorLabel: "marketplace lookup failed",
    },
    (r) => (r.id && !r.archived ? r.id.replace(/-/g, "") : null),
  );
  if (rows.length > 1) {
    throw new MarketplaceQuestion(
      `${rows.length} Marketplace rows already carry this name or deployment link. Which one should I update?`,
    );
  }
  return rows[0] ?? null;
}

/** On an update, the replica line a create would have written, appended once:
 *  a page whose first blocks already hold the link is left as is. */
async function keepReplicaInBody(env: Env, pageId: string, replica: string, signal: AbortSignal): Promise<void> {
  const read = await countedFetch(`${NOTION_API}/blocks/${pageId}/children?page_size=100`, { headers: notionHeaders(env), signal });
  const held = (await read.json()) as { results?: unknown[]; message?: string; code?: string };
  if (!read.ok) throw notionError(read.status, held, "marketplace body read failed");
  if (JSON.stringify(held.results ?? []).includes(replica)) return;
  const res = await countedFetch(`${NOTION_API}/blocks/${pageId}/children`, {
    method: "PATCH",
    headers: notionHeaders(env, { write: true }),
    body: JSON.stringify({ children: bodyToBlocks(`**Figma replica:** ${replica}`) }),
    signal,
  });
  if (!res.ok) throw notionError(res.status, await res.json(), "marketplace replica append failed");
}

/**
 * Create or update the Prototype Marketplace row for one prototype.
 *
 * @param env - Worker bindings
 * @param input - The row's fields; only those given are written
 * @throws MarketplaceQuestion when Stage, the Project card, a contributor or
 *   the existing row cannot be matched — before anything is written
 */
export async function publishMarketplaceRow(env: Env, input: MarketplaceInput): Promise<PublishedMarketplaceRow> {
  if (!env.NOTION_API_KEY) throw new Error("NOTION_API_KEY not configured on the Worker");
  const name = input.name?.trim();
  if (!name) throw new MarketplaceQuestion("What is the prototype called?");
  const databaseId = (env.NOTION_MARKETPLACE_DB_ID ?? "").replace(/-/g, "");
  if (!databaseId) throw new Error("marketplace: destination database not configured on the Worker");

  const schema = await marketplaceSchema(env, databaseId);
  const properties: Record<string, unknown> = { Name: { title: richText(name) } };
  // Only a property the live schema carries, and never one Notion computes.
  const set = (prop: string, value: unknown) => {
    const type = schema[prop]?.type;
    if (type && type !== "rollup" && type !== "formula") properties[prop] = value;
  };
  const text = (v: string) => ({ rich_text: richText(v) });

  if (input.description?.trim()) set("Description", text(input.description.trim()));
  if (input.stage?.trim()) {
    const options = (schema.Stage?.select?.options ?? []).map((o) => o.name ?? "").filter(Boolean);
    set("Stage", { select: { name: matchStage(input.stage.trim(), options) } });
  }
  if (input.projectCard?.trim()) {
    set("Project card", { relation: [{ id: await matchRoadmapCard(env, input.projectCard) }] });
  }
  const contributors = (input.contributors ?? []).map((c) => c.trim()).filter(Boolean);
  if (contributors.length) {
    set("Contributors", { people: (await matchContributors(env, contributors)).map((id) => ({ id })) });
  }
  if (input.deploymentUrl?.trim()) set("Deployment URL", { url: input.deploymentUrl.trim() });
  if (input.loom?.trim()) set("Loom", { url: input.loom.trim() });
  if (input.repoPath?.trim()) set("Repo path", text(input.repoPath.trim()));
  if (input.localPath?.trim()) set("Local path", text(input.localPath.trim()));
  const replica = input.figmaReplica?.trim();
  if (replica) set("Figma replica", { url: replica });
  // The replica link stays on the page when the database has no column for it.
  const replicaInBody = !!replica && !("Figma replica" in properties);

  const existing = await existingMarketplaceRow(env, databaseId, input);
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), REQUEST_TIMEOUT_MS);
  try {
    if (existing) {
      const res = await countedFetch(`${NOTION_API}/pages/${existing}`, {
        method: "PATCH",
        headers: notionHeaders(env, { write: true }),
        body: JSON.stringify({ properties }),
        signal: controller.signal,
      });
      const data = (await res.json()) as { id?: string; url?: string; message?: string; code?: string };
      if (!res.ok) throw notionError(res.status, data, "marketplace update failed");
      if (replicaInBody) await keepReplicaInBody(env, existing, replica!, controller.signal);
      return { id: existing, url: canonicalNotionUrl(data.url, existing), label: MARKETPLACE_LABEL, status: "updated" };
    }

    set("Upvotes", { number: 0 });
    const lines = [
      input.description?.trim(),
      input.deploymentUrl?.trim() ? `**Try it:** ${input.deploymentUrl.trim()}` : "",
      replicaInBody ? `**Figma replica:** ${replica}` : "",
    ].filter(Boolean);
    const children = lines.length ? bodyToBlocks(lines.join("\n\n")) : [];
    if (input.onBehalfOf?.trim()) children.unshift(attributionBlock(input.onBehalfOf.trim()));
    const res = await countedFetch(`${NOTION_API}/pages`, {
      method: "POST",
      headers: notionHeaders(env, { write: true }),
      body: JSON.stringify({ parent: { database_id: databaseId }, properties, children }),
      signal: controller.signal,
    });
    const data = (await res.json()) as { id?: string; url?: string; message?: string; code?: string };
    if (!res.ok || !data.id) throw notionError(res.status, data, "marketplace create failed");
    return { id: data.id, url: canonicalNotionUrl(data.url, data.id), label: MARKETPLACE_LABEL, status: "created" };
  } finally {
    clearTimeout(timer);
  }
}
