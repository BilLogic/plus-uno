// The column and table names the bot sends to PostgREST DIRECTLY — the reads
// that do not go through `search_blueprint`.
//
// WHY THIS IS ITS OWN MODULE: the RPC's parameter and output names are pinned
// by the vendored BLUEPRINT_CONTRACT, and `check:contract` fails the build when
// the app renames one. The direct table reads had no such pin. Between
// 2026-08-20 and 2026-08-30 the app renamed `description` to `summary`,
// `order_position` to `position`, `cell_dependencies.label` to `name` and
// `findings` to `audit_findings`, and dropped `cell_dependencies.note` and
// `cells.links`. Six reads went on naming the old ones. PostgREST answers a
// renamed column with 400 and a renamed table with 404; every one of those
// call sites logs a warning and returns an empty array, so from Slack the
// failure was indistinguishable from "the blueprint has nothing on that".
//
// Living in a module with no `Env` and no Workers globals is what lets
// tsconfig.test.json compile it, which is what lets the names be asserted
// rather than merely written down.
import { BLUEPRINT_CONTRACT } from "../generated/blueprint-contract";

/**
 * The prose column on every structural table. `description` until
 * 20260820090000 (cells) and earlier for the rest.
 *
 * The bot still EMITS `description`: that is the name `search_blueprint` puts
 * on the wire (`BLUEPRINT_CONTRACT.searchBlueprintColumns.description`), and
 * the RPC's projection is its own decision. Read name and wire name are
 * separate on purpose — conflating them is what makes a rename look optional.
 */
export const PROSE_COLUMN = "summary";

/** Position column. `order_position` until 20260820130000 gave every position
 *  column one name. Ordering by a column that does not exist is a 400, not a
 *  silent fallback to insertion order. */
export const POSITION_COLUMN = "position";

/**
 * The findings table. `findings` until 20260830190000.
 *
 * Pinned against `BLUEPRINT_CONTRACT.botReadTables` by the unit test: the
 * vendored contract already moves when the app renames a table, so tying the
 * literal to it turns the next rename into a red test instead of a 404 that
 * reads as "nothing is flagged here".
 */
export const FINDINGS_TABLE = "audit_findings";

/** Edge select columns. `label` became `name` and `note` was dropped by
 *  20260830190000. The FK embed hints are appended at the call site from
 *  `BLUEPRINT_CONTRACT.fkConstraints` — those were already pinned; these were
 *  the half of the same select that nothing watched. */
export const EDGE_SELECT_COLUMNS = "source_cell_id,target_cell_id,kind,name";

/**
 * The cells select used by the keyword fallback, and by /health/blueprint's
 * `select_cells_spec` probe — the same string, imported, not copied. The probe
 * existed to catch exactly these renames and did not, because it was a copy
 * that rotted on its own schedule.
 *
 * `resources(...)` replaces `cells.links`, which 20260830280000 dropped when it
 * split that one jsonb column into resources, cell_touchpoints and evidence.
 * Without the embed a links-only cell is invisible to the fallback.
 */
export const CELL_FALLBACK_SELECT =
  `id,content,${PROSE_COLUMN},function,form,value_props,owner,perceived_owner,updated_at,` +
  "resources(name,url,kind)," +
  "lane:lanes(name,owner_team,kpis),step:steps(name)," +
  "path:paths(name,scenario:scenarios(name,phase:phases(name)))";

/**
 * The touchpoint registry (#414): the deployment-level catalog of the tools,
 * documents, channels and artifacts the service runs through — an app screen,
 * an email, a Zoom room. Anon-readable since 20260830140000, in the contract's
 * `publicReadTables` since plus-uno-blueprint#370, and read by the bot from
 * here on. NOT yet in `botReadTables`: that list drives the `table_*` probe
 * keys, and the blueprint's own CI checks those keys against the DEPLOYED
 * Worker, so the table joins the list after this read ships — which is why
 * /health/blueprint carries its probe line by hand until then (index.ts).
 */
export const TOUCHPOINTS_TABLE = "touchpoints";

/** The columns the touchpoint read USES by key — the link and the notes read
 *  `id`, `name`, `kind`, `summary` and `url` off each row. Kept apart from the
 *  contract's list on purpose: the contract says what the app promises is
 *  there; this says what the code will go looking for. When the two disagree,
 *  `touchpointSelectFrom` throws at module load — the Worker fails to start
 *  rather than issuing a select PostgREST answers with 400 and the call site
 *  reports as "no touchpoint matched". */
export const TOUCHPOINT_READ_KEYS: readonly string[] = ["id", "name", "kind", "summary", "url"];

/**
 * The touchpoint select, BUILT FROM the contract's column list rather than
 * restated beside it. The three selects above were copies; each rotted on
 * its own schedule, and the probe that was meant to catch them was a fourth
 * copy that rotted in step. A select derived from the vendored contract moves
 * the day `sync-blueprint-contract.mjs` moves it, and the throw below is what
 * makes a column the contract stops promising a loud failure instead of a
 * quiet empty result.
 */
