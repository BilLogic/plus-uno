// find_experts executor — READ-ONLY. Returns the team roster from the Notion
// Team Member Database so the agent can match people to a topic and suggest who
// to talk to. No side effect, no confirmation gate; runs inline in the agent
// loop (mirrors marketplace_search). The DB has no Slack handles, so the agent
// suggests people (+ LinkedIn) rather than @-mentioning them.

import type { Env } from "../types";
import { findTeamMembers } from "../integrations/notion";

export async function executeFindExperts(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const topic = typeof input.topic === "string" ? input.topic.trim() : "";

  try {
    const members = await findTeamMembers(env);
    return JSON.stringify({
      ok: true,
      topic: topic || undefined,
      count: members.length,
      members,
      note: "Match these people to the topic using their role + bio; present the best 2-4 fits with role + a one-line reason + LinkedIn, then suggest reaching out. No Slack handles available — name who to contact, do NOT @-mention.",
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
    });
  }
}
