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
// The two dispatches — the read chain in `agent/run-agent.ts` and the switch
// past the Gate in `agent/resolve-proposal.ts` — still run, unchanged. What
// this table already owns is the roster the model is offered, which the agent
// entry now builds from `TOOLS` rather than from the raw file: that is what
// makes `withSchemas` throw on a real deployment when a schema and a row
// disagree, rather than in a module nobody loads.
import toolsJson from "../../tool-definitions.json";
import { TOOL_BODIES, type ToolBody } from "./tool-bodies";
import { withSchemas, TOOL_NAMES, type SchemaRow, type ToolName, type ToolSchema } from "./tool-table";

/** One tool, whole: what it is, the schema it is offered under, and what runs. */
export interface ToolEntry extends SchemaRow {
  readonly run: ToolBody;
}

const ROWS = withSchemas(toolsJson as ToolSchema[]);

/** Every tool uno-bot offers, by name. */
export const TOOLS_BY_NAME: Record<ToolName, ToolEntry> = Object.fromEntries(
  TOOL_NAMES.map((name) => [name, { ...ROWS[name], run: TOOL_BODIES[name] }]),
) as Record<ToolName, ToolEntry>;

/** The rows, in declaration order. */
export const TOOLS: readonly ToolEntry[] = TOOL_NAMES.map((name) => TOOLS_BY_NAME[name]);

export { TOOL_TABLE, TOOL_NAMES, isToolName, withSchemas } from "./tool-table";
export type { SchemaRow, ToolAccess, ToolName, ToolRow, ToolSchema } from "./tool-table";
export type { ToolBody } from "./tool-bodies";
