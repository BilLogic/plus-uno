// notion_search executor — READ-ONLY. Find Notion pages/DB entries by keyword
// when there's no URL to source_read.
//
// Special scopes:
//   team  — Team Member roster (SME / @-mention)
//   apps  — Third Party Applications (access-request routing)
// Catalog scopes (databases/{id}/query + in-Worker title match — the
// roadmap_query lesson; /v1/search is weak inside known DBs):
//   help_tutors | help_teachers | marketplace | running_notes | decisions
//   news | success_stories | research_papers | banners
//   any — workspace /v1/search (pages + databases; last resort)

import type { Env } from "../types";
import {
  notionSearch,
  findTeamMembers,
  queryThirdPartyApps,
  queryCatalogDatabase,
  fetchPageTitles,
  type CatalogRow,
} from "../integrations/notion";

const MAX_CATALOG_HITS = 8;

type CatalogScopeConfig = {
  /** Env key holding the Notion DATABASE id. */
  envKey: keyof Env;
  label: string;
  /** Title property names to skip (multi-source parents). */
  skipTitleNames?: string[];
  note: string;
};

/**
 * Catalog scopes wired to wrangler DATABASE ids. Keep in sync with
 * docs/conventions/notion.md § Read radar and tool-definitions.json.
 */
const CATALOG_SCOPES: Record<string, CatalogScopeConfig> = {
  help_tutors: {
    envKey: "NOTION_HELP_TUTORS_DB_ID",
    label: "Tutor Help Center Content",
    skipTitleNames: ["Task name"],
    note: "Tutor-facing help articles. source_read a hit for full copy. Tasks Tracker rows on this parent DB are filtered out.",
  },
  help_teachers: {
    envKey: "NOTION_HELP_TEACHERS_DB_ID",
    label: "Teacher Help Center Articles",
    note: "Teacher-facing help articles. source_read a hit for full copy.",
  },
  marketplace: {
    envKey: "NOTION_MARKETPLACE_DB_ID",
    label: "Prototype Marketplace",
    note: "Prototype catalog rows. Prefer this scope over 'any' for marketplace lookups. Publishing entries is in-IDE (writers/notion), not a bot write.",
  },
  running_notes: {
    envKey: "NOTION_RUNNING_NOTES_DB_ID",
    label: "Design Running Notes",
    note: "Per-person / team design notes. Titles only — source_read for body.",
  },
  decisions: {
    envKey: "NOTION_DECISIONS_DB_ID",
    label: "Decisions DB",
    note: "Durable design decisions (Proposed/Accepted/Rejected/Superseded). Prefer this over 'any' for 'what did we decide…'. Create via notion_create surface 'decision'.",
  },
  news: {
    envKey: "NOTION_NEWS_DB_ID",
    label: "News",
    note: "Product announcements / what shipped. Read-only grounding.",
  },
  success_stories: {
    envKey: "NOTION_SUCCESS_STORIES_DB_ID",
    label: "Success Stories",
    note: "Customer proof / outcomes. Read-only grounding.",
  },
  research_papers: {
    envKey: "NOTION_RESEARCH_PAPERS_DB_ID",
    label: "Research Papers",
    note: "Prior research to cite before re-running it. Read-only grounding.",
  },
  banners: {
    envKey: "NOTION_BANNERS_DB_ID",
    label: "Banners",
    note: "In-product banner copy/state. Read-only grounding.",
  },
};

/**
 * Execute notion_search for the given scope + query.
 *
 * @param env - Worker env (Notion token + DB ids)
 * @param input - Tool args (`query`, optional `scope`)
 */
