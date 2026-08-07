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
    const { rows, retrieval, truncated } = await searchBlueprint(env, query);

    // One obligation per field, not one paragraph carrying five. Instructions
    // in a tool payload are not additive — a fix to slack_search on 2026-08-06
    // displaced an unrelated instruction and broke a different eval case — so
    // each rule now travels with the data that triggers it, and only appears
    // when it applies.
    const grounding =
      "Ground the answer ONLY in these rows. Do not add facts that aren't here.";
    const attribution = rows.some((r) => r.kind === "cell")
      ? "Attribute every activity to its `layer` (the actor/stage) and order by `step` — never give one actor's activity to another. If the question spans multiple actors or paths, cover all the relevant ones: a one-layer answer to a multi-actor question is incomplete."
      : undefined;
    const conflict =
      "These rows are the CURRENT journey. If a Notion doc in this conversation disagrees, surface the conflict (planned change vs obsolete doc, per the card's status) — never blend the two.";
    const citing = rows.some((r) => r.links?.length)
      ? "Some rows carry `links` the blueprint authors attached. Link them at the point of mention — they are authored, not constructed, so they are safe to surface."
      : undefined;
    const freshness = rows.some((r) => r.updatedAt)
      ? "`updatedAt` is when the row last changed. If it is old relative to what is being discussed, say so rather than presenting it as necessarily current."
      : undefined;
    // The semantic path returns corpus chunks, not table rows: no id, no links,
    // no updated_at. Worth stating, because it is the PRIMARY path — so the
    // best-recall answers are also the least citable, and the model should not
    // imply row-level provenance it was never given.
    const semanticCaveat =
      retrieval === "semantic"
        ? "These came from semantic (vector) retrieval over indexed chunks, so they carry no row id, links, or date. Cite them as blueprint content by title//layer, and do not claim a specific cell unless the row shows one."
        : undefined;
    const truncation = truncated
      ? "This result was CAPPED — more rows matched than are shown. Say the list is partial; never present it as everything the blueprint has."
      : undefined;

    return JSON.stringify({
      ok: true,
      query,
      count: rows.length,
      // Which of the three paths served this. Surfaced so answer quality can be
      // attributed to retrieval instead of guessed at: "semantic" is the good
      // path, "tables" means both faster paths were unavailable.
      retrieval,
      truncated,
      rows,
      notes:
        rows.length > 0
          ? [grounding, attribution, conflict, citing, freshness, semanticCaveat, truncation].filter(Boolean)
          : [
              "No matching blueprint rows. Say the blueprint has nothing on this rather than guessing. A CURRENT doc (Help Center, shipped PRD) may answer instead — cite and date it. If nothing covers it, say 'not in the source' and name who likely can fill the gap (the workflow's owner or lead from the roster).",
            ],
    });
  } catch (err) {
    return JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      note: "Blueprint query failed — do not fabricate; tell the user you couldn't reach the source of truth.",
    });
  }
}
