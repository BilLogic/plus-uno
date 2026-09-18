// The tool table, assembled: standing, roster columns, schema and body — one
// typed row per tool, and the only place all four meet.
//
// Three files, the shape Diagnostics already uses:
//   tool-table.ts   the datum — pure, no `Env`, no schema file, so the Node
//                   test suite can read it
//   tool-bodies.ts  the bodies — `Record<ToolName, ToolBody>`, which is what
//                   makes the pairing exhaustive by type
//   tools.ts        this — the join, plus the schemas from the vendored file
//
// Everything that runs a tool now runs it from a row here (#597). The two
// dispatches used to be hand-written string chains beside this table — the
// eleven-arm `if` chain in `agent/run-agent.ts` and the seven-arm `switch` in
// `agent/resolve-proposal.ts`, each ending in an `ok:false` for a name it did
// not recognise. Both are one lookup now, `TOOLS_BY_NAME[name]`, filtered on
// the row's `access`: `ungated` inside the turn, `gated` past the Gate. The
// arm cannot be the missing thing, because a row with no body does not
// compile.
//
// The other thing this table owns is the roster the model is offered, which
// the agent entry builds from `TOOLS` rather than from the raw file: that is
// what makes `withSchemas` throw on a real deployment when a schema and a row
// disagree, rather than in a module nobody loads.
//
// It re-exports nothing: a reader that wants a row's standing, the `ToolName`
// union, `isToolName` or `rowFor` imports `./tool-table`, which is cheaper to
// reach and loadable everywhere — which is how the confidence check, the
// pending notice, the proposal card and the review-request fan-out read their
// rosters off a row (#598). A pass-through bag over two modules everyone can
// already import is what `loop-shared.ts` was (#497).
import toolsJson from "../../tool-definitions.json";
import { TOOL_BODIES, type ToolBody } from "./tool-bodies";
import { withSchemas, TOOL_NAMES, type SchemaRow, type ToolName, type ToolSchema } from "./tool-table";

/** One tool, whole: what it is, the schema it is offered under, and what runs.
 *  A type rather than an interface: `SchemaRow` is a union on `access`, so the
 *  card words come with the gated rows and with nothing else. */
export type ToolEntry = SchemaRow & { readonly run: ToolBody };

const ROWS = withSchemas(toolsJson as ToolSchema[]);

/** Every tool uno-bot offers, by name. */
export const TOOLS_BY_NAME: Record<ToolName, ToolEntry> = Object.fromEntries(
  TOOL_NAMES.map((name) => [name, { ...ROWS[name], run: TOOL_BODIES[name] }]),
) as Record<ToolName, ToolEntry>;

/** The rows, in declaration order. */
export const TOOLS: readonly ToolEntry[] = TOOL_NAMES.map((name) => TOOLS_BY_NAME[name]);
