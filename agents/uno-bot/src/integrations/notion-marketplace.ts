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
  notionUserIdsForNames,
  queryDatabaseRows,
  queryRoadmapCards,
  readPageRow,
  REQUEST_TIMEOUT_MS,
  richText,
  ROADMAP_MAX_PAGES,
  USER_LIST_PAGES,
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
  const byName = raw.filter((v) => !extractNotionIds(v).length);
  const named = byName.length ? await notionUserIdsForNames(env, byName, normalizeName) : new Map<string, string | null>();
  for (const value of raw) {
    const [id] = extractNotionIds(value);
    const resolved = id ?? named.get(value) ?? null;
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

/** Stage, the Project card and Contributors as the database holds them. */
interface MatchedFields {
  stage?: string;
  card?: string;
  contributors?: string[];
}

/** Exact-match the three checked fields; a MarketplaceQuestion for the first that has no match. */
async function matchFields(env: Env, input: MarketplaceInput, schema: Record<string, SchemaDef> | null): Promise<MatchedFields> {
  const out: MatchedFields = {};
  if (input.stage?.trim() && schema) {
    const options = (schema.Stage?.select?.options ?? []).map((o) => o.name ?? "").filter(Boolean);
    out.stage = matchStage(input.stage.trim(), options);
  }
  if (input.projectCard?.trim()) out.card = await matchRoadmapCard(env, input.projectCard);
  const contributors = (input.contributors ?? []).map((c) => c.trim()).filter(Boolean);
  if (contributors.length) out.contributors = await matchContributors(env, contributors);
  return out;
}

/** The most subrequests `marketplaceQuestion` takes: the schema read, the
 *  Project card (one read for a link, a Roadmap search for a title or number),
 *  and one member listing for every contributor named. Usually two or three. */
export const MARKETPLACE_CHECK_COST = 1 + ROADMAP_MAX_PAGES + USER_LIST_PAGES;

/**
 * The question a publish would come back with over Stage, the Project card or
 * Contributors — asked before the card is staged; null when all three match.
 * Reads only. The publish runs the same checks again when it executes.
 *
 * @param env - Worker bindings
 * @param input - The row's fields
 */
export async function marketplaceQuestion(env: Env, input: MarketplaceInput): Promise<string | null> {
  const databaseId = (env.NOTION_MARKETPLACE_DB_ID ?? "").replace(/-/g, "");
  if (!env.NOTION_API_KEY || !databaseId) return null;
  try {
    const schema = input.stage?.trim() ? await marketplaceSchema(env, databaseId) : null;
    await matchFields(env, input, schema);
    return null;
  } catch (err) {
    if (err instanceof MarketplaceQuestion) return err.message;
    throw err;
  }
}

/** The `notion_create(marketplace)` arguments as the row's fields: one name per
 *  field, the schema's (`tool-definitions.json`). */
export function marketplaceInputOf(input: Record<string, unknown>): MarketplaceInput {
  const str = (v: unknown) => (typeof v === "string" ? v.trim() : "");
  const props = input.properties && typeof input.properties === "object" ? (input.properties as Record<string, unknown>) : {};
  const field = (name: string) => str(props[name]) || undefined;
  const people = props.contributors;
  const contributors = Array.isArray(people)
    ? people.map(str).filter(Boolean)
    : str(people).split(",").map((x) => x.trim()).filter(Boolean);
  return {
    name: str(input.title),
    description: field("description") || str(input.summary) || undefined,
    stage: field("stage"),
    deploymentUrl: field("deployment_url"),
    projectCard: field("project_card"),
    contributors,
    loom: field("loom"),
    repoPath: field("repo_path"),
    localPath: field("local_path"),
    figmaReplica: field("figma_replica"),
  };
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
    (r) => {
      if (!r.id || r.archived) return null;
      const title = Object.values(r.properties ?? {}).find((p) => p.type === "title") as { title?: Array<{ plain_text?: string }> } | undefined;
      return { id: r.id.replace(/-/g, ""), name: (title?.title ?? []).map((t) => t.plain_text ?? "").join("").trim() };
    },
  );
  if (rows.length > 1) {
    throw new MarketplaceQuestion(
      `${rows.length} Marketplace rows already carry this name or deployment link. Which one should I update?`,
    );
  }
  const [row] = rows;
  if (!row) return null;
  // Found by its deployment link alone: another prototype's row, or this one
  // renamed. Asked, never renamed on a guess.
  if (normalizeName(row.name) !== normalizeName(input.name)) {
    throw new MarketplaceQuestion(
      `The Marketplace row "${row.name}" already carries this deployment link. Is "${input.name.trim()}" that prototype — publish it as "${row.name}" to update that row — or a different one, with its own deployment link?`,
    );
  }
  return row.id;
}

