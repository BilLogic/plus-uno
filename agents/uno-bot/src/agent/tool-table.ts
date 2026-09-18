// The tool table's datum — one row per tool, and the one place a tool's
// standing is written down.
//
// A tool used to be nine separate declarations: a schema in
// `tool-definitions.json`, an arm of the union in `types.ts`, membership of
// `SIDE_EFFECT_TOOLS`, an arm of one of the two dispatches, a noun list in
// `pending-notice.ts`, a case in `preflight.ts`, two label switches in
// `proposal-render.ts`, the retrieval set in `confidence.ts` and the
// review-request set in `slack/api.ts`. Nothing derived from anything, so
// every one of them could be forgotten independently — and several had been.
//
// Three of the nine are gone. The union is an alias of `ToolName` (#596), and
// both dispatches are lookups against this table, keyed on `access` (#597) —
// so a tool with no dispatch arm is no longer a thing that can exist. The
// remaining restatements are the ones the columns below stand beside, held
// equal by `tests/tool-table.test.ts` until their readers move over.
//
// The shape is Diagnostics' (`src/diagnostics/routes.ts`): the DATUM is
// declared apart from the JOIN, as a module that imports nothing — not the
// vendored schema file least of all, because `tsc` does not copy JSON into
// `.test-build/`, which makes `src/agent/tools.ts` the one module in this seam
// a Node test cannot load. The BODIES it can load: `tool-bodies.ts` is in
// `tsconfig.test.json` and naming `Env` as a type costs nothing outside the
// Worker build. So a test reads the two halves directly and `tools.ts` joins
// them, pairing rows with bodies as a `Record`, so a row with no body or a
// body with no row fails the typecheck.
//
// `tool-definitions.json` stays the SCHEMA's source: this table declares what
// a tool is beyond its schema, and `withSchemas` joins the two, refusing a
// schema with no row and a row with no schema.

/**
 * The schema the model is shown, as the vendored file writes it.
 *
 * Structurally compatible with the SDK's own tool type — `types.ts` aliases
 * `Tool` to this rather than restating the four fields.
 */
export interface ToolSchema {
  readonly name: string;
  readonly description: string;
  readonly input_schema: {
    readonly type: "object";
    readonly properties: Record<string, unknown>;
    readonly required?: readonly string[];
    readonly additionalProperties?: boolean;
  };
}

/**
 * How a tool reaches the world.
 *
 * `ungated` runs inline inside the turn — the reads, plus `slack_react`,
 * which writes but is reversible. `gated` is staged as a proposal card and
 * runs only past the Gate. `control` is neither — it resolves a card that is
 * already standing, and the loop intercepts it before any dispatch.
 *
 * It is the DISPATCH distinction, not a read/write one.
 */
export type ToolAccess = "ungated" | "gated" | "control";

/** What a tool is, beyond the schema the model is shown. */
export interface ToolRow {
  readonly access: ToolAccess;
  /**
   * Does it FETCH FROM A SOURCE — so an answer can rest on it?
   *
   * Not the complement of `gated`: `slack_react` posts a reaction and
   * `read_reference` is a property lookup, so neither is something the reply
   * can cite. `agent/confidence.ts` still keeps its own set of these.
   */
  readonly retrieval: boolean;
  /**
   * Does a confirmed run leave a reviewable artifact — a draft PR, a new PRD —
   * worth a heads-up in the design channel? `slack/api.ts` still keeps its own
   * set of these.
   */
  readonly reviewRequest: boolean;
}

export const TOOL_TABLE = {
  roadmap_query: { access: "ungated", retrieval: true, reviewRequest: false },
  notion_search: { access: "ungated", retrieval: true, reviewRequest: false },
  source_read: { access: "ungated", retrieval: true, reviewRequest: false },
  search_blueprint: { access: "ungated", retrieval: true, reviewRequest: false },
  github_read: { access: "ungated", retrieval: true, reviewRequest: false },
  slack_user_profile: { access: "ungated", retrieval: true, reviewRequest: false },
  slack_channel_members: { access: "ungated", retrieval: true, reviewRequest: false },
  slack_thread_read: { access: "ungated", retrieval: true, reviewRequest: false },
  slack_react: { access: "ungated", retrieval: false, reviewRequest: false },
  slack_search: { access: "ungated", retrieval: true, reviewRequest: false },
  read_reference: { access: "ungated", retrieval: false, reviewRequest: false },
  notion_create: { access: "gated", retrieval: false, reviewRequest: true },
  notion_update: { access: "gated", retrieval: false, reviewRequest: false },
  notion_archive: { access: "gated", retrieval: false, reviewRequest: false },
  component_implement: { access: "gated", retrieval: false, reviewRequest: true },
  prototype_scaffold: { access: "gated", retrieval: false, reviewRequest: true },
  shareout_post: { access: "gated", retrieval: false, reviewRequest: false },
  email_send: { access: "gated", retrieval: false, reviewRequest: false },
  proposal_resolve: { access: "control", retrieval: false, reviewRequest: false },
} as const satisfies Record<string, ToolRow>;

/** Every tool uno-bot offers, by name. */
export type ToolName = keyof typeof TOOL_TABLE;

/** The registered names, in declaration order. */
export const TOOL_NAMES = Object.keys(TOOL_TABLE) as ToolName[];

/** True when `name` is a registered tool. */
export function isToolName(name: string): name is ToolName {
  return Object.hasOwn(TOOL_TABLE, name);
}

/** One row with the schema it is offered under. */
export interface SchemaRow extends ToolRow {
  readonly name: ToolName;
  readonly schema: ToolSchema;
}

/**
 * Join the rows to the schemas, refusing either one without the other.
 *
 * A schema with no row would be offered to the model and come back refused by
 * the dispatch it has no row for; a row with no schema is a column three
 * readers consult about a tool nobody can call. Both are silent, so both
 * throw here — when the table is built, which `src/agent/tools.ts` does at its
 * module load, naming the tool rather than a count.
 *
 * @param schemas - The vendored tool schemas, in file order
 */
export function withSchemas(schemas: readonly ToolSchema[]): Record<ToolName, SchemaRow> {
  const byName = new Map(schemas.map((schema) => [schema.name, schema]));
  const strangers = [...byName.keys()].filter((name) => !isToolName(name)).sort();
  if (strangers.length) {
    throw new Error(`tool schemas with no row in the tool table: ${strangers.join(", ")}`);
  }
  const rows = {} as Record<ToolName, SchemaRow>;
  const schemaless: string[] = [];
  for (const name of TOOL_NAMES) {
    const schema = byName.get(name);
    if (!schema) {
      schemaless.push(name);
      continue;
    }
    rows[name] = { name, ...TOOL_TABLE[name], schema };
  }
  if (schemaless.length) {
    throw new Error(`tool table rows with no schema: ${schemaless.sort().join(", ")}`);
  }
  return rows;
}
