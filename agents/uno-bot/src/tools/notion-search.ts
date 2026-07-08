// notion_search executor — READ-ONLY. Find Notion pages/DB entries by keyword
// when there's no URL to source_read. scope:"team" returns the roster (with
// Slack ids for @-mention, absorbing the old find_experts); any other scope
// does a workspace /v1/search. Runs inline in the agent loop (no gate).

import type { Env } from "../types";
import { notionSearch, findTeamMembers } from "../integrations/notion";

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
