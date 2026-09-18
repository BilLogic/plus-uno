// The tool table's datum — one row per tool, and the one place a tool's
// standing is written down.
//
// A tool used to be nine separate declarations: a schema in
// `tool-definitions.json`, an arm of the union in `agent/types.ts`, membership
// of `SIDE_EFFECT_TOOLS`, an arm of one of the two dispatches, a noun list in
// `pending-notice.ts`, a case in `preflight.ts`, two label switches in
// `proposal-render.ts`, the retrieval set in `confidence.ts` and the
// review-request set in `slack/api.ts`. Nothing derived from anything, so
// every one of them could be forgotten independently — and several had been.
//
// Eight of the nine are this table now. The union is an alias of `ToolName`
// (#596) and `agent/types.ts` is gone with the last of it; both dispatches are
// lookups keyed on `access` (#597), so a tool with no dispatch arm cannot
// exist; and the columns below answer the other five readers (#598) — none of
// them keeps a list of tool names any more, so the tests that held their lists
// equal to these columns are gone with the lists.
//
// The ninth is `preflight.ts`, and it stays: its arms are per-tool SUBSTANCE
// checks (does this component exist, does this PRD url resolve), not a
// restatement of who is gated. A tool with no arm there is a tool with nothing
// to check, which is the right default and needs no row to say so.
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
// Importing nothing is also what lets the five readers reach it: `confidence.ts`
// and `pending-notice.ts` are pure judgement modules a plain Node test drives
// directly, and `proposal-render.ts` renders card text without `Env`. A column
// on a table that dragged the Workers type graph behind it would have been a
// column they could not have read.
//
// `tool-definitions.json` stays the SCHEMA's source: this table declares what
// a tool is beyond its schema, and `withSchemas` joins the two, refusing a
// schema with no row and a row with no schema.

/**
 * The schema the model is shown, as the vendored file writes it.
 *
 * Structurally compatible with the SDK's own tool type, which is why nothing
 * restates the four fields.
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

/**
 * How a staged tool is SPOKEN ABOUT — the words the proposal card and the
 * pending notice use for it, which only a gated tool is ever given.
 *
 * Words rather than prose: the card renders `verb` and the batch result line
 * renders `kind`, and both used to be a switch arm in `proposal-render.ts`
 * whose default printed the raw tool name at a designer.
 */
export interface GateWords {
  /** The card's lead — "About to *{verb}*". */
  readonly verb: string;
  /** What one operation of this kind is called on a result line. */
  readonly kind: string;
  /**
   * The nouns a reply refers the staged card by ("the card", "the email").
   * `pending-notice.ts` reads them to decide whether a text turn addressed the
   * proposal still sitting there, so a gated tool with none would count every
   * on-topic reply as a bounce.
   */
  readonly nouns: readonly string[];
}

/**
 * What a tool is, beyond the schema the model is shown.
 *
 * A union on `access`, not a flat record with an optional field: the card
 * words belong to a gated tool and to nothing else, so a gated row without
 * them — and an ungated row with them — fails the typecheck where the row is
 * written. That is what makes adding a row the only edit a new tool needs.
 */
export type ToolRow = {
  /**
   * Does it FETCH FROM A SOURCE — so an answer can rest on it?
   *
   * Not the complement of `gated`: `slack_react` posts a reaction and
   * `read_reference` is a property lookup, so neither is something the reply
   * can cite. Read by `agent/confidence.ts`.
   */
  readonly retrieval: boolean;
  /**
   * The reviewable artifact a confirmed run leaves — a draft PR, a new PRD —
   * named as the heads-up in the design channel names it, or null when a run
   * leaves nothing worth one. Read by `slack/api.ts`.
   */
  readonly reviewRequest: string | null;
} & (
  | { readonly access: "ungated" | "control"; readonly gate?: undefined }
  | { readonly access: "gated"; readonly gate: GateWords }
);

