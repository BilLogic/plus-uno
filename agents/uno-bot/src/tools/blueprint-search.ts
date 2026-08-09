// blueprint_search executor — READ-ONLY. Queries the uno-blueprint Supabase
// (the grounded source of truth) so the bot can answer/justify factual and
// status questions from it and cite the rows, instead of fabricating (D8).
// Runs inline in the agent loop (mirrors marketplace_search / find_experts).

import type { Env } from "../types";
import {
  searchBlueprint,
  isBlueprintConfigured,
  fetchEdges,
  fetchFindings,
  fetchSlices,
} from "../integrations/blueprint";

/** Opt-in extra reads. One subrequest each, against a 50-per-invocation cap
 *  that a fallback search can already spend 5 of — so a status question does
 *  not pay for the impact graph it will never look at. */
const INCLUDABLE = new Set(["edges", "findings", "slices"]);

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

    const include = Array.isArray(input.include)
      ? input.include.filter((i): i is string => typeof i === "string" && INCLUDABLE.has(i))
      : [];
    const cellIds = rows.filter((r) => r.kind === "cell" && r.id).map((r) => r.id);
    // Sequential, not Promise.all: each is a metered subrequest and the budget
    // gate reads a running counter — firing them together can overshoot the cap
    // before the counter catches up.
    const edges = include.includes("edges") ? await fetchEdges(env, cellIds) : undefined;
    const findings = include.includes("findings") ? await fetchFindings(env, cellIds) : undefined;
    const sliceRead = include.includes("slices") ? await fetchSlices(env, query) : undefined;
    const slices = sliceRead?.rows;
    const sliceTotal = sliceRead?.total;

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
    // The share path. In Slack and the IDE the reader cannot see the blueprint,
    // so a cited cell with no link is a dead end — they have to go find it by
    // hand. `url` opens the app on that exact cell (the in-app agent ignores it;
    // its user is already looking at the thing).
    const linking = rows.some((r) => r.url)
      ? "Each row's `url` opens that exact cell in the blueprint app. Link the cells you actually rely on — put the link on the cell's name at the point of mention, and never hand-build or edit one; only use `url` verbatim."
      : undefined;
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
        ? "These came from semantic (vector) retrieval over indexed chunks. They carry the cell's id, breadcrumb (`scenario`/`path`/`step`/`layer`) and `url`, but NOT the cell's authored `links` — cite them by breadcrumb and link them with `url`."
        : undefined;
    const edgesNote = edges?.length
      ? "`edges` are ONE HOP from the matched cells. Each edge carries `kind`: `trigger` means the source sets the target in motion (temporal); `needs` means the source depends on the target existing (functional) — do not narrate a needs edge as something being \"set off\". `note` is the designer's own why-line when present. Name the neighbours as places to check; do NOT present this as a full impact analysis, and do not follow the chain further than the data shown. A real trace is sb:whatif in the IDE."
      : undefined;
    const findingsNote = findings?.length
      ? "`findings` are audit results ALREADY recorded against these cells — report them by cell and severity. Triaging or resolving one is a write: route that to the blueprint app, never claim to have done it."
      : undefined;
    const slicesNote = slices?.length
      ? "`slices` are views someone already cut — `title`/`actor` say who it is for. Point at the existing one (link its `url`) rather than composing a substitute in this reply."
      : undefined;
    // The rows are a filtered page, and a "how many slices" answer must come
    // from the table's total, never from counting the page — that mistake
    // shipped as a confident wrong number (5 of 14) before this note existed.
    const sliceCountNote =
      slices && typeof sliceTotal === "number" && sliceTotal !== slices.length
        ? `The blueprint has ${sliceTotal} saved slices in total; \`slices\` shows ${slices.length} matched to this question. For any count-of-slices answer, use ${sliceTotal}.`
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
      ...(edges ? { edges } : {}),
      ...(findings ? { findings } : {}),
      ...(slices ? { slices } : {}),
      ...(typeof sliceTotal === "number" ? { sliceTotal } : {}),
      notes:
        rows.length > 0
          ? [grounding, attribution, conflict, linking, citing, freshness, semanticCaveat, edgesNote, findingsNote, slicesNote, sliceCountNote, truncation].filter(Boolean)
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
