// search_blueprint executor — READ-ONLY. Queries the uno-blueprint Supabase
// (the grounded source of truth) so the bot can answer/justify factual and
// status questions from it and cite the rows, instead of fabricating (D8).
// Runs inline in the agent loop, like the other read-only tools.
//
// WHAT IS LEFT HERE, and what stopped being this file's problem (#607).
//
// THIS FILE IS TWO THINGS: the input the model is allowed to send, and the
// notes a person eventually reads. Everything between them — the order the
// reads run in, isolating one failure from the rows it would have decorated,
// the fused-or-fallback switch, the cap totals, and deciding whether a read
// answered at all — is `readBlueprint`'s (`../integrations/blueprint-read.ts`),
// where it is asserted against fixture rows instead of against production.
// The six reads are bound to this deployment's `Env` right here, at the call,
// because binding is the one part of it that needs an `Env` at all.
//
// WHAT THAT BOUGHT THE NOTES. Every enrichment now arrives with a
// `disposition` — served · failed · unavailable — so a note can say "the
// findings table could not be read" where, before, a failed read and an empty
// table left the same missing key and the model read both as "there are none".
// It also arrives with its own `total` and a precomputed `capped`, so a count
// answer comes from the source-wide count and never from counting the page.
//
// THE THREE-REASON CATCH IS UNCHANGED. `readBlueprint` throws exactly what the
// SEARCH throws, plus `SubrequestBudgetError` — so `not_configured`,
// `subrequest_budget` and `unreachable` still divide every failure a model can
// be told about, and the search staying FIRST is what keeps the first of them
// honest (#608, asserted in tests/blueprint-unavailable.test.ts).

import type { Env } from "../types";
import { SubrequestBudgetError } from "../net";
import {
  searchBlueprint,
  BlueprintUnavailableError,
  fetchBlueprintIndex,
  fetchEdges,
  fetchFindings,
  fetchSlices,
  fetchTouchpoints,
  type BlueprintRetrieval,
  type BlueprintRow,
} from "../integrations/blueprint";
import {
  readBlueprint,
  isBlueprintEnrichment,
  type BlueprintEnrichmentOutcome,
  type BlueprintReadResult,
} from "../integrations/blueprint-read";
import { appRootUrl } from "../integrations/blueprint-link";
import { inventoryNotes } from "./blueprint-inventory-notes";
import { touchpointNotes } from "./blueprint-touchpoint-notes";
import {
  conflictNote,
  cacheNote,
  enrichmentFailureNote,
  orientationNote,
  BUDGET_NOTE,
  GROUNDING_NOTE,
  INDEX_NOTE,
  NO_ROWS_NOTE,
  NOT_CONFIGURED_NOTE,
  UNREACHABLE_NOTE,
  type FailedEnrichment,
} from "./blueprint-search-notes";
import {
  hasFilter,
  matchedNote,
  scopeFromInput,
  type BlueprintScope,
} from "../integrations/blueprint-scope";

/** How an enrichment went, in the two words a note is written for: `undefined`
 *  when it was never asked for, otherwise the read's own disposition. */
function failureOf(
  outcome: BlueprintEnrichmentOutcome<unknown> | undefined,
): "failed" | "unavailable" | undefined {
  if (!outcome || outcome.disposition === "served") return undefined;
  return outcome.disposition;
}

/** One read, as the payload the model is handed.
 *
 *  PURE, and exported, because this is the half of the tool worth asserting:
 *  the read is `readBlueprint`'s and its dispositions, totals and cap states
 *  are already fixtures there, so what is left to get wrong is which SENTENCE
 *  a person is told about them. Driving it with a fixture read result is how
 *  the eight fixes this file used to carry as comments — a count answered off
 *  a capped page, an enrichment failure read as a false absence, a zero-row
 *  note contradicting the index, a cache hit narrated as a fresh read —
 *  became assertions (#607), at zero metered subrequests.
 *
 *  @param query  the model's query, as sent — the inventory notes read it.
 *  @param scope  the validated filters and granularity rung.
 *  @param appUrl the blueprint app's root, when one is configured.
 *  @param read   what `readBlueprint` answered.
 */
