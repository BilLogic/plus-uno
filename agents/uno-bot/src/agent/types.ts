// Local types for the agentic loop. The Tool shape is structurally compatible
// with @anthropic-ai/sdk's Tool type (run-agent.ts casts `TOOLS as Anthropic.Tool[]`).

export interface Tool {
  name: string;
  description: string;
  input_schema: {
    type: "object";
    properties: Record<string, unknown>;
    required?: string[];
    additionalProperties?: boolean;
  };
}

export type ToolName =
  | "implement"
  | "implement_design"
  | "create_prd"
  | "delete_prd"
  | "find_experts"
  | "marketplace_search"
  | "marketplace_add"
  | "marketplace_edit"
  | "send_email"
  | "blueprint_search"
  | "read_source"
  | "share_for_feedback";

// Tools whose execution opens a PR / fires a GitHub Action. These route
// through the confirmation gate: the Worker posts a proposal and waits for ✅
// before invoking the tool body. Membership is checked directly via
// SIDE_EFFECT_TOOLS.has(...) in run-agent.ts.
export const SIDE_EFFECT_TOOLS: ReadonlySet<ToolName> = new Set<ToolName>([
  "implement",
  "implement_design",
  "create_prd",
  "delete_prd",
  "marketplace_add",
  "marketplace_edit",
  "send_email",
  "share_for_feedback",
]);
