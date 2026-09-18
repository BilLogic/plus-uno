// Local types for the agentic loop.
//
// The two declarations that used to live here — the `Tool` shape and the
// `ToolName` union — are the tool table's now (`agent/tool-table.ts`), and
// this file aliases them. A union restated beside the table is a union that
// can name a tool the table has no row for, which is the drift the table
// exists to end.
import type { ToolName, ToolSchema } from "./tool-table";

/** The schema shape the model is shown — structurally compatible with
 *  @anthropic-ai/sdk's `Tool` type. */
export type Tool = ToolSchema;

export type { ToolName };

// Tools whose execution opens a PR / fires a GitHub Action. These route
// through the confirmation gate: the Worker posts a proposal and waits for ✅
// before invoking the tool body. Membership is read by `agent/loop.ts`, which
// is what stages them instead of running them; the tool table carries the same
// fact as its `access` column.
export const SIDE_EFFECT_TOOLS: ReadonlySet<ToolName> = new Set<ToolName>([
  "notion_create",
  "notion_update",
  "notion_archive",
  "component_implement",
  "prototype_scaffold",
  "shareout_post",
  "email_send",
]);
