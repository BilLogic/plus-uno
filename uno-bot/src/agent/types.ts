// Local types for the agentic loop. The Tool shape is structurally compatible
// with @anthropic-ai/sdk's Tool type; in Step 4 we swap this for the SDK type.

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
  | "blueprint_search";

// Tools whose execution opens a PR / fires a GitHub Action. These route
// through the confirmation gate (Step 7): the Worker posts a proposal and
// waits for ✅ before actually invoking the tool body.
export const SIDE_EFFECT_TOOLS: ReadonlySet<ToolName> = new Set<ToolName>([
  "implement",
  "implement_design",
  "create_prd",
  "delete_prd",
  "marketplace_add",
  "marketplace_edit",
  "send_email",
]);

export function isSideEffectTool(name: string): name is ToolName {
  return SIDE_EFFECT_TOOLS.has(name as ToolName);
}