/** A given field the live schema has no column for: it goes on the page body instead. */
interface BodyField {
  prop: string;
  shown: string;
}

const bodyLine = (f: BodyField) => `**${f.prop}:** ${f.shown}`;

/** On an update, the body lines a create would have written for fields with
 *  no column, appended once each: a line whose value the page's first blocks
 *  already hold is left out. */
async function keepFieldsInBody(env: Env, pageId: string, fields: readonly BodyField[], signal: AbortSignal): Promise<void> {
  const read = await countedFetch(`${NOTION_API}/blocks/${pageId}/children?page_size=100`, { headers: notionHeaders(env), signal });
  const held = (await read.json()) as { results?: unknown[]; message?: string; code?: string };
  if (!read.ok) throw notionError(read.status, held, "marketplace body read failed");
  const page = JSON.stringify(held.results ?? []);
  const missing = fields.filter((f) => !page.includes(f.shown));
  if (!missing.length) return;
  const res = await countedFetch(`${NOTION_API}/blocks/${pageId}/children`, {
    method: "PATCH",
    headers: notionHeaders(env, { write: true }),
    body: JSON.stringify({ children: bodyToBlocks(missing.map(bodyLine).join("\n\n")) }),
    signal,
  });
  if (!res.ok) throw notionError(res.status, await res.json(), "marketplace body append failed");
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
  // Only a property the live schema carries, and never one Notion computes. A
  // given field with no column stays on the page body, so nothing given vanishes.
  const inBody: BodyField[] = [];
  const set = (prop: string, value: unknown, shown?: string) => {
    const type = schema[prop]?.type;
    if (type && type !== "rollup" && type !== "formula") properties[prop] = value;
    else if (shown) inBody.push({ prop, shown });
  };
  const text = (v: string) => ({ rich_text: richText(v) });

  // Preflight asked these before the card was staged; checked again here, for
  // what changed in Notion since.
  const matched = await matchFields(env, input, schema);
  const description = input.description?.trim();
  const deployment = input.deploymentUrl?.trim();
  if (description) set("Description", text(description), description);
  if (matched.stage) set("Stage", { select: { name: matched.stage } }, matched.stage);
  if (matched.card) set("Project card", { relation: [{ id: matched.card }] }, input.projectCard!.trim());
  if (matched.contributors) set("Contributors", { people: matched.contributors.map((id) => ({ id })) }, input.contributors!.join(", "));
  if (deployment) set("Deployment URL", { url: deployment }, deployment);
  if (input.loom?.trim()) set("Loom", { url: input.loom.trim() }, input.loom.trim());
  if (input.repoPath?.trim()) set("Repo path", text(input.repoPath.trim()), input.repoPath.trim());
  if (input.localPath?.trim()) set("Local path", text(input.localPath.trim()), input.localPath.trim());
  const replica = input.figmaReplica?.trim();
  if (replica) set("Figma replica", { url: replica }, replica);

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
      if (inBody.length) await keepFieldsInBody(env, existing, inBody, controller.signal);
      return { id: existing, url: canonicalNotionUrl(data.url, existing), label: MARKETPLACE_LABEL, status: "updated" };
    }

    set("Upvotes", { number: 0 });
    // A create's body already opens with the description and the Try it link.
    const lines = [
      description,
      deployment ? `**Try it:** ${deployment}` : "",
      ...inBody.filter((f) => f.prop !== "Description" && f.prop !== "Deployment URL").map(bodyLine),
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
