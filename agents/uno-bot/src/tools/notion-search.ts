// notion_search executor — READ-ONLY. Find Notion pages/DB entries by keyword
// when there's no URL to source_read. scope:"team" returns the roster (with
// Slack ids for @-mention, absorbing the old find_experts); scope:"apps"
// queries the Third Party Applications DB for access-request routing (who
// grants access to a tool — approved 2026-07-12); any other scope does a
// workspace /v1/search. Runs inline in the agent loop (no gate).

import type { Env } from "../types";
import { notionSearch, findTeamMembers, queryThirdPartyApps, fetchPageTitles } from "../integrations/notion";

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

    if (!query) return JSON.stringify({ ok: false, error: "missing 'query'" });
    const hits = await notionSearch(env, query);
    return JSON.stringify({
      ok: true,
      scope,
      count: hits.length,
      results: hits,
      note: hits.length
        ? "Title-matched candidates. To answer about one, source_read its url — search results are not full content. Cite the page you used."
        : "No pages matched. The page may not be shared with the bot's Notion integration (Connections), or may not exist — say so; don't answer from memory.",
    });
  } catch (err) {
    return JSON.stringify({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
}

// ─── scope:"apps" — access-request routing over Third Party Applications ─────
// The grant stays HUMAN: this only names who to ask (Application Admin = the
// grantor; Power Users = day-to-day experts) so the bot can pre-fill a request
// message. Matching happens in the Worker (Notion /v1/search misses literal
// titles — the roadmap_query lesson). ~1 subrequest for the directory + up to
// 4 to resolve the matched app's power-user names.

const ROUTING_NOTE =
  "Access-request routing: the Application Admin is who GRANTS access — name them as the person to ask, and pre-fill a short suggested request message the user can copy (what they need, why, and for how long). Power Users are the day-to-day experts for usage questions. NEVER claim to grant, request, or change access yourself — you only route. If admins is empty, suggest the Power Users (or the team roster via scope 'team') as the closest known contact and say the admin isn't recorded. Link the app's Notion page.";

function normalizeAppName(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, " ").trim();
}

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

  const q = normalizeAppName(query);
  // No/blank query → return the directory so the model can enumerate.
  const matches = q
    ? apps.filter((a) => {
        const n = normalizeAppName(a.name);
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
