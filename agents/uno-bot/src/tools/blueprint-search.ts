// blueprint_search executor — READ-ONLY. Queries the uno-blueprint Supabase
// (the grounded source of truth) so the bot can answer/justify factual and
// status questions from it and cite the rows, instead of fabricating (D8).
// Runs inline in the agent loop (mirrors marketplace_search / find_experts).

import type { Env } from "../types";
import { rethrowIfBudget, SubrequestBudgetError } from "../net";
import {
  searchBlueprint,
  isBlueprintConfigured,
  fetchBlueprintIndex,
  fetchEdges,
  fetchFindings,
  fetchSlices,
} from "../integrations/blueprint";

/** Opt-in extra reads. One subrequest each, against a 50-per-invocation cap
 *  that a fallback search can already spend 5 of — so a status question does
 *  not pay for the impact graph it will never look at.
 *
 *  `index` is here so the live table of contents is REACHABLE even while
 *  BLUEPRINT_INDEX is off. Without it, turning the flag off left the bot with
 *  less orientation than it had before this change: the static phase list was
 *  deleted from the prompt and its live replacement was gated behind a flag
 *  that ships off. The flag now controls only whether the index is attached
 *  AUTOMATICALLY; asking for it always works. */
const INCLUDABLE = new Set(["edges", "findings", "slices", "index"]);

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
    // `fresh` is forced by the Worker on a correction turn (loop-shared
    // executeReadOnlyTool) and may also be requested by the model. Either way it
    // bypasses the 60s result cache — a re-check that re-serves the cache is a
    // cache serving a lie.
    const fresh = input.fresh === true;
    const { rows, retrieval, truncated, capped_by, cached, age_ms, thin, top_score } =
      await searchBlueprint(env, query, fresh ? { fresh: true } : undefined);

    // The live index (phases → scenarios → paths). Fetched AFTER the search so a
    // failure here can never cost the rows, self-cached per isolate with its own
    // TTL (so it is +1 subrequest per isolate, not per call), and `undefined` on
    // any failure. FLAGGED OFF by default: tool-payload instructions are not
    // additive — on 2026-08-06 a slack_search fix displaced an unrelated
    // instruction and broke a different eval case — so this is enabled in ONE DM
    // first and the judged evals are compared CASE BY CASE before it goes wide.
    const include = Array.isArray(input.include)
      ? input.include.filter((i): i is string => typeof i === "string" && INCLUDABLE.has(i))
      : [];
    const wantIndex = env.BLUEPRINT_INDEX === "on" || include.includes("index");
    const index = wantIndex ? await fetchBlueprintIndex(env, { fresh }) : undefined;
    // Mirrors how `retrieval` is surfaced: an OMITTED key is indistinguishable
    // from "no future path exists", which regenerates the bug this fixes. The
    // status is always stated when the index was asked for at all.
    const orientation: "live" | "unavailable" | undefined = wantIndex
      ? index
        ? "live"
        : "unavailable"
      : undefined;

    const cellIds = rows.filter((r) => r.kind === "cell" && r.id).map((r) => r.id);
    // Sequential, not Promise.all: each is a metered subrequest and the budget
    // gate reads a running counter — firing them together can overshoot the cap
    // before the counter catches up.
    //
    // Each one is also isolated. These are ENRICHMENTS of a search that has
    // ALREADY succeeded: letting one of them throw sent the whole call to the
    // catch below, which reports "couldn't reach the source of truth" — so a
    // findings-table hiccup turned a good answer into a false absence. A budget
    // error still propagates (rethrowIfBudget), because that one is not
    // best-effort: it means the invocation is out of subrequests and the caller
    // must say so rather than answer from a clipped read.
    const optional = async <T>(want: boolean, read: () => Promise<T>, label: string) => {
      if (!want) return undefined;
      try {
        return await read();
      } catch (e) {
        rethrowIfBudget(e);
        console.log(`[blueprint_search] ${label} enrichment failed: ${e instanceof Error ? e.message : String(e)}`);
        return undefined;
      }
    };
    const edges = await optional(include.includes("edges"), () => fetchEdges(env, cellIds), "edges");
    const findings = await optional(include.includes("findings"), () => fetchFindings(env, cellIds), "findings");
    const sliceRead = await optional(include.includes("slices"), () => fetchSlices(env, query), "slices");
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
    // Two versions of the same field, and WHICH one ships is decided by whether
    // an index is attached. The "re-query before saying so" tail is the honest
    // instruction when nothing enumerates the blueprint; with the index present
    // the lookup replaces the re-query. A completeness claim with no index
    // attached would be a FALSE-completeness claim, which is the original bug
    // wearing the fix's clothes.
    const conflictBase =
      "These rows are the CURRENT journey UNLESS the `path` name starts `Planned:` or `Prototype:` — `Planned` is decided and scheduled but NOT yet shipped (say \"is changing\"), `Prototype` is exploratory and may never ship (say \"might change\"). Never report either as how it works today. If a Notion doc in this conversation disagrees, surface the conflict (planned change vs obsolete doc, per the card's status) — never blend the two.";
    const conflict = index
      ? conflictBase
      : `${conflictBase} Nothing here about a scenario's future is not proof it has none: re-query that scenario for a \`Planned:\` or \`Prototype:\` path before saying so.`;
    // Emitted ONLY when an index is actually attached. One obligation, one field.
    const indexNote = index
      ? "`index` is the COMPLETE live list of the blueprint's phases and scenarios, read just now — including its own `scale` counts, which are the only counts to quote. Use it to NAME the phase a scenario sits under rather than inferring one. You may assert that a scenario has no future state ONLY when its `index` entry carries no `[Planned]` or `[Prototype]` marker; otherwise search that scenario before making any claim about its absence."
      : undefined;
    const orientationNote =
      orientation === "unavailable"
        ? "The blueprint index could not be read this turn, so you have NO list of what exists. Do not state that a scenario, phase or future path is absent — say you could not check."
        : undefined;
    // A cache hit must not be narrated as a fresh read: AGENT.md requires a
    // freshness claim to be backed by a fetch THIS turn, and until `cached`
    // existed nothing distinguished the two.
    const cacheNote = cached
      ? `These rows came from a short-lived cache (${Math.round(age_ms / 1000)}s old), NOT from a read made just now. Do not say you "just checked" or "re-ran" anything — answer from the rows without claiming freshness.`
      : undefined;
    const thinNote =
      thin && rows.length > 0
        ? "Retrieval was THIN — the semantic pass did not produce a confident set, so these rows came largely from keyword matching. Treat coverage as uncertain and say so rather than presenting this as the full picture."
        : undefined;
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
    //
    // The breadcrumb list is COMPUTED, never spelled out: the phase segment is
    // only in a chunk's title if the index was rebuilt after the phase join
    // shipped, and for the whole life of this note before 2026-08-17 it was in
    // zero of them. Promising a field the rows do not carry is what teaches the
    // model to infer one — the exact failure this tool exists to prevent.
    const crumbFields = (["phase", "scenario", "path", "step", "layer"] as const).filter((f) =>
      rows.some((r) => typeof (r as unknown as Record<string, unknown>)[f] === "string"),
    );
    const semanticCaveat =
      retrieval === "semantic"
        ? `These came from semantic (vector) retrieval over indexed chunks. They carry the cell's id, \`url\`, and these breadcrumb fields: ${crumbFields.length ? crumbFields.map((f) => `\`${f}\``).join("/") : "(none)"} — cite them by exactly those fields and link them with \`url\`. Any breadcrumb segment NOT listed is absent from this result: leave it out rather than inferring it.${crumbFields.includes("phase") ? "" : " In particular you do NOT have the phase here, so do not name one."} They do not carry the cell's authored \`links\`.`
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
    // Same flag, opposite advice — so the note has to say WHICH cap fired.
    const truncation = truncated
      ? capped_by === "semantic"
        ? "This result was CAPPED at the semantic match limit — more chunks matched than are shown. Say the list is partial, and re-query with DIFFERENT words to surface different cells."
        : "This result was CAPPED — more rows matched than are shown. Say the list is partial; never present it as everything the blueprint has. A NARROWER query will show more of what you want."
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
      capped_by,
      cached,
      age_ms,
      thin,
      ...(typeof top_score === "number" ? { top_score } : {}),
      // The live phases → scenarios → paths list, when the flag is on. Status is
      // ALWAYS stated alongside it — a missing key would read as "no future
      // path exists", which is the failure being fixed.
      ...(orientation ? { orientation } : {}),
      ...(index ? { index } : {}),
      rows,
      ...(edges ? { edges } : {}),
      ...(findings ? { findings } : {}),
      ...(slices ? { slices } : {}),
      ...(typeof sliceTotal === "number" ? { sliceTotal } : {}),
      notes:
        rows.length > 0
          ? [grounding, attribution, conflict, indexNote, orientationNote, cacheNote, thinNote, linking, citing, freshness, semanticCaveat, edgesNote, findingsNote, slicesNote, sliceCountNote, truncation].filter(Boolean)
          : [
              // REWRITTEN 2026-08-17. This used to say "the blueprint has
              // nothing on this", which becomes wrong the moment the index
              // shows the scenario exists — the zero-row note and the index
              // would have given opposite instructions.
              "No rows matched THIS QUERY. That is a statement about the query, not about the blueprint: do NOT say the blueprint has nothing on the subject. Check `index` (or search again with the scenario's own name) before concluding the scenario is empty. If it genuinely is not there, a CURRENT doc (Help Center, shipped PRD) may answer instead — cite and date it; otherwise say 'not in the source' and name who likely can fill the gap (the workflow's owner or lead from the roster).",
              indexNote,
              orientationNote,
              cacheNote,
            ].filter(Boolean),
    });
  } catch (err) {
    // Two failures that read identically to the model unless separated. Running
    // out of subrequests is NOT "the blueprint is unreachable" — the source is
    // fine and the answer may well be in it; this invocation simply cannot
    // spend another read. Narrating that as unreachable invites "so it's not in
    // the blueprint", which is the false-absence bug arriving through the error
    // path instead of the result path.
    if (err instanceof SubrequestBudgetError) {
      return JSON.stringify({
        ok: false,
        error: err.message,
        reason: "subrequest_budget",
        note: "This invocation ran OUT OF READ BUDGET before the query finished — the blueprint was reachable and this says NOTHING about whether the answer is in it. Do not report absence, do not fabricate. Say the lookup was cut short, and either answer from what you already have (labelled as partial) or offer to retry with a narrower question.",
      });
    }
    return JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      reason: "unreachable",
      note: "Blueprint query failed — do not fabricate; tell the user you couldn't reach the source of truth. This is a failure to LOOK, not evidence of absence: never report the subject as missing from the blueprint on the strength of it.",
    });
  }
}