export const TOOL_TABLE = {
  roadmap_query: { access: "ungated", retrieval: true, reviewRequest: null },
  notion_search: { access: "ungated", retrieval: true, reviewRequest: null },
  source_read: { access: "ungated", retrieval: true, reviewRequest: null },
  search_blueprint: { access: "ungated", retrieval: true, reviewRequest: null },
  github_read: { access: "ungated", retrieval: true, reviewRequest: null },
  slack_user_profile: { access: "ungated", retrieval: true, reviewRequest: null },
  slack_channel_members: { access: "ungated", retrieval: true, reviewRequest: null },
  slack_thread_read: { access: "ungated", retrieval: true, reviewRequest: null },
  slack_react: { access: "ungated", retrieval: false, reviewRequest: null },
  slack_search: { access: "ungated", retrieval: true, reviewRequest: null },
  read_reference: { access: "ungated", retrieval: false, reviewRequest: null },
  notion_create: {
    access: "gated",
    retrieval: false,
    reviewRequest: "new PRD / intake / decision",
    gate: {
      verb: "create this card in Notion",
      kind: "create row",
      nouns: ["card", "prd", "intake", "ticket", "notion", "decision"],
    },
  },
  notion_update: {
    access: "gated",
    retrieval: false,
    reviewRequest: null,
    gate: {
      verb: "update this Notion page",
      // `notion_update` is the one card that names its own operations — a
      // `current → new` diff per field — so "update" is the label for a page
      // whose input named no recognisable change.
      kind: "update",
      nouns: ["card", "update", "notion", "property"],
    },
  },
  notion_archive: {
    access: "gated",
    retrieval: false,
    reviewRequest: null,
    gate: {
      verb: "archive this Notion card",
      kind: "archive",
      nouns: ["archive", "card", "notion"],
    },
  },
  component_implement: {
    access: "gated",
    retrieval: false,
    reviewRequest: "component implementation PR",
    gate: {
      verb: "implement this component",
      kind: "dispatch an implementation",
      nouns: ["component", "implement", "build", "pr"],
    },
  },
  prototype_scaffold: {
    access: "gated",
    retrieval: false,
    reviewRequest: "new prototype scaffold PR",
    gate: {
      verb: "scaffold a new prototype from this Figma design",
      kind: "scaffold a prototype",
      nouns: ["prototype", "scaffold", "build", "pr"],
    },
  },
  shareout_post: {
    access: "gated",
    retrieval: false,
    reviewRequest: null,
    gate: {
      verb: "share this for feedback in #plus-design-feedback",
      kind: "post a share-out",
      nouns: ["share", "share-out", "shareout", "feedback", "post"],
    },
  },
  email_send: {
    access: "gated",
    retrieval: false,
    reviewRequest: null,
    gate: {
      verb: "send an email via Gmail",
      kind: "send an email",
      nouns: ["email", "mail", "send"],
    },
  },
  proposal_resolve: { access: "control", retrieval: false, reviewRequest: null },
} as const satisfies Record<string, ToolRow>;

/** Every tool uno-bot offers, by name. */
export type ToolName = keyof typeof TOOL_TABLE;

/** The registered names, in declaration order. */
export const TOOL_NAMES = Object.keys(TOOL_TABLE) as ToolName[];

/** True when `name` is a registered tool. */
export function isToolName(name: string): name is ToolName {
  return Object.hasOwn(TOOL_TABLE, name);
}

/**
 * The row for `name`, or null when `name` names no tool.
 *
 * The readers' one door onto the table: `agent/loop.ts` asks for `access`,
 * `agent/confidence.ts` for `retrieval`, `slack/api.ts` for `reviewRequest`.
 * They take a `string` — a tool name arrives from the model — so the lookup is
 * the membership guard as well, and a name nobody registered answers null
 * rather than reading as a row of falses.
 */
export function rowFor(name: string): ToolRow | null {
  return isToolName(name) ? TOOL_TABLE[name] : null;
}

/**
 * The card-and-notice words for a gated tool, or null for anything else.
 *
 * Two readers narrow the same way (`slack/proposal-render.ts`,
 * `agent/pending-notice.ts`), so the narrowing lives here rather than twice.
 */
export function gateWordsFor(name: string): GateWords | null {
  const row = rowFor(name);
  return row?.access === "gated" ? row.gate : null;
}

/** One row with the schema it is offered under. */
export type SchemaRow = ToolRow & {
  readonly name: ToolName;
  readonly schema: ToolSchema;
};

/**
 * Join the rows to the schemas, refusing either one without the other.
 *
 * A schema with no row would be offered to the model and come back refused by
 * the dispatch it has no row for; a row with no schema is a column five
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