export async function executeNotionSearch(env: Env, input: Record<string, unknown>): Promise<string> {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  const scope = typeof input.scope === "string" ? input.scope.trim().toLowerCase() : "any";

  try {
    if (scope === "team") {
      const members = await findTeamMembers(env);
      const anySlackIds = members.some((m) => m.slackUserId);
      return JSON.stringify({
        ok: true,
        scope: "team",
        count: members.length,
        members,
        note: anySlackIds
          ? "Match these people to the query using role + bio; present the best 2-4 with role + a one-line reason + LinkedIn. When a person has a slackUserId, @-mention as <@slackUserId>; otherwise name them."
          : "Match these people to the query using role + bio; present the best 2-4 with role + reason + LinkedIn. No Slack handles — name who to contact, don't @-mention.",
      });
    }

    if (scope === "apps") {
      return await searchThirdPartyApps(env, query);
    }

    const catalog = CATALOG_SCOPES[scope];
    if (catalog) {
      return await searchCatalogScope(env, scope, query, catalog);
    }

    if (!query) return JSON.stringify({ ok: false, error: "missing 'query'" });
    const hits = await notionSearch(env, query);
    return JSON.stringify({
      ok: true,
      scope: "any",
      count: hits.length,
      results: hits,
      note: hits.length
        ? "Title-matched candidates from workspace search (pages + databases). Prefer a catalog scope (marketplace, help_tutors, decisions, …) when you know the surface — those are complete DB scans. To answer about one hit, source_read its url. Cite the page you used."
        : "No pages matched workspace search. Try a catalog scope if you know the surface (marketplace / help_tutors / help_teachers / decisions / running_notes / news / …), or the page may not be shared with the bot's Notion integration (Connections). Say so; don't answer from memory.",
    });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// ─── Catalog scopes — direct DB query + fuzzy title match ────────────────────

/**
 * Normalize a string for loose title matching.
 *
 * @param s - Raw query or title
 */
function normalizeTitle(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

/**
 * Tokenize for overlap scoring (words ≥3 chars).
 *
 * @param text - Query or title
 */
function tokens(text: string): string[] {
  return Array.from(
    new Set(text.toLowerCase().split(/[^a-z0-9]+/).filter((w) => w.length >= 3)),
  );
}

/**
 * Fuzzy title score: token overlap + substring bonus.
 *
 * @param queryToks - Query tokens
 * @param rawQuery - Original query
 * @param title - Candidate title
 */
function scoreTitle(queryToks: string[], rawQuery: string, title: string): number {
  const titleLower = title.toLowerCase();
  const titleToks = new Set(tokens(title));
  if (!queryToks.length) return 0;
  const overlap = queryToks.filter((t) => titleToks.has(t)).length;
  let score = overlap / queryToks.length;
  const q = rawQuery.toLowerCase().trim();
  if (q && titleLower.includes(q)) score += 1;
  const nq = normalizeTitle(rawQuery);
  const nt = normalizeTitle(title);
  if (nq && (nt.includes(nq) || nq.includes(nt))) score += 0.5;
  return score;
}

/**
 * Search a wired catalog DB by scope.
 *
 * @param env - Worker env
 * @param scope - Scope name
 * @param query - Title/keyword query (blank → first N rows)
 * @param cfg - Scope config
 */
async function searchCatalogScope(
  env: Env,
  scope: string,
  query: string,
  cfg: CatalogScopeConfig,
): Promise<string> {
  const databaseId = env[cfg.envKey];
  if (typeof databaseId !== "string" || !databaseId.trim()) {
    return JSON.stringify({
      ok: false,
      scope,
      error: `${cfg.envKey} not configured on the Worker`,
      note: `Can't query ${cfg.label} until the database id is set in wrangler.toml.`,
    });
  }

  const rows = await queryCatalogDatabase(env, databaseId.trim(), {
    skipTitleNames: cfg.skipTitleNames,
  });

  if (rows.length === 0) {
    return JSON.stringify({
      ok: false,
      scope,
      error: `${cfg.label} returned no rows`,
      note: `The DB may not be shared with the bot's Notion integration (Connections) — say you couldn't check ${cfg.label}; don't guess.`,
    });
  }

  let results: Array<CatalogRow & { match_score?: number }>;
  if (!query) {
    results = rows.slice(0, MAX_CATALOG_HITS);
  } else {
    const qToks = tokens(query);
    results = rows
      .map((r) => ({ ...r, match_score: Number(scoreTitle(qToks, query, r.title).toFixed(2)) }))
      .filter((r) => (r.match_score ?? 0) > 0)
      .sort((a, b) => (b.match_score ?? 0) - (a.match_score ?? 0))
      .slice(0, MAX_CATALOG_HITS);
  }

  return JSON.stringify({
    ok: true,
    scope,
    label: cfg.label,
    count: results.length,
    scanned: rows.length,
    results: results.map((r) => ({
      title: r.title,
      url: r.url,
      meta: r.meta,
      ...(r.match_score != null ? { match_score: r.match_score } : {}),
    })),
    note: results.length
      ? `${cfg.note} Complete scan of ${rows.length} rows (not a keyword sample). source_read a hit for full content; cite the page you used.`
      : `No ${cfg.label} row matched '${query}' (complete scan of ${rows.length} rows). Say so plainly — don't invent entries. ${cfg.note}`,
  });
}

// ─── scope:"apps" — access-request routing over Third Party Applications ─────
// The grant stays HUMAN: this only names who to ask (Application Admin = the
// grantor; Power Users = day-to-day experts) so the bot can pre-fill a request
// message. Matching happens in the Worker (Notion /v1/search misses literal
// titles — the roadmap_query lesson). ~1 subrequest for the directory + up to
// 4 to resolve the matched app's power-user names.

const ROUTING_NOTE =
  "Access-request routing: the Application Admin is who GRANTS access — name them as the person to ask, and pre-fill a short suggested request message the user can copy (what they need, why, and for how long). Power Users are the day-to-day experts for usage questions. NEVER claim to grant, request, or change access yourself — you only route. If admins is empty, suggest the Power Users (or the team roster via scope 'team') as the closest known contact and say the admin isn't recorded. Link the app's Notion page.";

/**
 * Search the Third Party Applications directory for access-request routing.
 *
 * @param env - Worker env
 * @param query - Tool/service name (blank → full directory)
 */
async function searchThirdPartyApps(env: Env, query: string): Promise<string> {
  const apps = await queryThirdPartyApps(env);
  if (apps.length === 0) {
    return JSON.stringify({
      ok: false,
      scope: "apps",
      error: "the Third Party Applications database returned no rows",
      note: "The DB may not be shared with the bot's Notion integration (Connections) — say you couldn't check the app directory; don't guess owners.",
    });
  }

  const q = normalizeTitle(query);
  // No/blank query → return the directory so the model can enumerate.
  const matches = q
    ? apps.filter((a) => {
        const n = normalizeTitle(a.name);
        return n.includes(q) || q.includes(n);
      })
    : apps;

  if (q && matches.length === 0) {
    return JSON.stringify({
      ok: true,
      scope: "apps",
      count: 0,
      all_applications: apps.map((a) => a.name),
      note: `No application matched '${query}'. The directory's names are listed — offer the closest ones, or say the tool isn't in the directory. ${ROUTING_NOTE}`,
    });
  }

  // Resolve power-user names for the top match only (each is a subrequest).
  const top = matches[0]!;
  const powerUsers = top.powerUserPageIds.length
    ? await fetchPageTitles(env, top.powerUserPageIds, 4).catch(() => [] as string[])
    : [];

  return JSON.stringify({
    ok: true,
    scope: "apps",
    count: matches.length,
    match: {
      name: top.name,
      url: top.url,
      admins: top.admins,
      power_users: powerUsers,
      power_users_unresolved: Math.max(0, top.powerUserPageIds.length - powerUsers.length),
      usage_status: top.usageStatus,
      license_types: top.licenseTypes,
    },
    other_matches: matches.slice(1, 5).map((a) => ({ name: a.name, url: a.url, admins: a.admins })),
    note: ROUTING_NOTE,
  });
}