export function blueprintSearchPayload({
  query,
  scope,
  appUrl,
  read,
}: {
  query: string;
  scope: BlueprintScope;
  appUrl: string | undefined;
  read: BlueprintReadResult<BlueprintRow, BlueprintRetrieval>;
}): Record<string, unknown> {
  const {
    rows, retrieval, matched, truncated, capped_by, cached, age_ms, thin, top_score,
    enrichments,
  } = read;

  // The corpus-wide count behind the top-k (fused path only). Surfaced as
  // `matched` with its own note, so "113 cells mention Zoom; here are 15" is
  // sayable and a count answer never comes from counting the page.
  const matchedCountNote =
    matched !== undefined ? matchedNote(matched, rows.length, scope.granularity ?? "cell") : undefined;

  const index = enrichments.index?.value;
  // Mirrors how `retrieval` is surfaced: an OMITTED key is indistinguishable
  // from "no future path exists", which regenerates the bug this fixes. The
  // status is always stated when the index was asked for at all — and it now
  // says WHICH kind of no: `failed` is an outage, `unavailable` is this
  // Worker's configuration, and only `live` means there is a list to read.
  const orientation: "live" | "failed" | "unavailable" | undefined =
    enrichments.index && (enrichments.index.disposition === "served" ? "live" : enrichments.index.disposition);

  const edges = enrichments.edges?.value;
  const findings = enrichments.findings?.value;
  const findingsTotal = enrichments.findings?.total;
  const slices = enrichments.slices?.value;
  const sliceTotal = enrichments.slices?.total;
  const touchpoints = enrichments.touchpoints?.value;
  const touchpointsTotal = enrichments.touchpoints?.total;
  // The touchpoint registry (#414). Its notes — what a touchpoint is, what
  // the registry does not cover, and an absence that names what was searched
  // — travel with the rows, so a turn that never asks pays nothing for the
  // explanation. Emitted ONLY on a SERVED read: the absence note asserts
  // that the registry holds no such entry, and a failed read has not earned
  // that sentence. A failed one gets the failure note below instead.
  const touchpointNoteList =
    enrichments.touchpoints?.disposition === "served"
      ? touchpointNotes({
          words: enrichments.touchpoints.words ?? [],
          rows: touchpoints?.length ?? 0,
          registryTotal: touchpointsTotal,
          appUrl,
        })
      : [];
  // The enrichments that were asked for and did not answer, each named. The
  // index has its own sentence (it is the orientation read, and its absence
  // forbids a different claim), so it is not in this list.
  const failureNotes = (["edges", "findings", "slices", "touchpoints"] as const)
    .map((name: FailedEnrichment) => {
      const how = failureOf(enrichments[name]);
      return how ? enrichmentFailureNote(name, how) : undefined;
    })
    .filter((n): n is string => Boolean(n));

  // One obligation per field, not one paragraph carrying five. Instructions
  // in a tool payload are not additive — a fix to slack_search on 2026-08-06
  // displaced an unrelated instruction and broke a different eval case — so
  // each rule now travels with the data that triggers it, and only appears
  // when it applies. The ones with a FIXED text live in
  // blueprint-search-notes.ts, where the harness name sweep can read them
  // (#443); the ones computed from the rows in hand stay here.
  const attribution = rows.some((r) => r.kind === "cell")
    ? "Attribute every activity to its `lane` (the actor/stage) and order by `step` — never give one actor's activity to another. If the question spans multiple actors or paths, cover all the relevant ones: a one-lane answer to a multi-actor question is incomplete."
    : undefined;
  // Two versions of the same field, and WHICH one ships is decided by whether
  // an index is attached. The "re-query before saying so" tail is the honest
  // instruction when nothing enumerates the blueprint; with the index present
  // the lookup replaces the re-query. A completeness claim with no index
  // attached would be a FALSE-completeness claim, which is the original bug
  // wearing the fix's clothes.
  const conflict = conflictNote(Boolean(index));
  // Emitted ONLY when an index is actually attached. One obligation, one field.
  const indexNote = index ? INDEX_NOTE : undefined;
  const orientationFailure = failureOf(enrichments.index);
  const indexFailureNote = orientationFailure ? orientationNote(orientationFailure) : undefined;
  const cacheHitNote = cached ? cacheNote(age_ms) : undefined;
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
  const crumbFields = (["phase", "scenario", "path", "step", "lane"] as const).filter((f) =>
    rows.some((r) => typeof (r as unknown as Record<string, unknown>)[f] === "string"),
  );
  const semanticCaveat =
    retrieval === "semantic"
      ? `These came from semantic (vector) retrieval over indexed chunks. They carry the cell's id, \`url\`, and these breadcrumb fields: ${crumbFields.length ? crumbFields.map((f) => `\`${f}\``).join("/") : "(none)"} — cite them by exactly those fields and link them with \`url\`. Any breadcrumb segment NOT listed is absent from this result: leave it out rather than inferring it.${crumbFields.includes("phase") ? "" : " In particular you do NOT have the phase here, so do not name one."} They do not carry the cell's authored \`links\`.`
      : undefined;
  const edgesNote = edges?.length
    ? "`edges` are ONE HOP from the matched cells. Each edge carries `kind`: `leads_to` means the source makes the target happen; `enables` means the target must already be true for the source to work. They are NOT inverses — a precondition causes nothing, so never narrate an `enables` edge as one thing leading to another. `note` is the designer's own why-line when present. Name the neighbours as places to check; do NOT present this as a full impact analysis, and do not follow the chain further than the data shown. A real trace is sb:whatif in the IDE."
    : undefined;
  const findingsNote = findings?.length
    ? "`findings` are audit results ALREADY recorded against these cells — report them by cell and severity. Triaging or resolving one is a write: route that to the blueprint app, never claim to have done it."
    : undefined;
  // Findings are read under a 20-row cap; the true matched count rides along
  // from the same request, and `capped` is the read's own comparison of the
  // two. Same class as sliceCountNote: a count answer must come from the
  // total, never from counting the capped page.
  const findingsCountNote =
    enrichments.findings?.capped && findings
      ? `${findingsTotal} open findings are recorded against these cells; \`findings\` shows only the first ${findings.length}. For any count-of-findings answer, use ${findingsTotal}.`
      : undefined;
  const slicesNote = slices?.length
    ? "`slices` are views someone already cut — `title`/`actor` say who it is for. Point at the existing one (link its `url`) rather than composing a substitute in this reply."
    : undefined;
  // The rows are a filtered page, and a "how many slices" answer must come
  // from the table's total, never from counting the page — that mistake
  // shipped as a confident wrong number (5 of 14) before this note existed.
  const sliceCountNote =
    enrichments.slices?.capped && slices
      ? `The blueprint has ${sliceTotal} saved slices in total; \`slices\` shows ${slices.length} matched to this question. For any count-of-slices answer, use ${sliceTotal}.`
      : undefined;
  // The blueprint's instance inventory — the detail classes it has no field
  // for, and how thin its coverage runs — told only beside a result it
  // explains (#412). It used to ride the always-loaded guide.
  const inventory = inventoryNotes({ query, rows: rows.length, capped: Boolean(truncated) });
  // Same flag, opposite advice — so the note has to say WHICH cap fired.
  const truncation = truncated
    ? capped_by === "semantic"
      ? "This result was CAPPED at the semantic match limit — more chunks matched than are shown. Say the list is partial, and re-query with DIFFERENT words to surface different cells."
      : "This result was CAPPED — more rows matched than are shown. Say the list is partial; never present it as everything the blueprint has. A NARROWER query will show more of what you want."
    : undefined;

  return {
    ok: true,
    query,
    ...(hasFilter(scope) || scope.granularity ? { scope } : {}),
    count: rows.length,
    ...(matched !== undefined ? { matched } : {}),
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
    ...(typeof findingsTotal === "number" ? { findingsTotal } : {}),
    ...(slices ? { slices } : {}),
    ...(typeof sliceTotal === "number" ? { sliceTotal } : {}),
    ...(touchpoints ? { touchpoints } : {}),
    ...(typeof touchpointsTotal === "number" ? { touchpointsTotal } : {}),
    notes:
      rows.length > 0
        ? [GROUNDING_NOTE, attribution, conflict, indexNote, indexFailureNote, cacheHitNote, thinNote, matchedCountNote, linking, citing, freshness, semanticCaveat, edgesNote, findingsNote, findingsCountNote, slicesNote, sliceCountNote, ...touchpointNoteList, ...failureNotes, truncation, ...inventory].filter(Boolean)
        : [
            NO_ROWS_NOTE,
            indexNote,
            indexFailureNote,
            cacheHitNote,
            // Registry rows can exist when the search found nothing — "is
            // there a Zoom room" is a registry question first. Their notes
            // ride both branches for that reason, and so does the sentence
            // that says a registry read FAILED: a zero-row search beside a
            // failed enrichment is the exact pair a false absence comes out
            // of.
            ...touchpointNoteList,
            ...failureNotes,
          ].filter(Boolean),
  };
}