export function touchpointSelectFrom(columns: readonly string[]): string {
  for (const key of TOUCHPOINT_READ_KEYS) {
    if (!columns.includes(key)) {
      throw new Error(
        `touchpoints select reads \`${key}\`, which the contract's botDirectReadColumns.touchpoints does not declare`,
      );
    }
  }
  return columns.join(",");
}

export const TOUCHPOINT_SELECT = touchpointSelectFrom(BLUEPRINT_CONTRACT.botDirectReadColumns.touchpoints);

/** The registry filter for a worded query: any word, in the name, the kind
 *  or the summary. Case-insensitive substring on all three — `kind` is a free
 *  text column ("email", "screen", "zoom room"), so an exact match on a
 *  plural or a compound would miss the row it was asked for. Words are the
 *  caller's `terms()` output: lower-case, alphanumeric, so nothing here needs
 *  escaping against PostgREST's `or=(...)` syntax. */
export function touchpointFilter(words: readonly string[]): string {
  return `or=(${words
    .flatMap((w) => [`name.ilike.*${w}*`, `kind.ilike.*${w}*`, `summary.ilike.*${w}*`])
    .join(",")})`;
}

/** Every direct-read string in one place, for the test that sweeps them for
 *  names the schema no longer has. */
export const DIRECT_READ_STRINGS: readonly string[] = [
  CELL_FALLBACK_SELECT,
  EDGE_SELECT_COLUMNS,
  FINDINGS_TABLE,
  `id,name,${PROSE_COLUMN}`,
  `order=${POSITION_COLUMN}`,
  TOUCHPOINTS_TABLE,
  TOUCHPOINT_SELECT,
  touchpointFilter(["zoom"]),
];

/** Names the blueprint schema no longer has. A direct read naming one of these
 *  is a 400 or a 404 that every call site reports as an empty result, so this
 *  list is a ratchet: it only ever grows, and an entry that stops being dead is
 *  itself the finding. */
export const RETIRED_NAMES: readonly string[] = [
  "description",
  "links",
  "label",
  "order_position",
  "path_type",
  "slice_type",
  "view_type",
  "check_name",
  "slice_items",
];

/**
 * Retired names that are STILL correct on the wire, so a doc may name them.
 *
 * `search_blueprint` projects `description` and `links` as output columns —
 * the first over `cells.summary`, the second over the `resources` table. A
 * projection alias and a table column are different promises, and the prose
 * sweep has to know that or it condemns the tool description for being right.
 */
export const WIRE_NAMES: readonly string[] = ["description", "links"];

/**
 * Names no longer correct ANYWHERE — not as a column, not on the wire. This is
 * what the harness prose is swept for: every one of them, on 2026-09-01, was
 * still being used to tell the bot what to read.
 */
export const RETIRED_IN_PROSE: readonly string[] = [
  ...RETIRED_NAMES.filter((n) => !WIRE_NAMES.includes(n)),
  "picture",
  "column_position",
  "layers",
  "layer_id",
];

/**
 * Conventions the blueprint removed, which prose can name without a backtick.
 *
 * These are the expensive ones. A retired COLUMN name produces a 400 and an
 * empty result; a retired CONVENTION produces an instruction to go looking for
 * a marker that cannot exist, and then a rule forbidding the conclusion that it
 * is not there. That is how the tool description came to say "NEVER assert the
 * blueprint has no future state until you have searched for a `Planned:` path"
 * eleven days after the last `Planned:` path was renamed away.
 */
export const RETIRED_CONVENTIONS: ReadonlyArray<{ phrase: string; instead: string }> = [
  { phrase: "Future (roadmap)", instead: "status <> 'live' on paths and cells" },
  { phrase: "`Planned:`", instead: "status = 'planned'" },
  { phrase: "`Prototype:`", instead: "status = 'proposed'" },
  { phrase: "[Planned]", instead: "the index's status markers" },
  { phrase: "[Prototype]", instead: "the index's status markers" },
];

/** True when `s` names a retired column or table as a whole word. Substring
 *  matching would fire on `descriptions` and on `path_type` inside
 *  `filter_path_type`, so the boundary is explicit. */
export function namesRetiredColumn(s: string): string | undefined {
  return RETIRED_NAMES.find((n) => new RegExp(`(^|[^a-z_])${n}([^a-z_]|$)`, "i").test(s));
}

/** The findings table the bot reads must be one the contract says it reads. */
export function findingsTableIsInContract(): boolean {
  return (BLUEPRINT_CONTRACT.botReadTables as readonly string[]).includes(FINDINGS_TABLE);
}

/** The touchpoint registry must be one the contract says is anon-readable.
 *  `publicReadTables`, not `botReadTables` — see TOUCHPOINTS_TABLE for why the
 *  second list lags this read by one deploy. */
export function touchpointsTableIsPublic(): boolean {
  return (BLUEPRINT_CONTRACT.publicReadTables as readonly string[]).includes(TOUCHPOINTS_TABLE);
}
