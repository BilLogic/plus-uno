// search_blueprint's `include` rows, mapped to the shapes the tool payload has
// always used.
//
// The bot used to spend one metered subrequest on edges and another on
// findings, on top of the search itself, against Cloudflare's cap of 50 per
// invocation. `include` computes both from the rows the RPC just ranked, inside
// the same call. That is a pure win on the budget and a real risk to meaning:
// if this mapping drifts, the model still receives a well-formed payload — just
// a wrong one — and that reads in Slack as the blueprint having changed rather
// than as a bug.
//
// So the mapping lives here, in a PURE module with no Env, no fetch and no
// Workers types, for the same reason blueprint-link.ts and blueprint-index.ts
// do: it is the half that can be tested without a network.

import { BLUEPRINT_CONTRACT } from "../generated/blueprint-contract";

/** Row `kind` tags the RPC stamps on include rows. */
const INCLUDE_KIND = BLUEPRINT_CONTRACT.searchBlueprintInclude;

/** Ceiling on include:edges rows. The RPC applies no cap to its edges branch;
 *  fetchEdges used limit=40, and keeping that number means switching to the
 *  include path cannot change how large a tool payload gets. */
export const EDGE_CAP = 40;

export interface BlueprintEdge {
  from: string;
  to: string;
  direction: "downstream" | "upstream";
  /** "leads_to" = the source makes the target happen; "enables" = the
   *  target must already be true for the source to work. NOT inverses — a
   *  precondition causes nothing, so narrating an `enables` edge as one
   *  thing leading to another misstates the blueprint. */
  kind: "leads_to" | "enables";
  /** Authored why-line for the edge, when the designer wrote one. */
  note?: string;
}

const linkOf = (r: Record<string, unknown>) => (r.links ?? {}) as Record<string, unknown>;
const str120 = (v: unknown) => (typeof v === "string" ? v.slice(0, 120) : "");

/**
 * `include:edges` rows → the BlueprintEdge shape fetchEdges returns.
 *
 * `direction` is relative to the cells this search matched: an edge whose
 * SOURCE is one of them points downstream from what was asked about; anything
 * else points upstream into it. Same rule fetchEdges applies, over the full
 * matched set rather than its first ten ids.
 */
export function mapIncludeEdges(
  data: Array<Record<string, unknown>>,
  hitIds: ReadonlySet<string>,
): BlueprintEdge[] {
  return data
    .filter((r) => r.kind === INCLUDE_KIND.edges)
    .slice(0, EDGE_CAP)
    .flatMap((r): BlueprintEdge[] => {
      const l = linkOf(r);
      const from = str120(l.source_content);
      const to = str120(l.target_content);
      // An edge with an empty endpoint cannot be narrated; fetchEdges dropped
      // these too rather than emitting half an edge.
      if (!from || !to) return [];
      // `name`, not `label`: 20260830190000 renamed the column and the RPC's
      // payload key moved with it. This read kept asking for `label` and got
      // undefined — no error, no 400, just every edge arriving without the
      // designer's why-line, on the ONE path (include:edges) that the tool
      // result tells the model to narrate from.
      const note =
        [l.name, r.description]
          .filter((v): v is string => typeof v === "string" && v.length > 0)
          .join(" — ") || undefined;
      return [
        {
          from,
          to,
          direction: hitIds.has(String(l.source_cell_id)) ? "downstream" : "upstream",
          kind: l.kind === "enables" ? "enables" : "leads_to",
          ...(note ? { note } : {}),
        },
      ];
    });
}

/**
 * `include:findings` rows → the field-per-key shape fetchFindings returns.
 *
 * `total` equals `rows.length` by construction: the RPC applies no cap to its
 * findings branch, so this IS the whole matched set. fetchFindings needed
 * count=exact because its page stopped at 20; here there is no page to
 * under-count, and inventing a separate count would re-introduce the
 * counted-the-capped-page bug from the other direction.
 */
export function mapIncludeFindings(data: Array<Record<string, unknown>>): {
  rows: Array<Record<string, unknown>>;
  total: number;
} {
  const rows = data
    .filter((r) => r.kind === INCLUDE_KIND.findings)
    .map((r) => {
      const l = linkOf(r);
      return {
        id: r.id,
        // `check_key`, not `check_name` — renamed by 20260830190000. The tool
        // result says "report them by cell and severity"; without the check
        // identity the model could report that a finding exists and never
        // which check raised it.
        check_key: l.check_key,
        severity: l.severity,
        status: l.status,
        source: l.source,
        cell_ids: l.cell_ids,
        // travels as `snippet` on the wire; lands as `note`, the key
        // fetchFindings' raw rows used
        note: r.snippet,
        updated_at: r.updated_at,
      };
    });
  return { rows, total: rows.length };
}

/** True for rows that describe the result rather than being part of it. */
export function isIncludeRow(r: Record<string, unknown>): boolean {
  return r.kind === INCLUDE_KIND.edges || r.kind === INCLUDE_KIND.findings;
}
