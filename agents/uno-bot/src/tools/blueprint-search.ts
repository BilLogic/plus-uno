// blueprint_search executor — READ-ONLY. Queries the uno-blueprint Supabase
// (the grounded source of truth) so the bot can answer/justify factual and
// status questions from it and cite the rows, instead of fabricating (D8).
// Runs inline in the agent loop (mirrors marketplace_search / find_experts).

import type { Env } from "../types";
import { searchBlueprint, isBlueprintConfigured } from "../integrations/blueprint";

export async function executeBlueprintSearch(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  if (!query) {
    return JSON.stringify({ ok: false, error: "missing 'query'" });
  }
  if (!isBlueprintConfigured(env)) {
    // Degrade honestly: tell the model the blueprint is unavailable so it says
    // so rather than inventing an answer.
    return JSON.stringify({
      ok: false,
      error: "uno-blueprint is not configured on this deployment",
      note: "Do NOT fabricate an answer. Tell the user the blueprint isn't reachable and fall back to cited docs, or say you don't know.",
    });
  }

  try {
    const rows = await searchBlueprint(env, query);
    return JSON.stringify({
      ok: true,
      query,
      count: rows.length,
      rows,
      note:
        rows.length > 0
          ? "Ground your answer ONLY in these rows and cite the blueprint. For 'cell' rows, attribute each activity to its `layer` (the actor/stage — e.g. 'Regular Tutor', 'Lead Tutor', 'Partner Action: Teacher', 'Back Stage Actions') and order by `step`; do NOT attribute one actor's activities to another. Do not add facts that aren't here."
          : "No matching blueprint rows. Say the blueprint has nothing on this rather than guessing; you may fall back to cited docs.",
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      note: "Blueprint query failed — do not fabricate; tell the user you couldn't reach the source of truth.",
    });
  }
}