export async function executeBlueprintSearch(
  env: Env,
  input: Record<string, unknown>,
): Promise<string> {
  const query = typeof input.query === "string" ? input.query.trim() : "";
  // The four filters and the granularity rung (#413). A bad rung is an error,
  // not a silent default: answering at `cell` to a `phase` question would read
  // as the blueprint having no phase-level view.
  const { scope, error: scopeError } = scopeFromInput(input);
  if (scopeError) {
    return JSON.stringify({ ok: false, error: scopeError });
  }
  // Filter-only predicate mode: with a filter set, no `query` means "list the
  // scope". Without one there is nothing to search.
  if (!query && !hasFilter(scope)) {
    return JSON.stringify({ ok: false, error: "missing 'query' (optional only when a filter_* is set)" });
  }
  // No configuration pre-check here. `searchBlueprint` tests its own
  // credentials and throws BlueprintUnavailableError before it spends
  // anything, so this side was a second decision point for one question — and
  // the one it made was the weaker answer: it returned `ok: false` with a
  // sentence and NO `reason`, the only failure of this tool the model could
  // not tell from the others by machine, while the module's own error mode was
  // left with no handler anywhere. One decision point now, and the catch turns
  // it into a named reason. (`isBlueprintConfigured` still has one other
  // caller — the /debug/blueprint-subject probe, which REPORTS configuration
  // as a finding rather than reading rows, so asking is its job.)
  try {
    // `fresh` is forced by the Worker on a correction turn (run-agent
    // executeReadOnlyTool) and may also be requested by the model. Either way it
    // bypasses the 60s result cache — a re-check that re-serves the cache is a
    // cache serving a lie.
    const fresh = input.fresh === true;
    // The model's `include`, validated. The closed set of names has ONE home —
    // `BLUEPRINT_ENRICHMENTS` beside the read — so a sixth enrichment cannot
    // be reachable by the read and unknown to the tool, or the reverse. What
    // each one costs and why it is opt-in is the read's header; what matters
    // here is that an unknown name is dropped rather than refused, because a
    // model asking for one extra thing should still get its rows.
    //
    // `index` is includable so the live table of contents is REACHABLE even
    // while BLUEPRINT_INDEX is off. The flag controls only whether the index
    // is attached AUTOMATICALLY; asking for it always works.
    const include = Array.isArray(input.include)
      ? input.include.filter(isBlueprintEnrichment)
      : [];
    // FLAGGED OFF by default: tool-payload instructions are not additive — on
    // 2026-08-06 a slack_search fix displaced an unrelated instruction and
    // broke a different eval case — so the automatic index is enabled in ONE
    // DM first and the judged evals are compared CASE BY CASE before it goes
    // wide.
    const autoIndex = env.BLUEPRINT_INDEX === "on";

    const read = await readBlueprint(
      {
        query,
        scope,
        include,
        ...(fresh ? { fresh: true } : {}),
        ...(autoIndex ? { autoIndex: true } : {}),
      },
      {
        // The six reads, bound to this deployment. They are the same
        // countedFetch-backed functions everything else calls — injection sits
        // ABOVE the metered call, never around it (ADR-022).
        search: (q, o) => searchBlueprint(env, q, o),
        index: (o) => fetchBlueprintIndex(env, o),
        edges: (ids) => fetchEdges(env, ids),
        findings: (ids) => fetchFindings(env, ids),
        slices: (q) => fetchSlices(env, q),
        touchpoints: (q) => fetchTouchpoints(env, q),
      },
    );

    return JSON.stringify(
      blueprintSearchPayload({
        query,
        scope,
        appUrl: appRootUrl(env.BLUEPRINT_APP_URL),
        read,
      }),
    );
  } catch (err) {
    // This deployment has no blueprint credentials, so there is nothing to
    // reach. Distinct from `unreachable` on purpose: that one says the source
    // of truth exists and this turn could not read it, which sends a person
    // looking for an outage. This one is a fact about the Worker's
    // configuration, and the only fix is wiring it up.
    if (err instanceof BlueprintUnavailableError) {
      // WHICH credentials are missing goes to the log, where the person who
      // can add them is looking; the model is told the fact, in the words a
      // requester in Slack should hear. Same split as a failed Slack call
      // (slack/api.ts): the operator gets the detail, the caller gets a
      // reason. A tool result naming SUPABASE_URL invites an answer that
      // reads like a stack trace to a designer.
      console.warn(`[search_blueprint] ${err.message}`);
      return JSON.stringify({
        ok: false,
        error: "uno-blueprint is not configured on this deployment",
        reason: "not_configured",
        note: NOT_CONFIGURED_NOTE,
      });
    }
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
        note: BUDGET_NOTE,
      });
    }
    return JSON.stringify({
      ok: false,
      error: err instanceof Error ? err.message : String(err),
      reason: "unreachable",
      note: UNREACHABLE_NOTE,
    });
  }
}
